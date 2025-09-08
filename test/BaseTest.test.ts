//@ts-nocheck
import { vi, expect, test as testBase } from "vitest";
import puppeteer from 'puppeteer';

import { BasemapSession, BasemapStyle } from '../src/MaplibreArcGIS.js';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
import { Map } from 'maplibre-gl';
import {MOCK_API_KEY} from './mock/authentication/basemapApiKey.js';
import basemapStyleNavigation from './mock/BasemapStyle/ArcGISNavigation.json';

export const customTest = testBase.extend({
  // API key
  apiKey: async ({}, use) => {
    await use (process.env.PRODUCTION_KEY_ALP);
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



customTest('Test suite creates a virtual window and DOM', () => {
  expect(typeof window).not.toBe('undefined');
  expect(window instanceof Window).toBe(true);
});

customTest('Fetch mock works properly when enabled.', async () => {
  fetchMock.enableMocks();

  const mockResponse = {
    glyphs:'test format',
    sources:{
      esri:{
        url:'more test'
      }
    }
  }

  fetchMock.mockOnce(JSON.stringify(mockResponse))
  const response = await fetch('https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles/arcgis/navigation');
  const body = await response.json();

  expect(body).toEqual(mockResponse)
});
