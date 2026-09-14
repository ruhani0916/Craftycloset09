// frontend/src/pages/OrdersPage.jsx
import { useState, useEffect } from 'react';
import { orderAPI } from '../api/services';
import EmptyState from '../components/ui/EmptyState';
import StatusBadge from '../components/ui/StatusBadge';
import Spinner from '../components/ui/Spinner';
import { formatPrice, imgSrc, PLACEHOLDER } from '../utils/helpers';

export default function OrdersPage() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderAPI.getMyOrders()
      .then(r => setOrders(r.data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!orders.length) return <EmptyState icon="📦" title="No orders yet" description="Start shopping to see your orders here" action={{ to:'/shop', label:'Shop Now' }} />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-rose-900 mb-8">My Orders 📦</h1>
      <div className="space-y-5">
        {orders.map(order => (
          <div key={order.id} className="card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-rose-50 border-b border-rose-100">
              <div>
                <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Order #{order.order_number}</div>
                <div className="text-xs text-rose-400 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={order.status} />
                <span className="font-bold text-rose-700">{formatPrice(order.total_price)}</span>
              </div>
            </div>
            <div className="px-5 py-4 divide-y divide-rose-50">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <img
                    src={imgSrc(item.image || item.current_image)}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-rose-50 shrink-0"
                    onError={e => { e.target.onerror=null; e.target.src=PLACEHOLDER; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-rose-800 line-clamp-1">{item.name}</div>
                    <div className="text-xs text-rose-400">Qty: {item.quantity} × {formatPrice(item.price)}</div>
                  </div>
                  <div className="font-bold text-sm text-rose-700 shrink-0">{formatPrice(item.quantity*item.price)}</div>
                </div>
              ))}
            </div>
            {order.shipping_address && (
              <div className="px-5 pb-4 text-xs text-rose-400">
                📍 {order.shipping_name}, {order.shipping_address}
                {order.shipping_phone && ` · ${order.shipping_phone}`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
