// One-off: merges Chinese translations (scripts/history-zh.json, keyed by
// the `idx` into SURNAME_RECORDS at translation time) into a copy of the
// source CSV as a new "History / Origin of the surname (Chinese)" column,
// writing the result to data/surnames.csv — the project's own canonical
// copy of OOY's CSV going forward (see scripts/build-surnames.js, which
// reads whatever CSV path you give it).
//
// Usage: node scripts/add-zh-history-column.js <source-csv> <history-zh.json>
const fs = require("fs");
const path = require("path");

const [, , sourceCsvPath, historyZhPath] = process.argv;
if (!sourceCsvPath || !historyZhPath) {
  console.error("Usage: node scripts/add-zh-history-column.js <source-csv> <history-zh.json>");
  process.exit(1);
}

const raw = fs.readFileSync(sourceCsvPath, "utf8");
const historyZhList = JSON.parse(fs.readFileSync(historyZhPath, "utf8"));

// Same minimal RFC4180 parser as build-surnames.js.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
      continue;
    }
    field += c;
    i++;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function csvField(value) {
  const s = value == null ? "" : String(value);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const rows = parseCsv(raw);
const header = rows[0].map((h) => h.trim());
const col = (name) => header.indexOf(name);
const iEn = col("Surname in English");
const iZh = col("Surname in Chinese");
const iHistory = col("History / Origin of the surname");

// Rebuild the same idx sequence build-surnames.js assigns (one index per
// data row that has both en + zh, in file order) so historyZhList's idx
// values — captured from that same sequence — line up correctly.
let dataIdx = -1;
const zhByDataIdx = new Map();
historyZhList.forEach((entry) => zhByDataIdx.set(entry.idx, entry.historyZh));

const outRows = [header.concat(["History / Origin of the surname (Chinese)"])];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.every((c) => !c || !c.trim())) continue;
  const en = (row[iEn] || "").trim();
  const zh = (row[iZh] || "").trim();
  const hasRecord = en && zh;
  if (hasRecord) dataIdx++;
  const history = (row[iHistory] || "").trim();
  const historyZh = hasRecord && history ? zhByDataIdx.get(dataIdx) || "" : "";
  outRows.push(row.concat([historyZh]));
}

const csvOut = outRows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
const outDir = path.join(__dirname, "..", "data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "surnames.csv");
fs.writeFileSync(outPath, csvOut, "utf8");
console.log(`Wrote ${outPath} with ${zhByDataIdx.size} Chinese translations merged in.`);
