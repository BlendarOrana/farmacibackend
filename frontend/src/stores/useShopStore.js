import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "../lib/axios";

const api = {
  get: (url) => axiosInstance.get(`/shop${url}`),
};

export const useShopStore = create(
  persist(
    (set, get) => ({
      // ─── Products ──────────────────────────────────────────
      products: [],
      categories: [],
      productsLoading: false,
      selectedProduct: null,
      activeCategory: null,

      fetchProducts: async (category_id = null) => {
        set({ productsLoading: true });
        try {
          const params = category_id ? `?category_id=${category_id}` : "";
          const { data } = await api.get(`/products${params}`);
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
        } catch (_) {
          return null;
        }
      },

      fetchCategories: async () => {
        try {
          const { data } = await api.get("/categories");
          set({ categories: data });
        } catch (_) {}
      },

      setActiveCategory: (id) => set({ activeCategory: id }),

      // ─── Cart ──────────────────────────────────────────────
      cart: [],

      addToCart: (product, quantity = 1) => {
        set((s) => {
          const existing = s.cart.find((i) => i.id === product.id);
          if (existing) {
            return {
              cart: s.cart.map((i) =>
                i.id === product.id
                  ? { ...i, quantity: Math.min(i.quantity + quantity, product.quantity) }
                  : i
              ),
            };
          }
          return { cart: [...s.cart, { ...product, quantity }] };
        });
      },

      removeFromCart: (productId) =>
        set((s) => ({ cart: s.cart.filter((i) => i.id !== productId) })),

      updateCartQuantity: (productId, quantity) => {
        if (quantity < 1) {
          get().removeFromCart(productId);
          return;
        }
        set((s) => ({
          cart: s.cart.map((i) => (i.id === productId ? { ...i, quantity } : i)),
        }));
      },

      clearCart: () => set({ cart: [] }),

      get cartTotal() {
        return get().cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
      },

      get cartCount() {
        return get().cart.reduce((sum, i) => sum + i.quantity, 0);
      },
    }),
    {
      name: "shop-cart",
      partialize: (state) => ({ cart: state.cart }),
    }
  )
);
