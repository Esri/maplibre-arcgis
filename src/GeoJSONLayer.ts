import { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import {HostedLayer,DataServiceInfo,ItemInfo} from "./HostedLayer";
import { queryFeatures } from "@esri/arcgis-rest-feature-service";

type GeoJSONLayerOptions = {
    accessToken?: string;
    portalUrl?:string;
    type: GeometryTypes;
    query?: Object;
    layer: {
        layout?:any;
        paint:any;
    };
    source: {
        id:string;
    }
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

    sources: { [_: string]: SourceSpecification; };
    layers: LayerSpecification[];
    
    _map?: Map;

    // -------- properties unique to GeoJSONLayer
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

        if (options.accessToken) this.accessToken = options.accessToken;
        if (options.type) this._geometryType = options.type;
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
        const end = (this._serviceInfo.serviceUrl.indexOf('FeatureServer'))-1;
        if (end == -2) throw new Error('invalid URL');
        let i=end;
        while (this._serviceInfo.serviceUrl[i-1] !== '/') i--;

        return this._serviceInfo.serviceUrl.substring(i,end);
    }

    _createDefaultStyle() {
        if (!this._dataLoaded) throw new Error('Cannot create style without data.');
        this.sources = {};
        this.sources[this._createSourceId()] = {
            type:'geojson',
            data:this._data
        };
        this.layers = [{
            id:`${this.sourceId}-layer`,
            source:this.sourceId,
            type:defaultGeometryStyleMap[this._geometryType]
        }];
    }

    async _loadServiceInfo(): Promise<void> {}
    async _loadItemInfo(): Promise<void> {}
    
    _createSourcesAndLayers(): void {
        this._createDefaultStyle();
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