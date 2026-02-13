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

});
