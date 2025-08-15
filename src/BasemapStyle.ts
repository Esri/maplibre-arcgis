import type { Map, AttributionControl as MapLibreAttributionControl, AttributionControlOptions, StyleOptions, StyleSpecification, StyleSwapOptions, VectorTileSource, IControl } from 'maplibre-gl';
import { ApiKeyManager, request } from '@esri/arcgis-rest-request';
import type BasemapStyleSession from './BasemapSession';
import { AttributionControl as EsriAttributionControl, EsriAttribution } from './AttributionControl';
import { checkItemId, type RestJSAuthenticationManager } from './Util';

type BasemapSelfResponse = {
  customStylesUrl: string;
  selfUrl: string;
  languages: [CodeNamePair];
  worldviews: [CodeNamePair];
  places: [CodeNamePair];
  styleFamilies: [CodeNamePair];
  styles: [BasemapStyleObject];
};

type CodeNamePair = {
  code: string;
  name: string;
};
type PlacesOptions = 'all' | 'attributed' | 'none';
export type StyleFamily = 'arcgis' | 'open' | 'osm';
type StyleEnum = `${StyleFamily}/${string}`;

type BasemapStyleObject = {
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

type IBasemapStyleOptions = {
  style: StyleEnum;
  map: Map;
  token?: string;
  session?: BasemapStyleSession;
  authentication?: string | RestJSAuthenticationManager;
  language?: string;
  worldview?: string;
  places?: PlacesOptions;
  setStyleOptions?: StyleOptions & StyleSwapOptions;
  /**
   * @internal
   */
  baseUrl?: string;
  // transformStyle?:TransformStyleFunction;
};

type BasemapPreferences = {
  places?: PlacesOptions;
  worldview?: string;
  language?: string;
};

const DEFAULT_BASE_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
// const DEV_URL = 'https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/styles';

export class BasemapStyle {
  // Type declarations
  style: StyleSpecification;
  styleId: string;
  attributionControl: AttributionControlOptions;
  authentication: string | RestJSAuthenticationManager;
  _session: BasemapStyleSession;
  preferences: BasemapPreferences;
  options: IBasemapStyleOptions;
  setStyleOptions?: StyleOptions & StyleSwapOptions;
  private _isItemId: boolean;
  // private _transformStyleFn?:TransformStyleFunction;
  private _map?: Map;
  private _baseUrl: string;

  /**
   *
   * @param style - The basemap style enumeration
   * @param options - Additional options, including access token and style preferences
   */
  constructor(options: IBasemapStyleOptions) {
    if (!options || !options.style) throw new Error('BasemapStyle must be initialized with a style enumeration, such as \'arcgis/streets\' or \'arcgis/outdoor\'.');
    // Access token validation
    if (options.session) this._session = options.session;
    else if (options.authentication) this.authentication = options.authentication;
    else if (options.token) this.authentication = options.token;
    else throw new Error(
      'An ArcGIS access token is required to load basemap styles. To get one, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.'
    );

    if (options.map) this._map = options.map;

    this.styleId = options.style;
    this._baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
    this._isItemId = checkItemId(this.styleId) == 'ItemId' ? true : false;

    this._updatePreferences({
      language: options?.language,
      worldview: options?.worldview,
      places: options?.places,
    });

    this.attributionControl = EsriAttribution;
  }

  get styleUrl(): string {
    let styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;

    styleUrl += `?token=${this.token}`;

    if (this.preferences.language) {
      styleUrl += `&language=${this.preferences.language}`;
    }
    if (this.preferences.worldview) {
      styleUrl += `&worldview=${this.preferences.worldview}`;
    }
    if (this.preferences.places) {
      styleUrl += `&places=${this.preferences.places}`;
    }

    return styleUrl;
  }

  private get token(): string {
    return typeof this.authentication === 'string' ? this.authentication : this.authentication.token;
  }

  setMap(map: Map): BasemapStyle {
    this._map = map;
    return this;
  }

  applyToMap(): Map {
    if (!this._map) throw new Error('Unable to apply style: Basemap style was not initialized with a \'Map\' object.');

    this._map.setStyle(this.style, this.setStyleOptions);
    this._setEsriAttribution();

    return this._map;
  }

  async updateStyle(styleId: string, preferences?: BasemapPreferences);
  async updateStyle(preferences: BasemapPreferences);
  async updateStyle(styleIdOrPreferences: string | BasemapPreferences, preferences?: BasemapPreferences): Promise<StyleSpecification> {
    if (typeof styleIdOrPreferences === 'string') {
      // If it's a style ID or enum, change the style
      this.styleId = styleIdOrPreferences;

      if (preferences !== undefined) {
        this._updatePreferences(preferences);
      }
    }
    else {
      // If it's preferences, update them
      this._updatePreferences(styleIdOrPreferences);
    }

    await this.loadStyle();
    this.applyToMap();

    return this.style;
  }

  private _setEsriAttribution(map?: Map) {
    if (map) this._map = map;
    if (!this._map) throw new Error('No map was passed to ArcGIS BasemapStyle.');

    if (this._map._controls.length > 0) {
      this._map._controls.forEach((control: IControl) => {
        if ((control as MapLibreAttributionControl).options?.customAttribution !== undefined) {
          // squash maplibre attribution control
          this._map.removeControl(control);
        }
      });
      this._map.addControl(new EsriAttributionControl());
    }
  }

  private _updatePreferences(preferences: BasemapPreferences) {
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

  private async _setSession(map?: Map): Promise<void> {
    if (!this._session) throw new Error('No session was provided to the constructor.');
    if (!this._session.isStarted) {
      await this._session.initialize();
    }

    this.authentication = this._session.token;

    this._session.on('BasemapSessionRefreshed', (sessionData) => {
      const oldToken = sessionData.previous.token;
      const newToken = sessionData.current.token;
      this.authentication = newToken; // update the class with the new token
      this._updateTiles(oldToken, newToken, map); // update the map with the new token
    });
  }

  private _updateTiles(fromToken: string, toToken: string, map?: Map): void {
    if (map) this._map = map;

    if (!this._map) throw new Error('Unable to update map tiles with new session token: Session does not have access to the map.');

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

  async loadStyle(): Promise<BasemapStyle> {
    if (this._session) {
      await this._setSession();
    }
    // Request style JSON
    const styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;
    const authentication = typeof this.authentication == 'string' ? ApiKeyManager.fromKey(this.authentication) : this.authentication; // TODO why can't we just pass a string here?
    const style = await (request(styleUrl, {
      authentication: authentication,
      httpMethod: 'GET',
      params: {
        ...this.preferences,
        echoToken: false,
      },
    }) as Promise<StyleSpecification>);

    // Handle glyphs
    style.glyphs = `${style.glyphs}?token=${this.token}`;

    // Handle sources
    Object.keys(style.sources).forEach((sourceId) => {
      const source = style.sources[sourceId];

      if (source.type === 'raster' || source.type === 'vector' || source.type === 'raster-dem') {
        if (source.tiles.length > 0) {
          for (let i = 0; i < source.tiles.length; i++) source.tiles[i] = `${source.tiles[i]}?token=${this.token}`;
        }
      }
    });

    if (!this._session) {
      // Handle sprite
      if (Array.isArray(style.sprite)) {
        style.sprite.forEach((sprite, id, spriteArray) => {
          spriteArray[id].url = `${sprite.url}?token=${this.token}`;
        });
      }
      else {
        style.sprite = `${style.sprite}?token=${this.token}`;
      }
    }

    this.style = style;
    return this;
  }

  /**
   * Static method that returns a basemap style URL. Does not add a basemap style to the map.
   * @param style - The basemap style enumeration being requested
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The URL of the specified ArcGIS basemap style with all included parameters
   */
  static url(options: IBasemapStyleOptions): string {
    return new BasemapStyle(options).styleUrl;
  }

  /**
   * Creates, loads, and applies a new BasemapStyle to a maplibre map.
   * @param map - A maplibre-gl map to apply the basemap style to.
   * @param options - Style options, including a style ID and authentication
   * @returns - BasemapStyle object
   */
  static applyStyle(map: Map, options: IBasemapStyleOptions): BasemapStyle {
    if (!map) throw new Error('Must provide a maplibre-gl \'Map\' to apply style to.');
    options.map = map;

    const basemapStyle = new BasemapStyle(options);

    basemapStyle.loadStyle().then((basemapStyle) => {
      basemapStyle.applyToMap();
    }).catch((e) => { throw e; });

    return basemapStyle;
  }

  /**
   * Makes a \'/self\' request to the basemap styles service endpoint
   * @param token - An ArcGIS access token
   */
  static async getSelf(options: { token?: string; baseUrl?: string }): Promise<BasemapSelfResponse> {
    const basemapServiceUrl = options?.baseUrl ? options.baseUrl : DEFAULT_BASE_URL;

    return await request(`${basemapServiceUrl}/self`, {
      authentication: options?.token,
      httpMethod: 'GET',
    }) as BasemapSelfResponse;
  }
}

export default BasemapStyle;
