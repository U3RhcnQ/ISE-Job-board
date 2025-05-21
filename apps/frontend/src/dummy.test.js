// apps/frontend/src/dummy.test.js
import { expect, test } from 'vitest';

test('truthy test', () => {
  expect(true).toBe(true);
});

test('another always passing test', () => {
  expect(1 + 1).toBe(2);
});
