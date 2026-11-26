// lib/vendor.ts
import { api } from '@/lib/api';

// وقتی ادمین از پنل ادمین (نه خود رستوران‌دار) این توابع رو صدا می‌زنه،
// باید restaurantId رستورانِ انتخاب‌شده رو پاس بده تا بک‌اند بدونه
// داره کدوم رستوران رو مدیریت می‌کنه (چون ادمین مالک هیچ رستورانی نیست).
type Rid = number | undefined;

function withRid(rid: Rid) {
  return rid ? { params: { restaurant_id: rid } } : {};
}

export const vendorApi = {
  getRestaurant: (rid?: Rid) => api.get('/vendor/restaurant', withRid(rid)).then((r) => r.data),
  updateRestaurant: (data: any, rid?: Rid) => api.put('/vendor/restaurant', data, withRid(rid)).then((r) => r.data),

  listBranches: (rid?: Rid) => api.get('/vendor/branches', withRid(rid)).then((r) => r.data),
  createBranch: (data: any, rid?: Rid) => api.post('/vendor/branches', data, withRid(rid)).then((r) => r.data),
  updateBranch: (id: number, data: any, rid?: Rid) =>
    api.put(`/vendor/branches/${id}`, data, withRid(rid)).then((r) => r.data),
  deleteBranch: (id: number, rid?: Rid) => api.delete(`/vendor/branches/${id}`, withRid(rid)).then((r) => r.data),

  listCategories: (rid?: Rid) => api.get('/vendor/categories', withRid(rid)).then((r) => r.data),
  createCategory: (data: any, rid?: Rid) => api.post('/vendor/categories', data, withRid(rid)).then((r) => r.data),
  updateCategory: (id: number, data: any, rid?: Rid) =>
    api.put(`/vendor/categories/${id}`, data, withRid(rid)).then((r) => r.data),
  deleteCategory: (id: number, rid?: Rid) => api.delete(`/vendor/categories/${id}`, withRid(rid)).then((r) => r.data),

  listProducts: (rid?: Rid) => api.get('/vendor/products', withRid(rid)).then((r) => r.data),
  createProduct: (data: any, rid?: Rid) => api.post('/vendor/products', data, withRid(rid)).then((r) => r.data),
  updateProduct: (id: number, data: any, rid?: Rid) =>
    api.put(`/vendor/products/${id}`, data, withRid(rid)).then((r) => r.data),
  deleteProduct: (id: number, rid?: Rid) => api.delete(`/vendor/products/${id}`, withRid(rid)).then((r) => r.data),

  listExtras: (productId: number, rid?: Rid) =>
    api.get(`/vendor/products/${productId}/extras`, withRid(rid)).then((r) => r.data),
  createExtra: (productId: number, data: { name: string; price: number }, rid?: Rid) =>
    api.post(`/vendor/products/${productId}/extras`, data, withRid(rid)).then((r) => r.data),
  updateExtra: (productId: number, extraId: number, data: any, rid?: Rid) =>
    api.put(`/vendor/products/${productId}/extras/${extraId}`, data, withRid(rid)).then((r) => r.data),
  deleteExtra: (productId: number, extraId: number, rid?: Rid) =>
    api.delete(`/vendor/products/${productId}/extras/${extraId}`, withRid(rid)).then((r) => r.data),

  listOrders: (page = 1, rid?: Rid) =>
    api.get('/vendor/orders', { params: { page, ...(rid ? { restaurant_id: rid } : {}) } }).then((r) => r.data),
  updateOrderStatus: (orderId: number, status: string) =>
    api.patch(`/vendor/orders/${orderId}/status`, { status }).then((r) => r.data),
  updatePreparationTime: (orderId: number, minutes: number) =>
    api.patch(`/orders/${orderId}/preparation-time`, { preparation_minutes: minutes }).then((r) => r.data),

  dashboardOverview: (rid?: Rid) => api.get('/vendor/dashboard', withRid(rid)).then((r) => r.data),
  dashboardChart: (metric: 'orders' | 'revenue', period: string, rid?: Rid) =>
    api.get('/vendor/dashboard/chart', { params: { metric, period, ...(rid ? { restaurant_id: rid } : {}) } }).then((r) => r.data),
  recentOrders: (rid?: Rid) => api.get('/vendor/dashboard/recent-orders', withRid(rid)).then((r) => r.data),
  readyForPickup: (rid?: Rid) => api.get('/vendor/dashboard/ready-for-pickup', withRid(rid)).then((r) => r.data),
};
