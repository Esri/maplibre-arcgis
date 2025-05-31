import { IControl, Map } from "maplibre-gl";
import { request } from "./Request";
import { ItemId } from "./Util";
import { AttributionControl } from './AttributionControl';
import { AttributionControl as MaplibreAttributionControl } from "maplibre-gl";

type IBasemapStyleOptions = {
    accessToken: string;
    language?: string;
    worldview?: string;
    places?: PlacesOptions;
}

type BasemapPreferences = {
    places?: PlacesOptions;
    worldview?: string;
    language?: string;
}

type PlacesOptions = 'all' | 'attributed' | 'none';
type StyleFamily = 'arcgis' | 'open' | 'osm';
type StyleEnum = `${StyleFamily}/${string}`;
type StyleOptions = StyleEnum | ItemId;

export class BasemapStyle {
    // Type declarations
    style: StyleOptions;
    accessToken: string;
    
    preferences: BasemapPreferences;

    options: IBasemapStyleOptions;
    _isItemId: boolean;
    _map?: Map;
    _baseUrl: string;
    static _baseUrl: string = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
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
        this.setPreferences({
            language:options?.language,
            worldview:options?.worldview,
            places:options?.places
        });
    }

    get styleUrl () : string {

        let styleUrl = this._baseUrl;
        styleUrl += `?token=${this.accessToken}`;
        
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

    addTo (map : Map) : BasemapStyle {
        this._map = map;
        map.setStyle(this.styleUrl);

        this._updateAttribution();

        return this;
    }

    _updateAttribution () : void {
        if (!this._map) return;

        // Remove existing attribution controls
        if (this._map._controls.length > 0) {

            const controlIsAttribution = (control : any) : control is MaplibreAttributionControl => {
                return control.options.customAttribution !== undefined;
            }
            this._map._controls.forEach(control => {            
                if (controlIsAttribution(control)) {
                    this._map?.removeControl(control);
                }
            })
        }
        // Add Esri attribution
        this._map.addControl(new AttributionControl())
    }

    setStyle (style : StyleOptions) : BasemapStyle {
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
        if (this._map) this._map.setStyle(this.styleUrl);

        return this;
    }

    setPreferences (preferences : BasemapPreferences) : BasemapStyle {
        if (!this.preferences) this.preferences = {};

        if (preferences.language) {
            if (this._isItemId) console.warn('The \'language\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.preferences.language = preferences.language;
        }
        if (preferences.places) {
            if (this._isItemId) console.warn('The \'places\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.preferences.places = preferences.places;
        }
        if (preferences.worldview) {
            if (this._isItemId) console.warn('The \'worldview\' option of basemap styles is not supported with custom basemaps. This parameter will be ignored.');
            else this.preferences.worldview = preferences.worldview;
        }

        if (this._map) this._map.setStyle(this.styleUrl);

        return this;
    }
    /**
     * Makes a \'/self\' request to the basemap styles service endpoint
     * @param accessToken An ArcGIS access token
     */
    static async getSelf (options:{accessToken?:string}) : Promise<any> {
        return await request(`${BasemapStyle._baseUrl}/self`,{token:options?.accessToken});
    }
    /**
     * Static method that returns a basemap style URL. Does not add a basemap style to the map.
     * @param {StyleEnum} style The basemap style enumeration being requested
     * @param {IBasemapStyleOptions} options Additional parameters including an ArcGIS access token
     * @returns {string} The URL of the specified ArcGIS basemap style with all included parameters
     */
    static url (style : StyleEnum, options :IBasemapStyleOptions) : string {
        return new BasemapStyle(style,options).styleUrl;
    }
}

export default BasemapStyle;


