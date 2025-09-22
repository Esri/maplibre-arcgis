//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { customTest } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayer } from '../src/FeatureLayer';
import { queryFeatures, queryAllFeatures } from '@esri/arcgis-rest-feature-service';

import trailsLayerInfoRaw from './mock/FeatureLayer/trails/trails-layer-info.json';
import trailsServiceInfoRaw from './mock/FeatureLayer/trails/trails-service-info.json';
import trailsItemInfoRaw from './mock/FeatureLayer/trails/trails-item-info.json';

import trailsDataRaw from './mock/FeatureLayer/trails/trails-features.json';
import trailsDataTruncatedRaw from './mock/FeatureLayer/trails/trails-features-truncated.json'
import trailsQueryDataRaw from './mock/FeatureLayer/trails/trails-feature-query.json';
import trailsDataCountOnlyRaw from './mock/FeatureLayer/trails/trails-feature-countOnly.json';

import pointsLayerInfoRaw from './mock/FeatureLayer/points/points-layer-info.json';
import pointsDataRaw from './mock/FeatureLayer/points/points-features-truncated.json';

import polygonsLayerInfoRaw from './mock/FeatureLayer/parcels/parcels-layer-info.json';
import polygonsDataRaw from './mock/FeatureLayer/parcels/parcels-features-truncated.json';

import multiLayerServiceInfoRaw from './mock/FeatureLayer/multiLayer-service-info.json';

const polygonsLayerInfo = JSON.stringify(polygonsLayerInfoRaw);
const polygonsData = JSON.stringify(polygonsDataRaw);

const pointsLayerInfo = JSON.stringify(pointsLayerInfoRaw);
const pointsData = JSON.stringify(pointsDataRaw);

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
const layerUrlPoints = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trailheads/FeatureServer/0';
const layerUrlPolygons = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Parks_and_Open_Space/FeatureServer/0';



const test = customTest.extend({
  trailsLayer: async ({}, use)=> {
    const trailsLayer = new FeatureLayer({
      url: layerUrlTrails
    });
    fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
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
    test('Passes authentication to all REST JS requests.', async ({apiKey}) => {
      const { getLayer, getService, queryAllFeatures, queryFeatures } = await import('@esri/arcgis-rest-feature-service');
      const { getItem } = await import('@esri/arcgis-rest-portal');
      const {ApiKeyManager} = await import('@esri/arcgis-rest-request');

      const authLayer = new FeatureLayer({
        itemId: itemIdTrails,
        token: apiKey
      });

      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await authLayer.initialize();

      const apiKeyManager = ApiKeyManager.fromKey(apiKey);

      expect(getItem).toHaveBeenCalledWith(itemIdTrails, expect.objectContaining({authentication:apiKeyManager}));
      expect(getService).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
      expect(getLayer).toHaveBeenCalledWith(expect.objectContaining({authentication: apiKeyManager}));
      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
    });
  });

  describe('Supports a `query` parameter.', () => {
    test('Accepts a `query` parameter and adds the query to service URL requests.', async () => {

      const {queryFeatures, queryAllFeatures} = await import('@esri/arcgis-rest-feature-service');

      const trailQuery = {
        outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
        where: 'ELEV_MIN > 2000'
      }
      const layer = new FeatureLayer({
        url: layerUrlTrails,
        query: trailQuery
      });

      expect(layer.query).toBe(trailQuery);
      fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();

      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));
    });
    test('Supports `query` with a service URL, but only when the service contains a single layer.', async () => {
      const {queryFeatures, queryAllFeatures} = await import('@esri/arcgis-rest-feature-service');

      const trailQuery = {
        outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
        where: 'ELEV_MIN > 2000'
      }
      // Works on service when there's only one layer in the service
      const layer = new FeatureLayer({
        url: serviceUrlTrails,
        query: trailQuery
      });

      expect(layer.query).toBe(trailQuery);
      fetchMock.once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();

      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));

      // Throws on multi-layer service
      await expect(async () => {
        const multiService = new FeatureLayer({
          url: serviceUrlManyLayers,
          query: {
            where: 'ELEV_MAX>1000'
          }
        });

        fetchMock.once(multiLayerServiceInfo);
        await multiService.initialize();
      }).rejects.toThrowError('Unable to use `query` parameter: This feature service contains multiple feature layers.');
    });
    test('Supports `query` with an item ID, but only when the item contains a single layer.', async () => {
            const {queryFeatures, queryAllFeatures} = await import('@esri/arcgis-rest-feature-service');

      const trailQuery = {
        outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
        where: 'ELEV_MIN > 2000'
      }
      // Works on service when there's only one layer in the service
      const layer = new FeatureLayer({
        itemId: itemIdTrails,
        query: trailQuery
      });

      expect(layer.query).toBe(trailQuery);
      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();

      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));

      // Throws on multi-layer service
      await expect(async () => {
        const multiService = new FeatureLayer({
          itemId: itemIdBeetles,
          query: {
            where: 'ELEV_MAX>1000'
          }
        });

        fetchMock.once(trailsItemInfo).once(multiLayerServiceInfo);
        await multiService.initialize();
      }).rejects.toThrowError('Unable to use `query` parameter: This feature service contains multiple feature layers.');
    });
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

    test('Loads data from a layer and stores it within a MapLibre geojson source.', async () => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails
      });
      fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
      await featureLayer.initialize();

      // Source object exists
      expect(Object.keys(featureLayer._sources).length).toBe(1);
      // Source object contains data
      expect(featureLayer._sources['Trails_0'].data).toEqual(trailsDataRaw);
      expect(featureLayer._sources['Trails_0'].type).toBe('geojson');
    });

    test('If a feature service is passed, loads up to 10 layers from the service.', async () => {
      // Service URL works as well
      const featureService = new FeatureLayer({
        url: serviceUrlTrails
      });
      fetchMock.once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
      await featureService.initialize();

      expect(Object.keys(featureService._sources).length).toBe(1);
      expect(featureService._sources['Trails_0'].data).toEqual(trailsDataRaw);
    });
    test('If the service contains more than 10 layers, only load the first 10 and log a warning', async () => {

      const featureService = new FeatureLayer({
        url: serviceUrlManyLayers
      });
      const warningSpy = vi.spyOn(console, 'warn').mockImplementation((warningText) => {});

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
    test('Warns the user if they attempt to load layers with more than 2000 features.', async () => {
      const featureLayer = new FeatureLayer({
        url: layerUrlTrails
      });
      const warningSpy = vi.spyOn(console,'warn').mockImplementation((warningText) => {});

      fetchMock.once(trailsLayerInfo).once(JSON.stringify({
        "count": 10000
      })).once(trailsLayerInfo).once(trailsDataTruncated);

      await featureLayer.initialize();
      expect(warningSpy).toHaveBeenCalledWith('You are loading a large feature layer (>2000 features) as GeoJSON. This may take some time; consider hosting your data as a vector tile layer instead.')
    });
    test('Throws if the layer does not support the `exceedsLimit` statistic.', async () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "Query",
        supportsExceedsLimitStatistics: false,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      await expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('Feature layers hosted in old versions of ArcGIS Enterprise are not supported by this plugin. https://github.com/Esri/maplibre-arcgis/issues/5')
    });
    test('Throws if the layer does not support GeoJSON responses.', async () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "",
        capabilities: "Query",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      await expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support GeoJSON format.')
    });
    test('Throws if the layer does not support query operations.', async () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: true }
      }));
      await expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support queries.');
    });
    test('Throws if the layer does not support query pagination.', async () => {
      const layer = new FeatureLayer({
        url: layerUrlTrails
      });

      fetchMock.once(JSON.stringify({
        supportedQueryFormats: "JSON, geoJSON, PBF",
        capabilities: "Query",
        supportsExceedsLimitStatistics: true,
        advancedQueryCapabilities: { supportsPagination: false }
      }));
      await expect(async () => {
        await layer.initialize();
      }).rejects.toThrowError('This feature service does not support query pagination.');
    });
  });

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
      const warningSpy = vi.spyOn(console, 'warn').mockImplementation((warningText) => {});
      const featureLayer = new FeatureLayer({
        itemId: itemIdBeetles,
        url: serviceUrlTrails
      });
      expect(warningSpy).toHaveBeenCalledWith('Both an item ID and service URL have been passed. Only the item ID will be used.');
      expect(featureLayer._inputType).toBe('ItemId');
      expect(featureLayer._serviceInfo).toBeUndefined();
    });

    test('Gets item metadata including attribution, title, and description.', async () => {
      const featureLayer = new FeatureLayer({
        itemId: itemIdTrails
      });
      // Load item info -> service info -> layer info -> layer data
      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);

      await featureLayer.initialize();

      expect(featureLayer._itemInfo.accessInformation).toBe('Access information from item info.');
      expect(featureLayer._itemInfo.description).toBe('Item description.');
      expect(featureLayer._itemInfo.title).toBe('Trails');
      expect(featureLayer._itemInfo?.licenseInfo).toBeDefined();
    });

    test('Fetches the service URL from item info and loads data based on that.', async () => {
      const featureLayer = new FeatureLayer({
        itemId: itemIdTrails
      });
      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);

      await featureLayer.initialize();

      expect(featureLayer._serviceInfo.serviceUrl).toBe(serviceUrlTrails);
      expect(featureLayer._sources['Trails_0'].data).toEqual(trailsDataRaw);
    });
  });

  describe('Formats sources and layers for use with maplibre.',()=>{

    test('Sets the source name, layer name, and geometry type, based on layer info.', async ({trailsLayer}) => {
      // Geometry type
      expect(trailsLayer._layers[0].type).toBe('line');
      // Name
      expect(Object.keys(trailsLayer._sources)[0]).toBe('Trails_0');
      expect(trailsLayer._layers[0].id).toBe('Trails_0-layer');
    });
    test('Creates a default layer style for each type of geojson source', async () => {

      const countOnlyResponse = JSON.stringify({
        count:500
      });
      // Points
      fetchMock.once(pointsLayerInfo).once(countOnlyResponse).once(pointsLayerInfo).once(pointsData);
      const points = new FeatureLayer({
        url: layerUrlPoints
      });
      await points.initialize();

      // Lines
      fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      const lines = new FeatureLayer({
        url: layerUrlTrails
      });
      await lines.initialize();

      // Polygons
      fetchMock.once(polygonsLayerInfo).once(countOnlyResponse).once(polygonsLayerInfo).once(polygonsData);
      const polygons = new FeatureLayer({
        url: layerUrlPolygons
      });
      await polygons.initialize();


      expect(points._layers[0].type).toBe('circle');
      expect(points._layers[0].paint).toEqual({
        'circle-color': 'rgb(0,0,0)',
      });

      expect(lines._layers[0].type).toBe('line');
      expect(lines._layers[0].paint).toEqual({
        'line-color': 'rgb(0,0,0)',
        'line-width': 3,
      });

      expect(polygons._layers[0].type).toBe('fill');
      expect(polygons._layers[0].paint).toEqual({
        'fill-color': 'rgba(0,0,0,0.25)',
        'fill-outline-color': 'rgb(0,0,0)',
      })
    });

    test('Prefers user-provided custom attribution over all other attribution strings.', async () => {
      const layer = new FeatureLayer({
        itemId: itemIdTrails,
        attribution: 'User-provided attribution.'
      });

      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();

      expect(layer._sources['Trails_0'].attribution).toBe('User-provided attribution.')
    });
    test('Prefers attribution information of the item ID over the service URL.', async () => {
      const layer = new FeatureLayer({
        itemId: itemIdTrails
      });

      fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();

      expect(layer._sources['Trails_0'].attribution).toBe('Access information from item info.');
    });
    test('Prefers attribution from the layer URL over attribution from the service URL.', async () => {
      const layer = new FeatureLayer({
        url: serviceUrlTrails
      });

      fetchMock.once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
      await layer.initialize();
      expect(layer._sources['Trails_0'].attribution).toBe('Copyright text from layer info.');
    });
    test('Uses attribution from the service URL if nothing else is present.', async () => {
      const layer = new FeatureLayer({
        url: serviceUrlTrails
      });

      const emptyCopyrightLayerInfo = JSON.stringify({
        ...trailsLayerInfoRaw,
        copyrightText: null
      })
      fetchMock.once(trailsServiceInfo).once(emptyCopyrightLayerInfo).once(trailsDataCountOnly).once(emptyCopyrightLayerInfo).once(trailsDataTruncated);
      await layer.initialize();
      expect(layer._sources['Trails_0'].attribution).toBe('Copyright text from service info.');
    });
  });

  test('Creates a layer from item ID with the `fromPortalItem` static method.', async () => {
    fetchMock.once(trailsItemInfo).once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
    const layer = await FeatureLayer.fromPortalItem(itemIdTrails);
    expect(layer.source.data).toEqual(trailsDataRaw);
  });
  test('Creates a layer from service URL with the `fromUrl` static method.', async () => {
    // From service URL
    fetchMock.once(trailsServiceInfo).once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
    const layer = await FeatureLayer.fromUrl(serviceUrlTrails);
    expect(layer.source.data).toEqual(trailsDataRaw);

    // From layer URL
    fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsData);
    const layer2 = await FeatureLayer.fromUrl(layerUrlTrails);
    expect(layer.source.data).toEqual(trailsDataRaw);
  });

  describe('Methods inherited from HostedLayer work properly.', () => {
    test('`layer`, `layers, `source`, `sources`, `sourceId` are read-only properties containing style data.', ({trailsLayer}) => {
      expect(trailsLayer.layer).toBe(trailsLayer._layers[0]);
      expect(trailsLayer.layers).toBe(trailsLayer._layers);

      expect(trailsLayer.sources).toBe(trailsLayer._sources);
      expect(trailsLayer.sourceId).toBe(Object.keys(trailsLayer._sources)[0]);
      expect(trailsLayer.source).toBe(trailsLayer._sources[Object.keys(trailsLayer._sources)[0]]);
    });
    test('`copyLayer` and `copySource` create deep copies of style data.', ({trailsLayer}) => {
      const sourceCopy = trailsLayer.copySource(trailsLayer.sourceId);
      expect(sourceCopy).not.toBe(trailsLayer.source);
      expect(sourceCopy).toEqual(trailsLayer.source);

      const layerCopy = trailsLayer.copyLayer(trailsLayer.layer.id);
      expect(layerCopy).not.toBe(trailsLayer.layer);
      expect(layerCopy).toEqual(trailsLayer.layer);
    });
    test('`setSourceId` changes the source ID of the specified source and updates all layers.', ({trailsLayer}) => {
      const customId = 'customSourceId';
      trailsLayer.setSourceId(trailsLayer.sourceId, customId);

      expect(trailsLayer.sourceId).toBe(customId);
      expect(trailsLayer.sources[customId]).toBe(trailsLayer.source);

      expect(trailsLayer.layer.source).toBe(customId);
    });
    test('`setAttribution` sets the attribution of the specified source.', ({trailsLayer}) => {
      const customAttribution = 'User-provided custom attribution.';
      trailsLayer.setAttribution(trailsLayer.sourceId,customAttribution);

      expect(trailsLayer.source.attribution).toBe(customAttribution);
    });
  });
});

describe('Works on a mock page with a `Map`',() => {
  test('Uninitialized layers created using the constructor cannot be added to the map.', async ({setupPage})=>{
    const page = await setupPage('feature-layer.html');

    await page.waitForFunction(()=> window.map && window.featureLayer);

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesAndLayersTo(window.map);
      })
    }).rejects.toThrowError('Cannot add sources and layers to map: Layer is not loaded.');

    await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addSourcesTo(window.map);
      })
    }).rejects.toThrowError('Cannot add sources to map: Layer is not loaded.');

        await expect(async () => {
      await page.evaluate(() => {
        window.featureLayer.addLayersTo(window.map);
      })
    }).rejects.toThrowError('Cannot add layers to map: Layer is not loaded.');
  });

  test('`addSourcesTo` and `addLayersTo` add source and layers to the maplibre map.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(()=>window.map && window.featureLayer);

    const {style} = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesTo(window.map);
      window.featureLayer.addLayersTo(window.map);

      return await new Promise(resolve => {
        window.map.on("load", ()=> {
          resolve({
            style: window.map.getStyle()
          })
        });
      });
    });
    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(trailsDataRaw);

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);
  });
  test('`addSourcesAndLayersTo` adds sources and layers to the maplibre map.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(()=>window.map && window.featureLayer);

    const {style} = await page.evaluate(async () => {
      await window.featureLayer.initialize();
      window.featureLayer.addSourcesAndLayersTo(window.map);

      return await new Promise(resolve => {
        window.map.on("load", ()=> {
          resolve({
            style: window.map.getStyle()
          });
        });
      });
    });
    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(trailsDataRaw);

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);
  });
  test('Works with native maplibre `addSource` and `addLayer` methods.', async ({setupPage}) => {
    const page = await setupPage('feature-layer.html');
    await page.waitForFunction(() => window.map && window.featureLayer);

    const {style} = await page.evaluate(async () => {
      await window.featureLayer.initialize();

      window.map.addSource(window.featureLayer.sourceId, window.featureLayer.source);
      window.map.addLayer(window.featureLayer.layer);

      return new Promise(resolve => {
        window.map.on('load',()=>{
          resolve({
            style: window.map.getStyle()
          });
        });
      });
    });

    expect(Object.keys(style.sources).length).toBe(1);
    expect(style.sources[Object.keys(style.sources)[0]].data).toEqual(trailsDataRaw);

    expect(style.layers.length).toBe(1);
    expect(style.layers[0].source).toBe(Object.keys(style.sources)[0]);
  });

  // TODO fix this test
  /*
  test.only('Creates an Esri `AttributionControl when added to the map.', async ({setupPage, esriAttributionString}) => {
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
