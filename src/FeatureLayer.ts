import type { LayerSpecification, GeoJSONSourceSpecification} from "maplibre-gl";
import { HostedLayer } from "./HostedLayer";
import type { HostedLayerOptions } from "./HostedLayer";
import { checkItemId,checkServiceUrlType, cleanUrl } from "./Util";
import { 
    queryFeatures, getLayer, getService,
    type IQueryFeaturesResponse, type ILayerDefinition
 } from "@esri/arcgis-rest-feature-service";

/*
const geoJSONDefaultStyleMap = {
    "Point":"circle",
    "MultiPoint":"circle",
    "LineString":"line",
    "MultiLineString":"line",
    "Polygon":"fill",
    "MultiPolygon":"fill"
}
*/

const esriGeometryDefaultStyleMap : {[_:string]:'circle'|'line'|'fill'} = {
    "esriGeometryPoint":"circle",
    "esriGeometryMultipoint":"circle",
    "esriGeometryPolyline":"line",
    "esriGeometryPolygon":"fill",
    "esriGeometryEnvelope":"fill",
    "esriGeometryMultiPatch":"fill"
}
const defaultLayerPaintMap = {
    "circle": {
        "circle-color":"rgb(0,0,0)", 
    }, // "Esri blue" alternates: #4f81bd #365d8d
    "line": {
        "line-color":"rgb(0,0,0)",
        "line-width":3
    }, // "Esri blue" alternates: #0064ff
    "fill": {
        "fill-color":"rgba(0,0,0,0.25)", 
        "fill-outline-color":"rgb(0,0,0)",
    } // "Esri blue" alternates: #0064ff #6e6e6e
}
interface GeoJSONLayerOptions extends HostedLayerOptions {
    _inputType?: SupportedInputTypes;
    query?: object;
    sourceId?:string;
    layer?:LayerSpecification;
}

type SupportedInputTypes = "ItemId" | "FeatureService" | "FeatureLayer";

export class FeatureLayer extends HostedLayer {

    private _inputType: SupportedInputTypes

    private _serviceInfoLoaded: boolean;

    //accessToken?:string;
    //_ready: boolean;
    //_map?: Map;

    declare _sources: { [_: string]: GeoJSONSourceSpecification };
    declare _layers: LayerSpecification[];

    options?: GeoJSONLayerOptions;    

    constructor (serviceUrlOrId : string,options: GeoJSONLayerOptions) {
        super();

        this._serviceInfoLoaded = false;

        this.options = options ? options : {};

        if (options?.accessToken) this.accessToken = options.accessToken;

        if (options?._inputType) this._inputType = options._inputType;
        else {
            if (!(this._inputType=checkItemId(serviceUrlOrId))) this._inputType = checkServiceUrlType(serviceUrlOrId) as SupportedInputTypes;
        }

        if (this._inputType === 'FeatureLayer') {
            this._serviceInfo = {
                serviceUrl: cleanUrl(serviceUrlOrId)
            }
        }
        else if (this._inputType === 'FeatureService') {
            this._serviceInfo = {
                serviceUrl: cleanUrl(serviceUrlOrId)
            }
        }
        else if (this._inputType === 'ItemId') {
            throw new Error('Item IDs are not currently supported by GeoJSONLayer. Please provide a service URL referencing a layer instead.')
        }
        else throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS item ID or feature service URL.');

    }

    private async _fetchAllFeatures(layerUrl : string, layerInfo : ILayerDefinition) : Promise<GeoJSON.GeoJSON> {

        if (!layerInfo.supportedQueryFormats.includes('geoJSON')) throw new Error("Feature service does not support GeoJSON format.");
        if (!layerInfo.capabilities.includes("Query")) throw new Error("Feature service does not support queries.");
        if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error("Feature service does not support pagination in queries");
        
        let layerData : GeoJSON.GeoJSON;
        if (layerInfo.supportsExceedsLimitStatistics) {
            const exceedsLimitsResponse = await queryFeatures({
                url: layerUrl,
                outFields: [layerInfo.objectIdField],
                outStatistics: [
                    {
                        maxPointCount: 2000,
                        maxRecordCount: 2000,
                        maxVertexCount: 250000,
                        outStatisticFieldName: "exceedslimit",
                        // @ts-expect-error The "exceedslimit" statistic type has not yet been addeed to the REST API
                        statisticType: "exceedslimit"
                    }
                ],
                returnGeometry: false,
                spatialRel: "esriSpatialRelIntersects", // no idea if this is neccessary
                outSr: 102100, // no idea if this is neccessary
                params: {
                    cacheHint: true // I have no idea what this does
                }
            }) as IQueryFeaturesResponse;

            if (exceedsLimitsResponse.features[0].attributes.exceedslimit === 0) { 
                // TODO paginate once nextPage is supported by REST JS
                layerData = await queryFeatures({
                    url:layerUrl,
                    f: "geojson"
                }) as GeoJSON.GeoJSON;
            }
            else {
                // TODO what do we actually do when the limit is exceeded?
                throw new Error('Feature count exceeds the limits of this plugin. Please use the ArcGIS Maps SDK for JavaScript.');
            }
        }
        else {
            // TODO how to request data for enterprise, etc where exceedsLimit queries don't work?
            throw new Error('Layer does not support exceeds limit query');
        }
        if (!layerData) throw new Error('Unable to load data.');

        return layerData;
    }

    private async _loadLayer(layerUrl : string) : Promise<void> {
        const layerInfo = await getLayer({
            url:layerUrl,
            httpMethod:'GET'
        });
        console.log(layerInfo);

        const layerData = await this._fetchAllFeatures(layerUrl, layerInfo);

        // Create maplibre source and layer for data
        let sourceId = layerInfo.name;
        if (sourceId in this._sources) { // ensure source ID is unique
            sourceId += layerUrl[layerUrl.length-2]; // URL always ends in 0/, 1/, etc
        }
        this._sources[sourceId] = {
            type: 'geojson',
            attribution: this._itemInfo?.accessInformation ? this._itemInfo.accessInformation : layerInfo.copyrightText,
            data: layerData
        }

        const layerType = esriGeometryDefaultStyleMap[layerInfo.geometryType];
        const defaultLayer = {
            source: sourceId,
            id: `${sourceId}-layer`,
            type: layerType,
            paint: defaultLayerPaintMap[layerType]
        }
        this._layers.push(defaultLayer as LayerSpecification);

        return;
    }

    private async _loadData() : Promise<void> {

        this._sources = {};
        this._layers = [];

        let dataSource = this._inputType;
        switch (dataSource) {
            case "ItemId": {
                // TODO get service url and attribution from item here
                dataSource = 'FeatureService';
                // falls through
            }
            case "FeatureService": {
                const serviceInfo = await getService({
                    url: this._serviceInfo.serviceUrl,
                    authentication: this.accessToken
                });
                // Add layers
                if (serviceInfo.layers.length > 10) {
                    console.warn('The feature service provided contains more than 10 layers. Only the first 10 layers will be loaded.');
                }
                for (let i=0;(i<serviceInfo.layers.length) && (i < 10);i++) {
                    if (serviceInfo.layers[i]['subLayerIds']) {
                        console.warn('Feature layers with sublayers are not supported. This layer will not be added.');
                        return;
                    }
                    await this._loadLayer(`${this._serviceInfo.serviceUrl}${i}/`); // TODO test on a layer with tables
                }
                break;
            }
            case "FeatureLayer": {
                // Add single layer
                await this._loadLayer(this._serviceInfo.serviceUrl);
                break;
            }
        }
        this._serviceInfoLoaded = true;
    }

    private _createSourceId() {

        if (this.options.sourceId) return this.options.sourceId;

        const end = (this._serviceInfo.serviceUrl.indexOf('FeatureServer'))-1;
        if (end == -2) throw new Error('invalid URL');
        let i=end;
        while (this._serviceInfo.serviceUrl[i-1] !== '/') i--;

        return this._serviceInfo.serviceUrl.substring(i,end);
    }

    private async _handleAttribution() : Promise<void> {
        // 1. check item ID for information, prefer that
        // 2. check service for copyrightText
        // 3. check ..... ?
    }
    /*
    static async fromItemId (itemId: ItemId, options : GeoJSONLayerOptions) : Promise<GeoJSONLayer> {
        const vtl = new GeoJSONLayer(itemId,options);
        await vtl.initialize();
        return vtl;
    }
    */
    async initialize() : Promise<FeatureLayer> {
        // await this._loadAttribution();
        await this._loadData();
        // Public API is read-only
        this._definePublicApi();
        this._ready = true;
        return this;
    }

    static async fromLayerUrl (layerUrl: string, options : GeoJSONLayerOptions) : Promise<FeatureLayer> {

        if (checkServiceUrlType(layerUrl) !== 'FeatureLayer') throw new Error('Must provide a valid feature layer endpoint, e.g. \/0, \/1, etc');

        const geojsonLayer = new FeatureLayer(layerUrl,{
            ...options,
            _inputType: 'FeatureLayer'
        });
        await geojsonLayer.initialize();
        return geojsonLayer;
    }
    static async fromServiceUrl (serviceUrl:string, options:GeoJSONLayerOptions) : Promise<FeatureLayer> {

        console.log(checkServiceUrlType(serviceUrl))
        if (checkServiceUrlType(serviceUrl) !== 'FeatureService') throw new Error('Must provide a valid feature service endpoint.');

        const geojsonLayer = new FeatureLayer(serviceUrl,{
            ...options,
            _inputType: 'FeatureService'
        });
        await geojsonLayer.initialize();
        return geojsonLayer;
    }
}

export default FeatureLayer;