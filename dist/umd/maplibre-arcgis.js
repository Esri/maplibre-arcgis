/* @esri/maplibre-arcgis - v1.0.0-beta-7 - Wed Sep 17 2025 07:31:07 GMT-0700 (Pacific Daylight Time)
 * Copyright (c) 2025 Environmental Systems Research Institute, Inc.
 * Apache-2.0 */(function(g,f){if(typeof exports=="object"&&typeof module<"u"){module.exports=f(require)}else if("function"==typeof define && define.amd){define("maplibreArcGIS",["maplibre-gl"],function(_d_0){var d={"maplibre-gl": _d_0},r=function(m){if(m in d) return d[m];if(typeof require=="function") return require(m);throw new Error("Cannot find module '"+m+"'")};return f(r)})}else {var gN={"maplibre-gl":"maplibregl"},gReq=function(r){var mod = r in gN ? g[gN[r]] : g[r]; return mod };g["maplibreArcGIS"]=f(gReq)}}(typeof globalThis < "u" ? globalThis : typeof self < "u" ? self : this,function(require){var exports={};var __exports=exports;var module={exports};
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/MaplibreArcGIS.ts
var MaplibreArcGIS_exports = {};
__export(MaplibreArcGIS_exports, {
  AttributionControl: () => AttributionControl,
  BasemapSession: () => BasemapSession,
  BasemapStyle: () => BasemapStyle,
  EsriAttribution: () => EsriAttribution,
  FeatureLayer: () => FeatureLayer,
  HostedLayer: () => HostedLayer,
  VERSION: () => version,
  VectorTileLayer: () => VectorTileLayer
});
module.exports = __toCommonJS(MaplibreArcGIS_exports);

// src/AttributionControl.ts
var import_maplibre_gl = __toESM(require("maplibre-gl"), 1);
var esriAttributionString = 'Powered by <a href="https://www.esri.com/">Esri</a>';
var maplibreAttributionString = '<a href="https://maplibre.org/">MapLibre</a>';
var defaultMaplibreAttributionString = '<a href="https://maplibre.org/" target="_blank">MapLibre</a>';
var EsriAttribution = {
  customAttribution: `${maplibreAttributionString} | ${esriAttributionString}`,
  compact: true
};
var AttributionControl = class _AttributionControl extends import_maplibre_gl.default.AttributionControl {
  /**
   * Constructor for AttributionControl.
   * @param options - Options for the attribution control.
   * ```javascript
   * const attributionControl = new AttributionControl({
   *   customAttribution: ['Custom Attribution 1', 'Custom Attribution 2'],
   *   closed: false,
   *   compact: true,
   * });
   * ```
   */
  constructor(options = {}) {
    if (!options?.compact && options?.collapsed) options.compact = true;
    const attributions = [];
    if (options.customAttribution) {
      if (Array.isArray(options.customAttribution)) {
        attributions.concat(
          options.customAttribution.map((attribution) => {
            if (typeof attribution !== "string") return "";
            return attribution;
          })
        );
      } else if (typeof options.customAttribution === "string") {
        attributions.push(options.customAttribution);
      }
    }
    attributions.push(esriAttributionString, maplibreAttributionString);
    const attributionOptions = {
      compact: options?.compact !== void 0 ? options.compact : true,
      customAttribution: attributions.join(" | ")
    };
    super(attributionOptions);
    this.attributionOptions = attributionOptions;
    this._closed = options?.collapsed;
  }
  /**
   * Event that runs after the control is added to the map.
   * @param map - A MapLibre GL JS Map
   * @returns HTMLElement | null
   * @internal
   */
  onAdd(map) {
    this._map = map;
    if (!this.canAdd(this._map)) {
      console.warn("Esri attribution already present on map. This attribution control will not be added.");
      return null;
    }
    const htmlElement = super.onAdd(map);
    if (this._closed && this._container.classList.contains("maplibregl-compact-show")) {
      this._container.classList.remove("maplibregl-compact-show");
    }
    return htmlElement;
  }
  /**
   * Checks if the control can be added to the map.
   * @param map - {@link MaplibreMap}
   * @returns boolean
   * @internal
   */
  canAdd(map) {
    if (!map && !this._map) throw new Error("No map provided to attribution control.");
    if (!map) map = this._map;
    let attributionExists = false;
    if (map._controls.length > 0) {
      map._controls.forEach((control) => {
        if ("_toggleAttribution" in control) {
          const attributionControl = control;
          if (attributionControl.options.customAttribution === defaultMaplibreAttributionString) {
            map.removeControl(attributionControl);
          } else if (attributionControl.options.customAttribution.includes(esriAttributionString)) {
            attributionExists = true;
          } else {
            const errorMessage = "Unable to load Esri attribution. Set the attributionControl property of BasemapStyle to display custom attribution.";
            throw new Error(errorMessage);
          }
        }
      });
    }
    return !attributionExists;
  }
  /**
   * Returns the default Esri attribution control options.
   * @returns MaplibreAttributionControlOptions
   */
  static get esriAttribution() {
    const defaultAttribution = new _AttributionControl();
    return defaultAttribution.attributionOptions;
  }
};
var AttributionControl_default = AttributionControl;

// node_modules/mitt/dist/mitt.mjs
function mitt_default(n) {
  return { all: n = n || /* @__PURE__ */ new Map(), on: function(t, e) {
    var i = n.get(t);
    i ? i.push(e) : n.set(t, [e]);
  }, off: function(t, e) {
    var i = n.get(t);
    i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []));
  }, emit: function(t, e) {
    var i = n.get(t);
    i && i.slice().map(function(n2) {
      n2(e);
    }), (i = n.get("*")) && i.slice().map(function(n2) {
      n2(t, e);
    });
  } };
}

// node_modules/tslib/tslib.es6.mjs
function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/process-params.js
function requiresFormData(params) {
  return Object.keys(params).some((key) => {
    let value = params[key];
    if (!value) {
      return false;
    }
    if (value && value.toParam) {
      value = value.toParam();
    }
    const type = value.constructor.name;
    switch (type) {
      case "Array":
        return false;
      case "Object":
        return false;
      case "Date":
        return false;
      case "Function":
        return false;
      case "Boolean":
        return false;
      case "String":
        return false;
      case "Number":
        return false;
      default:
        return true;
    }
  });
}
function processParams(params) {
  const newParams = {};
  Object.keys(params).forEach((key) => {
    var _a, _b;
    let param = params[key];
    if (param && param.toParam) {
      param = param.toParam();
    }
    if (!param && param !== 0 && typeof param !== "boolean" && typeof param !== "string") {
      return;
    }
    const type = param.constructor.name;
    let value;
    switch (type) {
      case "Array":
        const firstElementType = (_b = (_a = param[0]) === null || _a === void 0 ? void 0 : _a.constructor) === null || _b === void 0 ? void 0 : _b.name;
        value = firstElementType === "Array" ? param : firstElementType === "Object" ? JSON.stringify(param) : param.join(",");
        break;
      case "Object":
        value = JSON.stringify(param);
        break;
      case "Date":
        value = param.valueOf();
        break;
      case "Function":
        value = null;
        break;
      case "Boolean":
        value = param + "";
        break;
      default:
        value = param;
        break;
    }
    if (value || value === 0 || typeof value === "string" || Array.isArray(value)) {
      newParams[key] = value;
    }
  });
  return newParams;
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/encode-query-string.js
function encodeParam(key, value) {
  if (Array.isArray(value) && value[0] && Array.isArray(value[0])) {
    return value.map((arrayElem) => encodeParam(key, arrayElem)).join("&");
  }
  return encodeURIComponent(key) + "=" + encodeURIComponent(value);
}
function encodeQueryString(params) {
  const newParams = processParams(params);
  return Object.keys(newParams).map((key) => {
    return encodeParam(key, newParams[key]);
  }).join("&");
}

// node_modules/@esri/arcgis-rest-form-data/browser-ponyfill.mjs
var FormData = globalThis.FormData;
var File = globalThis.File;
var Blob2 = globalThis.Blob;

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/encode-form-data.js
function encodeFormData(params, forceFormData) {
  const useFormData = requiresFormData(params) || forceFormData;
  const newParams = processParams(params);
  if (useFormData) {
    const formData = new FormData();
    Object.keys(newParams).forEach((key) => {
      if (typeof Blob !== "undefined" && newParams[key] instanceof Blob) {
        const filename = newParams["fileName"] || newParams[key].name || key;
        formData.append(key, newParams[key], filename);
      } else {
        formData.append(key, newParams[key]);
      }
    });
    return formData;
  } else {
    return encodeQueryString(params);
  }
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/ArcGISRequestError.js
var ArcGISRequestError = class extends Error {
  /**
   * Create a new `ArcGISRequestError`  object.
   *
   * @param message - The error message from the API
   * @param code - The error code from the API
   * @param response - The original response from the API that caused the error
   * @param url - The original url of the request
   * @param options - The original options and parameters of the request
   */
  constructor(message, code, response, url, options) {
    super(message);
    const actualProto = new.target.prototype;
    Object.setPrototypeOf(this, actualProto);
    message = message || "UNKNOWN_ERROR";
    code = code || "UNKNOWN_ERROR_CODE";
    this.name = "ArcGISRequestError";
    this.message = code === "UNKNOWN_ERROR_CODE" ? message : `${code}: ${message}`;
    this.originalMessage = message;
    this.code = code;
    this.response = response;
    this.url = url;
    this.options = options;
  }
};

// node_modules/@esri/arcgis-rest-request/dist/esm/requestConfig.js
var DEFAULT_ARCGIS_REQUEST_CONFIG = {
  noCorsDomains: [],
  crossOriginNoCorsDomains: {},
  pendingNoCorsRequests: {}
};
var GLOBAL_VARIABLE_NAME = "ARCGIS_REST_JS_NO_CORS";
if (!globalThis[GLOBAL_VARIABLE_NAME]) {
  globalThis[GLOBAL_VARIABLE_NAME] = Object.assign({}, DEFAULT_ARCGIS_REQUEST_CONFIG);
}
var requestConfig = globalThis[GLOBAL_VARIABLE_NAME];

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/sendNoCorsRequest.js
function sendNoCorsRequest(url) {
  const urlObj = new URL(url);
  url = urlObj.origin + urlObj.pathname;
  if (urlObj.search.includes("f=json")) {
    url += "?f=json";
  }
  const origin = urlObj.origin;
  if (requestConfig.pendingNoCorsRequests[origin]) {
    return requestConfig.pendingNoCorsRequests[origin];
  }
  requestConfig.pendingNoCorsRequests[origin] = fetch(url, {
    mode: "no-cors",
    credentials: "include",
    cache: "no-store"
  }).then((response) => {
    if (requestConfig.noCorsDomains.indexOf(origin) === -1) {
      requestConfig.noCorsDomains.push(origin);
    }
    requestConfig.crossOriginNoCorsDomains[origin.toLowerCase()] = Date.now();
    delete requestConfig.pendingNoCorsRequests[origin];
  }).catch((e) => {
    delete requestConfig.pendingNoCorsRequests[origin];
    return Promise.reject(new Error(`no-cors request to ${origin} failed`));
  });
  return requestConfig.pendingNoCorsRequests[origin];
}
function registerNoCorsDomains(authorizedCrossOriginNoCorsDomains) {
  authorizedCrossOriginNoCorsDomains.forEach((domain) => {
    domain = domain.toLowerCase();
    if (/^https?:\/\//.test(domain)) {
      addNoCorsDomain(domain);
    } else {
      addNoCorsDomain("http://" + domain);
      addNoCorsDomain("https://" + domain);
    }
  });
}
function addNoCorsDomain(url) {
  const uri = new URL(url);
  const domain = uri.origin;
  if (requestConfig.noCorsDomains.indexOf(domain) === -1) {
    requestConfig.noCorsDomains.push(domain);
  }
}
function isNoCorsDomain(url) {
  let result = false;
  if (requestConfig.noCorsDomains.length) {
    const origin = new URL(url).origin.toLowerCase();
    result = requestConfig.noCorsDomains.some((domain) => {
      return origin.includes(domain);
    });
  }
  return result;
}
function isNoCorsRequestRequired(url) {
  let result = false;
  if (isNoCorsDomain(url)) {
    const origin = new URL(url).origin.toLowerCase();
    const lastRequest = requestConfig.crossOriginNoCorsDomains[origin] || 0;
    if (Date.now() - 60 * 6e4 > lastRequest) {
      result = true;
    }
  }
  return result;
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/warn.js
function warn(message) {
  if (console && console.warn) {
    console.warn.apply(console, [message]);
  }
}

// node_modules/@esri/arcgis-rest-fetch/browser-ponyfill.mjs
function getFetch() {
  return Promise.resolve({
    fetch: globalThis.fetch,
    Headers: globalThis.Headers,
    Response: globalThis.Response,
    Request: globalThis.Request
  });
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/isSameOrigin.js
function isSameOrigin(url, win) {
  var _a;
  if (!win && !window || !url) {
    return false;
  } else {
    win = win || window;
    const origin = (_a = win.location) === null || _a === void 0 ? void 0 : _a.origin;
    return url.startsWith(origin);
  }
}

// node_modules/@esri/arcgis-rest-request/dist/esm/request.js
var NODEJS_DEFAULT_REFERER_HEADER = `@esri/arcgis-rest-js`;
function getDefaultRequestOptions() {
  return globalThis.DEFAULT_ARCGIS_REQUEST_OPTIONS || {
    httpMethod: "POST",
    params: {
      f: "json"
    }
  };
}
var ArcGISAuthError = class extends ArcGISRequestError {
  /**
   * Create a new `ArcGISAuthError`  object.
   *
   * @param message - The error message from the API
   * @param code - The error code from the API
   * @param response - The original response from the API that caused the error
   * @param url - The original url of the request
   * @param options - The original options of the request
   */
  constructor(message = "AUTHENTICATION_ERROR", code = "AUTHENTICATION_ERROR_CODE", response, url, options) {
    super(message, code, response, url, options);
    this.name = "ArcGISAuthError";
    this.message = code === "AUTHENTICATION_ERROR_CODE" ? message : `${code}: ${message}`;
    const actualProto = new.target.prototype;
    Object.setPrototypeOf(this, actualProto);
  }
  retry(getSession, retryLimit = 1) {
    let tries = 0;
    const retryRequest = (resolve, reject) => {
      tries = tries + 1;
      getSession(this.url, this.options).then((session) => {
        const newOptions = Object.assign(Object.assign({}, this.options), { authentication: session });
        return internalRequest(this.url, newOptions);
      }).then((response) => {
        resolve(response);
      }).catch((e) => {
        if (e.name === "ArcGISAuthError" && tries < retryLimit) {
          retryRequest(resolve, reject);
        } else if (e.name === this.name && e.message === this.message && tries >= retryLimit) {
          reject(this);
        } else {
          reject(e);
        }
      });
    };
    return new Promise((resolve, reject) => {
      retryRequest(resolve, reject);
    });
  }
};
function checkForErrors(response, url, params, options, originalAuthError) {
  if (response.code >= 400) {
    const { message, code } = response;
    throw new ArcGISRequestError(message, code, response, url, options);
  }
  if (response.error) {
    const { message, code, messageCode } = response.error;
    const errorCode = messageCode || code || "UNKNOWN_ERROR_CODE";
    if (code === 498 || code === 499) {
      if (originalAuthError) {
        throw originalAuthError;
      } else {
        throw new ArcGISAuthError(message, errorCode, response, url, options);
      }
    }
    throw new ArcGISRequestError(message, errorCode, response, url, options);
  }
  if (response.status === "failed" || response.status === "failure") {
    let message;
    let code = "UNKNOWN_ERROR_CODE";
    try {
      message = JSON.parse(response.statusMessage).message;
      code = JSON.parse(response.statusMessage).code;
    } catch (e) {
      message = response.statusMessage || response.message;
    }
    throw new ArcGISRequestError(message, code, response, url, options);
  }
  return response;
}
function internalRequest(url, requestOptions) {
  const defaults = getDefaultRequestOptions();
  const options = Object.assign(Object.assign(Object.assign({ httpMethod: "POST" }, defaults), requestOptions), {
    params: Object.assign(Object.assign({}, defaults.params), requestOptions.params),
    headers: Object.assign(Object.assign({}, defaults.headers), requestOptions.headers)
  });
  const { httpMethod, rawResponse } = options;
  const params = Object.assign({ f: "json" }, options.params);
  let originalAuthError = null;
  const fetchOptions = {
    method: httpMethod,
    signal: options.signal,
    /* ensures behavior mimics XMLHttpRequest.
    needed to support sending IWA cookies */
    credentials: options.credentials || "same-origin"
  };
  if (isNoCorsDomain(url)) {
    fetchOptions.credentials = "include";
  }
  if (options.headers && options.headers["X-Esri-Auth-Client-Id"] && url.indexOf("/oauth2/platformSelf") > -1) {
    fetchOptions.credentials = "include";
  }
  let authentication;
  if (typeof options.authentication === "string") {
    const rawToken = options.authentication;
    authentication = {
      portal: "https://www.arcgis.com/sharing/rest",
      getToken: () => {
        return Promise.resolve(rawToken);
      }
    };
    if (!options.authentication.startsWith("AAPK") && !options.authentication.startsWith("AATK") && // doesn't look like an API Key
    !options.suppressWarnings && // user doesn't want to suppress warnings for this request
    !globalThis.ARCGIS_REST_JS_SUPPRESS_TOKEN_WARNING) {
      warn(`Using an oAuth 2.0 access token directly in the token option is discouraged. Consider using ArcGISIdentityManager or Application session. See https://esriurl.com/arcgis-rest-js-direct-token-warning for more information.`);
      globalThis.ARCGIS_REST_JS_SUPPRESS_TOKEN_WARNING = true;
    }
  } else {
    authentication = options.authentication;
  }
  const originalUrl = url;
  let sameOrigin = false;
  if (typeof window !== "undefined") {
    sameOrigin = isSameOrigin(url);
  }
  const requiresNoCors = !sameOrigin && isNoCorsRequestRequired(url);
  if (options.headers && options.headers["X-Esri-Auth-Client-Id"] && url.indexOf("/oauth2/platformSelf") > -1) {
    fetchOptions.credentials = "include";
  }
  let firstPromise = Promise.resolve();
  if (requiresNoCors) {
    fetchOptions.credentials = "include";
    firstPromise = sendNoCorsRequest(url);
  }
  return firstPromise.then(() => authentication ? authentication.getToken(url).catch((err) => {
    err.url = url;
    err.options = options;
    originalAuthError = err;
    return Promise.resolve("");
  }) : Promise.resolve("")).then((token) => {
    if (token.length) {
      params.token = token;
    }
    if (authentication && authentication.getDomainCredentials) {
      fetchOptions.credentials = authentication.getDomainCredentials(url);
    }
    const requestHeaders = {};
    if (fetchOptions.method === "GET") {
      if (params.token && options.hideToken && // Sharing API does not support preflight check required by modern browsers https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request
      typeof window === "undefined") {
        requestHeaders["X-Esri-Authorization"] = `Bearer ${params.token}`;
        delete params.token;
      }
      const queryParams = encodeQueryString(params);
      const urlWithQueryString = queryParams === "" ? url : url + "?" + encodeQueryString(params);
      if (
        // This would exceed the maximum length for URLs by 2000 as default or as specified by the consumer and requires POST
        options.maxUrlLength && urlWithQueryString.length > options.maxUrlLength || !options.maxUrlLength && urlWithQueryString.length > 2e3 || // Or if the customer requires the token to be hidden and it has not already been hidden in the header (for browsers)
        params.token && options.hideToken
      ) {
        fetchOptions.method = "POST";
        if (token.length && options.hideToken) {
          params.token = token;
          delete requestHeaders["X-Esri-Authorization"];
        }
      } else {
        url = urlWithQueryString;
      }
    }
    const forceFormData = new RegExp("/items/.+/updateResources").test(url);
    if (fetchOptions.method === "POST") {
      fetchOptions.body = encodeFormData(params, forceFormData);
    }
    fetchOptions.headers = Object.assign(Object.assign({}, requestHeaders), options.headers);
    if ((typeof window === "undefined" || window && typeof window.document === "undefined") && !fetchOptions.headers.referer) {
      fetchOptions.headers.referer = NODEJS_DEFAULT_REFERER_HEADER;
    }
    if (!requiresFormData(params) && !forceFormData) {
      fetchOptions.headers["Content-Type"] = "application/x-www-form-urlencoded";
    }
    return globalThis.fetch ? globalThis.fetch(url, fetchOptions) : getFetch().then(({ fetch: fetch2 }) => {
      return fetch2(url, fetchOptions);
    });
  }).then((response) => {
    if (!response.ok) {
      return response.json().then((jsonError) => {
        const { status, statusText } = response;
        const { message, details } = jsonError.error;
        const formattedMessage = `${message}. ${details ? details.join(" ") : ""}`.trim();
        throw new ArcGISRequestError(formattedMessage, `HTTP ${status} ${statusText}`, jsonError, url, options);
      }).catch((e) => {
        if (e.name === "ArcGISRequestError") {
          throw e;
        }
        const { status, statusText } = response;
        throw new ArcGISRequestError(statusText, `HTTP ${status}`, response, url, options);
      });
    }
    if (rawResponse) {
      return response;
    }
    switch (params.f) {
      case "json":
        return response.json();
      case "geojson":
        return response.json();
      case "html":
        return response.text();
      case "text":
        return response.text();
      /* istanbul ignore next blob responses are difficult to make cross platform we will just have to trust that isomorphic fetch will do its job */
      default:
        return response.blob();
    }
  }).then((data) => {
    if ((params.f === "json" || params.f === "geojson") && !rawResponse) {
      const response = checkForErrors(data, originalUrl, params, options, originalAuthError);
      if (data && /\/sharing\/rest\/(accounts|portals)\/self/i.test(url)) {
        if (Array.isArray(data.authorizedCrossOriginNoCorsDomains)) {
          registerNoCorsDomains(data.authorizedCrossOriginNoCorsDomains);
        }
      }
      if (originalAuthError) {
        const truncatedUrl = url.toLowerCase().split(/\/rest(\/admin)?\/services\//)[0];
        options.authentication.federatedServers[truncatedUrl] = {
          token: [],
          // default to 24 hours
          expires: new Date(Date.now() + 86400 * 1e3)
        };
        originalAuthError = null;
      }
      return response;
    } else {
      return data;
    }
  });
}
function request(url, requestOptions = { params: { f: "json" } }) {
  const { request: request2 } = requestOptions, internalOptions = __rest(requestOptions, ["request"]);
  return request2 ? request2(url, internalOptions) : internalRequest(url, internalOptions).catch((e) => {
    if (e instanceof ArcGISAuthError && requestOptions.authentication && typeof requestOptions.authentication !== "string" && requestOptions.authentication.canRefresh && requestOptions.authentication.refreshCredentials) {
      return e.retry(() => {
        return requestOptions.authentication.refreshCredentials();
      }, 1);
    } else {
      return Promise.reject(e);
    }
  });
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/append-custom-params.js
function appendCustomParams(customOptions, keys, baseOptions) {
  const requestOptionsKeys = [
    "params",
    "httpMethod",
    "rawResponse",
    "authentication",
    "hideToken",
    "portal",
    "credentials",
    "maxUrlLength",
    "headers",
    "signal",
    "suppressWarnings",
    "request"
  ];
  const options = Object.assign(Object.assign({ params: {} }, baseOptions), customOptions);
  options.params = keys.reduce((value, key) => {
    if (customOptions[key] || typeof customOptions[key] === "boolean" || typeof customOptions[key] === "number" && customOptions[key] === 0) {
      value[key] = customOptions[key];
    }
    return value;
  }, options.params);
  return requestOptionsKeys.reduce((value, key) => {
    if (options[key]) {
      value[key] = options[key];
    }
    return value;
  }, {});
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/ArcGISTokenRequestError.js
var ArcGISTokenRequestErrorCodes;
(function(ArcGISTokenRequestErrorCodes2) {
  ArcGISTokenRequestErrorCodes2["TOKEN_REFRESH_FAILED"] = "TOKEN_REFRESH_FAILED";
  ArcGISTokenRequestErrorCodes2["GENERATE_TOKEN_FOR_SERVER_FAILED"] = "GENERATE_TOKEN_FOR_SERVER_FAILED";
  ArcGISTokenRequestErrorCodes2["REFRESH_TOKEN_EXCHANGE_FAILED"] = "REFRESH_TOKEN_EXCHANGE_FAILED";
  ArcGISTokenRequestErrorCodes2["NOT_FEDERATED"] = "NOT_FEDERATED";
  ArcGISTokenRequestErrorCodes2["UNKNOWN_ERROR_CODE"] = "UNKNOWN_ERROR_CODE";
})(ArcGISTokenRequestErrorCodes || (ArcGISTokenRequestErrorCodes = {}));
var ArcGISTokenRequestError = class extends Error {
  /**
   * Create a new `ArcGISTokenRequestError`  object.
   *
   * @param message - The error message from the API
   * @param code - The error code from the API
   * @param response - The original response from the API that caused the error
   * @param url - The original url of the request
   * @param options - The original options and parameters of the request
   */
  constructor(message = "UNKNOWN_ERROR", code = ArcGISTokenRequestErrorCodes.UNKNOWN_ERROR_CODE, response, url, options) {
    super(message);
    const actualProto = new.target.prototype;
    Object.setPrototypeOf(this, actualProto);
    this.name = "ArcGISTokenRequestError";
    this.message = `${code}: ${message}`;
    this.originalMessage = message;
    this.code = code;
    this.response = response;
    this.url = url;
    this.options = options;
  }
};

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/ArcGISAccessDeniedError.js
var ArcGISAccessDeniedError = class extends Error {
  /**
   * Create a new `ArcGISAccessDeniedError`  object.
   */
  constructor() {
    const message = "The user has denied your authorization request.";
    super(message);
    const actualProto = new.target.prototype;
    Object.setPrototypeOf(this, actualProto);
    this.name = "ArcGISAccessDeniedError";
  }
};

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/clean-url.js
function cleanUrl(url) {
  if (typeof url !== "string") {
    return url;
  }
  url = url.trim();
  if (url[url.length - 1] === "/") {
    url = url.slice(0, -1);
  }
  return url;
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/decode-query-string.js
function decodeParam(param) {
  const [key, value] = param.split("=");
  return { key: decodeURIComponent(key), value: decodeURIComponent(value) };
}
function decodeQueryString(query) {
  if (!query || query.length <= 0) {
    return {};
  }
  return query.replace(/^#/, "").replace(/^\?/, "").split("&").reduce((acc, entry) => {
    const { key, value } = decodeParam(entry);
    acc[key] = value;
    return acc;
  }, {});
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/ErrorTypes.js
var ErrorTypes;
(function(ErrorTypes2) {
  ErrorTypes2["ArcGISRequestError"] = "ArcGISRequestError";
  ErrorTypes2["ArcGISAuthError"] = "ArcGISAuthError";
  ErrorTypes2["ArcGISAccessDeniedError"] = "ArcGISAccessDeniedError";
  ErrorTypes2["ArcGISTokenRequestError"] = "ArcGISTokenRequestError";
})(ErrorTypes || (ErrorTypes = {}));

// node_modules/@esri/arcgis-rest-request/dist/esm/fetch-token.js
var FIVE_MINUTES_IN_MILLISECONDS = 5 * 60 * 1e3;
function fetchToken(url, requestOptions) {
  const options = requestOptions;
  options.rawResponse = false;
  return request(url, options).then((response) => {
    if ("token" in response && "expires" in response) {
      return {
        token: response.token,
        username: requestOptions.params.username,
        expires: new Date(response.expires)
      };
    }
    const portalTokenResponse = {
      token: response.access_token,
      username: response.username,
      expires: new Date(
        // convert seconds in response to milliseconds and add the value to the current time to calculate a static expiration timestamp
        // we subtract 5 minutes here to make sure that we refresh the token early if the user makes requests
        Date.now() + response.expires_in * 1e3 - FIVE_MINUTES_IN_MILLISECONDS
      ),
      ssl: response.ssl === true
    };
    if (response.refresh_token) {
      portalTokenResponse.refreshToken = response.refresh_token;
    }
    if (response.refresh_token_expires_in) {
      portalTokenResponse.refreshTokenExpires = new Date(
        // convert seconds in response to milliseconds and add the value to the current time to calculate a static expiration timestamp
        // we subtract 5 minutes here to make sure that we refresh the token early if the user makes requests
        Date.now() + response.refresh_token_expires_in * 1e3 - FIVE_MINUTES_IN_MILLISECONDS
      );
    }
    return portalTokenResponse;
  });
}

// node_modules/@esri/arcgis-rest-request/dist/esm/AuthenticationManagerBase.js
var AuthenticationManagerBase = class {
  constructor(options) {
    this.portal = options.portal ? cleanUrl(options.portal) : "https://www.arcgis.com/sharing/rest";
    this._username = options.username;
  }
  /**
   * The username of the currently authenticated user.
   */
  get username() {
    if (this._username) {
      return this._username;
    }
    if (this._user && this._user.username) {
      return this._user.username;
    }
  }
  /**
   * Returns the username for the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic. This is also used internally when a username is required for some requests but is not present in the options.
   *
   * ```js
   * manager.getUsername()
   *   .then(response => {
   *     console.log(response); // "casey_jones"
   *   })
   * ```
   */
  getUsername() {
    if (this.username) {
      return Promise.resolve(this.username);
    } else {
      return this.getUser().then((user) => {
        return user.username;
      });
    }
  }
  /**
   * Returns information about the currently logged in [user](https://developers.arcgis.com/rest/users-groups-and-items/user.htm). Subsequent calls will *not* result in additional web traffic.
   *
   * ```js
   * manager.getUser()
   *   .then(response => {
   *     console.log(response.role); // "org_admin"
   *   })
   * ```
   *
   * @param requestOptions - Options for the request. NOTE: `rawResponse` is not supported by this operation.
   * @returns A Promise that will resolve with the data from the response.
   */
  getUser(requestOptions) {
    if (this._pendingUserRequest) {
      return this._pendingUserRequest;
    } else if (this._user) {
      return Promise.resolve(this._user);
    } else {
      const url = `${this.portal}/community/self`;
      const options = Object.assign(Object.assign({ httpMethod: "GET", authentication: this }, requestOptions), { rawResponse: false });
      this._pendingUserRequest = request(url, options).then((response) => {
        this._user = response;
        this._pendingUserRequest = null;
        return response;
      });
      return this._pendingUserRequest;
    }
  }
  /**
   * Clear the cached user infornation. Usefull to ensure that the most recent user information from {@linkcode AuthenticationManagerBase.getUser} is used.
   */
  clearCachedUserInfo() {
    this._user = null;
  }
};

// node_modules/@esri/arcgis-rest-request/dist/esm/ApiKeyManager.js
var ApiKeyManager = class _ApiKeyManager extends AuthenticationManagerBase {
  constructor(options) {
    super(options);
    this.portal = "https://www.arcgis.com/sharing/rest";
    this.key = options.key;
  }
  /**
   * The preferred method for creating an instance of `ApiKeyManager`.
   */
  static fromKey(apiKey) {
    if (typeof apiKey === "string") {
      return new _ApiKeyManager({ key: apiKey });
    } else {
      return new _ApiKeyManager(apiKey);
    }
  }
  /**
   * Gets the current access token (the API Key).
   */
  get token() {
    return this.key;
  }
  /**
   * Gets the current access token (the API Key).
   */
  getToken(url) {
    return Promise.resolve(this.key);
  }
  /**
   * Converts the `ApiKeyManager` instance to a JSON object. This is called when the instance is serialized to JSON with [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
   *
   * ```js
   * import { ApiKeyManager } from '@esri/arcgis-rest-request';
   *
   * const apiKey = new ApiKeyManager.fromKey("...")
   *
   * const json = JSON.stringify(session);
   * ```
   *
   * @returns A plain object representation of the instance.
   */
  toJSON() {
    return {
      type: "ApiKeyManager",
      token: this.key,
      username: this.username,
      portal: this.portal
    };
  }
  /**
   * Serializes the ApiKeyManager instance to a JSON string.
   *
   * ```js
   * import { ApiKeyManager } from '@esri/arcgis-rest-request';
   *
   * const apiKey = new ApiKeyManager.fromKey("...")
   *
   * localStorage.setItem("apiKey", apiKey.serialize());
   * ```
   * @returns {string} The serialized JSON string.
   */
  serialize() {
    return JSON.stringify(this);
  }
  /**
   * Deserializes a JSON string previously created with {@linkcode ApiKeyManager.deserialize} to an {@linkcode ApiKeyManager} instance.
   *
   * ```js
   * import { ApiKeyManager } from '@esri/arcgis-rest-request';
   *
   * const apiKey = ApiKeyManager.deserialize(localStorage.getItem("apiKey"));
   * ```
   * @param {string} serialized - The serialized JSON string.
   * @returns {ApiKeyManager} The deserialized ApiKeyManager instance.
   */
  static deserialize(serialized) {
    const data = JSON.parse(serialized);
    return new _ApiKeyManager({
      key: data.token,
      username: data.username,
      portal: data.portal
    });
  }
};

// node_modules/@esri/arcgis-rest-request/dist/esm/federation-utils.js
var arcgisOnlineUrlRegex = /^https?:\/\/(\S+)\.arcgis\.com.+/;
function isOnline(url) {
  return arcgisOnlineUrlRegex.test(url);
}
function normalizeOnlinePortalUrl(portalUrl) {
  if (!arcgisOnlineUrlRegex.test(portalUrl)) {
    return portalUrl;
  }
  switch (getOnlineEnvironment(portalUrl)) {
    case "dev":
      return "https://devext.arcgis.com/sharing/rest";
    case "qa":
      return "https://qaext.arcgis.com/sharing/rest";
    default:
      return "https://www.arcgis.com/sharing/rest";
  }
}
function getOnlineEnvironment(url) {
  if (!arcgisOnlineUrlRegex.test(url)) {
    return null;
  }
  const match = url.match(arcgisOnlineUrlRegex);
  const subdomain = match[1].split(".").pop();
  if (subdomain.includes("dev")) {
    return "dev";
  }
  if (subdomain.includes("qa")) {
    return "qa";
  }
  return "production";
}
function isFederated(owningSystemUrl, portalUrl) {
  const normalizedPortalUrl = cleanUrl(normalizeOnlinePortalUrl(portalUrl)).replace(/https?:\/\//, "");
  const normalizedOwningSystemUrl = cleanUrl(owningSystemUrl).replace(/https?:\/\//, "");
  return new RegExp(normalizedOwningSystemUrl, "i").test(normalizedPortalUrl);
}
function canUseOnlineToken(portalUrl, requestUrl) {
  const portalIsOnline = isOnline(portalUrl);
  const requestIsOnline = isOnline(requestUrl);
  const portalEnv = getOnlineEnvironment(portalUrl);
  const requestEnv = getOnlineEnvironment(requestUrl);
  if (portalIsOnline && requestIsOnline && portalEnv === requestEnv) {
    return true;
  }
  return false;
}

// node_modules/@esri/arcgis-rest-request/dist/esm/validate-app-access.js
function validateAppAccess(token, clientId, portal = "https://www.arcgis.com/sharing/rest") {
  const url = `${portal}/oauth2/validateAppAccess`;
  const ro = {
    method: "POST",
    params: {
      f: "json",
      client_id: clientId,
      token
    }
  };
  return request(url, ro);
}

// node_modules/@esri/arcgis-rest-request/dist/esm/revoke-token.js
function revokeToken(requestOptions) {
  const url = `${cleanUrl(requestOptions.portal || "https://www.arcgis.com/sharing/rest")}/oauth2/revokeToken/`;
  const token = requestOptions.token;
  const clientId = requestOptions.clientId;
  delete requestOptions.portal;
  delete requestOptions.clientId;
  delete requestOptions.token;
  const options = Object.assign(Object.assign({}, requestOptions), { httpMethod: "POST", params: {
    client_id: clientId,
    auth_token: token
  } });
  return request(url, options).then((response) => {
    if (!response.success) {
      throw new ArcGISRequestError("Unable to revoke token", 500, response, url, options);
    }
    return response;
  });
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/base-64-url.js
function base64UrlEncode(value, win = window) {
  if (!win && window) {
    win = window;
  }
  return win.btoa(String.fromCharCode.apply(null, value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/generate-code-challenge.js
function generateCodeChallenge(codeVerifier, win = window) {
  if (!win && window) {
    win = window;
  }
  if (codeVerifier && win.isSecureContext && win.crypto && win.crypto.subtle) {
    const encoder = new win.TextEncoder();
    const bytes = encoder.encode(codeVerifier);
    return win.crypto.subtle.digest("SHA-256", bytes).then((buffer) => base64UrlEncode(new Uint8Array(buffer), win));
  }
  return Promise.resolve(null);
}

// node_modules/@esri/arcgis-rest-request/dist/esm/utils/generate-random-string.js
function generateRandomString(win) {
  if (!win && window) {
    win = window;
  }
  const randomBytes = win.crypto.getRandomValues(new Uint8Array(32));
  return base64UrlEncode(randomBytes);
}

// node_modules/@esri/arcgis-rest-request/dist/esm/ArcGISIdentityManager.js
function isCredential(credential) {
  return typeof credential.userId === "string" || typeof credential.expires === "number";
}
var ArcGISIdentityManager = class _ArcGISIdentityManager extends AuthenticationManagerBase {
  constructor(options) {
    super(options);
    this.clientId = options.clientId;
    this._refreshToken = options.refreshToken;
    this._refreshTokenExpires = options.refreshTokenExpires;
    this.password = options.password;
    this._token = options.token;
    this._tokenExpires = options.tokenExpires;
    this.portal = options.portal ? cleanUrl(options.portal) : "https://www.arcgis.com/sharing/rest";
    this.ssl = options.ssl;
    this.provider = options.provider || "arcgis";
    this.tokenDuration = options.tokenDuration || 20160;
    this.redirectUri = options.redirectUri;
    this.server = options.server;
    this.referer = options.referer;
    this.federatedServers = {};
    this.trustedDomains = [];
    if (options.server) {
      const root = this.getServerRootUrl(options.server);
      this.federatedServers[root] = {
        token: options.token,
        expires: options.tokenExpires
      };
    }
    this._pendingTokenRequests = {};
  }
  /**
   * The current ArcGIS Online or ArcGIS Enterprise `token`.
   */
  get token() {
    return this._token;
  }
  /**
   * The expiration time of the current `token`.
   */
  get tokenExpires() {
    return this._tokenExpires;
  }
  /**
   * The current token to ArcGIS Online or ArcGIS Enterprise.
   */
  get refreshToken() {
    return this._refreshToken;
  }
  /**
   * The expiration time of the current `refreshToken`.
   */
  get refreshTokenExpires() {
    return this._refreshTokenExpires;
  }
  /**
   * Returns `true` if these credentials can be refreshed and `false` if it cannot.
   */
  get canRefresh() {
    if (this.username && this.password) {
      return true;
    }
    if (this.clientId && this.refreshToken && this.redirectUri) {
      return true;
    }
    return false;
  }
  /**
   * Begins a new browser-based OAuth 2.0 sign in. If `options.popup` is `true` the authentication window will open in a new tab/window. Otherwise, the user will be redirected to the authorization page in their current tab/window and the function will return `undefined`.
   *
   * If `popup` is `true` (the default) this method will return a `Promise` that resolves to an `ArcGISIdentityManager` instance and you must call {@linkcode ArcGISIdentityManager.completeOAuth2()} on the page defined in the `redirectUri`. Otherwise it will return undefined and the {@linkcode ArcGISIdentityManager.completeOAuth2()} method will return a `Promise` that resolves to an `ArcGISIdentityManager` instance.
   *
   * A {@linkcode ArcGISAccessDeniedError} error will be thrown if the user denies the request on the authorization screen.
   *
   * @browserOnly
   */
  static beginOAuth2(options, win) {
    if (!win && window) {
      win = window;
    }
    const { portal, provider, clientId, expiration, redirectUri, popup, popupWindowFeatures, locale, params, style, pkce, state } = Object.assign({
      portal: "https://www.arcgis.com/sharing/rest",
      provider: "arcgis",
      expiration: 20160,
      popup: true,
      popupWindowFeatures: "height=400,width=600,menubar=no,location=yes,resizable=yes,scrollbars=yes,status=yes",
      locale: "",
      style: "",
      pkce: true
    }, options);
    const stateId = state || generateRandomString(win);
    const stateStorageKey = `ARCGIS_REST_JS_AUTH_STATE_${clientId}`;
    win.localStorage.setItem(stateStorageKey, stateId);
    let authorizeUrl = `${cleanUrl(portal)}/oauth2/authorize`;
    const authorizeUrlParams = {
      client_id: clientId,
      response_type: pkce ? "code" : "token",
      expiration,
      redirect_uri: redirectUri,
      state: JSON.stringify({
        id: stateId,
        originalUrl: win.location.href
        // this is used to reset the URL back the original URL upon return
      }),
      locale,
      style
    };
    if (provider !== "arcgis") {
      authorizeUrl = `${cleanUrl(portal)}/oauth2/social/authorize`;
      authorizeUrlParams.socialLoginProviderName = provider;
      authorizeUrlParams.autoAccountCreateForSocial = true;
    }
    let setupAuth;
    if (pkce) {
      const codeVerifier = generateRandomString(win);
      const codeVerifierStorageKey = `ARCGIS_REST_JS_CODE_VERIFIER_${clientId}`;
      win.localStorage.setItem(codeVerifierStorageKey, codeVerifier);
      setupAuth = generateCodeChallenge(codeVerifier, win).then(function(codeChallenge) {
        authorizeUrlParams.code_challenge_method = codeChallenge ? "S256" : "plain";
        authorizeUrlParams.code_challenge = codeChallenge ? codeChallenge : codeVerifier;
      });
    } else {
      setupAuth = Promise.resolve();
    }
    return setupAuth.then(() => {
      authorizeUrl = `${authorizeUrl}?${encodeQueryString(authorizeUrlParams)}`;
      if (params) {
        authorizeUrl = `${authorizeUrl}&${encodeQueryString(params)}`;
      }
      if (popup) {
        return new Promise((resolve, reject) => {
          win.addEventListener(`arcgis-rest-js-popup-auth-${clientId}`, (e) => {
            if (e.detail.error === "access_denied") {
              const error2 = new ArcGISAccessDeniedError();
              reject(error2);
              return error2;
            }
            if (e.detail.errorMessage) {
              const error2 = new ArcGISAuthError(e.detail.errorMessage, e.detail.error);
              reject(error2);
              return error2;
            }
            resolve(new _ArcGISIdentityManager({
              clientId,
              portal,
              ssl: e.detail.ssl,
              token: e.detail.token,
              tokenExpires: e.detail.expires,
              username: e.detail.username,
              refreshToken: e.detail.refreshToken,
              refreshTokenExpires: e.detail.refreshTokenExpires,
              redirectUri
            }));
          }, {
            once: true
          });
          win.open(authorizeUrl, "oauth-window", popupWindowFeatures);
          win.dispatchEvent(new CustomEvent("arcgis-rest-js-popup-auth-start"));
        });
      } else {
        win.location.href = authorizeUrl;
        return void 0;
      }
    });
  }
  /**
   * Completes a browser-based OAuth 2.0 sign in. If `options.popup` is `true` the user
   * will be returned to the previous window and the popup will close. Otherwise a new `ArcGISIdentityManager` will be returned. You must pass the same values for `clientId`, `popup`, `portal`, and `pkce` as you used in `beginOAuth2()`.
   *
   * A {@linkcode ArcGISAccessDeniedError} error will be thrown if the user denies the request on the authorization screen.
   * @browserOnly
   */
  static completeOAuth2(options, win) {
    if (!win && window) {
      win = window;
    }
    const { portal, clientId, popup, pkce, redirectUri } = Object.assign({
      portal: "https://www.arcgis.com/sharing/rest",
      popup: true,
      pkce: true
    }, options);
    const stateStorageKey = `ARCGIS_REST_JS_AUTH_STATE_${clientId}`;
    const stateId = win.localStorage.getItem(stateStorageKey);
    const params = decodeQueryString(pkce ? win.location.search.replace(/^\?/, "") : win.location.hash.replace(/^#/, ""));
    const state = params && params.state ? JSON.parse(params.state) : void 0;
    function reportError(errorMessage, error2, originalUrl) {
      win.localStorage.removeItem(stateStorageKey);
      if (popup && win.opener) {
        win.opener.dispatchEvent(new CustomEvent(`arcgis-rest-js-popup-auth-${clientId}`, {
          detail: {
            error: error2,
            errorMessage
          }
        }));
        win.close();
        return;
      }
      if (originalUrl) {
        win.history.replaceState(win.history.state, "", originalUrl);
      }
      if (error2 === "access_denied") {
        return Promise.reject(new ArcGISAccessDeniedError());
      }
      return Promise.reject(new ArcGISAuthError(errorMessage, error2));
    }
    function createManager(oauthInfo, originalUrl) {
      win.localStorage.removeItem(stateStorageKey);
      if (popup && win.opener) {
        win.opener.dispatchEvent(new CustomEvent(`arcgis-rest-js-popup-auth-${clientId}`, {
          detail: Object.assign({}, oauthInfo)
        }));
        win.close();
        return;
      }
      win.history.replaceState(win.history.state, "", originalUrl);
      return new _ArcGISIdentityManager({
        clientId,
        portal,
        ssl: oauthInfo.ssl,
        token: oauthInfo.token,
        tokenExpires: oauthInfo.expires,
        username: oauthInfo.username,
        refreshToken: oauthInfo.refreshToken,
        refreshTokenExpires: oauthInfo.refreshTokenExpires,
        // At 4.0.0 it was possible (in JS code) to not pass redirectUri and fallback to win.location.href, however this broke support for redirect URIs with query params.
        // Now similar to 3.x.x you must pass the redirectUri parameter explicitly. See https://github.com/Esri/arcgis-rest-js/issues/995
        redirectUri: redirectUri || /* istanbul ignore next: TypeScript wont compile if we omit redirectUri */
        location.href.replace(location.search, "")
      });
    }
    if (!stateId || !state) {
      return reportError("No authentication state was found, call `ArcGISIdentityManager.beginOAuth2(...)` to start the authentication process.", "no-auth-state");
    }
    if (state.id !== stateId) {
      return reportError("Saved client state did not match server sent state.", "mismatched-auth-state");
    }
    if (params.error) {
      const error2 = params.error;
      const errorMessage = params.error_description || "Unknown error";
      return reportError(errorMessage, error2, state.originalUrl);
    }
    if (pkce && params.code) {
      const tokenEndpoint = cleanUrl(`${portal}/oauth2/token/`);
      const codeVerifierStorageKey = `ARCGIS_REST_JS_CODE_VERIFIER_${clientId}`;
      const codeVerifier = win.localStorage.getItem(codeVerifierStorageKey);
      win.localStorage.removeItem(codeVerifierStorageKey);
      return fetchToken(tokenEndpoint, {
        httpMethod: "POST",
        params: {
          client_id: clientId,
          code_verifier: codeVerifier,
          grant_type: "authorization_code",
          // using location.href here does not support query params but shipped with 4.0.0. See https://github.com/Esri/arcgis-rest-js/issues/995
          redirect_uri: redirectUri || location.href.replace(location.search, ""),
          code: params.code
        }
      }).then((tokenResponse) => {
        return createManager(Object.assign(Object.assign({}, tokenResponse), state), state.originalUrl);
      }).catch((e) => {
        return reportError(e.originalMessage, e.code, state.originalUrl);
      });
    }
    if (!pkce && params.access_token) {
      return Promise.resolve(createManager(Object.assign({ token: params.access_token, expires: new Date(Date.now() + parseInt(params.expires_in, 10) * 1e3), ssl: params.ssl === "true", username: params.username }, state), state.originalUrl));
    }
    return reportError("Unknown error", "oauth-error", state.originalUrl);
  }
  /**
   * Request credentials information from the parent application
   *
   * When an application is embedded into another application via an IFrame, the embedded app can
   * use `window.postMessage` to request credentials from the host application. This function wraps
   * that behavior.
   *
   * The ArcGIS API for Javascript has this built into the Identity Manager as of the 4.19 release.
   *
   * Note: The parent application will not respond if the embedded app's origin is not:
   * - the same origin as the parent or *.arcgis.com (JSAPI)
   * - in the list of valid child origins (REST-JS)
   *
   *
   * @param parentOrigin origin of the parent frame. Passed into the embedded application as `parentOrigin` query param
   * @browserOnly
   */
  static fromParent(parentOrigin, win) {
    if (!win && window) {
      win = window;
    }
    let handler;
    return new Promise((resolve, reject) => {
      handler = (event) => {
        if (event.source === win.parent && event.data) {
          try {
            return resolve(_ArcGISIdentityManager.parentMessageHandler(event));
          } catch (err) {
            return reject(err);
          }
        }
      };
      win.addEventListener("message", handler, false);
      win.parent.postMessage({ type: "arcgis:auth:requestCredential" }, parentOrigin);
    }).then((manager) => {
      win.removeEventListener("message", handler, false);
      return manager;
    });
  }
  /**
   * Begins a new server-based OAuth 2.0 sign in. This will redirect the user to
   * the ArcGIS Online or ArcGIS Enterprise authorization page.
   *
   * @nodeOnly
   */
  static authorize(options, response) {
    const { portal, clientId, expiration, redirectUri, state } = Object.assign({ portal: "https://arcgis.com/sharing/rest", expiration: 20160 }, options);
    const queryParams = {
      client_id: clientId,
      expiration,
      response_type: "code",
      redirect_uri: redirectUri
    };
    if (state) {
      queryParams.state = state;
    }
    const url = `${portal}/oauth2/authorize?${encodeQueryString(queryParams)}`;
    response.writeHead(301, {
      Location: url
    });
    response.end();
  }
  /**
   * Completes the server-based OAuth 2.0 sign in process by exchanging the `authorizationCode`
   * for a `access_token`.
   *
   * @nodeOnly
   */
  static exchangeAuthorizationCode(options, authorizationCode) {
    const { portal, clientId, redirectUri } = Object.assign({
      portal: "https://www.arcgis.com/sharing/rest"
    }, options);
    return fetchToken(`${portal}/oauth2/token`, {
      params: {
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code: authorizationCode
      }
    }).then((response) => {
      return new _ArcGISIdentityManager({
        clientId,
        portal,
        ssl: response.ssl,
        redirectUri,
        refreshToken: response.refreshToken,
        refreshTokenExpires: response.refreshTokenExpires,
        token: response.token,
        tokenExpires: response.expires,
        username: response.username
      });
    }).catch((e) => {
      throw new ArcGISTokenRequestError(e.message, ArcGISTokenRequestErrorCodes.REFRESH_TOKEN_EXCHANGE_FAILED, e.response, e.url, e.options);
    });
  }
  /**
   * Deserializes a JSON string previously created with {@linkcode ArcGISIdentityManager.serialize} to an {@linkcode ArcGISIdentityManager} instance.
   *
   * ```js
   * // create an ArcGISIdentityManager instance
   * const serializedString = manager.serialize();
   * localStorage.setItem("arcgis-identity-manager", serializedString);
   *
   * // later, you can retrieve the manager from localStorage
   * const serializedString = localStorage.getItem("arcgis-identity-manager");
   * const manager = ArcGISIdentityManager.deserialize(serializedString);
   * ```
   *
   * @param str A JSON string representing an instance of `ArcGISIdentityManager`. This can be created with {@linkcode ArcGISIdentityManager.serialize}.
   */
  static deserialize(str) {
    const options = JSON.parse(str);
    return new _ArcGISIdentityManager({
      clientId: options.clientId,
      refreshToken: options.refreshToken,
      refreshTokenExpires: options.refreshTokenExpires ? new Date(options.refreshTokenExpires) : void 0,
      username: options.username,
      password: options.password,
      token: options.token,
      tokenExpires: options.tokenExpires ? new Date(options.tokenExpires) : void 0,
      portal: options.portal,
      ssl: options.ssl,
      tokenDuration: options.tokenDuration,
      redirectUri: options.redirectUri,
      server: options.server
    });
  }
  /**
   * Translates authentication from the format used in the [`IdentityManager` class in the ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-Credential.html).
   *
   * You will need to call both [`IdentityManger.findCredential`](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#findCredential) and [`IdentityManger.findServerInfo`](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#findServerInfo) to obtain both parameters for this method.
   *
   * This method can be used with {@linkcode ArcGISIdentityManager.toCredential} to interop with the ArcGIS API for JavaScript.
   *
   * ```js
   * require(["esri/id"], (esriId) => {
   *   const credential = esriId.findCredential("https://www.arcgis.com/sharing/rest");
   *   const serverInfo = esriId.findServerInfo("https://www.arcgis.com/sharing/rest");
   *
   *   const manager = ArcGISIdentityManager.fromCredential(credential, serverInfo);
   * });
   * ```
   *
   * @returns ArcGISIdentityManager
   */
  static fromCredential(credential, serverInfo) {
    const ssl = typeof credential.ssl !== "undefined" ? credential.ssl : true;
    const expires = credential.expires || Date.now() + 72e5;
    if (serverInfo.hasServer) {
      return new _ArcGISIdentityManager({
        server: credential.server,
        ssl,
        token: credential.token,
        username: credential.userId,
        tokenExpires: new Date(expires)
      });
    }
    return new _ArcGISIdentityManager({
      portal: cleanUrl(credential.server.includes("sharing/rest") ? credential.server : credential.server + `/sharing/rest`),
      ssl,
      token: credential.token,
      username: credential.userId,
      tokenExpires: new Date(expires)
    });
  }
  /**
   * Handle the response from the parent
   * @param event DOM Event
   */
  static parentMessageHandler(event) {
    if (event.data.type === "arcgis:auth:credential") {
      const credential = event.data.credential;
      return isCredential(credential) ? _ArcGISIdentityManager.fromCredential(credential, {
        hasPortal: true,
        hasServer: false,
        server: credential.server
      }) : new _ArcGISIdentityManager(credential);
    }
    if (event.data.type === "arcgis:auth:error") {
      const err = new Error(event.data.error.message);
      err.name = event.data.error.name;
      throw err;
    } else {
      throw new Error("Unknown message type.");
    }
  }
  /**
   * Revokes all active tokens for a provided {@linkcode ArcGISIdentityManager}. The can be considered the equivalent to signing the user out of your application.
   */
  static destroy(manager) {
    return revokeToken({
      clientId: manager.clientId,
      portal: manager.portal,
      token: manager.refreshToken || manager.token
    });
  }
  /**
   * Create a  {@linkcode ArcGISIdentityManager} from an existing token. Useful for when you have a users token from a different authentication system and want to get a  {@linkcode ArcGISIdentityManager}.
   */
  static fromToken(options) {
    const manager = new _ArcGISIdentityManager(options);
    return manager.getUser().then(() => {
      return manager;
    });
  }
  /**
   * Initialize a {@linkcode ArcGISIdentityManager} with a user's `username` and `password`. **This method is intended ONLY for applications without a user interface such as CLI tools.**.
   *
   * If possible you should use {@linkcode ArcGISIdentityManager.beginOAuth2} to authenticate users in a browser or {@linkcode ArcGISIdentityManager.authorize} for authenticating users with a web server.
   */
  static signIn(options) {
    const manager = new _ArcGISIdentityManager(options);
    return manager.getUser().then(() => {
      return manager;
    });
  }
  /**
     * Returns authentication in a format useable in the [`IdentityManager.registerToken()` method in the ArcGIS API for JavaScript](https://developers.arcgis.com/javascript/latest/api-reference/esri-identity-IdentityManager.html#registerToken).
     *
     * This method can be used with {@linkcode ArcGISIdentityManager.fromCredential} to interop with the ArcGIS API for JavaScript.
     *
     * ```js
     * require(["esri/id"], (esriId) => {
     *   esriId.registerToken(manager.toCredential());
     * })
  
     * ```
     *
     * @returns ICredential
     */
  toCredential() {
    return {
      expires: this.tokenExpires.getTime(),
      server: this.server || this.portal,
      ssl: this.ssl,
      token: this.token,
      userId: this.username
    };
  }
  /**
   * Returns information about the currently logged in user's [portal](https://developers.arcgis.com/rest/users-groups-and-items/portal-self.htm). Subsequent calls will *not* result in additional web traffic.
   *
   * ```js
   * manager.getPortal()
   *   .then(response => {
   *     console.log(portal.name); // "City of ..."
   *   })
   * ```
   *
   * @param requestOptions - Options for the request. NOTE: `rawResponse` is not supported by this operation.
   * @returns A Promise that will resolve with the data from the response.
   */
  getPortal(requestOptions) {
    if (this._pendingPortalRequest) {
      return this._pendingPortalRequest;
    } else if (this._portalInfo) {
      return Promise.resolve(this._portalInfo);
    } else {
      const url = `${this.portal}/portals/self`;
      const options = Object.assign(Object.assign({ httpMethod: "GET", authentication: this }, requestOptions), { rawResponse: false });
      this._pendingPortalRequest = request(url, options).then((response) => {
        this._portalInfo = response;
        this._pendingPortalRequest = null;
        return response;
      });
      return this._pendingPortalRequest;
    }
  }
  /**
   * Gets an appropriate token for the given URL. If `portal` is ArcGIS Online and
   * the request is to an ArcGIS Online domain `token` will be used. If the request
   * is to the current `portal` the current `token` will also be used. However if
   * the request is to an unknown server we will validate the server with a request
   * to our current `portal`.
   */
  getToken(url, requestOptions) {
    if (canUseOnlineToken(this.portal, url)) {
      return this.getFreshToken(requestOptions);
    } else if (new RegExp(this.portal, "i").test(url)) {
      return this.getFreshToken(requestOptions);
    } else {
      return this.getTokenForServer(url, requestOptions);
    }
  }
  /**
   * Get application access information for the current user
   * see `validateAppAccess` function for details
   *
   * @param clientId application client id
   */
  validateAppAccess(clientId) {
    return this.getToken(this.portal).then((token) => {
      return validateAppAccess(token, clientId);
    });
  }
  /**
   * Converts the `ArcGISIdentityManager` instance to a JSON object. This is called when the instance is serialized to JSON with [`JSON.stringify()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
   *
   * ```js
   * import { ArcGISIdentityManager } from '@esri/arcgis-rest-request';
   *
   * const session = ArcGISIdentityManager.fromCredentials({
   *   clientId: "abc123",
   *   clientSecret: "••••••"
   * })
   *
   * const json = JSON.stringify(session);
   * ```
   *
   * @returns A plain object representation of the instance.
   */
  toJSON() {
    return {
      type: "ArcGISIdentityManager",
      clientId: this.clientId,
      refreshToken: this.refreshToken,
      refreshTokenExpires: this.refreshTokenExpires || void 0,
      username: this.username,
      password: this.password,
      token: this.token,
      tokenExpires: this.tokenExpires || void 0,
      portal: this.portal,
      ssl: this.ssl,
      tokenDuration: this.tokenDuration,
      redirectUri: this.redirectUri,
      server: this.server
    };
  }
  /**
   * Serializes the `ArcGISIdentityManager` instance to a JSON string.
   *
   * ```js
   * // create an ArcGISIdentityManager instance
   * const serializedString = manager.serialize();
   * localStorage.setItem("arcgis-identity-manager", serializedString);
   *
   * // later, you can retrieve the manager from localStorage
   * const serializedString = localStorage.getItem("arcgis-identity-manager");
   * const manager = ArcGISIdentityManager.deserialize(serializedString);
   * ```
   *
   * @returns The serialized JSON string.
   */
  serialize() {
    return JSON.stringify(this);
  }
  /**
   * For a "Host" app that embeds other platform apps via iframes, after authenticating the user
   * and creating a ArcGISIdentityManager, the app can then enable "post message" style authentication by calling
   * this method.
   *
   * Internally this adds an event listener on window for the `message` event
   *
   * @param validChildOrigins Array of origins that are allowed to request authentication from the host app
   */
  enablePostMessageAuth(validChildOrigins, win) {
    if (!win && window) {
      win = window;
    }
    this._hostHandler = this.createPostMessageHandler(validChildOrigins);
    win.addEventListener("message", this._hostHandler, false);
  }
  /**
   * For a "Host" app that has embedded other platform apps via iframes, when the host needs
   * to transition routes, it should call `ArcGISIdentityManager.disablePostMessageAuth()` to remove
   * the event listener and prevent memory leaks
   */
  disablePostMessageAuth(win) {
    if (!win && window) {
      win = window;
    }
    win.removeEventListener("message", this._hostHandler, false);
  }
  /**
   * Manually refreshes the current `token` and `tokenExpires`.
   */
  refreshCredentials(requestOptions) {
    this.clearCachedUserInfo();
    if (this.username && this.password) {
      return this.refreshWithUsernameAndPassword(requestOptions);
    }
    if (this.clientId && this.refreshToken) {
      return this.refreshWithRefreshToken();
    }
    return Promise.reject(new ArcGISTokenRequestError("Unable to refresh token. No refresh token or password present.", ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED));
  }
  /**
   * Determines the root of the ArcGIS Server or Portal for a given URL.
   *
   * @param url the URl to determine the root url for.
   */
  getServerRootUrl(url) {
    const [root] = cleanUrl(url).split(/\/rest(\/admin)?\/services(?:\/|#|\?|$)/);
    const [match, protocol, domainAndPath] = root.match(/(https?:\/\/)(.+)/);
    const [domain, ...path] = domainAndPath.split("/");
    return `${protocol}${domain.toLowerCase()}/${path.join("/")}`;
  }
  /**
   * Returns the proper [`credentials`] option for `fetch` for a given domain.
   * See [trusted server](https://enterprise.arcgis.com/en/portal/latest/administer/windows/configure-security.htm#ESRI_SECTION1_70CC159B3540440AB325BE5D89DBE94A).
   * Used internally by underlying request methods to add support for specific security considerations.
   *
   * @param url The url of the request
   * @returns "include" or "same-origin"
   */
  getDomainCredentials(url) {
    if (!this.trustedDomains || !this.trustedDomains.length) {
      return "same-origin";
    }
    url = url.toLowerCase();
    return this.trustedDomains.some((domainWithProtocol) => {
      return url.startsWith(domainWithProtocol.toLowerCase());
    }) ? "include" : "same-origin";
  }
  /**
   * Convenience method for {@linkcode ArcGISIdentityManager.destroy} for this instance of `ArcGISIdentityManager`
   */
  signOut() {
    return _ArcGISIdentityManager.destroy(this);
  }
  /**
   * Return a function that closes over the validOrigins array and
   * can be used as an event handler for the `message` event
   *
   * @param validOrigins Array of valid origins
   */
  createPostMessageHandler(validOrigins) {
    return (event) => {
      const isValidOrigin = validOrigins.indexOf(event.origin) > -1;
      const isValidType = event.data.type === "arcgis:auth:requestCredential";
      const isTokenValid = this.tokenExpires.getTime() > Date.now();
      if (isValidOrigin && isValidType) {
        let msg = {};
        if (isTokenValid) {
          const credential = this.toCredential();
          credential.server = credential.server.replace("/sharing/rest", "");
          msg = { type: "arcgis:auth:credential", credential };
        } else {
          msg = {
            type: "arcgis:auth:error",
            error: {
              name: "tokenExpiredError",
              message: "Token was expired, and not returned to the child application"
            }
          };
        }
        event.source.postMessage(msg, event.origin);
      }
    };
  }
  /**
   * Validates that a given URL is properly federated with our current `portal`.
   * Attempts to use the internal `federatedServers` cache first.
   */
  getTokenForServer(url, requestOptions) {
    const root = this.getServerRootUrl(url);
    const existingToken = this.federatedServers[root];
    if (existingToken && existingToken.expires && existingToken.expires.getTime() > Date.now()) {
      return Promise.resolve(existingToken.token);
    }
    if (this._pendingTokenRequests[root]) {
      return this._pendingTokenRequests[root];
    }
    this._pendingTokenRequests[root] = this.fetchAuthorizedDomains().then(() => {
      return request(`${root}/rest/info`, {
        credentials: this.getDomainCredentials(url)
      }).then((serverInfo) => {
        if (serverInfo.owningSystemUrl) {
          if (!isFederated(serverInfo.owningSystemUrl, this.portal)) {
            throw new ArcGISTokenRequestError(`${url} is not federated with ${this.portal}.`, ArcGISTokenRequestErrorCodes.NOT_FEDERATED);
          } else {
            return request(`${serverInfo.owningSystemUrl}/sharing/rest/info`, requestOptions);
          }
        } else if (serverInfo.authInfo && this.federatedServers[root] !== void 0) {
          return Promise.resolve({
            authInfo: serverInfo.authInfo
          });
        } else {
          throw new ArcGISTokenRequestError(`${url} is not federated with any portal and is not explicitly trusted.`, ArcGISTokenRequestErrorCodes.NOT_FEDERATED);
        }
      }).then((serverInfo) => {
        if (this.token && this.tokenExpires.getTime() < Date.now()) {
          if (this.server) {
            return this.refreshCredentials().then(() => {
              return {
                token: this.token,
                expires: this.tokenExpires
              };
            });
          }
          return this.refreshCredentials().then(() => {
            return this.generateTokenForServer(serverInfo.authInfo.tokenServicesUrl, root);
          });
        } else {
          return this.generateTokenForServer(serverInfo.authInfo.tokenServicesUrl, root);
        }
      }).then((response) => {
        this.federatedServers[root] = response;
        delete this._pendingTokenRequests[root];
        return response.token;
      });
    });
    return this._pendingTokenRequests[root];
  }
  /**
   * Generates a token for a given `serverUrl` using a given `tokenServicesUrl`.
   */
  generateTokenForServer(tokenServicesUrl, serverUrl) {
    return request(tokenServicesUrl, {
      params: {
        token: this.token,
        serverUrl,
        expiration: this.tokenDuration
      }
    }).then((response) => {
      return {
        token: response.token,
        expires: new Date(response.expires - 1e3 * 60 * 5)
      };
    }).catch((e) => {
      throw new ArcGISTokenRequestError(e.message, ArcGISTokenRequestErrorCodes.GENERATE_TOKEN_FOR_SERVER_FAILED, e.response, e.url, e.options);
    });
  }
  /**
   * Returns an unexpired token for the current `portal`.
   */
  getFreshToken(requestOptions) {
    if (this.token && !this.tokenExpires) {
      return Promise.resolve(this.token);
    }
    if (this.token && this.tokenExpires && this.tokenExpires.getTime() > Date.now()) {
      return Promise.resolve(this.token);
    }
    if (!this._pendingTokenRequests[this.portal]) {
      this._pendingTokenRequests[this.portal] = this.refreshCredentials(requestOptions).then(() => {
        this._pendingTokenRequests[this.portal] = null;
        return this.token;
      });
    }
    return this._pendingTokenRequests[this.portal];
  }
  /**
   * Refreshes the current `token` and `tokenExpires` with `username` and
   * `password`.
   */
  refreshWithUsernameAndPassword(requestOptions) {
    const params = {
      username: this.username,
      password: this.password,
      expiration: this.tokenDuration,
      client: "referer",
      referer: this.referer ? this.referer : typeof window !== "undefined" && typeof window.document !== "undefined" && window.location && window.location.origin ? window.location.origin : (
        /* istanbul ignore next */
        NODEJS_DEFAULT_REFERER_HEADER
      )
    };
    return (this.server ? request(`${this.getServerRootUrl(this.server)}/rest/info`).then((response) => {
      return request(response.authInfo.tokenServicesUrl, Object.assign({ params }, requestOptions));
    }) : request(`${this.portal}/generateToken`, Object.assign({ params }, requestOptions))).then((response) => {
      this.updateToken(response.token, new Date(response.expires));
      return this;
    }).catch((e) => {
      throw new ArcGISTokenRequestError(e.message, ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED, e.response, e.url, e.options);
    });
  }
  /**
   * Refreshes the current `token` and `tokenExpires` with `refreshToken`.
   */
  refreshWithRefreshToken(requestOptions) {
    const ONE_DAY_IN_MILLISECONDS = 1e3 * 60 * 60 * 24;
    if (this.refreshToken && this.refreshTokenExpires && this.refreshTokenExpires.getTime() - ONE_DAY_IN_MILLISECONDS < Date.now()) {
      return this.exchangeRefreshToken(requestOptions);
    }
    const options = Object.assign({ params: {
      client_id: this.clientId,
      refresh_token: this.refreshToken,
      grant_type: "refresh_token"
    } }, requestOptions);
    return fetchToken(`${this.portal}/oauth2/token`, options).then((response) => {
      return this.updateToken(response.token, response.expires);
    }).catch((e) => {
      throw new ArcGISTokenRequestError(e.message, ArcGISTokenRequestErrorCodes.TOKEN_REFRESH_FAILED, e.response, e.url, e.options);
    });
  }
  /**
   * Update the stored {@linkcode ArcGISIdentityManager.token} and {@linkcode ArcGISIdentityManager.tokenExpires} properties. This method is used internally when refreshing tokens.
   * You may need to call this if you want update the token with a new token from an external source.
   *
   * @param newToken The new token to use for this instance of `ArcGISIdentityManager`.
   * @param newTokenExpiration The new expiration date of the token.
   * @returns
   */
  updateToken(newToken, newTokenExpiration) {
    this._token = newToken;
    this._tokenExpires = newTokenExpiration;
    return this;
  }
  /**
   * Exchanges an unexpired `refreshToken` for a new one, also updates `token` and
   * `tokenExpires`.
   */
  exchangeRefreshToken(requestOptions) {
    const options = Object.assign({ params: {
      client_id: this.clientId,
      refresh_token: this.refreshToken,
      redirect_uri: this.redirectUri,
      grant_type: "exchange_refresh_token"
    } }, requestOptions);
    return fetchToken(`${this.portal}/oauth2/token`, options).then((response) => {
      this._token = response.token;
      this._tokenExpires = response.expires;
      this._refreshToken = response.refreshToken;
      this._refreshTokenExpires = response.refreshTokenExpires;
      return this;
    }).catch((e) => {
      throw new ArcGISTokenRequestError(e.message, ArcGISTokenRequestErrorCodes.REFRESH_TOKEN_EXCHANGE_FAILED, e.response, e.url, e.options);
    });
  }
  /**
   * ensures that the authorizedCrossOriginDomains are obtained from the portal and cached
   * so we can check them later.
   *
   * @returns this
   */
  fetchAuthorizedDomains() {
    if (this.server || !this.portal) {
      return Promise.resolve(this);
    }
    return this.getPortal().then((portalInfo) => {
      if (portalInfo.authorizedCrossOriginDomains && portalInfo.authorizedCrossOriginDomains.length) {
        this.trustedDomains = portalInfo.authorizedCrossOriginDomains.filter((d) => !d.startsWith("http://")).map((d) => {
          if (d.startsWith("https://")) {
            return d;
          } else {
            return `https://${d}`;
          }
        });
      }
      return this;
    });
  }
};
function UserSession(options) {
  console.log("DEPRECATED:, 'UserSession' is deprecated. Use 'ArcGISIdentityManager' instead.");
  return new ArcGISIdentityManager(options);
}
UserSession.beginOAuth2 = function(...args) {
  console.warn("DEPRECATED:, 'UserSession.beginOAuth2' is deprecated. Use 'ArcGISIdentityManager.beginOAuth2' instead.");
  return ArcGISIdentityManager.beginOAuth2(...args);
};
UserSession.completeOAuth2 = function(...args) {
  console.warn("DEPRECATED:, 'UserSession.completeOAuth2()' is deprecated. Use 'ArcGISIdentityManager.completeOAuth2()' instead.");
  if (args.length <= 1) {
    console.warn("WARNING:, 'UserSession.completeOAuth2()' is now async and returns a promise the resolves to an instance of `ArcGISIdentityManager`.");
  }
  return ArcGISIdentityManager.completeOAuth2(...args);
};
UserSession.fromParent = function(...args) {
  console.warn("DEPRECATED:, 'UserSession.fromParent' is deprecated. Use 'ArcGISIdentityManager.fromParent' instead.");
  return ArcGISIdentityManager.fromParent(...args);
};
UserSession.authorize = function(...args) {
  console.warn("DEPRECATED:, 'UserSession.authorize' is deprecated. Use 'ArcGISIdentityManager.authorize' instead.");
  return ArcGISIdentityManager.authorize(...args);
};
UserSession.exchangeAuthorizationCode = function(...args) {
  console.warn("DEPRECATED:, 'UserSession.exchangeAuthorizationCode' is deprecated. Use 'ArcGISIdentityManager.exchangeAuthorizationCode' instead.");
  return ArcGISIdentityManager.exchangeAuthorizationCode(...args);
};
UserSession.fromCredential = function(...args) {
  console.log("DEPRECATED:, 'UserSession.fromCredential' is deprecated. Use 'ArcGISIdentityManager.fromCredential' instead.");
  console.warn("WARNING:, 'UserSession.fromCredential' now requires a `ServerInfo` object from the JS API as a second parameter.");
  return ArcGISIdentityManager.fromCredential(...args);
};
UserSession.deserialize = function(...args) {
  console.log("DEPRECATED:, 'UserSession.deserialize' is deprecated. Use 'ArcGISIdentityManager.deserialize' instead.");
  return ArcGISIdentityManager.deserialize(...args);
};

// node_modules/@esri/arcgis-rest-request/dist/esm/types/job-statuses.js
var JOB_STATUSES;
(function(JOB_STATUSES2) {
  JOB_STATUSES2["Success"] = "Succeeded";
  JOB_STATUSES2["Failed"] = "Failed";
  JOB_STATUSES2["Waiting"] = "Waiting";
  JOB_STATUSES2["Cancelled"] = "Cancelled";
  JOB_STATUSES2["Cancelling"] = "Cancelling";
  JOB_STATUSES2["New"] = "New";
  JOB_STATUSES2["Executing"] = "Executing";
  JOB_STATUSES2["Submitted"] = "Submitted";
  JOB_STATUSES2["Failure"] = "Failure";
  JOB_STATUSES2["TimedOut"] = "TimedOut";
  JOB_STATUSES2["Error"] = "Error";
  JOB_STATUSES2["Status"] = "Etatus";
  JOB_STATUSES2["Unknown"] = "Unknown";
})(JOB_STATUSES || (JOB_STATUSES = {}));

// node_modules/@esri/arcgis-rest-basemap-sessions/dist/esm/utils/defaults.js
var DEFAULT_START_BASEMAP_STYLE_SESSION_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/sessions/start";
var DEFAULT_SAFETY_MARGIN = 5 * 60;
var DEFAULT_CHECK_EXPIRATION_INTERVAL = 10;
var DEFAULT_DURATION = 12 * 60 * 60;

// node_modules/@esri/arcgis-rest-basemap-sessions/dist/esm/utils/startNewSession.js
function startNewSession({ startSessionUrl, authentication, styleFamily = "arcgis", duration = DEFAULT_DURATION }) {
  return request(startSessionUrl, {
    httpMethod: "GET",
    authentication,
    params: { styleFamily, durationSeconds: duration }
  });
}

// node_modules/@esri/arcgis-rest-basemap-sessions/dist/esm/utils/detemineSafetyMargin.js
function determineSafetyMargin(duration, safetyMargin) {
  if (safetyMargin) {
    return safetyMargin;
  }
  return Math.min(Math.max(duration / 100, 1), DEFAULT_SAFETY_MARGIN);
}

// node_modules/@esri/arcgis-rest-basemap-sessions/dist/esm/BaseSession.js
var BaseSession = class {
  /**
   * Creates a new instance of the BaseSession class. Generally you should not create an instance of this class directly, but instead use the static methods to start a session or deserialize a session.
   *
   * You may need to create an instance of this class directly if you are  not using the built in deserialize method.
   *
   * @param params - The parameters for the session.
   * @param params.startSessionUrl - The URL to start the session.
   * @param params.token - The token for the session.
   * @param params.styleFamily - The style family of the session.
   * @param params.authentication - The authentication manager or token used for the session.
   * @param params.expires - The expiration date of the session.
   * @param params.startTime - The start time of the session.
   * @param params.endTime - The end time of the session.
   * @param params.safetyMargin - The safety margin in milliseconds.
   * @param params.duration - Indicates if this is a test session.
   */
  constructor(params) {
    this.expirationTimerId = null;
    this.pendingSession = null;
    this.autoRefreshHandler = null;
    this.startSessionUrl = params.startSessionUrl;
    this.token = params.token;
    this.styleFamily = params.styleFamily || "arcgis";
    this.authentication = params.authentication;
    this.duration = params.duration || DEFAULT_DURATION;
    this.startTime = params.startTime;
    this.endTime = params.endTime;
    this.expires = params.expires;
    this.safetyMargin = params.safetyMargin;
    this.expirationCheckInterval = Math.min(this.duration / 100, DEFAULT_CHECK_EXPIRATION_INTERVAL) * 1e3;
    this.emitter = mitt_default();
  }
  /**
   * Checks if the session is expired. If it is expired, it emits an "expired" event and disables expiration time checking. The event will fire **before** the method returns true.
   *
   * @returns {boolean} - Returns true if the session is expired, otherwise false.
   */
  isSessionExpired() {
    if (this.isExpired) {
      this.disableCheckingExpirationTime();
      this.emitter.emit("expired", {
        token: this.token,
        startTime: this.startTime,
        endTime: this.endTime,
        expires: this.expires
      });
    }
    return this.isExpired;
  }
  /**
   * Starts checking the expiration time of the session. This will check the expiration time immediately and then on an interval.
   * If the session is expired, it will emit an "expired" event.
   */
  enableCheckingExpirationTime() {
    const check = () => {
      this.isSessionExpired();
    };
    if (!this.expirationTimerId) {
      this.expirationTimerId = setInterval(
        check,
        // check every 10 seconds or 1/100th of the duration, whichever is smaller
        this.expirationCheckInterval
      );
    }
    setTimeout(() => {
      check();
    }, 10);
    return this.expirationTimerId;
  }
  /**
   * Stops checking the expiration time of the session. This will clear the interval that was set by {@linkcode BaseSession.startCheckingExpirationTime}.
   */
  disableCheckingExpirationTime() {
    if (this.expirationTimerId) {
      clearInterval(this.expirationTimerId);
      this.expirationTimerId = null;
    }
  }
  /**
   * Starts a new session using the provided parameters and returns an instance of the session class.
   *
   * @param params - The parameters for starting the session.
   * @param SessionClass - The class to use for the session.
   * @returns A promise that resolves to an instance of the session class.
   */
  static async startSession({ startSessionUrl, styleFamily = "arcgis", authentication, safetyMargin, duration = DEFAULT_DURATION, autoRefresh = false }, SessionClass) {
    if (duration < 10) {
      throw new Error("Session duration must be at least 10 seconds.");
    }
    if (duration > 43200) {
      throw new Error("Session duration cannot exceed 12 hours (43200 seconds).");
    }
    const sessionResponse = await startNewSession({
      startSessionUrl,
      styleFamily,
      authentication,
      duration
    });
    const actualSafetyMargin = determineSafetyMargin(duration, safetyMargin);
    const session = new SessionClass({
      startSessionUrl,
      token: sessionResponse.sessionToken,
      styleFamily,
      authentication,
      safetyMargin: actualSafetyMargin,
      expires: new Date(sessionResponse.endTime - actualSafetyMargin * 1e3),
      startTime: new Date(sessionResponse.startTime),
      endTime: new Date(sessionResponse.endTime),
      duration
    });
    session.enableCheckingExpirationTime();
    if (autoRefresh) {
      session.enableAutoRefresh();
    }
    return session;
  }
  /**
   * Indicates if the session is currently checking for expiration time.
   *
   * @returns {boolean} - Returns true if the session is checking for expiration time, otherwise false.
   */
  get checkingExpirationTime() {
    return !!this.expirationTimerId;
  }
  /**
   * Returns the number of seconds until the session is no longer valid rounded down. If the session is expired, it will return 0.
   */
  get secondsUntilExpiration() {
    return Math.floor(this.millisecondsUntilExpiration / 1e3);
  }
  /**
   * Returns the number of milliseconds until the session token is no longer valid. If the session is expired, it will return 0.
   */
  get millisecondsUntilExpiration() {
    if (this.isExpired) {
      return 0;
    }
    const now = /* @__PURE__ */ new Date();
    const millisecondsLeft = this.endTime.getTime() - now.getTime();
    return millisecondsLeft;
  }
  /**
   * Checks if the session is expired.
   *
   */
  get isExpired() {
    return this.expires < /* @__PURE__ */ new Date();
  }
  /**
   * Gets the session token. If the session is expired, it will refresh the credentials and return the new token.
   *
   * @returns A promise that resolves to the session token.
   */
  getToken() {
    if (this.isExpired) {
      return this.refreshCredentials().then(() => this.token);
    }
    return Promise.resolve(this.token);
  }
  /**
   * Indicates if the session can be refreshed. This is always true for this basemap sessions.
   *
   * @returns {boolean} - Always returns true.
   */
  get canRefresh() {
    return true;
  }
  /**
   * Indicates if the session is set to automatically refresh when it expires.
   *
   * @returns {boolean} - Returns true if auto-refresh is enabled, otherwise false.
   */
  get autoRefresh() {
    return !!this.autoRefreshHandler && !!this.expirationTimerId;
  }
  /**
   * Refreshes the session credentials by starting a new session.
   * This will emit a "refreshed" event with the previous and current session details.
   *
   * @returns A promise that resolves to the current instance of the session.
   */
  async refreshCredentials() {
    if (this.pendingSession) {
      await this.pendingSession;
      return this;
    }
    const previous = JSON.parse(JSON.stringify({
      token: this.token,
      startTime: this.startTime,
      endTime: this.endTime,
      expires: this.expires
    }));
    try {
      this.pendingSession = startNewSession({
        startSessionUrl: this.startSessionUrl,
        styleFamily: this.styleFamily,
        authentication: this.authentication,
        duration: this.duration
      });
      const newSession = await this.pendingSession;
      this.pendingSession = null;
      this.setToken(newSession.sessionToken);
      this.setStartTime(new Date(newSession.startTime));
      this.setEndTime(new Date(newSession.endTime));
      this.setExpires(new Date(newSession.endTime - this.safetyMargin * 1e3));
      this.enableCheckingExpirationTime();
      this.emitter.emit("refreshed", {
        previous: {
          token: previous.token,
          startTime: new Date(previous.startTime),
          endTime: new Date(previous.endTime),
          expires: new Date(previous.expires)
        },
        current: {
          token: this.token,
          startTime: this.startTime,
          endTime: this.endTime,
          expires: this.expires
        }
      });
    } catch (error2) {
      this.emitter.emit("error", error2);
      throw error2;
    }
    return this;
  }
  /**
   * Enables auto-refresh for the session. This will automatically refresh the session when it expires.
   * It will also start checking the expiration time of the session if it is not already started via {@linkcode BaseSession.enableCheckingExpirationTime}.
   */
  enableAutoRefresh() {
    if (!this.expirationTimerId) {
      this.enableCheckingExpirationTime();
    }
    this.autoRefreshHandler = () => {
      this.refreshCredentials().catch((error2) => {
        this.emitter.emit("error", error2);
      });
    };
    this.on("expired", this.autoRefreshHandler);
  }
  /**
   * Disables auto-refresh for the session. This will stop automatically refreshing the session when it expires.
   * This will  **not** stop checking the expiration time of the session. If you want to stop automated expiration
   * checking, call {@linkcode BaseSession.disableCheckingExpirationTime} after calling this method.
   */
  disableAutoRefresh() {
    if (this.autoRefreshHandler) {
      this.off("expired", this.autoRefreshHandler);
      this.autoRefreshHandler = null;
    }
  }
  /**
   * Removes all event listeners and disables auto-refresh and expiration time checking. This is useful for cleaning up the session when it is no longer needed or replaced with a new session.
   */
  destroy() {
    this.disableAutoRefresh();
    this.disableCheckingExpirationTime();
    this.emitter.off("expired");
    this.emitter.off("refreshed");
    this.emitter.off("error");
    this.emitter.off("*");
  }
  on(eventName, handler) {
    this.emitter.on(eventName, handler);
    this.isSessionExpired();
  }
  once(eventName, handler) {
    const fn = (e) => {
      this.emitter.off(eventName, fn);
      handler(e);
    };
    this.emitter.on(eventName, fn);
  }
  off(eventName, handler) {
    this.emitter.off(eventName, handler);
  }
  /**
   * These private methods are used to set the internal state of the session.
   */
  setToken(token) {
    this.token = token;
  }
  setStartTime(startTime) {
    this.startTime = startTime;
  }
  setEndTime(endTime) {
    this.endTime = endTime;
  }
  setExpires(expires) {
    this.expires = expires;
  }
};
BaseSession.error = function error(e) {
};
BaseSession.expired = function expired(e) {
};
BaseSession.refreshed = function refreshed(e) {
};

// node_modules/@esri/arcgis-rest-basemap-sessions/dist/esm/BasemapStyleSession.js
var BasemapStyleSession = class _BasemapStyleSession extends BaseSession {
  /**
   * Creates an instance of `BasemapStyleSession`. Constructing `BasemapStyleSession` directly is discouraged.
   * Instead, use the static method {@linkcode BasemapStyleSession.start} to start a new session.
   */
  constructor(params) {
    super(params);
  }
  /**
   * Starts a new basemap style session.
   */
  static async start(params) {
    return BaseSession.startSession(Object.assign(Object.assign({}, params), { startSessionUrl: (params === null || params === void 0 ? void 0 : params.startSessionUrl) || DEFAULT_START_BASEMAP_STYLE_SESSION_URL }), _BasemapStyleSession);
  }
};

// src/BasemapSession.ts
var BasemapSession = class _BasemapSession {
  /**
   * Creates a new `BasemapSession` instance but does not start it. Use the {@link BasemapSession.initialize} method to begin the session manually. Creating basemap sessions in this way using the constructor directly is discouraged. The recommended method is to use {@link BasemapSession.start}.
   * ```javascript
   * const basemapSession = new BasemapSession({
   *   token: 'your-arcgis-token',
   *   styleFamily: 'arcgis-navigation',
   *   duration: 3600,
   *   autoRefresh: false
   * });
   * await session.initialize();
   * ```
   * @param options - Configuration options for the session
   */
  constructor(options) {
    this._emitter = mitt_default();
    /**
     * @internal
     */
    this.expiredHandler = (e) => {
      this._emitter.emit("BasemapSessionExpired", e);
    };
    /**
     * @internal
     */
    this.refreshedHandler = (e) => {
      this._emitter.emit("BasemapSessionRefreshed", e);
    };
    /**
     * @internal
     */
    this.errorHandler = (e) => {
      this._emitter.emit("BasemapSessionError", e);
    };
    if (!options?.token) throw new Error("A valid ArcGIS access token is required to start a session.");
    if (!options.styleFamily) throw new Error("BasemapSession must be initialized with a styleFamily: `arcgis` or `open`.");
    this._parentToken = options.token;
    this._options = options;
  }
  /**
   * Gets the current session token.
   */
  get token() {
    if (!this._session?.token) {
      throw new Error("Session token not available");
    }
    return this._session.token;
  }
  /**
   * Gets the sessions {@link StyleFamily} value.
   */
  get styleFamily() {
    return this._session ? this._session.styleFamily : this._options.styleFamily;
  }
  /**
   * Gets the functional end time of the session. This is equivalent to the session end time plus the safety margin, and is used to tell when the session should be refreshed.
   */
  get safeEndTime() {
    if (!this._session) {
      throw new Error("Unable to get session expiration. Session not initialized.");
    }
    return this._session.expires;
  }
  /**
   * Gets the session start time.
   */
  get startTime() {
    if (!this._session) throw new Error("Unable to get start time. Session not initialized.");
    return this._session.startTime;
  }
  /**
   * Gets the end time of the session returned by the basemap styles service.
   */
  get endTime() {
    if (!this._session) throw new Error("Unable to get end time. Session not initialized.");
    return this._session.endTime;
  }
  /**
   * Returns 'true' if the session is started, and false otherwise.
   */
  get isStarted() {
    return Boolean(
      this._session && this._session.token !== void 0 && this._session.expires && this._session.expires > /* @__PURE__ */ new Date()
    );
  }
  /**
   * Starts the session if it has not been started already.
   *
   * ```javascript
   * const basemapSession = new BasemapSession({
   *   token: 'your-arcgis-token',
   *   styleFamily: 'arcgis-navigation',
   *   duration: 3600,
   *   autoRefresh: false
   * });
   * await session.initialize();
   * ```
   */
  async initialize() {
    if (this._session) {
      this._session.off("expired", this.expiredHandler);
      this._session.off("refreshed", this.refreshedHandler);
      this._session.off("error", this.errorHandler);
      this._emitter.all.clear();
    }
    const sessionParams = {
      authentication: ApiKeyManager.fromKey(this._parentToken),
      autoRefresh: this._options.autoRefresh ? true : false,
      duration: this._options.duration,
      safetyMargin: this._options.safetyMargin,
      styleFamily: this._options.styleFamily,
      startSessionUrl: this._options.startSessionUrl
    };
    if (sessionParams.autoRefresh) {
      console.warn("Auto-refresh is enabled. Your basemap session will automatically refresh once the 'duration' elapses.");
    }
    this._session = await BasemapStyleSession.start(sessionParams);
    this.setupEventListeners();
  }
  /**
   * Manually refresh the session token.
   * @example
   * ```javascript
   * basemapSession.on("BasemapSessionExpired", () => {
   *   console.log('Session expired');
   *   // Manually refresh the session token using the refresh method.
   *   basemapSession.refresh();
   * });
   * ```
   */
  async refresh() {
    if (!this._session) {
      throw new Error("Session not initialized");
    }
    try {
      this._session = await this._session.refreshCredentials();
    } catch (error2) {
      this._emitter.emit("BasemapSessionError", error2);
    }
  }
  /**
   * @internal
   */
  setupEventListeners() {
    if (!this._session) return;
    this._session.on("expired", this.expiredHandler);
    this._session.on("refreshed", this.refreshedHandler);
    this._session.on("error", this.errorHandler);
  }
  /**
   * Register an event handler
   * @example
   * ```typescript
   * const basemapSession = await BasemapSession.start(options);
   * basemapSession.on('BasemapSessionExpired', (data) => {
   *   console.log('Session expired:', data);
   * });
   * ```
   */
  on(eventName, handler) {
    this._emitter.on(eventName, handler);
  }
  /**
   * Unregister an event handler
   * @example
   * ```typescript
   * const basemapSession = await BasemapSession.start(options);
   * basemapSession.off('BasemapSessionExpired', handler);
   * ```
   */
  off(eventName, handler) {
    this._emitter.off(eventName, handler);
  }
  /**
   * Factory method that creates a new basemap session and starts it.
   * @param options - Options for constructing the basemap session.
   * @example
   * ```javascript
   * const basemapSession = await BasemapSession.start({
   *   token: 'your-access-token',
   *   styleFamily: 'arcgis',
   *   autoRefresh: true
   * });
   * ```
   */
  static async start(options) {
    const basemapSession = new _BasemapSession(options);
    await basemapSession.initialize();
    return basemapSession;
  }
};

// src/Util.ts
var checkItemId = (itemId) => {
  if (itemId.length == 32) return "ItemId";
  return null;
};
var checkServiceUrlType = (serviceUrl) => {
  const httpRegex = /^https?:\/\//;
  if (httpRegex.test(serviceUrl)) {
    const vectorServiceTest = /\/VectorTileServer\/?$/.exec(serviceUrl);
    if (vectorServiceTest) {
      return "VectorTileService";
    }
    ;
    const featureServiceTest = /\/FeatureServer\/?([0-9]*\/?)?$/.exec(serviceUrl);
    if (featureServiceTest) {
      if (featureServiceTest.length == 2 && featureServiceTest[1]) {
        return "FeatureLayer";
      }
      ;
      return "FeatureService";
    }
  }
  return null;
};
var cleanUrl2 = (url) => {
  if (url[url.length - 1] !== "/") {
    url += "/";
  }
  return url;
};
var isRelativePath = (path) => {
  if (!path.startsWith("http://") && !path.startsWith("https://")) {
    if (path.includes("../")) return true;
  }
  ;
  return false;
};
var parseRelativeUrl = (relativePath, base) => {
  const parsedResult = URL.parse(relativePath, base);
  return parsedResult.href;
};
var toCdnUrl = (url) => {
  if (!url) return url || null;
  url = normalizeArcGISOnlineOrgDomain(url);
  url = url.replace(/^https?:\/\/www\.arcgis\.com/, "https://cdn.arcgis.com");
  url = url.replace(/^https?:\/\/devext\.arcgis\.com/, "https://cdndev.arcgis.com");
  url = url.replace(/^https?:\/\/qaext\.arcgis\.com/, "https://cdnqa.arcgis.com");
  return url;
};
var normalizeArcGISOnlineOrgDomain = (url) => {
  const prdOrg = /^https?:\/\/(?:cdn|[a-z\d-]+\.maps)\.arcgis\.com/i;
  const devextOrg = /^https?:\/\/(?:cdndev|[a-z\d-]+\.mapsdevext)\.arcgis\.com/i;
  const qaOrg = /^https?:\/\/(?:cdnqa|[a-z\d-]+\.mapsqa)\.arcgis\.com/i;
  if (prdOrg.test(url)) {
    url = url.replace(prdOrg, "https://www.arcgis.com");
  } else if (devextOrg.test(url)) {
    url = url.replace(devextOrg, "https://devext.arcgis.com");
  } else if (qaOrg.test(url)) {
    url = url.replace(qaOrg, "https://qaext.arcgis.com");
  }
  return url;
};
var warn2 = (...args) => {
  if (console && console.warn) {
    console.warn.apply(console, args);
  }
};
var checkAccessTokenType = (token) => {
  if (!token || token.length === 0) return null;
  const apiKeyPrefixes = ["AAPT", "AAPK", "AATK"];
  for (const prefix of apiKeyPrefixes) if (token.startsWith(prefix)) return "app";
  const sessionTokenPrefixes = ["AAST"];
  for (const prefix of sessionTokenPrefixes) if (token.startsWith(prefix)) return "basemapSession";
  if (token.length == 256) return "user";
  else if (token.length === 128) return "app";
  return "app";
};
var wrapAccessToken = async (token) => {
  if (!token || token.length === 0) return null;
  const tokenType = checkAccessTokenType(token);
  if (tokenType === "user") return await ArcGISIdentityManager.fromToken({ token });
  else if (tokenType === "basemapSession") return ApiKeyManager.fromKey(token);
  else return ApiKeyManager.fromKey(token);
};

// src/BasemapStyle.ts
var DEFAULT_BASE_URL = "https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles";
var BasemapStyle = class _BasemapStyle {
  /**
   * Constructor for BasemapStyle.
   * @param options - Configuration options for the basemap style.
   */
  constructor(options) {
    this._emitter = mitt_default();
    this._styleLoadHandler = (e) => {
      this._emitter.emit("BasemapStyleLoad", e);
    };
    this._styleErrorHandler = (e) => {
      this._emitter.emit("BasemapStyleError", e);
    };
    this._attributionLoadHandler = (e) => {
      this._emitter.emit("BasemapAttributionLoad", e);
    };
    if (!options || !options.style) throw new Error("BasemapStyle must be created with a style name, such as 'arcgis/imagery' or 'open/streets'.");
    if (options.session) this.session = options.session;
    else if (options.token) this.token = options.token;
    else throw new Error(
      "ArcGIS access token required. To learn more, go to https://developers.arcgis.com/documentation/security-and-authentication/get-started/."
    );
    this.styleId = options.style;
    this._baseUrl = options?.baseUrl || DEFAULT_BASE_URL;
    this._isItemId = checkItemId(this.styleId) == "ItemId" ? true : false;
    if (options.attributionControl) this._attributionControlOptions = options.attributionControl;
    if (options?.preferences) {
      this._updatePreferences({
        language: options.preferences.language,
        worldview: options.preferences.worldview,
        places: options.preferences.places
      });
    }
  }
  get _styleUrl() {
    let styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;
    styleUrl += `?token=${this._token}`;
    if (this.preferences?.language) {
      styleUrl += `&language=${this.preferences.language}`;
    }
    if (this.preferences?.worldview) {
      styleUrl += `&worldview=${this.preferences.worldview}`;
    }
    if (this.preferences?.places) {
      styleUrl += `&places=${this.preferences.places}`;
    }
    return styleUrl;
  }
  get _token() {
    if (this.session) return this.session.token;
    else if (this.token) return this.token;
  }
  /**
   * Associates the BasemapStyle with a maplibre-gl map.
   * @param map - A maplibre-gl map.
   * @returns The BasemapStyle object.
   */
  setMap(map) {
    this._map = map;
    return this;
  }
  /**
   * Applies the basemap style to a maplibre-gl map.
   * @param map - A maplibre-gl map. The map may either be passed here or in the constructor.
   * @param maplibreStyleOptions - Optional style object for maplibre-gl, including the `transformStyle` function.
   * @returns - The maplibre-gl map that the style was applied to.
   */
  applyTo(map, maplibreStyleOptions) {
    if (map) this._map = map;
    if (!this._map) throw new Error("Unable to apply basemap style: No 'Map' object was provided.");
    if (!this.style) throw new Error("Cannot apply style to map before style is loaded.");
    this._map.setStyle(this.style, maplibreStyleOptions);
    this._setEsriAttribution();
    if (this.session) {
      this.session.on("BasemapSessionRefreshed", (sessionData) => {
        const oldToken = sessionData.previous.token;
        const newToken = sessionData.current.token;
        this._updateTiles(oldToken, newToken, map);
      });
    }
    return this._map;
  }
  /**
   * Updates the basemap style with new options and applies it to the current map.
   * @param options - Options to customize the style enumeration and preferences such as language.
   */
  async updateStyle(options) {
    if (options.style) this.styleId = options.style;
    if (options.token) this.token = options.token;
    if (options.preferences) {
      this._updatePreferences(options.preferences);
    }
    await this.loadStyle();
    this.applyTo(this._map, options.maplibreStyleOptions);
    return this.style;
  }
  /**
   * Loads the basemap style from the Basemap Styles service.
   * @returns The maplibre style specification of the basemap style, formatted properly.
   */
  async loadStyle() {
    if (this.session) {
      const session = await Promise.resolve(this.session);
      this.session = session;
    }
    const styleUrl = this._isItemId ? `${this._baseUrl}/items/${this.styleId}` : `${this._baseUrl}/${this.styleId}`;
    const authentication = await wrapAccessToken(this._token);
    const style = await request(styleUrl, {
      authentication,
      httpMethod: "GET",
      suppressWarnings: true,
      params: {
        ...this.preferences,
        echoToken: false
      }
    }).catch((e) => {
      this._styleErrorHandler(e);
    });
    if (!style) return;
    if (style.glyphs) style.glyphs = `${style.glyphs}?f=json&token=${this.token}`;
    Object.keys(style.sources).forEach((sourceId) => {
      const source = style.sources[sourceId];
      if (source.type === "raster" || source.type === "vector" || source.type === "raster-dem") {
        if (source.tiles.length > 0) {
          for (let i = 0; i < source.tiles.length; i++) source.tiles[i] = `${source.tiles[i]}?f=json&token=${this.token}`;
        }
      }
    });
    if (style.sprite) {
      if (Array.isArray(style.sprite)) {
        style.sprite.forEach((sprite, id, spriteArray) => {
          spriteArray[id].url = `${sprite.url}?token=${this._token}`;
        });
      } else {
        style.sprite = `${style.sprite}?token=${this._token}`;
      }
    }
    this.style = style;
    this._styleLoadHandler(this);
    return this.style;
  }
  _setEsriAttribution() {
    if (!this._map) throw new Error("No map was passed to ArcGIS BasemapStyle.");
    this.attributionControl = new AttributionControl(this._attributionControlOptions);
    if (this.attributionControl.canAdd(this._map)) {
      this._map.addControl(this.attributionControl);
      this._attributionLoadHandler(this.attributionControl);
    }
  }
  _updatePreferences(preferences) {
    if (!preferences) return;
    if (this._isItemId) {
      console.warn("Preferences such as 'language', 'places', and 'worldview' are not supported with custom basemaps IDs. These parameters will be ignored.");
      return;
    }
    if (!this.preferences) this.preferences = {};
    if (preferences.language) this.preferences.language = preferences.language;
    if (preferences.places) this.preferences.places = preferences.places;
    if (preferences.worldview) this.preferences.worldview = preferences.worldview;
  }
  _updateTiles(fromToken, toToken, map) {
    if (!map) throw new Error("Unable to update map tiles with new session token: Session does not have access to the map.");
    this._map = map;
    for (const sourceCaches of Object.keys(this._map.style.sourceCaches)) {
      const source = this._map.getSource(sourceCaches);
      if (!source || !source.tiles) {
        return;
      }
      if (!source.tiles.some((tileUrl) => tileUrl.includes(fromToken))) {
        return;
      }
      const newTiles = source.tiles.map((tile) => {
        return tile.includes(fromToken) ? tile.replace(fromToken, toToken) : tile;
      });
      source.setTiles(newTiles);
    }
    const glyphs = this._map.getGlyphs();
    if (glyphs.includes(fromToken)) {
      this._map.setGlyphs(glyphs.replace(fromToken, toToken));
    }
    const sprites = this._map.getSprite();
    for (const sprite of sprites) {
      if (sprite.url.includes(fromToken)) {
        this._map.setSprite(sprite.url.replace(fromToken, toToken));
      }
    }
  }
  /**
   * Registers an event handler
   * @param eventName - A basemap style event
   * @param handler - Custom handler function
   */
  on(eventName, handler) {
    this._emitter.on(eventName, handler);
  }
  /**
   * Deregisters an event handler
   * @param eventName - A basemap style event
   * @param handler - Custom handler function
   */
  off(eventName, handler) {
    this._emitter.off(eventName, handler);
  }
  /**
   * Static method that returns a basemap style URL.
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The URL of the specified ArcGIS basemap style with all included parameters
   */
  static url(options) {
    return new _BasemapStyle(options)._styleUrl;
  }
  /**
   * Creates, loads, and applies a new BasemapStyle to a maplibre map.
   * @param map - A maplibre-gl map to apply the basemap style to.
   * @param options - Style options, including a style ID and authentication
   * @returns - BasemapStyle object
   */
  static applyStyle(map, options) {
    if (!map) throw new Error("Must provide a maplibre-gl 'Map' to apply style to.");
    const basemapStyle = new _BasemapStyle(options);
    basemapStyle.loadStyle().then((_) => {
      basemapStyle.applyTo(map, options.maplibreStyleOptions);
    }).catch((e) => {
      throw e;
    });
    return basemapStyle;
  }
  /**
   * Static method that makes a `/self` request to the ArcGIS Basemap Styles service.
   * @see https://developers.arcgis.com/rest/basemap-styles/service-self-get/
   * @param options - Additional parameters including an ArcGIS access token
   * @returns The response returned by the Basemap Styles service.
   */
  static async getSelf(options) {
    const basemapServiceUrl = options?.baseUrl ? options.baseUrl : DEFAULT_BASE_URL;
    const authentication = await wrapAccessToken(options?.token);
    return await request(`${basemapServiceUrl}/self`, {
      authentication,
      httpMethod: "GET"
    });
  }
};

// node_modules/@esri/arcgis-rest-portal/dist/esm/util/get-portal-url.js
function getPortalUrl(requestOptions = {}) {
  if (requestOptions.portal) {
    return cleanUrl(requestOptions.portal);
  }
  if (requestOptions.authentication && typeof requestOptions.authentication !== "string") {
    return requestOptions.authentication.portal;
  }
  return "https://www.arcgis.com/sharing/rest";
}

// node_modules/@esri/arcgis-rest-portal/dist/esm/util/scrub-control-chars.js
var CONTROL_CHAR_MATCHER = /[\x00-\x1F\x7F-\x9F\xA0]/g;
function scrubControlChars(str) {
  return str.replace(CONTROL_CHAR_MATCHER, "");
}

// node_modules/@esri/arcgis-rest-portal/dist/esm/items/get.js
function getItem(id, requestOptions) {
  const url = getItemBaseUrl(id, requestOptions);
  const options = Object.assign({ httpMethod: "GET" }, requestOptions);
  return request(url, options);
}
var getItemBaseUrl = (id, portalUrlOrRequestOptions) => {
  const portalUrl = typeof portalUrlOrRequestOptions === "string" ? portalUrlOrRequestOptions : getPortalUrl(portalUrlOrRequestOptions);
  return `${portalUrl}/content/items/${id}`;
};
function getItemResources(id, requestOptions) {
  const url = `${getItemBaseUrl(id, requestOptions)}/resources`;
  const options = Object.assign({}, requestOptions);
  options.params = Object.assign({ num: 1e3 }, options.params);
  return request(url, options);
}
function getItemResource(itemId, requestOptions) {
  const readAs = requestOptions.readAs || "blob";
  return getItemFile(itemId, `/resources/${requestOptions.fileName}`, readAs, requestOptions);
}
function getItemFile(id, fileName, readMethod, requestOptions) {
  const url = `${getItemBaseUrl(id, requestOptions)}${fileName}`;
  const options = Object.assign({ params: {} }, requestOptions);
  const justReturnResponse = options.rawResponse;
  options.rawResponse = true;
  options.params.f = null;
  return request(url, options).then((response) => {
    if (justReturnResponse) {
      return response;
    }
    return readMethod !== "json" ? response[readMethod]() : response.text().then((text) => JSON.parse(scrubControlChars(text)));
  });
}

// node_modules/@esri/arcgis-rest-feature-service/dist/esm/getLayer.js
function getLayer(options) {
  return request(cleanUrl(options.url), options);
}

// node_modules/@esri/arcgis-rest-feature-service/dist/esm/helpers.js
var serviceRegex = new RegExp(/.+(?:map|feature|image)server/i);

// node_modules/@esri/arcgis-rest-feature-service/dist/esm/getService.js
function getService(options) {
  return request(cleanUrl(options.url), options);
}

// node_modules/@esri/arcgis-rest-feature-service/dist/esm/query.js
function queryFeatures(requestOptions) {
  const queryOptions = appendCustomParams(requestOptions, [
    "where",
    "objectIds",
    "relationParam",
    "time",
    "distance",
    "units",
    "outFields",
    "geometry",
    "geometryType",
    "spatialRel",
    "returnGeometry",
    "maxAllowableOffset",
    "geometryPrecision",
    "inSR",
    "outSR",
    "gdbVersion",
    "returnDistinctValues",
    "returnIdsOnly",
    "returnCountOnly",
    "returnExtentOnly",
    "orderByFields",
    "groupByFieldsForStatistics",
    "outStatistics",
    "returnZ",
    "returnM",
    "multipatchOption",
    "resultOffset",
    "resultRecordCount",
    "quantizationParameters",
    "returnCentroid",
    "resultType",
    "historicMoment",
    "returnTrueCurves",
    "sqlFormat",
    "returnExceededLimitFeatures",
    "f"
  ], {
    httpMethod: "GET",
    params: Object.assign({
      // set default query parameters
      where: "1=1",
      outFields: "*"
    }, requestOptions.params)
  });
  return request(`${cleanUrl(requestOptions.url)}/query`, queryOptions);
}
async function queryAllFeatures(requestOptions) {
  var _a, _b;
  let offset = 0;
  let hasMore = true;
  let allFeaturesResponse = null;
  const pageSizeResponse = await request(requestOptions.url, {
    httpMethod: "GET"
  });
  const pageSize = pageSizeResponse.maxRecordCount || 2e3;
  const userRecordCount = (_a = requestOptions.params) === null || _a === void 0 ? void 0 : _a.resultRecordCount;
  const recordCountToUse = userRecordCount && userRecordCount <= pageSize ? userRecordCount : pageSize;
  while (hasMore) {
    const pagedOptions = Object.assign(Object.assign({}, requestOptions), { params: Object.assign(Object.assign({ where: "1=1", outFields: "*" }, requestOptions.params || {}), { resultOffset: offset, resultRecordCount: recordCountToUse }) });
    const queryOptions = appendCustomParams(pagedOptions, [
      "where",
      "objectIds",
      "relationParam",
      "time",
      "distance",
      "units",
      "outFields",
      "geometry",
      "geometryType",
      "spatialRel",
      "returnGeometry",
      "maxAllowableOffset",
      "geometryPrecision",
      "inSR",
      "outSR",
      "gdbVersion",
      "orderByFields",
      "groupByFieldsForStatistics",
      "outStatistics",
      "returnZ",
      "returnM",
      "multipatchOption",
      "resultOffset",
      "resultRecordCount",
      "quantizationParameters",
      "resultType",
      "historicMoment",
      "returnTrueCurves",
      "sqlFormat",
      "f"
    ], {
      httpMethod: "GET",
      params: Object.assign({ where: "1=1", outFields: "*", returnExceededLimitFeatures: true }, pagedOptions.params)
    });
    const response = await request(`${cleanUrl(requestOptions.url)}/query`, queryOptions);
    if (!allFeaturesResponse) {
      allFeaturesResponse = Object.assign({}, response);
    } else {
      allFeaturesResponse.features = allFeaturesResponse.features.concat(response.features);
    }
    const returnedCount = response.features.length;
    const exceededTransferLimit = response.exceededTransferLimit || ((_b = response.properties) === null || _b === void 0 ? void 0 : _b.exceededTransferLimit);
    if (returnedCount < pageSize || !exceededTransferLimit) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }
  return allFeaturesResponse;
}

// src/HostedLayer.ts
var throwReadOnlyError = (propertyName) => {
  throw new Error(`${propertyName} is a read-only property.`);
};
var HostedLayer = class _HostedLayer {
  /**
   * Prevent public constructor from appearing in docs by making it protected.
   * This keeps the class abstract while avoiding a displayed public constructor.
   */
  constructor() {
    if (new.target === _HostedLayer) throw new Error("HostedLayer is an abstract class and cannot be instantiated directly.");
  }
  /**
   * Retrieves the sources for the hosted layer.
   */
  get sources() {
    return Object.freeze(this._sources);
  }
  /**
   * Sets the sources for the hosted layer.
   */
  set sources(value) {
    throwReadOnlyError("sources");
  }
  /**
   * Retrieves the source for the hosted layer.
   */
  get source() {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return void 0;
    return Object.freeze(this._sources[sourceIds[0]]);
  }
  /**
   * Sets the source for the hosted layer.
   */
  set source(_) {
    throwReadOnlyError("source");
  }
  /**
   * Retrieves the source ID for the hosted layer.
   */
  get sourceId() {
    const sourceIds = Object.keys(this._sources);
    if (sourceIds.length !== 1) return void 0;
    return Object.freeze(sourceIds[0]);
  }
  /**
   * Sets the source ID for the hosted layer.
   */
  set sourceId(_) {
    throwReadOnlyError("sourceId");
  }
  /**
   * Retrieves the layers for the hosted layer.
   */
  get layers() {
    return Object.freeze(this._layers);
  }
  /**
   * Sets the layers for the hosted layer.
   */
  set layers(_) {
    throwReadOnlyError("layers");
  }
  /**
   * Retrieves the layer for the hosted layer.
   */
  get layer() {
    if (this._layers.length !== 1) return void 0;
    return Object.freeze(this._layers[0]);
  }
  set layer(_) {
    throwReadOnlyError("layer");
  }
  _onAdd(map) {
    if (map) this._map = map;
    if (!this._map) throw new Error("No map");
    const esriAttribution = new AttributionControl_default();
    if (esriAttribution.canAdd(this._map)) this._map.addControl(esriAttribution);
  }
  /**
   * Changes the ID of a maplibre style source, and updates all associated maplibre style layers.
   * @param oldId - The source ID to be changed.
   * @param newId - The new source ID.
   */
  setSourceId(oldId, newId) {
    const newSources = structuredClone(this._sources);
    newSources[newId] = newSources[oldId];
    delete newSources[oldId];
    this._sources = newSources;
    this._layers.forEach((lyr) => {
      if (lyr["source"] == oldId) lyr["source"] = newId;
    });
  }
  /**
   * Sets the data attribution of the specified source
   * @param sourceId - The ID of the maplibre style source.
   * @param attribution - Custom attribution text.
   */
  setAttribution(sourceId, attribution) {
    if (!sourceId || !attribution) throw new Error("Must provide a source ID and attribution");
    const newSources = structuredClone(this._sources);
    newSources[sourceId].attribution = attribution;
    this._sources = newSources;
  }
  /**
   * Returns a mutable copy of the specified source.
   * @param sourceId - The ID of the maplibre style source to copy.
   */
  copySource(sourceId) {
    return structuredClone(this._sources[sourceId]);
  }
  /**
   * Returns a mutable copy of the specified layer
   * @param layerId - The ID of the maplibre style layer to copy
   */
  copyLayer(layerId) {
    for (let i = 0; i < this._layers.length; i++) {
      if (this._layers[i].id == layerId) return structuredClone(this._layers[i]);
    }
    throw new Error(`No layer with ID ${layerId} exists.`);
  }
  /**
   * Convenience method that adds all associated Maplibre sources and data layers to a map.
   * @param map - A [MapLibre GL JS map](https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/)
   */
  addSourcesAndLayersTo(map) {
    if (!this._ready) throw new Error("Cannot add sources and layers to map: Object has not finished loading.");
    this._map = map;
    Object.keys(this._sources).forEach((sourceId) => {
      map.addSource(sourceId, this._sources[sourceId]);
    });
    this._layers.forEach((layer) => {
      map.addLayer(layer);
    });
    this._onAdd(map);
    return this;
  }
  addSourcesTo(map) {
    if (!this._ready) throw new Error("Cannot add sources to map: Object has not finished loading.");
    this._map = map;
    Object.keys(this._sources).forEach((sourceId) => {
      map.addSource(sourceId, this._sources[sourceId]);
    });
    this._onAdd(map);
    return this;
  }
  /**
   * Add layers to a maplibre map.
   * @param map - A maplibre map object
   * @returns
   */
  addLayersTo(map) {
    if (!this._ready) throw new Error("Cannot add layers to map: Object has not finished loading.");
    this._map = map;
    this._layers.forEach((layer) => {
      map.addLayer(layer);
    });
    this._onAdd(map);
    return this;
  }
};

// src/FeatureLayer.ts
var esriGeometryDefaultStyleMap = {
  esriGeometryPoint: "circle",
  esriGeometryMultipoint: "circle",
  esriGeometryPolyline: "line",
  esriGeometryPolygon: "fill",
  esriGeometryEnvelope: "fill",
  esriGeometryMultiPatch: "fill"
};
var defaultLayerPaintMap = {
  circle: {
    "circle-color": "rgb(0,0,0)"
  },
  // "Esri blue" alternates: #4f81bd #365d8d
  line: {
    "line-color": "rgb(0,0,0)",
    "line-width": 3
  },
  // "Esri blue" alternates: #0064ff
  fill: {
    "fill-color": "rgba(0,0,0,0.25)",
    "fill-outline-color": "rgb(0,0,0)"
  }
  // "Esri blue" alternates: #0064ff #6e6e6e
};
var FeatureLayer = class _FeatureLayer extends HostedLayer {
  /**
   * Constructor for FeatureLayer.
   * @param options - Configuration options for the feature layer.
   *
   * Creating layers using the constructor directly is not recommended. Use {@link FeatureLayer.fromUrl} and {@link FeatureLayer.fromPortalItem} instead.
   */
  constructor(options) {
    super();
    if (!options || !(options.itemId || options.url)) throw new Error("Feature layer requires either an 'itemId' or 'url'.");
    if (options?.token) this.token = options.token;
    if (options?.attribution) this._customAttribution = options.attribution;
    if (options.itemId && options.url)
      warn2("Both an item ID and service URL have been passed. Only the item ID will be used.");
    if (options.itemId) {
      if (checkItemId(options.itemId) == "ItemId") this._inputType = "ItemId";
      else throw new Error("Argument `itemId` is not a valid item ID.");
    } else if (options.url) {
      const urlType = checkServiceUrlType(options.url);
      if (urlType && (urlType == "FeatureLayer" || urlType == "FeatureService")) this._inputType = urlType;
      else throw new Error("Argument `url` is not a valid feature service URL.");
    }
    if (this._inputType == "ItemId") {
      this._itemInfo = {
        itemId: options.itemId,
        portalUrl: options?.portalUrl ? options.portalUrl : "https://www.arcgis.com/sharing/rest"
      };
    } else if (this._inputType === "FeatureLayer" || this._inputType === "FeatureService") {
      this._serviceInfo = {
        serviceUrl: cleanUrl2(options.url)
      };
    }
    if (options?.query) {
      if (this._inputType !== "FeatureLayer")
        throw new Error("Feature service queries are only supported with layer URLs, not item IDs. To use query parameters, call 'FeatureLayer.fromUrl' with a service URL ending in /0, /1, etc.");
      this.query = options.query;
    }
  }
  async _fetchAllFeatures(layerUrl, layerInfo) {
    if (!layerInfo.supportedQueryFormats.includes("geoJSON")) throw new Error("Feature service does not support GeoJSON format.");
    if (!layerInfo.capabilities.includes("Query")) throw new Error("Feature service does not support queries.");
    if (!layerInfo.advancedQueryCapabilities.supportsPagination) throw new Error("Feature service does not support pagination in queries");
    let layerData;
    if (layerInfo.supportsExceedsLimitStatistics) {
      const featureCount = await queryFeatures({
        url: layerUrl,
        authentication: this._authentication,
        ...this.query,
        returnCountOnly: true
      });
      if (featureCount.count > 2e3) {
        warn2("You are loading a large feature layer ( >2000 features) as GeoJSON. This may take some time; consider hosting your data as a vector tile layer instead.");
      }
      const response = await queryAllFeatures({
        url: layerUrl,
        authentication: this._authentication,
        ...this.query,
        f: "geojson"
      });
      layerData = response;
    } else {
      throw new Error(
        "Feature layers hosted in old versions of ArcGIS Enterprise are not currently supported in this plugin. Support will be added in a future release: https://github.com/Esri/maplibre-arcgis/issues/5"
      );
    }
    if (!layerData) throw new Error("Unable to load data.");
    return layerData;
  }
  async _loadLayer(layerUrl) {
    const layerInfo = await getLayer({
      authentication: this._authentication,
      url: layerUrl,
      httpMethod: "GET"
    });
    const layerData = await this._fetchAllFeatures(layerUrl, layerInfo);
    let sourceId = layerInfo.name;
    if (sourceId in this._sources) {
      sourceId += layerUrl[layerUrl.length - 2];
    }
    this._sources[sourceId] = {
      type: "geojson",
      attribution: this._setupAttribution(layerInfo),
      data: layerData
    };
    const layerType = esriGeometryDefaultStyleMap[layerInfo.geometryType];
    const defaultLayer = {
      source: sourceId,
      id: `${sourceId}-layer`,
      type: layerType,
      paint: defaultLayerPaintMap[layerType]
    };
    this._layers.push(defaultLayer);
    return;
  }
  async _loadData() {
    this._sources = {};
    this._layers = [];
    this._authentication = await wrapAccessToken(this.token);
    let dataSource = this._inputType;
    switch (dataSource) {
      case "ItemId": {
        const itemResponse = await getItem(this._itemInfo.itemId, {
          authentication: this._authentication,
          portal: this._itemInfo.portalUrl
        });
        if (!itemResponse.url) throw new Error("The provided ArcGIS portal item has no associated service URL.");
        this._itemInfo = {
          ...this._itemInfo,
          accessInformation: itemResponse.accessInformation,
          title: itemResponse.title,
          description: itemResponse.description,
          access: itemResponse.access,
          orgId: itemResponse.orgId,
          licenseInfo: itemResponse.licenseInfo
        };
        this._serviceInfo = {
          serviceUrl: itemResponse.url
        };
        dataSource = "FeatureService";
      }
      // This case is not currently in use
      case "FeatureService": {
        const serviceInfo = await getService({
          url: this._serviceInfo.serviceUrl,
          authentication: this._authentication
        });
        if (serviceInfo.layers.length > 10) {
          warn2("This feature service contains more than 10 layers. Only the first 10 layers will be loaded.");
        }
        for (let i = 0; i < serviceInfo.layers.length && i < 10; i++) {
          if (serviceInfo.layers[i]["subLayerIds"]) {
            warn2("Feature layers with sublayers are not supported. This layer will not be added.");
            return;
          }
          await this._loadLayer(`${cleanUrl2(this._serviceInfo.serviceUrl)}${i}/`);
        }
        break;
      }
      case "FeatureLayer": {
        await this._loadLayer(this._serviceInfo.serviceUrl);
        break;
      }
    }
  }
  _setupAttribution(layerInfo) {
    if (this._customAttribution) return this._customAttribution;
    if (this._itemInfo?.accessInformation) return this._itemInfo.accessInformation;
    if (this._serviceInfo?.copyrightText) return this._serviceInfo.copyrightText;
    if (layerInfo.copyrightText) return layerInfo.copyrightText;
    return "";
  }
  async initialize() {
    await this._loadData();
    this._ready = true;
    return this;
  }
  static async fromUrl(serviceUrl, options) {
    const inputType = checkServiceUrlType(serviceUrl);
    if (!inputType || !(inputType === "FeatureService" || inputType === "FeatureLayer")) throw new Error("Must provide a valid feature layer URL.");
    const geojsonLayer = new _FeatureLayer({
      url: serviceUrl,
      ...options
    });
    await geojsonLayer.initialize();
    return geojsonLayer;
  }
  static async fromPortalItem(itemId, options) {
    if (checkItemId(itemId) !== "ItemId") throw new Error("Must provide a valid item ID for an ArcGIS hosted feature layer.");
    const geojsonLayer = new _FeatureLayer({
      itemId,
      ...options
    });
    await geojsonLayer.initialize();
    return geojsonLayer;
  }
};

// src/VectorTileLayer.ts
var VectorTileLayer = class _VectorTileLayer extends HostedLayer {
  /* */
  constructor(options) {
    super();
    this._ready = false;
    this._styleLoaded = false;
    this._serviceInfoLoaded = false;
    this._itemInfoLoaded = false;
    if (!options || !(options.itemId || options.url)) throw new Error("Vector tile layer requires either an 'itemId' or 'url'.");
    if (options.token) this.token = options.token;
    if (options.attribution) this._customAttribution = options.attribution;
    if (options.itemId && options.url)
      console.warn("Both an item ID and service URL have been passed. Only the item ID will be used.");
    if (options.itemId) {
      if (checkItemId(options.itemId) == "ItemId") this._inputType = "ItemId";
      else throw new Error("Argument `itemId` is not a valid item ID.");
    } else if (options.url) {
      if (checkServiceUrlType(options.url) == "VectorTileService") this._inputType = "VectorTileService";
      else throw new Error("Argument `url` is not a valid vector tile service URL.");
    }
    if (this._inputType === "ItemId") {
      this._itemInfo = {
        itemId: options.itemId,
        portalUrl: options?.portalUrl ? options.portalUrl : "https://www.arcgis.com/sharing/rest"
      };
    } else if (this._inputType === "VectorTileService") {
      this._serviceInfo = {
        serviceUrl: cleanUrl2(options.url)
      };
    }
  }
  /**
   * Loads the style from ArcGIS.
   * @internal
   */
  async _loadStyle() {
    let styleInfo = null;
    this._authentication = await wrapAccessToken(this.token);
    let styleSource = this._inputType;
    switch (styleSource) {
      case "ItemId": {
        await this._loadItemInfo();
        styleInfo = await this._loadStyleFromItemId();
        if (styleInfo) break;
        else {
          warn2("Could not find a style resource associated with the provided item ID. Checking service URL instead...");
          styleSource = "VectorTileService";
        }
      }
      case "VectorTileService": {
        await this._loadServiceInfo();
        styleInfo = await this._loadStyleFromServiceUrl();
        break;
      }
    }
    if (!styleInfo) throw new Error("Unable to load style information from service URL or item ID.");
    this._styleLoaded = true;
    this.style = styleInfo;
    return this.style;
  }
  async _loadStyleFromItemId() {
    const params = {
      authentication: this._authentication,
      portal: this._itemInfo.portalUrl
    };
    let styleInfo = null;
    try {
      const rootStyle = await getItemResource(this._itemInfo.itemId, {
        ...params,
        fileName: "styles/root.json",
        readAs: "json"
      });
      styleInfo = rootStyle;
    } catch {
      const itemResources = await getItemResources(this._itemInfo.itemId, {
        ...params
      });
      let styleFile = null;
      if (itemResources.total > 0) {
        itemResources.resources.forEach((entry) => {
          if (entry.resource.startsWith("styles")) {
            styleFile = entry.resource;
          }
        });
      }
      if (styleFile) {
        const customStyle = await getItemResource(this._itemInfo.itemId, {
          ...params,
          fileName: styleFile,
          readAs: "json"
        });
        styleInfo = customStyle;
      }
    }
    return styleInfo;
  }
  async _loadStyleFromServiceUrl() {
    if (!this._serviceInfo.serviceUrl) throw new Error("No data service provided");
    if (!this._serviceInfo.styleEndpoint) this._serviceInfo.styleEndpoint = "resources/styles/";
    const styleInfo = await request(`${this._serviceInfo.serviceUrl}${this._serviceInfo.styleEndpoint}`, {
      authentication: this._authentication
    });
    return styleInfo;
  }
  /**
   * Retrieves information from the data service about data attribution, associated item IDs, and more.
   */
  async _loadServiceInfo() {
    const serviceResponse = await request(this._serviceInfo.serviceUrl, {
      authentication: this._authentication
    });
    this._serviceInfo = {
      ...this._serviceInfo,
      tiles: serviceResponse.tiles,
      styleEndpoint: cleanUrl2(serviceResponse.defaultStyles),
      copyrightText: serviceResponse.copyrightText
    };
    this._serviceInfoLoaded = true;
    return this._serviceInfo;
  }
  /**
   * Retrieves information from the portal about item attribution and associated service URLs
   */
  async _loadItemInfo() {
    const itemResponse = await getItem(this._itemInfo.itemId, {
      authentication: this._authentication,
      portal: this._itemInfo.portalUrl
    });
    if (!itemResponse.url) throw new Error("Provided ArcGIS item ID has no associated data service.");
    if (!this._serviceInfoLoaded) {
      this._serviceInfo = {
        serviceUrl: cleanUrl2(itemResponse.url)
        // serviceItemPortalUrl: this._itemInfo.portalUrl
      };
    }
    this._itemInfo = {
      ...this._itemInfo,
      accessInformation: itemResponse.accessInformation,
      title: itemResponse.title,
      description: itemResponse.description,
      access: itemResponse.access,
      orgId: itemResponse.orgId,
      licenseInfo: itemResponse.licenseInfo
    };
    this._itemInfoLoaded = true;
    return this._itemInfo;
  }
  _cleanStyle(style) {
    if (!style) throw new Error("Vector tile style has not been loaded from ArcGIS.");
    if (!this._serviceInfo.serviceUrl) throw new Error("No data service provided");
    if (!this._serviceInfo.styleEndpoint) this._serviceInfo.styleEndpoint = "resources/styles/";
    const styleUrl = `${this._serviceInfo.serviceUrl}${this._serviceInfo.styleEndpoint}`;
    if (style.glyphs) {
      if (isRelativePath(style.glyphs)) style.glyphs = parseRelativeUrl(style.glyphs, styleUrl);
      style.glyphs = toCdnUrl(style.glyphs);
      if (this._authentication) style.glyphs = `${style.glyphs}?token=${this._authentication.token}`;
    }
    if (style.sprite) {
      if (Array.isArray(style.sprite)) {
        for (let spriteIndex = 0; spriteIndex < style.sprite.length; spriteIndex++) {
          const sprite = style.sprite[spriteIndex];
          if (isRelativePath(sprite.url)) sprite.url = parseRelativeUrl(sprite.url, styleUrl);
          sprite.url = toCdnUrl(sprite.url);
          if (this._authentication) sprite.url = `${sprite.url}?token=${this._authentication.token}`;
        }
      } else {
        if (isRelativePath(style.sprite)) style.sprite = parseRelativeUrl(style.sprite, styleUrl);
        style.sprite = toCdnUrl(style.sprite);
        if (this._authentication) style.sprite = `${style.sprite}?token=${this._authentication.token}`;
      }
    }
    for (let layerIndex = 0; layerIndex < style.layers.length; layerIndex++) {
      const layer = style.layers[layerIndex];
      if (layer.layout && layer.layout["text-font"] && layer.layout["text-font"].length > 1) {
        layer.layout["text-font"] = layer.layout["text-font"];
      }
    }
    for (const sourceId of Object.keys(style.sources)) {
      const source = style.sources[sourceId];
      if (isRelativePath(source.url)) source.url = parseRelativeUrl(source.url, styleUrl);
      source.url = cleanUrl2(source.url);
      if (!source.tiles) {
        if (this._serviceInfo.tiles) source.tiles = [`${source.url}${this._serviceInfo.tiles[0]}`];
        else source.tiles = [`${source.url}tile/{z}/{y}/{x}.pbf`];
      }
      if (this._authentication) {
        if (source.url) source.url = `${source.url}?token=${this._authentication.token}`;
        if (source.tiles) source.tiles = source.tiles.map((tileUrl) => `${tileUrl}?token=${this._authentication.token}`);
      }
      source.attribution = this._getAttribution(sourceId);
    }
    this._sources = style.sources;
    this._layers = style.layers;
  }
  /**
   * Get attribution for a source.
   * @param sourceId - Source ID.
   * @returns Attribution.
   * @internal
   */
  _getAttribution(sourceId) {
    if (this._customAttribution) return this._customAttribution;
    if (this._itemInfoLoaded && this._itemInfo.accessInformation) {
      return this._itemInfo.accessInformation;
    }
    if (this._serviceInfoLoaded && this._serviceInfo.copyrightText) {
      return this._serviceInfo.copyrightText;
    }
    if (this._styleLoaded && sourceId && this.style.sources[sourceId] && this.style.sources[sourceId].attribution) {
      return this.style.sources[sourceId].attribution;
    }
    return "";
  }
  // Public API
  async initialize() {
    if (this._ready) throw new Error("Vector tile layer has already been initialized. Cannot initialize again.");
    const style = await this._loadStyle();
    this._cleanStyle(style);
    this._ready = true;
    return this;
  }
  static async fromPortalItem(itemId, options) {
    if (checkItemId(itemId) !== "ItemId") throw new Error("Input is not a valid ArcGIS item ID.");
    const vtl = new _VectorTileLayer({
      itemId,
      ...options
    });
    await vtl.initialize();
    return vtl;
  }
  static async fromUrl(serviceUrl, options) {
    if (checkServiceUrlType(serviceUrl) !== "VectorTileService") throw new Error("Input is not a valid ArcGIS vector tile service URL.");
    const vtl = new _VectorTileLayer({
      url: serviceUrl,
      ...options
    });
    await vtl.initialize();
    return vtl;
  }
};

// package.json
var package_default = {
  name: "@esri/maplibre-arcgis",
  version: "1.0.0-beta-7",
  description: "Wrapper for integrating ArcGIS data sources with MapLibre GL JS",
  keywords: [
    "maplibre",
    "arcgis",
    "esri",
    "feature",
    "vector",
    "tile",
    "styles"
  ],
  license: "Apache-2.0",
  contributors: [
    {
      name: "George Owen",
      email: "gowen@esri.com",
      url: "https://github.com/gowin20"
    },
    {
      name: "Mark Torrey",
      email: "mtorrey@esri.com",
      url: "https://github.com/MarkTorrey"
    },
    {
      name: "Patrick Arlt",
      email: "parlt@esri.com",
      url: "https://github.com/patrickarlt"
    }
  ],
  type: "module",
  main: "dist/umd/maplibre-arcgis.min.js",
  module: "dist/esm/maplibre-arcgis.min.js",
  unpkg: "dist/umd/maplibre-arcgis.min.js",
  exports: {
    ".": {
      import: "./dist/esm/maplibre-arcgis.min.js",
      require: "./dist/umd/maplibre-arcgis.min.js"
    },
    "./package.json": "./package.json"
  },
  directories: {
    example: "examples",
    test: "test"
  },
  scripts: {
    prebuild: "mkdirp dist",
    build: "node build.js prod",
    "build-dev": "node build.js dev",
    start: "node build.js prod watch",
    "start-dev": "node build.js dev watch & npm run docs:watch",
    format: "eslint . --fix",
    docs: "typedoc"
  },
  dependencies: {
    "@esri/arcgis-rest-basemap-sessions": "^1.0.0",
    "@esri/arcgis-rest-feature-service": "^4.2.0",
    "@esri/arcgis-rest-portal": "^4.6.2",
    "@esri/arcgis-rest-request": "^4.7.2",
    mitt: "3.0.1"
  },
  devDependencies: {
    "@eslint/js": "^9.30.1",
    "@stylistic/eslint-plugin": "^5.2.2",
    "@types/node": "^24.3.0",
    "@vitest/eslint-plugin": "^1.3.4",
    esbuild: "^0.25.4",
    "esbuild-plugin-umd-wrapper": "^3.0.0",
    eslint: "^9.30.1",
    "eslint-plugin-html": "^8.1.3",
    "eslint-plugin-tsdoc": "^0.4.0",
    globals: "^16.3.0",
    mkdirp: "^3.0.1",
    typedoc: "^0.28.9",
    typescript: "^5.8.3",
    "typescript-eslint": "^8.36.0"
  },
  peerDependencies: {
    "maplibre-gl": "^5.6.1"
  },
  homepage: "https://github.com/Esri/maplibre-arcgis#readme",
  bugs: {
    url: "https://github.com/Esri/maplibre-arcgis/issues"
  },
  repository: {
    type: "git",
    url: "git+https://github.com/Esri/maplibre-arcgis.git"
  },
  publishConfig: {
    access: "public"
  },
  esri: {
    keyExports: [
      "BasemapStyle",
      "FeatureLayer",
      "VectorTileLayer",
      "AttributionControl",
      "BasemapSession"
    ]
  }
};

// src/MaplibreArcGIS.ts
var customWindow = window;
if (customWindow && customWindow.TEST_ENVIRONMENT) {
  new EventSource("/esbuild").addEventListener("change", () => location.reload());
}
var version = package_default.version;
/*! Bundled license information:

@esri/arcgis-rest-basemap-sessions/dist/esm/BaseSession.js:
  (* istanbul ignore next -- @preserve *)
*/

if(__exports != exports)module.exports = exports;return module.exports}));
//# sourceMappingURL=maplibre-arcgis.js.map
