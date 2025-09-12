import { request, ApiKeyManager, type ArcGISIdentityManager } from '@esri/arcgis-rest-request';
import type { Map, StyleOptions, StyleSpecification, StyleSwapOptions, VectorTileSource } from 'maplibre-gl';
import mitt, { type Emitter } from 'mitt';
import { AttributionControl, type IAttributionControlOptions } from './AttributionControl';
import type BasemapSession from './BasemapSession';
import { checkItemId, wrapAccessToken, type RestJSAuthenticationManager } from './Util';

/**
 * Structure of a BasemapStyle object. Go to {@link https://developers.arcgis.com/rest/basemap-styles/styles-self-get/ } to learn more.
 */
export type BasemapSelfResponse = {
  customStylesUrl: string;
  selfUrl: string;
  languages: [CodeNamePair];
  worldviews: [CodeNamePair];
  places: [CodeNamePair];
  styleFamilies: [CodeNamePair];
  styles: [{
    complete: boolean;
    deprecated?: boolean;
    name: string;
    path: StyleEnum;
    provider: string;
    styleFamily: string;
    styleUrl: string;
    selfUrl: string;
    thumbnailUrl: string;
    detailUrl?: string;
    labelsUrl?: string;
    rootUrl?: string;
    baseUrl?: string;
  }];
};

export type CodeNamePair = {
  code: string;
  name: string;
};
export type PlacesOptions = 'all' | 'attributed' | 'none';
export type StyleFamily = 'arcgis' | 'open' | 'osm';
export type StyleEnum = `${StyleFamily}/${string}`;

export type BasemapStyleObject = {
  complete: boolean;
  deprecated?: boolean;
  name: string;
  path: StyleEnum;
  provider: string;
  styleFamily: string;
  styleUrl: string;
  selfUrl: string;
  thumbnailUrl: string;
  detailUrl?: string;
  labelsUrl?: string;
  rootUrl?: string;
  baseUrl?: string;
};

/**
 * Options passed to Maplibre GL JS.
 * Go to the [MapLibre GL JS Map.setStyle](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#setstyle) for more information.
 */
export type MaplibreStyleOptions = StyleOptions & StyleSwapOptions;

/**
 * Events emitted by the BasemapStyle class.
 */
export type BasemapStyleEventMap = {
  BasemapStyleLoad: BasemapStyle;
  BasemapAttributionLoad: AttributionControl;
  BasemapStyleError: Error;
};

const DEFAULT_BASE_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
// const DEV_URL = 'https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/styles';

/**
 * Options for basemap styles
 */
export interface IBasemapStyleOptions {
  /**
   * A basemap style enumeration or item ID.
   */
  style: string;
  /**
   * Accepts an ArcGIS access token for authentication.
   */
  token?: string;
  /**
   * Accepts an ArcGIS REST JS authentication manager for authentication.
   */
  authentication?: RestJSAuthenticationManager;
  /**
   * Accepts basemap sessions for authentication. The style will reload automatically on session token refresh.
   */
  session?: BasemapSession | Promise<BasemapSession>;
  /**
   * Set style preferences including language, worldview, and places.
   */
  preferences?: IBasemapPreferences;
  /**
   * Options for customizing the maplibre-gl attribution control.
   */
  attributionControl?: IAttributionControlOptions;
  /**
   * @internal For setting the service url to QA, devext, etc.
   */
  baseUrl?: string;
};

/**
 * Options for applyStyle
 */
export interface IApplyStyleOptions extends IBasemapStyleOptions {
  /**
   * The maplibre-gl map to apply the basemap style to.
   */
  map: Map;
  /**
   * Passthrough options for maplibre-gl map.setStyle()
   */
  maplibreStyleOptions?: MaplibreStyleOptions;
};

/**
 * Options for updateStyle
 */
export interface IUpdateStyleOptions {
  /**
   * A basemap style enumeration or item ID.
   */
  style?: string;
  /**
   * Set style preferences including language, worldview, and places.
   */
  preferences?: IBasemapPreferences;
  /**
   * Passthrough options for maplibre-gl map.setStyle()
   */
  maplibreStyleOptions?: MaplibreStyleOptions;
};

/**
 * Optional preferences for the basemap style. Support varies based on the basemap style selected.
 */
export interface IBasemapPreferences {
  /**
   * Customize the language of the basemap.
   */
  language?: string;
  /**
   * Customize the political worldview of the basemap.
   */
  worldview?: string;
  /**
   * Enable or disable basemap places.
   */
  places?: PlacesOptions;
};

export class BasemapStyle {
  /**
   * The basemap style, formatted as MapLibre style specification JSON.
   */
  style: StyleSpecification;
  /**
   * The ID of the saved style.
   */
  styleId: string;
  /**
   * A reference to the map's AttributionControl.
   */
  attributionControl: AttributionControl;
  /**
   * An ArcGIS access token. Used for authentication
   */
  token: string;
  /**
   * A basemap session. Used for authentication.
   */
  session: BasemapSession | Promise<BasemapSession>;
  /**
   * Optional style preferences such as `language` and `places`.
   */
  preferences: IBasemapPreferences;
  // private _transformStyleFn?:TransformStyleFunction;
  private _attributionControlOptions: IAttributionControlOptions;
  private _isItemId: boolean;
  private _map?: Map;
  private _baseUrl: string;
  private readonly _emitter: Emitter<BasemapStyleEventMap> = mitt();

  /**
   * Constructor for BasemapStyle.
   * @param options - Configuration options for the basemap style.
   */
  constructor(options: IBasemapStyleOptions) {
    if (!options || !options.style) throw new Error('BasemapStyle must be created with a style name, such as \'arcgis/imagery\' or \'open/streets\'.');
    // Access token validation
    if (options.session) this.session = options.session;
    else if (options.token) this.token = options.token;
    else throw new Error(
      'ArcGIS access token required. To learn more, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.'
    );

    this.styleId = options.style;
    this._baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
    this._isItemId = checkItemId(this.styleId) == 'ItemId' ? true : false;

    if (options.attributionControl) this._attributionControlOptions = options.attributionControl;

    if (options?.preferences) {
      this._updatePreferences({
        language: options.preferences.language,
        worldview: options.preferences.worldview,
        places: options.preferences.places,
      });
    }
  }

  private get _styleUrl(): string {
    let styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;

    styleUrl += `?token=${this._token}`;

    if (this.preferences?.language) {
      styleUrl += `&language=${this.preferences.language}`;
    }
    if (this.preferences?.worldview) {
      styleUrl += `&worldview=${this.preferences.worldview}`;
    }
    if (this.preferences?.places) {
      styleUrl += `&places=${this.preferences.places}`;
    }

    return styleUrl;
  }

  private get _token(): string {
    if (this.session) return (this.session as BasemapSession).token;
    else if (this.token) return this.token;
  }

  /**
   * Associates the BasemapStyle with a maplibre-gl map.
   * @param map - A maplibre-gl map.
   * @returns The BasemapStyle object.
   */
  setMap(map: Map): BasemapStyle {
    this._map = map;
    return this;
  }

  /**
   * Applies the basemap style to a maplibre-gl map.
   * @param map - A maplibre-gl map. The map may either be passed here or in the constructor.
   * @param maplibreStyleOptions - Optional style object for maplibre-gl, including the `transformStyle` function.
   * @returns - The maplibre-gl map that the style was applied to.
   */
  applyTo(map: Map, maplibreStyleOptions?: MaplibreStyleOptions): Map {
    if (map) this._map = map;
    if (!this._map) throw new Error('Unable to apply basemap style: No \'Map\' object was provided.');

    if (!this.style) throw new Error('Cannot apply style to map before style is loaded.');
    this._map.setStyle(this.style, maplibreStyleOptions);
    this._setEsriAttribution();

    if (this.session) {
      (this.session as BasemapSession).on('BasemapSessionRefreshed', (sessionData) => {
        const oldToken = sessionData.previous.token;
        const newToken = sessionData.current.token;

        this._updateTiles(oldToken, newToken, map); // update the map with the new token
      });
    }

    return this._map;
  }

  /**
   * Updates the basemap style with new options and applies it to the current map.
   * @param options - Options to customize the style enumeration and preferences such as language.
   */
  async updateStyle(options: IUpdateStyleOptions): Promise<StyleSpecification> {
    if (options.style) this.styleId = options.style;

    if (options.preferences) {
      this._updatePreferences(options.preferences);
    }

    await this.loadStyle();
    this.applyTo(this._map, options.maplibreStyleOptions);

    return this.style;
  }

  /**
   * Loads the basemap style from the Basemap Styles service.
   * @returns The maplibre style specification of the basemap style, formatted properly.
   */
  async loadStyle(): Promise<StyleSpecification> {
    if (this.session) {
      const session = await Promise.resolve(this.session);
      this.session = session;
    }
    // Request style JSON
    const styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;

    const authentication = await wrapAccessToken(this._token);

    const style = await (request(styleUrl, {
      authentication: authentication,
      httpMethod: 'GET',
      suppressWarnings: true,
      params: {
        ...this.preferences,
        echoToken: false,
      },
    }) as Promise<StyleSpecification>)
      .catch((e: Error) => {
        this._styleErrorHandler(e);
      });
    if (!style) return;
    // Handle glyphs
    if (style.glyphs) style.glyphs = `${style.glyphs}?f=json&token=${this.token}`;

    // Handle sources
    Object.keys(style.sources).forEach((sourceId) => {
      const source = style.sources[sourceId];

      if (source.type === 'raster' || source.type === 'vector' || source.type === 'raster-dem') {
        if (source.tiles.length > 0) {
          for (let i = 0; i < source.tiles.length; i++) source.tiles[i] = `${source.tiles[i]}?f=json&token=${this.token}`;
        }
      }
    });

    if (style.sprite) {
      // Handle sprite
      if (Array.isArray(style.sprite)) {
        style.sprite.forEach((sprite, id, spriteArray) => {
          spriteArray[id].url = `${sprite.url}?token=${this._token}`;
        });
      }
      else {
        style.sprite = `${style.sprite}?token=${this._token}`;
      }
    }

    this.style = style;
    this._styleLoadHandler(this);
    return this.style;
  }

  private _setEsriAttribution(): void {
    if (!this._map) throw new Error('No map was passed to ArcGIS BasemapStyle.');

    this.attributionControl = new AttributionControl(this._attributionControlOptions);
    if (this.attributionControl.canAdd(this._map)) {
      this._map.addControl(this.attributionControl);
      this._attributionLoadHandler(this.attributionControl);
    }
  }

  private _updatePreferences(preferences: IBasemapPreferences) {
    if (!preferences) return;

    if (this._isItemId) {
      console.warn('Preferences such as \'language\', \'places\', and \'worldview\' are not supported with custom basemaps IDs. These parameters will be ignored.');
      return;
    }

    if (!this.preferences) this.preferences = {};

    if (preferences.language) this.preferences.language = preferences.language;
    if (preferences.places) this.preferences.places = preferences.places;
    if (preferences.worldview) this.preferences.worldview = preferences.worldview;
  }

  private _updateTiles(fromToken: string, toToken: string, map: Map): void {
    if (!map) throw new Error('Unable to update map tiles with new session token: Session does not have access to the map.');
    this._map = map;

    // replace token in the styles tiles with the new session token
    for (const sourceCaches of Object.keys(this._map.style.sourceCaches)) {
      const source: VectorTileSource = this._map.getSource(sourceCaches);
      // skip if we can't find the source or the source doesn't have tiles
      if (!source || !source.tiles) {
        return;
      }

      // Skip if the source doesn't have tiles that include the old token
      if (!source.tiles.some(tileUrl => tileUrl.includes(fromToken))) {
        return;
      }

      const newTiles = source.tiles.map((tile) => {
        return tile.includes(fromToken) ? tile.replace(fromToken, toToken) : tile;
      });

      source.setTiles(newTiles);
    }

    // replace the token in the glyph url, ensuring fonts continue loading
    const glyphs = this._map.getGlyphs();
    if (glyphs.includes(fromToken)) {
      this._map.setGlyphs(glyphs.replace(fromToken, toToken));
    }

    const sprites = this._map.getSprite();
    for (const sprite of sprites) {
      if (sprite.url.includes(fromToken)) {
        this._map.setSprite(sprite.url.replace(fromToken, toToken));
      }
    }
  }

  private _styleLoadHandler = (e: BasemapStyle): void => {
    this._emitter.emit('BasemapStyleLoad', e);
  };

  private _styleErrorHandler = (e: Error): void => {
    this._emitter.emit('BasemapStyleError', e);
  };

  private _attributionLoadHandler = (e: AttributionControl): void => {
    this._emitter.emit('BasemapAttributionLoad', e);
  };

  /**
   * Registers an event handler
   * @param eventName - A basemap style event
   * @param handler - Custom handler function
   */
  on<K extends keyof BasemapStyleEventMap>(eventName: K, handler: (data: BasemapStyleEventMap[K]) => void): void {
    this._emitter.on(eventName, handler);
  }

  /**
   * Deregisters an event handler
   * @param eventName - A basemap style event
   * @param handler - Custom handler function
   */
  off<K extends keyof BasemapStyleEventMap>(eventName: K, handler: (data: BasemapStyleEventMap[K]) => void): void {
    this._emitter.off(eventName, handler);
  }

  /**
   * Static method that returns a basemap style URL.
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The URL of the specified ArcGIS basemap style with all included parameters
   */
  static url(options: IBasemapStyleOptions): string {
    return new BasemapStyle(options)._styleUrl;
  }

  /**
   * Creates, loads, and applies a new BasemapStyle to a maplibre map.
   * @param map - A maplibre-gl map to apply the basemap style to.
   * @param options - Style options, including a style ID and authentication
   * @returns - BasemapStyle object
   */
  static applyStyle(map: Map, options: IApplyStyleOptions): BasemapStyle {
    if (!map) throw new Error('Must provide a maplibre-gl \'Map\' to apply style to.');

    const basemapStyle = new BasemapStyle(options);

    basemapStyle.loadStyle().then((_) => {
      basemapStyle.applyTo(map, options.maplibreStyleOptions);
    }).catch((e) => { throw e; });

    return basemapStyle;
  }

  /**
   * Static method that makes a `/self` request to the ArcGIS Basemap Styles service.
   * @see https://developers.arcgis.com/rest/basemap-styles/service-self-get/
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The response returned by the Basemap Styles service.
   */
  static async getSelf(options: { token?: string; baseUrl?: string }): Promise<BasemapSelfResponse> {
    const basemapServiceUrl = options?.baseUrl ? options.baseUrl : DEFAULT_BASE_URL;
    const authentication = await wrapAccessToken(options?.token);
    return await request(`${basemapServiceUrl}/self`, {
      authentication: authentication,
      httpMethod: 'GET',
    }) as BasemapSelfResponse;
  }
}

export default BasemapStyle;
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
