// frontend/src/pages/ProductDetailPage.jsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronRight, Minus, Plus } from 'lucide-react';
import { productAPI, cartAPI, wishlistAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/shop/ProductCard';
import Spinner from '../components/ui/Spinner';
import { formatPrice, imgSrc, renderStars, PLACEHOLDER } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const navigate = useNavigate();

  const [product,   setProduct]   = useState(null);
  const [ratings,   setRatings]   = useState([]);
  const [related,   setRelated]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [qty,       setQty]       = useState(1);
  const [wl,        setWl]        = useState(false);
  const [addingCart, setAddingCart] = useState(false);
  const [myStars,   setMyStars]   = useState(0);
  const [myReview,  setMyReview]  = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data } = await productAPI.getOne(id);
      setProduct(data.product);
      setRatings(data.ratings || []);
      document.title = `${data.product.name} — Crafty Closet`;

      const relRes = await productAPI.getAll({ category: data.product.category, limit: 5 });
      setRelated((relRes.data.products || []).filter(p => p.id !== data.product.id).slice(0, 4));

      if (user) {
        const wRes = await wishlistAPI.get();
        setWl((wRes.data.items || []).some(i => i.product_id === data.product.id));
      }
    } catch { navigate('/shop'); }
    finally { setLoading(false); }
  };

  useEffect(() => { window.scrollTo({ top: 0 }); loadProduct(); }, [id, user]);

  const addToCart = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    setAddingCart(true);
    try {
      await cartAPI.add({ product_id: product.id, quantity: qty });
      await fetchCart();
      toast.success('Added to cart 🛍️');
    } catch (err) { toast.error(err.message); }
    finally { setAddingCart(false); }
  };

  const toggleWl = async () => {
    if (!user) { toast.error('Please sign in'); return; }
    try {
      if (wl) { await wishlistAPI.remove(product.id); setWl(false); toast.success('Removed from wishlist'); }
      else    { await wishlistAPI.add(product.id);    setWl(true);  toast.success('Added to wishlist ❤️'); }
    } catch (err) { toast.error(err.message); }
  };

  const submitRating = async () => {
    if (!myStars) { toast.error('Please select a star rating'); return; }
    setSubmitting(true);
    try {
      await productAPI.rate(product.id, { stars: myStars, review: myReview });
      toast.success('Review submitted! 💎');
      await loadProduct();
      setMyStars(0); setMyReview('');
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!product) return null;

  const stockStatus = product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : 'ok';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-rose-400 mb-8 flex-wrap">
        <Link to="/" className="hover:text-rose-600">Home</Link>
        <ChevronRight size={12} />
        <Link to="/shop" className="hover:text-rose-600">Shop</Link>
        <ChevronRight size={12} />
        <Link to={`/shop?category=${product.category}`} className="hover:text-rose-600 capitalize">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-rose-700 font-medium line-clamp-1">{product.name}</span>
      </nav>

      {/* Product grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="rounded-2xl overflow-hidden aspect-square bg-rose-50">
          <img src={imgSrc(product.image)} alt={product.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
        </div>

        <div>
          <div className="text-xs font-bold text-rose-400 uppercase tracking-widest mb-2 capitalize">{product.category}</div>
          <h1 className="font-display text-3xl font-bold text-rose-900 mb-3 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-amber-400">{renderStars(product.rating)}</span>
            <span className="text-sm text-rose-400">({product.rating_count} reviews)</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-display text-3xl font-bold text-rose-700">{formatPrice(product.price)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <span className="text-rose-300 text-lg line-through">{formatPrice(product.compare_price)}</span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-5 text-sm">
            <span className={`w-2 h-2 rounded-full ${stockStatus==='ok'?'bg-emerald-500':stockStatus==='low'?'bg-amber-400':'bg-red-500'}`} />
            <span className={stockStatus==='ok'?'text-emerald-700':stockStatus==='low'?'text-amber-600':'text-red-600'}>
              {stockStatus==='ok'?`In Stock (${product.stock})`:stockStatus==='low'?`Only ${product.stock} left!`:'Out of Stock'}
            </span>
          </div>
          <p className="text-rose-500 text-sm leading-relaxed mb-7">{product.description || 'No description available.'}</p>

          {product.stock > 0 && (
            <div className="flex items-center gap-4 mb-6">
              <span className="form-label mb-0">Qty:</span>
              <div className="flex items-center gap-2 border border-rose-200 rounded-full px-2 py-1">
                <button onClick={() => setQty(q => Math.max(1, q-1))} className="p-1 text-rose-400 hover:text-rose-600"><Minus size={14} /></button>
                <span className="w-7 text-center font-bold text-sm">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))} className="p-1 text-rose-400 hover:text-rose-600"><Plus size={14} /></button>
              </div>
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button onClick={addToCart} disabled={product.stock===0||addingCart} className="btn-primary text-sm px-6 py-2.5 gap-2 flex-1 sm:flex-none">
              <ShoppingBag size={16} />
              {addingCart ? 'Adding…' : product.stock===0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button onClick={toggleWl} className={`btn-outline text-sm px-6 py-2.5 gap-2 ${wl?'bg-rose-100':''}`}>
              <Heart size={15} fill={wl?'currentColor':'none'} />
              {wl ? 'Wishlisted' : 'Wishlist'}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-rose-100 pt-12 mb-16">
        <h2 className="font-display text-2xl font-bold text-rose-900 mb-8">Reviews</h2>
        {user ? (
          <div className="card p-6 mb-8">
            <h3 className="font-semibold text-rose-800 mb-4">Write a Review</h3>
            <div className="flex gap-1 mb-4">
              {[1,2,3,4,5].map(s => (
                <button key={s} onClick={() => setMyStars(s)}
                  className={`text-3xl transition-colors ${s<=myStars?'text-amber-400':'text-rose-200 hover:text-amber-300'}`}>
                  <Star size={26} fill={s<=myStars?'currentColor':'none'} />
                </button>
              ))}
            </div>
            <textarea className="form-input mb-4" rows={3} placeholder="Share your experience…"
              value={myReview} onChange={e => setMyReview(e.target.value)} />
            <button onClick={submitRating} disabled={submitting} className="btn-primary">
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8 text-center text-sm text-rose-600">
            <Link to="/login" className="font-semibold text-rose-700 hover:underline">Sign in</Link> to leave a review
          </div>
        )}
        {ratings.length === 0 ? (
          <p className="text-rose-400 text-sm">No reviews yet. Be the first!</p>
        ) : (
          <div className="space-y-4">
            {ratings.map((r, i) => (
              <div key={i} className="card p-5">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm text-rose-800">{r.reviewer}</span>
                  <span className="text-xs text-rose-300">{new Date(r.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}</span>
                </div>
                <div className="text-amber-400 text-sm mb-2">{renderStars(r.stars)}</div>
                {r.review && <p className="text-rose-500 text-sm leading-relaxed">{r.review}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="border-t border-rose-100 pt-12">
          <h2 className="font-display text-2xl font-bold text-rose-900 mb-7">You May Also Like</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
