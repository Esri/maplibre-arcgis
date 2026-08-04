import createFetchMock from 'vitest-fetch-mock';
import { vi } from 'vitest';

type FetchMockLike = {
  enableMocks: () => void;
  doMock: () => void;
  disableMocks: () => void;
  once: (body: BodyInit | null | undefined, init?: ResponseInit) => FetchMockLike;
  mockResponses: (...responses: [BodyInit | null | undefined, ResponseInit?][]) => FetchMockLike;
};

type JsonMockResponse = unknown | [unknown, ResponseInit?];

function toMockBody(data: unknown): BodyInit | null | undefined {
  if (typeof data === 'string' || data == null) {
    return data;
  }

  return JSON.stringify(data);
}

// Mock browser globals and window
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = vi.fn();

// Enable fetch mock
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();
const fetchMockGlobal = globalThis.fetchMock as FetchMockLike;

export let IS_MOCK = false;

export function useMock() {
  vi.mock('@esri/arcgis-rest-feature-service', { spy: true });
  vi.mock('@esri/arcgis-rest-portal', { spy: true });
  vi.mock('@esri/arcgis-rest-request', { spy: true });
  vi.mock('@esri/arcgis-rest-basemap-sessions', { spy: true });

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

  fetchMockGlobal.enableMocks();
  fetchMockGlobal.doMock();

  IS_MOCK = true;
}

export function removeMock() {
  vi.unstubAllGlobals();
  fetchMockGlobal.disableMocks();
  IS_MOCK = false;
}

export function mockJsonOnce(data: unknown, init?: ResponseInit): FetchMockLike {
  return fetchMockGlobal.once(toMockBody(data), init);
}

export function mockJsonResponses(responses: JsonMockResponse[]): FetchMockLike {
  const normalized: [BodyInit | null | undefined, ResponseInit?][] = responses.map((entry) => {
    if (Array.isArray(entry)) {
      return [toMockBody(entry[0]), entry[1]];
    }

    return [toMockBody(entry)];
  });

  return fetchMockGlobal.mockResponses(...normalized);
}
