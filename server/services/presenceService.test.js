import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPublicContactsFromHtml } from './presenceService.js';

test('extracts only public contact links present on the company website', () => {
  const contacts = extractPublicContactsFromHtml(`
    <a href="https://instagram.com/empresa.teste/">Instagram</a>
    <a href="mailto:contato@empresa.com.br">E-mail</a>
    <a href="https://wa.me/5511999999999">WhatsApp</a>
    <a href="https://facebook.com/empresa.teste">Facebook</a>
  `, 'https://empresa.com.br');

  assert.equal(contacts.instagram, '@empresa.teste');
  assert.equal(contacts.email, 'contato@empresa.com.br');
  assert.equal(contacts.whatsapp, '5511999999999');
  assert.equal(contacts.facebook, 'https://facebook.com/empresa.teste');
  assert.deepEqual(contacts.verifiedContacts.sort(), ['email', 'facebook', 'instagram', 'whatsapp']);
});

test('does not manufacture contacts when none are published', () => {
  const contacts = extractPublicContactsFromHtml('<main>Site institucional sem contatos publicados</main>', 'https://empresa.com.br');
  assert.equal(contacts.instagram, '');
  assert.equal(contacts.email, '');
  assert.equal(contacts.whatsapp, '');
  assert.deepEqual(contacts.verifiedContacts, []);
});
