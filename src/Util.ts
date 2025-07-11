import type {ApiKeyManager, ApplicationCredentialsManager, ArcGISIdentityManager} from '@esri/arcgis-rest-request';

export type ItemId = string;
export type RestJSAuthenticationManager = ApiKeyManager | ArcGISIdentityManager | ApplicationCredentialsManager;

type SupportedServiceType = 'FeatureService' | 'FeatureLayer' | 'VectorTileService' | 'VectorTileLayer';

export const checkItemId = (itemId : ItemId) : 'ItemId' | null => {
    if (itemId.length == 32) return 'ItemId';

    return null;
}
export const checkServiceUrlType = (serviceUrl : string) : SupportedServiceType | null => {
    
    const httpRegex = /^https?:\/\//;
    
    // const layerEndpointTest = "(?<layers>[0-9]*\/?)?$";

    if (httpRegex.test(serviceUrl)) {
        
        const vectorServiceTest = /\/VectorTileServer\/?$/.exec(serviceUrl);
        if (vectorServiceTest) {
            return 'VectorTileService'
        };
        
        const featureServiceTest = /\/FeatureServer\/?([0-9]*\/?)?$/.exec(serviceUrl);
        if (featureServiceTest) {
            if (featureServiceTest.length == 2 && featureServiceTest[1]) {
                return 'FeatureLayer'
            };
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

export const warn = (...args : any[]) => {
  if (console && console.warn) {
    console.warn.apply(console, args);
  }
}