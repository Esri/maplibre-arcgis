import { vi, test as testBase } from "vitest";
import { BasemapSession } from '../src/MaplibreArcGIS';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
import { Map } from 'maplibre-gl';
import {MOCK_API_KEY} from './mock/authentication/basemapApiKey.js';

// TODO load dummy data
export let IS_MOCK = false;

export function useMock() {
  vi.stubGlobal('ResizeObserver', class MockResizeObserver {
    observe = vi.fn();
  });

  IS_MOCK = true;
}

export function removeMock() {
  vi.unstubAllGlobals();

  IS_MOCK = false
}


export const customTest = testBase.extend({
  // API key
  apiKey: async ({}, use) => {
    if (IS_MOCK) await use (MOCK_API_KEY);
    else await use (process.env.PRODUCTION_KEY_ALP);
  },
  // BasemapSession
  basemapSession: async ({apiKey}, use) => {
    const basemapSession = await BasemapSession.start({
      styleFamily: 'arcgis',
      token: apiKey
    });
    await use(basemapSession);
  },
  // REST JS APIKeyManager
  restJsAuthentication: async ({apiKey}, use) => {
    const restJsAuthentication = ApiKeyManager.fromKey(apiKey);
    await use (restJsAuthentication)
  },

  // maplibre-gl Map
  map: async ({}, use) => {
    const mapDiv = document.createElement('div');

    const map = new Map({
      container: mapDiv,
      zoom: 5, // starting zoom
      center: [138.2529, 36.2048] // starting location
    });
    await use(map);
  }
});

