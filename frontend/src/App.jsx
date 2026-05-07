import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import { useAuthStore } from "./stores/useAuthStore";

function ProtectedRoute({ children }) {
  const { admin } = useAuthStore();
  return admin ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  );
}