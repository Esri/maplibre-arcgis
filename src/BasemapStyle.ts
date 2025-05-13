type IBasemapStyleOptions = {
    accessToken: string;
    language: string | null;
    worldview: string | null;
    places: string | null;
}

type StyleFamily = 'arcgis' | 'open' | 'osm';
type StyleEnum = `${StyleFamily}/${string}`;
type BasemapServiceUrl = string;

export class BasemapStyle {
    // Type declarations
    style: StyleEnum;
    accessToken: string;
    _baseUrl: BasemapServiceUrl;
    language: string | null;
    worldview: string | null;
    places: string | null;
    options: IBasemapStyleOptions

    /**
     * 
     * @param {StyleEnum} style - The basemap style enumeration
     * @param {IBasemapStyleOptions} options
     */
    constructor (style : StyleEnum, options : IBasemapStyleOptions) {

        // Validate style family
        this.style = style; // arcgis/outdoor

        // Access token validation

        if (options.accessToken) this.accessToken = options.accessToken;
        else throw new Error(
            'An ArcGIS access token is required to load basemap styles. To get one, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/.'
        )
        // TODO add support for REST JS authentication objects

        this._baseUrl = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
        let isItemId = false;
        if (!(this.style.startsWith('osm/') || this.style.startsWith('arcgis/')) && this.style.length === 32) {
            // Check if style is an item ID
            this._baseUrl += `/items/${this.style}`;
            isItemId = true;
        }
        else this._baseUrl += `/${this.style}`;

        // Language param
        if (options.language) {
            if (isItemId) console.warn('The \'language\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.language = options.language;
        }

        // Worldview param
        if (options.worldview) {
            if (isItemId) console.warn('The \'worldview\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.worldview = options.worldview;
        }

        // Places param
        if (options.places) {
            if (isItemId) console.warn('The \'places\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.places = options.places;
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