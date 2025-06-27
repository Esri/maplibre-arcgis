import { request } from "./Request";

type ServiceUrl = string;
export type ItemId = string;
export type ServiceUrlOrItemId = ServiceUrl | ItemId;
type AccessToken = string;

export type CommonRequestParams = {
    token?: AccessToken;
    f?: 'html' | 'json' | 'pjson'
}
type SupportedServiceTypes = 'FeatureService' | 'FeatureLayer' | 'VectorTileService' | 'VectorTileLayer';

export const checkItemId = (itemId : ItemId) : 'ItemId' | null => {
    if (itemId.length == 32) return 'ItemId';

    return null;
}
export const checkServiceUrlType = (serviceUrl : string) : SupportedServiceTypes | null => {
    
    const httpRegex = /^https?:\/\//;
    
    const layerEndpointTest = "(?<layers>[0-9]*\/?)?$";

    if (httpRegex.test(serviceUrl)) {
        
        const vectorServiceTest = /\/VectorTileServer\/?$/.exec(serviceUrl);
        if (vectorServiceTest) {
            return 'VectorTileService'
        };
        
        const featureServiceTest = /\/FeatureServer\/?(?<layers>[0-9]*\/?)?$/.exec(serviceUrl);
        if (featureServiceTest) {
            if (featureServiceTest.groups['layers']) return 'FeatureLayer';
            return 'FeatureService';
        }
    }

    return null;
}
export const cleanUrl = (url : string) : string => {
    if (url[url.length - 1] !== "/") {
        url += "/";
    }
    return url;
}

export const itemRequest = async (itemId : ItemId, options : CommonRequestParams & {portalUrl:string, endpoint?:string}) : Promise<any> => {
    const itemUrl = `${options.portalUrl ? options.portalUrl : 'https://www.arcgis.com'}/sharing/rest/content/items/${itemId}${options.endpoint ? options.endpoint : ''}`;
    const params = (({portalUrl,endpoint,...params})=>params)(options);
    return request(itemUrl, params);
}