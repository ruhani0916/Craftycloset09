// frontend/src/pages/ShopPage.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { productAPI, wishlistAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/shop/ProductCard';
import ProductCardSkeleton from '../components/shop/ProductCardSkeleton';
import Pagination from '../components/ui/Pagination';
import EmptyState from '../components/ui/EmptyState';
import { catIcon, debounce } from '../utils/helpers';

const SORT_OPTIONS = [
  { value:'newest',      label:'Newest First' },
  { value:'price_asc',   label:'Price: Low → High' },
  { value:'price_desc',  label:'Price: High → Low' },
  { value:'rating_desc', label:'Top Rated' },
  { value:'popular',     label:'Most Popular' },
];
const CATEGORIES = ['earrings','necklaces','rings','bracelets','anklets','hairclips','bangles','sets'];

export default function ShopPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products,   setProducts]   = useState([]);
  const [pagination, setPagination] = useState({ total:0, page:1, pages:1 });
  const [cats,       setCats]       = useState([]);
  const [wishSet,    setWishSet]    = useState(new Set());
  const [loading,    setLoading]    = useState(true);
  const [sideOpen,   setSideOpen]   = useState(false);

  const [filters, setFilters] = useState({
    search:      searchParams.get('search')   || '',
    category:    searchParams.get('category') || '',
    minPrice:    searchParams.get('minPrice') || '',
    maxPrice:    searchParams.get('maxPrice') || '',
    sort:        searchParams.get('sort')     || 'newest',
    page:        parseInt(searchParams.get('page') || '1'),
  });

  const searchRef = useRef(filters.search);

  // Sync filters → URL
  useEffect(() => {
    const p = {};
    if (filters.search)   p.search   = filters.search;
    if (filters.category) p.category = filters.category;
    if (filters.minPrice) p.minPrice = filters.minPrice;
    if (filters.maxPrice) p.maxPrice = filters.maxPrice;
    if (filters.sort !== 'newest') p.sort = filters.sort;
    if (filters.page > 1) p.page = filters.page;
    setSearchParams(p, { replace: true });
  }, [filters]);

  // Load categories + wishlist once
  useEffect(() => {
    productAPI.getCategories().then(r => setCats(r.data.categories || [])).catch(() => {});
    if (user) {
      wishlistAPI.get().then(r => setWishSet(new Set((r.data.items || []).map(i => i.product_id)))).catch(() => {});
    }
  }, [user]);

  // Load products on filter change
  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.search)   params.search   = filters.search;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    params.sort  = filters.sort;
    params.page  = filters.page;
    params.limit = 12;

    productAPI.getAll(params)
      .then(r => {
        setProducts(r.data.products   || []);
        setPagination(r.data.pagination || { total:0, page:1, pages:1 });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters]);

  const setF = (key, value) =>
    setFilters(f => ({ ...f, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));

  const debouncedSearch = useCallback(debounce((v) => setF('search', v), 450), []);

  const reset = () => {
    searchRef.current = '';
    setFilters({ search:'', category:'', minPrice:'', maxPrice:'', sort:'newest', page:1 });
  };

  const hasFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice;

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <p className="form-label mb-3">Categories</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="cat" value="" checked={!filters.category}
              onChange={() => setF('category', '')} className="accent-rose-500" />
            <span className="text-sm text-rose-700">All Categories</span>
          </label>
          {cats.map(c => (
            <label key={c.category} className="flex items-center gap-2.5 cursor-pointer">
              <input type="radio" name="cat" value={c.category} checked={filters.category === c.category}
                onChange={() => setF('category', c.category)} className="accent-rose-500" />
              <span className="text-sm text-rose-700 flex-1 capitalize">{catIcon(c.category)} {c.category}</span>
              <span className="text-xs text-rose-300">{c.count}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price */}
      <div>
        <p className="form-label mb-3">Price Range (₹)</p>
        <div className="flex gap-2 items-center">
          <input type="number" placeholder="Min" min="0" className="form-input text-sm py-2"
            value={filters.minPrice} onChange={e => setF('minPrice', e.target.value)} />
          <span className="text-rose-300 shrink-0">–</span>
          <input type="number" placeholder="Max" min="0" className="form-input text-sm py-2"
            value={filters.maxPrice} onChange={e => setF('maxPrice', e.target.value)} />
        </div>
      </div>

      {hasFilters && (
        <button onClick={reset} className="btn-ghost w-full justify-center text-sm gap-2">
          <X size={14} /> Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl font-bold text-rose-900 mb-1">Our Collection</h1>
        <p className="text-rose-400 text-sm">
          {loading ? 'Loading…' : `${pagination.total} products found`}
        </p>
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-wrap gap-3 mb-8 p-4 bg-white rounded-2xl border border-rose-100 shadow-rose-sm">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" />
          <input
            type="text"
            placeholder="Search jewellery…"
            defaultValue={filters.search}
            key={filters.search === '' ? 'empty' : 'filled'}
            onChange={e => debouncedSearch(e.target.value)}
            className="form-input pl-9 rounded-full"
          />
        </div>
        <select value={filters.sort} onChange={e => setF('sort', e.target.value)}
          className="form-input min-w-[170px] rounded-full">
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setSideOpen(o => !o)} className="md:hidden btn-outline gap-2 text-sm">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      <div className="flex gap-7">
        {/* Desktop sidebar */}
        <aside className="hidden md:block w-56 shrink-0">
          <div className="card p-5 sticky top-24"><FilterPanel /></div>
        </aside>

        {/* Mobile drawer */}
        {sideOpen && (
          <div className="fixed inset-0 z-40 flex md:hidden">
            <div className="absolute inset-0 bg-rose-950/40" onClick={() => setSideOpen(false)} />
            <div className="relative bg-white w-72 ml-auto h-full overflow-y-auto p-6 shadow-rose-lg animate-slide-up">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display font-semibold text-lg">Filters</h3>
                <button onClick={() => setSideOpen(false)} className="p-2 text-rose-400 hover:text-rose-600"><X size={18} /></button>
              </div>
              <FilterPanel />
            </div>
          </div>
        )}

        {/* Products grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <EmptyState icon="🔍" title="No products found"
              description="Try adjusting your search or filters"
              action={{ to: '/shop', label: 'Clear filters' }}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {products.map(p => (
                  <ProductCard key={p.id} product={p} wishlisted={wishSet.has(p.id)}
                    onWishlistChange={() =>
                      wishlistAPI.get().then(r => setWishSet(new Set((r.data.items||[]).map(i => i.product_id)))).catch(() => {})
                    }
                  />
                ))}
              </div>
              <Pagination page={pagination.page} pages={pagination.pages} onChange={p => setF('page', p)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
