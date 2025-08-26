import type { GeometryType, IGeometry, ILayerDefinition, IQueryResponse, ISpatialReference, SpatialRelationship } from '@esri/arcgis-rest-feature-service';
import { getLayer, getService, queryAllFeatures, queryFeatures } from '@esri/arcgis-rest-feature-service';
import { getItem } from '@esri/arcgis-rest-portal';
import { type IParams } from '@esri/arcgis-rest-request';
import type { GeoJSONSourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { HostedLayerOptions } from './HostedLayer';
import { HostedLayer } from './HostedLayer';
import { checkItemId, checkServiceUrlType, cleanUrl, warn } from './Util';

/*
 *const geoJSONDefaultStyleMap = {
 *    "Point":"circle",
 *    "MultiPoint":"circle",
 *    "LineString":"line",
 *    "MultiLineString":"line",
 *    "Polygon":"fill",
 *    "MultiPolygon":"fill"
 *}
 */

const esriGeometryDefaultStyleMap: { [_: string]: 'circle' | 'line' | 'fill' } = {
  esriGeometryPoint: 'circle',
  esriGeometryMultipoint: 'circle',
  esriGeometryPolyline: 'line',
  esriGeometryPolygon: 'fill',
  esriGeometryEnvelope: 'fill',
  esriGeometryMultiPatch: 'fill',
};

const defaultLayerPaintMap = {
  circle: {
    'circle-color': 'rgb(0,0,0)',
  }, // "Esri blue" alternates: #4f81bd #365d8d
  line: {
    'line-color': 'rgb(0,0,0)',
    'line-width': 3,
  }, // "Esri blue" alternates: #0064ff
  fill: {
    'fill-color': 'rgba(0,0,0,0.25)',
    'fill-outline-color': 'rgb(0,0,0)',
  }, // "Esri blue" alternates: #0064ff #6e6e6e
};
/**
 * Supported options for instantiating a GeoJSONLayer.
 */
export interface GeoJSONLayerOptions extends HostedLayerOptions {
  itemId?: string;
  url?: string;
  query?: QueryOptions;
}

/**
 * Options for querying a feature layer.
 */
export interface QueryOptions {
  gdbVersion?: string;
  geometry?: IGeometry;
  geometryType?: GeometryType;
  geometryPrecision?: number;
  inSR?: string | ISpatialReference;
  outFields?: string[] | '*';
  params?: IParams;
  spatialRel?: SpatialRelationship;
  sqlFormat?: 'none' | 'standard' | 'native';
  where?: string;
}

type ISupportedInputTypes = 'ItemId' | 'FeatureService' | 'FeatureLayer';

/**
 * Class representing a feature layer for MapLibre GL JS.
 * This class allows you to load and display [ArcGIS feature layers](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/feature-services/introduction/) as GeoJSON sources in MapLibre.
 * It supports both item IDs from ArcGIS Online and feature service URLs.
 */
export class FeatureLayer extends HostedLayer {
  declare protected _sources: { [_: string]: GeoJSONSourceSpecification };
  declare protected _layers: LayerSpecification[];

  private _inputType: ISupportedInputTypes;

  query?: QueryOptions;

  constructor(options: GeoJSONLayerOptions) {
    super();

    if (!options || !(options.itemId || options.url)) throw new Error('Feature layer must be constructed with either an \'itemId\' or \'url\'.');

    if (options?.authentication) this.authentication = options.authentication;
    else if (options?.token) this.authentication = options.token;

    if (options?.attribution) this._customAttribution = options.attribution;

    if (options.itemId && options.url) console.warn('Both an item ID and service URL have been passed to the constructor. The item ID will be preferred, and the URL ignored.');

    if (options.itemId && checkItemId(options.itemId) == 'ItemId') this._inputType = 'ItemId';
    else {
      const urlType = checkServiceUrlType(options.url);
      if (urlType && (urlType == 'FeatureLayer' || urlType == 'FeatureService')) this._inputType = urlType;
      else throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS item ID or vector tile service URL.');
    }

    // Set up
    if (this._inputType == 'ItemId') {
      this._itemInfo = {
        itemId: options.itemId,
        portalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com/sharing/rest',
      };
    }
    else if (this._inputType === 'FeatureLayer') {
      this._serviceInfo = {
        serviceUrl: cleanUrl(options.url),
      };
    }
    else if (this._inputType === 'FeatureService') {
      warn('The provided service URL does not point to any specific feature layer. Layer \'/0\' will be loaded from the service automatically.');
      this._serviceInfo = {
        serviceUrl: `${cleanUrl(options.url)}0`,
      };
      this._inputType = 'FeatureLayer';
    }
    else {
      throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS portal item ID or feature service URL.');
    }

    if (options?.query) {
      if (this._inputType !== 'FeatureLayer') throw new Error('Feature service queries are only supported with layer URLs, not item IDs. To use query parameters, call \'FeatureLayer.fromUrl\' with a service URL ending in \/0, \/1, etc.');

      this.query = options.query;
    }
  }

  private async _fetchAllFeatures(layerUrl: string, layerInfo: ILayerDefinition): Promise<GeoJSON.GeoJSON> {
    if (!layerInfo.supportedQueryFormats.includes('geoJSON')) throw new Error('Feature service does not support GeoJSON format.');
    if (!layerInfo.capabilities.includes('Query')) throw new Error('Feature service does not support queries.');
    if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error('Feature service does not support pagination in queries');

    let layerData: GeoJSON.GeoJSON;
    if (layerInfo.supportsExceedsLimitStatistics) {
      // Check if feature count exceeds limit
      const featureCount = await queryFeatures({
        url: layerUrl,
        authentication: this.token,
        ...this.query,
        returnCountOnly: true,
      }) as IQueryResponse;
      if (featureCount.count > 2000) {
        console.warn('You are loading a large feature layer ( >2000 features) as GeoJSON. This may take some time; consider hosting your data as a vector tile layer instead.');
      }

      // Get all features
      const response = await queryAllFeatures({
        url: layerUrl,
        authentication: this.token,
        ...this.query,
        f: 'geojson',
      });

      layerData = response as unknown as GeoJSON.GeoJSON;
    }
    else {
      throw new Error('Feature layers hosted in old versions of ArcGIS Enterprise are not currently supported in this plugin. Support will be added in a future release: https://github.com/ArcGIS/maplibre-arcgis/issues/5');
    }
    if (!layerData) throw new Error('Unable to load data.');

    return layerData;
  }

  private async _loadLayer(layerUrl: string): Promise<void> {
    const layerInfo = await getLayer({
      authentication: this.authentication,
      url: layerUrl,
      httpMethod: 'GET',
    });

    const layerData = await this._fetchAllFeatures(layerUrl, layerInfo);

    // Create maplibre source and layer for data
    let sourceId = layerInfo.name;
    if (sourceId in this._sources) { // ensure source ID is unique
      sourceId += layerUrl[layerUrl.length - 2]; // URL always ends in 0/, 1/, etc
    }
    this._sources[sourceId] = {
      type: 'geojson',
      attribution: this._setupAttribution(layerInfo),
      data: layerData,
    };

    const layerType = esriGeometryDefaultStyleMap[layerInfo.geometryType];
    const defaultLayer = {
      source: sourceId,
      id: `${sourceId}-layer`,
      type: layerType,
      paint: defaultLayerPaintMap[layerType],
    };
    this._layers.push(defaultLayer as LayerSpecification);

    return;
  }

  private async _loadData(): Promise<void> {
    this._sources = {};
    this._layers = [];

    let dataSource = this._inputType;
    switch (dataSource) {
      case 'ItemId': {
        const itemResponse = await getItem(this._itemInfo.itemId, {
          authentication: this.authentication,
          portal: this._itemInfo.portalUrl,
        });

        if (!itemResponse.url) throw new Error('The provided ArcGIS portal item has no associated service URL.');
        // in feature collections, there is still data at the /data endpoint ...... just a heads up

        this._itemInfo = {
          ...this._itemInfo,
          accessInformation: itemResponse.accessInformation,
          title: itemResponse.title,
          description: itemResponse.description,
          access: itemResponse.access,
          orgId: itemResponse.orgId,
          licenseInfo: itemResponse.licenseInfo,
        };
        this._serviceInfo = {
          serviceUrl: itemResponse.url,
        };
        dataSource = 'FeatureService';
        // falls through
      }
      // This case is not currently in use
      case 'FeatureService': {
        const serviceInfo = await getService({
          url: this._serviceInfo.serviceUrl,
          authentication: this.authentication,
        });
        // Add layers
        if (serviceInfo.layers.length > 10) {
          console.warn('This feature service contains more than 10 layers. Only the first 10 layers will be loaded.');
        }
        for (let i = 0; (i < serviceInfo.layers.length) && (i < 10); i++) {
          if (serviceInfo.layers[i]['subLayerIds']) {
            console.warn('Feature layers with sublayers are not supported. This layer will not be added.');
            return;
          }
          await this._loadLayer(`${cleanUrl(this._serviceInfo.serviceUrl)}${i}/`);
        }
        break;
      }
      case 'FeatureLayer': {
        // Add single layer
        await this._loadLayer(this._serviceInfo.serviceUrl); // TODO test on a layer with tables
        break;
      }
    }
  }

  private _setupAttribution(layerInfo: ILayerDefinition): string {
    if (this._customAttribution) return this._customAttribution;

    if (this._itemInfo?.accessInformation) return this._itemInfo.accessInformation;

    if (this._serviceInfo?.copyrightText) return this._serviceInfo.copyrightText;

    if (layerInfo.copyrightText) return layerInfo.copyrightText;

    return '';
  }

  async initialize(): Promise<FeatureLayer> {
    await this._loadData();
    this._ready = true;
    return this;
  }

  static async fromUrl(serviceUrl: string, options: GeoJSONLayerOptions): Promise<FeatureLayer> {
    const inputType = checkServiceUrlType(serviceUrl);
    if (!inputType || !(inputType === 'FeatureService' || inputType === 'FeatureLayer')) throw new Error('Must provide a valid feature layer URL.');

    const geojsonLayer = new FeatureLayer({
      url: serviceUrl,
      ...options,
    });

    await geojsonLayer.initialize();
    return geojsonLayer;
  }

  static async fromPortalItem(itemId: string, options: GeoJSONLayerOptions): Promise<FeatureLayer> {
    if (checkItemId(itemId) !== 'ItemId') throw new Error('Must provide a valid item ID for an ArcGIS hosted feature layer.');

    const geojsonLayer = new FeatureLayer({
      itemId: itemId,
      ...options,
    });

    await geojsonLayer.initialize();
    return geojsonLayer;
  }
}

export default FeatureLayer;
