// frontend/src/components/ui/Modal.jsx
import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/50 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl shadow-rose-lg w-full ${maxWidth} max-h-[90vh] overflow-y-auto animate-scale-in`}>
        <div className="flex items-center justify-between p-6 border-b border-rose-100">
          <h2 className="font-display text-xl font-semibold text-rose-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-full text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
