import type {LayerSpecification, VectorSourceSpecification} from '@maplibre/maplibre-gl-style-spec';
import { ItemId, ServiceUrlOrItemId, checkServiceUrlOrItemId, loadItemInfo, loadServiceInfo } from './Util';
import { warn } from './Request';

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

        let setupMethod = this._itemInfo ? 'itemId' : 'serviceUrl';

        switch (setupMethod) {
            case 'itemId': {
                const params = {
                    token:this.accessToken,
                    portalUrl:this._itemInfo.portalUrl
                }
                // --- Get metadata and attribution from item ---
                const itemResponse : any = await loadItemInfo(this._itemInfo.itemId,params);
            console.log('Item request:',itemResponse);

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

                // --- vector-tile-specific info below here ---

                // Load style info
                let styleInfo : StyleSpec | null = null;
                // Try loading default style name first
                try {
                    const rootStyle : any = await loadItemInfo(this._itemInfo.itemId,{
                        ...params,
                        endpoint:'/resources/styles/root.json'
                    });
            console.log('Item style request:',rootStyle);
                    styleInfo = rootStyle;
                // Check for other style resources associated with the item
                } catch (e) {
                    const itemResources : any = await loadItemInfo(this._itemInfo.itemId,{
                        ...params,
                        endpoint:'/resources'
                    });
            console.log('Item resource request:',itemResources);
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
            console.log('Item style request:',customStyle);
                        styleInfo = customStyle
                    }
                }

                if (styleInfo) {
                    this._setStyle(styleInfo);
                    break;
                }
                else {
                    // TODO load style from service url here instead
                    warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...');
                    setupMethod = 'serviceUrl';
                }
            }
            case 'serviceUrl': {
                console.log(setupMethod);
                console.log('now we here');

            }
        }

            


            /*
                // 2. if error, load style from service url
                loadServiceInfo()
                loadStyleFromService()
            */
        // Service URL provided
            // item ID
            // default style URL
            // title URL
            //loadServiceInfo() - to find the style file. it will almost always be default, ok to try with default first then continue
            //loadStyleFromService()
            //loadItemInfo() - for attribution
        // create maplibre style source

        // create maplibre style layers...

        return this;
    }
    _setStyle(styleInfoResponse : StyleSpec) {
        this._style = styleInfoResponse;

        // Finish creating sources
        Object.keys(this._style.sources).forEach(id => {
            const source = this._style.sources[id];

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