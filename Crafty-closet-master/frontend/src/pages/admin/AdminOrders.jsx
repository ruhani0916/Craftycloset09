// frontend/src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { orderAPI } from '../../api/services';
import AdminLayout from '../../components/admin/AdminLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/helpers';
import toast from 'react-hot-toast';

const STATUSES = ['pending','processing','shipped','delivered','cancelled'];

export default function AdminOrders() {
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('');
  const [search,   setSearch]   = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const { data } = await orderAPI.getAll(params);
      setOrders(data.orders || []);
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, search]);

  const updateStatus = async (id, status) => {
    try {
      await orderAPI.updateStatus(id, status);
      toast.success(`Order updated → ${status}`);
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) { toast.error(err.message); }
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-rose-900">Orders</h1>
        <p className="text-rose-400 text-sm">{orders.length} orders</p>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" />
          <input className="form-input pl-9 rounded-full text-sm" placeholder="Search by name or order #…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input sm:w-auto sm:min-w-[150px] rounded-full text-sm" value={filter} onChange={e => setFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
        </select>
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-16"><Spinner size="lg" /></div> : (
            <table className="tbl w-full">
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th><th>Update</th><th></th></tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-rose-300 py-10">No orders found</td></tr>
                ) : orders.map(o => (
                  // KEY MUST BE ON React.Fragment, not the inner <tr>
                  <React.Fragment key={o.id}>
                    <tr>
                      <td className="font-mono text-xs font-bold text-rose-700">{o.order_number}</td>
                      <td>
                        <div className="font-semibold text-sm text-rose-800">{o.user_name}</div>
                        <div className="text-xs text-rose-400">{o.user_email}</div>
                      </td>
                      <td className="font-bold text-rose-700">{formatPrice(o.total_price)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-rose-400 text-xs">
                        {new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                      </td>
                      <td>
                        <select
                          className="form-input py-1.5 text-xs rounded-lg min-w-[130px]"
                          value={o.status}
                          onChange={e => updateStatus(o.id, e.target.value)}
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                          className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <ChevronDown size={16} className={`transition-transform ${expanded===o.id?'rotate-180':''}`} />
                        </button>
                      </td>
                    </tr>

                    {expanded === o.id && (
                      <tr>
                        <td colSpan={7} className="bg-rose-50/60 px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Shipping Info</p>
                              <div className="text-rose-700 space-y-1">
                                {o.shipping_name    && <p><strong>{o.shipping_name}</strong></p>}
                                {o.shipping_phone   && <p>📞 {o.shipping_phone}</p>}
                                {o.shipping_email   && <p>✉️ {o.shipping_email}</p>}
                                {o.shipping_address && <p>📍 {o.shipping_address}</p>}
                                {o.notes            && <p className="italic text-rose-400">Note: {o.notes}</p>}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">Payment</p>
                              <p className="text-rose-700 capitalize">{o.payment_method}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size="lg" /></div>
        ) : orders.length === 0 ? (
          <div className="card p-8 text-center text-rose-300">No orders found</div>
        ) : orders.map(o => (
          <div key={o.id} className="card overflow-hidden animate-fade-in">
            <div className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-mono text-xs font-bold text-rose-700">{o.order_number}</p>
                  <p className="font-semibold text-sm text-rose-800 mt-0.5">{o.user_name}</p>
                  <p className="text-xs text-rose-400">{o.user_email}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="flex items-center justify-between mt-3">
                <span className="font-bold text-rose-700">{formatPrice(o.total_price)}</span>
                <span className="text-rose-400 text-xs">
                  {new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-rose-50 flex items-center gap-2">
                <select
                  className="form-input py-1.5 text-xs rounded-lg flex-1"
                  value={o.status}
                  onChange={e => updateStatus(o.id, e.target.value)}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>
                  ))}
                </select>
                <button
                  onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  className="p-2 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                >
                  <ChevronDown size={16} className={`transition-transform ${expanded===o.id?'rotate-180':''}`} />
                </button>
              </div>
            </div>

            {expanded === o.id && (
              <div className="bg-rose-50/60 px-4 py-3 border-t border-rose-100">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Shipping</p>
                    <div className="text-rose-700 space-y-0.5">
                      {o.shipping_name    && <p><strong>{o.shipping_name}</strong></p>}
                      {o.shipping_phone   && <p>📞 {o.shipping_phone}</p>}
                      {o.shipping_email   && <p>✉️ {o.shipping_email}</p>}
                      {o.shipping_address && <p>📍 {o.shipping_address}</p>}
                      {o.notes            && <p className="italic text-rose-400">Note: {o.notes}</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Payment</p>
                    <p className="text-rose-700 capitalize">{o.payment_method}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
