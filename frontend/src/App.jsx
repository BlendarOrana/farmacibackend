import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import PrivacyPage from "./pages/PrivacyPage"; // IMPORT ADDED HERE
import { useAuthStore } from "./stores/useAuthStore";

function ProtectedRoute({ children }) {
  const { admin } = useAuthStore();
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const { getMe, isCheckingAuth, admin } = useAuthStore();

  // Check if the user has a valid cookie when the app first loads
  useEffect(() => {
    getMe();
  }, [getMe]);

  // Show a loading screen while waiting for the server to verify the cookie
  if (isCheckingAuth) {
    return (
      // Added absolute positioning to center the loader on the screen perfectly
      <div className="min-h-screen flex justify-center items-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-[#f6773e] animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/*  PUBLIC ROUTE: Added the privacy policy here so anyone can see it */}
      <Route path="/privacy" element={<PrivacyPage />} />

      {/* LOGIN ROUTE */}
      <Route 
        path="/login" 
        element={admin ? <Navigate to="/admin/dashboard" replace /> : <LoginPage />} 
      />
      
      {/* ADMIN PROTECTED ROUTES */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* CATCH ALL - redirects to admin (you can point this to your storefront if needed) */}
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}