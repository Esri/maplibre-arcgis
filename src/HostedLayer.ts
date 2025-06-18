import type {LayerSpecification, SourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Map } from 'maplibre-gl';
import { request } from './Request';

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

export abstract class HostedLayer {

    /**
     * An ArcGIS access token, required for accessing secure data layers. To get a token, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.
     */
    accessToken?: string;

    /**
     * Retrieves information about the associated hosted data service in ArcGIS.
     */
    abstract _loadServiceInfo() : Promise<void>;
    _serviceInfo : DataServiceInfo;
    _serviceInfoLoaded: boolean;
    
    /**
     * Retrieves information about the associated ArcGIS item.
     */
    abstract _loadItemInfo() : Promise<void>;
    _itemInfo : ItemInfo;
    _itemInfoLoaded: boolean;

    /**
     * Contains formatted maplibre sources for adding to map.
     */
    sources: {[_:string]:SourceSpecification};
    get source () : SourceSpecification {
        const sourceIds = Object.keys(this.sources)
        if (sourceIds.length == 1) return this.sources[sourceIds[0]];
        else throw new Error('Style contains multiple sources. Use \'sources\' instead of \'source\'.');
    }
    get sourceId () : string {
        const sourceIds = Object.keys(this.sources);
        if (sourceIds.length == 1) return sourceIds[0];
        else throw new Error('Style contains multiple sources. Use \'sources\' instead of \'sourceId\'.');
    }

    /**
     * Creates a deep copy of the HostedLayer.sources object
     */
    getSources () {
        // TODO structuredClone of sources
    }

    /**
     * Creates a deep copy of the HostedLayer.layers object
     */
    getLayers () {
        // TODO structuredClone of layers
    }

    /**
     * Contains formatted maplibre layers for adding to map.
     */
    layers: LayerSpecification[];
    get layer () : LayerSpecification {
        if (this.layers.length == 1) return this.layers[0];
        else throw new Error('Hosted layer contains multiple style layers. Use property \'layers\' instead of \'layer\'.');
    }
    
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
    abstract _createSourcesAndLayers() : void;

    /**
     * Initializes the layer with data from ArcGIS. Called to instantiate a class.
     */
    abstract initialize() : Promise<HostedLayer>;

    /**
     * Convenience method that adds all associated Maplibre sources and data layers to a map.
     * @param map A MapLibre GL JS map
     */
    addSourcesAndLayersTo(map : Map) : HostedLayer {
        if (!this._ready) throw new Error('Cannot add to map: Data layer has not finished loading.');

        this._map = map;
        // TODO ensure each sourceId is unique
        Object.keys(this.sources).forEach(sourceId => {
            map.addSource(sourceId,this.sources[sourceId])
        });
        this.layers.forEach(layer => {
            map.addLayer(layer);
        });

        return this;
    }
    // --- could be implemented in an abstract class...:
    //setCustomSourceId(oldId:string, newId:string) : string;
    //setAttribution

    constructor() {
        this._serviceInfoLoaded = false;
        this._itemInfoLoaded = false;
        this._ready = false;
    }
    
}
export default HostedLayer;