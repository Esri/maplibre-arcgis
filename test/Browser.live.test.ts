//@ts-nocheck
import { describe, expect } from 'vitest';
import { customTest as test } from './BaseTest';
import { removeMock } from './setupUnit';

// Live browser tests intentionally use real network/auth and are excluded from default `npm run test`.
describe('Browser live tests', () => {
  test('Loads a real basemap page in puppeteer.', async ({ setupPage }) => {
    removeMock();

    const page = await setupPage('basemap-style.html');
    await page.waitForFunction(() => window.map && window.basemapStyle);

    const { style } = await page.evaluate(async () => {
      return await new Promise(resolve => {
        window.map.on('load', () => {
          resolve({
            style: window.map.getStyle(),
          });
        });
      });
    });

    await page.waitForFunction(async () => {
      return await new Promise(resolve => {
        if (window.map.areTilesLoaded()) {
          return resolve(true);
        }
        window.map.once('render', resolve);
      });
    });

    expect(style.sources.esri.url).toBe('https://basemaps-api.arcgis.com/arcgis/rest/services/World_Basemap_v2/VectorTileServer');
    await page.close();
  }, 20000);
});
