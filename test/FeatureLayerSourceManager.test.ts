//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { customTest, featureMocks } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayerSourceManager } from '../src/FeatureLayerSourceManager';
import { queryFeatures, queryAllFeatures } from '@esri/arcgis-rest-feature-service';
import { Map, LngLatBounds, GeoJSONSource } from 'maplibre-gl';
import { getBlankFc } from '../src/Util';

const { multiLayerMock, trailsMock } = featureMocks;

// vi.mock('maplibre-gl', () => {
//   return {
//     Map: vi.fn(class {
//       constructor(options) {

//       }
//       getZoom() { return 6; }


//     })
//   }
// });

const test = customTest.extend({

  // mockMap: async ({}, use) => {
  //   const mapDiv = document.createElement('div');

  //   const MapSpy = vi.spyOn(maplibregl, 'Map');

  //   const map = new MapSpy({
  //     container: mapDiv,
  //     zoom: 5, // starting zoom
  //     center: [138.2529, 36.2048] // starting location
  //   });

  //   await use(map);
  // }
  // trailsLayer: async ({}, use)=> {
  //   const trailsLayer = new FeatureLayer({
  //     url: layerUrlTrails
  //   });
  //   fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
  //   await trailsLayer.initialize();

  //   await use(trailsLayer);
  // }
});

const sourceId = 'geojson-source';

describe('Feature layer data source tests', () => {

  beforeAll(async () => {
    useMock();
    return () => {
      removeMock();
    }
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Requires a GeoJSONSource ID and a feature layer URL.', () => {
    expect(() => {
      const featureManager = new FeatureLayerSourceManager()
    }).toThrowError('Source manager requires the ID of a GeoJSONSource.');

    expect(() => {
      const featureManager = new FeatureLayerSourceManager(sourceId);
    }).toThrowError('Source manager requires the URL of a feature layer.');

    expect(() => {
      const featureManager = new FeatureLayerSourceManager(sourceId, "url");
    }).toThrowError('Source manager requires a layer definition.');
  });

  test('Accepts a loadingMode parameter and saves it internally.', async () => {
    // TODO
  });

  test('onAdd event triggers the load function.', async ({ map }) => {

    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    const loadSpy = vi.spyOn(manager, '_load');

    manager.onAdd(map);
    expect(loadSpy).toHaveBeenCalled();
  });

  test('Accepts a layer definition in the constructor', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    expect(manager.layerDefinition).toBe(trailsMock.layerDefinitionRaw);
  });

  test('Load function tries to load via snapshot mode initially', async () => {

    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const snapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => getBlankFc());
    const bindEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent');
    const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => true);
    await manager._load();

    expect(snapshotSpy).toHaveBeenCalled();
    expect(bindEventSpy).not.toHaveBeenCalled();
  });

  test('Snapshot mode performs an initial exceedsLimit request using hardcoded values specific to each geometry type.', async () => {
    // TODO
  });

  test('Load function falls back to on-demand loading if the snapshot limit is exceeded.', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => {});
    const onDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => {return true});

    await manager._load();
    expect(onDemandSpy).toHaveBeenCalled();
  });

  test('Load function falls back to on-demand loading if snapshot mode throws.', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {})
  });

  test('If loadingMode parameter is set to snapshot, only tries snapshot mode and throws if limits are exceeded.', async () => {
    // TODO
  });
  test('If loadingMode parameter is set to ondemand, only tries on-demand mode.', async () => {
    // TODO
  });

  describe('Snapshot mode loading tests', async () => {
    const importedQueryFeatures = queryFeatures;
    const importedQueryAllFeatures = queryAllFeatures;
    afterAll(() => {
      queryAllFeatures = importedQueryAllFeatures;
      queryFeatures = importedQueryFeatures;
    });
    test('Loads data from a layer and uses it to update a MapLibre geojson source.', async () => {
      const mockMap = {
        getSource: vi.fn(() => ({
          setData: vi.fn()
        }))
      };
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'snapshot'
      });
      manager.map = mockMap;
      fetchMock.once(trailsMock.exceedsLimitResponseRaw).once(trailsMock.geoJSONSmall);

      const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});

      await manager._load();

      expect(updateMapSpy).toHaveBeenCalledWith(mockMap, trailsMock.geoJSONSmallRaw);
    });

    test('Passes authentication to all snapshot mode REST JS requests.', async () => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);
      const apiKey = "fake-api-key";

      const apiKeyManager = { getToken: () => apiKey };
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        authentication: apiKeyManager,
        loadingMode: 'snapshot'
      });

      const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});

      await manager._load();

      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
    });

    test('Passes the `query` parameter to snapshot REST JS requests.', async () => {

      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);

      const trailQuery = {
        outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
        where: 'ELEV_MIN > 2000'
      }

      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        queryOptions: trailQuery
      });

      expect(manager._options.queryOptions).toEqual(trailQuery);

      const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});
      await manager._load();

      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining(trailQuery));
    });
  });

  describe('On-demand loading tests', () => {
    test('On-demand loading fetches the zoom level of the current map and uses it to build an index', async ({ map }) => {
      const getZoomSpy = vi.spyOn(map, 'getZoom').mockImplementation(() => 6);
      const getBoundsSpy = vi.spyOn(map, 'getBounds').mockImplementation(() => {
        return new LngLatBounds([0,0,0,0])
      });
      const maplibreSource: GeoJSONSource = {
        data: getBlankFc()
      };
      const getSourceSpy = vi.spyOn(map, 'getSource').mockImplementationOnce(() => {
        return maplibreSource;
      });
    });

    test('Passes SQL queries in the `where` clause for on-demand loading.', () => {
      // TODO
    });
    test('Passes quantizationParameters when using on-demand loading', () => {
      // TODO
    });
    test('Sets the tolerance quantization parameter in units of degrees based on the current zoom level.', () => {
      // TODO
    });

    // --- out of scope for rn
    // test('On-demand loading is triggered when the maplibre \'moveend\' event fires', () => {

    // });
    // test('Uses the service extent to determine if the layer should load, if the service is in 4326.', () => {

    // });
    // test('If the service is in 3857, transforms the service extent to 4326 and uses it to determine loading', () => {

    // });
  });
});
