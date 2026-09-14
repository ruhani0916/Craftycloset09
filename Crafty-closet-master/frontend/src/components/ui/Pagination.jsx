// frontend/src/components/ui/Pagination.jsx
import { ChevronLeft, ChevronRight } from 'lucide-react';
export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const range = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 2 && i <= page + 2)) range.push(i);
    else if (range[range.length - 1] !== '…') range.push('…');
  }
  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button onClick={() => onChange(page - 1)} disabled={page <= 1}
        className="p-2 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronLeft size={16} />
      </button>
      {range.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-1 text-rose-300 text-sm">…</span>
        ) : (
          <button key={p} onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
              p === page ? 'bg-rose-600 text-white shadow-rose-sm' : 'border border-rose-200 text-rose-600 hover:bg-rose-50'
            }`}>
            {p}
          </button>
        )
      )}
      <button onClick={() => onChange(page + 1)} disabled={page >= pages}
        className="p-2 rounded-full border border-rose-200 text-rose-500 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed">
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
