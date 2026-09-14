// frontend/src/pages/CartPage.jsx
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { cartAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import { formatPrice, imgSrc, PLACEHOLDER } from '../utils/helpers';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, loading, fetchCart } = useCart();
  const navigate = useNavigate();

  if (!user) return <EmptyState icon="🔒" title="Sign in to view your cart" description="Please sign in to access your shopping cart" action={{ to:'/login', label:'Sign In' }} />;
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;

  const changeQty = async (id, qty) => {
    try {
      if (qty < 1) await cartAPI.remove(id);
      else await cartAPI.update(id, { quantity: qty });
      await fetchCart();
    } catch (err) { toast.error(err.message); }
  };

  const remove = async (id) => {
    try { await cartAPI.remove(id); await fetchCart(); toast.success('Item removed'); }
    catch (err) { toast.error(err.message); }
  };

  const clearAll = async () => {
    if (!confirm('Clear your entire cart?')) return;
    try { await cartAPI.clear(); await fetchCart(); toast.success('Cart cleared'); }
    catch (err) { toast.error(err.message); }
  };

  if (!items.length) return <EmptyState icon="🛍️" title="Your cart is empty" description="Browse our collection and add items you love" action={{ to:'/shop', label:'Start Shopping' }} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display text-3xl font-bold text-rose-900">
          Shopping Cart <span className="text-rose-400 font-normal text-xl">({items.length})</span>
        </h1>
        <button onClick={clearAll} className="text-sm text-red-400 hover:text-red-600 flex items-center gap-1.5 transition-colors">
          <Trash2 size={14} /> Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="card p-4 flex gap-4">
              <Link to={`/products/${item.product_id}`} className="shrink-0">
                <img src={imgSrc(item.image)} alt={item.name}
                  className="w-20 h-20 object-cover rounded-xl bg-rose-50"
                  onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-2 mb-1">
                  <Link to={`/products/${item.product_id}`} className="font-semibold text-sm text-rose-800 hover:text-rose-600 line-clamp-2">{item.name}</Link>
                  <button onClick={() => remove(item.id)} className="text-rose-200 hover:text-red-500 transition-colors shrink-0"><Trash2 size={15} /></button>
                </div>
                <div className="text-xs text-rose-400 capitalize mb-3">{item.category}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 border border-rose-200 rounded-full px-2 py-1">
                    <button onClick={() => changeQty(item.id, item.quantity-1)} className="p-0.5 text-rose-400 hover:text-rose-600"><Minus size={12} /></button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button onClick={() => changeQty(item.id, item.quantity+1)} disabled={item.quantity>=item.stock} className="p-0.5 text-rose-400 hover:text-rose-600 disabled:opacity-40"><Plus size={12} /></button>
                  </div>
                  <span className="font-bold text-rose-700 text-sm">{formatPrice(item.price * item.quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="card p-6 sticky top-24">
          <h3 className="font-display font-semibold text-lg text-rose-900 mb-5">Order Summary</h3>
          <div className="space-y-2.5 text-sm mb-5">
            {items.map(i => (
              <div key={i.id} className="flex justify-between text-rose-600">
                <span className="line-clamp-1 flex-1 mr-3">{i.name} ×{i.quantity}</span>
                <span className="font-medium shrink-0">{formatPrice(i.price*i.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-rose-100 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-rose-500">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-rose-500">Shipping</span><span className="text-emerald-600 font-medium">FREE</span></div>
            <div className="flex justify-between font-bold text-base pt-2 border-t border-rose-100">
              <span>Total</span><span className="text-rose-700">{formatPrice(subtotal)}</span>
            </div>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-5 gap-2">
            Proceed to Checkout <ArrowRight size={15} />
          </button>
          <Link to="/shop" className="btn-ghost w-full mt-2 justify-center text-sm">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
