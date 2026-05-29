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
    manager._triggerOnAdd({sourceId:manager.geojsonSourceId}, manager.geojsonSourceId);

    expect(onAddSpy).toHaveBeenCalled();
  });
  test('onAdd event removes the maplibre event listener trigger', async ({mockMap}) => {
        const manager = new FeatureLayerSourceManager(sourceId, trailsMock.layerUrl, trailsMock.layerDefinitionRaw, {
      map:mockMap
    });

    const onAddSpy = vi.spyOn(manager, 'onAdd');
    const loadSpy = vi.spyOn(manager, 'load').mockImplementation(vi.fn());

    // mock trigger event from maplibre map
    manager._triggerOnAdd({sourceId:manager.geojsonSourceId}, manager.geojsonSourceId);

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
    const setMaxExtentFromLayerExtentSpy = vi.spyOn(manager, '_setMaxExtentFromLayerExtent').mockImplementation(() => null);
    const bindLoadFeaturesToMoveEndEventSpy = vi.spyOn(manager, '_bindLoadFeaturesToMoveEndEvent').mockImplementation(() => null);
    const clearTilesSpy = vi.spyOn(manager, '_clearTiles').mockImplementation(() => null);
    const loadFeaturesOnDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => Promise.resolve(null));

    await manager.load();
    expect(setMaxExtentFromLayerExtentSpy).toHaveBeenCalled();
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
    const useServiceBoundsSpy = vi.spyOn(manager, '_setMaxExtentFromLayerExtent').mockImplementation(() => null);
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
      await manager._getTile({}, 1);
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

      manager._getTile(tile, tolerance);
      expect(queryAllFeatures).toHaveBeenCalledWith(expect.objectContaining({
        quantizationParameters: JSON.stringify({
          extent: tileExtent,
          mode: 'view',
          tolerance: tolerance
        })
      }));
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

    // --- out of scope for rn
    // test('On-demand loading is triggered when the maplibre \'moveend\' event fires', () => {

    // });
    // test('Uses the service extent to determine if the layer should load, if the service is in 4326.', () => {

    // });
    // test('If the service is in 3857, transforms the service extent to 4326 and uses it to determine loading', () => {
    // });
  });
});
