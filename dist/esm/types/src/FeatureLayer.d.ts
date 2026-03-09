import type { GeometryType, IGeometry, ISpatialReference, SpatialRelationship } from '@esri/arcgis-rest-feature-service';
import type { GeoJSONSourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { IHostedLayerOptions } from './HostedLayer';
import { HostedLayer } from './HostedLayer';
import type { Map } from 'maplibre-gl';
import { type LoadingModeOptions } from './FeatureLayerSourceManager';
export type GeometryLimits = {
    maxRecordCount: number;
} & ({
    maxPointCount: number;
} | {
    maxVertexCount: number;
});
export declare const esriGeometryInfo: {
    [_: string]: {
        limit: GeometryLimits;
        type: 'circle' | 'line' | 'fill';
    };
};
/**
 * Options supported by FeatureLayer.
 */
export interface IFeatureLayerOptions extends IHostedLayerOptions {
    itemId?: string;
    url?: string;
    query?: IQueryOptions;
    _loadingMode?: LoadingModeOptions;
}
/**
 * Parameters for feature layer query request.
 * Go to the [REST API Documentation])https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/#request-parameters) for more information.
 */
export interface IQueryOptions {
    gdbVersion?: string;
    geometry?: IGeometry;
    geometryType?: GeometryType;
    geometryPrecision?: number;
    inSR?: string | ISpatialReference;
    outFields?: string[] | '*';
    spatialRel?: SpatialRelationship;
    sqlFormat?: 'none' | 'standard' | 'native';
    where?: string;
}
export type SupportedInputTypes = 'ItemId' | 'FeatureService' | 'FeatureLayer';
/**
 * This class allows you to load and display [ArcGIS feature layers](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/feature-services/introduction/) in a MapLibre map.
 *
 * The `FeatureLayer` class provides:
 * - Loading and displaying feature layers from item IDs or feature service URLs.
 * - Querying of feature layer attributes.
 * - Adding sources and layers to a MapLibre map.
 *
 * ```javascript
 * import { FeatureLayer } from '@esri/maplibre-arcgis';
 *
 * // Load a point layer from the service URL
 * const pointService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0";
 * const trailheads = await maplibreArcGIS.FeatureLayer.fromUrl(pointService);
 * trailheads.addSourcesAndLayersTo(map);
 *
 * // Load a polyline layer from the service URL and query
 * const lineService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
 * const trails = await maplibreArcGIS.FeatureLayer.fromUrl(lineService, {query: {
 *    outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
 *    where: 'ELEV_MIN > 200'
 *  }});
 * trails.addSourcesAndLayersTo(map);
 *
 * // Load a polygon layer from from portal item ID
 * const parks = await maplibreArcGIS.FeatureLayer.fromPortalItem('f2ea5d874dad427294641d2d45097c0e');
 * parks.addSourcesAndLayersTo(map);
 * ```
 */
export declare class FeatureLayer extends HostedLayer {
    protected _sources: {
        [_: string]: GeoJSONSourceSpecification;
    };
    private _featureLayerSourceManagers;
    protected _layers: LayerSpecification[];
    private _inputType;
    query?: IQueryOptions;
    _loadingMode: LoadingModeOptions;
    /**
     * Creates a new FeatureLayer instance. You must provide either an ArcGIS item ID or a feature service URL. If both are provided, the item ID will be used and the URL ignored. Query parameters are only supported when constructing with a feature layer URL.
     *
     *
     * ```javascript
     * import { FeatureLayer } from '@esri/maplibre-arcgis';
     *
     * const trails = new maplibreArcGIS.FeatureLayer({
     *    url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0",
     * });
     * await trails.initialize();
     * trails.addSourcesAndLayersTo(map);
     * ```
     * \> Creating layers using the constructor directly is not recommended. Use {@link FeatureLayer.fromUrl} and {@link FeatureLayer.fromPortalItem} instead.
     *
     * @param options - Configuration options for the feature layer.
     *
     *
     */
    constructor(options: IFeatureLayerOptions);
    private _initializeLayer;
    private _setupAttribution;
    initialize(): Promise<FeatureLayer>;
    protected _onAdd(map: Map): void;
    /**
     * Creates a new FeatureLayer instance from a feature service URL.
     * ```javascript
     *
     * // Load trailheads from service URL
     * const pointService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0"
     * const trailheads = await maplibreArcGIS.FeatureLayer.fromUrl(pointService);
     * trailheads.addSourcesAndLayersTo(map);
     *```
     *
     * @param serviceUrl - A valid ArcGIS feature service or feature layer URL.
     * @param options - Configuration options for the feature layer. Query parameters are only supported when constructing with a feature layer URL.
     *
     * @returns
     */
    static fromUrl(serviceUrl: string, options?: IFeatureLayerOptions): Promise<FeatureLayer>;
    /**
     * Creates a new FeatureLayer instance from an ArcGIS Online or ArcGIS Enterprise item ID.
     * @param itemId - A valid ArcGIS Online or ArcGIS Enterprise item ID for a hosted feature layer.
     * @param options - Configuration options for the feature layer.
     * @returns - A promise that resolves to a FeatureLayer instance.
     * ```javascript
     *
     * // Load parks from from portal item ID
     * const parks = await maplibreArcGIS.FeatureLayer.fromPortalItem('f2ea5d874dad427294641d2d45097c0e');
     * parks.addSourcesAndLayersTo(map);
     *```
     */
    static fromPortalItem(itemId: string, options?: IFeatureLayerOptions): Promise<FeatureLayer>;
}
export default FeatureLayer;
