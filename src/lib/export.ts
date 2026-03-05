/** Convert an array of objects to a CSV string and trigger a download */
export function exportToCSV(data: Record<string, unknown>[], filename: string): void {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map((row) =>
    keys
      .map((k) => {
        const val = row[k];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return /[,\n"]/.test(str) ? `"${str}"` : str;
      })
      .join(',')
  );
  const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM for Excel
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/** Flatten nested objects one level deep for export */
export function flattenForExport(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      for (const [nk, nv] of Object.entries(v as Record<string, unknown>)) {
        result[`${k}_${nk}`] = nv;
      }
    } else if (Array.isArray(v)) {
      result[k] = v.length;
    } else {
      result[k] = v;
    }
  }
  return result;
}
