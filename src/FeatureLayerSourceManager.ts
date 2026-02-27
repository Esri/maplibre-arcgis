import { type MapLibreEvent, type GeoJSONSource, type Map as MaplibreMap, MercatorCoordinate, LngLatBounds } from 'maplibre-gl';
import { type GeometryLimits, type IQueryOptions, esriGeometryInfo } from './FeatureLayer';
import { getLayer, queryFeatures, type ILayerDefinition, type IQueryAllFeaturesOptions, queryAllFeatures, type IQueryFeaturesResponse } from '@esri/arcgis-rest-feature-service';
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
  url: string;
  queryOptions: IQueryOptions;
  layerDefinition?: ILayerDefinition;
  authentication?: RestJSAuthenticationManager;
  useStaticZoomLevel?: boolean;
  _loadingMode?: LoadingModeOptions;
}

type FeatureIdIndexMap = Map<string | number, boolean>;
type TileIndexMap = Map<string, boolean>;

// Main Class: FeatureLayerSourceManager
export class FeatureLayerSourceManager {
  geojsonSourceId: string;
  url: string;
  map: MaplibreMap;
  queryOptions: Omit<IQueryOptions, 'ignoreLimits'>;
  layerDefinition: ILayerDefinition;
  maplibreSource: GeoJSONSource;
  token?: string;
  private authentication?: RestJSAuthenticationManager;
  private abortController?: AbortController;
  private onDemandSettings!: OnDemandSettings;
  private loadingMode: LoadingModeOptions;
  private useStaticZoomLevel: boolean;
  private maxExtent: BBox;
  private tileIndices: Map<number, TileIndexMap>;
  private featureIndices: Map<number, FeatureIdIndexMap>;
  private featureCollections: Map<number, GeoJSON.FeatureCollection>;
  private boundEvent: (ev?: MapLibreEvent) => void;

  constructor(id: string, options: FeatureLayerSourceManagerOptions) {
    if (!id) throw new Error('Source manager requires the ID of a GeoJSONSource.');
    this.geojsonSourceId = id;

    const { url, queryOptions, layerDefinition, authentication, useStaticZoomLevel, _loadingMode } = options;

    if (!url) throw new Error('Source manager requires the URL of a feature layer.');
    this.url = url;
    this.queryOptions = queryOptions ?? {};
    if (authentication) this.authentication = authentication;
    if (layerDefinition) this.layerDefinition = layerDefinition;
    this.loadingMode = _loadingMode ?? 'default';
    this.useStaticZoomLevel = useStaticZoomLevel ?? false;
  }


  // =====================
  // Main entry points
  // =====================

  /**
   * Called by Maplibre when the source is added to the map.
   */
  public onAdd(map: MaplibreMap): void {
    this.map = map;
    void this.load();
  }

  /**
   * Loads the layer definition and features, using snapshot or on-demand mode as appropriate.
   */
  public async load() {
    this.layerDefinition = await this.getLayerDefinition();
    try {
      if (this.loadingMode === 'snapshot' || this.loadingMode === 'default') {
        // Try snapshot mode first
        const queryLimit: GeometryLimits = esriGeometryInfo[this.layerDefinition.geometryType].limit;
        const featureCollection = await this.loadFeatureSnapshot(queryLimit);
        console.log('Snapshot mode succeeded for', this.url);
        this.updateSourceData(featureCollection);
      } else {
        throw new Error('Snapshot mode not enabled.');
      }
    } catch (err: any) {
      if (this.loadingMode !== 'ondemand' && this.loadingMode !== 'default') {
        throw new Error(`Unable to load using snapshot mode: ${err}`);
      }
      if (err && err.name === 'AbortError') {
        console.log('Snapshot mode request aborted.');
        return;
      }
      console.log(err);
      // Use on-demand loading as fallback
      console.log('Using on-demand loading for', this.url);
      this.tileIndices = new Map();
      this.featureIndices = new Map();
      this.featureCollections = new Map();

      this.onDemandSettings = {
        maxTolerance: 156543, // meters per pixel at zoom level 0
        minZoom: this.useStaticZoomLevel ? 7 : 2, // TODO set dynamically
        maxZoom: 22, // TODO
      };

      // Use service bounds
      this.maxExtent = [-Infinity, Infinity, -Infinity, Infinity];
      if (this.layerDefinition.extent) this.useServiceBounds();

      this.enableOnDemandLoading();
      this.clearAndRefreshTiles();
    }
  }

  /**
   * Loads all features in the service layer, as long as there are less than a hardcoded geometry limit
   * @param geometryLimit - The geometry limit for this specific layer type, determined via the layer definition
   * @returns - GeoJSON feature collection containing all features in a layer
   */
  private async loadFeatureSnapshot(
    geometryLimit: GeometryLimits
  ): Promise<GeoJSON.FeatureCollection> {
    // Abort previous snapshot request
    this.abortController?.abort();
    this.abortController = new AbortController();

    const requestParams: IQueryAllFeaturesOptions = {
      url: this.url,
      authentication: this.authentication,
      ...this.queryOptions,
      signal: this.abortController.signal,
    };

    const exceedsLimit = await this.checkIfExceedsLimit(requestParams, geometryLimit);
    if (exceedsLimit) {
      throw new Error('Snapshot mode geometry limit exceeded.');
    }

    const response = await queryAllFeatures({
      ...requestParams,
      f: 'geojson',
      signal: this.abortController.signal,
    });
    const featureCollection = response as unknown as GeoJSON.FeatureCollection;
    if (!featureCollection) {
      throw new Error('Unable to load data.');
    }
    return featureCollection;
  }

  /**
   * Loads features on demand for visible tiles.
   */
  private async loadFeaturesOnDemand(): Promise<void> {
    // Abort previous tile requests
    this.abortController?.abort();
    this.abortController = new AbortController();

    const zoom = this.map.getZoom();
    if (zoom < this.onDemandSettings.minZoom) return; // TODO: set minZoom dynamically based on minScale of layer data

    const mapBounds = this.map.getBounds().toArray();
    const primaryTile = bboxToTile([
      mapBounds[0][0],
      mapBounds[0][1],
      mapBounds[1][0],
      mapBounds[1][1],
    ]);

    console.log('Load attempt.', this.maxExtent, mapBounds);
    if (this.maxExtent[0] !== -Infinity && !this.doesTileOverlapBounds(this.maxExtent, mapBounds)) {
      // Don't load features whose extent is completely off screen
      return;
    }

    const zoomLevel = this.useStaticZoomLevel ? this.onDemandSettings.minZoom : Math.round(zoom);
    const zoomLevelIndex = this.createOrGetTileIndex(zoomLevel);
    const featureIdIndex = this.createOrGetFeatureIdIndex(zoomLevel);
    const featureCollection = this.createOrGetFeatureCollection(zoomLevel);

    // Find tiles to request
    const tilesToRequest: Tile[] = [];
    if (primaryTile[2] < zoomLevel) {
      let candidateTiles = getChildren(primaryTile);
      let minZoomOfCandidates = candidateTiles[0][2];
      while (minZoomOfCandidates < zoomLevel) {
        const newCandidateTiles: Tile[] = [];
        candidateTiles.forEach((t) => newCandidateTiles.push(...getChildren(t)));
        candidateTiles = newCandidateTiles;
        minZoomOfCandidates = candidateTiles[0][2];
      }
      for (let i = 0; i < candidateTiles.length; i++) {
        if (this.doesTileOverlapBounds(candidateTiles[i], mapBounds)) tilesToRequest.push(candidateTiles[i]);
      }
    } else {
      tilesToRequest.push(primaryTile);
    }

    // TODO: intersect tiles to request with input spatial query

    // Update tile index
    for (let i = 0; i < tilesToRequest.length; i++) {
      const quadKey = tileToQuadkey(tilesToRequest[i]);
      if (zoomLevelIndex.has(quadKey)) {
        tilesToRequest.splice(i, 1);
        i--;
      } else {
        zoomLevelIndex.set(quadKey, true);
      }
    }
    // Load tiles
    if (tilesToRequest.length === 0) {
      this.updateSourceData(featureCollection);
      return;
    }
    // New tiles need to be requested
    const tolerance = 360 / 2 ** (zoomLevel + 1) / 1000;
    try {
      await this.loadTiles(tilesToRequest, tolerance, featureIdIndex, featureCollection, this.abortController.signal);
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        console.log('Tile request aborted.');
        return;
      }
      throw err;
    }

    this.updateSourceData(featureCollection);
  }

  /**
   * Loads features for a set of tiles.
   */
  private async loadTiles(
    tilesToRequest: Tile[],
    tolerance: number,
    featureIdIndex: FeatureIdIndexMap,
    fc: GeoJSON.FeatureCollection,
    signal?: AbortSignal
  ): Promise<GeoJSON.FeatureCollection> {
    return new Promise((resolve, reject) => {
      const tileRequests = tilesToRequest.map((tile) => this.getTile(tile, tolerance, signal));
      Promise.all(tileRequests)
        .then((featureCollections) => {
          featureCollections.forEach((tileFc) => {
            if (tileFc) this.iterateItems(tileFc, featureIdIndex, fc);
          });
          resolve(fc);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }

  // =====================
  // Utility/tooling methods
  // =====================

  private enableOnDemandLoading(): void {
    this.boundEvent = this.loadFeaturesOnDemand.bind(this) as () => void;
    this.map.on('moveend', this.boundEvent);
  }

  private clearAndRefreshTiles(): void {
    this.tileIndices = new Map();
    this.featureIndices = new Map();
    this.featureCollections = new Map();
    void this.loadFeaturesOnDemand();
  }

  private createOrGetTileIndex(zoomLevel: number): TileIndexMap {
    const existingZoomIndex = this.tileIndices.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const newTileIndex = new Map() as TileIndexMap;
    this.tileIndices.set(zoomLevel, newTileIndex);
    return newTileIndex;
  }

  private createOrGetFeatureIdIndex(zoomLevel: number): FeatureIdIndexMap {
    const existingFeatureIdIndex = this.featureIndices.get(zoomLevel);
    if (existingFeatureIdIndex) return existingFeatureIdIndex;
    const newFeatureIdIndex = new Map() as FeatureIdIndexMap;
    this.featureIndices.set(zoomLevel, newFeatureIdIndex);
    return newFeatureIdIndex;
  }

  private createOrGetFeatureCollection(zoomLevel: number): GeoJSON.FeatureCollection {
    const existingZoomIndex = this.featureCollections.get(zoomLevel);
    if (existingZoomIndex) return existingZoomIndex;
    const fc = getBlankFc();
    this.featureCollections.set(zoomLevel, fc);
    return fc;
  }

  private doesTileOverlapBounds(tile: Tile | BBox, bounds: [number, number][]): boolean {
    const tileBBox = tile.length === 4 ? (tile as BBox) : tileToBBOX(tile as Tile);
    if (tileBBox[2] < bounds[0][0]) return false;
    if (tileBBox[0] > bounds[1][0]) return false;
    if (tileBBox[3] < bounds[0][1]) return false;
    if (tileBBox[1] > bounds[1][1]) return false;
    return true;
  }

  private iterateItems(
    tileFc: GeoJSON.FeatureCollection,
    featureIdIndex: FeatureIdIndexMap,
    fc: GeoJSON.FeatureCollection
  ): void {
    tileFc.features.forEach((feature) => {
      if (!featureIdIndex.has(feature.id)) {
        fc.features.push(feature);
        featureIdIndex.set(feature.id, true);
      }
    });
  }

  private async getTile(
    tile: Tile,
    tolerance: number,
    signal?: AbortSignal
  ): Promise<GeoJSON.FeatureCollection> {
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
    // TODO: Single tile has more than the maxVertexCount of features?
    const queryParams: IQueryAllFeaturesOptions = {
      url: this.url,
      ...(this.authentication && { authentication: this.authentication }),
      ...this.queryOptions,
      f: 'pbf-as-geojson',
      resultType: 'tile',
      inSR: '4326',
      spatialRel: 'esriSpatialRelIntersects',
      geometryType: 'esriGeometryEnvelope',
      geometry: tileExtent,
      quantizationParameters: JSON.stringify({
        extent: tileExtent,
        mode: 'view',
        tolerance: tolerance,
      }),
      signal,
    };

    console.log('tolerance', tolerance);
    const res = await queryAllFeatures(queryParams) as unknown as GeoJSON.FeatureCollection;
    console.log(res);
    return res;
  }

  private useServiceBounds(): void {
    const serviceExtent = this.layerDefinition.extent;
    if (serviceExtent.spatialReference?.wkid === 4326) {
      this.maxExtent = [serviceExtent.xmin, serviceExtent.ymin, serviceExtent.xmax, serviceExtent.ymax];
    } else if (serviceExtent.spatialReference?.wkid === 3857) {
      // Convert 3857 CRS to 4326 lng/lat
      const sw = new MercatorCoordinate(serviceExtent.xmin, serviceExtent.ymin).toLngLat();
      const ne = new MercatorCoordinate(serviceExtent.xmax, serviceExtent.ymax).toLngLat();
      const extent = new LngLatBounds(sw, ne);
      this.maxExtent = [extent.getWest(), extent.getSouth(), extent.getEast(), extent.getNorth()];
    }
    // Only 4326 and 3857 are currently handled for service extent.
  }

  /**
   * Check if a feature service request will exceed a hardcoded geometry limit
   * @param params - Parameters of the desired request.
   * @param geometryLimit - The geometry limit for the specific type of feature (point, line, or polygon)
   * @returns True if the layer exceeds the limit, and false otherwise.
   */
  private async checkIfExceedsLimit(
    params: IQueryAllFeaturesOptions,
    geometryLimit: GeometryLimits
  ): Promise<boolean> {
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

  private updateSourceData(fc: GeoJSON.FeatureCollection): void {
    console.log('Load complete, updating source data.');
    const source: GeoJSONSource = this.map.getSource(this.geojsonSourceId);
    if (source) source.setData(fc);
  }

  private async getLayerDefinition(): Promise<ILayerDefinition> {
    // Abort previous layer definition request
    this.abortController?.abort();
    this.abortController = new AbortController();

    if (this.layerDefinition !== null) return Promise.resolve(this.layerDefinition);

    const layerDefinition = await getLayer({
      url: this.url,
      httpMethod: 'GET',
      ...(this.authentication && { authentication: this.authentication }),
      signal: this.abortController.signal,
    });
    return layerDefinition;
  }
}
