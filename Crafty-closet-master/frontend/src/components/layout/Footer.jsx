// frontend/src/components/layout/Footer.jsx
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-rose-950 text-rose-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-8 border-b border-rose-800 mb-6">
          <div className="col-span-2 md:col-span-1">
            <div className="font-display text-xl font-bold text-rose-300 mb-3">💎 Crafty Closet</div>
            <p className="text-sm text-rose-500 leading-relaxed">Affordable luxury jewellery & accessories for every girl who loves to shine.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-rose-200 mb-4">Shop</h4>
            <ul className="space-y-2">
              {['earrings','necklaces','rings','bracelets','sets'].map(c => (
                <li key={c}><Link to={`/shop?category=${c}`} className="text-sm text-rose-500 hover:text-rose-200 transition-colors capitalize">{c}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-rose-200 mb-4">Account</h4>
            <ul className="space-y-2">
              {[
                { to:'/login',    label:'Login / Register' },
                { to:'/orders',   label:'My Orders' },
                { to:'/wishlist', label:'Wishlist' },
                { to:'/cart',     label:'Cart' },
              ].map(i => (
                <li key={i.to}><Link to={i.to} className="text-sm text-rose-500 hover:text-rose-200 transition-colors">{i.label}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-rose-200 mb-4">Info</h4>
            <ul className="space-y-2 text-sm text-rose-500">
              <li>Free shipping on all orders</li>
              <li>Easy 7-day returns</li>
              <li>Secure payments</li>
              <li className="pt-1">📧 avu0000001@gmail.com</li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-rose-600">© 2026 Crafty Closet. All rights reserved.</p>
          <p className="text-xs text-rose-600">Made with 💎 &amp; love.</p>
        </div>
      </div>
    </footer>
  );
}
