'use client';

import { Download } from 'lucide-react';
import { exportToCSV, flattenForExport } from '@/lib/export';

interface ExportButtonProps<T extends object> {
  data: T[];
  filename: string;
  label?: string;
}

export default function ExportButton<T extends object>({ data, filename, label = 'Export CSV' }: ExportButtonProps<T>) {
  const handleExport = () => {
    const flat = data.map((row) => flattenForExport(row as Record<string, unknown>));
    exportToCSV(flat, filename);
  };

  return (
    <button
      onClick={handleExport}
      disabled={data.length === 0}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-700 hover:border-gray-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Download size={13} />
      {label}
    </button>
  );
}
