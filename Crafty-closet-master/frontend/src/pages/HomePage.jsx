// frontend/src/pages/HomePage.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { productAPI, wishlistAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/shop/ProductCard';
import ProductCardSkeleton from '../components/shop/ProductCardSkeleton';
import { catIcon } from '../utils/helpers';

export default function HomePage() {
  const { user } = useAuth();
  const [newest,   setNewest]   = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [cats,     setCats]     = useState([]);
  const [wishSet,  setWishSet]  = useState(new Set());
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [nRes, tRes, cRes] = await Promise.all([
          productAPI.getAll({ sort: 'newest',      limit: 8 }),
          productAPI.getAll({ sort: 'rating_desc', limit: 4 }),
          productAPI.getCategories(),
        ]);
        setNewest(nRes.data.products   || []);
        setTopRated(tRes.data.products || []);
        setCats(cRes.data.categories   || []);

        if (user) {
          const wRes = await wishlistAPI.get();
          setWishSet(new Set((wRes.data.items || []).map(i => i.product_id)));
        }
      } catch {}
      finally { setLoading(false); }
    })();
  }, [user]);

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-100 via-peach to-sand py-24 px-4">
        <div className="absolute w-[500px] h-[500px] rounded-full bg-rose-200/25 -top-40 -right-24 pointer-events-none" />
        <div className="absolute w-72 h-72 rounded-full bg-rose-300/15 -bottom-20 -left-16 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest mb-6">
            <Sparkles size={11} /> New Arrivals Every Week
          </span>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-rose-900 mb-5 leading-tight">
            Your Style,<br />Your <em className="italic text-rose-600">Story</em>
          </h1>
          <p className="text-rose-500 text-lg mb-8 max-w-lg mx-auto leading-relaxed">
            Discover handpicked artificial jewellery &amp; accessories — made to make you shine every day.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/shop" className="btn-primary text-base px-7 py-3 gap-2">
              Shop Collection <ArrowRight size={16} />
            </Link>
            <Link to="/shop?category=sets" className="btn-outline text-base px-7 py-3">
              View Gift Sets
            </Link>
          </div>
        </div>
      </section>

      {/* ── Category strip ───────────────────────────────────── */}
      <section className="bg-white border-y border-rose-100 py-5 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 flex gap-3 min-w-max">
          <Link to="/shop"
            className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-rose-600 text-white min-w-[80px] hover:bg-rose-700 transition-colors shrink-0"
          >
            <span className="text-2xl">🛍️</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">All</span>
          </Link>
          {cats.map(c => (
            <Link key={c.category} to={`/shop?category=${c.category}`}
              className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl bg-rose-50 border border-rose-100 min-w-[80px] hover:bg-rose-100 hover:border-rose-300 transition-colors shrink-0"
            >
              <span className="text-2xl">{catIcon(c.category)}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">{c.category}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Content ──────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-16">

        {/* Featured banner */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-rose-600 to-rose-800 p-8 md:p-12 text-white">
          <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[130px] opacity-10 leading-none pointer-events-none select-none">💎</div>
          <div className="relative max-w-sm">
            <div className="text-xs font-bold uppercase tracking-[.15em] text-rose-300 mb-2">Featured Collection</div>
            <h2 className="font-display text-3xl font-bold mb-2">Bridal &amp; Gift Sets</h2>
            <p className="text-rose-200 mb-6 text-sm leading-relaxed">Gift-boxed sets perfect for every special occasion</p>
            <Link to="/shop?category=sets"
              className="inline-flex items-center gap-2 bg-white text-rose-700 font-bold text-sm px-5 py-2.5 rounded-full hover:bg-rose-50 transition-colors">
              Shop Sets <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* New Arrivals */}
        <section>
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="font-display text-3xl font-bold text-rose-900">New Arrivals 💎</h2>
              <p className="text-rose-400 text-sm mt-1">Fresh styles added weekly</p>
            </div>
            <Link to="/shop" className="btn-ghost text-sm gap-1">View all <ArrowRight size={14} /></Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newest.map(p => <ProductCard key={p.id} product={p} wishlisted={wishSet.has(p.id)} />)
            }
          </div>
          <div className="text-center mt-8">
            <Link to="/shop" className="btn-outline">View All Products →</Link>
          </div>
        </section>

        {/* Top Rated */}
        <section>
          <div className="flex items-end justify-between mb-7">
            <div>
              <h2 className="font-display text-3xl font-bold text-rose-900">Customer Favourites ⭐</h2>
              <p className="text-rose-400 text-sm mt-1">Loved by thousands of happy customers</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : topRated.map(p => <ProductCard key={p.id} product={p} wishlisted={wishSet.has(p.id)} />)
            }
          </div>
        </section>

        {/* Newsletter */}
        <section className="rounded-3xl bg-gradient-to-br from-rose-100 to-peach p-10 text-center">
          <h2 className="font-display text-3xl font-bold text-rose-900 mb-2">Stay in the Loop 💌</h2>
          <p className="text-rose-400 text-sm mb-6">Subscribe for new arrivals, exclusive deals &amp; styling tips</p>
          <div className="flex gap-3 max-w-sm mx-auto">
            <input type="email" placeholder="your@email.com" className="form-input rounded-full flex-1" />
            <button
              onClick={() => { const el = document.querySelector('input[type=email]'); if (el?.value) { el.value = ''; alert('Subscribed! (Demo)'); } }}
              className="btn-primary whitespace-nowrap"
            >Subscribe</button>
          </div>
        </section>
      </div>
    </>
  );
}
