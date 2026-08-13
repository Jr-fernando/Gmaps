import test from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { exportContactsTxt, exportContactsVcf, exportContactsXlsx } from './exportService.js';

const leads = [
  { name: 'Clínica Alfa', segment: 'Clínica', city: 'São Paulo', state: 'SP', phone: '(11) 91234-5678', email: 'oi@alfa.com', rating: 4.8, reviews_count: 120, opportunity_score: 82, status: 'Novo Lead' },
  { name: '=Empresa Perigosa', category: 'Serviços', city: 'Campinas', whatsapp: '+55 19 99876-5432', instagram: '@empresa', archived: true, status: 'Mensagem enviada' },
];

test('exports unique clean phone numbers for mobile use', () => {
  const output = exportContactsTxt(leads);
  assert.equal(output.exported, 2);
  assert.match(output.buffer.toString('utf8'), /11912345678/);
  assert.match(output.buffer.toString('utf8'), /5519998765432/);
});

test('creates a multi-contact vCard that phones can import', () => {
  const output = exportContactsVcf(leads);
  const text = output.buffer.toString('utf8');
  assert.equal(output.exported, 2);
  assert.equal((text.match(/BEGIN:VCARD/g) || []).length, 2);
  assert.match(text, /TEL;TYPE=CELL:11912345678/);
});

test('creates a readable Excel workbook and neutralizes formulas', async () => {
  const output = await exportContactsXlsx(leads);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(output.buffer);
  const sheet = workbook.getWorksheet('Contatos');
  assert.equal(output.exported, 2);
  assert.equal(sheet.getCell('A5').value, 'Clínica Alfa');
  assert.equal(sheet.getCell('A6').value, '=Empresa Perigosa');
  assert.notEqual(sheet.getCell('A6').type, ExcelJS.ValueType.Formula);
  assert.equal(sheet.getCell('O6').value, 'Sim');
  assert.equal(sheet.autoFilter, 'A4:Q4');
});
