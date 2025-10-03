import type { GeometryType, IGeometry, ILayerDefinition, IQueryFeaturesResponse, ISpatialReference, SpatialRelationship } from '@esri/arcgis-rest-feature-service';
import { getLayer, getService, queryAllFeatures, queryFeatures } from '@esri/arcgis-rest-feature-service';
import { getItem } from '@esri/arcgis-rest-portal';
import { type IParams } from '@esri/arcgis-rest-request';
import type { GeoJSONSourceSpecification, LayerSpecification } from 'maplibre-gl';
import type { IHostedLayerOptions } from './HostedLayer';
import { HostedLayer } from './HostedLayer';
import { checkItemId, checkServiceUrlType, cleanUrl, warn, wrapAccessToken } from './Util';

// const geoJSONDefaultStyleMap = {
//     "Point":"circle",
//     "MultiPoint":"circle",
//     "LineString":"line",
//     "MultiLineString":"line",
//     "Polygon":"fill",
//     "MultiPolygon":"fill"
// }

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
 * Options supported by FeatureLayer.
 */
export interface IFeatureLayerOptions extends IHostedLayerOptions {
  itemId?: string;
  url?: string;
  query?: IQueryOptions;
}

/**
 * Parameters for feature layer query request.
 * Go to the [REST API Documentation])https://developers.arcgis.com/rest/services-reference/enterprise/query-feature-service-layer/#request-parameters) for more information.
 */
export interface IQueryOptions {
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

export type SupportedInputTypes = 'ItemId' | 'FeatureService' | 'FeatureLayer';

/**
 * This class allows you to load and display [ArcGIS feature layers](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/feature-services/introduction/) in a MapLibre map.
 *
 * The `FeatureLayer` class provides:
 * - Loading and displaying feature layers from item IDs or feature service URLs.
 * - Querying of feature layer attributes.
 * - Adding sources and layers to a MapLibre map.
 *
 * ```javascript
 * import { FeatureLayer } from '@esri/maplibre-arcgis';
 *
 * // Load a point layer from the service URL
 * const pointService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0";
 * const trailheads = await maplibreArcGIS.FeatureLayer.fromUrl(pointService);
 * trailheads.addSourcesAndLayersTo(map);
 *
 * // Load a polyline layer from the service URL and query
 * const lineService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0"
 * const trails = await maplibreArcGIS.FeatureLayer.fromUrl(lineService, {query: {
 *    outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
 *    where: 'ELEV_MIN > 200'
 *  }});
 * trails.addSourcesAndLayersTo(map);
 *
 * // Load a polygon layer from from portal item ID
 * const parks = await maplibreArcGIS.FeatureLayer.fromPortalItem('f2ea5d874dad427294641d2d45097c0e');
 * parks.addSourcesAndLayersTo(map);
 * ```
 */
export class FeatureLayer extends HostedLayer {
  declare protected _sources: { [_: string]: GeoJSONSourceSpecification };
  declare protected _layers: LayerSpecification[];

  private _inputType: SupportedInputTypes;

  query?: IQueryOptions;

  /**
   * Creates a new FeatureLayer instance. You must provide either an ArcGIS item ID or a feature service URL. If both are provided, the item ID will be used and the URL ignored. Query parameters are only supported when constructing with a feature layer URL.
   *
   *
   * ```javascript
   * import { FeatureLayer } from '@esri/maplibre-arcgis';
   *
   * const trails = new maplibreArcGIS.FeatureLayer({
   *    url: "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0",
   * });
   * await trails.initialize();
   * trails.addLayerandSourcesTo(map);
   * ```
   * \> Creating layers using the constructor directly is not recommended. Use {@link FeatureLayer.fromUrl} and {@link FeatureLayer.fromPortalItem} instead.
   *
   * @param options - Configuration options for the feature layer.
   *
   *
   */
  constructor(options: IFeatureLayerOptions) {
    super();

    if (!options || !(options.itemId || options.url)) throw new Error('Feature layer requires either an \'itemId\' or \'url\'.');

    if (options?.token) this.token = options.token;

    if (options?.attribution) this._customAttribution = options.attribution;

    if (options.itemId && options.url)
      warn('Both an item ID and service URL have been passed. Only the item ID will be used.');

    if (options.itemId) {
      if (checkItemId(options.itemId) == 'ItemId') this._inputType = 'ItemId';
      else throw new Error('Argument `itemId` is not a valid item ID.');
    }
    else if (options.url) {
      const urlType = checkServiceUrlType(options.url);
      if (urlType && (urlType == 'FeatureLayer' || urlType == 'FeatureService')) this._inputType = urlType;
      else throw new Error('Argument `url` is not a valid feature service URL.');
    }

    // Set up
    if (this._inputType == 'ItemId') {
      this._itemInfo = {
        itemId: options.itemId,
        portalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com/sharing/rest',
      };
    }
    else if (this._inputType === 'FeatureLayer' || this._inputType === 'FeatureService') {
      this._serviceInfo = {
        serviceUrl: cleanUrl(options.url),
      };
    }

    if (options?.query) this.query = options.query;
  }

  private async _fetchAllFeatures(layerUrl: string, layerInfo: ILayerDefinition): Promise<GeoJSON.GeoJSON> {
    if (!layerInfo.supportedQueryFormats.includes('geoJSON')) throw new Error('This feature service does not support GeoJSON format.');
    if (!layerInfo.capabilities.includes('Query')) throw new Error('This feature service does not support queries.');
    if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error('This feature service does not support query pagination.');

    let layerData: GeoJSON.GeoJSON;
    if (layerInfo.supportsExceedsLimitStatistics) {
      const exceedsLimitResponse = await (queryFeatures({
        url: layerUrl,
        authentication: this._authentication,
        ...this.query,
        outStatistics: [
          {
            statisticType: 'exceedslimit',
            outStatisticFieldName: 'exceedslimit',
            // @ts-expect-error these params aren't in REST JS
            maxPointCount: 2000,
            maxRecordCount: 2000,
            maxVertexCount: 250000,
          },
        ],
        returnGeometry: false,
        params: {
          cacheHint: true,
        },
        // outSR: 102100,
        // spatialRel: 'esriSpatialRelIntersects',
      })) as IQueryFeaturesResponse;

      if (exceedsLimitResponse.features[0].attributes.exceedslimit === 0) {
        // Get all features
        const response = await queryAllFeatures({
          url: layerUrl,
          authentication: this._authentication,
          ...this.query,
          f: 'geojson',
        });

        layerData = response as unknown as GeoJSON.GeoJSON;
      }
      else {
        // Limit exceeded
        // TODO on-demand loading
        throw new Error('The requested feature count exceeds the current limits of this plugin. Please use the ArcGIS Maps SDK for JavaScript for now, or host your data as a vector tile layer.');
      }
    }
    else {
      throw new Error(
        'Feature layers hosted in old versions of ArcGIS Enterprise are not supported by this plugin. https://github.com/Esri/maplibre-arcgis/issues/5'
      );
    }
    if (!layerData) throw new Error('Unable to load data.');

    return layerData;
  }

  private async _loadLayer(layerUrl: string): Promise<void> {
    const layerInfo = await getLayer({
      authentication: this._authentication,
      url: layerUrl,
      httpMethod: 'GET',
    });

    const layerData = await this._fetchAllFeatures(layerUrl, layerInfo);

    // Create maplibre source and layer for data
    let sourceId = layerInfo.name;
    if (sourceId in this._sources) {
      // ensure source ID is unique
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

    // Wrap access token for use with REST JS
    this._authentication = await wrapAccessToken(this.token, this._itemInfo?.portalUrl);

    let dataSource = this._inputType;
    switch (dataSource) {
      case 'ItemId': {
        const itemResponse = await getItem(this._itemInfo.itemId, {
          authentication: this._authentication,
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
      case 'FeatureService': {
        const serviceInfo = await getService({
          url: this._serviceInfo.serviceUrl,
          authentication: this._authentication,
        });
        if (serviceInfo.copyrightText) this._serviceInfo.copyrightText = serviceInfo.copyrightText;

        if (serviceInfo.layers.length > 1 && this.query) throw new Error('Unable to use `query` parameter: This feature service contains multiple feature layers.');
        // Add layers
        if (serviceInfo.layers.length > 10) {
          warn('This feature service contains more than 10 layers. Only the first 10 layers will be loaded.');
        }
        for (let i = 0; i < serviceInfo.layers.length && i < 10; i++) {
          if (serviceInfo.layers[i]['subLayerIds']) {
            warn('Feature layers with sublayers are not supported. This layer will not be added.');
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
    // Source attribution priority is as follows:

    // 1. User-provided attribution
    if (this._customAttribution) return this._customAttribution;

    // 2. Access info from item
    if (this._itemInfo?.accessInformation) return this._itemInfo.accessInformation;

    // 3. Copyright text from layer
    if (layerInfo.copyrightText) return layerInfo.copyrightText;

    // 4. Copyright text from service
    if (this._serviceInfo?.copyrightText) return this._serviceInfo.copyrightText;

    return '';
  }

  async initialize(): Promise<FeatureLayer> {
    await this._loadData();
    this._ready = true;
    return this;
  }

  /**
   * Creates a new FeatureLayer instance from a feature service URL.
   * ```javascript
   *
   * // Load trailheads from service URL
   * const pointService = "https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0"
   * const trailheads = await maplibreArcGIS.FeatureLayer.fromUrl(pointService);
   * trailheads.addSourcesAndLayersTo(map);
   *```
   *
   * @param serviceUrl - A valid ArcGIS feature service or feature layer URL.
   * @param options - Configuration options for the feature layer. Query parameters are only supported when constructing with a feature layer URL.
   *
   * @returns
   */
  static async fromUrl(serviceUrl: string, options?: IFeatureLayerOptions): Promise<FeatureLayer> {
    const inputType = checkServiceUrlType(serviceUrl);
    if (!inputType || !(inputType === 'FeatureService' || inputType === 'FeatureLayer')) throw new Error('Must provide a valid feature layer URL.');

    const geojsonLayer = new FeatureLayer({
      url: serviceUrl,
      ...options,
    });

    await geojsonLayer.initialize();
    return geojsonLayer;
  }

  /**
   * Creates a new FeatureLayer instance from an ArcGIS Online or ArcGIS Enterprise item ID.
   * @param itemId - A valid ArcGIS Online or ArcGIS Enterprise item ID for a hosted feature layer.
   * @param options - Configuration options for the feature layer.
   * @returns - A promise that resolves to a FeatureLayer instance.
   * ```javascript
   *
   * // Load parks from from portal item ID
   * const parks = await maplibreArcGIS.FeatureLayer.fromPortalItem('f2ea5d874dad427294641d2d45097c0e');
   * parks.addSourcesAndLayersTo(map);
   *```
   */
  static async fromPortalItem(itemId: string, options?: IFeatureLayerOptions): Promise<FeatureLayer> {
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
// Copyright 2025 Esri
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
