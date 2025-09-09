//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest.test'
import { useMock, removeMock } from './setupUnit';
import { AttributionControl } from '../src/AttributionControl';

const esriAttributionString = 'Powered by \<a href=\"https:\/\/www.esri.com\/\"\>Esri\<\/a\>';
const maplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\"\>MapLibre\<\/a\>';
const defaultMaplibreAttributionString = '\<a href=\"https:\/\/maplibre.org\/\" target=\"_blank\"\>MapLibre\<\/a\>';

describe('Attribution control unit tests', () => {
  beforeAll(() => {
    useMock();
    return () => removeMock();
  });
  beforeEach(()=> {
    fetchMock.resetMocks();
  });

  test('Always adds the string \'Powered by Esri\'.', () => {});
  test('Always adds the string \'MapLibre\'.', () => {});
  test('Accepts a `customAttribution` parameter and includes the provided string or array in attribution text.', () => {});
  test('Displays the attribution text as a maplibre-gl attribution control.', () => {});
  test('Accepts a `compact` option and passes it to the maplibre super().', () => {});
  test('Accepts a `collapsed` option that causes the attribution control to initially load in a closed state.', () => {});

  describe('Analyzes existing map attribution when `onAdd` is called.', () => {
    test('Checks if Esri attribution is already present and skips adding if it is, logs a warning with no error.', () => {});
    test('Overwrites the default maplibre attribution if the default is present.', () => {});
    test('Throws if custom attribution was provided to the `map`, and instructs users to add to the Esri attribution control instead.', () => {});
    test('', () => {});
  });
  test('Checks if Esri attribution is already present and does not add if it is.', () => {});
  test('On add', () => {});
  test('', () => {});
  test('', () => {});
});
