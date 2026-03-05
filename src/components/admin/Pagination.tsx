'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  from?: number;
  to?: number;
  total?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  goTo?: (p: number) => void;
  onGoTo?: (p: number) => void;
  next?: () => void;
  prev?: () => void;
}

export default function Pagination({ page, totalPages, from = 0, to = 0, total = 0, hasNext, hasPrev, goTo: goProp, onGoTo, next: nextProp, prev: prevProp }: PaginationProps) {
  const goTo = goProp ?? onGoTo ?? (() => {});
  const next = nextProp ?? (() => goTo(page + 1));
  const prev = prevProp ?? (() => goTo(page - 1));
  const canNext = hasNext ?? page < totalPages;
  const canPrev = hasPrev ?? page > 1;
  if (totalPages <= 1 && total === 0) return null;

  const pages = buildPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800 bg-gray-900/50">
      <p className="text-xs text-gray-500">
        {total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <NavBtn onClick={() => goTo(1)} disabled={!canPrev} title="First">
          <ChevronsLeft size={14} />
        </NavBtn>
        <NavBtn onClick={prev} disabled={!canPrev} title="Previous">
          <ChevronLeft size={14} />
        </NavBtn>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-gray-600 text-sm select-none">…</span>
          ) : (
            <button
              key={p}
              onClick={() => goTo(Number(p))}
              className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {p}
            </button>
          )
        )}
        <NavBtn onClick={next} disabled={!canNext} title="Next">
          <ChevronRight size={14} />
        </NavBtn>
        <NavBtn onClick={() => goTo(totalPages)} disabled={!canNext} title="Last">
          <ChevronsRight size={14} />
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({ onClick, disabled, title, children }: { onClick: () => void; disabled: boolean; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [];
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, '...', total);
  } else if (current >= total - 3) {
    pages.push(1, '...', total - 4, total - 3, total - 2, total - 1, total);
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total);
  }
  return pages;
}
