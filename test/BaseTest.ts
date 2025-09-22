//@ts-nocheck
import { vi, expect, test as testBase, describe } from "vitest";
import puppeteer from 'puppeteer';

import { BasemapSession, BasemapStyle } from '../src/MaplibreArcGIS.js';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
import { Map } from 'maplibre-gl';
import {MOCK_API_KEY} from './mock/authentication/basemapApiKey.js';
import basemapStyleNavigation from './mock/BasemapStyle/ArcGISNavigation.json';

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
