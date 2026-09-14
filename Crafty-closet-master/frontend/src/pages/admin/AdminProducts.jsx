// frontend/src/pages/admin/AdminProducts.jsx
import { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Upload, X } from 'lucide-react';
import { productAPI } from '../../api/services';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatPrice, imgSrc, PLACEHOLDER } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CATS = ['earrings','necklaces','rings','bracelets','anklets','hairclips','bangles','sets'];
const EMPTY = { name:'', category:'', price:'', compare_price:'', stock:'', description:'' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [imgFile,  setImgFile]  = useState(null);
  const [imgPrev,  setImgPrev]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const fileRef = useRef();

  const load = async () => {
    setLoading(true);
    try {
      // active_only=false shows all products including hidden ones
      const { data } = await productAPI.getAll({ limit: 200, active_only: 'false' });
      setProducts(data.products || []);
    } catch (err) { toast.error('Failed to load products: ' + err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null); setForm(EMPTY);
    setImgFile(null); setImgPrev('');
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({ name:p.name, category:p.category, price:p.price, compare_price:p.compare_price||'', stock:p.stock, description:p.description||'' });
    setImgFile(null); setImgPrev(imgSrc(p.image));
    setModalOpen(true);
  };

  const handleImg = e => {
    const f = e.target.files[0];
    if (f) { setImgFile(f); setImgPrev(URL.createObjectURL(f)); }
  };

  const setF = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    if (!form.name || !form.category || !form.price || form.stock === '') {
      toast.error('Fill all required fields'); return;
    }
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
    if (imgFile) fd.append('image', imgFile);
    try {
      if (editing) { await productAPI.update(editing.id, fd); toast.success('Product updated ✓'); }
      else         { await productAPI.create(fd);             toast.success('Product added ✓'); }
      setModalOpen(false);
      await load();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const del = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try { await productAPI.delete(id); toast.success('Deleted'); await load(); }
    catch (err) { toast.error(err.message); }
  };

  const toggleActive = async (p) => {
    const fd = new FormData();
    fd.append('is_active', p.is_active ? '0' : '1');
    try { await productAPI.update(p.id, fd); await load(); }
    catch (err) { toast.error(err.message); }
  };

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-rose-900">Products</h1>
          <p className="text-rose-400 text-sm">{products.length} total products</p>
        </div>
        <button onClick={openAdd} className="btn-primary gap-2"><Plus size={16} /> Add Product</button>
      </div>

      {/* Search */}
      <div className="card p-4 mb-5">
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" />
          <input className="form-input pl-9 rounded-full text-sm" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <table className="tbl w-full">
              <thead>
                <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Rating</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-rose-300 py-10">No products found</td></tr>
                ) : filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <img src={imgSrc(p.image)} alt={p.name}
                          className="w-10 h-10 rounded-lg object-cover bg-rose-50 shrink-0"
                          onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
                        <span className="font-semibold text-rose-800 text-sm max-w-[180px] truncate">{p.name}</span>
                      </div>
                    </td>
                    <td><span className="inline-block px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-full capitalize">{p.category}</span></td>
                    <td className="font-bold text-rose-700">{formatPrice(p.price)}</td>
                    <td>
                      <span className={`font-bold text-sm ${p.stock===0?'text-red-500':p.stock<=5?'text-amber-500':'text-emerald-600'}`}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="text-amber-500 text-sm">{p.rating > 0 ? `★ ${p.rating}` : '—'}</td>
                    <td>
                      <button onClick={() => toggleActive(p)}
                        className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${p.is_active?'bg-emerald-100 text-emerald-700 hover:bg-emerald-200':'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                        {p.is_active ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => del(p.id, p.name)} className="p-1.5 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mobile Card Layout (visible only on mobile) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center text-rose-300">No products found</div>
        ) : filtered.map(p => (
          <div key={p.id} className="card p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <img src={imgSrc(p.image)} alt={p.name}
                className="w-16 h-16 rounded-xl object-cover bg-rose-50 shrink-0"
                onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-rose-800 text-sm truncate">{p.name}</h3>
                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full capitalize mt-1">{p.category}</span>
                <div className="flex items-center gap-3 mt-2">
                  <span className="font-bold text-rose-700 text-sm">{formatPrice(p.price)}</span>
                  <span className={`text-xs font-bold ${p.stock===0?'text-red-500':p.stock<=5?'text-amber-500':'text-emerald-600'}`}>
                    Stock: {p.stock}
                  </span>
                  {p.rating > 0 && <span className="text-amber-500 text-xs">★ {p.rating}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-rose-50">
              <button onClick={() => toggleActive(p)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${p.is_active?'bg-emerald-100 text-emerald-700':'bg-red-100 text-red-600'}`}>
                {p.is_active ? 'Active' : 'Hidden'}
              </button>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"><Pencil size={16} /></button>
                <button onClick={() => del(p.id, p.name)} className="p-2 rounded-lg text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Product' : 'Add New Product'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="form-label">Product Image</label>
            <div onClick={() => fileRef.current.click()}
              className="border-2 border-dashed border-rose-200 rounded-xl p-6 text-center cursor-pointer hover:border-rose-400 transition-colors">
              {imgPrev ? (
                <img src={imgPrev} alt="Preview" className="h-32 w-32 object-cover rounded-xl mx-auto" onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }} />
              ) : (
                <div className="text-rose-300">
                  <Upload size={28} className="mx-auto mb-2" />
                  <p className="text-sm">Click to upload image</p>
                  <p className="text-xs mt-1 text-rose-200">JPG, PNG, WebP · Max 5 MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="form-label">Product Name *</label>
              <input className="form-input" placeholder="Rose Gold Floral Studs" value={form.name} onChange={setF('name')} />
            </div>
            <div>
              <label className="form-label">Category *</label>
              <select className="form-input" value={form.category} onChange={setF('category')}>
                <option value="">Select…</option>
                {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Stock *</label>
              <input className="form-input" type="number" min="0" placeholder="50" value={form.stock} onChange={setF('stock')} />
            </div>
            <div>
              <label className="form-label">Price (₹) *</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="299" value={form.price} onChange={setF('price')} />
            </div>
            <div>
              <label className="form-label">Compare Price (₹)</label>
              <input className="form-input" type="number" min="0" step="0.01" placeholder="399 (strikethrough)" value={form.compare_price} onChange={setF('compare_price')} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea className="form-input" rows={3} placeholder="Describe this beautiful piece…" value={form.description} onChange={setF('description')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={save} disabled={saving} className="btn-primary flex-1">
              {saving ? 'Saving…' : editing ? '✓ Update Product' : '+ Add Product'}
            </button>
            <button onClick={() => setModalOpen(false)} className="btn-ghost px-5">Cancel</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
