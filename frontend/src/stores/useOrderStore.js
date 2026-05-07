import { create } from "zustand";
import axiosInstance from "../lib/axios";

const api = {
  post: (url, data) => axiosInstance.post(`/shop${url}`, data),
  get:  (url)       => axiosInstance.get(`/shop${url}`),
};

export const useOrderStore = create((set) => ({
  // ─── Place Order ─────────────────────────────────────────────
  isPlacingOrder: false,
  orderResult: null,
  orderError: null,

  placeOrder: async (orderData) => {
    set({ isPlacingOrder: true, orderError: null, orderResult: null });
    try {
      const { data } = await api.post("/orders", orderData);
      set({ orderResult: data, isPlacingOrder: false });
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.error || "Failed to place order";
      set({ orderError: message, isPlacingOrder: false });
      return { success: false, message };
    }
  },

  // ─── Order Status Lookup ──────────────────────────────────────
  trackedOrder: null,
  trackLoading: false,
  trackError: null,

  trackOrder: async (id, email) => {
    set({ trackLoading: true, trackError: null, trackedOrder: null });
    try {
      const { data } = await api.get(`/orders/${id}?email=${encodeURIComponent(email)}`);
      set({ trackedOrder: data, trackLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.error || "Order not found";
      set({ trackError: message, trackLoading: false });
      return { success: false, message };
    }
  },

  clearOrder: () => set({ orderResult: null, orderError: null }),
  clearTracked: () => set({ trackedOrder: null, trackError: null }),
}));
