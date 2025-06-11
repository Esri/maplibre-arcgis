import type {LayerSpecification, SourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Map } from 'maplibre-gl';

export type ItemInfo = {
    portalUrl: string;
    itemId: string;
    title?: string;
    accessInformation?: string; // Attribution information
    //spatialReference?: string,
    //access?: string,
    //type?: string;
}

export type ServiceInfo = {
    serviceUrl: string;
    serviceItemId?: string;
    serviceItemPortalUrl: string;
    styleEndpoint?: string; // Usually "/resources/styles"
    tiles?: string[]; // Usually "[tile/{z}/{y}/{x}.pbf]"
    //copyrightText?:string;
}

export interface HostedLayer {

    // ArcGIS access token, required for accessing secure data layers
    accessToken?: string;

    // Information about the related ArcGIS data service
    _serviceInfo : ServiceInfo;
    _serviceInfoLoaded: boolean;
    
    // Information about the related ArcGIS item
    _itemInfo : ItemInfo;
    _itemInfoLoaded: boolean;

    // Contains formatted maplibre sources for adding to map
    sources: {[_:string]:SourceSpecification};
    get source () : SourceSpecification;
    get sourceId () : string;

    // Contains formatted maplibre layers for adding to map
    layers: LayerSpecification[];

    // Hosted layers are typically loaded via item ID, but service URLs are also supported
    _inputType: 'itemId' | 'serviceUrl';

    // The associated maplibre map
    _map?:Map;

    // Method used to load information about the ArcGIS data service
    _loadServiceInfo() : Promise<void>;
    
    // Method used to load information about the ArcGIS item
    _loadItemInfo() : Promise<void>;

    // Convenience method used to add the maplibre sources and layers to a map
    addSourcesAndLayersTo(map : Map) : Promise<HostedLayer>;

    //setCustomSourceId(oldId:string, newId:string) : string;
    /*
    _style: StyleSpecification;
    _styleLoaded: boolean;
    loadStyle() : Promise<HostedLayer>;
    _loadStyleFromItemId() : Promise<StyleSpecification | null>;
    _loadStyleFromServiceUrl() : Promise<StyleSpecification | null>;
    _setStyle(styleInfoResponse : StyleSpecification) : void;
    */
}
export default HostedLayer;