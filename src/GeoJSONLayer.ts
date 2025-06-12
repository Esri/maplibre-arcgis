import { LayerSpecification, Map, SourceSpecification } from "maplibre-gl";
import type {HostedLayer,ServiceInfo,ItemInfo} from "./HostedLayer";
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

    _serviceInfo:ServiceInfo;
    _serviceInfoLoaded:boolean;

    _data: any;
    _dataLoaded: boolean;

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

        if (options.accessToken) this.accessToken = options.accessToken;
        if (options.type) this._geometryType = options.type;
        else throw new Error('Must provide a valid GeoJSON type in current implementation.');
    }

    async loadData() : Promise<void> {
        this._data = await queryFeatures({
            url:this._serviceInfo.serviceUrl,
            f: "geojson"
        });
        this._dataLoaded = true;
        //console.log(this._data);
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

    async addSourceAndLayerTo(map : Map, index: number = 0) {
        if (!this._dataLoaded) await this.loadData();
        this._createDefaultStyle();

        map.addSource(this.sourceId,this.source);

        this.layers.forEach(layer=>{
            map.addLayer(layer);
        });

        return this;
    }

    async addSourcesAndLayersTo(map: Map): Promise<HostedLayer> {
        return this;
    }




    async _loadServiceInfo(): Promise<void> {}
    _itemInfo: ItemInfo;
    _itemInfoLoaded: boolean;
    _inputType: "itemId" | "serviceUrl";
    async _loadItemInfo(): Promise<void> {}

    //loadStyle() {
        // request to URL
        // https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0
    //}
}

export default GeoJSONLayer;