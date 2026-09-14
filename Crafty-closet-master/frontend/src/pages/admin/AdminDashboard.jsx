// frontend/src/pages/admin/AdminDashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, DollarSign, AlertTriangle, Clock } from 'lucide-react';
import { adminAPI } from '../../api/services';
import AdminLayout from '../../components/admin/AdminLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Spinner from '../../components/ui/Spinner';
import { formatPrice } from '../../utils/helpers';

function StatCard({ icon: Icon, label, value, color }) {
  const colors = { rose:'bg-rose-100 text-rose-600', blue:'bg-blue-100 text-blue-600', emerald:'bg-emerald-100 text-emerald-600', amber:'bg-amber-100 text-amber-600', purple:'bg-purple-100 text-purple-600', red:'bg-red-100 text-red-600' };
  return (
    <div className="card p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${colors[color]||colors.rose}`}><Icon size={20} /></div>
      <div className="font-display text-2xl font-bold text-rose-900">{value}</div>
      <div className="text-sm text-rose-400 mt-0.5">{label}</div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then(r => setData(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-rose-900">Dashboard</h1>
        <p className="text-rose-400 text-sm mt-0.5">Welcome back! Here's your store at a glance.</p>
      </div>

      {loading ? <div className="flex justify-center py-20"><Spinner size="lg" /></div> : data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
            <StatCard icon={Package}       label="Products"       value={data.stats.total_products} color="rose" />
            <StatCard icon={ShoppingCart}  label="Orders"         value={data.stats.total_orders}   color="blue" />
            <StatCard icon={Users}         label="Customers"      value={data.stats.total_users}    color="purple" />
            <StatCard icon={DollarSign}    label="Revenue"        value={formatPrice(data.stats.revenue)} color="emerald" />
            <StatCard icon={Clock}         label="Pending"        value={data.stats.pending}        color="amber" />
            <StatCard icon={AlertTriangle} label="Low Stock"      value={data.stats.low_stock}      color="red" />
          </div>

          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-rose-100">
              <h2 className="font-display font-semibold text-lg text-rose-900">Recent Orders</h2>
              <Link to="/admin/orders" className="text-sm text-rose-500 hover:text-rose-700 font-medium">View all →</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl w-full">
                <thead><tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr></thead>
                <tbody>
                  {(data.recent_orders||[]).map(o => (
                    <tr key={o.id}>
                      <td className="font-mono text-xs font-bold text-rose-700">{o.order_number}</td>
                      <td className="font-medium text-rose-800">{o.user_name}</td>
                      <td className="font-bold text-rose-700">{formatPrice(o.total_price)}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="text-rose-400">{new Date(o.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</td>
                    </tr>
                  ))}
                  {!data.recent_orders?.length && (
                    <tr><td colSpan={5} className="text-center text-rose-300 py-8">No orders yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
