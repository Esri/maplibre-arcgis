//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest'
import { useMock, removeMock } from './setupUnit';
import { VectorTileLayer } from '../src/VectorTileLayer';

const itemIdUSA = '31eb749371c441e0b3ac5db4f60ecba9';
const serviceUrlParcels = 'https://vectortileservices3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Santa_Monica_Mountains_Parcels_VTL/VectorTileServer';

describe('Vector tile layer tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Throws if neither an item ID nor service URL are provided.', () => {
    // Empty options
    expect(() => {
      const vtl = new VectorTileLayer({});
    }).toThrowError('Vector tile layer requires either an \'itemId\' or \'url\'.');
    // No options
    expect(() => {
      const vtl = new VectorTileLayer();
    }).toThrowError('Vector tile layer requires either an \'itemId\' or \'url\'.');
  });

  describe('Works with authenticated layers', () => {
    test('Accepts authentication as a string via `token`.', ({apiKey}) => {
      const vtl = new VectorTileLayer({
        url: serviceUrlParcels,
        token: apiKey
      });
      expect(typeof vtl.authentication).toBe('string');
      expect(vtl.token).toBe(apiKey);
    });
    test('Accepts authentication as a REST JS object.', ({restJsAuthentication}) => {
      const vtl = new VectorTileLayer({
        url: serviceUrlParcels,
        authentication: restJsAuthentication
      });
      expect(typeof vtl.authentication).toBe('object');
      expect(vtl.token).toBe(restJsAuthentication.token);
    });

    // TODO
    test('Loads a style from a secure item ID.',()=>{});
    test('Loads a style from a secure service URL', ()=>{});
    test('Adds authentication to the style tile URLs, sprites, and glyphs.', () => {});
  });

  describe('Loads data from a service URL', () => {
    test('Accepts a service URL in the constructor and cleans the URL.', () => {
      const vtl = new VectorTileLayer({
        url: serviceUrlParcels
      });
      expect(vtl._inputType).toBe('VectorTileService');
      expect(vtl._serviceInfo).toEqual({
        serviceUrl: serviceUrlParcels + '/'
      })
    });
    test('Throws if the URL is not the URL of a vector tile service.', () => {
      // Not a URL
      expect(() => {
        const vtl = new VectorTileLayer({
          url: itemIdUSA
        });
      }).toThrowError('Argument `url` is not a valid vector tile service URL.');
      // Not a vector tile service
      expect(() => {
        const vtl = new VectorTileLayer({
          url: 'https://services3.arcgis.com/GVgbJbqm8hXASVYi/arcgis/rest/services/Trails/FeatureServer/'
        });
      }).toThrowError('Argument `url` is not a valid vector tile service URL.');
    });

    // TODO
    test('Fetches the style from a service URL\'s default resource.', () => {});
    test('Fetches a style with a custom resource name.', () => {});
    test('Fetches service metadata, including the service name and attribution.', () => {});
  });

  describe('Loads styles from an item ID', () => {
    test('Accepts an item ID and portal URL in the constructor, and the portal URL defaults to arcgis.com.', () => {
      const vtl = new VectorTileLayer({
        itemId: itemIdUSA
      });
      expect(vtl._inputType).toBe('ItemId');
      expect(vtl._itemInfo).toEqual({
        itemId: itemIdUSA,
        portalUrl: 'https://www.arcgis.com/sharing/rest'
      });

      // Custom portal URL
      const vtl2 = new VectorTileLayer({
        itemId: itemIdUSA,
        portalUrl: 'https://my-evil-portal.com/items'
      });
      expect(vtl2._itemInfo).toEqual({
        itemId: itemIdUSA,
        portalUrl: 'https://my-evil-portal.com/items'
      });
    });
    test('Throws if the item ID format is invalid', () => {
      expect(() => {
        const vtl = new VectorTileLayer({
          itemId: 'random junk'
        });
      }).toThrowError('Argument `itemId` is not a valid item ID.')
    });
    test('Prefers an item ID over a service URL if both are provided.', () => {
      const warningSpy = vi.spyOn(console, 'warn');
      const vtl = new VectorTileLayer({
        itemId: itemIdUSA,
        url: serviceUrlParcels
      });
      expect(warningSpy).toHaveBeenCalledWith('Both an item ID and service URL have been passed. Only the item ID will be used.');
      expect(vtl._inputType).toBe('ItemId');
      expect(vtl._serviceInfo).toBeUndefined();
    });

    // TODO
    test('Fetches the style of an item ID from the item resources.', () => {});
    test('Prefers the correct style when multiple style resources are present.', () => {});
    test('Falls back to the style of the service URL if no style resource is found on the item.', () => {});
    test('Prefers the style of the item ID over the style of the service URL', () => {});

    test('Fetches item metadata, including the layer name and attribution.', () => {});
  });

  // TODO
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
