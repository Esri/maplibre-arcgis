//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayer } from '../src/FeatureLayer';

const layerUrlTrails = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/0';
const serviceUrlTrails = 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer'
const itemIdBeetles = '44299709cce447ea99014ff1e3bf8505'

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
    test('Accepts a `query` parameter and uses the query when retrieving feature data.', () => {});
    test('Supports `query` with a service URL passed.', () => {});
    test('Supports `query` with an item ID passed.', () => {});
    test('Supports `query` with a feature service passed.', () => {});
  });

  describe('Loads feature data from a service URL', ()=>{
    test('Accepts a service URL, cleans it, and recognizes if it\'s a single layer.', () => {
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

    // TODO re-examine this behavior
    test('Only loads the first layer if a feature service is passed, and logs a warning.', () => {

    });

    // TODO
    test('Requests layer info including layer name, geometry type, copyright text, and more.', () => {});
    test('Warns the user if they attempt to load layers with more than 2000 features.', () => {});
    test('Throws if the layer does not support the `exceedsLimit` statistic.', () => {});
    test('Queries all features in the layer using ArcGIS REST JS.', () => {});
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
    test('Accepts a `portalUrl` parameter for Enterprise items and loads the corresponding data correctly.', () => {});
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
