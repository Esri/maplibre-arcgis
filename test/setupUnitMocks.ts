import createFetchMock from 'vitest-fetch-mock';
import { beforeEach, vi } from 'vitest';

// Mock browser globals and window.
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = vi.fn();

// Enable fetch mock.
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();
const fetchMockGlobal = globalThis.fetchMock as { resetMocks: () => void; doMock: () => void };

// Browser API stubs.
vi.stubGlobal('ResizeObserver', class MockResizeObserver {
  observe = vi.fn();
});
vi.stubGlobal('Worker', vi.fn(() => ({
  postMessage: vi.fn(),
  onmessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: window.addEventListener,
  removeEventListener: window.removeEventListener
})));
fetchMockGlobal.doMock();

// REST JS module spies - must be installed before test files import src modules.
vi.mock('@esri/arcgis-rest-feature-service', { spy: true });
vi.mock('@esri/arcgis-rest-portal', { spy: true });
vi.mock('@esri/arcgis-rest-request', { spy: true });
vi.mock('@esri/arcgis-rest-basemap-sessions', { spy: true });

// Reset fetch mock before each test.
beforeEach(() => {
  fetchMockGlobal.resetMocks();
  fetchMockGlobal.doMock();
});
