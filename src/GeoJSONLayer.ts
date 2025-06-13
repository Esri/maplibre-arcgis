import { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import {HostedLayer,ServiceInfo,ItemInfo} from "./HostedLayer";
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

export class GeoJSONLayer implements HostedLayer {

    accessToken?:string;
    _inputType: "itemId" | "serviceUrl";

    _serviceInfo:ServiceInfo;
    _serviceInfoLoaded:boolean;
    
    _itemInfo: ItemInfo;
    _itemInfoLoaded: boolean;

    _data: any;
    _dataLoaded: boolean;
    _ready: boolean;

    sources: { [_: string]: SourceSpecification; };
    layers: LayerSpecification[];
    
    _map?: Map;

    // -------- properties unique to GeoJSONLayer
    _geometryType: GeometryTypes;

    constructor (serviceUrl : string,options: GeoJSONLayerOptions) {
        this._serviceInfo = {
            serviceUrl: serviceUrl,
            serviceItemPortalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com',
        }
        this._serviceInfoLoaded = false;
        this._ready = false;

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
        await this._loadData();
        this._createSourcesAndLayers();
        this._ready = true;
        return this;
    }

    addSourcesAndLayersTo(map : Map, index: number = 0) : GeoJSONLayer {
        if (!this._ready) throw new Error('Hosted layer has not finished loading.');

        this._map = map;

        Object.keys(this.sources).forEach(sourceId => {
            map.addSource(sourceId,this.sources[sourceId])
        });
        this.layers.forEach(layer => {
            map.addLayer(layer);
        });

        return this;
    }

    get source () : SourceSpecification {
        const sourceIds = Object.keys(this.sources)
        if (sourceIds.length == 1) return this.sources[sourceIds[0]];
        else throw new Error('Hosted layer contains multiple sources. Use property \'sources\' instead of \'source\'.');
    }
    get sourceId () : string {
        const sourceIds = Object.keys(this.sources);
        if (sourceIds.length == 1) return sourceIds[0];
        else throw new Error('Hosted layer contains multiple sources. Use property \'sources\' instead of \'sourceId\'.');
    }
    get layer () : LayerSpecification {
        if (this.layers.length == 1) return this.layers[0];
        else throw new Error('Hosted layer contains multiple style layers. Use property \'layers\' instead of \'layer\'.');
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