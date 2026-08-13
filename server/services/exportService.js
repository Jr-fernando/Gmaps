import ExcelJS from 'exceljs';

const cleanText = (value) => String(value ?? '').replace(/[\u0000-\u001f]+/g, ' ').trim();
const safeCell = (value) => {
  const text = cleanText(value);
  if (!text) return null;
  return text;
};
const phoneDigits = (lead) => cleanText(lead.whatsapp || lead.phone).replace(/\D/g, '');
const vcardEscape = (value) => cleanText(value).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,');
const fileStamp = () => new Date().toISOString().slice(0, 10);

export const exportContactsTxt = (leads) => {
  const numbers = [...new Set(leads.map(phoneDigits).filter(Boolean))];
  return { buffer: Buffer.from(`\uFEFF${numbers.join('\r\n')}`, 'utf8'), contentType: 'text/plain; charset=utf-8', filename: `leadmap-numeros-${fileStamp()}.txt`, exported: numbers.length };
};

export const exportContactsVcf = (leads) => {
  const contacts = leads.filter((lead) => phoneDigits(lead)).map((lead) => [
    'BEGIN:VCARD', 'VERSION:3.0',
    `FN:${vcardEscape(`LeadMap - ${lead.name}`)}`,
    `ORG:${vcardEscape(lead.name)}`,
    `TEL;TYPE=CELL:${phoneDigits(lead)}`,
    lead.email ? `EMAIL;TYPE=INTERNET:${vcardEscape(lead.email)}` : '',
    lead.website ? `URL:${vcardEscape(lead.website)}` : '',
    lead.address ? `ADR;TYPE=WORK:;;${vcardEscape(lead.address)};${vcardEscape(lead.city)};${vcardEscape(lead.state)};;;` : '',
    `NOTE:${vcardEscape(`${lead.segment || lead.category || 'Empresa local'} | Status: ${lead.status || 'Novo Lead'} | Origem: LeadMap`)}`,
    'END:VCARD',
  ].filter(Boolean).join('\r\n')).join('\r\n');
  return { buffer: Buffer.from(contacts, 'utf8'), contentType: 'text/vcard; charset=utf-8', filename: `leadmap-contatos-${fileStamp()}.vcf`, exported: leads.filter((lead) => phoneDigits(lead)).length };
};

export const exportContactsXlsx = async (leads) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LeadMap'; workbook.created = new Date();
  const sheet = workbook.addWorksheet('Contatos', { views: [{ state: 'frozen', ySplit: 4, showGridLines: false }] });
  sheet.mergeCells('A1:Q1'); sheet.getCell('A1').value = 'LeadMap · Exportação de contatos';
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF07110D' } };
  sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC8F45D' } };
  sheet.getCell('A2').value = 'Gerado em'; sheet.getCell('B2').value = new Date(); sheet.getCell('B2').numFmt = 'yyyy-mm-dd hh:mm';
  sheet.getCell('D2').value = 'Total exportado'; sheet.getCell('E2').value = leads.length; sheet.getCell('E2').numFmt = '#,##0';
  const columns = [
    ['Empresa', 30], ['Nicho', 22], ['Cidade', 18], ['Estado', 10], ['Telefone', 19], ['WhatsApp', 19], ['E-mail', 30], ['Instagram', 24], ['Site', 34], ['Endereço', 42], ['Nota Maps', 13], ['Avaliações', 13], ['Oportunidade', 14], ['Status', 20], ['Arquivado', 12], ['Último contato', 18], ['Google Maps', 34],
  ];
  sheet.columns = columns.map(([key, width]) => ({ key, width }));
  sheet.getRow(4).values = columns.map(([header]) => header);
  sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } }; sheet.getRow(4).height = 24;
  sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF173D2B' } };
  for (const lead of leads) sheet.addRow({
    Empresa: safeCell(lead.name), Nicho: safeCell(lead.segment || lead.category), Cidade: safeCell(lead.city), Estado: safeCell(lead.state),
    Telefone: safeCell(lead.phone), WhatsApp: safeCell(lead.whatsapp), 'E-mail': safeCell(lead.email), Instagram: safeCell(lead.instagram),
    Site: safeCell(lead.website), Endereço: safeCell(lead.address), 'Nota Maps': Number(lead.rating) || null, Avaliações: Number(lead.reviews_count) || 0,
    Oportunidade: Number(lead.opportunity_score) || 0, Status: safeCell(lead.status), Arquivado: lead.archived ? 'Sim' : 'Não',
    'Último contato': lead.last_contact_date ? new Date(lead.last_contact_date) : null, 'Google Maps': safeCell(lead.gmaps_link),
  });
  const lastRow = Math.max(4, sheet.rowCount);
  sheet.autoFilter = { from: 'A4', to: 'Q4' };
  sheet.getColumn('Nota Maps').numFmt = '0.0'; sheet.getColumn('Avaliações').numFmt = '#,##0'; sheet.getColumn('Oportunidade').numFmt = '0'; sheet.getColumn('Último contato').numFmt = 'yyyy-mm-dd';
  for (const key of ['Telefone', 'WhatsApp', 'E-mail', 'Instagram', 'Site', 'Google Maps']) sheet.getColumn(key).numFmt = '@';
  for (let row = 5; row <= lastRow; row += 1) {
    sheet.getRow(row).height = 20;
    if ((row - 5) % 2 === 1) sheet.getRow(row).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F8F4' } };
    const status = sheet.getCell(`N${row}`).value;
    if (status === 'Mensagem enviada') sheet.getCell(`N${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9F99D' } };
  }
  const buffer = await workbook.xlsx.writeBuffer();
  return { buffer: Buffer.from(buffer), contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', filename: `leadmap-contatos-${fileStamp()}.xlsx`, exported: leads.length };
};

export const buildContactExport = async (format, leads) => {
  if (format === 'txt') return exportContactsTxt(leads);
  if (format === 'vcf') return exportContactsVcf(leads);
  if (format === 'xlsx') return exportContactsXlsx(leads);
  throw new Error('Formato de exportação inválido.');
};
