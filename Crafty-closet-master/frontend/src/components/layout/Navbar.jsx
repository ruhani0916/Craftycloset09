// frontend/src/components/layout/Navbar.jsx
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Heart, Menu, X, ChevronDown, Package, Settings, LogOut, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, isAdmin, logout: authLogout } = useAuth();
  const { count } = useCart();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false); }, [location.pathname]);

  const logout = async () => {
    setUserMenuOpen(false);
    await authLogout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const navLinks = [
    { to: '/',     label: 'Home' },
    { to: '/shop', label: 'Shop' },
    ...(user ? [
      { to: '/wishlist', label: 'Wishlist' },
      { to: '/orders',   label: 'My Orders' },
    ] : []),
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  return (
    <nav className="bg-white border-b border-rose-100 shadow-rose-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <Link to="/" className="font-display text-2xl font-bold text-rose-700 hover:text-rose-600 transition-colors flex items-center gap-1.5 shrink-0">
            💎 <span className="italic">Crafty Closet</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium pb-0.5 border-b-2 transition-all ${
                  isActive(link.to)
                    ? 'text-rose-700 border-rose-500'
                    : 'text-rose-400 border-transparent hover:text-rose-600 hover:border-rose-300'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-700 transition-colors"
            >
              <ShoppingBag size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>

            {/* User menu or Sign In */}
            {user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-300 to-rose-600 text-white flex items-center justify-center text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-semibold hidden sm:block">{user.name.split(' ')[0]}</span>
                  <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-12 w-52 bg-white rounded-2xl border border-rose-100 shadow-rose-lg py-2 animate-scale-in z-50">
                    <div className="px-4 py-2 border-b border-rose-50 mb-1">
                      <p className="text-sm font-semibold text-rose-900 truncate">{user.name}</p>
                      <p className="text-xs text-rose-400 truncate">{user.email}</p>
                    </div>
                    {[
                      { to: '/orders',   Icon: Package,  label: 'My Orders' },
                      { to: '/wishlist', Icon: Heart,    label: 'Wishlist' },
                    ].map(({ to, Icon, label }) => (
                      <Link key={to} to={to} onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 transition-colors">
                        <Icon size={15} className="text-rose-400" /> {label}
                      </Link>
                    ))}
                    {isAdmin && (
                      <Link to="/admin" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-rose-700 hover:bg-rose-50 transition-colors">
                        <Settings size={15} className="text-rose-400" /> Admin Panel
                      </Link>
                    )}
                    <div className="border-t border-rose-50 mt-1 pt-1">
                      <button onClick={logout}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors">
                        <LogOut size={15} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="btn-primary text-sm px-4 py-2">Sign In</Link>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
              onClick={() => setMobileMenuOpen(o => !o)}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-rose-100 bg-white animate-slide-up">
          <div className="px-4 py-3 flex flex-col gap-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to}
                className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive(link.to) ? 'bg-rose-100 text-rose-700' : 'text-rose-500 hover:bg-rose-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {!user && (
              <Link to="/login" className="btn-primary mt-2 justify-center">Sign In</Link>
            )}
            {user && (
              <button onClick={logout} className="mt-1 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 text-left transition-colors">
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
