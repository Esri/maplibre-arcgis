//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayer } from '../src/FeatureLayer';

import trailsLayerInfoRaw from './mock/FeatureLayer/trails/trails-layer-info.json';
import trailsServiceInfoRaw from './mock/FeatureLayer/trails/trails-service-info.json';
import trailsItemInfoRaw from './mock/FeatureLayer/trails/trails-item-info.json';

import trailsDataRaw from './mock/FeatureLayer/trails/trails-features.json';
import trailsDataTruncatedRaw from './mock/FeatureLayer/trails/trails-features-truncated.json'
import trailsQueryDataRaw from './mock/FeatureLayer/trails/trails-feature-query.json';
import trailsDataCountOnlyRaw from './mock/FeatureLayer/trails/trails-feature-countOnly.json';

import multiLayerServiceInfoRaw from './mock/FeatureLayer/multiLayer-service-info.json';

const multiLayerServiceInfo = JSON.stringify(multiLayerServiceInfoRaw);
const trailsLayerInfo = JSON.stringify(trailsLayerInfoRaw);
const trailsServiceInfo = JSON.stringify(trailsServiceInfoRaw);
const trailsItemInfo = JSON.stringify(trailsItemInfoRaw);
const trailsData = JSON.stringify(trailsDataRaw);
const trailsDataTruncated = JSON.stringify(trailsDataTruncatedRaw);
const trailsQueryData = JSON.stringify(trailsQueryDataRaw);
const trailsDataCountOnly = JSON.stringify(trailsDataCountOnlyRaw);

// Santa Monica Trails data
const layerUrlTrails = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0';
const serviceUrlTrails = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer';
const serviceUrlManyLayers = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/ManyLayers/FeatureServer';
const itemIdTrails = '69e12682738e467eb509d8b54dc73cbd';

// Other item IDs
const itemIdBeetles = '44299709cce447ea99014ff1e3bf8505'
const itemIdParcels = 'b5d71d19fd4b43fbb88abf07773ec0c7';


const test = customTest.extend({
  trailsLayer: async ({}, use)=> {
    const trailsLayer = new FeatureLayer({
      url: layerUrlTrails
    });
    fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
    await trailsLayer.initialize();

    await use(trailsLayer);
  }
})

describe('Feature layer unit tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Throws if neither an item ID nor a url are provided.', () => {
    expect(() => {
      const featureLayer = new FeatureLayer({});
    }).toThrowError('Feature layer requires either an \'itemId\' or \'url\'.');

    expect(() => {
      const featureLayer = new FeatureLayer();
    }).toThrowError('Feature layer requires either an \'itemId\' or \'url\'.');
  });

  describe('Works with secure layers', () => {
    test('Accepts authentication as a string via `token`.', ({apiKey}) => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails,
        token: apiKey
      });
      expect(featureLayer.token).toBe(apiKey);
    });
    /*
    test('Accepts authentication as a REST JS object.', ({restJsAuthentication}) => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails,
        authentication: restJsAuthentication
      });
      expect(typeof featureLayer.authentication).toBe('object');
      expect(featureLayer.token).toBe(restJsAuthentication.token);
    });
    */

    // TODO
    test('Loads data from a secure item ID.', () => {});
    test('Loads data from a secure service URL.', () => {});
    test('Loads data from a secure layer URL.', () => {});
  });

  // TODO
  describe('Supports a `query` parameter.', () => {
    test('Accepts a `query` parameter and uses the query when retrieving feature data.', () => {
    });
    test('Supports `query` with a service URL passed.', () => {});
    test('Supports `query` with an item ID passed.', () => {});
    test('Supports `query` with a feature service passed.', () => {});
  });

  describe('Loads feature data from a service URL', ()=>{
    test('Accepts a feature URL, cleans it, and recognizes if it\'s a single layer or a service.', () => {
      // Service passed
      const featureLayer = new FeatureLayer({
        url: serviceUrlTrails
      });
      expect(featureLayer._inputType).toBe('FeatureService');
      expect(featureLayer._serviceInfo).toEqual({
        serviceUrl: serviceUrlTrails + '/'
      });

      // Single layer passed
      const featureLayer2 = new FeatureLayer({
        url: layerUrlTrails
      });
      expect(featureLayer2._inputType).toBe('FeatureLayer');
    });
    test('Throws if the URL is not the URL of a feature service.', () => {
      // Not a URL
      expect(() => {
        const featureLayer = new FeatureLayer({
          url: '123456789'
        });
      }).toThrowError('Argument `url` is not a valid feature service URL.');

      // Not a feature service
      expect(() => {
        const featureLayer = new FeatureLayer({
          url: 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer'
        });
      }).toThrowError('Argument `url` is not a valid feature service URL.');
    });

    test('Loads data from a layer and stores it within a MapLibre source.', async () => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails
      });
      fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
      await featureLayer.initialize();

      // Source object exists
      expect(Object.keys(featureLayer._sources).length).toBe(1);
      // Source object contains data
      expect(featureLayer._sources['Trails_0'].data).toMatchObject(trailsDataRaw);
    });

    test('If a feature service is passed, loads up to 10 layers from the service.', async () => {
      // Service URL works as well
      const featureService = new FeatureLayer({
        url: serviceUrlTrails
      });
      fetchMock.once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
      await featureService.initialize();

      expect(Object.keys(featureService._sources).length).toBe(1);
      expect(featureService._sources['Trails_0'].data).toMatchObject(trailsDataRaw);
    });
    test('If the service contains more than 10 layers, only load the first 10 and log a warning', async () => {

      const featureService = new FeatureLayer({
        url: serviceUrlManyLayers
      });
      const warningSpy = vi.spyOn(console, 'warn');

      // Mock all layer responses
      fetchMock.once(multiLayerServiceInfo)
      for (let i=0;i<10;i++) {
        fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      }
      await featureService.initialize();

      expect(multiLayerServiceInfoRaw.layers.length).toBeGreaterThan(10);

      // Warning and only load 10 layers
      expect(warningSpy).toHaveBeenCalledWith('This feature service contains more than 10 layers. Only the first 10 layers will be loaded.');
      expect(Object.keys(featureService._sources).length).toBe(10);
      expect(featureService._layers.length).toBe(10);
    });

    test('Sets the source name, layer name, and geometry type, based on layer info.', async ({trailsLayer}) => {
      // Geometry type
      expect(trailsLayer._layers[0].type).toBe('line');
      // Name
      expect(Object.keys(trailsLayer._sources)[0]).toBe('Trails_0');
      expect(trailsLayer._layers[0].id).toBe('Trails_0-layer');
    });
    test('Warns the user if they attempt to load layers with more than 2000 features.', async () => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails
      });
      const warningSpy = vi.spyOn(console,'warn');

      fetchMock.once(trailsLayerInfo).once(JSON.stringify({
        "count": 10000
      })).once(trailsLayerInfo).once(trailsDataTruncated);

      await featureLayer.initialize();
      expect(warningSpy).toHaveBeenCalledWith('You are loading a large feature layer (>2000 features) as GeoJSON. This may take some time; consider hosting your data as a vector tile layer instead.')
    });
    test('Throws if the layer does not support the `exceedsLimit` statistic.', () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "Query",
        supportsExceedsLimitStatistics: false,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('Feature layers hosted in old versions of ArcGIS Enterprise are not supported by this plugin. https://github.com/Esri/maplibre-arcgis/issues/5')
    });
    test('Throws if the layer does not support GeoJSON responses.', () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "",
        capabilities: "Query",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support GeoJSON format.')
    });
    test('Throws if the layer does not support query operations.', () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support queries.');
    });
    test('Throws if the layer does not support query pagination.', () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "Query",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: false }
      }));
      expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support query pagination.');
    });
  });

  // TODO
  describe('Supports layer creation using item IDs', () => {
    test('Accepts an item ID and portal URL in the constructor, and the portal URL defaults to arcgis.com.', () => {
      // Default portal URL
      const featureLayer = new FeatureLayer({
        itemId: itemIdBeetles
      });
      expect(featureLayer._inputType).toBe('ItemId');
      expect(featureLayer._itemInfo).toEqual({
        itemId: itemIdBeetles,
        portalUrl: 'https://www.arcgis.com/sharing/rest'
      });

      // Custom portal URL
      const featureLayer2 = new FeatureLayer({
        itemId: itemIdBeetles,
        portalUrl: 'https://my-evil-portal.com/items'
      });
      expect(featureLayer2._itemInfo).toEqual({
        itemId: itemIdBeetles,
        portalUrl: 'https://my-evil-portal.com/items'
      });
    });
    test('Throws if the item ID format is invalid', () => {
      expect(() => {
        const featureLayer = new FeatureLayer({
          itemId: 'random junk'
        });
      }).toThrowError('Argument `itemId` is not a valid item ID.')
    });
    test('Prefers an item ID over a service URL if both are provided.', () => {
      const warningSpy = vi.spyOn(console, 'warn');
      const featureLayer = new FeatureLayer({
        itemId: itemIdBeetles,
        url: serviceUrlTrails
      });
      expect(warningSpy).toHaveBeenCalledWith('Both an item ID and service URL have been passed. Only the item ID will be used.');
      expect(featureLayer._inputType).toBe('ItemId');
      expect(featureLayer._serviceInfo).toBeUndefined();
    });

    //TODO
    test('Gets item metadata including attribution, title, and description.', () => {});
    test('Saves the service URL from item info and loads data based on that.', () => {});
  });

  // TODO
  describe('Formats sources and layers for use with maplibre.',()=>{
    test('Creates a unique source ID for each source', () => {});
    test('Creates a \'geojson\' source containing geojson data.', () => {});

    test('Sets the \'attribution\' property of the source.', () => {});
    test('Prefers user-provided custom attribution over all other attribution strings.', () => {});
    test('Prefers attribution information of the item ID over the service URL.', () => {});
    test('Prefers attribution from the service URL over the existing attribution from the style.', () => {});

    test('Creates a default layer for each geojson source', () => {});
    test('Provides default styling info for default layers of all types.', () => {});
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
