// frontend/src/context/CartContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI } from '../api/services';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items,    setItems]    = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count,    setCount]    = useState(0);
  const [loading,  setLoading]  = useState(false);

  const clearCart = useCallback(() => {
    setItems([]);
    setSubtotal(0);
    setCount(0);
  }, []);

  const fetchCart = useCallback(async () => {
    // If no user (logged out or fallback without DB id), clear and bail
    if (!user?.id) { clearCart(); return; }
    setLoading(true);
    try {
      const { data } = await cartAPI.get();
      setItems(data.items    || []);
      setSubtotal(data.subtotal || 0);
      setCount(data.count    || 0);
    } catch {
      // Silently fail — user stays on page, cart just shows empty
      clearCart();
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearCart]);

  // Re-fetch whenever user changes (login → fetch, logout → clear)
  useEffect(() => { fetchCart(); }, [fetchCart]);

  return (
    <CartContext.Provider value={{ items, subtotal, count, loading, fetchCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
};
