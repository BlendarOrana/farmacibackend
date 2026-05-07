import { create } from "zustand";
import { persist } from "zustand/middleware";
import axiosInstance from "../lib/axios";

const api = { 
  post: (url, data) => axiosInstance.post(`/auth${url}`, data),
  get:  (url)       => axiosInstance.get(`/auth${url}`),
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      admin: null,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post("/login", { email, password });
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
          await api.post("/logout");
        } catch (_) {}
        set({ admin: null });
      },

      getMe: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get("/me");
          set({ admin: data, isLoading: false });
        } catch (_) {
          set({ admin: null, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ admin: state.admin }),
    }
  )
);
