import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const root = "C:/Users/Ferna/Downloads/Gmaps Local";
const outputDir = `${root}/outputs/leads_sao_paulo`;
const raw = JSON.parse(await fs.readFile(`${root}/leads_raw.json`, "utf8"));

function address(value) {
  return String(value || "")
    .replace(/^[^·]+·\s*/, "")
    .replace(/[]/g, "")
    .replace(/^\s*·\s*/, "")
    .trim();
}
function offer(category) {
  const c = category.toLowerCase();
  if (/(barbearia|salão|depilação)/.test(c)) return "Reels de transformação + agenda/WhatsApp";
  if (/(confeitaria|lanchonete)/.test(c)) return "Fotos/Reels de cardápio + Google Perfil";
  if (/(pet|floricultura|papelaria|roupas)/.test(c)) return "Catálogo social + campanhas locais";
  if (/(costura|lavanderia|assistência|borracharia|autoelétrica)/.test(c)) return "Site simples + Google Perfil + prova social";
  if (/academia/.test(c)) return "Reels de aulas + captação via WhatsApp";
  return "Conteúdo local + página de conversão";
}
function signal(item) {
  const n = Number(String(item.reviews || "").replace(/[^0-9]/g, ""));
  if (!n) return "Perfil novo/sem avaliações: oportunidade de reputação e conteúdo";
  if (n <= 30) return "Baixa prova social pública: oportunidade de avaliações e conteúdo";
  if (n <= 70) return "Presença local em crescimento: oportunidade de consistência";
  return "Perfil local ativo: oportunidade de conversão e diferenciação";
}

const records = raw.map((x, i) => [
  i + 1,
  x.name,
  x.category,
  address(x.categoryAddress),
  x.rating ? Number(String(x.rating).replace(",", ".")) : null,
  x.reviews ? Number(String(x.reviews).replace(/[^0-9]/g, "")) : 0,
  "Perfil comercial no Google Maps",
  x.url,
  signal(x),
  offer(x.category),
  null,
  "Abrir perfil, validar telefone/WhatsApp e abordar com diagnóstico de 1 minuto",
]);

const wb = Workbook.create();
const dash = wb.worksheets.add("Resumo");
const sheet = wb.worksheets.add("Leads");
const guide = wb.worksheets.add("Como usar");

dash.showGridLines = false;
dash.getRange("A1:H1").merge();
dash.getRange("A1").values = [["Mapa de oportunidades — comércios locais de São Paulo"]];
dash.getRange("A2:H2").merge();
dash.getRange("A2").values = [["Base de prospecção pública | Pesquisa em 21/07/2026 | Priorize o contato pelo perfil comercial indicado"]];
dash.getRange("A4:B4").values = [["Métrica", "Valor"]];
dash.getRange("A5:B9").values = [
  ["Leads pesquisados", null],
  ["Prioridade alta", null],
  ["Perfis sem avaliações", null],
  ["Segmentos", null],
  ["Canal de contato", "Google Maps (perfil comercial)"]
];
dash.getRange("B5").formulas = [["=COUNTA('Leads'!B2:B101)"]];
dash.getRange("B6").formulas = [["=COUNTIF('Leads'!K2:K101,\"Alta\")"]];
dash.getRange("B7").formulas = [["=COUNTIF('Leads'!F2:F101,0)"]];
dash.getRange("B8").formulas = [["=COUNTA(UNIQUE('Leads'!C2:C101))"]];
dash.getRange("D4:E4").values = [["Próxima ação", "Objetivo"]];
dash.getRange("D5:E8").values = [
  ["1. Filtrar Alta", "Começar por pouca/nenhuma prova social"],
  ["2. Abrir o perfil", "Confirmar telefone, WhatsApp ou site"],
  ["3. Diagnóstico rápido", "Apontar uma melhoria específica e relevante"],
  ["4. Abordagem", "Oferecer um teste pequeno e mensurável"]
];

sheet.showGridLines = false;
const headers = [["ID", "Comércio", "Segmento", "Endereço visível", "Nota", "Nº avaliações", "Canal de contato", "URL do perfil/fonte", "Sinal de oportunidade", "Oferta inicial", "Prioridade", "Próxima ação"]];
sheet.getRange("A1:L1").values = headers;
sheet.getRange(`A2:L${records.length + 1}`).values = records;
sheet.getRange("K2").formulas = [["=IF(F2=0,\"Alta\",IF(F2<=30,\"Alta\",IF(F2<=70,\"Média\",\"Baixa\")))"]];
sheet.getRange(`K2:K${records.length + 1}`).fillDown();
sheet.tables.add(`A1:L${records.length + 1}`, true, "LeadsTable");

guide.showGridLines = false;
guide.getRange("A1:F1").merge();
guide.getRange("A1").values = [["Critérios, limites e uso responsável"]];
guide.getRange("A3:B8").values = [
  ["Item", "Definição"],
  ["Escopo", "100 comércios listados publicamente no Google Maps em São Paulo — SP, em segmentos de venda/serviço de ticket baixo ou recorrente."],
  ["Contato", "A URL leva ao perfil comercial público no Google Maps. Antes de abordar, valide telefone, WhatsApp, site ou Instagram exibidos ali."],
  ["Sinal de oportunidade", "É uma hipótese comercial baseada em avaliação e quantidade de avaliações públicas. Não afirma que o negócio não tenha site ou social media."],
  ["Prioridade", "Alta: 0–30 avaliações; Média: 31–70; Baixa: acima de 70. Use como ordem de triagem, não como qualificação definitiva."],
  ["Boas práticas", "Faça uma abordagem relevante e respeitosa, identifique-se, ofereça opt-out e respeite políticas das plataformas e a LGPD."],
];
guide.getRange("A10:B12").values = [
  ["Leitura rápida", "Abra a guia Leads, filtre Prioridade = Alta e escolha um segmento que você domina."],
  ["Mensagem-base", "Vi o perfil de vocês e notei uma oportunidade simples de [oferta inicial]. Posso te enviar uma ideia curta e sem compromisso?"],
  ["Fonte", "Perfis comerciais públicos do Google Maps, pesquisados em 21/07/2026. Cada linha possui URL de origem."],
];

for (const s of [dash, sheet, guide]) {
  s.getUsedRange().format.font = { name: "Aptos", size: 10, color: "#1F2937" };
}
for (const s of [dash, guide]) {
  s.getRange("A1:H1").format = { fill: "#123047", font: { name: "Aptos Display", size: 16, bold: true, color: "#FFFFFF" }, horizontalAlignment: "left", verticalAlignment: "center" };
  s.getRange("A1:H1").format.rowHeight = 30;
}
dash.getRange("A2:H2").format = { fill: "#E7F0F5", font: { italic: true, color: "#425466" } };
dash.getRange("A4:B4").format = { fill: "#2D6A7D", font: { bold: true, color: "#FFFFFF" } };
dash.getRange("D4:E4").format = { fill: "#2D6A7D", font: { bold: true, color: "#FFFFFF" } };
dash.getRange("A5:B9").format.borders = { preset: "outside", style: "thin", color: "#B7C9D3" };
dash.getRange("D5:E8").format.borders = { preset: "outside", style: "thin", color: "#B7C9D3" };
dash.getRange("B5:B8").format = { fill: "#EAF6EE", font: { bold: true, color: "#166534" }, horizontalAlignment: "center" };
dash.getRange("A1:H9").format.wrapText = true;
dash.getRange("A:A").format.columnWidth = 26; dash.getRange("B:B").format.columnWidth = 28; dash.getRange("D:D").format.columnWidth = 22; dash.getRange("E:E").format.columnWidth = 42;

sheet.getRange("A1:L1").format = { fill: "#123047", font: { bold: true, color: "#FFFFFF" }, horizontalAlignment: "center", verticalAlignment: "center", wrapText: true };
sheet.getRange("A1:L1").format.rowHeight = 28;
sheet.getRange(`E2:E${records.length + 1}`).format.numberFormat = "0.0";
sheet.getRange(`F2:F${records.length + 1}`).format.numberFormat = "#,##0";
sheet.getRange(`A2:L${records.length + 1}`).format.verticalAlignment = "top";
sheet.getRange(`D2:L${records.length + 1}`).format.wrapText = true;
sheet.getRange("A:A").format.columnWidth = 7; sheet.getRange("B:B").format.columnWidth = 31; sheet.getRange("C:C").format.columnWidth = 20; sheet.getRange("D:D").format.columnWidth = 32; sheet.getRange("E:F").format.columnWidth = 12; sheet.getRange("G:G").format.columnWidth = 27; sheet.getRange("H:H").format.columnWidth = 45; sheet.getRange("I:I").format.columnWidth = 47; sheet.getRange("J:J").format.columnWidth = 42; sheet.getRange("K:K").format.columnWidth = 12; sheet.getRange("L:L").format.columnWidth = 50;
sheet.getRange(`K2:K${records.length + 1}`).conditionalFormats.add("cellIs", { operator: "equal", formula: "\"Alta\"", format: { fill: "#FDE8E8", font: { bold: true, color: "#B91C1C" } } });
sheet.getRange(`K2:K${records.length + 1}`).conditionalFormats.add("cellIs", { operator: "equal", formula: "\"Média\"", format: { fill: "#FEF3C7", font: { bold: true, color: "#92400E" } } });
sheet.getRange(`K2:K${records.length + 1}`).conditionalFormats.add("cellIs", { operator: "equal", formula: "\"Baixa\"", format: { fill: "#E5E7EB", font: { color: "#4B5563" } } });
sheet.freezePanes.freezeRows(1);

guide.getRange("A3:B3").format = { fill: "#2D6A7D", font: { bold: true, color: "#FFFFFF" } };
guide.getRange("A3:B12").format.wrapText = true;
guide.getRange("A3:B12").format.borders = { preset: "outside", style: "thin", color: "#B7C9D3" };
guide.getRange("A:A").format.columnWidth = 25; guide.getRange("B:B").format.columnWidth = 110;
guide.getRange("A3:B12").format.rowHeight = 38;

const inspect = await wb.inspect({ kind: "table", range: "Leads!A1:L8", include: "values,formulas", tableMaxRows: 8, tableMaxCols: 12 });
console.log(inspect.ndjson);
const errors = await wb.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 50 }, summary: "formula errors" });
console.log(errors.ndjson);
const render = await wb.render({ sheetName: "Resumo", range: "A1:H9", scale: 1.5, format: "png" });
await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(`${outputDir}/preview.png`, new Uint8Array(await render.arrayBuffer()));
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(`${outputDir}/leads_sao_paulo.xlsx`);
