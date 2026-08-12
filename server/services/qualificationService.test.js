import test from 'node:test';
import assert from 'node:assert/strict';
import { qualifyLead, sortQualifiedLeads } from './qualificationService.js';

const baseLead = { name: 'Empresa', segment: 'Clínica', city: 'São Paulo', rating: 4.7, reviews_count: 120, phone: '(11) 99999-9999', gmaps_link: 'https://maps.google.com' };

test('prioritizes a company without a website for website sales', () => {
  const qualified = qualifyLead({ ...baseLead, website: '' }, 'website');
  assert.equal(qualified.has_website, 0);
  assert.equal(qualified.website_analysis.qualification.vulnerabilityScore, 96);
  assert.ok(qualified.first_message.includes('site ou landing page'));
});

test('sorts easy and hard leads in the requested direction', () => {
  const easy = qualifyLead({ ...baseLead, name: 'Fácil', website: '' }, 'website');
  const hard = qualifyLead({ ...baseLead, name: 'Difícil', website: 'https://example.com', phone: '', whatsapp: '', reviews_count: 400 }, 'website');
  assert.equal(sortQualifiedLeads([hard, easy], 'easiest')[0].name, 'Fácil');
  assert.equal(sortQualifiedLeads([easy, hard], 'hardest')[0].name, 'Difícil');
});
