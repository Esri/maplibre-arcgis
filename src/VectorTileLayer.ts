import { getItem, getItemResource, getItemResources } from '@esri/arcgis-rest-portal';
import { request } from '@esri/arcgis-rest-request';
import type { LayerSpecification, StyleSpecification, VectorSourceSpecification } from '@maplibre/maplibre-gl-style-spec';
import { type IDataServiceInfo, type IHostedLayerOptions, type IItemInfo, HostedLayer } from './HostedLayer';
import { checkItemId, checkServiceUrlType, cleanUrl, isRelativePath, parseRelativeUrl, toCdnUrl, warn } from './Util';

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
 * VectorTileLayer class.
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

  /* */
  constructor(options: IVectorTileLayerOptions) {
    super();
    this._ready = false;
    this._styleLoaded = false;
    this._serviceInfoLoaded = false;
    this._itemInfoLoaded = false;

    if (!options || !(options.itemId || options.url)) throw new Error('Vector tile layer must be constructed with either an \'itemId\' or \'url\'.');

    if (options.authentication) this.authentication = options.authentication;
    else if (options.token) this.authentication = options.token;

    if (options.attribution) this._customAttribution = options.attribution;

    if (options.itemId && options.url)
      console.warn('Both an item ID and service URL have been passed to the constructor. The item ID will be preferred, and the URL ignored.');

    if (options.itemId && checkItemId(options.itemId) == 'ItemId') this._inputType = 'ItemId';
    else if (options.url && checkServiceUrlType(options.url) == 'VectorTileService') this._inputType = 'VectorTileService';
    else throw new Error('Invalid options provided to constructor. Must provide a valid ArcGIS item ID or vector tile service URL.');

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
      authentication: this.authentication,
      portal: this._itemInfo.portalUrl,
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
      // Check for other style resources associated with the item
    }
    catch {
      const itemResources = await getItemResources(this._itemInfo.itemId, {
        ...params,
      });

      let styleFile: string | null = null;
      if (itemResources.total > 0) {
        itemResources.resources.forEach((entry) => {
          if (entry.resource.startsWith('styles')) {
            styleFile = entry.resource;
          }
        });
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
      authentication: this.authentication,
    })) as StyleSpecification;
    return styleInfo;
  }

  /**
   * Retrieves information from the data service about data attribution, associated item IDs, and more.
   */
  async _loadServiceInfo(): Promise<IVectorTileServiceInfo> {
    const serviceResponse = (await request(this._serviceInfo.serviceUrl, {
      authentication: this.authentication,
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
      authentication: this.authentication,
      portal: this._itemInfo.portalUrl,
    });

    if (!itemResponse.url) throw new Error('Provided ArcGIS item ID has no associated data service.');

    if (!this._serviceInfoLoaded) {
      this._serviceInfo = {
        serviceUrl: cleanUrl(itemResponse.url),
        // serviceItemPortalUrl: this._itemInfo.portalUrl
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
      if (this.authentication) style.glyphs = `${style.glyphs}?token=${this.token}`;
    }

    // Validate sprite
    if (style.sprite) {
      if (Array.isArray(style.sprite)) {
        for (let spriteIndex = 0; spriteIndex < style.sprite.length; spriteIndex++) {
          const sprite = style.sprite[spriteIndex];

          if (isRelativePath(sprite.url)) sprite.url = parseRelativeUrl(sprite.url, styleUrl);
          sprite.url = toCdnUrl(sprite.url);

          if (this.authentication) sprite.url = `${sprite.url}?token=${this.token}`;
        }
      }
      else {
        if (isRelativePath(style.sprite)) style.sprite = parseRelativeUrl(style.sprite, styleUrl);
        style.sprite = toCdnUrl(style.sprite);
        if (this.authentication) style.sprite = `${style.sprite}?token=${this.token}`;
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
      if (this.authentication) {
        if (source.url) source.url = `${source.url}?token=${this.token}`;
        if (source.tiles) source.tiles = source.tiles.map(tileUrl => `${tileUrl}?token=${this.token}`);
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
    const style = await this._loadStyle();
    this._cleanStyle(style);
    this._ready = true;
    return this;
  }

  static async fromPortalItem(itemId: string, options: IVectorTileLayerOptions): Promise<VectorTileLayer> {
    if (checkItemId(itemId) !== 'ItemId') throw new Error('Input is not a valid ArcGIS item ID.');

    const vtl = new VectorTileLayer({
      itemId: itemId,
      ...options,
    });

    await vtl.initialize();
    return vtl;
  }

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
