// frontend/src/components/admin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Home, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../layout/Navbar';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin',          label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products',  Icon: Package },
  { to: '/admin/orders',   label: 'Orders',    Icon: ShoppingCart },
  { to: '/admin/users',    label: 'Users',     Icon: Users },
];

export default function AdminLayout({ children }) {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const logout = () => {
    clearAuth();
    toast.success('Logged out');
    navigate('/');
  };

  const SidebarContent = () => (
    <>
      <div className="p-5 border-b border-rose-100">
        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">Admin Panel</p>
        <p className="font-semibold text-sm text-rose-900 truncate">{user?.name}</p>
        <p className="text-xs text-rose-400 truncate">{user?.email}</p>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive ? 'bg-rose-100 text-rose-700' : 'text-rose-400 hover:bg-rose-50 hover:text-rose-600'
              }`
            }
          >
            <Icon size={16} /> {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-rose-100 space-y-1">
        <NavLink to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
        >
          <Home size={16} /> Back to Store
        </NavLink>
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors w-full text-left"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden relative">

        {/* Mobile hamburger toggle */}
        <button
          onClick={() => setSidebarOpen(o => !o)}
          className="md:hidden fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
          aria-label="Toggle admin menu"
        >
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        {/* Mobile backdrop */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-30 bg-rose-950/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — desktop: always visible, mobile: slide-over */}
        <aside className={`
          bg-white border-r border-rose-100 flex flex-col shrink-0 overflow-y-auto
          transition-transform duration-300 ease-in-out z-40
          fixed md:sticky top-16 h-[calc(100vh-64px)] w-64 md:w-56
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <SidebarContent />
        </aside>

        {/* Main content */}
        <div className="flex-1 bg-rose-50/40 overflow-y-auto p-4 sm:p-6 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
