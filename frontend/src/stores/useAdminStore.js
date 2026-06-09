import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useAdminStore = create((set, get) => ({
  // ─── Dashboard ───────────────────────────────────────────────
  stats: null,
  statsLoading: false,
  banners: [],
  bannersLoading: false,
coupons: [],
couponsLoading: false,


  customers: [],
  customersLoading: false,



  
  fetchCustomersForCoupons: async () => {
    set({ customersLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/customers-for-coupons"); // Ensure this matches your admin routes
      set({ customers: data, customersLoading: false });
    } catch (err) {
      set({ customersLoading: false });
    }
  },

  fetchBanners: async () => {
    set({ bannersLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/banners");
      set({ banners: data, bannersLoading: false });
    } catch (_) {
      set({ bannersLoading: false });
    }
  },

  createBanner: async (formData) => {
    try {
      const { data } = await axiosInstance.post("/admin/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      set((s) => ({ banners: [data, ...s.banners] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to create banner" };
    }
  },

  deleteBanner: async (id) => {
    try {
      await axiosInstance.delete(`/admin/banners/${id}`);
      set((s) => ({ banners: s.banners.filter((b) => b.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to delete banner" };
    }
  },

  reorderBanners: async (orderedIds) => {
    try {
      await axiosInstance.post("/admin/banners/reorder", { orderedIds });
      get().fetchBanners(); // Refresh list to ensure sync
    } catch (error) {
      console.error("Failed to reorder", error);
    }
  },

  updateBannerToggle: async (id, active) => {
    try {
      const { data } = await axiosInstance.put(`/admin/banners/${id}`, { active });
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
      const { data } = await axiosInstance.get("/admin/dashboard");
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
      const { data } = await axiosInstance.get("/admin/categories");
      set({ categories: data, categoriesLoading: false });
    } catch (_) {
      set({ categoriesLoading: false });
    }
  },

  createCategory: async (name) => {
    try {
      const { data } = await axiosInstance.post("/admin/categories", { name });
      set((s) => ({ categories: [...s.categories, data] }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to create category" };
    }
  },

  deleteCategory: async (id) => {
    try {
      await axiosInstance.delete(`/admin/categories/${id}`);
      set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to delete category" };
    }
  },

  // ─── Products ────────────────────────────────────────────────
  products: [],
  productsLoading: false,
  selectedProduct: null,

  fetchProducts: async () => {
    set({ productsLoading: true });
    try {
      const { data } = await axiosInstance.get("/admin/products");
      set({ products: data, productsLoading: false });
    } catch (_) {
      set({ productsLoading: false });
    }
  },

  fetchProduct: async (id) => {
    try {
      const { data } = await axiosInstance.get(`/admin/products/${id}`);
      set({ selectedProduct: data });
      return data;
    } catch (err) {
      return null;
    }
  },

  createProduct: async (formData) => {
    try {
      const { data } = await axiosInstance.post("/admin/products", formData, {
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
      const { data } = await axiosInstance.put(`/admin/products/${id}`, formData, {
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
      const { data } = await axiosInstance.patch(`/admin/products/${id}/stock`, { quantity });
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
      await axiosInstance.delete(`/admin/products/${id}`);
      set((s) => ({ products: s.products.filter((p) => p.id !== id) }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Failed to delete product" };
    }
  },

  // Logjika e re e integruar me axiosInstance
  applyBulkDiscount: async (payload) => {
    try {
      const { data } = await axiosInstance.post("/admin/products/discounts/bulk", payload);
      get().fetchProducts(); // Rifresko produktet për të parë çmimet e reja
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Network error" };
    }
  },


  // Hiq zbritjet në formë grupore (Bulk Remove)
  removeBulkDiscount: async (product_ids) => {
    try {
      const { data } = await axiosInstance.post("/admin/products/discounts/remove", { product_ids });
      get().fetchProducts(); // Rifresko produktet për të parë çmimet kthyera në normale
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, message: err.response?.data?.error || "Network error" };
    }
  },



orders: [],
  ordersLoading: false,
  ordersFetchingMore: false, // Loading state specifik për infinite scroll
  hasMoreOrders: true,       // Tregon nëse ka akoma porosi për t'u shkarkuar
  selectedOrder: null,
  orderFilters: { status: "", payment_status: "", payment_type: "" },

  fetchOrders: async (filters = {}, page = 1) => {
    if (page === 1) {
      set({ ordersLoading: true });
    } else {
      set({ ordersFetchingMore: true });
    }

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.payment_status) params.append("payment_status", filters.payment_status);
      if (filters.payment_type) params.append("payment_type", filters.payment_type); // FIKSUAR
      
      params.append("page", page);
      params.append("limit", 20); // Ndryshoje sipas dëshirës

      const { data } = await axiosInstance.get(`/admin/orders?${params.toString()}`);
      
      set((state) => ({
        // Nëse është faqja 1, zëvendëso listën. Ndryshe bashko listën e vjetër me të rejat
        orders: page === 1 ? data : [...state.orders, ...data],
        ordersLoading: false,
        ordersFetchingMore: false,
        hasMoreOrders: data.length === 20, // Nëse na kthehen 20, me siguri ka akoma
        orderFilters: filters
      }));
    } catch (_) {
      set({ ordersLoading: false, ordersFetchingMore: false });
    }
  },


  fetchOrder: async (id) => {
    try {
      const { data } = await axiosInstance.get(`/admin/orders/${id}`);
      set({ selectedOrder: data });
      return data;
    } catch (_) {
      return null;
    }
  },

  updateOrderStatus: async (id, updates) => {
    try {
      const { data } = await axiosInstance.patch(`/admin/orders/${id}/status`, updates);
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





fetchCoupons: async () => {
  set({ couponsLoading: true });

  try {
    const { data } = await axiosInstance.get("/admin/coupons");

    set({ coupons: data });
  } catch (err) {
    console.error(err);
  } finally {
    set({ couponsLoading: false });
  }
},

createCoupon: async (payload) => {
  try {
    const { data } = await axiosInstance.post("/admin/coupons", payload);

    set((state) => ({
      coupons: [data, ...state.coupons],
    }));

    return { success: true };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.error || "Failed to create coupon",
    };
  }
},
}));