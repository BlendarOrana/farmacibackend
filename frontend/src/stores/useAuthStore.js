import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useAuthStore = create((set) => ({
  admin: null,
  isLoading: false,
  isCheckingAuth: true, // Add this to handle the initial page load
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axiosInstance.post("/auth/login", { email, password });
      set({ admin: data, isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || "Login failed";
      set({ error: message, isLoading: false });
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch (_) {}
    set({ admin: null });
  },

  getMe: async () => {
    set({ isCheckingAuth: true });
    try {
      const { data } = await axiosInstance.get("/auth/me");
      set({ admin: data, isCheckingAuth: false });
    } catch (_) {
      set({ admin: null, isCheckingAuth: false }); 
    }
  },

  clearError: () => set({ error: null }),
}));