import type {SourceSpecification, LayerSpecification, VectorSourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { VectorTileSource } from 'maplibre-gl';
import type { AddLayerObject } from 'maplibre-gl';
import { ItemId, ServiceUrlOrItemId, checkServiceUrlOrItemId, loadItemInfo, loadServiceInfo } from './Util';
import { warn } from './Request';
/*
map.addSource
map.addLayer

maplibregl.Esri.vectorTileSource(itemId/URL)

needs to handle:
source-layer property
source property
*/


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
    tiles?: string; // Usually "tile/{z}/{y}/{x}.pbf"
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

    _itemInfoLoaded: boolean;
    _styleLoaded: boolean;

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
    }
    // actually creates the thing from an existing instance
    async createService() {

        this._styleLoaded = false;
        this._itemInfoLoaded = false;

        if (this._itemInfo) {
            // get info from item id url

            // TODO are there typescript types for rest api objects?
            // this initial request is ONLY necessary for attribution, and potentially service url if no style is saved to the item
            const itemResponse : any = await loadItemInfo(this._itemInfo.itemId,{
                token:this.accessToken,
                portalUrl:this._itemInfo.portalUrl
            });
            console.log(itemResponse);
            if (!itemResponse.url) throw new Error('Provided ArcGIS item ID has no associated data service.');

            this._serviceInfo = {
                serviceUrl: itemResponse.url
            }
            this._itemInfo = {
                ...this._itemInfo,
                accessInformation: itemResponse.accessInformation,
                title: itemResponse.title,
                type: itemResponse.type
            }


            // Check for style resources associated with the item
            const itemResources : any = await loadItemInfo(this._itemInfo.itemId,{
                token:this.accessToken,
                portalUrl:this._itemInfo.portalUrl,
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
                const styleInfo : StyleSpec = await loadItemInfo(this._itemInfo.itemId,{
                    token:this.accessToken,
                    portalUrl:this._itemInfo.portalUrl,
                    endpoint:`/resources/${styleFile}`
                })
                this._setStyle(styleInfo);
            }
            else {
                // TODO load style from service url here instead
                warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...')
            }
            /*
                // 2. if error, load style from service url
                loadServiceInfo()
                loadStyleFromService()
            */
        }

        /*
        else if (this._serviceInfo.serviceUrl) {
            // item ID
            // default style URL
            // title URL
            loadServiceInfo()
            loadStyleFromService()
            
            loadItemInfo()
        }
        */
        // create maplibre style source

        // create maplibre style layers...

        return this;
    }
    _setStyle(styleInfoResponse : StyleSpec) {
        this._style = styleInfoResponse;

        // Public API
        this.sources = this._style.sources;
        this.layers = this._style.layers;

        // Sanitize sources
        if (this._itemInfo.accessInformation) {
            Object.keys(this.sources).forEach(id => {

                if (this.accessToken) {
                    if (this.sources[id].url) this.sources[id].url = `${this.sources[id].url}?token=${this.accessToken}`;
                    if (this.sources[id].tiles) this.sources[id].tiles = this.sources[id].tiles.map((tileUrl) => `${tileUrl}?token=${this.accessToken}`);
                }

                this.sources[id].attribution = this._itemInfo.accessInformation;
            })
        }

        // Common case: only one source
        if (Object.keys(this._style.sources).length == 1) {
            const id = Object.keys(this._style.sources)[0];
            this.id = id;
            this.source = this._style.sources[id];
        }

    }
    createLayer() {
    }

    createSource() {
    }
    
    loadStyleFromItem = async (itemId, options) => {
    }

    loadStyleFromService = async (serviceUrl, options) => {
        // default: /resources/styles
    }

    loadServiceMetadata = async (serviceUrl, options) => {
        // /metadata.json
    }

    // creates a vector tile service and returns its instance
    static async create(portalUrlOrId : ServiceUrlOrItemId, options : VectorTileServiceOptions) {
        const vectorService = new VectorTileService(portalUrlOrId,options);
        await vectorService.createService();
        return vectorService;
    }
    
    // what does loadService do?
    // 1. load item info
    // 2. load service info
    // 3. load style info

    // loadItemInfo
    // loadServiceInfo
    // loadStyleInfo
    // loadServiceMetadata

    // create source and layers

}
/*
Case 1: single Source, single Layer

Case 2: single Source, multiple Layers

Case 3: multiple Source, multiple Layers -> handle later
*/


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