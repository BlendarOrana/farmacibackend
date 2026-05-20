import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { 
  AlertCircle, Info, ChevronDown, Eye, X, 
  MapPin, Phone, Mail, User, CreditCard, Box,
  Ticket, CheckCircle2
} from "lucide-react";

const STATUS_COLORS = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_COLORS = {
  PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

// Përkthimet
const TRANSLATIONS = {
  order_status: {
    NEW: "E RE",
    DELIVERED: "DËRGUAR",
    CANCELLED: "ANULUAR"
  },
  payment_status: {
    PENDING: "NË PRITJE",
    PAID: "E PAGUAR",
    FAILED: "E DËSHTUAR"
  },
  payment_type: {
    ON_DELIVERY: "PARA NË DORËZIM",
    CARD: "KARTË BANKARE"
  }
};

const ORDER_STATUSES = ["NEW", "DELIVERED", "CANCELLED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED"];
const PAYMENT_TYPES = ["ON_DELIVERY", "CARD"];

export default function OrdersPanel() {
  const { 
    orders, ordersLoading, fetchOrders, 
    selectedOrder, fetchOrder, setSelectedOrder, updateOrderStatus 
  } = useAdminStore();
  
  const [filters, setFilters] = useState({ status: "", payment_status: "", payment_type: "" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { 
    fetchOrders(filters); 
  }, [filters]);

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
      await fetchOrder(id); // Rifresko detajet në modal
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
              onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
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
              onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}
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
              onChange={e => setFilters(f => ({ ...f, payment_type: e.target.value }))}
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
        {ordersLoading ? (
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
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors group">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="absolute inset-0" onClick={() => setSelectedOrder(null)} />
          <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-gray-50/80 px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-black text-xl text-gray-900 flex items-center gap-2 tracking-tight">
                  Porosia <span className="text-[#f68048]">#{selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-gray-400 font-medium mt-1">
                  Krijuar më: {new Date(selectedOrder.created_at).toLocaleString('sq-AL')}
                </p>
              </div>
              <button 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors" 
                onClick={() => setSelectedOrder(null)}
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-8 overflow-y-auto">
              
              {/* Alert Kuponi (Nëse ka) */}
              {selectedOrder.applied_coupon && (
                <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
                   <div className="bg-white p-2 rounded-lg shadow-sm text-[#f68048]">
                     <Ticket size={20} />
                   </div>
                   <div>
                      <h4 className="text-sm font-bold text-gray-900 mb-0.5">Kupon i aplikuar: {selectedOrder.applied_coupon}</h4>
                      <p className="text-xs font-medium text-[#f68048]">
                        Zbritje nga kuponi: {selectedOrder.coupon_discount_value}
                        {selectedOrder.coupon_discount_type === 'percentage' ? '%' : '€'}
                      </p>
                   </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Customer Details Box */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                     <User size={14} /> Detajet e Klientit
                  </h4>
                  <div className="flex flex-col gap-3 text-sm">
                    <p className="flex items-center gap-3"><span className="text-gray-400"><User size={16}/></span> <span className="font-bold text-gray-800">{selectedOrder.customer_name}</span></p>
                    <p className="flex items-center gap-3"><span className="text-gray-400"><Mail size={16}/></span> <span className="font-medium text-gray-600">{selectedOrder.customer_email}</span></p>
                    <p className="flex items-center gap-3"><span className="text-gray-400"><Phone size={16}/></span> <span className="font-medium text-gray-600">{selectedOrder.phone_number}</span></p>
                    <p className="flex items-start gap-3 mt-1 pt-3 border-t border-gray-100">
                       <span className="text-gray-400 mt-0.5"><MapPin size={16}/></span> 
                       <span className="font-medium text-gray-600 leading-relaxed">{selectedOrder.address}, {selectedOrder.city}</span>
                    </p>
                  </div>
                </div>

                {/* Status & Payment Controls */}
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col gap-4">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#f68048]"></div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                     <CreditCard size={14} /> Menaxhimi i Porosisë
                  </h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Statusi i Porosisë</label>
                    <div className="relative">
                      <select
                        className="w-full bg-gray-50 text-sm h-10 pl-3 pr-8 rounded-lg border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-bold"
                        value={selectedOrder.order_status}
                        onChange={e => handleStatusUpdate(selectedOrder.id, { order_status: e.target.value })}
                        disabled={saving}
                      >
                        {ORDER_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.order_status[s]}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      Statusi i Pagesës ({TRANSLATIONS.payment_type[selectedOrder.payment_type]})
                    </label>
                    <div className="relative">
                      <select
                        className="w-full bg-gray-50 text-sm h-10 pl-3 pr-8 rounded-lg border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-bold"
                        value={selectedOrder.payment_status}
                        onChange={e => handleStatusUpdate(selectedOrder.id, { payment_status: e.target.value })}
                        disabled={saving}
                      >
                        {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.payment_status[s]}</option>)}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
                   <Box size={14} /> Produktet e Porositura
                </h4>
                <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  {(selectedOrder.items || []).filter(item => item && item.id).map((item, i) => (
                    <div key={i} className="flex justify-between items-center bg-white border-b border-gray-50 last:border-none px-5 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.product_name}</span>
                        <span className="text-xs text-gray-400 font-medium mt-0.5">Sasia: {item.quantity} × €{parseFloat(item.price_at_purchase).toFixed(2)}</span>
                      </div>
                      <span className="font-black text-gray-800">€{(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-5 py-4 bg-gray-50/80 border-t border-gray-100">
                    <span className="font-black text-xs uppercase tracking-wider text-gray-500">Shuma Totale Përfundimtare</span>
                    <span className="font-black text-xl text-[#f68048]">€{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end shrink-0">
              <button 
                className="py-2.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors" 
                onClick={() => setSelectedOrder(null)}
              >
                Mbyll
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}