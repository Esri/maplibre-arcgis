import { Map } from "maplibre-gl";

type IBasemapStyleOptions = {
    accessToken: string;
    language?: string;
    worldview?: string;
    places?: PlacesOptions;
}

type StyleFamily = 'arcgis' | 'open' | 'osm';
type StyleEnum = `${StyleFamily}/${string}`;
type ItemId = string;
type StyleOptions = StyleEnum | ItemId;
type BasemapServiceUrl = string;
type PlacesOptions = 'all' | 'attributed' | 'none';

export class BasemapStyle {
    // Type declarations
    style: StyleOptions;
    accessToken: string;
    _baseUrl: BasemapServiceUrl;
    language?: string;
    worldview?: string;
    places?: PlacesOptions;
    options: IBasemapStyleOptions
    _isItemId: boolean;
    // map: Map; for updating

    // TODO setStyle, setPlaces, setLanguage


    static _baseUrl: BasemapServiceUrl = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
    /**
     * 
     * @param {StyleOptions} style - The basemap style enumeration
     * @param {IBasemapStyleOptions} options
     */
    constructor (style : StyleOptions, options : IBasemapStyleOptions) {

        // Access token validation
        if (options.accessToken) this.accessToken = options.accessToken;
        else throw new Error(
            'An ArcGIS access token is required to load basemap styles. To get one, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.'
        )
        // TODO add support for REST JS authentication objects

        // Configure style and base URL
        this.setStyle(style);

        // Language param
        if (options.language) {
            this.setLanguage(options.language);
        }
        // Worldview param
        if (options.worldview) {
            this.setWorldview(options.worldview);
        }
        // Places param
        if (options.places) {
            this.setPlaces(options.places);
        }
    }

    get styleUrl () {

        let styleUrl = this._baseUrl;
        styleUrl += `?token=${this.accessToken}`;
        
        if (this.language) {
            styleUrl += `&language=${this.language}`;
        }
        if (this.worldview) {
            styleUrl += `&worldview=${this.worldview}`;
        }
        if (this.places) {
            styleUrl += `&places=${this.places}`;
        }

        return styleUrl;
    }

    setStyle (style : StyleOptions) {
        this.style = style; // arcgis/outdoor
        if (!(this.style.startsWith('arcgis/') || this.style.startsWith('open/') || this.style.startsWith('osm/')) && this.style.length === 32) {
            // Style is an ItemId
            this._baseUrl = `${BasemapStyle._baseUrl}/items/${this.style}`;
            this._isItemId = true;
        }
        else {
            // Style is a StyleEnum
            this._baseUrl = `${BasemapStyle._baseUrl}/${this.style}`;        
            this._isItemId = false;
        }
    }

    setPlaces (placesOption : PlacesOptions | null) {
        if (!placesOption) return;
        
        if (this._isItemId) console.warn('The \'places\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
        else this.places = placesOption;
    }

    setLanguage (languageOption : string | null) {
        if (!languageOption) return;
        
        if (this._isItemId) console.warn('The \'language\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
        else this.language = languageOption;
    }

    setWorldview (worldviewOption : string | null) {
        if (!worldviewOption) return;
        
        if (this._isItemId) console.warn('The \'worldview\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
        else this.worldview = worldviewOption;
    }

    /**
     * Makes a \'/self\' request to the basemap styles service endpoint
     * @param accessToken An ArcGIS access token
     */
    static getSelf (options:{accessToken?:string}) {

        const selfUrl = `${BasemapStyle._baseUrl}/self`;

        const headers = {};
        if (options?.accessToken) {
            headers["X-Esri-Authorization"] = `Bearer ${options?.accessToken}`;
        }
        return new Promise(async (resolve, reject) => {
            const response = await fetch(selfUrl,{
                headers
            });
            if (!response.ok) reject(`Error: ${response.status}`);

            const json = await response.json();
            resolve(json);
        });
    }

    static url (style : StyleEnum, options :IBasemapStyleOptions) {
        return new BasemapStyle(style,options).styleUrl;
    }
}

export default BasemapStyle;

/**
 * Helper method that returns a basemap style URL directly without the instantiated object.
 * @param {StyleEnum} style The basemap style enumeration being requested
 * @param {IBasemapStyleOptions} options Additional parameters including an ArcGIS access token
 * @returns {BasemapServiceUrl} The URL of the specified ArcGIS basemap style with all included parameters
 */
export const basemapStyleUrl = (style : StyleEnum, options :IBasemapStyleOptions) => {
    return new BasemapStyle(style,options).styleUrl;
}