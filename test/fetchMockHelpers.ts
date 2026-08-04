import { vi } from 'vitest';
import type FetchMock from 'vitest-fetch-mock';

type FetchMockLike = {
  enableMocks: () => void;
  doMock: () => void;
  disableMocks: () => void;
  once: (body: BodyInit | null | undefined, init?: ResponseInit) => FetchMockLike;
  mockResponses: (...responses: [BodyInit | null | undefined, ResponseInit?][]) => FetchMockLike;
};

const fetchMockGlobal = globalThis.fetchMock as FetchMockLike;
type JsonMockResponse = unknown | [unknown, ResponseInit?];

function toMockBody(data: unknown): BodyInit | null | undefined {
  if (typeof data === 'string' || data == null) {
    return data;
  }

  return JSON.stringify(data);
}

export function removeMock() {
  const fetchMockGlobal = globalThis.fetchMock as FetchMockLike;
  vi.unstubAllGlobals();
  fetchMockGlobal.disableMocks();
}

export function mockJsonOnce(data: unknown, init?: ResponseInit): FetchMockLike {
  const fetchMockGlobal = globalThis.fetchMock as FetchMockLike;
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
