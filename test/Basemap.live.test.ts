//@ts-nocheck
import { describe, expect, beforeAll, beforeEach } from 'vitest';
import { BasemapStyle } from '../src/MaplibreArcGIS';
import { customTest as test } from './BaseTest';
import { removeMock } from './setupUnit';

// Live tests intentionally use real network/auth and are excluded from default `npm run test`.
describe('Basemap live tests', () => {
  beforeAll(() => {
    removeMock();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
    fetchMock.dontMock();
  });

  test('Supports a static `getSelf() operation that makes a `/self` request to the service URL.', async ({ apiKey }) => {
    const serviceResponse = await BasemapStyle.getSelf({
      token: apiKey,
    });

    expect(serviceResponse.styles).toBeDefined();
    expect(serviceResponse.languages).toBeDefined();
    expect(serviceResponse.places).toBeDefined();
    expect(serviceResponse.worldviews).toBeDefined();
    expect(serviceResponse.styleFamilies).toBeDefined();
  });

  test('Updates the token in the map style when the session is refreshed.', async ({ setupPage }) => {
    const page = await setupPage('basemap-session.html');
    await page.waitForFunction(() => window.map && window.basemapSession && window.basemapStyle);

    const { style, token } = await page.evaluate(async () => {
      await window.basemapSession.refresh();

      return await new Promise(resolve => {
        window.map.on('styledata', () => {
          resolve({
            style: window.map.getStyle(),
            token: window.basemapSession.token,
          });
        });
      });
    });

    const tileUrl = style.sources[Object.keys(style.sources)[0]].tiles[0];
    expect(tileUrl.includes(token));
    await page.close();
  }, 20000);

});
