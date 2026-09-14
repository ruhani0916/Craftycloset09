// frontend/src/api/services.js
import api from './axios';

export const authAPI = {
  sync:           () => api.post('/auth/sync'),
  me:             () => api.get('/auth/me'),
};

export const productAPI = {
  getAll:        (params) => api.get('/products', { params }),
  getOne:        (id)     => api.get(`/products/${id}`),
  getCategories: ()       => api.get('/products/categories'),
  create:        (fd)     => api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:        (id, fd) => api.put(`/products/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:        (id)     => api.delete(`/products/${id}`),
  rate:          (id, d)  => api.post(`/products/${id}/rate`, d),
};

export const cartAPI = {
  get:    ()         => api.get('/cart'),
  add:    (d)        => api.post('/cart', d),
  update: (id, d)    => api.put(`/cart/${id}`, d),
  remove: (id)       => api.delete(`/cart/${id}`),
  clear:  ()         => api.delete('/cart'),
};

export const orderAPI = {
  place:        (d)   => api.post('/orders', d),
  getMyOrders:  ()    => api.get('/orders/my'),
  getMyOrder:   (id)  => api.get(`/orders/my/${id}`),
  getAll:       (p)   => api.get('/orders', { params: p }),
  updateStatus: (id, s) => api.put(`/orders/${id}/status`, { status: s }),
};

export const wishlistAPI = {
  get:    ()   => api.get('/wishlist'),
  add:    (id) => api.post('/wishlist', { product_id: id }),
  remove: (id) => api.delete(`/wishlist/${id}`),
};

export const adminAPI = {
  getStats:       ()        => api.get('/admin/stats'),
  getUsers:       (p)       => api.get('/admin/users', { params: p }),
  toggleUser:     (id)      => api.patch(`/admin/users/${id}/toggle`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
};
