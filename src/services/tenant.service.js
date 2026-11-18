import api from './api';

const tenantService = {
  // Super Admin
  fetchTenants: async (params = {}) => {
    const { data } = await api.get('/super/tenants', { params });
    return data;
  },

  createTenant: async (payload) => {
    const { data } = await api.post('/super/tenants', payload);
    return data;
  },

  updateTenant: async (id, payload) => {
    const { data } = await api.put(`/super/tenants/${id}`, payload);
    return data;
  },

  toggleStatus: async (id, payload) => {
    const { data } = await api.patch(`/super/tenants/${id}/status`, payload);
    return data;
  },

  getPlans: async () => {
    const { data } = await api.get('/super/plans');
    return data;
  },

  createPlan: async (payload) => {
    const { data } = await api.post('/super/plans', payload);
    return data;
  },

  updatePlan: async (id, payload) => {
    const { data } = await api.put(`/super/plans/${id}`, payload);
    return data;
  },

  deletePlan: async (id) => {
    const { data } = await api.delete(`/super/plans/${id}`);
    return data;
  },

  getPlatformStats: async () => {
    const { data } = await api.get('/super/stats');
    return data;
  },

  // Tenant / Owner Profile
  getMyTenantProfile: async () => {
    const { data } = await api.get('/tenants/me');
    return data;
  },

  updateMyTenantProfile: async (payload) => {
    const { data } = await api.put('/tenants/me', payload);
    return data;
  },

  // Public Customer Endpoints
  getPublicMenu: async (slug) => {
    const { data } = await api.get(`/public/menu/${slug}`);
    return data;
  },

  verifyTable: async (slug, token) => {
    const { data } = await api.get(`/public/menu/${slug}/table/${token}`);
    return data;
  },

  publicPlaceOrder: async (payload) => {
    const { data } = await api.post('/public/orders', payload);
    return data;
  },

  getPublicOrderStatus: async (orderId) => {
    const { data } = await api.get(`/public/orders/${orderId}/status`);
    return data;
  },

  validateCoupon: async (payload) => {
    const { data } = await api.post('/coupons/validate', payload);
    return data;
  },

  submitReview: async (payload) => {
    const { data } = await api.post('/reviews/submit', payload);
    return data;
  },

  // Payments
  createPaymentOrder: async (payload) => {
    const { data } = await api.post('/payments/create-order', payload);
    return data;
  },

  verifyPayment: async (payload) => {
    const { data } = await api.post('/payments/verify', payload);
    return data;
  },

  // Menu Management
  getCategories: async () => {
    const { data } = await api.get('/menu/categories');
    return data;
  },

  createCategory: async (payload) => {
    const { data } = await api.post('/menu/categories', payload);
    return data;
  },

  updateCategory: async (id, payload) => {
    const { data } = await api.put(`/menu/categories/${id}`, payload);
    return data;
  },

  deleteCategory: async (id) => {
    const { data } = await api.delete(`/menu/categories/${id}`);
    return data;
  },

  getMenuItems: async (params = {}) => {
    const { data } = await api.get('/menu/items', { params });
    return data;
  },

  createMenuItem: async (payload) => {
    const { data } = await api.post('/menu/items', payload);
    return data;
  },

  updateMenuItem: async (id, payload) => {
    const { data } = await api.put(`/menu/items/${id}`, payload);
    return data;
  },

  deleteMenuItem: async (id) => {
    const { data } = await api.delete(`/menu/items/${id}`);
    return data;
  },

  toggleItemAvailability: async (id) => {
    const { data } = await api.patch(`/menu/items/${id}/availability`);
    return data;
  },

  // Table Management
  getTables: async () => {
    const { data } = await api.get('/tables');
    return data;
  },

  createTable: async (payload) => {
    const { data } = await api.post('/tables', payload);
    return data;
  },

  updateTable: async (id, payload) => {
    const { data } = await api.put(`/tables/${id}`, payload);
    return data;
  },

  regenerateQR: async (id) => {
    const { data } = await api.post(`/tables/${id}/regenerate-qr`);
    return data;
  },

  resetTable: async (id) => {
    const { data } = await api.post(`/tables/${id}/reset`);
    return data;
  },

  deleteTable: async (id) => {
    const { data } = await api.delete(`/tables/${id}`);
    return data;
  },

  // Order Management
  getOrders: async (params = {}) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  updateOrderStatus: async (id, payload) => {
    const { data } = await api.patch(`/orders/${id}/status`, payload);
    return data;
  },

  updatePaymentStatus: async (id, payload) => {
    const { data } = await api.patch(`/orders/${id}/payment`, payload);
    return data;
  },

  // Staff Management
  getStaff: async () => {
    const { data } = await api.get('/staff');
    return data;
  },

  createStaff: async (payload) => {
    const { data } = await api.post('/staff', payload);
    return data;
  },

  updateStaff: async (id, payload) => {
    const { data } = await api.put(`/staff/${id}`, payload);
    return data;
  },

  deleteStaff: async (id) => {
    const { data } = await api.delete(`/staff/${id}`);
    return data;
  },

  // Reviews
  getReviews: async (params = {}) => {
    const { data } = await api.get('/reviews', { params });
    return data;
  },

  replyReview: async (id, payload) => {
    const { data } = await api.post(`/reviews/${id}/reply`, payload);
    return data;
  },

  // Analytics
  getAnalyticsSummary: async () => {
    const { data } = await api.get('/analytics/summary');
    return data;
  },

  getRevenueAnalytics: async (params = {}) => {
    const { data } = await api.get('/analytics/revenue', { params });
    return data;
  },

  // Coupons
  getCoupons: async () => {
    const { data } = await api.get('/coupons');
    return data;
  },

  createCoupon: async (payload) => {
    const { data } = await api.post('/coupons', payload);
    return data;
  },

  deleteCoupon: async (id) => {
    const { data } = await api.delete(`/coupons/${id}`);
    return data;
  },
};

export default tenantService;
