//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { BasemapStyle } from '../src/MaplibreArcGIS';
import { customTest as test } from './BaseTest';
import basemapStyleNavigationRaw from './mock/BasemapStyle/ArcGISNavigation.json';
import basemapStyleStreetsRaw from './mock/BasemapStyle/OpenStreets.json';
import { tokenError } from './mock/authentication/invalidTokenError';
import { Map } from 'maplibre-gl';
import { useMock, removeMock } from './setupUnit';

const basemapStyleNavigation = JSON.stringify(basemapStyleNavigationRaw);
const basemapStyleStreets = JSON.stringify(basemapStyleStreetsRaw);

const arcgisStyle = 'arcgis/navigation';
const imageryStyle = 'arcgis/imagery';
const openStyle = 'open/streets';

const customAttributionString = 'Internal distribution. For unit tests.'
const esriAttributionString = 'Powered by \<a href=\"https:\/\/www.esri.com\/\"\>Esri\<\/a\>';

const DEFAULT_BASE_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';

/**
 * Tests
 */
describe('BasemapStyle unit tests', () => {
  beforeAll(async () => {
    useMock();
    return () => {
      removeMock();
    }
  });
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Accepts a \'style\' parameter and saves it internally.', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      token: apiKey,
    });
    expect(basemap.styleId).toBe(arcgisStyle);
    expect(basemap._styleUrl).toContain(arcgisStyle);
  });

  test('Throws if no \'style\' is provided', () => {
    expect(() => {
      return new BasemapStyle({});
    }).toThrow('BasemapStyle must be created with a style name, such as \'arcgis/imagery\' or \'open/streets\'.');
  });

  test('Throws if no authentication is provided.', () => {
    expect(() => {
      return new BasemapStyle({
        style: arcgisStyle
      })
    }).toThrow('https://developers.arcgis.com/documentation/security-and-authentication/get-started/');
  });

  test('Accepts an ArcGIS access token in the `token` parameter and uses it in requests.', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      token: apiKey
    });
    expect(basemap._token).toBe(apiKey);
    expect(basemap._styleUrl).toContain(apiKey);
  });
  /*
  test('Accepts an ArcGIS REST JS authentication manager and uses the access token in requests.', ({restJsAuthentication}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      authentication: restJsAuthentication
    });
    expect(basemap._token).toBe(restJsAuthentication.token);
    expect(basemap._styleUrl).toContain(restJsAuthentication.token);
  });
  */

  test('Accepts a private \'baseUrl\' param for dev server testing.', ({apiKey}) => {
    const DEV_URL = 'https://DEVELOPMENT_URL';
    const basemap = new BasemapStyle({
      style:arcgisStyle,
      token:apiKey,
      baseUrl:DEV_URL
    });

    expect(basemap._baseUrl).toBe(DEV_URL);
    expect(basemap._styleUrl).toContain(DEV_URL);
  });

  test('Accepts a `language` preference and adds that to the basemap style', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      token: apiKey,
      preferences: {
        language: 'ja'
      }
    });

    expect(basemap.preferences.language).toBe('ja');
    expect(basemap._styleUrl).toContain('language=ja');
  });

  test('Accepts a `places` preference and adds that to the basemap style', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      token: apiKey,
      preferences: {
        places: 'all'
      }
    });

    expect(basemap.preferences.places).toBe('all');
    expect(basemap._styleUrl).toContain('places=all');
  });

  test('Accepts a `worldview` preference and adds that to the basemap style', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      token: apiKey,
      preferences: {
        worldview: 'unitedStatesOfAmerica'
      }
    });

    expect(basemap.preferences.worldview).toBe('unitedStatesOfAmerica');
    expect(basemap._styleUrl).toContain('worldview=unitedStatesOfAmerica');
  });

  test('Emits a BasemapStyleError event when a loading error occurs.', async () => {
    const basemap = new BasemapStyle({
      style:arcgisStyle,
      token:'my key that expired'
    });
    fetchMock.once(tokenError);
    basemap.loadStyle();

    async function eventTriggers(eventName) {
      return new Promise((resolve,reject) => {
          basemap.on(eventName,(e)=>{
          reject(e)});
      })
    }
    const eventTriggersSpy = vi.fn(eventTriggers);

    await expect(() => eventTriggersSpy('BasemapStyleError')).rejects.toThrowError();
  });

  test('Fires a BasemapStyleLoad event when the style loads.', async ({apiKey}) => {
    const basemap = new BasemapStyle({
      style:arcgisStyle,
      token:apiKey
    });
    fetchMock.once(basemapStyleNavigation);
    basemap.loadStyle();

    const loadEventSpy = vi.fn(async () => {return new Promise(resolve => {
      basemap.on('BasemapStyleLoad', basemap => resolve(basemap));
    })})
    const style = await loadEventSpy();
    expect(style).toBe(basemap);
  });

  test('Supports a static `url()` method that returns a formatted style URL.', ({apiKey}) => {
    const styleUrl = BasemapStyle.url({
      style:arcgisStyle,
      token:apiKey
    });
    expect(styleUrl).toContain(DEFAULT_BASE_URL);
    expect(styleUrl).toContain(arcgisStyle);
    expect(styleUrl).toContain(`token=${apiKey}`);
  });

  describe('Handles map attribution properly', () => {
    test('Adds \"Powered by Esri\" to the map attribution if not already present.', ({apiKey, map}) => {
      fetchMock.once(basemapStyleNavigation).mockResponse(JSON.stringify({}));
      const basemap = BasemapStyle.applyStyle(map,{
        style:'arcgis/navigation',
        token: apiKey
      });

      setTimeout(() => {
        expect(map._controls[0].options.customAttribution).toMatch(esriAttributionString);
      },1000)
    });

    test('Accepts custom attribution and applies it to the map.', ({apiKey, map}) => {
      fetchMock.once(basemapStyleNavigation).mockResponse(JSON.stringify({}));
      const basemap = BasemapStyle.applyStyle(map,{
        style:'arcgis/navigation',
        token: apiKey,
        attributionControl: {
          customAttribution: customAttributionString
        }
      });

      setTimeout(()=>{
        expect(map._controls[0].options.customAttribution).toMatch(customAttributionString);
      },1500)
    });

    test('Does not overwrite map attribution and throws an error if custom attribution is present.', ({apiKey, loadedBasemap}) => {
      const mapDiv = document.createElement('div');
      const map = new Map({
        container: mapDiv,
        zoom: 5, // starting zoom
        center: [138.2529, 36.2048], // starting location
        attributionControl: {
          customAttribution: customAttributionString
        }
      });

      fetchMock.mockResponse(JSON.stringify({}));
      expect(() => {
        loadedBasemap.applyTo(map);
      }).toThrow('Unable to load Esri attribution');
    });

    test('Fires a BasemapAttributionLoad event when the attribution loads.', async ({apiKey}) => {
      // TODO
    });
  });

  describe('Works with a mocked \'Map\'.', () => {
    test('Allows updating the saved Map with `setMap`.', ({apiKey, map}) => {
      const basemap = new BasemapStyle({
        style:arcgisStyle,
        token:apiKey
      });

      basemap.setMap(map);
      expect(basemap._map).toBe(map);
    });

    test('Applies the loaded style to the map with `applyTo`', async ({apiKey, loadedBasemap, map}) => {
      loadedBasemap.applyTo(map);

      expect(loadedBasemap._map).toBe(map);

      // TODO Map events do not fire properly -- why?
      const mapStyle = await new Promise(resolve => setTimeout(()=>resolve(map.getStyle()),500));

      expect(mapStyle.glyphs).toBe(loadedBasemap.style.glyphs);
      expect(mapStyle.sprite).toBe(loadedBasemap.style.sprite);
      expect(mapStyle.sources).toEqual(loadedBasemap.style.sources);

      expect(loadedBasemap.style).toMatchObject(mapStyle);
    });

    test('`applyTo` applies MapLibre style options such as `transformStyle`, and applies them to the map.', async ({apiKey, loadedBasemap, map}) => {
      const maplibreStyleOptions = {
        transformStyle: (oldStyleIfAny, newStyle) => ({
          ...newStyle,
          layers: [
            newStyle.layers[0]
          ]
        })
      }

      fetchMock.mockResponse(JSON.stringify({}));
      loadedBasemap.applyTo(map, maplibreStyleOptions);

      const mapStyle = await new Promise(resolve => setTimeout(()=>resolve(map.getStyle()),500));
      expect(mapStyle.layers.length).toBe(1);
    });

    test('`applyStyle` factory method creates and loads a basemap, then applies it to a map with applyTo.', async ({apiKey, map}) => {
      fetchMock.once(basemapStyleNavigation).mockResponse(JSON.stringify({}));

      const basemap = BasemapStyle.applyStyle(map, {
        style:'arcgis/navigation',
        token: apiKey
      });
      const applyToSpy = vi.spyOn(basemap, 'applyTo');

      const mapStyle = await new Promise(resolve => setTimeout(()=>resolve(map.getStyle()),500));
      expect(basemap.style).toMatchObject(mapStyle);
      expect(applyToSpy).toBeCalled();
    });

    test('`updateStyle` changes the map style after a style already exists.', async ({apiKey, loadedBasemap, map}) => {
      fetchMock.mockResponse(JSON.stringify({}));
      loadedBasemap.applyTo(map);

      setTimeout(async () => {
        fetchMock.once(basemapStyleStreets);
        loadedBasemap.updateStyle({
          style:'open/streets'
        });

        const mapStyle = await new Promise(resolve => setTimeout(()=>resolve(map.getStyle()),500));
        expect(loadedBasemap.style).toMatchObject(mapStyle);
      },1000);
    });
  });

  describe('Works with actual data', () => {
    beforeAll(()=>{
      removeMock();
    });
    beforeEach(()=>{
      fetchMock.resetMocks();
      fetchMock.dontMock();
    });
    test('Supports a static `getSelf() operation that makes a `/self` request to the service URL.', async ({apiKey}) => {
      const serviceResponse = await BasemapStyle.getSelf({
        token: apiKey
      });

      expect(serviceResponse.styles).toBeDefined();
      expect(serviceResponse.languages).toBeDefined();
      expect(serviceResponse.places).toBeDefined();
      expect(serviceResponse.worldviews).toBeDefined();
      expect(serviceResponse.styleFamilies).toBeDefined();
    });

  });
});

/*
describe('Supports basemap session authentication.', () => {
  beforeAll(async () => {
    const defaultBasemapSession = await BasemapSession.start({
      styleFamily: 'arcgis',
      token: apiKey
    });
  });

  test('Accepts a BasemapSession in the `session` parameter and uses the session token in requests.', () => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession
    });
    expect(basemap.token).toBe(basemapSession.token);
  });

  test('Prioritizes a basemap `session` over an API key', ({apiKey}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession,
      token: apiKey
    });
    expect(basemap.token).toBe(basemapSession.token);
  });

  test('Prioritizes a basemap `session` over REST JS authentication', ({restJsAuthentication}) => {
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession,
      authentication: restJsAuthentication
    });
    expect(basemap.token).toBe(basemapSession.token);
  });

  test('Accepts a basemap session that is still initializing and resolves the promise before requesting style.', async ({apiKey}) => {
    // Not using await
    const basemapSession = BasemapSession.start({
      styleFamily:'arcgis',
      token:apiKey
    });

    const basemap = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession
    });

    await basemap.loadStyle();

    expect(basemap.style).toBeDefined();
    expect(basemap.token).toBe(basemap.session.token);
  });

  test('Updates the session token in map style whenever the session refreshes.', async () => {
    // TODO - requires map
  }, {
    timeout: 40000
  });
});
*/
