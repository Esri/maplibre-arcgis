import { type MapLibreEvent, type GeoJSONSource, type Map as MaplibreMap } from 'maplibre-gl';
import { type GeometryLimits, type IQueryOptions, esriGeometryInfo } from './FeatureLayer';
import { getLayer, type IQueryFeaturesOptions, queryFeatures, type ILayerDefinition, type IQueryAllFeaturesOptions, queryAllFeatures, type IQueryFeaturesResponse } from '@esri/arcgis-rest-feature-service';
import { getBlankFc, type RestJSAuthenticationManager, warn, wrapAccessToken } from './Util';
import { bboxToTile, getChildren, tileToQuadkey, tileToBBOX, type Tile } from '@mapbox/tilebelt';

const enum EsriMessageType {
  loadEsriData = 'LED',
};

type FeatureLayerSourceManagerOptions = {
  url: string;
  queryOptions: IQueryOptions;
  geojsonOptions: unknown;
  map: MaplibreMap;
  layerDefinition?: ILayerDefinition;
  token?: string;
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
  queryOptions: IQueryOptions;
  layerDefinition: ILayerDefinition;
  maplibreSource: GeoJSONSource;

  private _authentication?: RestJSAuthenticationManager;

  private _onDemandOptions: { simplifyFactor: number; geometryPrecision: number };
  private _tileIndices: Map<number, TileIndexMap>;
  private _featureIndices: Map<number, FeatureIdIndexMap>;
  private _featureCollections: Map<number, GeoJSON.FeatureCollection>;
  private _boundEvent: (ev?: MapLibreEvent) => void;

  constructor(id: string, options: FeatureLayerSourceManagerOptions) {
    // super(id, options, dispatcher, eventParent);

    this.type = 'featurelayer';

    this.sourceId = id;

    const { queryOptions, geojsonOptions, url, token, layerDefinition, ...rest } = options;

    if (url) this.url = url;
    else throw new Error('Feature layer source requires a URL.');

    this.queryOptions = {
      ...queryOptions,
    };
    if (geojsonOptions) this.geojsonOptions = geojsonOptions;
    if (token) this.token = token;
    if (layerDefinition) this.layerDefinition = layerDefinition;
    // TODO fallback projection endpoint;
    // TODO service metadata

    // this.actor.registerMessageHandler(EsriMessageType.loadEsriData, (mapId: string, params) => {
    //   return;
    // });

    this._onDemandOptions = {
      simplifyFactor: 0.3,
      geometryPrecision: 6, // https://en.wikipedia.org/wiki/Decimal_degrees#Precision
    };

    this._tileIndices = new Map();
    this._featureIndices = new Map();
    this._featureCollections = new Map();
  }

  onAdd(map: MaplibreMap) {
    this.map = map;
    void this.load();
  }

  async load() {
    if (this.token) this._authentication = await wrapAccessToken(this.token);

    await this._getLayerDefinition();
    try {
      // Try snapshot mode first
      const queryLimit: GeometryLimits = esriGeometryInfo[this.layerDefinition.geometryType].limit;
      const featureCollection = await this._loadFeatureSnapshot(queryLimit);
      console.log('SNAPSHOT MODE SUCCEEDED:', featureCollection);
      this._updateSourceData(featureCollection);
    }
    catch (e) {
      // Use on-demand loading as fallback
      console.log('USING ON-DEMAND LOADING');
      this.enableRequests();
      this._clearAndRefreshTiles();
    }
  }

  /**
   * Loads all features in the service layer, as long as there are less than a hardcoded geometry limit
   * @param geometryLimit - The geometry limit for this specific layer type, determined via the layer definition
   * @returns - GeoJSON feature collection containing all features in a layer
   */
  private async _loadFeatureSnapshot(geometryLimit: GeometryLimits): Promise<GeoJSON.FeatureCollection> {
    // fetch data
    let layerData: GeoJSON.FeatureCollection;

    const { ignoreLimits, ...queryParams } = this.queryOptions;
    const ignoreFeatureLimit = ignoreLimits ? ignoreLimits : false;

    const requestParams: IQueryAllFeaturesOptions = {
      url: this.url,
      authentication: this._authentication,
      ...queryParams,
    };

    if (ignoreFeatureLimit || !(await this._checkIfExceedsLimit(requestParams, geometryLimit))) {
      if (ignoreFeatureLimit) warn(`Feature count limits are being ignored from ${this.url}. This is recommended only for low volume layers and applications and will cause poor server performance and crashes.`);
      // Get all features
      const response = await queryAllFeatures({
        ...requestParams,
        f: 'geojson',
      });

      layerData = response as unknown as GeoJSON.FeatureCollection;
    }
    else {
      throw new Error(`Snapshot mode geometry limit exceeded.`);
    }
    if (!layerData) throw new Error('Unable to load data.');

    return layerData;
  }

  /**
   * Check if a feature service request will exceed a hardcoded geometry limit
   * @param params - Parameters of the desired request.
   * @param geometryLimit - The geometry limit for the specific type of feature (point, line, or polygon)
   * @returns True if the layer exceeds the limit, and false otherwise.
   */
  private async _checkIfExceedsLimit(params: IQueryAllFeaturesOptions, geometryLimit: GeometryLimits): Promise<boolean> {
    // fetch data
    const exceedsLimitParams: IQueryAllFeaturesOptions = {
      ...params,
      outStatistics: [
        {
          onStatisticField: null, // This is required by REST JS but not used
          statisticType: 'exceedslimit',
          outStatisticFieldName: 'exceedslimit',
          ...geometryLimit,
        },
      ],
      returnGeometry: false,
      params: {
        cacheHint: true,
      },
    };
    // Check if the desired query exceeds a hardcoded feature limit
    const exceedsLimitResponse = await (queryFeatures(exceedsLimitParams)) as IQueryFeaturesResponse;
    return exceedsLimitResponse.features[0].attributes.exceedslimit === 1;
  }

  enableRequests() {
    this._boundEvent = this._loadFeaturesOnDemand.bind(this) as () => void;
    this.map.on('moveend', this._boundEvent);
  }

  _clearAndRefreshTiles(): void {
    this._tileIndices = new Map();
    this._featureIndices = new Map();
    this._featureCollections = new Map();
    void this._loadFeaturesOnDemand();
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

  async _loadFeaturesOnDemand() {
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

    // Update tile index
    for (let i = 0; i < tilesToRequest.length; i++) {
      const quadKey = tileToQuadkey(tilesToRequest[i]);
      if (zoomLevelIndex.has(quadKey)) {
        tilesToRequest.splice(i, 1);
        i--;
      }
      else zoomLevelIndex.set(quadKey, true);
    }

    // Load tiles
    console.log('tiles to request:', tilesToRequest);
    if (tilesToRequest.length === 0) {
      this._updateSourceData(featureCollection);
      return;
    }
    const mapWidth = Math.abs(bounds[1][0] - bounds[0][0]);
    const tolerance = (mapWidth / this.map.getCanvas().width) * this._onDemandOptions.simplifyFactor;
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
    // TODO what if this tile has an amount of features that exceeds the geometryLimit?
    const queryParams: IQueryAllFeaturesOptions = {
      url: this.url,
      ...(this._authentication && { authentication: this._authentication }),
      f: 'geojson',
      resultType: 'tile',
      inSR: '4326',
      outSR: '4326',
      returnZ: false,
      returnM: false,

      where: '1=1', // TODO pass query
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      geometry: extent, // TODO intersect geometry with input spatial query?

      geometryPrecision: this.queryOptions.geometryPrecision,
      quantizationParameters: {
        extent,
        tolerance,
        mode: 'view',
      },
    };

    return await queryAllFeatures(queryParams) as unknown as GeoJSON.FeatureCollection;
  }

  _updateSourceData(fc: GeoJSON.FeatureCollection) {
    const source: GeoJSONSource = this.map.getSource(this.sourceId);
    if (source) source.updateData({ add: fc.features });
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
