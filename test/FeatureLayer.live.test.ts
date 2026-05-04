//@ts-nocheck
import { describe, expect, beforeAll } from 'vitest';
import { customTest as test, featureMocks } from './BaseTest';
import { getBlankFc } from '../src/Util';
import { removeMock } from './setupUnit';

const { trailsMock } = featureMocks;

// Live browser tests intentionally use real network/auth and are excluded from default `npm run test`.
describe('FeatureLayer live tests', () => {
  beforeAll(() => {
    removeMock();
  });

  test('Uninitialized layers created using the constructor cannot be added to the map.', async ({ setupPage }) => {
    const page = await setupPage('feature-layer.html');

    await page.waitForFunction(() => window.map && window.featureLayer);

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesAndLayersTo(window.map);
      });
    }).rejects.toThrowError('Cannot add sources and layers to map: Layer is not loaded.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesTo(window.map);
      });
    }).rejects.toThrowError('Cannot add sources to map: Layer is not loaded.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addLayersTo(window.map);
      });
    }).rejects.toThrowError('Cannot add layers to map: Layer is not loaded.');

    await page.close();
  });

  test('`addSourcesTo` and `addLayersTo` add source and layers to the maplibre map.', async ({ setupPage }) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { style } = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesTo(window.map);
      window.featureLayer.addLayersTo(window.map);

      return await new Promise(resolve => {
        window.map.on('load', () => {
          resolve({
            style: window.map.getStyle(),
          });
        });
      });
    });

    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(getBlankFc());

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);

    await page.close();
  });

  test('`addSourcesAndLayersTo` adds sources and layers to the maplibre map.', async ({ setupPage }) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { style } = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesAndLayersTo(window.map);

      return await new Promise(resolve => {
        window.map.on('load', () => {
          resolve({
            style: window.map.getStyle(),
          });
        });
      });
    });

    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(trailsMock.geoJSONRaw);

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);

    await page.close();
  });

  test('Works with native maplibre `addSource` and `addLayer` methods.', async ({ setupPage }) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { style } = await page.evaluate(async () => {
      await window.featureLayer.initialize();

      window.map.addSource(window.featureLayer.sourceId, window.featureLayer.source);
      window.map.addLayer(window.featureLayer.layer);

      return new Promise(resolve => {
        window.map.on('load', () => {
          resolve({
            style: window.map.getStyle(),
          });
        });
      });
    });

    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(trailsMock.geoJSONRaw);

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);

    await page.close();
  });
});
