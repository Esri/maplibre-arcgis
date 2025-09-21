//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest } from './BaseTest'
import { BasemapSession } from '../src/BasemapSession';
import { BasemapStyleSession } from '@esri/arcgis-rest-basemap-sessions';
import { useMock, removeMock } from './setupUnit';
import sessionResponseRaw from './mock/BasemapSession/valid-session.json';
import expiredSessionResponseRaw from './mock/BasemapSession/expired-session.json';
import { ApiKeyManager } from '@esri/arcgis-rest-request';
const sessionResponse = JSON.stringify(sessionResponseRaw);
const expiredSessionResponse = JSON.stringify(expiredSessionResponseRaw);

const test = customTest.extend({
  basemapSession: async ({apiKey}, use) => {
    fetchMock.once(sessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis'
    });
    await use(session)
  },
  sessionResponse: async ({apiKey}, use) => {
    function generateSessionResponse (duration) {
      const mockShortSession = {
        sessionToken: `mockSessionToken${Math.floor(Math.random()*10)}`,
        startTime: Date.now(),
        endTime: Date.now() + duration,
        styleFamily: 'arcgis'
      }
      return mockShortSession
    }
    await use(generateSessionResponse)
  },
  expiredSession: async ({apiKey}, use) => {
    fetchMock.once(expiredSessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis'
    });
    await use(session)
  }
})
describe('Basemap session unit tests', () => {
  beforeAll(async () => {
    useMock();
    return () => {
      removeMock();
    }
  });
  beforeEach(() => {
    fetchMock.resetMocks();
  });

  test('Uses ArcGIS REST JS to start a basemap session.', async ({apiKey}) => {
    fetchMock.once(sessionResponse);

    const startRestJs = vi.spyOn(BasemapStyleSession,'start');

    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis'
    });

    expect(startRestJs).toHaveBeenCalled();
    expect(session._session).toBeDefined();
    expect(session.isStarted).toBe(true);
    expect(session.token).toBeDefined();
  });
  test('Exposes a `token` param with the latest session token.', ({basemapSession}) => {
    expect(basemapSession.token).toBe(sessionResponseRaw.sessionToken);
  });
  test('Requires an access token and passes it to REST JS.', async ({apiKey}) => {
    // Requires API key
    const session = new BasemapSession({
      token:apiKey,
      styleFamily:'arcgis'
    });
    expect(session._parentToken).toBe(apiKey);

    expect(() => {
      const session = new BasemapSession();
    }).toThrowError('A valid ArcGIS access token is required to start a session.');
    expect(()=>{
      const session = new BasemapSession({});
    }).toThrowError('A valid ArcGIS access token is required to start a session.');

    // Passes key to REST JS
    const authentication = ApiKeyManager.fromKey(apiKey);
    const restSpy = vi.spyOn(BasemapStyleSession,'start');
    fetchMock.once(sessionResponse);
    await session.initialize();

    expect(restSpy).toHaveBeenCalledWith(expect.objectContaining({authentication}));
  });
  test('Accepts a `styleFamily` parameter and throws if none is provided.', ({apiKey}) => {
    const session = new BasemapSession({
      token:apiKey,
      styleFamily:'arcgis'
    });
    expect(session.styleFamily).toBe('arcgis');

    expect(()=>{
      const session = new BasemapSession({
        token:apiKey
      })
    }).toThrowError('BasemapSession must be initialized with a styleFamily: `arcgis` or `open`.');
  });
  test('Accepts a `duration` parameter which customizes the session duration.', async ({apiKey}) => {
    const restSpy = vi.spyOn(BasemapStyleSession,'start');

    fetchMock.once(sessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis',
      duration:100
    });
    expect(restSpy).toHaveBeenCalledWith(expect.objectContaining({duration:100}))
  });
  test('Accepts an `autoRefresh` parameter which causes the session to automatically refresh on expiration.', async ({apiKey}) => {

    const warnSpy = vi.spyOn(console,'warn');
    const restSpy = vi.spyOn(BasemapStyleSession,'start');

    fetchMock.once(sessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis',
      autoRefresh: true
    });
    // Auto-refresh handled by ArcGIS REST JS
    expect(restSpy).toHaveBeenCalledWith(expect.objectContaining({autoRefresh:true}));
    expect(warnSpy).toHaveBeenCalledWith('Auto-refresh is enabled. Your basemap session will automatically refresh once the \'duration\' elapses.');
  });
  test('Accepts a `safetyMargin` parameter which causes the session to refresh before it expires.', async ({apiKey}) => {
    const restSpy = vi.spyOn(BasemapStyleSession,'start');

    fetchMock.once(sessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis',
      safetyMargin: 30
    });
    expect(restSpy).toHaveBeenCalledWith(expect.objectContaining({safetyMargin:30}));

    expect(session.safeEndTime.getTime()).toBe(session.endTime.getTime()-30000);
  });
  test('Accepts a `startSessionUrl` parameter for internal testing.', async ({apiKey}) => {
    const restSpy = vi.spyOn(BasemapStyleSession,'start');

    const devUrl = 'http://DEVELOPMENT-URL.com/sessions/start'

    fetchMock.once(sessionResponse);
    const session = await BasemapSession.start({
      token:apiKey,
      styleFamily:'arcgis',
      startSessionUrl: devUrl
    });

    expect(session._session.startSessionUrl).toBe(devUrl);
  });

  test('Emits an event when the basemap session expires.', async ({apiKey,sessionResponse}) => {
    const shortSession1 = sessionResponse(1000); // artificially lower duration to 1s
    fetchMock.once(JSON.stringify(shortSession1));

    const session = await BasemapSession.start({
      token: apiKey,
      styleFamily: 'arcgis',
      duration: 10 // the service has a minimum duration of 10
    })

    await expect(new Promise((resolve) => {
        session.on('BasemapSessionExpired', (sessionResponse) => {
          resolve(sessionResponse)
        })
      })).resolves.toMatchObject({token:shortSession1.sessionToken});
  });
  test('Emits an event when the basemap session is refreshed.', async ({apiKey, sessionResponse}) => {
    const firstSessionResponse = sessionResponse(10000);
    fetchMock.once(JSON.stringify(firstSessionResponse));

    const session = await BasemapSession.start({
      token: apiKey,
      styleFamily: 'arcgis',
      duration: 10
    })

    // Refresh token immediately
    const newSessionResponse = sessionResponse(10000)
    fetchMock.once(JSON.stringify(newSessionResponse))
    session.refresh();

    await expect(new Promise((resolve) => {
      session.on('BasemapSessionRefreshed', (refreshedObject) => {
          resolve(refreshedObject)
      })
    })).resolves.toMatchObject({
      previous: expect.objectContaining({token:firstSessionResponse.sessionToken}),
      current: expect.objectContaining({token:newSessionResponse.sessionToken})
    });
  });
  test('Emits an event when an error occurs while refreshing the session.', async ({apiKey, sessionResponse}) => {

    const firstSessionResponse = sessionResponse(10000);
    fetchMock.once(JSON.stringify(firstSessionResponse));
    const session = await BasemapSession.start({
      token: apiKey,
      styleFamily: 'arcgis',
      duration: 10
    })

    // Refresh token immediately
    fetchMock.mockRejectOnce(new Error('Your API key has expired.'));
    session.refresh();

    await expect(new Promise((resolve,reject) => {
      session.on('BasemapSessionError', (error) => {
          reject(error)
      })
    })).rejects.toThrowError('Your API key has expired.');
  });

  test('isStarted param checks if a session is started and whether it is still valid', async ({basemapSession,expiredSession}) => {
    expect(basemapSession.isStarted).toBe(true);
    expect(basemapSession.safeEndTime).greaterThan(new Date());

    expect(expiredSession.isStarted).toBe(false);
    expect(expiredSession.safeEndTime).lessThan(new Date());
  });
});
