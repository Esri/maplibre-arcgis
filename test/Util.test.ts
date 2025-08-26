import {expect, test} from 'vitest';

console.log('window?',window.URL)

test('Test suite creates a virtual window and DOM', () => {
  expect(typeof window).not.toBe('undefined');
  expect(window instanceof Window).toBe(true);
})
