import type { LayerSpecification, StyleSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import { type IDataServiceInfo, type IHostedLayerOptions, type IItemInfo, HostedLayer } from './HostedLayer';
export interface IVectorTileServiceDefinition {
    tiles: string[];
    defaultStyles: string;
    copyrightText: string;
}
export interface IVectorTileLayerOptions extends IHostedLayerOptions {
    itemId?: string;
    url?: string;
}
/**
 * VectorTileServiceInfo interface.
 */
export interface IVectorTileServiceInfo extends IDataServiceInfo {
    styleEndpoint?: string;
    tiles?: string[];
}
/**
 * This class allows you to load and display [ArcGIS vector tile layers](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/vector-tile-services/introduction/) in a MapLibre map.
 *
 * The `VectorTileLayer` class provides functionality for:
 * - Loading and displaying vector tile layers from ArcGIS Online item IDs or feature service URLs.
 * - Adding sources and layers to a MapLibre map.
 * - Managing vector tile layer styles.
 * - Managing vector tile layer visibility and opacity.
 *
 * ```javascript
 * import { VectorTileLayer } from '@esri/maplibre-arcgis';
 *
 * // Add a vector tile layer from an ArcGIS item ID
 * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromPortalItem('e0b5e1aa287845d78b1dabd3223ebed1');
 * vectorLayer.addSourcesAndLayersTo(map);
 *
 * // Add a vector tile layer from an ArcGIS vector tile service URL
 * const vectorLayer2 = await maplibreArcGIS.VectorTileLayer.fromUrl('https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer');
 * vectorLayer2.addSourcesAndLayersTo(map);
 * ```
 */
export declare class VectorTileLayer extends HostedLayer {
    protected _serviceInfo: IVectorTileServiceInfo;
    protected _itemInfo: IItemInfo;
    protected _sources: {
        [_: string]: VectorSourceSpecification;
    };
    protected _layers: LayerSpecification[];
    private _inputType;
    private _styleLoaded;
    private _itemInfoLoaded;
    private _serviceInfoLoaded;
    /**
     * Style specification.
     */
    style: StyleSpecification;
    /**
     * Creates a new VectorTileLayer instance. You must provide either an ArcGIS item ID or a vector tile service URL. If both are provided, the item ID will be used and the URL ignored.
     * ```javascript
     * import { VectorTileLayer } from '@esri/maplibre-arcgis';
     * const vectorLayer = new VectorTileLayer({url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer', authentication: "YOUR_ACCESS_TOKEN"});
     * await vectorLayer.initialize();
     * vectorLayer.addSourcesAndLayersTo(map);
     * ```
     * > Creating layers using the constructor directly is not recommended. Use the {@link VectorTileLayer.fromUrl} and {@link VectorTileLayer.fromPortalItem} static methods instead.
     * @param options - Configuration options for the vector tile layer. You must provide either an ArcGIS item ID or a vector tile service URL. If both are provided, the item ID will be used and the URL ignored.
     */
    constructor(options: IVectorTileLayerOptions);
    /**
     * Loads the style from ArcGIS.
     * @internal
     */
    _loadStyle(): Promise<StyleSpecification>;
    _loadStyleFromItemId(): Promise<StyleSpecification | null>;
    _loadStyleFromServiceUrl(): Promise<StyleSpecification | null>;
    /**
     * Retrieves information from the data service about data attribution, associated item IDs, and more.
     */
    _loadServiceInfo(): Promise<IVectorTileServiceInfo>;
    /**
     * Retrieves information from the portal about item attribution and associated service URLs
     */
    _loadItemInfo(): Promise<IItemInfo>;
    _cleanStyle(style: StyleSpecification): void;
    /**
     * Get attribution for a source.
     * @param sourceId - Source ID.
     * @returns Attribution.
     * @internal
     */
    _getAttribution(sourceId: string): string | null;
    initialize(): Promise<VectorTileLayer>;
    /**
     * Creates a new VectorTileLayer instance from an ArcGIS vector tile service URL. You must provide a valid vector tile service URL.
     * ```javascript
     * import { VectorTileLayer } from '@esri/maplibre-arcgis';
     *
     * // Add a vector tile layer from an ArcGIS item ID
     * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromPortalItem('e0b5e1aa287845d78b1dabd3223ebed1');
     * vectorLayer.addSourcesAndLayersTo(map);
     * ```
     *
     * @param itemId - ArcGIS item ID of a vector tile layer.
     * @param options - Configuration options for the vector tile layer.
     * @returns A promise that resolves to a VectorTileLayer instance.
     *
     */
    static fromPortalItem(itemId: string, options?: IVectorTileLayerOptions): Promise<VectorTileLayer>;
    /**
     * Creates a new VectorTileLayer instance from an ArcGIS vector tile service URL. You must provide a valid vector tile service URL.
     * ```javascript
     * import { VectorTileLayer } from '@esri/maplibre-arcgis';
     *
     * // Add a vector tile layer from an ArcGIS vector tile service URL
     * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromUrl('https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer');
     * vectorLayer.addSourcesAndLayersTo(map);
     * ```
     * @param serviceUrl - URL to an ArcGIS vector tile service.
     * @param options - Configuration options for the vector tile layer.
     * @returns A promise that resolves to a VectorTileLayer instance.
     */
    static fromUrl(serviceUrl: string, options?: IVectorTileLayerOptions): Promise<VectorTileLayer>;
}
export default VectorTileLayer;
