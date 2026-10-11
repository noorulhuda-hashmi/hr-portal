// Excel mein "=" ya "+" se shuru hone wala text formula ban sakta hai, is liye aage ' laga dete hain
const cell = (value) => {
  let text = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`;
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

// columns: [{ header: "Name", value: (row) => row.name }]
export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map((c) => cell(c.header)).join(",")];
  rows.forEach((r) => lines.push(columns.map((c) => cell(c.value(r))).join(",")));
  // BOM taake Excel Urdu/English dono sahi kholay
  const blob = new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
