// frontend/src/components/shop/ProductCard.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Eye } from 'lucide-react';
import { cartAPI, wishlistAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { formatPrice, imgSrc, renderStars, PLACEHOLDER } from '../../utils/helpers';
import toast from 'react-hot-toast';

export default function ProductCard({ product, wishlisted = false, onWishlistChange }) {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const [wl,         setWl]         = useState(wishlisted);
  const [addingCart, setAddingCart] = useState(false);

  const discount = product.compare_price && product.compare_price > product.price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : null;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in to add items to cart'); return; }
    if (product.stock === 0) return;
    setAddingCart(true);
    try {
      await cartAPI.add({ product_id: product.id, quantity: 1 });
      await fetchCart();
      toast.success('Added to cart 🛍️');
    } catch (err) { toast.error(err.message); }
    finally { setAddingCart(false); }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please sign in first'); return; }
    try {
      if (wl) {
        await wishlistAPI.remove(product.id);
        setWl(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setWl(true);
        toast.success('Saved to wishlist ❤️');
      }
      onWishlistChange?.();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="group bg-white rounded-2xl border border-rose-100 overflow-hidden shadow-rose-sm hover:shadow-rose-lg hover:-translate-y-1.5 transition-all duration-300">
      {/* Image */}
      <div className="relative overflow-hidden aspect-square bg-rose-50">
        <Link to={`/products/${product.id}`}>
          <img
            src={imgSrc(product.image)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER; }}
          />
        </Link>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {product.stock === 0 && (
            <span className="bg-rose-900/80 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Sold Out</span>
          )}
          {discount && product.stock > 0 && (
            <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">−{discount}%</span>
          )}
          {!discount && product.rating_count > 30 && product.stock > 0 && (
            <span className="bg-amber-400 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ Popular</span>
          )}
        </div>

        {/* Hover actions */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
          <button
            onClick={handleWishlist}
            className={`w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center transition-colors ${
              wl ? 'text-rose-600' : 'text-rose-300 hover:text-rose-500'
            }`}
            title={wl ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={14} fill={wl ? 'currentColor' : 'none'} />
          </button>
          <Link
            to={`/products/${product.id}`}
            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-rose-400 hover:text-rose-600 transition-colors"
            title="View product"
          >
            <Eye size={14} />
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1 capitalize">{product.category}</div>
        <Link to={`/products/${product.id}`}>
          <h3 className="font-display font-semibold text-rose-900 text-[15px] leading-snug mb-2 line-clamp-2 hover:text-rose-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1.5 mb-2.5">
          <span className="text-amber-400 text-xs">{renderStars(product.rating)}</span>
          <span className="text-[11px] text-rose-300">({product.rating_count})</span>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-rose-700 font-bold text-base">{formatPrice(product.price)}</span>
          {product.compare_price && product.compare_price > product.price && (
            <span className="text-rose-300 text-xs line-through">{formatPrice(product.compare_price)}</span>
          )}
        </div>
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || addingCart}
          className="w-full btn-primary py-2 text-xs gap-1.5"
        >
          <ShoppingBag size={13} />
          {addingCart ? 'Adding…' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
