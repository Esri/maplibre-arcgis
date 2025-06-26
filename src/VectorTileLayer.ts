import type {LayerSpecification, VectorSourceSpecification, StyleSpecification} from '@maplibre/maplibre-gl-style-spec';
import { ItemId, ServiceUrlOrItemId, checkServiceUrlType, checkItemId, itemRequest } from './Util';
import { request, warn } from './Request';
import { Map } from 'maplibre-gl';
import { HostedLayer } from './HostedLayer';
import type { DataServiceInfo,ItemInfo,HostedLayerOptions } from './HostedLayer';

interface VectorTileLayerOptions extends HostedLayerOptions {
    _inputType?: 'ItemId' | 'VectorTileService';
};

interface VectorTileServiceInfo extends DataServiceInfo {
    styleEndpoint?: string; // Usually "/resources/styles"
    tiles?: string[]; // Usually "[tile/{z}/{y}/{x}.pbf]"
}

export class VectorTileLayer extends HostedLayer {

    declare _serviceInfo : VectorTileServiceInfo;
    declare _itemInfo : ItemInfo;
    
    declare _sources: {[_:string]:VectorSourceSpecification};
    declare _layers: LayerSpecification[];

    _inputType: 'ItemId' | 'VectorTileService';

    _style: StyleSpecification;
    _styleLoaded: boolean;
    _itemInfoLoaded: boolean;
    _serviceInfoLoaded: boolean;

    constructor (urlOrId : ServiceUrlOrItemId, options? : VectorTileLayerOptions) {

        super();
        this._ready = false;
        this._styleLoaded = false;
        this._serviceInfoLoaded = false;
        this._itemInfoLoaded = false;
        
        if (!urlOrId) throw new Error('A service URL or Item ID is required for VectorTileLayer.');
        
        if (options?.accessToken) this.accessToken = options.accessToken;
        
        if (options?._inputType) this._inputType = options._inputType;
        else {
            let inputType : string;
            if (!(inputType=checkItemId(urlOrId))) {
                if (!(inputType=checkServiceUrlType(urlOrId)) || inputType !== 'VectorTileService') throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS item ID or vector tile service URL.');
            }
            this._inputType = inputType as 'ItemId' | 'VectorTileService';
        }

        if (this._inputType === 'ItemId') {
            this._itemInfo = {
                itemId: urlOrId,
                portalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com'
            };
        }
        else if (this._inputType === 'VectorTileService') {
            this._serviceInfo = {
                serviceUrl: urlOrId
            }
        }
    }
    // Loads the style from ArcGIS
    async _loadStyle() : Promise<StyleSpecification> {
        let styleInfo : StyleSpecification | null = null;

        let styleSource = this._inputType;
        switch (styleSource) {
            case 'ItemId': {
                await this._loadItemInfo();
                styleInfo = await this._loadStyleFromItemId();
                if (styleInfo) break;
                else {
                    warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...');
                    styleSource = 'VectorTileService';
                }
            }
            case 'VectorTileService': {
                await this._loadServiceInfo();
                styleInfo = await this._loadStyleFromServiceUrl();
                break;
            }
        }

        if (!styleInfo) throw new Error('Unable to load style information from service URL or item ID.');

        this._styleLoaded = true;
        this._style = styleInfo;
        return this._style;
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
    /**
     * Retrieves information from the data service about data attribution, associated item IDs, and more.
     */
    async _loadServiceInfo() : Promise<VectorTileServiceInfo> {
        // if we always need to get attribution then there's no point in requesting the default style first
        const serviceResponse : any = await request(this._serviceInfo.serviceUrl,{
            token:this.accessToken
        });

        /*if (!this._itemInfoLoaded) {
            this._itemInfo = {
                itemId:serviceResponse.serviceItemId,
                portalUrl: this._serviceInfo.serviceItemPortalUrl
            }
        }*/
        this._serviceInfo = {
            ...this._serviceInfo,
            tiles: serviceResponse.tiles,
            styleEndpoint: serviceResponse.defaultStyles,
            copyrightText: serviceResponse.copyrightText
        }
        this._serviceInfoLoaded = true;
        return this._serviceInfo;
    }

    /**
     * Retrieves information from the portal about item attribution and associated service URLs
     */
    async _loadItemInfo() : Promise<ItemInfo> {
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
                //serviceItemPortalUrl: this._itemInfo.portalUrl
            }
        }
        this._itemInfo = {
            ...this._itemInfo,
            accessInformation: itemResponse.accessInformation,
            title: itemResponse.title,
            //type: itemResponse.type
        }
        this._itemInfoLoaded = true;
        return this._itemInfo;
    }
    _createSourcesAndLayers(style : StyleSpecification) : void {
        if (!style) throw new Error('Vector tile style has not been loaded from ArcGIS.')
        // Finish creating sources
        Object.keys(style.sources).forEach(id => {
            const source = style.sources[id] as VectorSourceSpecification;
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
            source.attribution = this._getAttribution(id);
        })
        // Public API is read-only
        this._sources = style.sources as {[_:string]:VectorSourceSpecification};
        this._layers = style.layers as LayerSpecification[];

        this._definePublicApi();
    }

    _getAttribution(sourceId : string) : string|null {
        // 1. Prefer attribution from item info if available
        if (this._itemInfoLoaded && this._itemInfo.accessInformation) {
            return this._itemInfo.accessInformation;
        }
        // 2. Next, check data service info
        if (this._serviceInfoLoaded && this._serviceInfo.copyrightText) {
            return this._serviceInfo.copyrightText;
        }
        // 3. Finally, check style info of the specific source
        if (this._styleLoaded && sourceId && this._style.sources[sourceId] && (this._style.sources[sourceId] as VectorSourceSpecification).attribution) {
            return (this._style.sources[sourceId] as VectorSourceSpecification).attribution;
        }
        return "";
    }

    // Public API
    async initialize() : Promise<VectorTileLayer> {
        const style = await this._loadStyle();
        this._createSourcesAndLayers(style);
        this._ready = true;
        return this;
    }

    static async fromItemId (itemId: ItemId, options : VectorTileLayerOptions) : Promise<VectorTileLayer> {
        const isItemId = checkItemId(itemId);
        if (!isItemId) throw new Error('Input is not a valid ArcGIS item ID.');
        options._inputType = 'ItemId';

        const vtl = new VectorTileLayer(itemId,options);
        await vtl.initialize();
        return vtl;
    }
    static async fromServiceUrl (serviceUrl: string, options : VectorTileLayerOptions) : Promise<VectorTileLayer> {
        
        const urlType = checkServiceUrlType(serviceUrl);
        if (urlType !== 'VectorTileService') throw new Error('Input is not a valid ArcGIS vector tile service URL.')
        options._inputType = urlType;

        const vtl = new VectorTileLayer(serviceUrl,options);
        await vtl.initialize();
        return vtl;
    }
}
export default VectorTileLayer;