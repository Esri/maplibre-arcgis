import {expect, test} from 'vitest';

test('Test suite creates a virtual window and DOM', () => {
  expect(typeof window).not.toBe('undefined');
  expect(window instanceof Window).toBe(true);
});
