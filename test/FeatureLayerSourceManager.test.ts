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
    const featureManager = new FeatureLayerSourceManager(sourceId, "url", {}, {
      loadingMode: 'snapshot'
    });
    expect(featureManager._options.loadingMode).toBe('snapshot');
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
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot'
    });
    manager.map = {};

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const loadFeatureSnapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {});
    const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => null);

    await manager._load();
    // check if exceeds limit was called with both args with the hardcoded geometry limits for the trails layer (polygon)
    expect(exceedsLimitSpy).toHaveBeenCalledWith(expect.objectContaining({}), { maxVertexCount:250000, maxRecordCount:8000 });
    expect(loadFeatureSnapshotSpy).toHaveBeenCalled();
    expect(updateMapSpy).toHaveBeenCalled();
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
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    const setMaxExtentFromLayerExtentSpy = vi.spyOn(manager, '_setMaxExtentFromLayerExtent').mockImplementation(() => null);
    const bindLoadFeaturesToMoveEndEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => null);
    const clearTilesSpy = vi.spyOn(manager, '_clearTiles').mockImplementation(() => null);
    const loadFeaturesOnDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => Promise.resolve(null));

    await manager._load();
    expect(setMaxExtentFromLayerExtentSpy).toHaveBeenCalled();
    expect(bindLoadFeaturesToMoveEndEventSpy).toHaveBeenCalled();
    expect(clearTilesSpy).toHaveBeenCalled();
    expect(loadFeaturesOnDemandSpy).toHaveBeenCalled();
  });

  test('If loadingMode parameter is set to snapshot, only tries snapshot mode and throws if limits are exceeded.', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot'
    });
    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    try {
      await manager._load();
    } catch (err) {
      expect(err.message).toBe('Unable to load using snapshot mode: geometry limit exceeded.');
    }
  });

  test('If loadingMode parameter is set to ondemand, only tries on-demand mode.', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'ondemand'
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    const useServiceBoundsSpy = vi.spyOn(manager, '_setMaxExtentFromLayerExtent').mockImplementation(() => null);
    const bindLoadFeaturesToMoveEndEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => null);
    const clearTilesSpy = vi.spyOn(manager, '_clearTiles').mockImplementation(() => null);
    const loadFeaturesOnDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => Promise.resolve(null));

    await manager._load();
    expect(useServiceBoundsSpy).toHaveBeenCalled();
    expect(bindLoadFeaturesToMoveEndEventSpy).toHaveBeenCalled();
    expect(clearTilesSpy).toHaveBeenCalled();
    expect(loadFeaturesOnDemandSpy).toHaveBeenCalled();
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
    const importedQueryFeatures = queryFeatures;
    const importedQueryAllFeatures = queryAllFeatures;
    afterAll(() => {
      queryAllFeatures = importedQueryAllFeatures;
      queryFeatures = importedQueryFeatures;
    });
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

    test('Passes SQL queries in the `where` clause for on-demand loading.', async () => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      // Arrange
      const whereClause = 'ELEV_MIN > 2000';
      const queryOptions = { where: whereClause };
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        queryOptions,
        loadingMode: 'ondemand'
      });
      // where clause is accessed from global object and parsed in _getTile, so we check for accessibility and parsing.
      expect(manager._options.queryOptions.where).toBe(whereClause);
      await manager._getTile({}, 1);
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({ where: whereClause }));
    });

    test('Passes quantizationParameters when using on-demand loading', async () => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      // Arrange
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });
      manager.map = {
        getZoom: () => 7,
        getBounds: () => new LngLatBounds([0, 0, 1, 1]),
        getSource: () => ({ setData: vi.fn() }),
        on: vi.fn()
      };
      // Spy on _getTile to call through
      const originalGetTile = manager._getTile.bind(manager);
      vi.spyOn(manager, '_getTile').mockImplementation(async (tile, tolerance) => {
        return await originalGetTile(tile, tolerance);
      });
      // Act
      await manager._loadFeaturesOnDemand();
      // Assert
      const callArgs = queryAllFeaturesSpy.mock.calls[0][0];
      expect(callArgs.quantizationParameters).toBeDefined();
      expect(typeof callArgs.quantizationParameters).toBe('string');
      const qp = JSON.parse(callArgs.quantizationParameters);
      expect(qp).toHaveProperty('extent');
      expect(qp).toHaveProperty('mode', 'view');
      expect(qp).toHaveProperty('tolerance');
    });

    test('Sets the tolerance quantization parameter in units of degrees based on the current zoom level.', async () => {
      // Arrange
      const zoomLevel = 10;
      const expectedTolerance = 360 / Math.pow(2, zoomLevel + 1) / 1000;

      // Dummy map object
      const mockMap = {
        getZoom: () => zoomLevel,
        getBounds: () => ({
          toArray: () => [[0, 0], [1, 1]]
        }),
        getSource: () => ({ setData: vi.fn() }),
        on: vi.fn()
      };

      // Dummy tile and bbox
      const dummyTile = [0, 0, zoomLevel];
      const dummyBBox = [0, 0, 1, 1];

      // Spy on _getTile to intercept tolerance
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });
      manager.map = mockMap;

      // Replace _getTile to check tolerance
      let capturedTolerance = null;
      vi.spyOn(manager, '_getTile').mockImplementation(async (tile, tolerance) => {
        capturedTolerance = tolerance;
        // Simulate a response
        return { features: [], type: 'FeatureCollection' };
      });

      // Replace tile selection logic to use dummy tile
      vi.spyOn(manager, '_getTileIndexAtZoomLevel').mockReturnValue(new Map());
      vi.spyOn(manager, '_getFeatureIdIndexAtZoomLevel').mockReturnValue(new Map());
      vi.spyOn(manager, '_getFeatureCollectionAtZoomLevel').mockReturnValue({ features: [], type: 'FeatureCollection' });

      // Replace tile selection logic to always request dummyTile
      vi.spyOn(manager, '_doesTileOverlapBounds').mockReturnValue(true);

      // Act
      await manager._loadFeaturesOnDemand();

      // Assert
      expect(capturedTolerance).toBeCloseTo(expectedTolerance);
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
