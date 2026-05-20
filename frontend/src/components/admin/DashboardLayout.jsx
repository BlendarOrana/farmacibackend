import { useState } from "react";
import { Menu, Bell } from "lucide-react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children, activePage, onNavigate }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Capitalize page title for header
  const pageTitle = activePage 
    ? activePage.charAt(0).toUpperCase() + activePage.slice(1) 
    : "Dashboard";

  return (
    // h-screen and overflow-hidden lock the layout strictly top-to-bottom
    <div className="h-screen w-full bg-slate-50 flex overflow-hidden text-base-content">
      
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Distinct Sidebar Component */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen} 
        activePage={activePage} 
        onNavigate={onNavigate} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        
        {/* Top Header */}


        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </div>
  );
}