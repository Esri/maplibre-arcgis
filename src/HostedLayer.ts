import type {LayerSpecification, SourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Map } from 'maplibre-gl';

export type HostedLayerOptions = {
    accessToken?: string;
    portalUrl?: string;
}

export type ItemInfo = {
    portalUrl: string;
    itemId: string;
    title?: string;
    accessInformation?: string; // Attribution information from item JSON
    //spatialReference?: string,
    //access?: string,
    //type?: string;
}

export type DataServiceInfo = {
    serviceUrl: string;
    serviceItemId?: string; // This may differ from itemInfo.itemId if the itemId provided in constructor represents a style, group layer, etc
    serviceItemPortalUrl: string;
    //copyrightText?:string; // Attribution information from service JSON
}

export interface HostedLayer {

    /**
     * An ArcGIS access token, required for accessing secure data layers. To get a token, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.
     */
    accessToken?: string;

    /**
     * Information about the related ArcGIS hosted data service.
     */
    _serviceInfo : DataServiceInfo;
    _serviceInfoLoaded: boolean;
    
    /**
     * Information about the related ArcGIS item.
     */
    _itemInfo : ItemInfo;
    _itemInfoLoaded: boolean;
    
    /**
     * Contains formatted maplibre sources for adding to map.
     */
    sources: {[_:string]:SourceSpecification};
    get source () : SourceSpecification;
    get sourceId () : string;
    
    /**
     * Contains formatted maplibre layers for adding to map.
     */
    layers: LayerSpecification[];
    get layer () : LayerSpecification;
    
    /**
     * Hosted layers are typically loaded via item ID, but service URLs are also supported.
     */
    _inputType: 'itemId' | 'serviceUrl';
    
    /**
     * A MapLibre GL JS map.
     */

    _map?:Map;

    /**
     * Internal flag to track layer loading.
     */
    _ready:boolean;

    /**
     * Internal method that formats data into Maplibre-style sources and data layers
     */
    _createSourcesAndLayers() : void;

    /**
     * Initializes the layer with data from ArcGIS. Called to instantiate a class.
     */
    initialize() : Promise<HostedLayer>;
    
    /**
     * Convenience method that adds all associated Maplibre sources and data layers to a map.
     * @param map A MapLibre GL JS map
     */
    addSourcesAndLayersTo(map : Map) : HostedLayer;

    // --- could be implemented in an abstract class...:
    // Method used to load information about the ArcGIS data service
    //_loadServiceInfo() : Promise<void>;
    
    // Method used to load information about the ArcGIS item
    //_loadItemInfo() : Promise<void>;
    //setCustomSourceId(oldId:string, newId:string) : string;
    //setAttribution
}
export default HostedLayer;