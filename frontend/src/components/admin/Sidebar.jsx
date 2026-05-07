import { useAuthStore } from "../../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Tags, 
  Image as ImageIcon, 
  LogOut, 
  X,
  Store
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "products", label: "Products", icon: Package },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "categories", label: "Categories", icon: Tags },
  { key: "banners", label: "Banners", icon: ImageIcon },
];

export default function Sidebar({ sidebarOpen, setSidebarOpen, activePage, onNavigate }) {
  const { admin, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside className={`
      fixed lg:static top-0 left-0 z-50
      h-full w-64 bg-base-100 border-r border-base-200
      flex flex-col shrink-0
      transition-transform duration-300 ease-in-out
      ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      lg:translate-x-0 lg:shadow-none
    `}>
      {/* Brand Header - Fixed Height to match Dashboard Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-base-200 shrink-0">

        <span className="font-bold text-lg tracking-tight text-base-content">
          Admin Panel
        </span>
        <button 
          className="ml-auto lg:hidden text-base-content/50 hover:text-base-content transition-colors" 
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-base-content/40 uppercase tracking-wider mb-2 px-2">
          Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setSidebarOpen(false); }}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm w-full text-left
                transition-colors group
                ${isActive
                  ? "bg-neutral text-neutral-content font-medium shadow-sm"
                  : "text-base-content/60 hover:bg-base-200 hover:text-base-content font-medium"}
              `}
            >
              <item.icon 
                size={18} 
                className={isActive ? "text-neutral-content" : "text-base-content/40 group-hover:text-base-content/80"} 
                strokeWidth={isActive ? 2.5 : 2} 
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Admin Profile & Logout - Pushed to the exact bottom */}
      <div className="p-4 border-t border-base-200 bg-base-50/50 shrink-0">
  
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-base-content/60 hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}