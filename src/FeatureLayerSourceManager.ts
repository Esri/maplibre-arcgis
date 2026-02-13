import { type MapLibreEvent, type GeoJSONSource, type Map as MaplibreMap, MercatorCoordinate, LngLatBounds } from 'maplibre-gl';
import { type GeometryLimits, type IQueryOptions, esriGeometryInfo } from './FeatureLayer';
import { getLayer, queryFeatures, type ILayerDefinition, type IQueryAllFeaturesOptions, queryAllFeatures, type IQueryFeaturesResponse } from '@esri/arcgis-rest-feature-service';
import { getBlankFc, type RestJSAuthenticationManager, warn } from './Util';
import { bboxToTile, getChildren, tileToQuadkey, tileToBBOX, type Tile } from '@mapbox/tilebelt';
import { type IGeometry, request, type IExtent } from '@esri/arcgis-rest-request';
import { type BBox } from 'geojson';

// TODO credit Rowan: https://github.com/rowanwins/mapbox-gl-arcgis-featureserver/
// TODO these might belong elsewhere
interface IEnvelope extends IGeometry {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  zmin?: number;
  zmax?: number;
  mmin?: number;
  mmax?: number;
  idmin?: number;
  idmax?: number;
};
type GeometryProjectionResponse = {
  geometries: IGeometry[];
};

// Types for relevant classes
type FeatureLayerSourceManagerOptions = {
  url: string;
  queryOptions: IQueryOptions;
  layerDefinition?: ILayerDefinition;
  authentication?: RestJSAuthenticationManager;
  useStaticZoomLevel?: boolean;
};

type FeatureIdIndexMap = Map<string | number, boolean>;
type TileIndexMap = Map<string, boolean>;

export class FeatureLayerSourceManager {
  geojsonSourceId: string;
  url: string;
  map: MaplibreMap;

  token?: string;
  queryOptions: Omit<IQueryOptions, 'ignoreLimits'>;
  layerDefinition: ILayerDefinition;
  maplibreSource: GeoJSONSource;

  private _authentication?: RestJSAuthenticationManager;

  private _onDemandSettings: {
    maxTolerance: number;
    minZoom: number;
    maxZoom: number;
  };

  private _useStaticZoomLevel: boolean;
  private _maxExtent: BBox;
  private _tileIndices: Map<number, TileIndexMap>;
  private _featureIndices: Map<number, FeatureIdIndexMap>;
  private _featureCollections: Map<number, GeoJSON.FeatureCollection>;
  private _boundEvent: (ev?: MapLibreEvent) => void;

  constructor(id: string, options: FeatureLayerSourceManagerOptions) {
    if (!id) throw new Error('Source manager requires the ID of a GeoJSONSource.');
    this.geojsonSourceId = id;

    const { url, queryOptions, layerDefinition, authentication, useStaticZoomLevel } = options;

    if (!url) throw new Error('Source manager requires the URL of a feature layer.');
    this.url = url;

    this.queryOptions = queryOptions ? queryOptions : {};
    if (authentication) this._authentication = authentication;
    if (layerDefinition) this.layerDefinition = layerDefinition;

    this._useStaticZoomLevel = useStaticZoomLevel ? useStaticZoomLevel : false;
  }

  onAdd(map: MaplibreMap) {
    this.map = map;
    void this.load();
  }

  async load() {
    this.layerDefinition = await this._getLayerDefinition();
    try {
      // Try snapshot mode first
      const queryLimit: GeometryLimits = esriGeometryInfo[this.layerDefinition.geometryType].limit;
      const featureCollection = await this._loadFeatureSnapshot(queryLimit);
      console.log('Snapshot mode succeeded for', this.url);
      this._updateSourceData(featureCollection);
    }
    catch (err) {
      console.log(err);
      // Use on-demand loading as fallback
      console.log('Using on-demand loading for', this.url);
      this._tileIndices = new Map();
      this._featureIndices = new Map();
      this._featureCollections = new Map();

      this._onDemandSettings = {
        maxTolerance: 156543, // meters per pixel at zoom level 0: https://wiki.openstreetmap.org/wiki/Zoom_levels
        minZoom: this._useStaticZoomLevel ? 7 : 2, // TODO set dynamically
        maxZoom: 22, // TODO
      };
      if (!this.queryOptions?.geometryPrecision) this.queryOptions.geometryPrecision = 6; // https://en.wikipedia.org/wiki/Decimal_degrees#Precision

      // Use service bounds
      this._maxExtent = [-Infinity, Infinity, -Infinity, Infinity];
      if (this.layerDefinition.extent) this._useServiceBounds();

      this._enableOnDemandLoading();
      this._clearAndRefreshTiles();
    }
  }

  private _useServiceBounds(): void {
    const serviceExtent = this.layerDefinition.extent;
    if (serviceExtent.spatialReference?.wkid === 4326) {
      this._maxExtent = [serviceExtent.xmin, serviceExtent.ymin, serviceExtent.xmax, serviceExtent.ymax];
    }
    else if (serviceExtent.spatialReference?.wkid === 3857) {
      // Convert 3857 CRS to 4326 lng/lat
      const sw = new MercatorCoordinate(serviceExtent.xmin, serviceExtent.ymin).toLngLat();
      const ne = new MercatorCoordinate(serviceExtent.xmax, serviceExtent.ymax).toLngLat();
      const extent = new LngLatBounds(sw, ne);

      this._maxExtent = [extent.getWest(), extent.getSouth(), extent.getEast(), extent.getNorth()];
    }
    // Only 4326 and 3857 are currently handled for service extent.
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

  /**
   * Loads all features in the service layer, as long as there are less than a hardcoded geometry limit
   * @param geometryLimit - The geometry limit for this specific layer type, determined via the layer definition
   * @returns - GeoJSON feature collection containing all features in a layer
   */
  private async _loadFeatureSnapshot(geometryLimit: GeometryLimits): Promise<GeoJSON.FeatureCollection> {
    // fetch data
    let layerData: GeoJSON.FeatureCollection;

    // const { ignoreLimits, ...queryParams } = this.queryOptions;
    const ignoreFeatureLimit = false;

    const requestParams: IQueryAllFeaturesOptions = {
      url: this.url,
      authentication: this._authentication,
      ...this.queryOptions,
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

  _enableOnDemandLoading() {
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

  _doesTileOverlapBounds(tile: Tile | BBox, bounds: [number, number][]) {
    const tileBBox = tile.length === 4 ? tile as BBox : tileToBBOX(tile as Tile);
    if (tileBBox[2] < bounds[0][0]) return false;
    if (tileBBox[0] > bounds[1][0]) return false;
    if (tileBBox[3] < bounds[0][1]) return false;
    if (tileBBox[1] > bounds[1][1]) return false;
    return true;
  }

  async _loadFeaturesOnDemand() {
    const zoom = this.map.getZoom();
    if (zoom < this._onDemandSettings.minZoom) return; // TODO set minZoom dynamically based on minScale of layer data

    const mapBounds = this.map.getBounds().toArray();
    const primaryTile = bboxToTile([mapBounds[0][0], mapBounds[0][1], mapBounds[1][0], mapBounds[1][1]]);

    console.log('Load attempt.', this._maxExtent, mapBounds);
    if (this._maxExtent[0] !== -Infinity && !this._doesTileOverlapBounds(this._maxExtent, mapBounds)) {
      // Don't load features whose extent is completely off screen
      return;
    }

    const zoomLevel = this._useStaticZoomLevel ? this._onDemandSettings.minZoom : Math.round(zoom);
    const zoomLevelIndex = this._createOrGetTileIndex(zoomLevel);
    const featureIdIndex = this._createOrGetFeatureIdIndex(zoomLevel);
    const featureCollection = this._createOrGetFeatureCollection(zoomLevel);

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
        if (this._doesTileOverlapBounds(candidateTiles[i], mapBounds)) tilesToRequest.push(candidateTiles[i]);
      }
    }
    else tilesToRequest.push(primaryTile);

    // TODO intersect tiles to request with input spatial query

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
    if (tilesToRequest.length === 0) {
      this._updateSourceData(featureCollection);
      return;
    }
    // New tiles need to be requested
    const tolerance = (this._onDemandSettings.maxTolerance / (2 ** zoomLevel));
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
    const tileExtent: IExtent = {
      spatialReference: {
        latestWkid: 4326,
        wkid: 4326,
      },
      xmin: tileBounds[0],
      ymin: tileBounds[1],
      xmax: tileBounds[2],
      ymax: tileBounds[3],
    };
    // TODO edge test case: Single tile has more than the maxVertexCount of features?
    const queryParams: IQueryAllFeaturesOptions = {
      url: this.url,
      ...(this._authentication && { authentication: this._authentication }),
      ...this.queryOptions,

      f: 'geojson',
      resultType: 'tile',
      inSR: '4326',
      outSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      geometry: tileExtent,
      quantizationParameters: JSON.stringify({
        extent: tileExtent,
        mode: 'view',
        tolerance: tolerance,
      }),
    };

    return await queryAllFeatures(queryParams) as unknown as GeoJSON.FeatureCollection;
  }

  _updateSourceData(fc: GeoJSON.FeatureCollection) {
    console.log('Load complete, updating source data.');
    const source: GeoJSONSource = this.map.getSource(this.geojsonSourceId);
    if (source) source.setData(fc);
  }

  async _getLayerDefinition(): Promise<ILayerDefinition> {
    if (this.layerDefinition !== null) return Promise.resolve(this.layerDefinition);

    const layerDefinition = await getLayer({
      url: this.url,
      httpMethod: 'GET',
      ...(this._authentication && { authentication: this._authentication }),
    });
    return layerDefinition;
  }
};
