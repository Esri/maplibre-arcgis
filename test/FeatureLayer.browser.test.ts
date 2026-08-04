//@ts-nocheck
import { describe, expect, beforeAll, beforeEach } from 'vitest';
import { customTest } from './BaseTest';
import { useMock, removeMock } from './setupUnit';
import { getBlankFc } from '../src/Util';

const test = customTest.extend({
  maplibreLayerOptions: async ({}, use) => {
    const layerOptions = {
      type: 'line',
      paint: {
        'line-color': '#ff00ff',
        'line-width': 5
      }
    };
    await use(layerOptions);
  },

  maplibreSourceOptions: async ({}, use) => {
    const sourceOptions = {
      cluster: true,
      clusterRadius: 100,
      clusterMaxZoom: 10,
    };
    await use(sourceOptions);
  }
});

describe('FeatureLayer browser tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });

  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Uninitialized layers cannot be added to the map.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');

    await page.waitForFunction(() => window.map && window.featureLayer);

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesAndLayersTo(window.map);
      });
    }).rejects.toThrowError('Cannot add sources and layers to map: Class is not initialized.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesTo(window.map);
      });
    }).rejects.toThrowError('Cannot add sources to map: Class is not initialized.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addLayersTo(window.map);
      });
    }).rejects.toThrowError('Cannot add layers to map: Class is not initialized.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addLayerTo(window.map);
      });
    }).rejects.toThrowError('Cannot add layer to map: Class is not initialized.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourceTo(window.map);
      });
    }).rejects.toThrowError('Cannot add source to map: Class is not initialized.');

    await page.close();
  });

  test('`addSourceTo` adds a GeoJSON source to map, `addLayerTo` adds a layer to map, and both throw if multiple layers are present.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { mapStyle } = await page.evaluate(async () => {
      await window.featureLayer.initialize();

      window.featureLayer.addSourceTo(window.map);
      window.featureLayer.addLayerTo(window.map);

      return {
        mapStyle: window.map.getStyle()
      };
    });

    expect(Object.keys(mapStyle.sources).length).toBe(1);
    expect(mapStyle.layers.length).toBe(1);
    expect(mapStyle.layers[0].source).toEqual(Object.keys(mapStyle.sources)[0]);

    await page.close();
  });

  test('`addSourcesTo` and `addLayersTo` add sources and layers to the maplibre map.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { mapStyle } = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesTo(window.map);
      window.featureLayer.addLayersTo(window.map);

      return {
        mapStyle: window.map.getStyle()
      };
    });
    expect(Object.keys(mapStyle.sources).length).toBe(1);
    expect(mapStyle.layers.length).toBe(1);
    expect(mapStyle.layers[0].source).toBe(Object.keys(mapStyle.sources)[0]);

    await page.close();
  });

  test('`addSourcesAndLayersTo` adds sources and layers to the maplibre map.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { style } = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesAndLayersTo(window.map);

      return {
        style: window.map.getStyle()
      };
    });
    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);

    await page.close();
  });

  test('`addSourceTo` and `addLayerTo` accept maplibre options and pass them to the maplibre map.', async ({setupPage, maplibreSourceOptions, maplibreLayerOptions}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { mapStyle } = await page.evaluate(async (params) => {
      await window.featureLayer.initialize();

      window.featureLayer.addSourceTo(window.map, params.maplibreSourceOptions);
      window.featureLayer.addLayerTo(window.map, params.maplibreLayerOptions);

      return {
        mapStyle: window.map.getStyle()
      };
    }, { maplibreSourceOptions, maplibreLayerOptions });

    expect(Object.values(mapStyle.sources)[0]).toEqual(expect.objectContaining(maplibreSourceOptions));
    expect(mapStyle.layers[0]).toEqual(expect.objectContaining(maplibreLayerOptions));

    await page.close();
  });

  test('`addSourcesTo` and `addLayersTo` accept transform functions for setting maplibre options.', async ({setupPage, maplibreSourceOptions, maplibreLayerOptions}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { mapStyle } = await page.evaluate(async (params) => {
      await window.featureLayer.initialize();

      window.featureLayer.addSourcesTo(window.map, (sourceId, source) => {
        return {
          ...source,
          ...params.maplibreSourceOptions
        };
      });
      window.featureLayer.addLayersTo(window.map, (layer) => {
        return {
          ...layer,
          ...params.maplibreLayerOptions
        };
      });

      return {
        mapStyle: window.map.getStyle()
      };
    }, { maplibreSourceOptions, maplibreLayerOptions });

    expect(Object.values(mapStyle.sources)[0]).toEqual(expect.objectContaining(maplibreSourceOptions));
    expect(mapStyle.layers[0]).toEqual(expect.objectContaining(maplibreLayerOptions));

    await page.close();
  });

  test('`addSourcesAndLayersTo` accepts transform functions for setting maplibre options.', async ({setupPage, maplibreSourceOptions, maplibreLayerOptions}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { mapStyle } = await page.evaluate(async (params) => {
      await window.featureLayer.initialize();

      window.featureLayer.addSourcesAndLayersTo(window.map, {
        transformSources: (sourceId, source) => {
          return {
            ...source,
            ...params.maplibreSourceOptions
          };
        },
        transformLayers: (layer) => {
          return {
            ...layer,
            ...params.maplibreLayerOptions
          };
        }
      });

      return {
        mapStyle: window.map.getStyle()
      };
    }, { maplibreSourceOptions, maplibreLayerOptions });

    expect(Object.values(mapStyle.sources)[0]).toEqual(expect.objectContaining(maplibreSourceOptions));
    expect(mapStyle.layers[0]).toEqual(expect.objectContaining(maplibreLayerOptions));

    await page.close();
  });

  test('Works with native maplibre `addSource` and `addLayer` methods if map is set.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const { style } = await page.evaluate(async () => {
      await window.featureLayer.initialize();

      window.map.addSource(window.featureLayer.sourceId, window.featureLayer.source);
      window.map.addLayer(window.featureLayer.layer);

      return {
        style: window.map.getStyle()
      };
    });

    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(getBlankFc());

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);

    await page.close()
  });

  // TODO fix this test
  /*
  test('Creates an Esri `AttributionControl when added to the map.', async ({setupPage, esriAttributionString}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(()=> window.map && window.featureLayer);

    vi.doMock('../src/AttributionControl',{spy:true});
    const {AttributionControl} = await import('../src/AttributionControl');

    await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesAndLayersTo(window.map);
      return new Promise(resolve => {
        window.map.on("load", (e)=> {
          resolve()
        });
      });
    });
    expect(AttributionControl).toHaveBeenCalled();
  });
  test('Does not add the Esri `AttributionControl` if Esri attribution is already present', () => {});
  test('Renders properly on a maplibre map.', () => {}); //
  */
});
