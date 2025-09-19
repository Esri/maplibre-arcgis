//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { VectorTileLayer } from '../src/VectorTileLayer';

import customResourcesRaw from './mock/VectorTileLayer/custom-style-resource.json'

import usaServiceInfoRaw from './mock/VectorTileLayer/usa/service-info.json';
import usaServiceItemInfoRaw from './mock/VectorTileLayer/usa/service-item-info.json';
import usaServiceStyleRaw from './mock/VectorTileLayer/usa/service-resource-style.json';

import usaItemInfoRaw from './mock/VectorTileLayer/usa/styled-item-info.json';
import usaItemResourcesRaw from './mock/VectorTileLayer/usa/styled-item-resources.json';
import usaItemStyleRaw from './mock/VectorTileLayer/usa/styled-item-resource-style.json';
import { ApiKeyManager } from '@esri/arcgis-rest-request';

const customResources = JSON.stringify(customResourcesRaw);

const usaServiceInfo = JSON.stringify(usaServiceInfoRaw);
const usaServiceStyle = JSON.stringify(usaServiceStyleRaw);
const usaServiceItemInfo = JSON.stringify(usaServiceItemInfoRaw);

const usaItemInfo = JSON.stringify(usaItemInfoRaw);
const usaItemStyle = JSON.stringify(usaItemStyleRaw);
const usaItemResources = JSON.stringify(usaItemResourcesRaw);

const emptyResources = JSON.stringify({
  "total": 0,
  "start": 1,
  "num": 0,
  "nextStart": -1,
  "resources": []
});

// USA population layer
const itemIdUSA = '31eb749371c441e0b3ac5db4f60ecba9';
const serviceItemIdUSA = '7945dd44c5cd41329984d7ce6e641976';
const serviceUrlUSA = 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/USA_States_Population_Vector_Tiles/VectorTileServer';

// Santa Monica Mountains Parcels
const serviceUrlParcels = 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer';
const serviceItemId = 'f0298e881b5b4743bbdf2c7d378acc84';

const test = customTest.extend({
  statesLayer: async ({}, use) => {
    const statesLayer = new VectorTileLayer({
      url: serviceUrlUSA
    });
    fetchMock.once(usaServiceInfo).once(usaServiceStyle);
    await statesLayer.initialize();

    await use(statesLayer);
  }
})

describe('Vector tile layer tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Throws if neither an item ID nor service URL are provided.', () => {
    // Empty options
    expect(() => {
      const vtl = new VectorTileLayer({});
    }).toThrowError('Vector tile layer requires either an \'itemId\' or \'url\'.');
    // No options
    expect(() => {
      const vtl = new VectorTileLayer();
    }).toThrowError('Vector tile layer requires either an \'itemId\' or \'url\'.');
  });

  describe('Works with authenticated layers', () => {
    test('Accepts authentication as a string via `token`.', ({apiKey}) => {
      const vtl = new VectorTileLayer({
        url: serviceUrlParcels,
        token: apiKey
      });
      expect(vtl.token).toBe(apiKey);
    });

    test('Passes authentication to all REST JS requests.', async({apiKey}) => {
      const { getItem, getItemResource, getItemResources } = await import('@esri/arcgis-rest-portal');
      const { request } = await import('@esri/arcgis-rest-request');

      const authLayer = new VectorTileLayer({
        itemId: itemIdUSA,
        token: apiKey
      });

      fetchMock.once(usaServiceItemInfo).once({}).once(emptyResources).once(usaServiceInfo).once(usaServiceStyle);
      await authLayer.initialize();

      const apiKeyManager = ApiKeyManager.fromKey(apiKey);
      expect(getItem).toHaveBeenCalledWith(itemIdUSA, expect.objectContaining({authentication:apiKeyManager}));
      expect(getItemResource).toHaveBeenCalledWith(itemIdUSA, expect.objectContaining({authentication:apiKeyManager}));
      expect(getItemResources).toHaveBeenCalledWith(itemIdUSA, expect.objectContaining({authentication:apiKeyManager}));

      expect(request).toHaveBeenNthCalledWith(2,expect.stringContaining(serviceUrlUSA),expect.objectContaining({authentication:apiKeyManager}));
    });


    test('Adds authentication to the style tile URLs, sprites, and glyphs.', async ({apiKey}) => {
      const authLayer = new VectorTileLayer({
        url: serviceUrlUSA,
        token: apiKey
      });

      fetchMock.once(usaServiceInfo).once(usaServiceStyle);
      await authLayer.initialize();

      const tokenQueryParam = `token=${apiKey}`;
      expect(authLayer.style.sprite).toMatch(tokenQueryParam);
      expect(authLayer.style.glyphs).toMatch(tokenQueryParam);

      const usaSources = authLayer.style.sources['USA_States_Population_Vector_Tiles']
      expect(usaSources.url).toMatch(tokenQueryParam);
      usaSources.tiles.forEach(tile => {expect(tile).toMatch(tokenQueryParam)});
    });
  });

  describe('Loads data from a service URL', () => {
    test('Accepts a service URL in the constructor and cleans the URL.', () => {
      const vtl = new VectorTileLayer({
        url: serviceUrlParcels
      });
      expect(vtl._inputType).toBe('VectorTileService');
      expect(vtl._serviceInfo).toEqual({
        serviceUrl: serviceUrlParcels + '/'
      })
    });
    test('Throws if the URL is not the URL of a vector tile service.', () => {
      // Not a URL
      expect(() => {
        const vtl = new VectorTileLayer({
          url: itemIdUSA
        });
      }).toThrowError('Argument `url` is not a valid vector tile service URL.');
      // Not a vector tile service
      expect(() => {
        const vtl = new VectorTileLayer({
          url: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/'
        });
      }).toThrowError('Argument `url` is not a valid vector tile service URL.');
    });

    test('Fetches the style from the service URL.', async () => {
      const layer = new VectorTileLayer({
        url: serviceUrlUSA
      });

      fetchMock.once(usaServiceInfo).once(usaServiceStyle);
      await layer.initialize();

      expect(layer.style.layers).toEqual(usaServiceStyleRaw.layers);
      expect(Object.keys(layer.style.sources)).toEqual(Object.keys(usaServiceStyleRaw.sources));
    });
    test('Fetches service info including the style location, tile format, and attribution.', ({statesLayer}) => {
      expect(statesLayer._serviceInfo.copyrightText).toBe('Copyright text from service info.');
      expect(statesLayer._serviceInfo.tiles).toEqual(["tile/{z}/{y}/{x}.pbf"]);
      expect(statesLayer._serviceInfo.styleEndpoint).toBe("resources/styles/");
    });
  });

  describe('Loads styles from an item ID', () => {
    test('Accepts an item ID and portal URL in the constructor, and the portal URL defaults to arcgis.com.', () => {
      const vtl = new VectorTileLayer({
        itemId: itemIdUSA
      });
      expect(vtl._inputType).toBe('ItemId');
      expect(vtl._itemInfo).toEqual({
        itemId: itemIdUSA,
        portalUrl: 'https://www.arcgis.com/sharing/rest'
      });

      // Custom portal URL
      const vtl2 = new VectorTileLayer({
        itemId: itemIdUSA,
        portalUrl: 'https://my-evil-portal.com/items'
      });
      expect(vtl2._itemInfo).toEqual({
        itemId: itemIdUSA,
        portalUrl: 'https://my-evil-portal.com/items'
      });
    });
    test('Throws if the item ID format is invalid', () => {
      expect(() => {
        const vtl = new VectorTileLayer({
          itemId: 'random junk'
        });
      }).toThrowError('Argument `itemId` is not a valid item ID.')
    });
    test('Prefers an item ID over a service URL if both are provided.', () => {
      const warningSpy = vi.spyOn(console, 'warn');
      const vtl = new VectorTileLayer({
        itemId: itemIdUSA,
        url: serviceUrlParcels
      });
      expect(warningSpy).toHaveBeenCalledWith('Both an item ID and service URL have been passed. Only the item ID will be used.');
      expect(vtl._inputType).toBe('ItemId');
      expect(vtl._serviceInfo).toBeUndefined();
    });

    test('Fetches the style of an item ID from the item resources.', async () => {
      const layer = new VectorTileLayer({
        itemId: itemIdUSA
      });

      fetchMock.once(usaItemInfo).once(usaItemStyle);
      await layer.initialize();

      expect(layer.style.layers).toEqual(usaItemStyleRaw.layers);
      expect(Object.keys(layer.style.sources)).toEqual(Object.keys(usaItemStyleRaw.sources));
    });
    test('Loads style resources saved to the item that have a custom name.', async () => {
      const layer = new VectorTileLayer({
        itemId: itemIdUSA
      });

      fetchMock.once(usaItemInfo).once({}).once(customResources).once(usaItemStyle);
      await layer.initialize();

      expect(layer.style.layers).toEqual(usaItemStyleRaw.layers);
      expect(Object.keys(layer.style.sources)).toEqual(Object.keys(usaItemStyleRaw.sources));
    });

    test('Falls back to the style of the service URL if no style resource is found on the item.', async () => {
      const layer = new VectorTileLayer({
        itemId: itemIdUSA
      });

      fetchMock.once(usaServiceItemInfo).once({}).once(emptyResources).once(usaServiceInfo).once(usaServiceStyle);
      await layer.initialize();

      expect(layer.style.layers).toEqual(usaServiceStyleRaw.layers);
      expect(Object.keys(layer.style.sources)).toEqual(Object.keys(usaServiceStyleRaw.sources));
    });


    test('Fetches item metadata, including the layer name and attribution.', async () => {
      const layer = new VectorTileLayer({
        itemId: itemIdUSA
      });
      fetchMock.once(usaItemInfo).once(usaItemStyle);
      await layer.initialize();

      expect(layer._itemInfo.accessInformation).toBe("Access information from item.");
      expect(layer._itemInfo.title).toBe("USA States Population Vector Tiles VTSE");
      expect(layer._itemInfo.description).toBe("Item description.");
    });
  });

  describe('Formats a style properly for use with MapLibre.', () => {
    test('Formats the source URL.', ({statesLayer}) => {

    });
    test('Creates a \'tiles\' property with information from the service.', () => {});
    test('Formats the source sprites.', () => {});
    test('Formats the source glyphs.', () => {});
    test('Fixes the `text-font` property of all layers if present.', () => {});

    test('Sets the `attribution` property of the source.', () => {});

    test('Prefers user-provided custom attribution over all other attribution strings.', () => {});
    test('Prefers attribution information of the item ID over the service URL.', () => {});
    test('Prefers attribution from the service URL over the existing attribution from the style.', () => {});

  });


  // TODO
  test('Displays layer attribution on the map.', () => {});
  test('Creates a layer from item ID with the `fromPortalItem` static method.', () => {});
  test('Creates a layer from service URL with the `fromUrl` static method.', () => {});
  test('Uninitialized layers created using the constructor cannot be added to the map.', ()=>{});
  test('Loads style data on an uninitialized layer using the `initialize()` method.', () => {});

  // TODO
  describe('Methods inherited from HostedLayer work properly.', () => {
    test('`addSourcesTo` adds sources to the maplibre map.', () => {});
    test('`addLayersTo` adds layers to the maplibre map.', () => {});
    test('`addSourcesAndLayersTo` adds sources and layers to the maplibre map.', () => {});
    test('Renders properly on a maplibre map.', () => {});
    test('Adds \'Powered by Esri\' to the map attribution when an add method is called.', () => {});
    test('Works with native maplibre `addSource` and `addLayer` methods.', () => {});

    test('`layer`, `layers, `source`, `sources` are read-only properties containing style data.', () => {});
    test('`copyLayer` and `copySource` create deep copies of style data.', () => {});
    test('`style` is a read-only copy of the entire layer style.', ()=>{});
    test('`setSourceId` changes the source ID of the specified source and updates all layers.', () => {});
    test('`setAttribution` sets the attribution of the specified source.', () => {});
  });
});
