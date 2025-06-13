import type {LayerSpecification, VectorSourceSpecification, StyleSpecification} from '@maplibre/maplibre-gl-style-spec';
import { ItemId, ServiceUrlOrItemId, checkServiceUrlOrItemId, itemRequest } from './Util';
import { request, warn } from './Request';
import { Map } from 'maplibre-gl';
import {HostedLayer,ItemInfo,ServiceInfo} from './HostedLayer';

type VectorTileLayerOptions = {
    accessToken?: string;
    portalUrl?: string;
}

export class VectorTileLayer implements HostedLayer {

    accessToken: string;
    _serviceInfo : ServiceInfo;
    _itemInfo : ItemInfo;
    
    sources: {[_:string]:VectorSourceSpecification};
    layers: LayerSpecification[];

    _inputType: 'itemId' | 'serviceUrl';

    _style: StyleSpecification;
    _styleLoaded: boolean;
    _itemInfoLoaded: boolean;
    _serviceInfoLoaded: boolean;
    _ready:boolean;
    _map?:Map;

    constructor (urlOrId : ServiceUrlOrItemId, options? : VectorTileLayerOptions) {

        if (!urlOrId) throw new Error('A service URL or Item ID is required for VectorTileLayer.');
        if (options?.accessToken) this.accessToken = options.accessToken;
        
        this._styleLoaded = false;
        this._itemInfoLoaded = false;
        this._serviceInfoLoaded = false;
        this._ready = false;

        this._inputType = checkServiceUrlOrItemId(urlOrId);
        if (this._inputType === 'serviceUrl') {
            this._serviceInfo = {
                serviceUrl: urlOrId,
                serviceItemPortalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com',
            }
        }
        else if (this._inputType === 'itemId') {
            this._itemInfo = {
                itemId: urlOrId,
                portalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com'
            };
        }
    }
    // Loads the style from ArcGIS
    async _loadStyle() : Promise<void> {
        let styleInfo : StyleSpecification | null = null;

        if (this._inputType == 'itemId') {
            styleInfo = await this._loadStyleFromItemId();
            if (!styleInfo) {
                warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...');
                await this._loadItemInfo(); // retrieve service URL                
                await this._loadServiceInfo();
                styleInfo = await this._loadStyleFromServiceUrl();
            }
        } else {
            await this._loadServiceInfo();
            styleInfo = await this._loadStyleFromServiceUrl();
            await this._loadItemInfo();
        }

        if (!styleInfo) throw new Error('Unable to load style information from service URL or item ID.')
        this._style = styleInfo;
        this._styleLoaded = true;
    }
    async _loadStyleFromItemId() : Promise<StyleSpecification | null> {
        const params = {
            token:this.accessToken,
            portalUrl:this._itemInfo.portalUrl
        }
        // Load style info
        let styleInfo : StyleSpecification | null = null;
        // Try loading default style name first
        try {
            const rootStyle : any = await itemRequest(this._itemInfo.itemId,{
                ...params,
                endpoint:'/resources/styles/root.json'
            });
            styleInfo = rootStyle;
        // Check for other style resources associated with the item
        } catch (e) {
            const itemResources : any = await itemRequest(this._itemInfo.itemId,{
                ...params,
                endpoint:'/resources'
            });

            let styleFile : string | null = null;
            if (itemResources.total > 0) {
                itemResources.resources.forEach(entry => {
                    if (entry.resource.startsWith('styles')) {
                        styleFile = entry.resource;
                    }
                });
            }
            if (styleFile) {
                const customStyle : StyleSpecification = await itemRequest(this._itemInfo.itemId,{
                    ...params,
                    endpoint:`/resources/${styleFile}`
                })
                styleInfo = customStyle;
            }
        }
        return styleInfo;
    }
    async _loadStyleFromServiceUrl() : Promise<StyleSpecification | null> {
        if (!this._serviceInfo.serviceUrl) throw new Error('No data service provided');

        const styleInfo : StyleSpecification = await request(`${this._serviceInfo.serviceUrl}/${this._serviceInfo.styleEndpoint}`,{
            token:this.accessToken,
        });
        return styleInfo;
    }
    async _loadServiceInfo() : Promise<void> {
        // if we always need to get attribution then there's no point in requesting the default style first
        const serviceResponse : any = await request(this._serviceInfo.serviceUrl,{
            token:this.accessToken
        });

        if (!this._itemInfoLoaded) {
            this._itemInfo = {
                itemId:serviceResponse.serviceItemId,
                portalUrl: this._serviceInfo.serviceItemPortalUrl
            }
        }
        this._serviceInfo = {
            ...this._serviceInfo,
            tiles: serviceResponse.tiles,
            styleEndpoint: serviceResponse.defaultStyles
        }
        this._serviceInfoLoaded = true;
    }
    async _loadItemInfo() : Promise<void> {
        const itemResponse : any = await itemRequest(this._itemInfo.itemId,{
            token:this.accessToken,
            portalUrl:this._itemInfo.portalUrl
        });

        if (!itemResponse.url) throw new Error('Provided ArcGIS item ID has no associated data service.');
        // in feature collections, there is still data at the /data endpoint ...... just a heads up

        // Set service URL if it doesn't exist
        if (!this._serviceInfoLoaded) {
            this._serviceInfo = {
                serviceUrl: itemResponse.url,
                serviceItemPortalUrl: this._itemInfo.portalUrl
            }
        }
        this._itemInfo = {
            ...this._itemInfo,
            accessInformation: itemResponse.accessInformation,
            title: itemResponse.title,
            //type: itemResponse.type
        }
        this._itemInfoLoaded = true;
    }
    _createSourcesAndLayers() : void {
        if (!this._styleLoaded) throw new Error('Vector tile style has not been loaded from ArcGIS.')
        // Finish creating sources
        Object.keys(this._style.sources).forEach(id => {
            const source = this._style.sources[id] as VectorSourceSpecification;
            // Fix service URL
            if (source.url == '../../') source.url = this._serviceInfo.serviceUrl;
            // Format tiles
            if (!source.tiles) {
                if (this._serviceInfo.tiles) source.tiles = [`${source.url}/${this._serviceInfo.tiles[0]}`];
                else source.tiles = [`${source.url}/tile/{z}/{y}/{x}.pbf`]; // Just take our best guess
            }
            // Provide authentication
            if (this.accessToken) {
                if (source.url) source.url = `${source.url}?token=${this.accessToken}`;
                if (source.tiles) source.tiles = source.tiles.map((tileUrl) => `${tileUrl}?token=${this.accessToken}`);
            }
            // Provide attribution
            if (this._itemInfo.accessInformation) {
                source.attribution = this._itemInfo.accessInformation;
            }
        })
        // Public API is read-only
        Object.defineProperty(this, "sources", {
            value: this._style.sources as {[_:string]:VectorSourceSpecification},
            writable:false
        });
        Object.defineProperty(this, "layers", {
            value: this._style.layers,
            writable:false
        });
    }

    // Public API
    async initialize() : Promise<VectorTileLayer> {
        await this._loadStyle();
        this._createSourcesAndLayers();
        this._ready = true;
        return this;
    }

    addSourcesAndLayersTo(map : Map) : VectorTileLayer {
        if (!this._ready) throw new Error('Vector tile layer has not finished loading.');

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

    // Getters and setters
    get source () : VectorSourceSpecification {
        const sourceIds = Object.keys(this.sources)
        if (sourceIds.length == 1) return this.sources[sourceIds[0]];
        else throw new Error('Style contains multiple sources. Use \'sources\' instead of \'source\'.');
    }
    get sourceId () : string {
        const sourceIds = Object.keys(this.sources);
        if (sourceIds.length == 1) return sourceIds[0];
        else throw new Error('Style contains multiple sources. Use \'sources\' instead of \'sourceId\'.');
    }
    getSources () {

    }
    getLayers () {
        // structuredClone of layers
    }
    setSourceId(oldId:string, newId:string) {
        // TODO
    }
    setAttribution(sourceId: string, attribution: string) {

    }


    // TODO validate inputs on fromItemId, fromServiceUrl
    static async fromItemId (itemId: ItemId, options : VectorTileLayerOptions) : Promise<VectorTileLayer> {
        const vtl = new VectorTileLayer(itemId,options);
        await vtl.initialize();
        return vtl;
    }
    static async fromServiceUrl (serviceUrl: string, options : VectorTileLayerOptions) : Promise<VectorTileLayer> {
        const vtl = new VectorTileLayer(serviceUrl,options);
        await vtl.initialize();
        return vtl;
    }
}
export default VectorTileLayer;