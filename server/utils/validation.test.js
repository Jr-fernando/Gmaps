import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafeExternalUrl } from './validation.js';

test('accepts public http and https webhook URLs', () => {
  assert.equal(isSafeExternalUrl('https://hooks.example.com/event'), true);
  assert.equal(isSafeExternalUrl('http://example.org/hook'), true);
});

test('rejects unsafe webhook URLs', () => {
  for (const url of ['ftp://example.com', 'http://localhost:3000', 'http://127.0.0.1', 'http://10.0.0.2', 'not-a-url']) {
    assert.equal(isSafeExternalUrl(url), false, url);
  }
});
