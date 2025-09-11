//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest'
import { BasemapSession } from '../src/BasemapSession';
import { useMock, removeMock } from './setupUnit';

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

  test('Accepts an access token and throws if no token is provided.', ({apiKey}) => {
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

  test('Accepts a `duration` parameter which customizes the session duration.', () => {});
  test('Accepts an `autoRefresh` parameter which causes the session to automatically refresh on expiration.', () => {});
  test('Accepts a `safetyMargin` parameter which causes the session to refresh before it expires.', () => {});
  test('Accepts a `startSessionUrl` parameter for internal testing.', () => {});
  test('Emits an event when the basemap session expires.', () => {});
  test('Emits an event when the basemap session is refreshed.', () => {});
  test('Emits an event when an error occurs while refreshing the session.', () => {});
  test('Uses ArcGIS REST JS to start a basemap session.', () => {});
  test('', () => {});
});
