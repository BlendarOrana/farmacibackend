import { useAuthStore } from "../../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingCart,
  Image as ImageIcon, LogOut, X, Tag, Bell // 1. IMPORT Bell
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { key: "products",      label: "Inventory hub",  icon: Package },
  { key: "orders",        label: "Orders",         icon: ShoppingCart },
  { key: "banners",       label: "Banners",        icon: ImageIcon },
  { key: "coupons",       label: "Coupons",        icon: Tag },
  // 2. ADD NOTIFICATIONS HERE
  { key: "notifications", label: "Notifications",  icon: Bell }, 
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
      h-full w-[260px] bg-white border-r border-gray-100
      flex flex-col shrink-0
      transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
      ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
      lg:translate-x-0 lg:shadow-none
    `}>
      <div className="h-20 flex items-center justify-between px-6 border-b border-gray-50 shrink-0">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Brand Logo"
            className="w-20 h-20 object-contain"
          />
        </div>
        <button
          className="lg:hidden text-gray-400 hover:text-[#f68048] transition-colors p-2 rounded-full hover:bg-gray-50"
          onClick={() => setSidebarOpen(false)}
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex-1 px-4 py-8 flex flex-col gap-2 overflow-y-auto">
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3">
          Main Menu
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = activePage === item.key;
          return (
            <button
              key={item.key}
              onClick={() => { onNavigate(item.key); setSidebarOpen(false); }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl text-[14px] w-full text-left
                transition-all duration-200 group
                ${isActive
                  ? "bg-[#f68048] text-white font-semibold transform scale-[1.02]"
                  : "text-gray-500 hover:bg-orange-50 hover:text-[#f68048] font-medium"}
              `}
            >
              <item.icon
                size={20}
                className={isActive ? "text-white" : "text-gray-400 group-hover:text-[#f68048]"}
                strokeWidth={isActive ? 2.5 : 2}
              />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50 bg-white shrink-0 mb-4">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 hover:text-black rounded-xl transition-all"
        >
          <LogOut size={18} className="text-gray-400" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}