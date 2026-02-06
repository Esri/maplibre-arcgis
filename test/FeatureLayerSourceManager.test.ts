//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { customTest } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayerSourceManager } from '../src/FeatureLayerSourceManager';
import { queryFeatures, queryAllFeatures } from '@esri/arcgis-rest-feature-service';

const test = customTest.extend({
  // trailsLayer: async ({}, use)=> {
  //   const trailsLayer = new FeatureLayer({
  //     url: layerUrlTrails
  //   });
  //   fetchMock.once(trailsLayerInfo).once(trailsDataCountOnly).once(trailsLayerInfo).once(trailsDataTruncated);
  //   await trailsLayer.initialize();

  //   await use(trailsLayer);
  // }
});

const mockId = 'geojson-source';

describe('Feature layer data source tests', () => {

  test('Requires a GeoJSONSource ID and a feature layer URL.', () => {
    expect(() => {
      const featureManager = new FeatureLayerSourceManager()
    }).toThrowError('Source manager requires the ID of a GeoJSONSource.');

    expect(() => {
      const featureManager = new FeatureLayerSourceManager(mockId);
    }).toThrowError('Source manager requires the URL of a feature layer.');
  });


  test('Does not render features if the map scale is larger than the minScale of the service.', () => {
    // TODO
  });

  test('Does not render features if the map scale is smaller than the maxScale of the service.', () => {
    // TODO
  });

  test('Sets the tolerance quantization parameter correctly to optimize loading.', () => {

  });

  describe('Snapshot loading tests', () => {
    test('Uses snapshot loading for queries below the limit.', () => {

    });
  })
  describe('On-demand loading tests', () => {

    test('Uses on-demand loading for queries above the limit.', () => {

    });
    test('Supports SQL queries for on-demand loading.');
  });

});
