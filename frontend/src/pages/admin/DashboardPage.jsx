import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import DashboardLayout from "../../components/admin/DashboardLayout";
import StatsCards from "../../components/admin/StatsCards";
import ProductsPanel from "../../components/admin/ProductsPanel";
import OrdersPanel from "../../components/admin/OrdersPanel";
import CategoriesPanel from "../../components/admin/CategoriesPanel";
import BannersPanel from "../../components/admin/BannersPanel";

export default function DashboardPage() {
  const [page, setPage] = useState("dashboard");
  const { admin, getMe } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!admin) {
      getMe().then(() => {
        if (!useAuthStore.getState().admin) navigate("/login");
      });
    }
  }, []);

  const renderPage = () => {
    switch (page) {
      case "dashboard":   return <DashboardHome />;
      case "products":    return <ProductsPanel />;
      case "orders":      return <OrdersPanel />;
      case "categories":  return <CategoriesPanel />;
      case "banners":     return <BannersPanel />;
      default:            return <DashboardHome />;
    }
  };

  return (
    <DashboardLayout activePage={page} onNavigate={setPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

function DashboardHome() {
  return (
    <div className="flex flex-col gap-6">
      <StatsCards />
      {/* You can add recent orders or low stock alerts here */}
    </div>
  );
}