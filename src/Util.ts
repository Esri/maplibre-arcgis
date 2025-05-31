import { request } from "./Request";

type ServiceUrl = string;
export type ItemId = string;
export type ServiceUrlOrItemId = ServiceUrl | ItemId;
type AccessToken = string;

export type CommonRequestParams = {
    token?: AccessToken;
    f?: 'html' | 'json' | 'pjson'
}

export const vectorTileServiceRegex = /\/VectorTileServer\/?.*$/;

export const checkServiceUrlOrItemId = (idOrUrl : ServiceUrlOrItemId) : 'serviceUrl' | 'itemId' => {

    const httpRegex = /^https?:\/\//;

    // Check other service types here eventually
    if (httpRegex.test(idOrUrl) && vectorTileServiceRegex.test(idOrUrl)) {
        return 'serviceUrl';
    }
    else if (idOrUrl.length == 32) {
        return 'itemId';
    }
    else throw new Error('Input must be a valid ArcGIS service URL or item ID.');
}

export const itemRequest = async (itemId : ItemId, options : CommonRequestParams & {portalUrl:string, endpoint?:string}) : Promise<any> => {
    const itemUrl = `${options.portalUrl ? options.portalUrl : 'https://www.arcgis.com'}/sharing/rest/content/items/${itemId}${options.endpoint ? options.endpoint : ''}`;
    const params = (({portalUrl,endpoint,...params})=>params)(options);
    return request(itemUrl, params);
}