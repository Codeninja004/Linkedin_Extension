/** Escapes a single CSV field per RFC 4180 — wraps in quotes and doubles any embedded quotes whenever the value contains a comma, quote, or newline. */
function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** Builds a CSV string (CRLF line endings, per RFC 4180) from a 2D array of cell values. */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n');
}
