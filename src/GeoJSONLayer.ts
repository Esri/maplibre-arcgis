import { LayerSpecification, Map, GeoJSONSourceSpecification} from "maplibre-gl";
import { HostedLayer } from "./HostedLayer";
import type { DataServiceInfo, HostedLayerOptions, ItemInfo } from "./HostedLayer";
import { queryFeatures, getLayer, IQueryFeaturesResponse, GeometryType, ILayerDefinition, IStatisticDefinition } from "@esri/arcgis-rest-feature-service";

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

const esriGeometryDefaultStyleMap = {
    "esriGeometryPoint":"circle",
    "esriGeometryMultipoint":"circle",
    "esriGeometryPolyline":"line",
    "esriGeometryPolygon":"fill",
    "esriGeometryEnvelope":"fill",
    "esriGeometryMultiPatch":"fill"
}

interface GeoJSONLayerOptions extends HostedLayerOptions {
    query?: Object;
    sourceId?:string;
    layer?:LayerSpecification;
}

interface GeoJSONServiceInfo extends DataServiceInfo {
    geometryType?:GeometryType;
}

export class GeoJSONLayer extends HostedLayer {

    accessToken?:string;
    _inputType: "itemId" | "serviceUrl";

    _ready: boolean;
    _map?: Map;

    _serviceInfo: GeoJSONServiceInfo;
    _serviceInfoLoaded: boolean;

    _itemInfo: ItemInfo;

    _sources: { [_: string]: GeoJSONSourceSpecification };
    _layers: LayerSpecification[];

    options?:GeoJSONLayerOptions;

    _data: any;
    _dataLoaded: boolean;

    constructor (serviceUrl : string,options: GeoJSONLayerOptions) {
        super();

        this._serviceInfo = {
            serviceUrl: serviceUrl,
            serviceItemPortalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com',
        }

        this._dataLoaded = false;
        this._serviceInfoLoaded = false;
        this._ready = false;

        this.options = options ? options : {};

        if (options?.accessToken) this.accessToken = options.accessToken;

    }

    async _loadData() : Promise<void> {

        type IFeatureLayerDefinition = ILayerDefinition & {
            serviceItemId:string;
            supportsExceedsLimitStatistics:boolean;
        }

        const layerInfo = await getLayer({
            url:this._serviceInfo.serviceUrl,
            httpMethod:'GET'
        }) as IFeatureLayerDefinition;
        this._serviceInfo = {
            ...this._serviceInfo,
            geometryType: layerInfo.geometryType,
            copyrightText: layerInfo.copyrightText,
            serviceItemId: layerInfo.serviceItemId
        }
        this._serviceInfoLoaded = true;

        if (!layerInfo.supportedQueryFormats.includes('geoJSON')) throw new Error("Feature service does not support GeoJSON format.");
        if (!layerInfo.capabilities.includes("Query")) throw new Error("Feature service does not support queries.");
        if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error("Feature service does not support pagination in queries");

        if (layerInfo.supportsExceedsLimitStatistics) {
            const exceedsLimitsResponse = await queryFeatures({
                url: this._serviceInfo.serviceUrl,
                outFields: [layerInfo.objectIdField],
                outStatistics: [
                    {
                        maxPointCount: 2000,
                        maxRecordCount: 2000,
                        maxVertexCount: 250000,
                        outStatisticFieldName: "exceedslimit",
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
                // TODO PAGINATE DATA HERE
                this._data = await queryFeatures({
                    url:this._serviceInfo.serviceUrl,
                    f: "geojson"
                });
                this._dataLoaded = true;
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

        return;
    }

    _createSourceId() {

        if (this.options.sourceId) return this.options.sourceId;

        const end = (this._serviceInfo.serviceUrl.indexOf('FeatureServer'))-1;
        if (end == -2) throw new Error('invalid URL');
        let i=end;
        while (this._serviceInfo.serviceUrl[i-1] !== '/') i--;

        return this._serviceInfo.serviceUrl.substring(i,end);
    }
    
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
                type:esriGeometryDefaultStyleMap[this._serviceInfo.geometryType],
                // TODO default "esri blue" paint style for all layer types
            }
            layers.push(defaultLayer);
        }

        this._sources = sources;
        this._layers = layers;
        // Public API is read-only
        this._definePublicApi();
    }

    async initialize() : Promise<GeoJSONLayer> {

        // await this._loadAttribution();
        await this._loadData();

        this._createSourcesAndLayers();

        this._ready = true;
        return this;
    }

    async _handleAttribution() : Promise<void> {
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
    static async fromLayerUrl (layerUrl: string, options : GeoJSONLayerOptions) : Promise<GeoJSONLayer> {
        const vtl = new GeoJSONLayer(layerUrl,options);
        await vtl.initialize();
        return vtl;
    }
}

export default GeoJSONLayer;