import createFetchMock from 'vitest-fetch-mock';
import { vi } from "vitest";

// Mock browser globals and window
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = vi.fn();

//Enable fetch mock
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();
//fetchMocker.disableMocks();

export let IS_MOCK = false;

export function useMock() {

  vi.stubGlobal('ResizeObserver', class MockResizeObserver {
    observe = vi.fn();
  });

  vi.stubGlobal('Worker', vi.fn(() => ({
    postMessage: vi.fn(),
    onmessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: window.addEventListener,
    removeEventListener: window.removeEventListener,
  })));

  fetchMock.enableMocks();
  fetchMock.doMock();

  IS_MOCK = true;
};

export function removeMock() {
  vi.unstubAllGlobals();

  fetchMock.disableMocks();

  IS_MOCK = false;
};
