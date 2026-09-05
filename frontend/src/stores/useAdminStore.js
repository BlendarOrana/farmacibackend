import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useAdminStore = create((set, get) => ({
  stats: null,
  statsLoading: false,
  banners: [],
  bannersLoading: false,
  coupons: [],
  couponsLoading: false,
  customers: [],
  customersLoading: false,

  // ─── USERS ────────────────────────────────────────────────
  users: [],
  usersLoading: false,

  fetchUsers: async () => {
    set({ usersLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/users");
      set({ users: data, usersLoading: false });
    } catch (_) {
      set({ usersLoading: false });
    }
  },

  // ─── BRANDS ───────────────────────────────────────────────
  brands: [],
  brandsLoading: false,

  fetchBrands: async () => {
    set({ brandsLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/brands");
      set({ brands: data, brandsLoading: false });
    } catch (_) {
      set({ brandsLoading: false });
    }
  },

  createBrand: async (payload) => {
    try {
      const { data } = await axiosInstance.post("/admin/brands", payload);
      set((s) => ({ brands: [...s.brands, data] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to create brand" };
    }
  },

  // ✅ UPDATED: Now accepts payload object { name, image_url }
  updateBrand: async (id, payload) => {
    try {
      const { data } = await axiosInstance.put(`/admin/brands/${id}`, payload);
      set((s) => ({
        brands: s.brands.map((b) => (b.id === id ? data : b)),
      }));
      get().fetchProducts(); // Refresh products to show new brand updates
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to update brand" };
    }
  },


  deleteBrand: async (id) => {
    try {
      await axiosInstance.delete(`/admin/brands/${id}`);
      set((s) => ({ brands: s.brands.filter((b) => b.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to delete brand" };
    }
  },

  // (The rest of your store logic goes completely intact beneath here...)
  fetchCustomersForCoupons: async () => {
    set({ customersLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/customers-for-coupons");
      set({ customers: data, customersLoading: false });
    } catch (err) { set({ customersLoading: false }); }
  },

  fetchBanners: async () => {
    set({ bannersLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/banners");
      set({ banners: data, bannersLoading: false });
    } catch (_) { set({ bannersLoading: false }); }
  },

  createBanner: async (formData) => {
    try {
      const { data } = await axiosInstance.post("/admin/banners", formData, { headers: { "Content-Type": "multipart/form-data" } });
      set((s) => ({ banners: [data, ...s.banners] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },

  deleteBanner: async (id) => {
    try {
      await axiosInstance.delete(`/admin/banners/${id}`);
      set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },

  reorderBanners: async (orderedIds) => {
    try { await axiosInstance.post("/admin/banners/reorder", { orderedIds }); get().fetchBanners(); } catch (error) { console.error("Failed", error); }
  },

  updateBannerToggle: async (id, active) => {
    try {
      const { data } = await axiosInstance.put(`/admin/banners/${id}`, { active });
      set((s) => ({ banners: s.banners.map((b) => (b.id === id ? data : b)) }));
      return { success: true };
    } catch (err) { return { success: false }; }
  },

  fetchStats: async () => {
    set({ statsLoading: true });
    try { const { data } = await axiosInstance.get("/admin/dashboard"); set({ stats: data, statsLoading: false }); } 
    catch (_) { set({ statsLoading: false }); }
  },

  categories: [],
  categoriesLoading: false,
  fetchCategories: async () => {
    set({ categoriesLoading: true });
    try { const { data } = await axiosInstance.get("/admin/categories"); set({ categories: data, categoriesLoading: false }); } catch (_) { set({ categoriesLoading: false }); }
  },
  createCategory: async (payload) => {
    try {
      const { data } = await axiosInstance.post("/admin/categories", payload);
      set((s) => ({ categories: [...s.categories, data] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },

  deleteCategory: async (id) => {
    try { await axiosInstance.delete(`/admin/categories/${id}`); set((s) => ({ categories: s.categories.filter((c) => c.id !== id) })); return { success: true }; } 
    catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },

  products: [], productsLoading: false, selectedProduct: null,
  fetchProducts: async () => {
    set({ productsLoading: true });
    try { const { data } = await axiosInstance.get("/admin/products"); set({ products: data, productsLoading: false }); } catch (_) { set({ productsLoading: false }); }
  },
  fetchProduct: async (id) => {
    try { const { data } = await axiosInstance.get(`/admin/products/${id}`); set({ selectedProduct: data }); return data; } catch (err) { return null; }
  },
  createProduct: async (formData) => {
    try {
      const { data } = await axiosInstance.post("/admin/products", formData, { headers: { "Content-Type": "multipart/form-data" } });
      set((s) => ({ products: [data, ...s.products] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },
  updateProduct: async (id, formData) => {
    try {
      const { data } = await axiosInstance.put(`/admin/products/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      set((s) => ({ products: s.products.map((p) => (p.id === id ? data : p)), selectedProduct: data }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },
  updateStock: async (id, quantity) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/products/${id}/stock`, { quantity });
      set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, quantity: data.quantity } : p)) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },
  deleteProduct: async (id) => {
    try {
      await axiosInstance.delete(`/admin/products/${id}`);
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },

  applyBulkDiscount: async (payload) => {
    try { const { data } = await axiosInstance.post("/admin/products/discounts/bulk", payload); get().fetchProducts(); return { success: true, message: data.message }; } catch (err) { return { success: false, message: err.response?.data?.error || "Network error" }; }
  },
  removeBulkDiscount: async (product_ids) => {
    try { const { data } = await axiosInstance.post("/admin/products/discounts/remove", { product_ids }); get().fetchProducts(); return { success: true, message: data.message }; } catch (err) { return { success: false, message: err.response?.data?.error || "Network error" }; }
  },

  orders: [], ordersLoading: false, ordersFetchingMore: false, hasMoreOrders: true, selectedOrder: null, orderFilters: { status: "", payment_status: "", payment_type: "" },
  fetchOrders: async (filters = {}, page = 1) => {
    if (page === 1) { set({ ordersLoading: true }); } else { set({ ordersFetchingMore: true }); }
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.payment_status) params.append("payment_status", filters.payment_status);
      if (filters.payment_type) params.append("payment_type", filters.payment_type); 
      params.append("page", page); params.append("limit", 20); 

      const { data } = await axiosInstance.get(`/admin/orders?${params.toString()}`);
      set((state) => ({
        orders: page === 1 ? data : [...state.orders, ...data],
        ordersLoading: false, ordersFetchingMore: false,
        hasMoreOrders: data.length === 20, 
        orderFilters: filters
      }));
    } catch (_) { set({ ordersLoading: false, ordersFetchingMore: false }); }
  },
  fetchOrder: async (id) => {
    try { const { data } = await axiosInstance.get(`/admin/orders/${id}`); set({ selectedOrder: data }); return data; } catch (_) { return null; }
  },
  updateOrderStatus: async (id, updates) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/orders/${id}/status`, updates);
      set((s) => ({
        orders: s.orders.map((o) => (o.id === id ? { ...o, ...data } : o)),
        selectedOrder: s.selectedOrder?.id === id ? { ...s.selectedOrder, ...data } : s.selectedOrder,
      }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },
  setSelectedOrder: (order) => set({ selectedOrder: order }),
  setSelectedProduct: (product) => set({ selectedProduct: product }),

  fetchCoupons: async () => {
    set({ couponsLoading: true });
    try { const { data } = await axiosInstance.get("/admin/coupons"); set({ coupons: data }); } catch (err) { console.error(err); } finally { set({ couponsLoading: false }); }
  },
  createCoupon: async (payload) => {
    try {
      const { data } = await axiosInstance.post("/admin/coupons", payload);
      set((state) => ({ coupons: [data, ...state.coupons] }));
      return { success: true };
    } catch (err) { return { success: false, message: err.response?.data?.error || "Failed" }; }
  },
}));