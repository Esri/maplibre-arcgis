//@ts-nocheck
import { describe, expect, vi, beforeAll, beforeEach } from 'vitest';
import { customTest as test } from './BaseTest';
import { HostedLayer } from '../src/HostedLayer';

test.only('Cannot be instantiated directly.', () => {
  expect(() => {
    const abstractLayer = new HostedLayer({});
  }).toThrowError();
});
