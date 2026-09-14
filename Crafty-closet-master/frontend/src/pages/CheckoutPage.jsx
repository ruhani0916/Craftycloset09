// frontend/src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { orderAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { formatPrice, imgSrc, PLACEHOLDER } from '../utils/helpers';
import toast from 'react-hot-toast';

const PAYMENT = [
  { id:'cod',  icon:'💵', label:'Cash on Delivery',   sub:'Pay when your order arrives' },
  { id:'upi',  icon:'📱', label:'UPI / QR Code',      sub:'PhonePe, GPay, Paytm ' },
  { id:'card', icon:'💳', label:'Credit / Debit Card', sub:'All major cards ' },
];

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, subtotal, fetchCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    shipping_name:    user?.name  || '',
    shipping_email:   user?.email || '',
    shipping_phone:   '',
    shipping_address: '',
    payment_method:   'cod',
    notes:            '',
  });
  const [errors,  setErrors]  = useState({});
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(null);

  if (!user)       return <div className="flex flex-col items-center justify-center py-24 gap-4"><div className="text-5xl">🔒</div><p className="font-semibold text-rose-700">Please sign in to checkout</p><Link to="/login" className="btn-primary">Sign In</Link></div>;
  if (!items.length && !success) return <div className="flex flex-col items-center justify-center py-24 gap-4"><div className="text-5xl">🛍️</div><p className="font-semibold text-rose-700">Your cart is empty</p><Link to="/shop" className="btn-primary">Shop Now</Link></div>;

  const setF = k => e => { setForm(f => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors(er => ({ ...er, [k]:'' })); };

  const validate = () => {
    const e = {};
    if (!form.shipping_name.trim())    e.shipping_name    = 'Name is required';
    if (!form.shipping_phone.trim())   e.shipping_phone   = 'Phone is required';
    if (!form.shipping_address.trim()) e.shipping_address = 'Address is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const { data } = await orderAPI.place(form);
      await fetchCart();
      setSuccess(data.order);
    } catch (err) { toast.error(err.message); }
    finally { setPlacing(false); }
  };

  // Success screen
  if (success) return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-gradient-to-br from-rose-50 to-sand">
      <div className="card p-10 max-w-md w-full text-center shadow-rose-lg animate-scale-in">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <CheckCircle size={36} className="text-emerald-500" />
        </div>
        <h2 className="font-display text-2xl font-bold text-rose-900 mb-2">Order Placed! 🎉</h2>
        <p className="text-rose-400 text-sm mb-2">Your jewellery is on its way ✨</p>
        <p className="text-rose-300 text-xs mb-5">A confirmation email has been sent to your inbox.</p>
        <div className="bg-rose-50 rounded-xl p-4 mb-6 text-sm">
          <div className="text-rose-400 text-xs mb-1">Order Number</div>
          <div className="font-bold text-rose-800 font-mono">{success.order_number}</div>
          <div className="text-rose-400 text-xs mt-2 mb-1">Total</div>
          <div className="font-bold text-rose-700 text-lg">{formatPrice(success.total)}</div>
        </div>
        <div className="flex gap-3">
          <Link to="/orders" className="btn-primary flex-1 justify-center">View Orders</Link>
          <Link to="/shop"   className="btn-outline flex-1 justify-center">Shop More</Link>
        </div>
      </div>
    </div>
  );

  const Field = ({ label, name, required, as: As = 'input', ...rest }) => (
    <div>
      <label className="form-label">{label}{required && ' *'}</label>
      {As === 'textarea'
        ? <textarea className={`form-input ${errors[name]?'border-red-400':''}`} value={form[name]} onChange={setF(name)} rows={3} {...rest} />
        : <input    className={`form-input ${errors[name]?'border-red-400':''}`} value={form[name]} onChange={setF(name)} {...rest} />
      }
      {errors[name] && <p className="form-error">{errors[name]}</p>}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-rose-900 mb-8">Checkout</h1>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left */}
        <div className="lg:col-span-3 space-y-6">
          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-rose-900 mb-5 pb-4 border-b border-rose-100">📦 Shipping Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Full Name"         name="shipping_name"    required placeholder="Priya Sharma" />
              <Field label="Email"             name="shipping_email"            placeholder="priya@email.com" type="email" />
              <Field label="Phone Number"      name="shipping_phone"   required placeholder="+91 98765 43210" className="sm:col-span-2 form-input" />
              <Field label="Delivery Address"  name="shipping_address" required as="textarea" placeholder="House no, Street, City, State — PIN" className="sm:col-span-2" />
              <Field label="Order Notes"       name="notes"                     as="textarea" placeholder="Special instructions… (optional)" className="sm:col-span-2" />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-display font-semibold text-lg text-rose-900 mb-5 pb-4 border-b border-rose-100">💳 Payment Method</h3>
            <div className="space-y-3">
              {PAYMENT.map(p => (
                <label key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${form.payment_method===p.id?'border-rose-400 bg-rose-50':'border-rose-100 hover:border-rose-200'}`}>
                  <input type="radio" name="pay" value={p.id} checked={form.payment_method===p.id} onChange={() => setForm(f=>({...f,payment_method:p.id}))} className="accent-rose-500" />
                  <span className="text-2xl">{p.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-rose-800">{p.label}</div>
                    <div className="text-xs text-rose-400">{p.sub}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="lg:col-span-2">
          <div className="card p-6 sticky top-24">
            <h3 className="font-display font-semibold text-lg text-rose-900 mb-5 pb-4 border-b border-rose-100">🧾 Order Summary</h3>
            <div className="space-y-3 mb-5">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <img src={imgSrc(item.image)} alt={item.name}
                    className="w-12 h-12 rounded-xl object-cover bg-rose-50 shrink-0"
                    onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-rose-800 line-clamp-1">{item.name}</div>
                    <div className="text-xs text-rose-400">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-bold text-sm text-rose-700 shrink-0">{formatPrice(item.price*item.quantity)}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-rose-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-rose-400">Subtotal</span><span>{formatPrice(subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-rose-400">Shipping</span><span className="text-emerald-600 font-medium">FREE</span></div>
              <div className="flex justify-between font-bold text-base pt-2 border-t border-rose-100">
                <span>Total</span><span className="text-rose-700">{formatPrice(subtotal)}</span>
              </div>
            </div>
            <button onClick={placeOrder} disabled={placing} className="btn-primary w-full mt-5">
              {placing ? 'Placing order…' : 'Place Order 💎'}
            </button>
            <p className="text-center text-xs text-rose-300 mt-3">🔒 Simulated checkout — no real payment</p>
          </div>
        </div>
      </div>
    </div>
  );
}
