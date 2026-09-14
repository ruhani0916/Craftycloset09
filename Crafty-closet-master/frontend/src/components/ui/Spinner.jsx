// frontend/src/components/ui/Spinner.jsx
export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm:'w-5 h-5 border-2', md:'w-9 h-9 border-[3px]', lg:'w-14 h-14 border-4' };
  return <div className={`${s[size]} border-rose-200 border-t-rose-500 rounded-full animate-spin ${className}`} />;
}
