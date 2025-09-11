//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { VectorTileLayer } from '../src/VectorTileLayer';

describe('Vector tile layer tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Throws if neither an item ID nor service URL are provided.', () => {});
  test('Throws if the URL is invalid.', () => {});

  describe('Works with secure layers', () => {
    test('Accepts authentication as an access token string.', () => {});
    test('Accepts authentication as a REST JS object.', () => {});

    test('Loads a style from a secure item ID.',()=>{});
    test('Loads a style from a secure service URL', ()=>{});
    test('Adds authentication to the style tile URLs, sprites, and glyphs.', () => {});
  });

  describe('Loads data from a service URL', () => {
    test('Accepts a service URL in the constructor.', () => {});
    test('Fetches the style from a service URL\'s default resource.', () => {});
    test('Fetches a style with a custom resource name.', () => {});
    test('Fetches service metadata, including the service name and attribution.', () => {});
  });

  describe('Loads data from an item ID', () => {
    test('Accepts an item ID in the constructor.', () => {});
    test('Prefers an item ID over a service URL if both are provided.', () => {});
    test('Fetches the style of an item ID from the item resources.', () => {});
    test('Prefers the correct style when multiple style resources are present.', () => {});
    test('Falls back to the style of the service URL if no style resource is found on the item.', () => {});
    test('Prefers the style of the item ID over the style of the service URL', () => {});

    test('Fetches item metadata, including the layer name and attribution.', () => {});
  });

  describe('Formats a style properly for use with MapLibre.', () => {
    test('Formats the source URL.', () => {});
    test('Creates a \'tiles\' property with information from the service.', () => {});
    test('Formats the source sprites.', () => {});
    test('Formats the source glyphs.', () => {});
    test('Fixes the `text-font` property of all layers if present.', () => {});

    test('Sets the `attribution` property of the source.', () => {});

    test('Prefers user-provided custom attribution over all other attribution strings.', () => {});
    test('Prefers attribution information of the item ID over the service URL.', () => {});
    test('Prefers attribution from the service URL over the existing attribution from the style.', () => {});

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
