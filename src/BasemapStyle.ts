import type { AttributionControlOptions, Map, StyleOptions, StyleSpecification, StyleSwapOptions } from 'maplibre-gl';
import { request } from '@esri/arcgis-rest-request';
import { EsriAttribution } from './AttributionControl';
import type { RestJSAuthenticationManager } from './Util';

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
type StyleFamily = 'arcgis' | 'open' | 'osm';
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
    token: string;
    authentication: RestJSAuthenticationManager;
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
    authentication: RestJSAuthenticationManager | string;

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
        if (options.authentication) this.authentication = options.authentication;
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

    async updateStyle(styleId: string, preferences?: BasemapPreferences);
    async updateStyle(preferences: BasemapPreferences);
    async updateStyle(styleIdOrPreferences: string | BasemapPreferences, preferences?: BasemapPreferences) {
        if (typeof styleIdOrPreferences === 'string') {
            // If it's a style ID or enum, change the style
            this.styleId = styleIdOrPreferences;
            this._updatePreferences(preferences);
        }
        else {
            // If it's preferences, update them
            this._updatePreferences(styleIdOrPreferences);
        }

        return this.loadStyle();
    }

    async applyStyleTo(map: Map, setStyleOptions: StyleSwapOptions & StyleOptions): Promise<StyleSpecification> {
        if (!this.style) {
            await this.loadStyle();
        }

        map.setStyle(this.style, setStyleOptions);

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

    private get token(): string {
        return typeof this.authentication === 'string' ? this.authentication : this.authentication.token;
    }

    async loadStyle(): Promise<void> {
        const style = await (request(`${this._baseUrl}/${this.styleId}`, {
            authentication: this.authentication,
            httpMethod: 'GET',
            params: this.preferences,
        }) as Promise<StyleSpecification>);

        // process echoToken locally

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

    static async createBasemapStyle(styleId: string, options: IBasemapStyleOptions): Promise<BasemapStyle> {
        const style = new BasemapStyle(styleId, options);
        await style.loadStyle();

        return style;
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
