import type { GeoJSONSourceSpecification, LayerSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import type { Map } from 'maplibre-gl';
import type { RestJSAuthenticationManager } from './Util';
/**
 * Union type representing the MapLibre source specifications supported by hosted layers.
 *
 * @remarks
 * This type defines the data source formats that can be used with ArcGIS hosted layers
 * in MapLibre maps. It currently supports loading data as vector tile sources and GeoJSON sources,
 * which cover the most common use cases for ArcGIS Feature Services and Vector Tile Services.
 *
 * - `VectorSourceSpecification` - For vector tile sources, typically used with ArcGIS Vector Tile Services
 * - `GeoJSONSourceSpecification` - For GeoJSON data sources, typically used with ArcGIS Feature Services converted to GeoJSON
 *
 * @example
 * ```typescript
 * // Vector source example
 * const vectorSource: SupportedSourceSpecification = {
 *   type: 'vector',
 *   tiles: ['https://services.arcgis.com/.../{z}/{y}/{x}.pbf'],
 *   attribution: 'Esri'
 * };
 *
 * // GeoJSON source example
 * const geoJsonSource: SupportedSourceSpecification = {
 *   type: 'geojson',
 *   data: 'https://services.arcgis.com/.../query?f=geojson'
 * };
 * ```
 *
 * @see {@link https://maplibre.org/maplibre-style-spec/sources/ | MapLibre Style Specification - Sources}
 */
export type SupportedSourceSpecification = VectorSourceSpecification | GeoJSONSourceSpecification;
/**
 * Options accepted by all instances of HostedLayer.
 */
export interface IHostedLayerOptions {
    /**
     * An access token as a string.
     */
    token?: string;
    /**
     * The URL of the ArcGIS portal.
     */
    portalUrl?: string;
    attribution?: string;
}
/**
 * Structure representing the metadata for an ArcGIS item. Go to {@link https://developers.arcgis.com/rest/users-groups-and-items/item/#response-properties | ArcGIS REST API - Item} to learn more.
 * @internal
 */
export interface IItemInfo {
    portalUrl: string;
    itemId: string;
    accessInformation?: string;
    title?: string;
    description?: string;
    access?: string;
    orgId?: string;
    licenseInfo?: string;
}
/**
 * Object representing the metadata for an ArcGIS data service.
 * @internal
 */
export interface IDataServiceInfo {
    serviceUrl: string;
    copyrightText?: string;
}
/**
 * Abstract class representing a [hosted layer](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/types-of-data-services/) for MapLibre GL JS.
 * This class provides a common base for loading data hosted in ArcGIS, such as feature layers and vector tile layers. It cannot be instantiated directly.
 * It includes methods for managing authentication, sources, layers, and adding them to a MapLibre map.
 * Subclasses must implement the `initialize` method to load data from ArcGIS.
 */
export declare abstract class HostedLayer {
    /**
     * An ArcGIS access token is required for accessing secure data layers. To get a token, go to the [Security and Authentication Guide](https://developers.arcgis.com/documentation/security-and-authentication/get-started/).
     */
    token: string;
    protected _authentication?: RestJSAuthenticationManager;
    /**
     * Prevent public constructor from appearing in docs by making it protected.
     * This keeps the class abstract while avoiding a displayed public constructor.
     */
    protected constructor();
    /**
     * Stores custom attribution text for the hosted layer
     */
    protected _customAttribution: string;
    /**
     * Retrieves information about the associated hosted data service in ArcGIS.
     */
    protected _serviceInfo: IDataServiceInfo;
    /**
     * Retrieves information about the associated ArcGIS item.
     */
    protected _itemInfo?: IItemInfo;
    /**
     * Contains formatted maplibre sources for adding to map.
     */
    protected _sources: {
        [_: string]: SupportedSourceSpecification;
    };
    protected _layers: LayerSpecification[];
    /**
     * Internal flag to track layer loading.
     */
    protected _ready: boolean;
    /**
     * A MapLibre GL JS map.
     */
    protected _map?: Map;
    /**
     * Retrieves the sources for the hosted layer.
     */
    get sources(): Readonly<{
        [_: string]: SupportedSourceSpecification;
    }>;
    /**
     * Sets the sources for the hosted layer.
     */
    set sources(value: {
        [_: string]: SupportedSourceSpecification;
    });
    /**
     * Retrieves the source for the hosted layer.
     */
    get source(): Readonly<SupportedSourceSpecification> | undefined;
    /**
     * Sets the source for the hosted layer.
     */
    set source(_: Readonly<SupportedSourceSpecification> | undefined);
    /**
     * Retrieves the source ID for the hosted layer.
     */
    get sourceId(): Readonly<string> | undefined;
    /**
     * Sets the source ID for the hosted layer.
     */
    set sourceId(_: Readonly<string> | undefined);
    /**
     * Retrieves the layers for the hosted layer.
     */
    get layers(): Readonly<LayerSpecification[]>;
    /**
     * Sets the layers for the hosted layer.
     */
    set layers(_: Readonly<LayerSpecification[]>);
    /**
     * Retrieves the layer for the hosted layer.
     */
    get layer(): Readonly<LayerSpecification> | undefined;
    set layer(_: Readonly<LayerSpecification> | undefined);
    protected _onAdd(map: Map): void;
    /**
     * Changes the ID of a maplibre style source, and updates all associated maplibre style layers.
     * @param oldId - The source ID to be changed.
     * @param newId - The new source ID.
     */
    setSourceId(oldId: string, newId: string): void;
    /**
     * Sets the data attribution of the specified source
     * @param sourceId - The ID of the maplibre style source.
     * @param attribution - Custom attribution text.
     */
    setAttribution(sourceId: string, attribution: string): void;
    /**
     * Returns a mutable copy of the specified source.
     * @param sourceId - The ID of the maplibre style source to copy.
     */
    copySource(sourceId: string): SupportedSourceSpecification;
    /**
     * Returns a mutable copy of the specified layer
     * @param layerId - The ID of the maplibre style layer to copy
     */
    copyLayer(layerId: string): LayerSpecification;
    /**
     * Convenience method that adds all associated Maplibre sources and data layers to a map.
     * @param map - A [MapLibre GL JS map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
     */
    addSourcesAndLayersTo(map: Map): HostedLayer;
    addSourcesTo(map: Map): HostedLayer;
    /**
     * Add layers to a maplibre map.
     * @param map - A maplibre map object
     * @returns
     */
    addLayersTo(map: Map): HostedLayer;
    /**
     * Initializes the layer with data from ArcGIS. Called to instantiate a class.
     */
    abstract initialize(): Promise<HostedLayer>;
}
export default HostedLayer;
