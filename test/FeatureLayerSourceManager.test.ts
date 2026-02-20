//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
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
  })

  test('Requires a GeoJSONSource ID and a feature layer URL.', () => {
    expect(() => {
      const featureManager = new FeatureLayerSourceManager()
    }).toThrowError('Source manager requires the ID of a GeoJSONSource.');

    expect(() => {
      const featureManager = new FeatureLayerSourceManager(sourceId);
    }).toThrowError('Source manager requires the URL of a feature layer.');
  });


  test('onAdd event triggers the load function.', async ({ map }) => {

    const manager = new FeatureLayerSourceManager(sourceId, {
      url: trailsMock.layerUrl
    });

    const loadSpy = vi.spyOn(manager, 'load');

    manager.onAdd(map);
    expect(loadSpy).toHaveBeenCalled();
  });

  test('Load function fetches the layer definition if not provided in constructor', async () => {

    const manager = new FeatureLayerSourceManager(sourceId, {
      url: trailsMock.layerUrl
    });

    const layerDefinitionSpy = vi.spyOn(manager, '_getLayerDefinition').mockImplementation(() => {return trailsMock.layerDefinitionRaw});
    vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {return trailsMock.trailsDataTruncatedTaw});
    vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});
    await manager.load();

    expect(layerDefinitionSpy).toHaveBeenCalled();
    expect(manager.layerDefinition).toBe(trailsMock.layerDefinitionRaw);
  });

  test('Load function tries to load via snapshot mode initially', async () => {

    const manager = new FeatureLayerSourceManager(sourceId, {
      url: trailsMock.layerUrl,
      layerDefinition: trailsMock.layerDefinitionRaw
    });

    const snapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {return getBlankFc()});
    const onDemandSpy = vi.spyOn(manager, '_enableOnDemandLoading');
    const updateMapSpy = vi.spyOn(manager, '_updateSourceData').mockImplementation(() => {return true});
    await manager.load();

    expect(snapshotSpy).toHaveBeenCalled();
    expect(onDemandSpy).not.toHaveBeenCalled();
  });

  test.only('Load function falls back to on-demand loading if snapshot fails', async () => {
    const manager = new FeatureLayerSourceManager(sourceId, {
      url: trailsMock.layerUrl,
      layerDefinition: trailsMock.layerDefinitionRaw
    });

    const snapshotSpy = vi.spyOn(manager, '_loadFeatureSnapshot').mockImplementation(() => {throw new Error});

    vi.spyOn(manager, '_enableOnDemandLoading').mockImplementation(() => {return true});
    const onDemandSpy = vi.spyOn(manager, '_loadFeaturesOnDemand').mockImplementation(() => {return true});

    await manager.load();

    expect(snapshotSpy).toThrowError();
    expect(onDemandSpy).toHaveBeenCalled();
  });

  describe('Snapshot mode loading tests', async () => {
    test('Uses snapshot loading for queries below the limit.', () => {

    });
  });

  describe('On-demand loading tests', () => {

    test('On-demand loading is triggered when the maplibre \'moveend\' event fires', () => {

    });

    test('On-demand loading fetches the zoom level of the current map and uses it to build an index', async () => {
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

    test('Intersects the service extent with the bounds of the current map to determine if the layer should render.', async () => {

    });

    test('Uses on-demand loading for queries above the limit.', () => {

    });
    test('Supports SQL queries for on-demand loading.', () => {});

    test('Uses the service extent to determine if the layer should load, if the service is in 4326.', () => {

    });

    test('If the service is in 3857, transforms the service extent to 4326 and uses it to determine loading', () => {

    });

    test('Sets the tolerance quantization parameter correctly to optimize loading.', () => {

    });

    test('Does not render features if the map scale is larger than the minScale of the service.', () => {
      // TODO
    });

    test('Does not render features if the map scale is smaller than the maxScale of the service.', () => {
      // TODO
    });
  });
});
