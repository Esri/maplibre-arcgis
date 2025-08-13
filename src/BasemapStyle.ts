import type { Map } from 'maplibre-gl';
import type { AttributionControlOptions, StyleOptions, StyleSpecification, StyleSwapOptions, VectorTileSource } from 'maplibre-gl';
import { request } from '@esri/arcgis-rest-request';
import { EsriAttribution } from './AttributionControl';
import type { RestJSAuthenticationManager } from './Util';
import type BasemapStyleSession from './BasemapSession';

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
  token?: string;
  session?: BasemapStyleSession;
  authentication?: string | RestJSAuthenticationManager;
  language?: string;
  worldview?: string;
  places?: PlacesOptions;
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
  private _isItemId: boolean;
  // private _transformStyleFn?:TransformStyleFunction;
  private _map?: Map;
  private _baseUrl: string;

  /**
   *
   * @param style - The basemap style enumeration
   * @param options - Additional options, including access token and style preferences
   */
  constructor(styleId: string, options: IBasemapStyleOptions) {
    // Access token validation
    if (options.session) this._session = options.session;
    else if (options.authentication) this.authentication = options.authentication;
    else if (options.token) this.authentication = options.token;

    else throw new Error(
      'An ArcGIS access token is required to load basemap styles. To get one, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.'
    );
    this._baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
    this.styleId = styleId;

    this._updatePreferences({
      language: options?.language,
      worldview: options?.worldview,
      places: options?.places,
    });

    this.attributionControl = EsriAttribution;
  }

  get styleUrl(): string {
    let styleUrl = `${this._baseUrl}/${this.styleId}`;

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

  async applyStyleTo(map: Map, setStyleOptions: StyleSwapOptions & StyleOptions): Promise<StyleSpecification> {
    if (!this.style) {
      await this._loadStyle();
    }
    this._map = map;

    map.setStyle(this.style, setStyleOptions);

    return this.style;
  }
  async updateStyle(styleId: string, map?: Map);
  async updateStyle(styleId: string, preferences?: BasemapPreferences, map?: Map);
  async updateStyle(preferences: BasemapPreferences, map?: Map);

  async updateStyle(styleIdOrPreferences: string | BasemapPreferences, preferencesOrMap?: BasemapPreferences | Map, map?: Map): Promise<StyleSpecification> {
    let mapObject = this._map;

    if (typeof styleIdOrPreferences === 'string') {
      // If it's a style ID or enum, change the style
      this.styleId = styleIdOrPreferences;

      if (preferencesOrMap !== undefined) {
        if ((preferencesOrMap as Map).version !== undefined) {
          // Second argument is a map
          mapObject = preferencesOrMap as Map;
        }
        else {
          // Second argument is preferences
          this._updatePreferences(preferencesOrMap as BasemapPreferences);
          if (map !== undefined) mapObject = map;
        }
      }
    }
    else {
      // If it's preferences, update them
      this._updatePreferences(styleIdOrPreferences);
      if (map !== undefined) mapObject = map;
    }

    await this._loadStyle();

    if (mapObject) {
      mapObject.setStyle(this.style);
    }
    return this.style;
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
      console.debug('Style refresh...');
      const oldToken = sessionData.previous.token;
      const newToken = sessionData.current.token;
      this.authentication = newToken; // update the class with the new token
      this._updateTiles(oldToken, newToken, map); // update the map with the new token
    });
  }

  private _updateTiles(fromToken: string, toToken: string, map?: Map): void {
    console.log('Updating map tiles with new token...');

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

  async _loadStyle(): Promise<void> {
    if (this._session) {
      await this._setSession();
    }
    // Request style JSON
    const style = await (request(`${this._baseUrl}/${this.styleId}`, {
      authentication: this.authentication,
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
    return;
  }

  /**
   * Static method that returns a basemap style URL. Does not add a basemap style to the map.
   * @param style - The basemap style enumeration being requested
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The URL of the specified ArcGIS basemap style with all included parameters
   */
  static url(style: string, options: IBasemapStyleOptions): string {
    return new BasemapStyle(style, options).styleUrl;
  }

  /**
   * Factory method that creates a BasemapStyle and loads style JSON
   * @param style - The basemap style enumeration to load
   * @param options - Additional parameters including authentication
   * @returns BasemapStyle object
   */
  static async createBasemapStyle(style: string, options: IBasemapStyleOptions): Promise<BasemapStyle> {
    const basemapStyle = new BasemapStyle(style, options);
    await basemapStyle._loadStyle();

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
