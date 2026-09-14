// frontend/src/components/shop/ProductCardSkeleton.jsx
export default function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden animate-pulse">
      <div className="aspect-square bg-rose-100" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 bg-rose-100 rounded w-1/4" />
        <div className="h-4 bg-rose-100 rounded w-5/6" />
        <div className="h-3 bg-rose-100 rounded w-1/3" />
        <div className="h-4 bg-rose-100 rounded w-1/4" />
        <div className="h-9 bg-rose-100 rounded-full mt-1" />
      </div>
    </div>
  );
}
