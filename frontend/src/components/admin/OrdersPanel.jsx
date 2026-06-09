// components/OrdersPanel.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { useAdminStore } from "../../stores/useAdminStore"; // Kontrollo pathin tënd
import OrderDetailsModal from "./OrderDetailsModal.jsx"; // Komponenti që sapo krijuam
import { AlertCircle, ChevronDown, Eye, Box, CheckCircle2 } from "lucide-react";

// Konstantet (mund t'i eksportosh në një constants.js nëse dëshiron)
export const STATUS_COLORS = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

export const PAYMENT_STATUS_COLORS = {
  PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

export const TRANSLATIONS = {
  order_status: { NEW: "E RE", DELIVERED: "DËRGUAR", CANCELLED: "ANULUAR" },
  payment_status: { PENDING: "NË PRITJE", PAID: "E PAGUAR", FAILED: "E DËSHTUAR" },
  payment_type: { ON_DELIVERY: "PARA NË DORËZIM", CARD: "KARTË BANKARE" }
};

export const ORDER_STATUSES = ["NEW", "DELIVERED", "CANCELLED"];
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];
export const PAYMENT_TYPES = ["ON_DELIVERY", "CARD"];

export default function OrdersPanel() {
  const { 
    orders, 
    ordersLoading, 
    ordersFetchingMore,
    hasMoreOrders,
    fetchOrders, 
    selectedOrder, 
    fetchOrder, 
    setSelectedOrder, 
    updateOrderStatus 
  } = useAdminStore();
  
  const [filters, setFilters] = useState({ status: "", payment_status: "", payment_type: "" });
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Zëvendëson useEffect e vjetër
  // Thërrasim fetchOrders sa herë ndryshon faqja ose filtrat
  useEffect(() => { 
    fetchOrders(filters, page); 
  }, [filters, page]);

  // Funksioni për të ndryshuar filtrat
  // Pse është ndarë? Sepse sa herë ndryshon një filter, duhet të kthehemi në faqen 1
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); 
  };

  // ----- INFINITE SCROLL LOGIC -----
  const observer = useRef();
  const lastOrderElementRef = useCallback(node => {
    if (ordersLoading || ordersFetchingMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      // Kur arrin tek elementi i fundit, shto faqen nese ka me shume
      if (entries[0].isIntersecting && hasMoreOrders) {
        setPage(prevPage => prevPage + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [ordersLoading, ordersFetchingMore, hasMoreOrders]);
  // ---------------------------------

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleStatusUpdate = async (id, updates) => {
    setSaving(true);
    const result = await updateOrderStatus(id, updates);
    setSaving(false);
    if (result.success) {
      showToast("Porosia u përditësua me sukses");
      await fetchOrder(id); 
    } else {
      showToast(result.message, "error");
    }
  };

  const openOrder = async (id) => {
    await fetchOrder(id);
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Toast Notifications */}
      {toast && (
        <div className="toast toast-top toast-end z-[9999] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white px-5 py-4 rounded-xl shadow-[0_10px_30px_0_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-3">
             {toast.type === "error" ? <AlertCircle className="text-gray-900 w-5 h-5" /> : <CheckCircle2 className="text-[#f68048] w-5 h-5"/> }
            <span className="font-semibold text-gray-800 text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Top Controller Ribbon */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        <div>
           <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
             Porositë 
             <span className="bg-gray-100 text-[#f68048] px-3 py-1 text-sm rounded-lg font-bold">
               {orders.length}
             </span>
           </h2>
           <p className="text-gray-500 text-sm mt-1 font-medium">Menaxho porositë dhe faturimet</p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full xl:w-auto z-10 relative">
          <div className="relative w-full sm:w-auto min-w-[170px]">
            <select
              className="w-full bg-gray-50 text-sm h-[44px] pl-4 pr-10 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-medium"
              value={filters.status}
              onChange={e => handleFilterChange("status", e.target.value)}
            >
              <option value="">Të gjitha statuset</option>
              {ORDER_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.order_status[s]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-auto min-w-[190px]">
            <select
              className="w-full bg-gray-50 text-sm h-[44px] pl-4 pr-10 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-medium"
              value={filters.payment_status}
              onChange={e => handleFilterChange("payment_status", e.target.value)}
            >
              <option value="">Statusi i pagesës</option>
              {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.payment_status[s]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="relative w-full sm:w-auto min-w-[190px]">
            <select
              className="w-full bg-gray-50 text-sm h-[44px] pl-4 pr-10 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-medium"
              value={filters.payment_type}
              onChange={e => handleFilterChange("payment_type", e.target.value)}
            >
              <option value="">Lloji i pagesës</option>
              {PAYMENT_TYPES.map(s => <option key={s} value={s}>{TRANSLATIONS.payment_type[s]}</option>)}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative">
        {ordersLoading && page === 1 ? (
          <div className="flex justify-center items-center py-24">
             <div className="w-8 h-8 border-4 border-[#f68048]/30 border-t-[#f68048] animate-spin rounded-full"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
               <Box size={28} />
             </div>
             <p className="text-gray-500 font-medium">Nuk u gjet asnjë porosi me këto kritere.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-4 pl-6 pr-4 rounded-tl-2xl">ID</th>
                  <th className="py-4 px-4">Klienti</th>
                  <th className="py-4 px-4">Qyteti</th>
                  <th className="py-4 px-4">Totali</th>
                  <th className="py-4 px-4">Pagesa</th>
                  <th className="py-4 px-4">Statusi</th>
                  <th className="py-4 px-4">Data</th>
                  <th className="text-right py-4 pr-6 pl-4 rounded-tr-2xl">Veprime</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium divide-y divide-gray-100">
                {orders.map((o, index) => {
                  // Nëse është elementi i fundit në listë, atasho IntersectionObserver
                  const isLastElement = orders.length === index + 1;
                  
                  return (
                    <tr 
                      key={o.id} 
                      ref={isLastElement ? lastOrderElementRef : null}
                      className="hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="py-4 pl-6 pr-4">
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-wider">
                            #{o.id}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-gray-900 font-bold">{o.customer_name}</span>
                          <span className="text-gray-400 text-xs mt-0.5">{o.customer_email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{o.city}</td>
                      <td className="py-4 px-4 text-gray-900 font-black">
                        €{parseFloat(o.total_amount).toFixed(2)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className="text-[11px] font-bold text-gray-500 tracking-wide uppercase">
                            {TRANSLATIONS.payment_type[o.payment_type]}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${PAYMENT_STATUS_COLORS[o.payment_status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                            {TRANSLATIONS.payment_status[o.payment_status]}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[o.order_status] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
                          {TRANSLATIONS.order_status[o.order_status]}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-xs">
                        {new Date(o.created_at).toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="py-4 pr-6 pl-4 text-right">
                        <button
                          className="p-2 text-gray-400 hover:text-[#f68048] hover:bg-orange-50 rounded-xl transition-colors inline-flex items-center justify-center"
                          onClick={() => openOrder(o.id)}
                          title="Shiko Detajet"
                        >
                          <Eye size={18} strokeWidth={2.5}/>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Loading Spinner for Infinite Scroll */}
        {ordersFetchingMore && (
           <div className="flex justify-center items-center py-6 border-t border-gray-100">
             <div className="w-6 h-6 border-3 border-[#f68048]/30 border-t-[#f68048] animate-spin rounded-full"></div>
           </div>
        )}
      </div>

      {/* Order Details Modal i Shkëputur */}
      <OrderDetailsModal 
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onStatusUpdate={handleStatusUpdate}
        saving={saving}
        constants={{ ORDER_STATUSES, PAYMENT_STATUSES, TRANSLATIONS }}
      />
    </div>
  );
}