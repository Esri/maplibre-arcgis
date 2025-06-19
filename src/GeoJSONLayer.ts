import { LayerSpecification, Map, GeoJSONSourceSpecification} from "maplibre-gl";
import { HostedLayer } from "./HostedLayer";
import type { DataServiceInfo,ItemInfo,HostedLayerOptions } from "./HostedLayer";
import { queryFeatures } from "@esri/arcgis-rest-feature-service";

type GeoJSONLayerOptions = HostedLayerOptions & {
    type?: GeometryTypes;
    query?: Object;
    sourceId?:string;
    layer?:LayerSpecification;
}
type GeometryTypes = "Point" | "LineString" | "Polygon" | "MultiPoint" | "MultiLineString" | "MultiPolygon";

const defaultGeometryStyleMap = {
    "Point":"circle",
    "LineString":"line",
    "Polygon":"fill"
}

export class GeoJSONLayer extends HostedLayer {

    accessToken?:string;
    _inputType: "itemId" | "serviceUrl";

    _serviceInfo:DataServiceInfo;
    _serviceInfoLoaded:boolean;
    
    _itemInfo: ItemInfo;
    _itemInfoLoaded: boolean;

    _ready: boolean;
    _map?: Map;

    // -------- properties unique to GeoJSONLayer
    _sources: { [_: string]: GeoJSONSourceSpecification };
    _layers: LayerSpecification[];

    options?:GeoJSONLayerOptions;

    _geometryType: GeometryTypes;
    _data: any;
    _dataLoaded: boolean;

    constructor (serviceUrl : string,options: GeoJSONLayerOptions) {
        super();

        this._serviceInfo = {
            serviceUrl: serviceUrl,
            serviceItemPortalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com',
        }

        this._dataLoaded = false;

        if (options) this.options = options;
        if (options?.accessToken) this.accessToken = options.accessToken;

        else throw new Error('Must provide a valid GeoJSON type in current implementation.');
    }

    async _loadData() : Promise<void> {
        this._data = await queryFeatures({
            url:this._serviceInfo.serviceUrl,
            f: "geojson"
        });
        this._dataLoaded = true;
    }

    _createSourceId() {

        if (this.options.sourceId) return this.options.sourceId;

        const end = (this._serviceInfo.serviceUrl.indexOf('FeatureServer'))-1;
        if (end == -2) throw new Error('invalid URL');
        let i=end;
        while (this._serviceInfo.serviceUrl[i-1] !== '/') i--;

        return this._serviceInfo.serviceUrl.substring(i,end);
    }

    async _loadServiceInfo(): Promise<void> {}
    async _loadItemInfo(): Promise<void> {}
    
    _createSourcesAndLayers(): void {
        if (!this._dataLoaded) throw new Error('Cannot create style without data.');
        
        const sourceId = this._createSourceId();
        const sources = {};
        sources[sourceId] = {
            type:'geojson',
            data:this._data
        };

        const layers = [];
        if (this.options.layer) {
            const customLayer = {
                source:sourceId,
                ...this.options.layer
            }
            layers.push(customLayer);
        }
        else {
            const defaultLayer = {
                source:sourceId,
                id:`${sourceId}-layer`,
                type:defaultGeometryStyleMap[this._geometryType]
            }
            layers.push(defaultLayer);
        }

        this._sources = sources;
        this._layers = layers;
        // Public API is read-only
        this._definePublicApi();
    }

    async initialize() : Promise<GeoJSONLayer> {
        await this._loadItemInfo();
        await this._loadServiceInfo();

        await this._loadData();

        this._createSourcesAndLayers();

        this._ready = true;
        return this;
    }

    /*
    static async fromItemId (itemId: ItemId, options : GeoJSONLayerOptions) : Promise<GeoJSONLayer> {
        const vtl = new GeoJSONLayer(itemId,options);
        await vtl.initialize();
        return vtl;
    }
    */
    static async fromServiceUrl (serviceUrl: string, options : GeoJSONLayerOptions) : Promise<GeoJSONLayer> {
        const vtl = new GeoJSONLayer(serviceUrl,options);
        await vtl.initialize();
        return vtl;
    }
}

export default GeoJSONLayer;