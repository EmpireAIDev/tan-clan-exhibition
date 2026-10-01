// General-purpose: appends a new translated-text column to a copy of
// data/surnames.csv, keyed by the same `idx` sequence build-surnames.js
// assigns (one index per data row with both en + zh present, in file
// order). Supersedes the single-purpose add-zh-history-column.js — same
// idea, works for any source/target column pair (history, famous person,
// future columns).
//
// Usage: node scripts/add-zh-column.js <csv-in> <translations.json>
//          --source "<English column to gate non-empty rows on>"
//          --target "<new column header to append>"
//          --field "<JSON object key holding the translated text>"
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const [csvPath, jsonPath] = args.filter((a) => !a.startsWith("--"));
function flag(name, fallback) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
}
const sourceCol = flag("source");
const targetCol = flag("target");
const field = flag("field");
if (!csvPath || !jsonPath || !sourceCol || !targetCol || !field) {
  console.error(
    "Usage: node scripts/add-zh-column.js <csv-in> <translations.json> --source <col> --target <col> --field <jsonKey>"
  );
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf8");
const translations = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field_ = "";
  let inQuotes = false;
  let i = 0;
  const n = text.length;
  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field_ += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i++;
        continue;
      }
      field_ += c;
      i++;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i++;
      continue;
    }
    if (c === ",") {
      row.push(field_);
      field_ = "";
      i++;
      continue;
    }
    if (c === "\r") {
      i++;
      continue;
    }
    if (c === "\n") {
      row.push(field_);
      rows.push(row);
      row = [];
      field_ = "";
      i++;
      continue;
    }
    field_ += c;
    i++;
  }
  if (field_.length || row.length) {
    row.push(field_);
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
const iSource = col(sourceCol);
if (iSource < 0) {
  console.error(`Column not found: "${sourceCol}". Available: ${header.join(" | ")}`);
  process.exit(1);
}

let dataIdx = -1;
const byDataIdx = new Map();
translations.forEach((entry) => byDataIdx.set(entry.idx, entry[field]));

const outRows = [header.concat([targetCol])];
for (let r = 1; r < rows.length; r++) {
  const row = rows[r];
  if (!row || row.every((c) => !c || !c.trim())) continue;
  const en = (row[iEn] || "").trim();
  const zh = (row[iZh] || "").trim();
  const hasRecord = en && zh;
  if (hasRecord) dataIdx++;
  const sourceVal = (row[iSource] || "").trim();
  const translated = hasRecord && sourceVal ? byDataIdx.get(dataIdx) || "" : "";
  outRows.push(row.concat([translated]));
}

const csvOut = outRows.map((r) => r.map(csvField).join(",")).join("\r\n") + "\r\n";
fs.writeFileSync(csvPath, csvOut, "utf8");
console.log(`Added column "${targetCol}" to ${csvPath} (${byDataIdx.size} translations merged).`);
