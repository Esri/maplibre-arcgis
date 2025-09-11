//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { FeatureLayer } from '../src/FeatureLayer';

describe('Feature layer unit tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Throws if neither an item ID nor a url are provided.', () => {});
  test('Throws if the url is invalid.', () => {});

  describe('Works with secure layers', () => {
    test('Accepts a `token` parameter for authentication.', () => {});
    test('Accepts an `authentication` parameter for REST JS authentication.', () => {});
    test('Loads a style from a secure item ID.', () => {});
    test('Loads a style from a secure service URL.', () => {});
    test('Loads a style from a secure layer URL.', () => {});
  })

  describe('Supports a `query` parameter.', () => {
    test('Accepts a `query` parameter and uses the query when retrieving feature data.', () => {});
    test('Supports `query` with a service URL passed.', () => {});
    test('Supports `query` with an item ID passed.', () => {});
    test('Supports `query` with a feature service passed.', () => {});
  });

  describe('Supports layer creation using item IDs', ()=>{
    test('Accepts an `itemId` parameter in the constructor.', () => {});
    test('Prefers an item ID over a service URL if both are provided.', () => {});
    test('Accepts a `portalUrl` parameter for Enterprise items and loads the corresponding data correctly.', () => {});
    test('Gets item metadata including attribution, title, and description.', () => {});
    test('Saves the service URL from item info and loads data based on that.', () => {});
  });

  describe('Loads feature data from a service URL', ()=>{
    test('Accepts a `url` parameter in the constructor.', () => {});
    test('Recognizes if the url passed is a layer, or a service containing multiple layers.', () => {});
    test('Only loads the first layer if a feature service is passed, and logs a warning.', () => {
      // TODO this will change in the future if we bring back multilayer support
    });
    test('Requests layer info including layer name, geometry type, copyright text, and more.', () => {});
    test('Warns the user if they attempt to load layers with more than 2000 features.', () => {});
    test('Throws if the layer does not support the `exceedsLimit` statistic.', () => {});
    test('Queries all features in the layer using ArcGIS REST JS.', () => {});
  });

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

  test('Displays layer attribution on the map.', () => {});
  test('Creates a layer from item ID with the `fromPortalItem` static method.', () => {});
  test('Creates a layer from service URL with the `fromUrl` static method.', () => {});
  test('Uninitialized layers created using the constructor cannot be added to the map.', ()=>{});
  test('Loads style data on an uninitialized layer using the `initialize()` method.', () => {});

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
