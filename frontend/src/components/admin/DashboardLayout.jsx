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
        <header className="h-16 bg-base-100 border-b border-base-200 px-4 md:px-8 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2 -ml-2 text-base-content/70 hover:text-base-content hover:bg-base-200 rounded-md transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-bold tracking-tight hidden sm:block">
              {pageTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Bar */}
     
            
     
          </div>
        </header>

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