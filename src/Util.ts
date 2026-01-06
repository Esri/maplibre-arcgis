import { ApiKeyManager, ArcGISIdentityManager, type ApplicationCredentialsManager } from '@esri/arcgis-rest-request';

/**
 * Custom type to represent authentication managers used in ArcGIS REST JS.
 * @see https://developers.arcgis.com/arcgis-rest-js/authentication/
 */
export type RestJSAuthenticationManager = ApiKeyManager | ArcGISIdentityManager | ApplicationCredentialsManager;

type SupportedServiceType = 'FeatureService' | 'FeatureLayer' | 'VectorTileService' | 'VectorTileLayer';

export const checkItemId = (itemId: string): 'ItemId' | null => {
  if (itemId.length == 32) return 'ItemId';

  return null;
};
export const checkServiceUrlType = (serviceUrl: string): SupportedServiceType | null => {
  const httpRegex = /^https?:\/\//;
  // const layerEndpointTest = "(?<layers>[0-9]*\/?)?$";

  if (httpRegex.test(serviceUrl)) {
    const vectorServiceTest = /\/VectorTileServer\/?$/.exec(serviceUrl);
    if (vectorServiceTest) {
      return 'VectorTileService';
    };

    const featureServiceTest = /\/FeatureServer\/?([0-9]*\/?)?$/.exec(serviceUrl);
    if (featureServiceTest) {
      if (featureServiceTest.length == 2 && featureServiceTest[1]) {
        return 'FeatureLayer';
      };
      return 'FeatureService';
    }
  }

  return null;
};
export const cleanUrl = (url: string): string => {
  if (url[url.length - 1] !== '/') {
    url += '/';
  }
  return url;
};

export const isRelativePath = (path: string): boolean => {
  if (!path.startsWith('http:\/\/') && !path.startsWith('https:\/\/')) {
    if (path.includes('../')) return true;
  };
  return false;
};

export const parseRelativeUrl = (relativePath: string, base: string): string => {
  const parsedResult = URL.parse(relativePath, base);
  return parsedResult.href;
};

export const toCdnUrl = (url: string): string | null => {
  if (!url) return url || null;

  url = normalizeArcGISOnlineOrgDomain(url);

  url = url.replace(/^https?:\/\/www\.arcgis\.com/, 'https://cdn.arcgis.com');
  url = url.replace(/^https?:\/\/devext\.arcgis\.com/, 'https://cdndev.arcgis.com');
  url = url.replace(/^https?:\/\/qaext\.arcgis\.com/, 'https://cdnqa.arcgis.com');

  return url;
};
/**
 * Replaces the AGOL org domains with non-org domains.
 * Borrowed from the JS Maps SDK
 */
const normalizeArcGISOnlineOrgDomain = (url: string): string => {
  const prdOrg = /^https?:\/\/(?:cdn|[a-z\d-]+\.maps)\.arcgis\.com/i; // https://cdn.arcgis.com or https://x.maps.arcgis.com
  const devextOrg = /^https?:\/\/(?:cdndev|[a-z\d-]+\.mapsdevext)\.arcgis\.com/i; // https://cdndev.arcgis.com or https://x.mapsdevext.arcgis.com
  const qaOrg = /^https?:\/\/(?:cdnqa|[a-z\d-]+\.mapsqa)\.arcgis\.com/i; // https://cdnqa.arcgis.com or https://x.mapsqa.arcgis.com

  // replace AGOL org domains with non-org domains
  if (prdOrg.test(url)) {
    url = url.replace(prdOrg, 'https://www.arcgis.com');
  }
  else if (devextOrg.test(url)) {
    url = url.replace(devextOrg, 'https://devext.arcgis.com');
  }
  else if (qaOrg.test(url)) {
    url = url.replace(qaOrg, 'https://qaext.arcgis.com');
  }

  return url;
};

export const warn = (...args: any[]) => {
  if (console && console.warn) {
    console.warn.apply(console, args);
  }
};

export const checkAccessTokenType = (token: string): 'user' | 'app' | 'basemapSession' => {
  if (!token || token.length === 0) return null;
  // API key case -- also catches app tokens w/ personal privileges
  const apiKeyPrefixes = ['AAPT', 'AAPK', 'AATK'];
  for (const prefix of apiKeyPrefixes) if (token.startsWith(prefix)) return 'app';

  // Session token for basemaps
  const sessionTokenPrefixes = ['AAST'];
  for (const prefix of sessionTokenPrefixes) if (token.startsWith(prefix)) return 'basemapSession';

  // OAuth 2.0 style token
  if (token.length == 256) return 'user';
  else if (token.length === 128) return 'app'; // treated identically to API key

  // Token type not recognized; default to 'app'
  return 'app';
};
export const wrapAccessToken = async (token: string, portalUrl?: string): Promise<ApiKeyManager | ArcGISIdentityManager> => {
  if (!token || token.length === 0) return null;
  const tokenType = checkAccessTokenType(token);
  // User tokens
  if (tokenType === 'user') return await ArcGISIdentityManager.fromToken({
    token: token,
    portal: portalUrl ? portalUrl : 'https://www.arcgis.com/sharing/rest',
  });
  // API keys, app tokens, session tokens
  else if (tokenType === 'app' || tokenType === 'basemapSession') return ApiKeyManager.fromKey({
    key: token,
    portal: portalUrl ? portalUrl : 'https://www.arcgis.com/sharing/rest',
  });
  else return null;
};
// Copyright 2025 Esri
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
