// frontend/src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import { ProtectedRoute, AdminRoute, GuestRoute } from './components/layout/ProtectedRoute';

// Public pages
import HomePage          from './pages/HomePage';
import ShopPage          from './pages/ShopPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage          from './pages/CartPage';
import CheckoutPage      from './pages/CheckoutPage';
import OrdersPage        from './pages/OrdersPage';
import WishlistPage      from './pages/WishlistPage';

// Auth pages
import AuthPage          from './pages/auth/AuthPage';


// Admin pages
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminProducts     from './pages/admin/AdminProducts';
import AdminOrders       from './pages/admin/AdminOrders';
import AdminUsers        from './pages/admin/AdminUsers';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Routes>
          {/* ── Public routes with shared Navbar + Footer layout ── */}
          <Route element={<Layout />}>
            <Route path="/"            element={<HomePage />} />
            <Route path="/shop"        element={<ShopPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/cart"        element={<CartPage />} />

            {/* Guest-only routes (redirect if logged in) */}
            <Route path="/login"    element={<GuestRoute><AuthPage /></GuestRoute>} />
            <Route path="/register" element={<GuestRoute><AuthPage /></GuestRoute>} />



            {/* Protected user routes */}
            <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
            <Route path="/orders"   element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
          </Route>

          {/* ── Admin routes (use AdminLayout internally, no shared Layout) ── */}
          <Route path="/admin"          element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
          <Route path="/admin/orders"   element={<AdminRoute><AdminOrders /></AdminRoute>} />
          <Route path="/admin/users"    element={<AdminRoute><AdminUsers /></AdminRoute>} />

          {/* ── Catch-all ──────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CartProvider>
    </AuthProvider>
  );
}
