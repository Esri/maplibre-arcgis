import type { Map, StyleOptions, StyleSpecification, StyleSwapOptions } from 'maplibre-gl';
import { AttributionControl, type IAttributionControlOptions } from './AttributionControl';
import type BasemapSession from './BasemapSession';
/**
 * Structure of a BasemapStyle object. Go to the [ArcGIS REST API](https://developers.arcgis.com/rest/basemap-styles/styles-self-get/) to learn more.
 */
export type BasemapSelfResponse = {
    customStylesUrl: string;
    selfUrl: string;
    languages: [CodeNamePair];
    worldviews: [CodeNamePair];
    places: [CodeNamePair];
    styleFamilies: [CodeNamePair];
    styles: [
        {
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
        }
    ];
};
export type CodeNamePair = {
    code: string;
    name: string;
};
export type PlacesOptions = 'all' | 'attributed' | 'none';
export type StyleFamily = 'arcgis' | 'open';
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
    /**
     * Fired when the basemap style is loaded.
     */
    BasemapStyleLoad: BasemapStyle;
    /**
     * Fired when the basemap attribution is loaded.
     */
    BasemapAttributionLoad: AttributionControl;
    /**
     * Fired when the basemap style errors.
     */
    BasemapStyleError: Error;
};
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
     * @internal For setting the service url to QA, dev environment, etc.
     */
    baseUrl?: string;
}
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
}
/**
 * Options for updateStyle
 */
export interface IUpdateStyleOptions {
    /**
     * A basemap style enumeration or item ID.
     */
    style?: string;
    /**
     * A new ArcGIS access token. This will override the existing token.
     */
    token?: string;
    /**
     * Set style preferences including language, worldview, and places.
     */
    preferences?: IBasemapPreferences;
    /**
     * Passthrough options for maplibre-gl map.setStyle()
     */
    maplibreStyleOptions?: MaplibreStyleOptions;
}
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
}
/**
 * The BasemapStyle class is used to load and apply ArcGIS basemap styles to a maplibre map.
 *
 * The `BasemapStyle` class provides:
 * - Loading of basemap styles from the [ArcGIS Basemap Styles service](https://developers.arcgis.com/rest/basemap-styles/).
 * - Support for ArcGIS access tokens and sessions for authentication.
 * - Support for style preferences such as `language`, `places`, and `worldview`.
 * - An attribution control that meets Esri's attribution requirements.
 * - Events for style load, attribution load, and error handling.
 *
 * ```javascript
 * import { Map } from 'maplibre-gl';
 * import { BasemapStyle } from '@esri/maplibre-arcgis';
 * // create a maplibre map
 * const map = new Map({
 *   container: 'map', // container id
 *   center: [-118.805,34.027], // starting position [lng, lat]
 *   zoom: 13 // starting zoom
 * });
 *
 * // create a BasemapStyle
 * const basemapStyle = maplibreArcGIS.BasemapStyle.applyStyle(map, {
 *    style: 'arcgis/imagery',
 *    token: apiKey
 *  });
 * ```
 */
export declare class BasemapStyle {
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
    private _attributionControlOptions;
    private _isItemId;
    private _map?;
    private _baseUrl;
    private readonly _emitter;
    /**
     * Creates an instance of BasemapStyle. Creating basemap styles using the constructor directly is discouraged. The recommended method is to use the static {@link BasemapStyle.applyStyle} method.
     *
     * ```javascript
     * import { BasemapStyle } from '@esri/maplibre-arcgis';
     *
     * const basemapStyle = new BasemapStyle({
     *   style: 'arcgis/streets',
     *   token  : 'YOUR_ACCESS_TOKEN',
     *   preferences: {
     *     language: 'en',
     *     worldview: 'unitedStatesOfAmerica',
     *     places: 'attributed'
     *   }
     * });
     *
     * basemapStyle.applyTo(map);
     *
     * basemapStyle.on('BasemapStyleLoad', (e) => {
     *   console.log('Basemap style loaded', e);
     * });
     *
     * basemapStyle.on('BasemapAttributionLoad', (e) => {
     *   console.log('Attribution control loaded', e);
     * });
     *
     * basemapStyle.on('BasemapStyleError', (e) => {
     *   console.error('Error loading basemap style', e);
     * });
     * ```
     * @param options - Configuration options for the basemap style.
     *
     */
    constructor(options: IBasemapStyleOptions);
    private get _styleUrl();
    private get _token();
    /**
     * Associates the BasemapStyle with a maplibre-gl map.
     * @param map - A maplibre-gl map.
     * @returns The BasemapStyle object.
     */
    setMap(map: Map): BasemapStyle;
    /**
     * Applies the basemap style to a maplibre-gl map.
     * @param map - A maplibre-gl map. The map may either be passed here or in the constructor.
     * @param maplibreStyleOptions - Optional style object for maplibre-gl, including the `transformStyle` function.
     * @returns - The maplibre-gl map that the style was applied to.
     */
    applyTo(map: Map, maplibreStyleOptions?: MaplibreStyleOptions): Map;
    /**
     * Updates the basemap style with new options and applies it to the current map.
     * @param options - Options to customize the style enumeration and preferences such as language.
     */
    updateStyle(options: IUpdateStyleOptions): Promise<StyleSpecification>;
    /**
     * Loads the basemap style from the Basemap Styles service.
     * @returns The maplibre style specification of the basemap style, formatted properly.
     */
    loadStyle(): Promise<StyleSpecification>;
    private _setEsriAttribution;
    private _updatePreferences;
    private _updateToken;
    private _styleLoadHandler;
    private _styleErrorHandler;
    private _attributionLoadHandler;
    /**
     * Registers an event handler
     * @param eventName - A basemap style event
     * @param handler - Custom handler function
     */
    on<K extends keyof BasemapStyleEventMap>(eventName: K, handler: (data: BasemapStyleEventMap[K]) => void): void;
    /**
     * Deregisters an event handler
     * @param eventName - A basemap style event
     * @param handler - Custom handler function
     */
    off<K extends keyof BasemapStyleEventMap>(eventName: K, handler: (data: BasemapStyleEventMap[K]) => void): void;
    /**
     * Static method that returns a basemap style URL.
     * @param options - Additional parameters including an ArcGIS access token
     * @returns The URL of the specified ArcGIS basemap style with all included parameters
     */
    static url(options: IBasemapStyleOptions): string;
    /**
     * Creates, loads, and applies a new BasemapStyle to a maplibre map.
     * @param map - A maplibre-gl map to apply the basemap style to.
     * @param options - Style options, including a style ID and authentication
     * @returns - BasemapStyle object
     */
    static applyStyle(map: Map, options: IApplyStyleOptions): BasemapStyle;
    /**
     * Static method that makes a `/self` request to the ArcGIS Basemap Styles service.
     * @see https://developers.arcgis.com/rest/basemap-styles/service-self-get/
     * @param options - Additional parameters including an ArcGIS access token
     * @returns The response returned by the Basemap Styles service.
     */
    static getSelf(options?: {
        token?: string;
        baseUrl?: string;
    }): Promise<BasemapSelfResponse>;
}
export default BasemapStyle;
