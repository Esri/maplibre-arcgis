import { type MapLibreEvent, type GeoJSONSource, type Map as MaplibreMap, MercatorCoordinate, LngLatBounds } from 'maplibre-gl';
import { type GeometryLimits, type IQueryOptions, esriGeometryInfo } from './FeatureLayer';
import { queryFeatures, type ILayerDefinition, type IQueryAllFeaturesOptions, queryAllFeatures, type IQueryFeaturesResponse } from '@esri/arcgis-rest-feature-service';
import { getBlankFc, type RestJSAuthenticationManager, warn } from './Util';
import { bboxToTile, getChildren, tileToQuadkey, tileToBBOX, type Tile } from '@mapbox/tilebelt';
import { type IGeometry, type IExtent } from '@esri/arcgis-rest-request';
import { type BBox } from 'geojson';

// =====================
// Types and Interfaces
// =====================
/**
 * Settings for on-demand feature loading.
 */
interface OnDemandSettings {
  maxTolerance: number;
  staticZoomLevel: number;
  minZoom: number;
  maxZoom: number;
}

/** Envelope geometry for bounding box operations. */
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
}

interface GeometryProjectionResponse {
  geometries: IGeometry[];
}

export type LoadingModeOptions = 'default' | 'snapshot' | 'ondemand';

export interface FeatureLayerSourceManagerOptions {
  queryOptions: IQueryOptions;
  authentication?: RestJSAuthenticationManager;
  useStaticZoomLevel?: boolean;
  loadingMode?: LoadingModeOptions;
}

type FeatureIdIndexMap = Map<string | number, boolean>;
type TileIndexMap = Map<string, boolean>;

// Main Class: FeatureLayerSourceManager
export class FeatureLayerSourceManager {
  geojsonSourceId: string;
  layerUrl: string;
  layerDefinition?: ILayerDefinition;
  map: MaplibreMap = undefined as unknown as MaplibreMap;
  maplibreSource: GeoJSONSource = undefined as unknown as GeoJSONSource;
  token?: string;
  private _snapshotResultRecordCount: number;
  private _onDemandResultRecordCount: number;
  private _onDemandSettings!: OnDemandSettings;
  private _maxExtent: BBox = [-Infinity, Infinity, -Infinity, Infinity];
  private _tileIndices: Map<number, TileIndexMap> = new Map();
  private _featureIndices: Map<number, FeatureIdIndexMap> = new Map();
  private _featureCollections: Map<number, GeoJSON.FeatureCollection> = new Map();
  private _options: FeatureLayerSourceManagerOptions;

  constructor(id: string, layerUrl: string, layerDefinition: ILayerDefinition, options: FeatureLayerSourceManagerOptions) {
    if (!id) throw new Error('Source manager requires the ID of a GeoJSONSource.');
    if (!layerUrl) {
      throw new Error('Source manager requires the URL of a feature layer.');
    }
    if (!layerDefinition) {
      throw new Error('Source manager requires a layer definition.');
    }
    this.geojsonSourceId = id;
    this.layerUrl = layerUrl;
    this.layerDefinition = layerDefinition;

    const maxRecordCountFactor = this.layerDefinition.advancedQueryCapabilities?.supportsMaxRecordCountFactor ? 4 : 1;

    this._snapshotResultRecordCount = Math.min((this.layerDefinition.maxRecordCount ?? 2000) * maxRecordCountFactor, 8000);

    this._onDemandResultRecordCount = Math.min((this.layerDefinition.tileMaxRecordCount ?? 2000) * maxRecordCountFactor, 8000);

    this._options = {
      queryOptions: options.queryOptions ?? {},
      authentication: options.authentication,
      useStaticZoomLevel: options.useStaticZoomLevel ?? false,
      loadingMode: options.loadingMode ?? 'default',
    };
  }

  // =====================
  // Main entry points
  // =====================

  /**
   * Called by Maplibre when the source is added to the map.
   */
  public onAdd(map: MaplibreMap) {
    this.map = map;
    void this._load();
  }

  /**
   * Loads the layer definition and features, using snapshot or on-demand mode as appropriate.
   */
  private async _load() {
    const loadingMode = this._options.loadingMode;
    const defaultOrSnapshot = loadingMode === 'default' || loadingMode === 'snapshot';
    const defaultOrOnDemand = loadingMode === 'default' || loadingMode === 'ondemand';

    // load snapshot mode if specified and under geometry limits
    if (defaultOrSnapshot) {
      if (!this.layerDefinition?.geometryType) {
        throw new Error('Layer definition with geometry type undefined.');
      }
      const geometryLimit: GeometryLimits = esriGeometryInfo[this.layerDefinition.geometryType].limit;
      const requestParams: IQueryAllFeaturesOptions = {
        url: this.layerUrl,
        authentication: this._options.authentication,
      };
      const exceedsLimit = await this._checkIfExceedsLimit(requestParams, geometryLimit);
      if (!exceedsLimit) {
        try {
          // load with snapshot mode
          const featureCollection = await this._loadFeatureSnapshot();
          console.log('Snapshot mode succeeded for', this.layerUrl);
          this._updateSourceData(this.map, featureCollection);
          return;
        }
        catch (err) {
          // total failure
          throw new Error(`Unable to load using snapshot mode: ${err}`);
        }
      }
      else {
        // if force snapshot mode, fail
        if (loadingMode === 'snapshot') {
          throw new Error('Unable to load using snapshot mode: geometry limit exceeded.');
        }
        // else, fall back to on-demand
        console.log('Snapshot mode geometry limit exceeded, falling back to on-demand.');
      }
    }

    // fall back to on demand loading
    if (defaultOrOnDemand) {
      this._onDemandSettings = {
        maxTolerance: 156543, // meters per pixel at zoom level 0
        staticZoomLevel: 7,
        minZoom: 0,
        maxZoom: 23,
      };

      // Use service bounds
      this._maxExtent = [-Infinity, Infinity, -Infinity, Infinity];
      if (this.layerDefinition && this.layerDefinition.extent) this._useServiceBounds();
      this._bindLoadFeaturesToMoveEndEvent();
      this._clearTiles();
      void this._loadFeaturesOnDemand();
      return;
    }
    throw new Error('Fatal error: unable to load features.');
  }

  /**
   * Loads all features in the service layer, as long as there are less than a hardcoded geometry limit
   * @param geometryLimit - The geometry limit for this specific layer type, determined via the layer definition
   * @returns - GeoJSON feature collection containing all features in a layer
   */
  private async _loadFeatureSnapshot() {
    const queryParams: IQueryAllFeaturesOptions = {
      url: this.layerUrl,
      authentication: this._options.authentication,
      resultRecordCount: this._snapshotResultRecordCount,
      ...this._options.queryOptions,
      f: 'geojson',
    };

    console.log('Attempting to load data in snapshot mode with query params:', queryParams);
    const response = await queryAllFeatures(queryParams);
    const featureCollection = response as unknown as GeoJSON.FeatureCollection;
    if (!featureCollection) {
      throw new Error('Unable to load data.');
    }
    return featureCollection;
  }

  /**
   * Loads features on demand for visible tiles.
   */
  private async _loadFeaturesOnDemand() {
    const zoom = this.map.getZoom();
    if (zoom < this._onDemandSettings.minZoom || zoom > this._onDemandSettings.maxZoom) return;

    const mapBounds = this.map.getBounds().toArray();
    const primaryTile = bboxToTile([
      mapBounds[0][0],
      mapBounds[0][1],
      mapBounds[1][0],
      mapBounds[1][1],
    ]);

    console.log('Max Extent, MapBounds', this._maxExtent, mapBounds);
    if (this._maxExtent[0] !== -Infinity && !this._doesTileOverlapBounds(this._maxExtent, mapBounds)) {
      // Don't load features whose extent is completely off screen
      return;
    }

    const zoomLevel = this._options.useStaticZoomLevel ? this._onDemandSettings.staticZoomLevel : Math.round(zoom);
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
    else {
      tilesToRequest.push(primaryTile);
    }

    // TODO: intersect tiles to request with input spatial query

    // Update tile index
    for (let i = 0; i < tilesToRequest.length; i++) {
      const quadKey = tileToQuadkey(tilesToRequest[i]);
      if (zoomLevelIndex.has(quadKey)) {
        tilesToRequest.splice(i, 1);
        i--;
      }
      else {
        zoomLevelIndex.set(quadKey, true);
      }
    }
    // Load tiles
    if (tilesToRequest.length === 0) {
      this._updateSourceData(this.map, featureCollection);
      return;
    }
    // New tiles need to be requested
    const tolerance = 360 / 2 ** (zoomLevel + 1) / 1000;
    try {
      await this._loadTiles(tilesToRequest, tolerance, featureIdIndex, featureCollection);
    }
    catch (err) {
      console.error('Error loading tiles:', err);
      throw err;
    }

    this._updateSourceData(this.map, featureCollection);
  }

  /**
   * Loads features for a set of tiles.
   */
  private async _loadTiles(
    tilesToRequest: Tile[],
    tolerance: number,
    featureIdIndex: FeatureIdIndexMap,
    fc: GeoJSON.FeatureCollection,
  ): Promise<GeoJSON.FeatureCollection> {
    const tileRequests = tilesToRequest.map(tile => this._getTile(tile, tolerance));
    const featureCollections = await Promise.all(tileRequests);
    featureCollections.forEach((tileFc) => {
      if (tileFc) this._addTileFeaturesToFeatureCollection(tileFc, featureIdIndex, fc);
    });
    return fc;
  }

  // =====================
  // Utility/tooling methods
  // =====================

  private _bindLoadFeaturesToMoveEndEvent() {
    this.map.on('moveend', () => {
      void this._loadFeaturesOnDemand();
    });
  }

  private _clearTiles() {
    this._tileIndices = new Map();
    this._featureIndices = new Map();
    this._featureCollections = new Map();
  }

  private _createOrGetTileIndex(zoomLevel: number) {
    const existingZoomIndex = this._tileIndices.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const newTileIndex = new Map() as TileIndexMap;
    this._tileIndices.set(zoomLevel, newTileIndex);
    return newTileIndex;
  }

  private _createOrGetFeatureIdIndex(zoomLevel: number) {
    const existingFeatureIdIndex = this._featureIndices.get(zoomLevel);
    if (existingFeatureIdIndex) return existingFeatureIdIndex;
    const newFeatureIdIndex = new Map() as FeatureIdIndexMap;
    this._featureIndices.set(zoomLevel, newFeatureIdIndex);
    return newFeatureIdIndex;
  }

  private _createOrGetFeatureCollection(zoomLevel: number) {
    const existingZoomIndex = this._featureCollections.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const fc = getBlankFc();
    this._featureCollections.set(zoomLevel, fc);
    return fc;
  }

  private _doesTileOverlapBounds(tile: Tile | BBox, bounds: [number, number][]) {
    const tileBBox = tile.length === 4 ? (tile as BBox) : tileToBBOX(tile as Tile);
    if (tileBBox[2] < bounds[0][0]) return false;
    if (tileBBox[0] > bounds[1][0]) return false;
    if (tileBBox[3] < bounds[0][1]) return false;
    if (tileBBox[1] > bounds[1][1]) return false;
    return true;
  }

  private _addTileFeaturesToFeatureCollection(
    tileFc: GeoJSON.FeatureCollection,
    featureIdIndex: FeatureIdIndexMap,
    fc: GeoJSON.FeatureCollection
  ) {
    tileFc.features.forEach((feature) => {
      if (!featureIdIndex.has(feature.id)) {
        fc.features.push(feature);
        featureIdIndex.set(feature.id, true);
      }
    });
  }

  private async _getTile(
    tile: Tile,
    tolerance: number,
  ) {
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

    const queryParams: IQueryAllFeaturesOptions = {
      url: this.layerUrl,
      ...(this._options.authentication && { authentication: this._options.authentication }),
      ...this._options.queryOptions,
      f: 'pbf-as-geojson',
      resultType: 'tile',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      geometry: tileExtent,
      resultRecordCount: this._onDemandResultRecordCount,
      quantizationParameters: JSON.stringify({
        extent: tileExtent,
        mode: 'view',
        tolerance: tolerance,
      }),
    };

    const res = await queryAllFeatures(queryParams) as unknown as GeoJSON.FeatureCollection;
    if (res.features.length > 0) {
      console.log(`tile ${JSON.stringify(tile)} with ${res.features.length} features`, { fc: res });
    }
    return res;
  }

  private _useServiceBounds() {
    if (!this.layerDefinition) return;
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
  private async _checkIfExceedsLimit(
    params: IQueryAllFeaturesOptions,
    geometryLimit: GeometryLimits
  ) {
    const exceedsLimitParams: IQueryAllFeaturesOptions = {
      ...params,
      outStatistics: [
        {
          onStatisticField: null, // Required by REST JS but not used
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
    const exceedsLimitResponse = await queryFeatures(exceedsLimitParams) as IQueryFeaturesResponse;
    return exceedsLimitResponse.features[0].attributes.exceedslimit === 1;
  }

  private _updateSourceData(map: MaplibreMap, fc: GeoJSON.FeatureCollection): void {
    console.log('%cLoad complete, updating source data.', 'color: #88E788;');
    const source: GeoJSONSource | undefined = map.getSource(this.geojsonSourceId);
    if (source) {
      source.setData(fc);
      return;
    };
    console.warn('Unable to update source: could not find source with ID', this.geojsonSourceId);
  }
}
