import createFetchMock from 'vitest-fetch-mock';
import { vi } from "vitest";
// Provide mock window for maplibre gl js
Object.setPrototypeOf(window, Window.prototype);
window.URL.createObjectURL = vi.fn();


//Enable fetch mock
const fetchMocker = createFetchMock(vi);
fetchMocker.enableMocks();
fetchMocker.disableMocks();
