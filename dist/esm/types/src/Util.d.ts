import { ApiKeyManager, ArcGISIdentityManager, type ApplicationCredentialsManager } from '@esri/arcgis-rest-request';
/**
 * Custom type to represent authentication managers used in ArcGIS REST JS.
 * @see https://developers.arcgis.com/arcgis-rest-js/authentication/
 */
export type RestJSAuthenticationManager = ApiKeyManager | ArcGISIdentityManager | ApplicationCredentialsManager;
type SupportedServiceType = 'FeatureService' | 'FeatureLayer' | 'VectorTileService' | 'VectorTileLayer';
export declare const checkItemId: (itemId: string) => "ItemId" | null;
export declare const checkServiceUrlType: (serviceUrl: string) => SupportedServiceType | null;
export declare const cleanUrl: (url: string) => string;
export declare const isRelativePath: (path: string) => boolean;
export declare const parseRelativeUrl: (relativePath: string, base: string) => string;
export declare const toCdnUrl: (url: string) => string | null;
export declare const warn: (...args: any[]) => void;
export declare const checkAccessTokenType: (token: string) => "user" | "app" | "basemapSession" | null;
export declare const wrapAccessToken: (token: string, portalUrl?: string) => Promise<ApiKeyManager | ArcGISIdentityManager>;
export declare const getBlankFc: () => GeoJSON.FeatureCollection;
export {};
