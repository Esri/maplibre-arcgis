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

  mockMap: async ({}, use) => {
    const mockMap = {
      getSource: vi.fn(() => ({
        setData: vi.fn()
      })),
      on: vi.fn(),
      off: vi.fn(),
    };
    await use(mockMap);
  }
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

    const loadSpy = vi.spyOn(manager, 'load').mockImplementation(vi.fn());

    manager.onAdd(map);
    expect(loadSpy).toHaveBeenCalled();
  });
  test('Adds a maplibre event listener that triggers loading when the correct source ID is added to map', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map:mockMap
    });

    const onAddSpy = vi.spyOn(manager, 'onAdd').mockImplementation(vi.fn());

    expect(mockMap.on).toHaveBeenCalledWith('sourcedataloading', manager._onAddEvent);

    // mock trigger event from maplibre map
    manager._onAddEvent({ sourceId: manager.geojsonSourceId });

    expect(onAddSpy).toHaveBeenCalled();
  });
  test('onAdd event removes the maplibre event listener trigger', async ({mockMap}) => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map:mockMap
    });

    const onAddSpy = vi.spyOn(manager, 'onAdd');
    const loadSpy = vi.spyOn(manager, 'load').mockImplementation(vi.fn());

    // mock trigger event from maplibre map
    manager._onAddEvent({ sourceId: manager.geojsonSourceId });

    expect(onAddSpy).toHaveBeenCalled();

    expect(mockMap.off).toHaveBeenCalledWith('sourcedataloading', manager._onAddEvent);
  });

  test('Throws if load is called directly without providing a map.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    try {
      await manager.load();
    }
    catch (err) {
      expect(err.message).toBe('Feature service loading requires a map.')
    }
  });

  test('Accepts a layer definition in the constructor', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {});

    expect(manager.layerDefinition).toBe(trailsMock.layerDefinitionRaw);
  });

  test('Load function tries to load via snapshot mode initially', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map: mockMap
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const snapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => getBlankFc());
    const bindEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent');
    const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => true);
    await manager.load();

    expect(snapshotSpy).toHaveBeenCalled();
    expect(bindEventSpy).not.toHaveBeenCalled();
  });

  test('Snapshot mode performs an initial exceedsLimit request using limit values specific to each geometry type.', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot'
    });
    manager.map = {};

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const loadFeatureSnapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {});
    const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => null);

    await manager.load();
    // check if exceeds limit was called with both args with the hardcoded geometry limits for the trails layer (polygon)
    expect(exceedsLimitSpy).toHaveBeenCalledWith(expect.objectContaining({}), { maxVertexCount:250000, maxRecordCount:8000 });
    expect(loadFeatureSnapshotSpy).toHaveBeenCalled();
    expect(updateMapSpy).toHaveBeenCalled();
  });

  test('Load function falls back to on-demand loading if the snapshot limit is exceeded.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map: mockMap
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => {});
    const onDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => {return true});

    await manager.load();
    expect(onDemandSpy).toHaveBeenCalled();
  });

  test('Load function falls back to on-demand loading if snapshot mode throws.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map: mockMap
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    const getMaxExtentFromLayerExtentSpy = vi.spyOn(manager, '_getMaxExtentFromLayerExtent').mockImplementation(() => null);
    const bindLoadFeaturesToMoveEndEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => null);
    const clearTilesSpy = vi.spyOn(manager, '_clearTiles').mockImplementation(() => null);
    const loadFeaturesOnDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => Promise.resolve(null));

    await manager.load();
    expect(getMaxExtentFromLayerExtentSpy).toHaveBeenCalled();
    expect(bindLoadFeaturesToMoveEndEventSpy).toHaveBeenCalled();
    expect(clearTilesSpy).toHaveBeenCalled();
    expect(loadFeaturesOnDemandSpy).toHaveBeenCalled();
  });

  test('If loadingMode parameter is set to snapshot, only tries snapshot mode and throws if limits are exceeded.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot',
      map: mockMap
    });
    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    try {
      await manager.load();
    } catch (err) {
      expect(err.message).toBe('Unable to load feature service using snapshot mode: Geometry limit exceeded.');
    }
  });

  test('If loadingMode parameter is set to ondemand, only tries on-demand mode.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'ondemand',
      map: mockMap
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => true);
    const useServiceBoundsSpy = vi.spyOn(manager, '_getMaxExtentFromLayerExtent').mockImplementation(() => null);
    const bindLoadFeaturesToMoveEndEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => null);
    const clearTilesSpy = vi.spyOn(manager, '_clearTiles').mockImplementation(() => null);
    const loadFeaturesOnDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => Promise.resolve(null));

    await manager.load();
    expect(useServiceBoundsSpy).toHaveBeenCalled();
    expect(bindLoadFeaturesToMoveEndEventSpy).toHaveBeenCalled();
    expect(clearTilesSpy).toHaveBeenCalled();
    expect(loadFeaturesOnDemandSpy).toHaveBeenCalled();
  });


  test('_updateSourceData sets the data of the parent feature layer internally.', async ({mockMap}) => {
    const setDataCallback = vi.fn();
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot',
      map: mockMap,
      callback: setDataCallback
    });

    expect(manager._setDataCallback).toBe(setDataCallback);

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const loadFeatureSnapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {});

    await manager.load();
    expect(setDataCallback).toHaveBeenCalled();

  });
  test('_updateSourceData sets the data of the source on the associated map.', async ({mockMap}) => {
    const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      loadingMode: 'snapshot',
      map: mockMap,
    });

    const exceedsLimitSpy = vi.spyOn(manager, '_checkIfExceedsLimit').mockImplementation(() => false);
    const loadFeatureSnapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {return {}});
    const updateSpy = vi.spyOn(manager, '_updateSourceData');

    await manager.load();
    expect(updateSpy).toHaveBeenCalledWith({}, mockMap);
    expect(mockMap.getSource).toHaveBeenCalledWith(manager.geojsonSourceId);
  });

  describe('Snapshot mode loading tests', async () => {
    const importedQueryFeatures = queryFeatures;
    const importedQueryAllFeatures = queryAllFeatures;
    afterAll(() => {
      queryAllFeatures = importedQueryAllFeatures;
      queryFeatures = importedQueryFeatures;
    });
    test('Loads data from a layer and uses it to update a MapLibre geojson source.', async ({mockMap}) => {

      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'snapshot'
      });
      manager.map = mockMap;

      const updateDataSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});

      await manager.load();

      expect(updateDataSpy).toHaveBeenCalledWith(trailsMock.geoJSONSmallRaw, mockMap);
    });

    test('Passes authentication to all snapshot mode REST JS requests.', async ({mockMap}) => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);
      const apiKey = "fake-api-key";

      const apiKeyManager = { getToken: () => apiKey };
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        authentication: apiKeyManager,
        loadingMode: 'snapshot',
        map: mockMap
      });

      const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});

      await manager.load();

      expect(queryFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({authentication:apiKeyManager}));
    });

    test('Passes the `query` parameter to snapshot REST JS requests.', async ({mockMap}) => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      queryFeatures = vi.fn().mockResolvedValue(trailsMock.exceedsLimitResponseRaw);

      const trailQuery = {
        outFields: ['TRL_ID', 'ELEV_MIN', 'ELEV_MAX'],
        where: 'ELEV_MIN > 2000'
      }

      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        queryOptions: trailQuery,
        map: mockMap
      });

      expect(manager._options.queryOptions).toEqual(trailQuery);

      const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});
      await manager.load();

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
      await manager._getTile({}, 1, new AbortController().signal);
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({ where: whereClause }));
    });

    test('Passes quantizationParameters when using on-demand loading', async () => {
      // Use a realistic tile
      const tile = [0, 6, 6]; // z=6 tile, x=0, y=6
      const bbox = [-180, 80.17871349622823, -174.375, 81.09321385260839];
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);

      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });

      const tileExtent = {
        spatialReference: {
          latestWkid: 4326,
          wkid: 4326,
        },
        xmin: bbox[0],
        ymin: bbox[1],
        xmax: bbox[2],
        ymax: bbox[3],
      };
      const tolerance = manager._calculateTolerance(6);

      manager._getTile(tile, tolerance, new AbortController().signal);
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({
        quantizationParameters: JSON.stringify({
          extent: tileExtent,
          mode: 'view',
          tolerance: tolerance
        })
      }));
    });

    test('Passes abort signal and suppressWarnings to on-demand tile requests.', async () => {
      queryAllFeatures = vi.fn().mockResolvedValue(trailsMock.geoJSONSmallRaw);
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });

      const signal = new AbortController().signal;
      await manager._getTile([0, 6, 6], manager._calculateTolerance(6), signal);

      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({
        signal,
        suppressWarnings: true
      }));
    });

    test('Ignores stale tile responses and only commits the latest on-demand request.', async ({ mockMap }) => {
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand',
        map: mockMap,
      });

      manager._onDemandSettings = {
        maxTolerance: 156543,
        staticZoomLevel: 7,
        minZoom: 0,
        maxZoom: 23,
      };

      mockMap.getBounds = vi.fn(() => ({
        toArray: () => [[0, 0], [1, 1]],
      }));
      mockMap.getZoom = vi.fn(() => 6);

      const tile = [0, 6, 6];
      const fc = getBlankFc();
      const updateSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => undefined);
      vi.spyOn(manager, '_getTilesInViewAtZoomLevel').mockReturnValue([tile]);
      vi.spyOn(manager, '_getTilesToRequest').mockReturnValue([tile]);

      const commitSpy = vi.spyOn(manager, '_commitTileResultsToCache');

      let resolveFirst;
      let resolveSecond;
      let requestCount = 0;
      vi.spyOn(manager, '_loadTiles').mockImplementation(() => {
        requestCount += 1;
        if (requestCount === 1) {
          return new Promise((resolve) => {
            resolveFirst = resolve;
          });
        }
        return new Promise((resolve) => {
          resolveSecond = resolve;
        });
      });

      const firstRequest = manager._loadFeaturesOnDemand();
      const secondRequest = manager._loadFeaturesOnDemand();

      resolveSecond([fc]);
      await secondRequest;

      resolveFirst([fc]);
      await firstRequest;

      expect(commitSpy).toHaveBeenCalledTimes(1);
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    describe('_loadFeaturesOnDemand error handling', () => {
      test('catches feature limit exceeded errors and logs an abort message.', async ({ mockMap }) => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand',
          map: mockMap,
        });

        manager._onDemandSettings = {
          maxTolerance: 156543,
          staticZoomLevel: 7,
          minZoom: 0,
          maxZoom: 23,
        };

        mockMap.getBounds = vi.fn(() => ({
          toArray: () => [[0, 0], [1, 1]],
        }));
        mockMap.getZoom = vi.fn(() => 6);

        const tiles = [[0, 6, 6], [1, 6, 6]];
        const overLimitFeatureCount = 200001;
        const fcA = { type: 'FeatureCollection', features: new Array(overLimitFeatureCount) };
        const fcB = { type: 'FeatureCollection', features: new Array(overLimitFeatureCount) };

        vi.spyOn(manager, '_getTilesInViewAtZoomLevel').mockReturnValue(tiles);
        vi.spyOn(manager, '_getTilesToRequest').mockReturnValue(tiles);
        vi.spyOn(manager, '_getTile')
          .mockResolvedValueOnce(fcA)
          .mockResolvedValueOnce(fcB);

        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        await expect(manager._loadFeaturesOnDemand()).resolves.toBeUndefined();

        expect(consoleSpy).toHaveBeenCalledWith(
          'Tile request aborted: feature limit exceeded',
          1,
          {
            maxFeatureCount: 400000,
            attemptedFeatureCount: 400002,
          }
        );
      });

      test('catches AbortError and logs message.', async ({ mockMap }) => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand',
          map: mockMap,
        });

        manager._onDemandSettings = {
          maxTolerance: 156543,
          staticZoomLevel: 7,
          minZoom: 0,
          maxZoom: 23,
        };

        mockMap.getBounds = vi.fn(() => ({
          toArray: () => [[0, 0], [1, 1]],
        }));
        mockMap.getZoom = vi.fn(() => 6);

        const tile = [0, 6, 6];
        vi.spyOn(manager, '_getTilesInViewAtZoomLevel').mockReturnValue([tile]);
        vi.spyOn(manager, '_getTilesToRequest').mockReturnValue([tile]);

        const abortError = new Error('Request aborted');
        abortError.name = 'AbortError';
        vi.spyOn(manager, '_loadTiles').mockRejectedValue(abortError);

        const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

        await expect(manager._loadFeaturesOnDemand()).resolves.toBeUndefined();

        expect(consoleSpy).toHaveBeenCalledWith('Tile request aborted', 1);
      });

      test('rethrows unexpected errors.', async ({ mockMap }) => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand',
          map: mockMap,
        });

        manager._onDemandSettings = {
          maxTolerance: 156543,
          staticZoomLevel: 7,
          minZoom: 0,
          maxZoom: 23,
        };

        mockMap.getBounds = vi.fn(() => ({
          toArray: () => [[0, 0], [1, 1]],
        }));
        mockMap.getZoom = vi.fn(() => 6);

        const tile = [0, 6, 6];
        vi.spyOn(manager, '_getTilesInViewAtZoomLevel').mockReturnValue([tile]);
        vi.spyOn(manager, '_getTilesToRequest').mockReturnValue([tile]);

        const unexpectedError = new Error('Unexpected request failure');
        vi.spyOn(manager, '_loadTiles').mockRejectedValue(unexpectedError);

        await expect(manager._loadFeaturesOnDemand()).rejects.toThrow('Unexpected request failure');
      });
    });

    describe('_loadTiles', () => {
      test('requests each tile and returns all feature collections.', async () => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand'
        });

        const abortSignal = new AbortController().signal;
        const tolerance = 0.5;
        const tiles = [[0, 6, 6], [1, 6, 6]];
        const fcA = { type: 'FeatureCollection', features: [{ id: 1 }] };
        const fcB = { type: 'FeatureCollection', features: [{ id: 2 }, { id: 3 }] };

        const getTileSpy = vi.spyOn(manager, '_getTile')
          .mockResolvedValueOnce(fcA)
          .mockResolvedValueOnce(fcB);

        const result = await manager._loadTiles(tiles, tolerance, abortSignal);

        expect(getTileSpy).toHaveBeenCalledTimes(2);
        expect(getTileSpy).toHaveBeenNthCalledWith(1, tiles[0], tolerance, abortSignal);
        expect(getTileSpy).toHaveBeenNthCalledWith(2, tiles[1], tolerance, abortSignal);
        expect(result).toEqual([fcA, fcB]);
      });

      test('throws when aggregated feature count exceeds the total memory limit.', async () => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand'
        });

        const abortSignal = new AbortController().signal;
        const tolerance = 0.5;
        const tiles = [[0, 6, 6], [1, 6, 6]];
        const overLimitFeatureCount = 200001;
        // init two feature collections that will exceed the high watermark when combined
        const fcA = { type: 'FeatureCollection', features: new Array(overLimitFeatureCount) };
        const fcB = { type: 'FeatureCollection', features: new Array(overLimitFeatureCount) };

        vi.spyOn(manager, '_getTile')
          .mockResolvedValueOnce(fcA)
          .mockResolvedValueOnce(fcB);

        await expect(manager._loadTiles(tiles, tolerance, abortSignal)).rejects.toMatchObject({
          name: 'FeatureCountLimitExceededError',
          maxFeatureCount: 400000,
          attemptedFeatureCount: 400002,
        });
      });
    });

    test('Returns undefined for unsupported layer extent spatial references.', () => {
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });

      const extent = manager._getMaxExtentFromLayerExtent({
        xmin: 0,
        ymin: 0,
        xmax: 1,
        ymax: 1,
        spatialReference: {
          wkid: 9999,
        },
      });

      expect(extent).toBeUndefined();
    });

    test('Supports 102100 extent conversion to WGS84 bounds.', () => {
      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });

      const extent = manager._getMaxExtentFromLayerExtent({
        xmin: -20037508.342789244,
        ymin: -20037508.342789244,
        xmax: 20037508.342789244,
        ymax: 20037508.342789244,
        spatialReference: {
          wkid: 102100,
        },
      });

      expect(extent[0]).toBeCloseTo(-180, 5);
      expect(extent[2]).toBeCloseTo(180, 5);
      expect(extent[1]).toBeCloseTo(-85.0511, 3);
      expect(extent[3]).toBeCloseTo(85.0511, 3);
    });

    test('Sets the tolerance quantization parameter in units of degrees based on the current zoom level.', async () => {
      const zoomLevel9 = 9;
      const zoomLevel6 = 6;
      const zoomLevel2 = 2;
      const expectedToleranceZoom9 = .0003515625;
      const expectedToleranceZoom6 = .0028125;
      const expectedToleranceZoom2 = .045;

      const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
        loadingMode: 'ondemand'
      });

      expect(manager._calculateTolerance(zoomLevel9)).toBe(expectedToleranceZoom9);
      expect(manager._calculateTolerance(zoomLevel6)).toBe(expectedToleranceZoom6);
      expect(manager._calculateTolerance(zoomLevel2)).toBe(expectedToleranceZoom2);
    });

    describe('cache pressure policy', () => {
      let manager;

      beforeEach(() => {
        manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
          loadingMode: 'ondemand'
        });
      });

      describe('_applyCachePressurePolicy', () => {
        test('does nothing when cache is below watermark.', () => {
          const isAboveWatermarkSpy = vi.spyOn(manager, '_isCacheAboveHighWatermark').mockReturnValue(false);
          const clearOutOfRangeSpy = vi.spyOn(manager, '_clearDataCacheOutOfZoomRange');
          const clearTilesSpy = vi.spyOn(manager, '_clearTiles');

          manager._applyCachePressurePolicy(6);

          expect(isAboveWatermarkSpy).toHaveBeenCalledTimes(1);
          expect(clearOutOfRangeSpy).not.toHaveBeenCalled();
          expect(clearTilesSpy).not.toHaveBeenCalled();
        });

        test('keeps current zoom cache only when stage 1 drops below watermark.', () => {
          const isAboveWatermarkSpy = vi.spyOn(manager, '_isCacheAboveHighWatermark')
            .mockReturnValueOnce(true)
            .mockReturnValueOnce(false);
          const clearOutOfRangeSpy = vi.spyOn(manager, '_clearDataCacheOutOfZoomRange');
          const clearTilesSpy = vi.spyOn(manager, '_clearTiles');

          manager._applyCachePressurePolicy(6);

          expect(isAboveWatermarkSpy).toHaveBeenCalledTimes(2);
          expect(clearOutOfRangeSpy).toHaveBeenCalledTimes(1);
          expect(clearOutOfRangeSpy).toHaveBeenCalledWith(6, 0);
          expect(clearTilesSpy).not.toHaveBeenCalled();
        });

        test('clears all cache when still above watermark after stage 1.', () => {
          const isAboveWatermarkSpy = vi.spyOn(manager, '_isCacheAboveHighWatermark').mockReturnValue(true);
          const clearOutOfRangeSpy = vi.spyOn(manager, '_clearDataCacheOutOfZoomRange');
          const clearTilesSpy = vi.spyOn(manager, '_clearTiles');

          manager._applyCachePressurePolicy(6);

          expect(isAboveWatermarkSpy).toHaveBeenCalledTimes(2);
          expect(clearOutOfRangeSpy).toHaveBeenCalledTimes(1);
          expect(clearOutOfRangeSpy).toHaveBeenCalledWith(6, 0);
          expect(clearTilesSpy).toHaveBeenCalledTimes(1);
        });
      });

      describe('_clearDataCacheOutOfZoomRange', () => {
        // Helper function to seed the cache with specific zoom levels.
        const seedCacheAtZoomLevels = (zoomLevels) => {
          manager._tileIndices = new globalThis.Map(
            zoomLevels.map((z) => [z, new globalThis.Map([[`ti-${z}`, true]])])
          );
          manager._featureIndices = new globalThis.Map(
            zoomLevels.map((z) => [z, new globalThis.Map([[`fi-${z}`, true]])])
          );
          manager._featureCollections = new globalThis.Map(
            zoomLevels.map((z) => [z, { type: 'FeatureCollection', features: [] }])
          );
        };

        test('default cache clears data beyond the default range of +-1.', () => {
          seedCacheAtZoomLevels([4, 5, 6, 7, 8]);

          manager._clearDataCacheOutOfZoomRange(6);

          expect(Array.from(manager._tileIndices.keys())).toEqual([5, 6, 7]);
          expect(Array.from(manager._featureIndices.keys())).toEqual([5, 6, 7]);
          expect(Array.from(manager._featureCollections.keys())).toEqual([5, 6, 7]);
        });

        // bad input: negative range will normalize to 0
        test('normalizes invalid number and caches only current zoom', () => {
          seedCacheAtZoomLevels([5, 6, 7]);

          manager._clearDataCacheOutOfZoomRange(6, -2);

          expect(Array.from(manager._tileIndices.keys())).toEqual([6]);
          expect(Array.from(manager._featureIndices.keys())).toEqual([6]);
          expect(Array.from(manager._featureCollections.keys())).toEqual([6]);
        });

        // bad input: decimal range values truncate to integer
        test('floors decimal range values before trimming.', () => {
          seedCacheAtZoomLevels([3, 4, 5, 6, 7, 8, 9]);

          manager._clearDataCacheOutOfZoomRange(6, 2.9);

          expect(Array.from(manager._tileIndices.keys())).toEqual([4, 5, 6, 7, 8]);
          expect(Array.from(manager._featureIndices.keys())).toEqual([4, 5, 6, 7, 8]);
          expect(Array.from(manager._featureCollections.keys())).toEqual([4, 5, 6, 7, 8]);
        });
      });
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
