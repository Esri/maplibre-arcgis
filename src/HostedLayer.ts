import type {GeoJSONSourceSpecification, LayerSpecification, SourceSpecification, VectorSourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Map } from 'maplibre-gl';
import { request } from './Request';

type SupportedSourceSpecifications = VectorSourceSpecification | GeoJSONSourceSpecification;

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
    _sources: {[_:string]:SupportedSourceSpecifications};
    _layers: LayerSpecification[];
    
    /**
     * Internal method that formats data into Maplibre-style sources and data layers
     */
    abstract _createSourcesAndLayers() : void;

    /**
     * Defines the following properties:
     * sources
     * source
     * sourceId
     * layers
     * layer
     */
    _definePublicApi() : void {
        const readOnlyPropError = (propertyName : string) => {throw new Error(`${propertyName} is a read-only property.`)};
        
        Object.defineProperty(this,'sources',{
            get () : SupportedSourceSpecifications {
                return this._sources;
            },
            set (val) {readOnlyPropError('sources')}
        });
        //Object.seal(this['sources']);

        Object.defineProperty(this,'source',{
            get () : SupportedSourceSpecifications {
                const sourceIds = Object.keys(this._sources)
                if (sourceIds.length == 1) return this._sources[sourceIds[0]];
                else throw new Error('Hosted layer contains multiple sources. Use \'sources\' instead of \'source\'.');
            },
            set (val) {readOnlyPropError('source')}
        });
        Object.seal(this['source']);

        Object.defineProperty(this,'sourceId',{
            get () : string {
                const sourceIds = Object.keys(this._sources);
                if (sourceIds.length == 1) return sourceIds[0];
                else throw new Error('Hosted layer contains multiple sources. Use \'sources\' instead of \'sourceId\'.');
            },
            set (val) {readOnlyPropError('sourceId')}
        });
        Object.seal(this['sourceId']);

        Object.defineProperty(this,'layers',{
            get () : LayerSpecification[] {
                return this._layers;
            },
            set (val) {readOnlyPropError('layers')}
        });
        Object.seal(this['layers']);

        Object.defineProperty(this,'layer',{
            get () : LayerSpecification {
                if (this._layers.length == 1) return this._layers[0];
                else throw new Error('Hosted layer contains multiple style layers. Use property \'layers\' instead of \'layer\'.');
            },
            set (val) {readOnlyPropError('layer')}
        });
        Object.seal(this['layer']);
    }

   setSourceId(oldId:string, newId:string) : void {
        // Update ID of source
        Object.keys(this._sources).forEach(source => {
            if (source == oldId) {
                this._sources[newId] = this._sources[oldId];
                delete this._sources[oldId];
            }
        });
        // Update source ID property of all layers
        this._layers.forEach(lyr => {
            if (lyr['source'] == oldId) lyr['source'] = newId; 
        });
        return;
    }
    
    setAttribution(sourceId : string, attribution : string) : void {
        this._sources[sourceId].attribution = attribution;
    }

    /**
     * Creates a mutable copy of the specified source
     */
    getSourceCopy (sourceId : string) {
        // TODO structuredClone of sources
    }

    /**
     * Creates a mutable copy of the specified layer
     */
    getLayerCopy (layerId : string) {
        // TODO structuredClone of layers
    }        // this.sources
    
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
        Object.keys(this._sources).forEach(sourceId => {
            map.addSource(sourceId,this._sources[sourceId])
        });
        this._layers.forEach(layer => {
            map.addLayer(layer);
        });

        return this;
    }
    // --- could be implemented in an abstract class...:
    
    //setAttribution

    constructor() {
        this._serviceInfoLoaded = false;
        this._itemInfoLoaded = false;
        this._ready = false;
    }
    
}
export default HostedLayer;