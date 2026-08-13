import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSearchRecommendation } from './aiService.js';

test('AI search learns from the most useful recent search', () => {
  const history = [
    { query: 'salões', city: 'Campinas', needs: ['social_media'], requested: 20, found: 4, createdAt: '2026-01-01' },
    { query: 'clínicas', city: 'São Paulo', region: 'Moema', needs: ['website', 'traffic'], requested: 30, found: 28, radius: 15, createdAt: new Date().toISOString() },
  ];
  const result = sanitizeSearchRecommendation({}, history, {});
  assert.equal(result.query, 'clínicas');
  assert.equal(result.city, 'São Paulo');
  assert.equal(result.region, 'Moema');
  assert.deepEqual(result.needs, ['website', 'traffic']);
});

test('AI search rejects unsupported filters and respects limits', () => {
  const result = sanitizeSearchRecommendation({
    query: 'academias', city: 'Osasco', needs: ['traffic', 'invalid'], radius: 500, limit: 900, sortMode: 'unknown', excludeSaved: false,
  }, [], { sortMode: 'easiest' });
  assert.deepEqual(result.needs, ['traffic']);
  assert.equal(result.radius, 50);
  assert.equal(result.limit, 100);
  assert.equal(result.sortMode, 'easiest');
  assert.equal(result.excludeSaved, false);
});
