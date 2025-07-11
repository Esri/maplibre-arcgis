import type { LayerSpecification, GeoJSONSourceSpecification} from "maplibre-gl";
import { HostedLayer } from "./HostedLayer";
import type { HostedLayerOptions } from "./HostedLayer";
import { checkItemId,checkServiceUrlType, cleanUrl } from "./Util";
import { 
    queryFeatures, getLayer, getService,
    type IQueryFeaturesResponse, 
    type ILayerDefinition, 
    type IGeometry,
    type GeometryType,
    type ISpatialReference,
    type SpatialRelationship
 } from "@esri/arcgis-rest-feature-service";
import { getItem } from "@esri/arcgis-rest-portal";
import { ApiKeyManager, type IParams } from "@esri/arcgis-rest-request";

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
    _inputType?: ISupportedInputTypes;
    query?: QueryOptions;
}

interface QueryOptions {
    gdbVersion?:string;
    geometry?:IGeometry;
    geometryType?:GeometryType;
    geometryPrecision?:number;
    inSR?:string|ISpatialReference;
    outFields?:string[]|"*";
    params?:IParams;
    spatialRel?:SpatialRelationship;
    sqlFormat?:"none"|"standard"|"native";
    where?:string;
}

type ISupportedInputTypes = "ItemId" | "FeatureService" | "FeatureLayer";
const SupportedInputTypes = ["ItemId","FeatureService","FeatureLayer"];

export class FeatureLayer extends HostedLayer {

    private _inputType: ISupportedInputTypes

    //private _serviceInfoLoaded: boolean;

    //accessToken?:string;
    //_ready: boolean;
    //_map?: Map;

    declare _sources: { [_: string]: GeoJSONSourceSpecification };
    declare _layers: LayerSpecification[];

    query?:QueryOptions;

    constructor (serviceUrlOrId : string,options: GeoJSONLayerOptions) {
        super();

        if (options?.authentication) this.authentication = options.authentication;
        else if (options?.accessToken) this.authentication = ApiKeyManager.fromKey(options.accessToken);
        
        if (options?.attribution) this._customAttribution = options.attribution;

        // Determine input type
        if (options?._inputType && options._inputType in SupportedInputTypes) {
            this._inputType = options._inputType;
        }
        else {
            const isItem = checkItemId(serviceUrlOrId);
            const isValidUrl = checkServiceUrlType(serviceUrlOrId);
            if (isItem) this._inputType = isItem;
            else if (isValidUrl  === 'FeatureLayer' || isValidUrl === 'FeatureService') this._inputType = isValidUrl;
            else throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS item ID or vector tile service URL.');
        }

        if (options?.query) {
            if (this._inputType !== 'FeatureLayer') throw new Error('Query options are only supported on individual feature layers, not on feature services or item IDs. Please provide a feature layer URL ending in \/0, \/1, etc.');

            this.query = options.query;
        }
        
        // Set up
        if (this._inputType=='ItemId') {
            this._itemInfo = {
                itemId:serviceUrlOrId,
                portalUrl:options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com/sharing/rest'
            }            
        }
        else if (this._inputType === 'FeatureLayer' || this._inputType === 'FeatureService') {
            this._serviceInfo = {
                serviceUrl: cleanUrl(serviceUrlOrId)
            }
        }
        else {
            throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS portal item ID or feature service URL.');
        }
    }

    private async _fetchAllFeatures(layerUrl : string, layerInfo : ILayerDefinition) : Promise<GeoJSON.GeoJSON> {

        if (!layerInfo.supportedQueryFormats.includes('geoJSON')) throw new Error("Feature service does not support GeoJSON format.");
        if (!layerInfo.capabilities.includes("Query")) throw new Error("Feature service does not support queries.");
        if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error("Feature service does not support pagination in queries");
        
        let layerData : GeoJSON.GeoJSON;
        if (layerInfo.supportsExceedsLimitStatistics) {
            const exceedsLimitsResponse = await queryFeatures({
                authentication:this.authentication,
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
                    authentication:this.authentication,
                    url:layerUrl,
                    f: "geojson",
                    ...this.query
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
            authentication:this.authentication,
            url:layerUrl,
            httpMethod:'GET'
        });

        const layerData = await this._fetchAllFeatures(layerUrl, layerInfo);

        // Create maplibre source and layer for data
        let sourceId = layerInfo.name;
        if (sourceId in this._sources) { // ensure source ID is unique
            sourceId += layerUrl[layerUrl.length-2]; // URL always ends in 0/, 1/, etc
        }
        this._sources[sourceId] = {
            type: 'geojson',
            attribution: this._setupAttribution(layerInfo),
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
                const itemResponse = await getItem(this._itemInfo.itemId,{
                    authentication:this.authentication,
                    portal:this._itemInfo.portalUrl
                });
                
                if (!itemResponse.url) throw new Error('The provided ArcGIS portal item has no associated service URL.');
                // in feature collections, there is still data at the /data endpoint ...... just a heads up

                this._itemInfo = {
                    ...this._itemInfo,
                    accessInformation:itemResponse.accessInformation,
                    title: itemResponse.title,
                    description: itemResponse.description,
                    access: itemResponse.access,
                    orgId: itemResponse.orgId,
                    licenseInfo: itemResponse.licenseInfo
                }
                this._serviceInfo = {
                    serviceUrl:itemResponse.url
                }
                dataSource = 'FeatureService';
                // falls through
            }
            case "FeatureService": {
                const serviceInfo = await getService({
                    url: this._serviceInfo.serviceUrl,
                    authentication: this.authentication
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
                    await this._loadLayer(`${cleanUrl(this._serviceInfo.serviceUrl)}${i}/`); // TODO test on a layer with tables
                }
                break;
            }
            case "FeatureLayer": {
                // Add single layer
                await this._loadLayer(this._serviceInfo.serviceUrl);
                break;
            }
        }
    }

    private _setupAttribution(layerInfo:ILayerDefinition) : string {
        if (this._customAttribution) return this._customAttribution;

        if (this._itemInfo?.accessInformation) return this._itemInfo.accessInformation;

        if (this._serviceInfo?.copyrightText) return this._serviceInfo.copyrightText;

        if (layerInfo.copyrightText) return layerInfo.copyrightText;

        return '';
    }

    async initialize() : Promise<FeatureLayer> {
        await this._loadData();
        // Public API is read-only
        this._definePublicApi();
        this._ready = true;
        return this;
    }

    static async fromUrl (serviceUrl:string, options:GeoJSONLayerOptions) : Promise<FeatureLayer> {
        const inputType = checkServiceUrlType(serviceUrl);
        if (inputType !== 'FeatureService' && inputType !== 'FeatureLayer') throw new Error('Must provide a valid feature service or feature layer.');

        const geojsonLayer = new FeatureLayer(serviceUrl,{
            ...options,
            _inputType: inputType
        });
        await geojsonLayer.initialize();
        return geojsonLayer;
    }
    static async fromPortalItem (itemId:string, options:GeoJSONLayerOptions) : Promise<FeatureLayer> {

        if (checkItemId(itemId) !== 'ItemId') throw new Error('Must provide a valid item ID from an ArcGIS portal item.');

        const geojsonLayer = new FeatureLayer(itemId,{
            ...options,
            _inputType:'ItemId'
        });
        await geojsonLayer.initialize();
        return geojsonLayer;
    }
}

export default FeatureLayer;