import { useState } from "react";
import { Copy, ImageOff, CheckSquare, Square, Tag, Trash2, Clock } from "lucide-react";
import { useAdminStore } from "../../stores/useAdminStore";
import DiscountModal from "./DiscountModal"; // Importo komponentin e ri

export default function ProductsTable({ products, isLoading, onEdit, onStock, onDelete }) {
  const [selectedIds, setSelectedIds] = useState([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [removingD, setRemovingD] = useState(false);

  const { applyBulkDiscount, removeBulkDiscount } = useAdminStore();

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === products.length) setSelectedIds([]);
    else setSelectedIds(products.map((p) => p.id));
  };

  const handleApplyDiscount = async (discountData) => {
    await applyBulkDiscount({
      product_ids: selectedIds,
      ...discountData
    });
    setShowDiscountModal(false);
    setSelectedIds([]);
  };

  const handleRemoveDiscounts = async () => {
    setRemovingD(true);
    await removeBulkDiscount(selectedIds);
    setRemovingD(false);
    setSelectedIds([]);
  };

  // Funksion i vogël për të llogaritur ditët e mbetura të zbritjes
  const getDaysLeft = (endDateStr) => {
    if (!endDateStr) return 0;
    const end = new Date(endDateStr);
    const now = new Date();
    const diff = end - now;
    return diff > 0 ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : 0;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-current border-t-transparent text-[#f68048]" />
          <span className="font-semibold text-sm">Po ngarkohen produktet...</span>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex justify-center items-center text-gray-300 mb-4">
          <Copy size={24} />
        </div>
        <h3 className="text-gray-900 font-bold text-lg">Nuk u gjet asnjë produkt</h3>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative">
      
      {/* BULK ACTIONS HEADER */}
      {selectedIds.length > 0 && (
        <div className="bg-[#fff4f0] border-b border-[#fce2d7] px-6 py-4 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="bg-[#f68048] text-white w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold">
              {selectedIds.length}
            </div>
            <span className="text-[#f68048] font-bold text-sm tracking-wide">
              Produkte të zgjedhura
            </span>
          </div>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 bg-white text-gray-600 rounded-lg text-xs font-bold shadow-sm border border-[#fce2d7] hover:bg-gray-50"
              onClick={() => setSelectedIds([])}
            >
              Anulo
            </button>
            <button
              className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold shadow-sm border border-red-100 hover:bg-red-100 flex items-center gap-2 disabled:opacity-50"
              onClick={handleRemoveDiscounts}
              disabled={removingD}
            >
              <Trash2 size={14} /> {removingD ? "Po Hiqet..." : "Hiq Zbritjet"}
            </button>
            <button
              className="px-4 py-2 bg-[#f68048] text-white rounded-lg text-xs font-bold shadow-sm hover:bg-[#e67540] flex items-center gap-2"
              onClick={() => setShowDiscountModal(true)}
            >
              <Tag size={14} /> Apliko Zbritje
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto min-w-[700px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/60 border-b border-gray-100 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <th className="py-5 pl-6 w-[5%] text-center cursor-pointer" onClick={selectAll}>
                {selectedIds.length === products.length ? (
                  <CheckSquare size={18} className="text-[#f68048]" />
                ) : (
                  <Square size={18} className="text-gray-300" />
                )}
              </th>
              <th className="py-5 pl-2 w-[35%]">Produkti</th>
              <th className="py-5 pr-6 w-[15%]">Kategoria</th>
              <th className="py-5 pr-6 w-[20%]">Çmimi</th>
              <th className="py-5 pr-6 w-[10%]">Stoku</th>
              <th className="py-5 pr-8 text-right w-[15%]">Veprime</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50/50">
            {products.map((p) => {
              // Supozojmë që backendi kthen 'active_discount_price', 'discount_end_date', 'discount_type', 'discount_value'
              const isPromo = p.active_discount_price != null;
              const currentPrice = isPromo ? parseFloat(p.active_discount_price) : parseFloat(p.price);
              const originalPrice = parseFloat(p.price);

              const discountPercent = isPromo && p.discount_type === "percentage"
                  ? Number(p.discount_value)
                  : isPromo
                  ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
                  : 0;

              const isSelected = selectedIds.includes(p.id);
              const daysLeft = isPromo ? getDaysLeft(p.discount_end_date) : 0;

              return (
                <tr key={p.id} className={`hover:bg-[#fafafa] transition-colors group ${isSelected ? "bg-orange-50/30" : ""}`}>
                  <td className="py-4 pl-6 text-center cursor-pointer" onClick={() => toggleSelect(p.id)}>
                    {isSelected ? (
                      <CheckSquare size={18} className="text-[#f68048]" />
                    ) : (
                      <Square size={18} className="text-gray-200 group-hover:text-gray-400" />
                    )}
                  </td>
                  <td className="py-4 pl-2">
                    <div className="flex items-center gap-5">
                      <div className="w-[52px] h-[52px] rounded-xl bg-gray-50 border border-gray-100/60 overflow-hidden flex-shrink-0 relative">
                        {isPromo && (
                          <div className="absolute top-0 right-0 bg-[#f68048] text-white text-[10px] font-black px-1.5 rounded-bl-xl z-10 shadow-sm leading-tight pt-1">
                            -{discountPercent}%
                          </div>
                        )}
                        {p.image_url ? (
                          <img src={p.image_url} alt={p.name} className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform" />
                        ) : (
                          <ImageOff className="m-auto mt-4 w-4 h-4 text-gray-300" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[15px] text-gray-900 group-hover:text-[#f68048] transition-colors line-clamp-1">{p.name}</p>
                        <p className="text-[13px] font-medium text-gray-400 line-clamp-1 mt-0.5">{p.description || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-6 text-gray-500 font-medium text-[14px]">
                    {p.category_name || "Pa Kategori"}
                  </td>
                  <td className="py-4 pr-6">
                    {isPromo ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-end gap-1.5">
                          <span className="text-[#f68048] font-black text-[15px]">€{currentPrice.toFixed(2)}</span>
                          <span className="text-[12px] line-through text-gray-300 font-bold mb-0.5">€{originalPrice.toFixed(2)}</span>
                        </div>
                        {/* UI PËR TË TREGUAR DITËT E MBETURA DHE LLOJIN E ZBRITJES */}
                        <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md w-max border border-orange-100">
                           <Clock size={10} /> 
                           {p.discount_type === 'fixed' ? `- €${Number(p.discount_value)}` : `${Number(p.discount_value)}%`} • {daysLeft} Ditë të mbetura
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-900 font-bold text-[15px]">€{originalPrice.toFixed(2)}</span>
                    )}
                  </td>
                  <td className="py-4 pr-6">
                    <span
                      className={`inline-flex items-center justify-center px-2.5 py-1.5 rounded-md text-[11px] font-bold tracking-wide uppercase border ${
                        p.quantity === 0
                          ? "bg-gray-900 text-white border-black"
                          : p.quantity < 5
                          ? "bg-[#fff0eb] text-[#f68048] border-[#fce2d7]"
                          : "bg-gray-50 text-gray-600 border-gray-100"
                      }`}
                    >
                      {p.quantity} Copë
                    </span>
                  </td>
                  <td className="py-4 pr-8">
                    <div className="flex justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors" onClick={() => onStock(p)}>Sasi</button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 hover:text-white hover:bg-[#f68048] transition-colors" onClick={() => onEdit(p)}>Ndrysho</button>
                      <button className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-black transition-colors" onClick={() => onDelete(p)}>Fshi</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <DiscountModal 
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApply={handleApplyDiscount}
        selectedCount={selectedIds.length}
      />
    </div>
  );
}