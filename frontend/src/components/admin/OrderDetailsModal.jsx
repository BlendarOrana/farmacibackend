// components/OrderDetailsModal.jsx
import React from "react";
import { X, User, Mail, Phone, MapPin, CreditCard, ChevronDown, Box, Ticket } from "lucide-react";

export default function OrderDetailsModal({ 
  order, 
  onClose, 
  onStatusUpdate, 
  saving, 
  constants 
}) {
  const { ORDER_STATUSES, PAYMENT_STATUSES, TRANSLATIONS } = constants;

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white rounded-[24px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gray-50/80 px-8 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="font-black text-xl text-gray-900 flex items-center gap-2 tracking-tight">
              Porosia <span className="text-[#f68048]">#{order.id}</span>
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-1">
              Krijuar më: {new Date(order.created_at).toLocaleString('sq-AL')}
            </p>
          </div>
          <button 
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-colors" 
            onClick={onClose}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 overflow-y-auto">
          {/* Alert Kuponi */}
          {order.applied_coupon && (
            <div className="mb-6 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center gap-3">
               <div className="bg-white p-2 rounded-lg shadow-sm text-[#f68048]">
                 <Ticket size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-bold text-gray-900 mb-0.5">Kupon i aplikuar: {order.applied_coupon}</h4>
                  <p className="text-xs font-medium text-[#f68048]">
                    Zbritje nga kuponi: {order.coupon_discount_value}
                    {order.coupon_discount_type === 'percentage' ? '%' : '€'}
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
                <p className="flex items-center gap-3"><span className="text-gray-400"><User size={16}/></span> <span className="font-bold text-gray-800">{order.customer_name}</span></p>
                <p className="flex items-center gap-3"><span className="text-gray-400"><Mail size={16}/></span> <span className="font-medium text-gray-600">{order.customer_email}</span></p>
                <p className="flex items-center gap-3"><span className="text-gray-400"><Phone size={16}/></span> <span className="font-medium text-gray-600">{order.phone_number}</span></p>
                <p className="flex items-start gap-3 mt-1 pt-3 border-t border-gray-100">
                   <span className="text-gray-400 mt-0.5"><MapPin size={16}/></span> 
                   <span className="font-medium text-gray-600 leading-relaxed">{order.address}, {order.city}</span>
                </p>
              </div>
            </div>

            {/* Status Controls */}
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
                    value={order.order_status}
                    onChange={e => onStatusUpdate(order.id, { order_status: e.target.value })}
                    disabled={saving}
                  >
                    {ORDER_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.order_status[s]}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  Statusi i Pagesës ({TRANSLATIONS.payment_type[order.payment_type]})
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-50 text-sm h-10 pl-3 pr-8 rounded-lg border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-bold"
                    value={order.payment_status}
                    onChange={e => onStatusUpdate(order.id, { payment_status: e.target.value })}
                    disabled={saving}
                  >
                    {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{TRANSLATIONS.payment_status[s]}</option>)}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
               <Box size={14} /> Produktet e Porositura
            </h4>
            <div className="border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
              {(order.items || []).filter(item => item && item.id).map((item, i) => (
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
                <span className="font-black text-xl text-[#f68048]">€{parseFloat(order.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-5 bg-white border-t border-gray-100 flex justify-end shrink-0">
          <button 
            className="py-2.5 px-6 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors" 
            onClick={onClose}
          >
            Mbyll
          </button>
        </div>
      </div>
    </div>
  );
}