//@ts-nocheck
import { describe, expect, vi, beforeAll } from 'vitest';
import { BasemapStyle } from '../src/MaplibreArcGIS';
import { useMock, removeMock, customTest as test } from './unitTest';

const arcgisStyle = 'arcgis/navigation';
const imageryStyle = 'arcgis/imagery';
const openStyle = 'open/streets';

const DEFAULT_BASE_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';




describe('Works with actual data', () => {
  test('Requests a JSON style from the correct service URL.', async ({apiKey}) => {
    const basemap = new BasemapStyle({
      style:arcgisStyle,
      token:apiKey
    });
    // Fetch actual data
    // TODO check URL here

    //await basemap.loadStyle();
  });
});

/**
 * Tests
 */
test('Requires a \'style\' parameter and saves it internally.', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
  });
  expect(basemap.styleId).toBe('arcgis/navigation');
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

test('Accepts an ArcGIS REST JS authentication manager and uses the access token in requests.', ({restJsAuthentication}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    authentication: restJsAuthentication
  });
  expect(basemap._token).toBe(restJsAuthentication.token);
  expect(basemap._styleUrl).toContain(restJsAuthentication.token);
});

test('Accepts a private \'baseUrl\' param for dev server testing.', ({apiKey}) => {
  const DEV_URL = 'https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
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
    language: 'ja'
  });

  expect(basemap.preferences.language).toBe('ja');
  expect(basemap._styleUrl).toContain('language=ja');
});

test('Accepts a `places` preference and adds that to the basemap style', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
    places: 'all'
  });

  expect(basemap.preferences.places).toBe('all');
  expect(basemap._styleUrl).toContain('places=all');
});

test('Accepts a `worldview` preference and adds that to the basemap style', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
    worldview: 'unitedStatesOfAmerica'
  });

  expect(basemap.preferences.worldview).toBe('unitedStatesOfAmerica');
  expect(basemap._styleUrl).toContain('worldview=unitedStatesOfAmerica');
});





test('Adds \"Powered by Esri\" to the map attribution if not already present.', () => {
  // TODO - requires map
});
test('Overwrites the default maplibre-gl attribution if there is any.', () => {
  // TODO - requires map
});
test('Does not overwrite map attribution and throws an error if custom attribution is present.', () => {
  // TODO - requires map
});


describe('Works with mocked data', () => {
  beforeAll(async () => {
    useMock();

    return () => {
      removeMock();
    }
  });

  test('Accepts custom attribution and applies it to the map.', ({map}) => {
    // TODO - requires map
  });

  test('Allows updating the associated Map with `setMap()`.', ({map, apiKey}) => {
    // TODO - requires map
    const basemap = new BasemapStyle({
      style:arcgisStyle,
      token:apiKey
    });

    basemap.setMap(map);

    expect(basemap._map).toBe(map);
  });
});


test('`applyToMap()` sets the style of a provided map', () => {
  // TODO - requires map
});

test('`applyToMap()` applies MapLibre style options such as `transformStyle`', ({apiKey}) => {
  const maplibreStyleOptions = {
    transformStyle: (oldStyleIfAny, newStyle) => ({
      ...newStyle,
      layers: [
        newStyle.layers[0]
      ]
    })
  }
  // TODO - requires map
});

test('Customizes the style of the maplibre map with `updateStyle()`', () => {
  // TODO - requires map
});
test('updateStyle() accepts parameters including a new basemap style and preferences.', () => {
  // TODO - requires map
});

test('Fires a BasemapStyleLoad event when the style loads.', async ({apiKey}) => {
  const basemap = new BasemapStyle({
    style:arcgisStyle,
    token:apiKey
  });
  basemap.loadStyle();

  async function eventTriggers(eventName) {
    return new Promise((resolve,reject) => {
      basemap.on(eventName,(style)=>{resolve(style)});
    })
  }
  const eventTriggersSpy = vi.fn(eventTriggers);
  const style = await eventTriggersSpy('BasemapStyleLoad');

  expect(eventTriggersSpy).toHaveResolved();
  expect(style).toBe(basemap.style)
});

test('Fires a BasemapAttributionLoad event when the attribution loads.', async ({apiKey}) => {
  // TODO - requires map
});

test('Emits a BasemapStyleError event when a loading error occurs.', async () => {
  const basemap = new BasemapStyle({
    style:arcgisStyle,
    token:'12345 invalid key'
  });
  basemap.loadStyle();

  async function eventTriggers(eventName) {
    return new Promise((resolve,reject) => {
      basemap.on(eventName,(e)=>{
        reject(e)});
    })
  }
  const eventTriggersSpy = vi.fn(eventTriggers);

  await expect(() => eventTriggersSpy('BasemapStyleError')).rejects.toThrowError('401');
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
