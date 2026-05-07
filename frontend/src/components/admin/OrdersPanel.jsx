import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";

const STATUS_COLORS = {
  NEW: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-orange-50 text-orange-700 border-orange-200",
  SHIPPED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
};

const PAYMENT_STATUS_COLORS = {
  PENDING: "bg-orange-50 text-orange-700 border-orange-200",
  PAID: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const ORDER_STATUSES = ["NEW", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
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
    setTimeout(() => setToast(null), 3000);
  };

  const handleStatusUpdate = async (id, updates) => {
    setSaving(true);
    const result = await updateOrderStatus(id, updates);
    setSaving(false);
    if (result.success) {
      showToast("Order updated successfully");
      // Fetch fresh order details so modal stays updated
      await fetchOrder(id);
    } else {
      showToast(result.message, "error");
    }
  };

  const openOrder = async (id) => {
    await fetchOrder(id);
  };

  return (
    <div className="flex flex-col gap-6 text-base-content">
      {/* Toast Notifications */}
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert rounded-md text-sm font-medium shadow-sm border ${
            toast.type === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"
          }`}>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Orders <span className="text-sm font-medium text-base-content/50 ml-2">({orders.length})</span>
        </h2>
        
        <div className="flex flex-wrap items-center gap-2">
          <select
            className="select select-bordered select-sm rounded-md bg-base-50"
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="select select-bordered select-sm rounded-md bg-base-50"
            value={filters.payment_status}
            onChange={e => setFilters(f => ({ ...f, payment_status: e.target.value }))}
          >
            <option value="">All Payment Statuses</option>
            {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="select select-bordered select-sm rounded-md bg-base-50"
            value={filters.payment_type}
            onChange={e => setFilters(f => ({ ...f, payment_type: e.target.value }))}
          >
            <option value="">All Payment Types</option>
            {PAYMENT_TYPES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        {ordersLoading ? (
          <div className="flex justify-center py-16"><span className="loading loading-spinner loading-md text-neutral" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-base-content/40 text-sm">No orders match your filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/50 text-base-content/70 border-b border-base-200 text-xs uppercase tracking-wider">
                  <th className="font-semibold py-3 pl-4">Order ID</th>
                  <th className="font-semibold py-3">Customer</th>
                  <th className="font-semibold py-3">Location</th>
                  <th className="font-semibold py-3">Total</th>
                  <th className="font-semibold py-3">Payment</th>
                  <th className="font-semibold py-3">Status</th>
                  <th className="font-semibold py-3">Date</th>
                  <th className="text-right font-semibold py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-base-50 border-b border-base-200 last:border-none transition-colors">
                    <td className="py-3 pl-4 font-mono text-xs text-base-content/50">#{o.id}</td>
                    <td className="py-3">
                      <div>
                        <p className="font-semibold text-base-content">{o.customer_name}</p>
                        <p className="text-xs text-base-content/50 mt-0.5">{o.customer_email}</p>
                      </div>
                    </td>
                    <td className="py-3 text-base-content/70">{o.city}</td>
                    <td className="py-3 font-semibold text-base-content">€{parseFloat(o.total_amount).toFixed(2)}</td>
                    <td className="py-3">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="text-xs font-medium text-base-content/60">
                          {o.payment_type === "ON_DELIVERY" ? "Cash on Delivery" : "Card"}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${PAYMENT_STATUS_COLORS[o.payment_status] || "bg-base-200 text-base-content/70"}`}>
                          {o.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[o.order_status] || "bg-base-200 text-base-content/70"}`}>
                        {o.order_status}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-base-content/50">
                      {new Date(o.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-3 pr-4 text-right">
                      <button
                        className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content rounded"
                        onClick={() => openOrder(o.id)}
                      >
                        Manage
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
        <dialog className="modal modal-open bg-black/40 backdrop-blur-sm">
          <div className="modal-box max-w-2xl rounded-xl shadow-xl border border-base-200 p-0 overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-base-200/50 px-6 py-4 border-b border-base-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg tracking-tight">Order #{selectedOrder.id}</h3>
                <p className="text-xs text-base-content/50 mt-0.5">
                  Placed on {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button className="btn btn-ghost btn-sm btn-circle rounded-md" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Customer Details Box */}
                <div className="bg-base-50 rounded-lg p-4 border border-base-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">Customer Info</h4>
                  <div className="flex flex-col gap-2 text-sm">
                    <p><span className="font-medium text-base-content/70 w-20 inline-block">Name:</span> {selectedOrder.customer_name}</p>
                    <p><span className="font-medium text-base-content/70 w-20 inline-block">Email:</span> {selectedOrder.customer_email}</p>
                    <p><span className="font-medium text-base-content/70 w-20 inline-block">Phone:</span> {selectedOrder.phone_number}</p>
                    <p><span className="font-medium text-base-content/70 w-20 inline-block">Address:</span> {selectedOrder.address}, {selectedOrder.city}</p>
                  </div>
                </div>

                {/* Status & Payment Controls */}
                <div className="bg-base-50 rounded-lg p-4 border border-base-200 flex flex-col gap-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-1">Status Management</h4>
                  
                  <div className="form-control">
                    <label className="label py-0 mb-1"><span className="label-text text-xs font-semibold text-base-content/70">Order Status</span></label>
                    <select
                      className="select select-bordered select-sm rounded-md w-full"
                      value={selectedOrder.order_status}
                      onChange={e => handleStatusUpdate(selectedOrder.id, { order_status: e.target.value })}
                      disabled={saving}
                    >
                      {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label py-0 mb-1">
                      <span className="label-text text-xs font-semibold text-base-content/70">Payment Status ({selectedOrder.payment_type.replace("_", " ")})</span>
                    </label>
                    <select
                      className="select select-bordered select-sm rounded-md w-full"
                      value={selectedOrder.payment_status}
                      onChange={e => handleStatusUpdate(selectedOrder.id, { payment_status: e.target.value })}
                      disabled={saving}
                    >
                      {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/50 mb-3">Ordered Items</h4>
                <div className="border border-base-200 rounded-lg overflow-hidden">
                  {(selectedOrder.items || []).filter(item => item && item.id).map((item, i) => (
                    <div key={i} className="flex justify-between items-center text-sm bg-base-50 border-b border-base-200 last:border-none px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-base-content">{item.product_name}</span>
                        <span className="text-xs text-base-content/60">Qty: {item.quantity} × €{parseFloat(item.price_at_purchase).toFixed(2)}</span>
                      </div>
                      <span className="font-mono font-medium">€{(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-base-200/30">
                    <span className="font-bold text-sm uppercase tracking-wide">Total Amount</span>
                    <span className="font-mono font-bold text-lg">€{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-base-200/50 border-t border-base-200 flex justify-end">
              <button className="btn btn-neutral rounded-md" onClick={() => setSelectedOrder(null)}>Done</button>
            </div>
          </div>
          <div className="modal-backdrop bg-transparent" onClick={() => setSelectedOrder(null)} />
        </dialog>
      )}
    </div>
  );
}