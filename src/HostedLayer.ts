import type {GeoJSONSourceSpecification, LayerSpecification, SourceSpecification, VectorSourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { Map } from 'maplibre-gl';
import { request } from './Request';

type SupportedSourceSpecifications = VectorSourceSpecification | GeoJSONSourceSpecification;

export type HostedLayerOptions = {
    accessToken?: string;
    portalUrl?: string;
}

export interface ItemInfo {
    portalUrl: string;
    itemId: string;
    title?: string;
    accessInformation?: string; // Attribution information from item JSON
    //spatialReference?: string,
    //access?: string,
    //type?: string;
}

export interface DataServiceInfo {
    serviceUrl: string;
    serviceItemId?: string; // This may differ from itemInfo.itemId if the itemId provided in constructor represents a style, group layer, etc
    serviceItemPortalUrl: string;
    copyrightText?:string; // Attribution information from service JSON
}

export abstract class HostedLayer {

    /**
     * An ArcGIS access token, required for accessing secure data layers. To get a token, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.
     */
    accessToken?: string;

    /**
     * Retrieves information about the associated hosted data service in ArcGIS.
     */
    _serviceInfo : DataServiceInfo;
    
    /**
     * Retrieves information about the associated ArcGIS item.
     */
    _itemInfo : ItemInfo;

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
        const throwReadOnlyError = (propertyName : string) => {throw new Error(`${propertyName} is a read-only property.`)};
        
        Object.defineProperty(this,'sources',{
            get () : SupportedSourceSpecifications {
                return this._sources;
            },
            set (_) {throwReadOnlyError('sources')}
        });
        //Object.seal(this['sources']);

        Object.defineProperty(this,'source',{
            get () : SupportedSourceSpecifications {
                const sourceIds = Object.keys(this._sources);
                if (sourceIds.length == 1) return this._sources[sourceIds[0]];
                else throw new Error('Hosted layer contains multiple sources. Use \'sources\' instead of \'source\'.');
            },
            set (_) {throwReadOnlyError('source')}
        });
        Object.seal(this['source']);

        Object.defineProperty(this,'sourceId',{
            get () : string {
                const sourceIds = Object.keys(this._sources);
                if (sourceIds.length == 1) return sourceIds[0];
                else throw new Error('Hosted layer contains multiple sources. Use \'sources\' instead of \'sourceId\'.');
            },
            set (_) {throwReadOnlyError('sourceId')}
        });
        Object.seal(this['sourceId']);

        Object.defineProperty(this,'layers',{
            get () : LayerSpecification[] {
                return this._layers;
            },
            set (_) {throwReadOnlyError('layers')}
        });
        Object.seal(this['layers']);

        Object.defineProperty(this,'layer',{
            get () : LayerSpecification {
                if (this._layers.length == 1) return this._layers[0];
                else throw new Error('Hosted layer contains multiple style layers. Use property \'layers\' instead of \'layer\'.');
            },
            set (_) {throwReadOnlyError('layer')}
        });
        Object.seal(this['layer']);
    }

    /**
     * Changes the ID of a maplibre style source, and updates all associated maplibre style layers.
     * @param oldId The source ID to be changed.
     * @param newId The new source ID.
     */
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
    }

    /**
     * Sets the data attribution of the specified source
     * @param sourceId The ID of the maplibre style source.
     * @param attribution Custom attribution text.
     */
    setAttribution(sourceId : string, attribution : string) : void {
        this._sources[sourceId].attribution = attribution;
    }

    /**
     * Creates a mutable copy of the specified source.
     * @param sourceId The ID of the maplibre style source to copy.
     */
    copySource (sourceId : string) {
        return structuredClone(this._sources[sourceId]);
    }

    /**
     * Creates a mutable copy of the specified layer
     * @param layerId The ID of the maplibre style layer to copy
     */
    copyLayer (layerId : string) {
        for (let i=0;i<this._layers.length;i++) {
            if (this._layers[i].id == layerId) return structuredClone(this._layers[i]);
        }
        throw new Error(`No layer with ID ${layerId} exists.`)
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
}
export default HostedLayer;