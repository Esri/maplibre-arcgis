import { getItem, getItemResource, getItemResources } from '@esri/arcgis-rest-portal';
import { request } from '@esri/arcgis-rest-request';
import type { LayerSpecification, StyleSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import { type IDataServiceInfo, type IHostedLayerOptions, type IItemInfo, HostedLayer } from './HostedLayer';
import { checkItemId, checkServiceUrlType, cleanUrl, isRelativePath, parseRelativeUrl, toCdnUrl, warn, wrapAccessToken } from './Util';

export interface IVectorTileServiceDefinition {
  tiles: string[];
  defaultStyles: string;
  copyrightText: string;
}

export interface IVectorTileLayerOptions extends IHostedLayerOptions {
  itemId?: string;
  url?: string;
}

/**
 * VectorTileServiceInfo interface.
 */
export interface IVectorTileServiceInfo extends IDataServiceInfo {
  styleEndpoint?: string; // Usually "/resources/styles"
  tiles?: string[]; // Usually "[tile/{z}/{y}/{x}.pbf]"
}

/**
 * This class allows you to load and display [ArcGIS vector tile layers](https://developers.arcgis.com/documentation/portal-and-data-services/data-services/vector-tile-services/introduction/) in a MapLibre map.
 *
 * The `VectorTileLayer` class provides functionality for:
 * - Loading and displaying vector tile layers from ArcGIS Online item IDs or feature service URLs.
 * - Adding sources and layers to a MapLibre map.
 * - Managing vector tile layer styles.
 * - Managing vector tile layer visibility and opacity.
 *
 * ```javascript
 * import { VectorTileLayer } from '@esri/maplibre-arcgis';
 *
 * // Add a vector tile layer from an ArcGIS item ID
 * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromPortalItem('e0b5e1aa287845d78b1dabd3223ebed1');
 * vectorLayer.addSourcesAndLayersTo(map);
 *
 * // Add a vector tile layer from an ArcGIS vector tile service URL
 * const vectorLayer2 = await maplibreArcGIS.VectorTileLayer.fromUrl('https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer');
 * vectorLayer2.addSourcesAndLayersTo(map);
 * ```
 */
export class VectorTileLayer extends HostedLayer {
  declare protected _serviceInfo: IVectorTileServiceInfo;
  declare protected _itemInfo: IItemInfo;

  declare protected _sources: { [_: string]: VectorSourceSpecification };
  declare protected _layers: LayerSpecification[];

  private _inputType: 'ItemId' | 'VectorTileService';
  private _styleLoaded: boolean;
  private _itemInfoLoaded: boolean;
  private _serviceInfoLoaded: boolean;

  /**
   * Style specification.
   */
  style: StyleSpecification;

  /**
   * Creates a new VectorTileLayer instance. You must provide either an ArcGIS item ID or a vector tile service URL. If both are provided, the item ID will be used and the URL ignored.
   * ```javascript
   * import { VectorTileLayer } from '@esri/maplibre-arcgis';
   * const vectorLayer = new VectorTileLayer({url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer', authentication: "YOUR_ACCESS_TOKEN"});
   * await vectorLayer.initialize();
   * vectorLayer.addSourcesAndLayersTo(map);
   * ```
   * > Creating layers using the constructor directly is not recommended. Use the {@link VectorTileLayer.fromUrl} and {@link VectorTileLayer.fromPortalItem} static methods instead.
   * @param options - Configuration options for the vector tile layer. You must provide either an ArcGIS item ID or a vector tile service URL. If both are provided, the item ID will be used and the URL ignored.
   */
  constructor(options: IVectorTileLayerOptions) {
    super();
    this._ready = false;
    this._styleLoaded = false;
    this._serviceInfoLoaded = false;
    this._itemInfoLoaded = false;

    if (!options || !(options.itemId || options.url)) throw new Error('Vector tile layer requires either an \'itemId\' or \'url\'.');

    if (options.token) this.token = options.token;

    if (options.attribution) this._customAttribution = options.attribution;

    if (options.itemId && options.url)
      console.warn('Both an item ID and service URL have been passed. Only the item ID will be used.');

    if (options.itemId) {
      if (checkItemId(options.itemId) == 'ItemId') this._inputType = 'ItemId';
      else throw new Error('Argument `itemId` is not a valid item ID.');
    }
    else if (options.url) {
      if (checkServiceUrlType(options.url) == 'VectorTileService') this._inputType = 'VectorTileService';
      else throw new Error('Argument `url` is not a valid vector tile service URL.');
    }

    if (this._inputType === 'ItemId') {
      this._itemInfo = {
        itemId: options.itemId,
        portalUrl: options?.portalUrl ? options.portalUrl : 'https://www.arcgis.com/sharing/rest',
      };
    }
    else if (this._inputType === 'VectorTileService') {
      this._serviceInfo = {
        serviceUrl: cleanUrl(options.url),
      };
    }
  }

  /**
   * Loads the style from ArcGIS.
   * @internal
   */
  async _loadStyle(): Promise<StyleSpecification> {
    let styleInfo: StyleSpecification | null = null;

    this._authentication = await wrapAccessToken(this.token, this._itemInfo?.portalUrl);

    let styleSource = this._inputType;
    switch (styleSource) {
      case 'ItemId': {
        await this._loadItemInfo();
        styleInfo = await this._loadStyleFromItemId();
        if (styleInfo) break;
        else {
          warn('Could not find a style resource associated with the provided item ID. Checking service URL instead...');
          styleSource = 'VectorTileService';
        } // falls through
      }
      case 'VectorTileService': {
        await this._loadServiceInfo();
        styleInfo = await this._loadStyleFromServiceUrl();
        break;
      }
    }

    if (!styleInfo) throw new Error('Unable to load style information from service URL or item ID.');

    this._styleLoaded = true;
    this.style = styleInfo;
    return this.style;
  }

  async _loadStyleFromItemId(): Promise<StyleSpecification | null> {
    const params = {
      authentication: this._authentication,
    };
    // Load style info
    let styleInfo: StyleSpecification | null = null;
    // Try loading default style name first
    try {
      const rootStyle = (await getItemResource(this._itemInfo.itemId, {
        ...params,
        fileName: 'styles/root.json',
        readAs: 'json',
      })) as StyleSpecification;
      styleInfo = rootStyle;
    }
    catch {
      // No root style, check for other style resources associated with the item
      const itemResources = await getItemResources(this._itemInfo.itemId, {
        ...params,
      });

      let styleFile: string;
      if (itemResources.total > 0) {
        for (const entry of itemResources.resources) {
          if (entry.resource.startsWith('styles')) {
            styleFile = entry.resource;
            break;
          }
        }
      }
      if (styleFile) {
        const customStyle = (await getItemResource(this._itemInfo.itemId, {
          ...params,
          fileName: styleFile,
          readAs: 'json',
        })) as StyleSpecification;
        styleInfo = customStyle;
      }
    }
    return styleInfo;
  }

  async _loadStyleFromServiceUrl(): Promise<StyleSpecification | null> {
    if (!this._serviceInfo.serviceUrl) throw new Error('No data service provided');
    if (!this._serviceInfo.styleEndpoint) this._serviceInfo.styleEndpoint = 'resources/styles/';

    const styleInfo = (await request(`${this._serviceInfo.serviceUrl}${this._serviceInfo.styleEndpoint}`, {
      authentication: this._authentication,
    })) as StyleSpecification;
    return styleInfo;
  }

  /**
   * Retrieves information from the data service about data attribution, associated item IDs, and more.
   */
  async _loadServiceInfo(): Promise<IVectorTileServiceInfo> {
    const serviceResponse = (await request(this._serviceInfo.serviceUrl, {
      authentication: this._authentication,
    })) as IVectorTileServiceDefinition;

    this._serviceInfo = {
      ...this._serviceInfo,
      tiles: serviceResponse.tiles,
      styleEndpoint: cleanUrl(serviceResponse.defaultStyles),
      copyrightText: serviceResponse.copyrightText,
    };
    this._serviceInfoLoaded = true;
    return this._serviceInfo;
  }

  /**
   * Retrieves information from the portal about item attribution and associated service URLs
   */
  async _loadItemInfo(): Promise<IItemInfo> {
    const itemResponse = await getItem(this._itemInfo.itemId, {
      authentication: this._authentication,
    });

    if (!itemResponse.url) throw new Error('Provided ArcGIS item ID has no associated data service.');

    if (!this._serviceInfoLoaded) {
      this._serviceInfo = {
        serviceUrl: cleanUrl(itemResponse.url),
      };
    }
    this._itemInfo = {
      ...this._itemInfo,
      accessInformation: itemResponse.accessInformation,
      title: itemResponse.title,
      description: itemResponse.description,
      access: itemResponse.access,
      orgId: itemResponse.orgId,
      licenseInfo: itemResponse.licenseInfo,
    };
    this._itemInfoLoaded = true;
    return this._itemInfo;
  }

  _cleanStyle(style: StyleSpecification): void {
    if (!style) throw new Error('Vector tile style has not been loaded from ArcGIS.');

    if (!this._serviceInfo.serviceUrl) throw new Error('No data service provided');
    if (!this._serviceInfo.styleEndpoint) this._serviceInfo.styleEndpoint = 'resources/styles/';
    const styleUrl = `${this._serviceInfo.serviceUrl}${this._serviceInfo.styleEndpoint}`;

    // Validate glyphs
    if (style.glyphs) {
      if (isRelativePath(style.glyphs)) style.glyphs = parseRelativeUrl(style.glyphs, styleUrl);
      style.glyphs = toCdnUrl(style.glyphs);
      if (this._authentication) style.glyphs = `${style.glyphs}?token=${this._authentication.token}`;
    }

    // Validate sprite
    if (style.sprite) {
      if (Array.isArray(style.sprite)) {
        for (let spriteIndex = 0; spriteIndex < style.sprite.length; spriteIndex++) {
          const sprite = style.sprite[spriteIndex];

          if (isRelativePath(sprite.url)) sprite.url = parseRelativeUrl(sprite.url, styleUrl);
          sprite.url = toCdnUrl(sprite.url);

          if (this._authentication) sprite.url = `${sprite.url}?token=${this._authentication.token}`;
        }
      }
      else {
        if (isRelativePath(style.sprite)) style.sprite = parseRelativeUrl(style.sprite, styleUrl);
        style.sprite = toCdnUrl(style.sprite);
        if (this._authentication) style.sprite = `${style.sprite}?token=${this._authentication.token}`;
      }
    }

    // Validate layers
    for (let layerIndex = 0; layerIndex < style.layers.length; layerIndex++) {
      const layer = style.layers[layerIndex];

      // Fix fonts: https://maplibre.org/maplibre-style-spec/layers/#text-font
      if (layer.layout && layer.layout['text-font'] && (layer.layout['text-font'] as string[]).length > 1) {
        layer.layout['text-font'] = layer.layout['text-font'] as string[][0];
      }
    }

    // Validate sources: https://maplibre.org/maplibre-style-spec/sources/
    for (const sourceId of Object.keys(style.sources)) {
      const source = style.sources[sourceId] as VectorSourceSpecification;

      // Fix service URL
      if (isRelativePath(source.url)) source.url = parseRelativeUrl(source.url, styleUrl);
      source.url = cleanUrl(source.url);
      // Format tiles
      if (!source.tiles) {
        if (this._serviceInfo.tiles) source.tiles = [`${source.url}${this._serviceInfo.tiles[0]}`];
        else source.tiles = [`${source.url}tile/{z}/{y}/{x}.pbf`]; // Just take our best guess
      }

      // Provide authentication
      if (this._authentication) {
        if (source.url) source.url = `${source.url}?token=${this._authentication.token}`;
        if (source.tiles) source.tiles = source.tiles.map(tileUrl => `${tileUrl}?token=${this._authentication.token}`);
      }

      // Provide attribution
      source.attribution = this._getAttribution(sourceId);
    }
    // Public API is read-only
    this._sources = style.sources as { [_: string]: VectorSourceSpecification };
    this._layers = style.layers;
  }

  /**
   * Get attribution for a source.
   * @param sourceId - Source ID.
   * @returns Attribution.
   * @internal
   */
  _getAttribution(sourceId: string): string | null {
    // Custom attribution is highest priority
    if (this._customAttribution) return this._customAttribution;
    // Next, attribution from item info if available
    if (this._itemInfoLoaded && this._itemInfo.accessInformation) {
      return this._itemInfo.accessInformation;
    }
    // 2. Next, attribution from data service
    if (this._serviceInfoLoaded && this._serviceInfo.copyrightText) {
      return this._serviceInfo.copyrightText;
    }
    // 3. Finally, attribution from style object
    if (this._styleLoaded && sourceId && this.style.sources[sourceId] && (this.style.sources[sourceId] as VectorSourceSpecification).attribution) {
      return (this.style.sources[sourceId] as VectorSourceSpecification).attribution;
    }
    return '';
  }

  // Public API
  async initialize(): Promise<VectorTileLayer> {
    if (this._ready) throw new Error('Vector tile layer has already been initialized. Cannot initialize again.');
    const style = await this._loadStyle();
    this._cleanStyle(style);
    this._ready = true;
    return this;
  }

  /**
   * Creates a new VectorTileLayer instance from an ArcGIS vector tile service URL. You must provide a valid vector tile service URL.
   * ```javascript
   * import { VectorTileLayer } from '@esri/maplibre-arcgis';
   *
   * // Add a vector tile layer from an ArcGIS item ID
   * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromPortalItem('e0b5e1aa287845d78b1dabd3223ebed1');
   * vectorLayer.addSourcesAndLayersTo(map);
   * ```
   *
   * @param itemId - ArcGIS item ID of a vector tile layer.
   * @param options - Configuration options for the vector tile layer.
   * @returns A promise that resolves to a VectorTileLayer instance.
   *
   */
  static async fromPortalItem(itemId: string, options: IVectorTileLayerOptions): Promise<VectorTileLayer> {
    if (checkItemId(itemId) !== 'ItemId') throw new Error('Input is not a valid ArcGIS item ID.');

    const vtl = new VectorTileLayer({
      itemId: itemId,
      ...options,
    });

    await vtl.initialize();
    return vtl;
  }

  /**
   * Creates a new VectorTileLayer instance from an ArcGIS vector tile service URL. You must provide a valid vector tile service URL.
   * ```javascript
   * import { VectorTileLayer } from '@esri/maplibre-arcgis';
   *
   * // Add a vector tile layer from an ArcGIS vector tile service URL
   * const vectorLayer = await maplibreArcGIS.VectorTileLayer.fromUrl('https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_parcels_VTL/VectorTileServer');
   * vectorLayer.addSourcesAndLayersTo(map);
   * ```
   * @param serviceUrl - URL to an ArcGIS vector tile service.
   * @param options - Configuration options for the vector tile layer.
   * @returns A promise that resolves to a VectorTileLayer instance.
   */
  static async fromUrl(serviceUrl: string, options: IVectorTileLayerOptions): Promise<VectorTileLayer> {
    if (checkServiceUrlType(serviceUrl) !== 'VectorTileService') throw new Error('Input is not a valid ArcGIS vector tile service URL.');

    const vtl = new VectorTileLayer({
      url: serviceUrl,
      ...options,
    });

    await vtl.initialize();
    return vtl;
  }
}
export default VectorTileLayer;
/*
 * Copyright 2025 Esri
 *
 * Licensed under the Apache License Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
