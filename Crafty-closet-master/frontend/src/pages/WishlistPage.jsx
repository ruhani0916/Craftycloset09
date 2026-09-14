// frontend/src/pages/WishlistPage.jsx
import { useState, useEffect } from 'react';
import { wishlistAPI } from '../api/services';
import ProductCard from '../components/shop/ProductCard';
import ProductCardSkeleton from '../components/shop/ProductCardSkeleton';
import EmptyState from '../components/ui/EmptyState';

export default function WishlistPage() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    wishlistAPI.get()
      .then(r => setItems(r.data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)}
      </div>
    </div>
  );

  if (!items.length) return (
    <EmptyState icon="❤️" title="Your wishlist is empty" description="Save products you love by clicking the heart icon" action={{ to:'/shop', label:'Browse Shop' }} />
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-rose-900 mb-8">
        My Wishlist ❤️
        <span className="text-rose-400 font-normal text-xl ml-3">({items.length})</span>
      </h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map(item => (
          <ProductCard
            key={item.product_id}
            product={{ ...item, id: item.product_id }}
            wishlisted={true}
            onWishlistChange={load}
          />
        ))}
      </div>
    </div>
  );
}
