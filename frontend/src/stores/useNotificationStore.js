import { create } from "zustand";
import axiosInstance from "../lib/axios";

export const useNotificationStore = create((set, get) => ({
  stats: {
    active_tokens: 0,
    inactive_tokens: 0,
    ios_tokens: 0,
    android_tokens: 0
  },
  history: [],
  isLoadingStats: false,
  isLoadingHistory: false,
  isSending: false,

  fetchStats: async () => {
    set({ isLoadingStats: true });
    try {
      // Assuming your routes are mounted at /api/notifications
      const { data } = await axiosInstance.get("/notifications/stats");
      set({ stats: data, isLoadingStats: false });
    } catch (error) {
      console.error("Error fetching notification stats:", error);
      set({ isLoadingStats: false });
    }
  },

  fetchHistory: async () => {
    set({ isLoadingHistory: true });
    try {
      const { data } = await axiosInstance.get("/notifications/history");
      set({ history: data, isLoadingHistory: false });
    } catch (error) {
      console.error("Error fetching notification history:", error);
      set({ isLoadingHistory: false });
    }
  },

  sendNotification: async (payload) => {
    set({ isSending: true });
    try {
      const { data } = await axiosInstance.post("/notifications/send-all", payload);
      
      // Refresh history and stats after sending
      await get().fetchStats();
      await get().fetchHistory();
      
      set({ isSending: false });
      return { success: true, message: data.message, stats: data.stats };
    } catch (error) {
      set({ isSending: false });
      return { 
        success: false, 
        message: error.response?.data?.error || "Failed to send notification" 
      };
    }
  }
}));