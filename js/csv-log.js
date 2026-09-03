// Local-only storage for the DREAMS 2026 visitor survey. Deliberately never
// touches Firestore (see js/sync.js stripping `survey` out before it syncs
// anything) — rows just accumulate in this browser's localStorage, and
// staff export them to a CSV file whenever they want (kiosk Settings modal
// or the admin portal — both share this same localStorage since they're
// file:// pages under the same folder). A live auto-append straight to a
// folder like Documents\Academic would need the File System Access API,
// which requires a secure context (https/localhost) that a no-server,
// file://-only kiosk can't provide — see PROJECT_STATUS.md.
const CsvLog = (function () {
  const ROWS_KEY = "tanclan_survey_rows";
  const FILE_PREFIX = "dreams-2026-survey";

  function csvEscape(value) {
    const s = value === null || value === undefined ? "" : String(value);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function toCsvRow(values) {
    return values.map(csvEscape).join(",") + "\r\n";
  }

  function readRows() {
    try {
      return JSON.parse(localStorage.getItem(ROWS_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function logSubmission(rowValues) {
    const rows = readRows();
    rows.push(rowValues);
    try {
      localStorage.setItem(ROWS_KEY, JSON.stringify(rows));
    } catch (e) {
      /* storage full — very unlikely for text-only survey rows, and must
         never block the visitor from continuing into the family tree */
    }
  }

  function rowCount() {
    return readRows().length;
  }

  function downloadCsv(headerRow) {
    const rows = readRows();
    const csv = [toCsvRow(headerRow)].concat(rows.map(toCsvRow)).join("");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = FILE_PREFIX + "-" + new Date().toISOString().slice(0, 10) + ".csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  return { logSubmission, readRows, rowCount, downloadCsv };
})();
