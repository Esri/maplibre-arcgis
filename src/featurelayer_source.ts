import { type MapLibreEvent, type GeoJSONSource, type Map as MaplibreMap } from 'maplibre-gl';
import { type IQueryOptions, esriGeometryInfo } from './FeatureLayer';
import { getLayer, type IQueryFeaturesOptions, queryFeatures, type ILayerDefinition } from '@esri/arcgis-rest-feature-service';
import { getBlankFc, type RestJSAuthenticationManager, wrapAccessToken } from './Util';
import { bboxToTile, getChildren, tileToQuadkey, tileToBBOX, type Tile } from '@mapbox/tilebelt';

const enum EsriMessageType {
  loadEsriData = 'LED',
}

type FeatureLayerSourceOptions = {
  map: MaplibreMap;
  token?: string;
  queryOptions: IQueryOptions;
  geojsonOptions: unknown;
  url: string;
};

type FeatureIdIndexMap = Map<string | number, boolean>;
type TileIndexMap = Map<string, boolean>;

export class FeatureLayerSourceManager {
  type: 'featurelayer';

  map: MaplibreMap;
  sourceId: string;
  url: string;
  token?: string;
  geojsonOptions: unknown;
  protected _authentication?: RestJSAuthenticationManager;
  queryOptions: IQueryOptions & { simplifyFactor: number; geometryPrecision: number };
  layerDefinition: ILayerDefinition;
  maplibreSource: GeoJSONSource;

  _tileIndices: Map<number, TileIndexMap>;
  _featureIndices: Map<number, FeatureIdIndexMap>;
  _featureCollections: Map<number, GeoJSON.FeatureCollection>;
  _boundEvent: (ev?: MapLibreEvent) => void;

  constructor(id: string, options: FeatureLayerSourceOptions) {
    // super(id, options, dispatcher, eventParent);

    this.type = 'featurelayer';

    this.sourceId = id;

    const { queryOptions, geojsonOptions, url, token, ...rest } = options;

    if (url) this.url = url;
    else throw new Error('Feature layer source requires a URL.');

    this.queryOptions = {
      ...queryOptions,
      simplifyFactor: 0.3,
      geometryPrecision: 8,
    };
    if (geojsonOptions) this.geojsonOptions = geojsonOptions;
    if (token) this.token = token;
    // TODO fallback projection endpoint;
    // TODO service metadata

    // this.actor.registerMessageHandler(EsriMessageType.loadEsriData, (mapId: string, params) => {
    //   return;
    // });
    this._tileIndices = new Map();
    this._featureIndices = new Map();
    this._featureCollections = new Map();

    console.log('CREATED NEW FEATURE LAYER SOURCE MANAGER', this);
  }

  onAdd(map: MaplibreMap) {
    this.map = map;
    void this.load();
    // TODO register map event handler here...
  }

  async load() {
    if (this.token) this._authentication = await wrapAccessToken(this.token);
    this.enableRequests();
    this._clearAndRefreshTiles();
  }

  enableRequests() {
    this._boundEvent = this._loadData.bind(this) as () => void;
    this.map.on('moveend', this._boundEvent);
  }

  _createOrGetTileIndex(zoomLevel: number): TileIndexMap {
    const existingZoomIndex = this._tileIndices.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;

    const newTileIndex = new Map() as TileIndexMap;
    this._tileIndices.set(zoomLevel, newTileIndex);
    return newTileIndex;
  }

  _createOrGetFeatureIdIndex(zoomLevel: number): FeatureIdIndexMap {
    const existingFeatureIdIndex = this._featureIndices.get(zoomLevel);
    if (existingFeatureIdIndex) return existingFeatureIdIndex;

    const newFeatureIdIndex = new Map() as FeatureIdIndexMap;
    this._featureIndices.set(zoomLevel, newFeatureIdIndex);
    return newFeatureIdIndex;
  }

  _createOrGetFeatureCollection(zoomLevel: number): GeoJSON.FeatureCollection {
    const existingZoomIndex = this._featureCollections.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;

    const fc = getBlankFc();
    this._featureCollections.set(zoomLevel, fc);
    return fc;
  }

  _doesTileOverlapBounds(tile: Tile, bounds: [number, number][]) {
    const tileBounds = tileToBBOX(tile);
    if (tileBounds[2] < bounds[0][0]) return false;
    if (tileBounds[0] > bounds[1][0]) return false;
    if (tileBounds[3] < bounds[0][1]) return false;
    if (tileBounds[1] > bounds[1][1]) return false;
    return true;
  }

  async _loadData() {
    console.log('Find and map data called');
    const zoom = this.map.getZoom();
    // TODO Esri service options min zoom 160

    const bounds = this.map.getBounds().toArray();
    const primaryTile = bboxToTile([bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]]);

    // TODO esri use service bounds 166
    const zoomLevel = 2 * Math.floor(zoom / 2);
    const zoomLevelIndex = this._createOrGetTileIndex(zoomLevel);
    const featureIdIndex = this._createOrGetFeatureIdIndex(zoomLevel);
    const featureCollection = this._createOrGetFeatureCollection(zoomLevel);
    console.log('zoom level', zoomLevel, 'internal state', { zoomLevelIndex, featureIdIndex, featureCollection });
    // TODO feature collections at various zoom levels

    // Find tiles to request
    const tilesToRequest: Tile[] = [];
    if (primaryTile[2] < zoomLevel) {
      let candidateTiles = getChildren(primaryTile);
      let minZoomOfCandidates = candidateTiles[0][2];
      while (minZoomOfCandidates < zoomLevel) {
        const newCandidateTiles: Tile[] = [];
        candidateTiles.forEach(t => newCandidateTiles.push(...getChildren(t)));
        candidateTiles = newCandidateTiles;
        minZoomOfCandidates = candidateTiles[0][2];
      }
      for (let i = 0; i < candidateTiles.length; i++) {
        if (this._doesTileOverlapBounds(candidateTiles[i], bounds)) tilesToRequest.push(candidateTiles[i]);
      }
    }
    else tilesToRequest.push(primaryTile);

    for (let i = 0; i < tilesToRequest.length; i++) {
      const quadKey = tileToQuadkey(tilesToRequest[i]);
      if (zoomLevelIndex.has(quadKey)) {
        tilesToRequest.splice(i, 1);
        i--;
      }
      else zoomLevelIndex.set(quadKey, true);
    }

    if (tilesToRequest.length === 0) {
      this._updateSourceData(featureCollection);
      return;
    }
    console.log('tiles to request:', tilesToRequest);
    const mapWidth = Math.abs(bounds[1][0] - bounds[0][0]);
    const tolerance = (mapWidth / this.map.getCanvas().width) * this.queryOptions.simplifyFactor;
    await this._loadTiles(tilesToRequest, tolerance, featureIdIndex, featureCollection);
    this._updateSourceData(featureCollection);
  }

  async _loadTiles(tilesToRequest: Tile[], tolerance: number, featureIdIndex: FeatureIdIndexMap, fc: GeoJSON.FeatureCollection) {
    return new Promise((resolve) => {
      const tileRequests = tilesToRequest.map(tile => this._getTile(tile, tolerance));
      void Promise.all(tileRequests).then((featureCollections) => {
        featureCollections.forEach((tileFc) => {
          if (tileFc) this._iterateItems(tileFc, featureIdIndex, fc);
        });
        resolve(fc);
      });
    });
  }

  _iterateItems(tileFc: GeoJSON.FeatureCollection, featureIdIndex: Map<string | number, boolean>, fc: GeoJSON.FeatureCollection) {
    tileFc.features.forEach((feature) => {
      if (!featureIdIndex.has(feature.id)) {
        fc.features.push(feature);
        featureIdIndex.set(feature.id, true);
      }
    });
  }

  async _getTile(tile: Tile, tolerance: number): Promise<GeoJSON.FeatureCollection> {
    const tileBounds = tileToBBOX(tile);
    const extent = {
      spatialReference: {
        latestWkid: 4326,
        wkid: 4326,
      },
      xmin: tileBounds[0],
      ymin: tileBounds[1],
      xmax: tileBounds[2],
      ymax: tileBounds[3],
    };

    const queryParams: IQueryFeaturesOptions = {
      url: this.url,
      where: '1=1', // TODO
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      geometry: extent, // TODO intersect with input extent
      inSR: '4326',
      outSR: '4326',
      returnZ: false,
      returnM: false,
      geometryPrecision: this.queryOptions.geometryPrecision,
      quantizationParameters: {
        extent,
        tolerance,
        mode: 'view',
      },
      resultType: 'tile',
      f: 'geojson',
      ...(this._authentication && { authentication: this._authentication }),
    };

    return await queryFeatures(queryParams) as GeoJSON.FeatureCollection;
  }

  _updateSourceData(fc: GeoJSON.FeatureCollection) {
    const source: GeoJSONSource = this.map.getSource(this.sourceId);
    if (source) source.updateData({
      add: fc.features,
    });
  }

  _clearAndRefreshTiles(): void {
    this._tileIndices = new Map();
    this._featureIndices = new Map();
    this._featureCollections = new Map();
    void this._loadData();
  }

  async _getLayerDefinition(): Promise<ILayerDefinition> {
    if (this.layerDefinition !== null) return Promise.resolve(this.layerDefinition);

    const layerDefinition = await getLayer({
      url: this.url,
      httpMethod: 'GET',
      ...(this._authentication && { authentication: this._authentication }),
    });
    this.layerDefinition = layerDefinition;
    return layerDefinition;
  }
};
