import { useEffect } from "react";
import { useAdminStore } from "../../stores/useAdminStore";

const StatCard = ({ label, value, icon, accent }) => (
  <div className="card bg-base-100 shadow-sm border border-base-300">
    <div className="card-body p-5 flex-row items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accent}`}>
        <span className="text-2xl">{icon}</span>
      </div>
      <div>
        <p className="text-base-content/50 text-sm">{label}</p>
        <p className="text-2xl font-bold text-base-content leading-tight">
          {value ?? <span className="loading loading-dots loading-sm" />}
        </p>
      </div>
    </div>
  </div>
);

export default function StatsCards() {
  const { stats, statsLoading, fetchStats } = useAdminStore();

  useEffect(() => { fetchStats(); }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total Orders"
        value={stats?.total_orders}
        icon="📦"
        accent="bg-primary/10"
      />
      <StatCard
        label="Revenue (Paid)"
        value={stats ? `€${parseFloat(stats.total_revenue).toFixed(2)}` : null}
        icon="💶"
        accent="bg-success/10"
      />
      <StatCard
        label="Products"
        value={stats?.total_products}
        icon="🏷️"
        accent="bg-warning/10"
      />
      <StatCard
        label="New Orders"
        value={stats?.pending_orders}
        icon="🔔"
        accent="bg-error/10"
      />
    </div>
  );
}
