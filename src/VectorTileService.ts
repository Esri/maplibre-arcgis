import type {LayerSpecification, VectorSourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { ItemId, ServiceUrlOrItemId, checkServiceUrlOrItemId, loadItemInfo, loadServiceInfo } from './Util';
import { warn } from './Request';
import { Map } from 'maplibre-gl';

type VectorTileServiceOptions = {
    accessToken?: string;
    portalUrl?: string;
}

type ItemInfo = {
    portalUrl: string;
    itemId: string;
    title?: string;
    accessInformation?: string; // Attribution information
    type?: string;
}
type ItemInfoResponse = {
    id: ItemId,
    url: string,
    title: string,
    type: string,
    accessInformation?:string,
    //spatialReference: string,

    //access: string, // TODO public || private || etc
} | any;

type ServiceInfo = {
    serviceUrl: string;
    serviceItemId?: string;  
    styleEndpoint?: string; // Usually "/resources/styles"
    tiles?: string[]; // Usually "[tile/{z}/{y}/{x}.pbf]"
}

type StyleSpec = {
    "version":number,
    "sprite":string,
    "glyphs":string,
    "sources":{[sourceName:string]:VectorSourceSpecification},
    "metadata"?:any,
    "layers":LayerSpecification[]
}

export class VectorTileService {

    accessToken: string;
    _serviceInfo : ServiceInfo;
    _itemInfo : ItemInfo;
    
    // For when there is only one source
    id?: string;
    source?: VectorSourceSpecification;

    sources: {[sourceName:string]:VectorSourceSpecification};
    layers: LayerSpecification[];


    _style: StyleSpec

    _created: boolean;
    _itemInfoLoaded: boolean;
    _styleLoaded: boolean;
    _map?:Map;
    
    constructor(urlOrId : ServiceUrlOrItemId, options? : VectorTileServiceOptions) {

        if (options?.accessToken) {
            this.accessToken = options.accessToken;
        }

        if (!urlOrId) {
            throw new Error('A service URL or Item ID is required for VectorTileService.');
        }

        const inputType = checkServiceUrlOrItemId(urlOrId);

        if (inputType === 'serviceUrl') {
            this._serviceInfo = {
                serviceUrl:urlOrId
            };
        }
        else if (inputType === 'itemId') {
            this._itemInfo = {
                itemId:urlOrId,
                portalUrl:options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com'
            };
        }
        this._created = false;
    }
    // actually creates the thing from an existing instance
    async createService() {

        this._styleLoaded = false;
        this._itemInfoLoaded = false;

        let setupMethod = this._itemInfo ? 'itemId' : 'serviceUrl';

        switch (setupMethod) {
            case 'itemId': {

                await this._getItemProperties();
                // --- vector-tile-specific info below here ---

                const params = {
                    token:this.accessToken,
                    portalUrl:this._itemInfo.portalUrl
                }
                // Load style info
                let styleInfo : StyleSpec | null = null;
                // Try loading default style name first
                try {
                    const rootStyle : any = await loadItemInfo(this._itemInfo.itemId,{
                        ...params,
                        endpoint:'/resources/styles/root.json'
                    });
                    //console.log('Item style request:',rootStyle);
                    styleInfo = rootStyle;
                // Check for other style resources associated with the item
                } catch (e) {
                    const itemResources : any = await loadItemInfo(this._itemInfo.itemId,{
                        ...params,
                        endpoint:'/resources'
                    });
                    //console.log('Item resource request:',itemResources);
                    let styleFile : string | null = null;
                    if (itemResources.total > 0) {
                        itemResources.resources.forEach(entry => {
                            if (entry.resource.startsWith('styles')) {
                                styleFile = entry.resource;
                            }
                        });
                    }
                    if (styleFile) {
                        const customStyle : StyleSpec = await loadItemInfo(this._itemInfo.itemId,{
                            ...params,
                            endpoint:`/resources/${styleFile}`
                        })
                         //console.log('Item style request:',customStyle);
                        styleInfo = customStyle;
                    }
                }

                if (styleInfo) {
                    this._setStyle(styleInfo);
                    break;
                }
                else {
                    warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...');
                    setupMethod = 'serviceUrl';
                }
            }
            case 'serviceUrl': {
                if (!this._serviceInfo.serviceUrl) throw new Error('No data service provided')

                const params = {
                    token:this.accessToken
                }

                // if we always need to get attribution then there's no point in requesting the default style first
                const serviceResponse : any = await loadServiceInfo(this._serviceInfo.serviceUrl,params);
                //console.log('Service request:',serviceResponse);
                if (!this._itemInfo) {
                    this._itemInfo = {
                        itemId:serviceResponse.serviceItemId,
                        portalUrl: 'https://www.arcgis.com' // TODO how on earth do we find the correct Enterprise URL here?
                    }
                }
                await this._getItemProperties();

                this._serviceInfo.tiles = serviceResponse.tiles;
                this._serviceInfo.styleEndpoint = serviceResponse.defaultStyles;

                const styleInfo : StyleSpec = await loadServiceInfo(this._serviceInfo.serviceUrl,{
                    ...params,
                    endpoint:`/${serviceResponse.defaultStyles}`
                });
                //console.log('Service style request:',styleInfo)

                if (!styleInfo) throw new Error('Failed to fetch style')

                this._setStyle(styleInfo);

                //throw new Error('Unable to load style information from service URL or item ID.')
            }
        }
        this._created = true;
        return this;
    }
    
    async _getItemProperties() {

        // --- Get metadata and attribution from item ---
        const itemResponse : any = await loadItemInfo(this._itemInfo.itemId,{
            token:this.accessToken,
            portalUrl:this._itemInfo.portalUrl
        });
        //console.log('Item request:',itemResponse);

        if (!itemResponse.url) throw new Error('Provided ArcGIS item ID has no associated data service.');
        // in feature collections, there is still data at the /data endpoint ...... just a heads up

        this._serviceInfo = {
            serviceUrl: itemResponse.url
        }
        this._itemInfo = {
            ...this._itemInfo,
            accessInformation: itemResponse.accessInformation,
            title: itemResponse.title,
            type: itemResponse.type
        }
    }

    _setStyle(styleInfoResponse : StyleSpec) {
        this._style = styleInfoResponse;

        // Finish creating sources
        Object.keys(this._style.sources).forEach(id => {
            const source = this._style.sources[id];

            if (source.url == '../../') source.url = this._serviceInfo.serviceUrl;
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

        // Public API
        this.sources = this._style.sources;
        this.layers = this._style.layers;
        // Common case: only one source
        if (Object.keys(this.sources).length == 1) {
            const id = Object.keys(this.sources)[0];
            this.id = id;
            this.source = this.sources[id];
        }
    }

    _loadServiceMetadata = async () => {
        // TODO
        // /metadata.json
    }

    addTo(map : Map) {
        if (!this._created) throw new Error('Service must be created first with createService() method.');
        this._map = map;

        Object.keys(this.sources).forEach(sourceId => {
            map.addSource(sourceId,this.sources[sourceId])
        })

        this.layers.forEach(layer => {
            map.addLayer(layer);
        })
    }

    // creates a vector tile service and returns its instance
    static async create(portalUrlOrId : ServiceUrlOrItemId, options : VectorTileServiceOptions) {
        const vectorService = new VectorTileService(portalUrlOrId,options);
        await vectorService.createService();
        return vectorService;
    }
}

/*
constructor(url)
create source and save it internally
create layer and save it internally

Add source
Add layers
Add service -> adds default source and layer
Get source
get layers
*/
        // request to service URL

        /* saving:
        name -> not sure tbh
        serviceItemId
        tiles (endpoint for tiles)

        initialExtent (??)
        capabilities (??)
        */
        // request to URL/resources/styles/root.json
        /*
        saving:

        version (style spec)
        sources object
        layers array
        */

        // request to URL/metadata.json
        /*

        saving:
        all attributes IF POSSIBLE and their enums
        lower priority
        */
export default VectorTileService;