interface BasemapStyle {
    styleEnum: string;
    accessToken: string;
    language: string | null;
    worldview: string | null;
    version: 1 | 2;
    options: IBasemapStyleOptions
}

type IBasemapStyleOptions = {
    token: string | null;
    apiKey: string | null;
    language: string | null;
    worldview: string | null;
    version: 1 | 2 | null;
}

class BasemapStyle {
    constructor (styleEnum : string, options : IBasemapStyleOptions) {

        this.styleEnum = styleEnum; // arcgis/outdoor
        // TODO remove forward slash if passed

        // access token parsing
        // TODO
        // TODO support for REST JS authentication objects as well

        // optional support for legacy basemap styles URL
        this.version = (options.version && options.version == 1) ? 1 : 2;

    }

    get styleUrl () {

        const v1BaseUrl = 'https://basemaps-api.arcgis.com/arcgis/rest/services/styles';
        const v2BaseUrl = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2';
        const baseUrl = (this.version == 2) ? v2BaseUrl : v1BaseUrl;

        // TODO worldview, language, etc
        return `${baseUrl}/${this.styleEnum}?token=${this.accessToken}`;
    }

    // TODO method to update style, refresh style object -> how to update map with new style url?
}

export default BasemapStyle;

/*
// Esri Leaflet style constructor
const basemapStyle = (styleEnum, options) => {
    return new BasemapStyle(styleEnum,options);
}
export default basemapStyle;
*/

/*
maplibregl.Esri.basemapStyle('arcgis/outdoor',{
    style: 'arcgis/outdoor',
    worldview: 'unitedStatesOfAmerica',
    language: 'es',
    accessToken: '...'
});
*/