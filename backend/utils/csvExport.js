/**
 * Escape a single CSV cell safely (prevents formula injection and quotes commas/newlines).
 */
function escapeCsvCell(value) {
  if (value === null || value === undefined) return '';
  let str = String(value);
  // Neutralize spreadsheet formula triggers
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string given column definitions [{ key, label }].
 */
function toCsv(rows, columns) {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const body = rows.map((row) =>
    columns.map((c) => escapeCsvCell(typeof c.value === 'function' ? c.value(row) : row[c.key])).join(',')
  );
  return [header, ...body].join('\r\n');
}

module.exports = { toCsv, escapeCsvCell };
