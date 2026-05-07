import { create } from "zustand";
import axiosInstance from "../lib/axios";

const api = {
  get:    (url, config)       => axiosInstance.get(`/admin${url}`, config),
  post:   (url, data, config) => axiosInstance.post(`/admin${url}`, data, config),
  put:    (url, data, config) => axiosInstance.put(`/admin${url}`, data, config),
  patch:  (url, data)         => axiosInstance.patch(`/admin${url}`, data),
  delete: (url)               => axiosInstance.delete(`/admin${url}`),
};

export const useAdminStore = create((set, get) => ({
  // ─── Dashboard ───────────────────────────────────────────────
  stats: null,
  statsLoading: false,
  banners: [],
  bannersLoading: false,

 fetchBanners: async () => {
    set({ bannersLoading: true });
    try {
      const { data } = await api.get("/banners");
      set({ banners: data, bannersLoading: false });
    } catch (_) {
      set({ bannersLoading: false });
    }
  },

  createBanner: async (formData) => {
    try {
      const { data } = await api.post("/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((s) => ({ banners: [data, ...s.banners] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed" };
    }
  },

  deleteBanner: async (id) => {
    try {
      await api.delete(`/banners/${id}`);
      set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed" };
    }
  },


  reorderBanners: async (orderedIds) => {
  try {
    await axios.post('/api/banners/reorder', { orderedIds });
    get().fetchBanners(); // Refresh list to ensure sync
  } catch (error) {
    console.error("Failed to reorder", error);
  }
},

  updateBannerToggle: async (id, active) => {
    try {
      const { data } = await api.put(`/banners/${id}`, { active });
      set((s) => ({
        banners: s.banners.map((b) => (b.id === id ? data : b)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },







  fetchStats: async () => {
    set({ statsLoading: true });
    try {
      const { data } = await api.get("/dashboard");
      set({ stats: data, statsLoading: false });
    } catch (_) {
      set({ statsLoading: false });
    }
  },

  // ─── Categories ──────────────────────────────────────────────
  categories: [],
  categoriesLoading: false,

  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try {
      const { data } = await api.get("/categories");
      set({ categories: data, categoriesLoading: false });
    } catch (_) {
      set({ categoriesLoading: false });
    }
  },

  createCategory: async (name) => {
    try {
      const { data } = await api.post("/categories", { name });
      set((s) => ({ categories: [...s.categories, data] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed" };
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed" };
    }
  },

  // ─── Products ────────────────────────────────────────────────
  products: [],
  productsLoading: false,
  selectedProduct: null,

  fetchProducts: async () => {
    set({ productsLoading: true });
    try {
      const { data } = await api.get("/products");
      set({ products: data, productsLoading: false });
    } catch (_) {
      set({ productsLoading: false });
    }
  },

  fetchProduct: async (id) => {
    try {
      const { data } = await api.get(`/products/${id}`);
      set({ selectedProduct: data });
      return data;
    } catch (err) {
      return null;
    }
  },

  createProduct: async (formData) => {
    try {
      const { data } = await api.post("/products", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((s) => ({ products: [data, ...s.products] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to create product" };
    }
  },

  updateProduct: async (id, formData) => {
    try {
      const { data } = await api.put(`/products/${id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((s) => ({
        products: s.products.map((p) => (p.id === id ? data : p)),
        selectedProduct: data,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to update product" };
    }
  },

  updateStock: async (id, quantity) => {
    try {
      const { data } = await api.patch(`/products/${id}/stock`, { quantity });
      set((s) => ({
        products: s.products.map((p) => (p.id === id ? { ...p, quantity: data.quantity } : p)),
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to update stock" };
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.delete(`/products/${id}`);
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to delete product" };
    }
  },

  // ─── Orders ──────────────────────────────────────────────────
  orders: [],
  ordersLoading: false,
  selectedOrder: null,
  orderFilters: { status: "", payment_status: "" },

  fetchOrders: async (filters = {}) => {
    set({ ordersLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.payment_status) params.append("payment_status", filters.payment_status);
      const { data } = await api.get(`/orders?${params.toString()}`);
      set({ orders: data, ordersLoading: false, orderFilters: filters });
    } catch (_) {
      set({ ordersLoading: false });
    }
  },

  fetchOrder: async (id) => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      set({ selectedOrder: data });
      return data;
    } catch (_) {
      return null;
    }
  },

  updateOrderStatus: async (id, updates) => {
    try {
      const { data } = await api.patch(`/orders/${id}/status`, updates);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        selectedOrder: s.selectedOrder?.id === id ? { ...s.selectedOrder, ...data } : s.selectedOrder,
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to update order" };
    }
  },

  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),
}));
