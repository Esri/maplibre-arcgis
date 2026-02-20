//@ts-nocheck
import { vi, expect, test as testBase, describe } from "vitest";
import puppeteer from 'puppeteer';

import { BasemapSession, BasemapStyle } from '../src/MaplibreArcGIS.js';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
import { Map } from 'maplibre-gl';
import {MOCK_API_KEY} from './mock/authentication/basemapApiKey.js';
import basemapStyleNavigation from './mock/BasemapStyle/ArcGISNavigation.json';
import sessionResponseRaw from './mock/BasemapSession/valid-session.json';

// Mock service containing multiple feature layers (12 layers)
import multiLayerServiceDefinitionRaw from './mock/FeatureLayer/multiLayer-service-info.json';

const featureMultiLayerMock = {
  itemId: '44299709cce447ea99014ff1e3bf8505',
  serviceUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/ManyLayers/FeatureServer',
  serviceDefinition: JSON.stringify(multiLayerServiceDefinitionRaw)
}

// Santa Monica trails feature mocks
import trailsLayerDefinitionRaw from './mock/FeatureLayer/trails/trails-layer-info.json';
import trailsServiceDefinitionRaw from './mock/FeatureLayer/trails/trails-service-info.json';
import trailsItemRaw from './mock/FeatureLayer/trails/trails-item-info.json';
import trailsDataRaw from './mock/FeatureLayer/trails/trails-features.json';
import trailsDataTruncatedRaw from './mock/FeatureLayer/trails/trails-features-truncated.json'
import trailsQueryDataRaw from './mock/FeatureLayer/trails/trails-feature-query.json';
import trailsExceedsLimitRaw from './mock/FeatureLayer/trails/trails-feature-exceedsLimit.json';

const featureTrailsMock = {
  itemId: '69e12682738e467eb509d8b54dc73cbd',
  item: JSON.stringify(trailsItemRaw),
  serviceUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer',
  serviceDefinition: JSON.stringify(trailsServiceDefinitionRaw),
  layerUrl: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0',
  layerDefinition: JSON.stringify(trailsLayerDefinitionRaw),
  layerDefinitionRaw: trailsLayerDefinitionRaw,
  exceedsLimitResponse: JSON.stringify(trailsExceedsLimitRaw),
  geoJSONSmall: JSON.stringify(trailsDataTruncatedRaw),
  geoJSONLarge: JSON.stringify(trailsDataRaw),
  geoJSONRaw: trailsDataRaw,
  geoJSONSmallRaw: trailsDataTruncatedRaw
};

export const featureMocks = {
  trailsMock: featureTrailsMock,
  multiLayerMock: featureMultiLayerMock
};

let browser;
async function setupBrowser() {
  if (browser) {
    return browser
  };

  browser = await puppeteer.launch({
    headless: true // true by default, set to false to see the browser
  });
  return browser;
}

export const customTest = testBase.extend({
  // API key
  apiKey: async ({}, use) => {
    await use (process.env.PRODUCTION_KEY_ALP);
  },

  basemapSession: async ({apiKey}, use) => {
    fetchMock.once(JSON.stringify(sessionResponseRaw));
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis'
    });
    await use(session)
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
  },
  esriAttributionString: async ({}, use) => {
    const esriAttributionString = 'Powered by \<a href=\"https:\/\/www.esri.com\/\"\>Esri\<\/a\>';
    await use(esriAttributionString);
  },
  // Unloaded basemap style
  basemap: async ({apiKey}, use) => {
    const basemap = new BasemapStyle({
      style: 'arcgis/navigation',
      token: apiKey
    });
    await use(basemap);
  },
  // Loaded basemap style
  loadedBasemap: async ({apiKey}, use) => {
    const basemap = new BasemapStyle({
      style: 'arcgis/navigation',
      token: apiKey
    });

    fetchMock.once(JSON.stringify(basemapStyleNavigation));
    await basemap.loadStyle();

    await use(basemap);
  },
  setupPage : async ({}, use) => {
    async function loadPage (mockPageFile) {
      //setup the browser if it isn't already
      const browser = await setupBrowser();

      // Create a new page
      const page = await browser.newPage();

      // Set the viewport to a standard size
      page.setViewport({width: 1440, height: 960});

      // Set the API key for the page, this runs before any scripts on the page
      await page.evaluateOnNewDocument(({apiKey}) => {
        window.__ARCGIS_API_KEY__ = apiKey;
      }, { apiKey: process.env.PRODUCTION_KEY_ALP });

      // Navigate to the mock page
      await page.goto(`file://${process.cwd()}/test/mock/pages/${mockPageFile}`, {});
      // Return the page object to the test
      return page;
    }

    await use(loadPage);
  }
});
