//@ts-nocheck
import { describe, expect, test as testBase } from 'vitest';
import { BasemapStyle, BasemapSession } from '../src/MaplibreArcGIS';
import { ApiKeyManager } from '@esri/arcgis-rest-request';

const arcgisStyle = 'arcgis/navigation';
const imageryStyle = 'arcgis/imagery';
const openStyle = 'open/streets';

// Basemap style test
const test = testBase.extend({
  basemapSession: async ({apiKey}, use) => {
    // loads a BasemapSession
    const basemapSession = await BasemapSession.start({
      styleFamily: 'arcgis',
      token: apiKey
    });
    await use(basemapSession);
  },
  restJsAuthentication: async ({apiKey}, use) => {
    const restJsAuthentication = ApiKeyManager.fromKey(apiKey);
    await use (restJsAuthentication)
  },
  apiKey: async ({}, use) => {
    const apiKey = process.env.PRODUCTION_KEY_ALP;
    await use(apiKey);
  }
});

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

test('Requests a basemap style as JSON and appends the provided token to it.', async ({apiKey}) => {
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

describe('Supports using BasemapSession for authentication.', () => {
  test('Prioritizes a basemap `session` over other types of authentication', ({apiKey,basemapSession,restJsAuthentication}) => {

    // Prioritizes over API key
    const basemap = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession,
      token: apiKey
    });
    expect(basemap.token).toBe(basemapSession.token);

    // Prioritizes over REST JS
    const basemap2 = new BasemapStyle({
      style: arcgisStyle,
      session: basemapSession,
      authentication: restJsAuthentication
    });
    expect(basemap2.token).toBe(basemapSession.token);
  });
  test('Accepts a BasemapSession in the `session` parameter and uses the session token in requests.', () => {

  });
  test('Automatically starts the basemap session if the provided session is not initialized.', () => {

  });
  test('When the BasemapSession refreshes, updates the session token of the map and map tiles.', () => {

  });
});

test('Accepts MapLibre style options such as `transformStyle` and applies them to the map.', () => {

});
test('Accepts custom attribution and applies it to the map.', () => {

});
test('Adds \"Powered by Esri\" to the map attribution if not already present.', () => {

});
test('Does not add \"Powered by Esri\" to the map attribution if it is present.', () => {

});
test('Does not overwrite the existing map attribution if there is any.', () => {

});
test('Yells at you if you don\'t display \"Powered by Esri\" attribution.', () => {

});
test('Accepts a private \'baseUrl\' param for dev server testing.', () => {

});
test('Accepts additional basemap style preferences, including `language`, `places`, and `worldview`.', () => {

});
test('Allows updating the associated Map with `setMap()`.', () => {

});
test('Sets the style of a map with `applyToMap()`.', () => {

});
test('Retrieves the style JSON when `loadStyle()` is called.', () => {

});
test('Customizes the style of the maplibre map with `updateStyle()`', () => {

});
test('updateStyle() accepts parameters including a new basemap style and preferences.', () => {

});
test('Formats a style URL for GET requests.', () => {

});
test('Supports a static `url()` method that returns a formatted style URL.', () => {

});
test('Emits an event when the style loads.', () => {

});
test('Emits an event when the attribution loads.', () => {

});
test('Emits an event when a loading error occurs.', () => {

});
test('Supports a static `getSelf() operation that makes a `/self` request to the service URL.', () => {

});
