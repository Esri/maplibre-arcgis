//@ts-nocheck
import { describe, expect, test as testBase, vi } from 'vitest';
import { BasemapStyle, BasemapSession } from '../src/MaplibreArcGIS';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
import { Map } from 'maplibre-gl';

const arcgisStyle = 'arcgis/navigation';
const imageryStyle = 'arcgis/imagery';
const openStyle = 'open/streets';

const DEFAULT_BASE_URL = 'https://basemapstyles-api.arcgis.com/arcgis/rest/services/styles/v2/styles';

const basemapSession =  await BasemapSession.start({
      styleFamily: 'arcgis',
      token: process.env.PRODUCTION_KEY_ALP
    });

// Basemap style test format
const test = testBase.extend({
  // loads a BasemapSession
  basemapSession: async ({apiKey}, use) => {
    const basemapSession = await BasemapSession.start({
      styleFamily: 'arcgis',
      token: apiKey
    });
    await use(basemapSession);
  },
  // Creates a REST JS APIKeyManager
  restJsAuthentication: async ({apiKey}, use) => {
    const restJsAuthentication = ApiKeyManager.fromKey(apiKey);
    await use (restJsAuthentication)
  },
  // Returns an API key
  apiKey: async ({}, use) => {
    const apiKey = process.env.PRODUCTION_KEY_ALP;
    await use(apiKey);
  },
  // Mocks maplibre map
  map: async ({}, use) => {
    const mapDiv = document.createElement('div');
    // TODO how to initialize webgl here?
    const map = new Map({
      container: mapDiv,
      zoom: 5, // starting zoom
      center: [138.2529, 36.2048] // starting location
    });
    await use(map);
  }
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

test('Retrieves the style as JSON when `loadStyle()` is called.', async ({apiKey}) => {
  const basemap = new BasemapStyle({
    style:arcgisStyle,
    token:apiKey
  });
  // Fetch actual data
  await basemap.loadStyle();

  expect(basemap.style).toBeDefined();
});

test('Appends an access token to the style JSON.', async ({apiKey}) => {
  const basemap = new BasemapStyle({
    style:arcgisStyle,
    token:apiKey
  });
  // Fetch actual data
  await basemap.loadStyle();

  // Check glyphs
  expect(basemap.style.glyphs).toContain(apiKey);
  // Check sources
  for (const source of Object.keys(basemap.style.sources)) {
    for (const tileUrl of basemap.style.sources[source].tiles) {
      expect(tileUrl).toContain(apiKey)
    }
  }
  // Check sprites
  if (basemap.style.sprite) {
    if (Array.isArray(basemap.style.sprite)) {
      for (const spriteUrl of basemap.style.sprite) expect(spriteUrl).toContain(apiKey);
    }
    else {
      expect(basemap.style.sprite).toContain(apiKey);
    }
  }
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
  expect(basemap.token).toBe(apiKey);
});

test('Accepts an ArcGIS REST JS authentication manager and uses the access token in requests.', ({restJsAuthentication}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    authentication: restJsAuthentication
  });
  expect(basemap.token).toBe(restJsAuthentication.token);
});

describe('Supports basemap session authentication.', () => {
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

test('Accepts a private \'baseUrl\' param for dev server testing.', ({apiKey}) => {
  const DEV_URL = 'https://basemapstylesdev-api.arcgis.com/arcgis/rest/services/styles/v2/styles';
  const basemap = new BasemapStyle({
    style:arcgisStyle,
    token:apiKey,
    baseUrl:DEV_URL
  });

  expect(basemap._baseUrl).toBe(DEV_URL);
});

test('Accepts a `language` parameter and adds that to the basemap style', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
    language: 'ja'
  });

  expect(basemap.preferences.language).toBe('ja');
  expect(basemap._styleUrl).toContain('language=ja');
});

test('Accepts a `places` parameter and adds that to the basemap style', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
    places: 'all'
  });

  expect(basemap.preferences.places).toBe('all');
  expect(basemap._styleUrl).toContain('places=all');
});

test('Accepts a `worldview` parameter and adds that to the basemap style', ({apiKey}) => {
  const basemap = new BasemapStyle({
    style: arcgisStyle,
    token: apiKey,
    worldview: 'unitedStatesOfAmerica'
  });

  expect(basemap.preferences.worldview).toBe('unitedStatesOfAmerica');
  expect(basemap._styleUrl).toContain('worldview=unitedStatesOfAmerica');
})

test('Accepts custom attribution and applies it to the map.', () => {
  // TODO - requires map
});
test('Adds \"Powered by Esri\" to the map attribution if not already present.', () => {
  // TODO - requires map
});
test('Does not add \"Powered by Esri\" to the map attribution if it is present.', () => {
  // TODO - requires map
});
test('Does not overwrite the existing map attribution if there is any.', () => {
  // TODO - requires map
});
test('Yells at you if you don\'t display \"Powered by Esri\" attribution.', () => {
  // TODO - requires map
});

test('Allows updating the associated Map with `setMap()`.', () => {
  // TODO - requires map
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
