import { type GeoJSONSource, type Map as MaplibreMap } from 'maplibre-gl';
import { type IQueryOptions } from './FeatureLayer';
import { type ILayerDefinition } from '@esri/arcgis-rest-feature-service';
import { type RestJSAuthenticationManager } from './Util';
export type LoadingModeOptions = 'default' | 'snapshot' | 'ondemand';
export interface FeatureLayerSourceManagerOptions {
    queryOptions: IQueryOptions;
    authentication?: RestJSAuthenticationManager;
    useStaticZoomLevel?: boolean;
    loadingMode?: LoadingModeOptions;
}
export declare class FeatureLayerSourceManager {
    geojsonSourceId: string;
    layerUrl: string;
    layerDefinition?: ILayerDefinition;
    map: MaplibreMap;
    maplibreSource: GeoJSONSource;
    token?: string;
    private _snapshotResultRecordCount;
    private _onDemandResultRecordCount;
    private _onDemandSettings;
    private _maxExtent;
    private _tileIndices;
    private _featureIndices;
    private _featureCollections;
    private _options;
    private _maxRecordCountFactor;
    constructor(id: string, layerUrl: string, layerDefinition: ILayerDefinition, options: FeatureLayerSourceManagerOptions);
    /**
     * Called by Maplibre when the source is added to the map.
     */
    onAdd(map: MaplibreMap): void;
    /**
     * Loads the layer definition and features, using snapshot or on-demand mode as appropriate.
     */
    private _load;
    /**
     * Loads all features in the service layer, as long as there are less than a hardcoded geometry limit
     * @param geometryLimit - The geometry limit for this specific layer type, determined via the layer definition
     * @returns - GeoJSON feature collection containing all features in a layer
     */
    private _loadFeatureSnapshot;
    /**
     * Loads features on demand for visible tiles.
     */
    private _loadFeaturesOnDemand;
    /**
     * Loads features for a set of tiles.
     */
    private _loadTiles;
    private _bindLoadFeaturesToMoveEndEvent;
    private _clearTiles;
    private _getTileIndexAtZoomLevel;
    private _getFeatureIdIndexAtZoomLevel;
    private _getFeatureCollectionAtZoomLevel;
    private _doesTileOverlapBounds;
    private _addTileFeaturesToFeatureCollection;
    private _getTile;
    private _setMaxExtentFromLayerExtent;
    /**
     * Check if a feature service request will exceed a hardcoded geometry limit
     * @param params - Parameters of the desired request.
     * @param geometryLimit - The geometry limit for the specific type of feature (point, line, or polygon)
     * @returns True if the layer exceeds the limit, and false otherwise.
     */
    private _checkIfExceedsLimit;
    private _updateSourceData;
    private _isZoomInRange;
    private _isExtentVisible;
    private _getZoomLevel;
    private _findTilesToRequestAtZoomLevel;
    private _filterRequestedTiles;
    private _calculateTolerance;
}
