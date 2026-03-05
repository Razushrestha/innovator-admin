'use client';

import { useRef, useState } from 'react';
import { Upload, X, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';

// A single parsed row is just a key→string map
type ParsedRow = Record<string, string>;

interface Props {
  /** Column definitions the CSV must contain (label shown in preview, key used in callbacks) */
  columns: { key: string; label: string; required?: boolean }[];
  /** Called when the user confirms import. Return a list of error messages (if any). */
  onImport: (rows: ParsedRow[]) => Promise<string[]>;
  label?: string;
}

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const row: string[] = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        row.push(field.trim());
        field = '';
      } else {
        field += ch;
      }
    }
    row.push(field.trim());
    rows.push(row);
  }
  return rows;
}

function rowsToObjects(cells: string[][]): ParsedRow[] {
  if (cells.length < 2) return [];
  const headers = cells[0].map((h) => h.toLowerCase().trim());
  return cells.slice(1).map((row) => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? '';
    });
    return obj;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImportButton({ columns, onImport, label = 'Import' }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  const resetState = () => {
    setPreview(null);
    setParseError(null);
    setImportErrors([]);
    setDone(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleFile = (file: File) => {
    resetState();
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        let rows: ParsedRow[];
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          rows = Array.isArray(parsed) ? parsed : [parsed];
        } else {
          const cells = parseCSV(text);
          rows = rowsToObjects(cells);
        }
        if (rows.length === 0) {
          setParseError('File is empty or has no data rows.');
          return;
        }
        // Validate required columns
        const requiredKeys = columns.filter((c) => c.required).map((c) => c.key);
        const fileKeys = Object.keys(rows[0]).map((k) => k.toLowerCase());
        const missing = requiredKeys.filter((k) => !fileKeys.includes(k));
        if (missing.length > 0) {
          setParseError(`Missing required columns: ${missing.join(', ')}`);
          return;
        }
        setPreview(rows);
      } catch {
        setParseError('Could not parse file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setImporting(true);
    setImportErrors([]);
    try {
      const errors = await onImport(preview);
      if (errors.length === 0) {
        setDone(true);
        setTimeout(() => resetState(), 2500);
      } else {
        setImportErrors(errors);
      }
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-400 hover:text-gray-200 bg-gray-900 border border-gray-700 hover:border-gray-600 rounded-lg transition-colors"
        aria-label={label}
      >
        <Upload className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {/* Preview / Error Modal */}
      {(preview || parseError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={resetState}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[80vh] bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 flex-shrink-0">
              <div className="flex items-center gap-2 text-gray-200">
                <FileSpreadsheet className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-sm">Import Preview</span>
                {preview && (
                  <span className="px-2 py-0.5 bg-indigo-600/20 text-indigo-400 rounded-full text-xs">
                    {preview.length} rows
                  </span>
                )}
              </div>
              <button
                onClick={resetState}
                className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-6 py-4">
              {parseError && (
                <div className="flex items-start gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Parse Error</p>
                    <p className="text-xs mt-1 text-rose-400/80">{parseError}</p>
                    <p className="text-xs mt-2 text-gray-500">
                      Expected columns: {columns.map((c) => c.label).join(', ')}
                    </p>
                  </div>
                </div>
              )}

              {done && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Import successful! {preview?.length} records created.</span>
                </div>
              )}

              {importErrors.length > 0 && (
                <div className="mb-4 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl">
                  <p className="text-xs font-medium text-rose-400 mb-2">
                    {importErrors.length} error{importErrors.length > 1 ? 's' : ''} occurred:
                  </p>
                  <ul className="space-y-1 max-h-24 overflow-y-auto">
                    {importErrors.map((err, i) => (
                      <li key={i} className="text-xs text-rose-400/80">
                        {err}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {preview && !done && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {columns.map((col) => (
                          <th
                            key={col.key}
                            className="px-3 py-2 text-left text-gray-500 font-medium uppercase tracking-wider"
                          >
                            {col.label}
                            {col.required && (
                              <span className="ml-1 text-rose-400">*</span>
                            )}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/60">
                      {preview.slice(0, 50).map((row, i) => (
                        <tr key={i} className="hover:bg-gray-800/30 transition-colors">
                          {columns.map((col) => (
                            <td key={col.key} className="px-3 py-2 text-gray-400 max-w-[180px] truncate">
                              {row[col.key] || row[col.key.toLowerCase()] || (
                                <span className="text-gray-700 italic">empty</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {preview.length > 50 && (
                    <p className="mt-3 text-center text-xs text-gray-600">
                      Showing first 50 of {preview.length} rows
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {preview && !done && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-800 flex-shrink-0">
                <p className="text-xs text-gray-500">
                  {preview.length} record{preview.length > 1 ? 's' : ''} will be imported
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={resetState}
                    className="px-4 py-2 text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={importing}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {importing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {importing ? 'Importing…' : `Import ${preview.length} records`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
