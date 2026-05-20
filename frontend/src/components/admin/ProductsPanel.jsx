import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import ProductsTable from "./ProductsTable.jsx";
import ProductFormModal from "./ProductFormModal.jsx";
import CategoriesManagerModal from "./CategoriesManagerModal.jsx";
import { Plus, Search, AlertCircle, Info, Trash2, Tags, ChevronDown } from "lucide-react";

export default function ProductsPanel() {
  const {
    products, productsLoading, fetchProducts,
    categories, fetchCategories,
    deleteProduct, updateStock,
  } = useAdminStore();

  const [activeTab, setActiveTab] = useState("all"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all"); 
  const [modal, setModal] = useState(null); 
  const [target, setTarget] = useState(null);
  const [stockVal, setStockVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { 
    fetchProducts(); 
    fetchCategories(); 
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => { setModal(null); setTarget(null); };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // FIX: Logjika e re për të parë nëse është promo apo jo
    const isPromo = p.active_discount_price != null;
    const isLowStock = p.quantity < 5;
    
    // Logjika e kategorisë
    const matchesCategory = 
      selectedCategory === "all" || 
      String(p.category_id) === String(selectedCategory) ||
      String(p.category) === String(selectedCategory) ||
      p.category?.id === selectedCategory ||
      p.category?.name === selectedCategory;

    if (!matchesSearch) return false;
    if (activeTab === "promo" && !isPromo) return false;
    if (activeTab === "low_stock" && !isLowStock) return false;
    if (!matchesCategory) return false; 
    return true;
  });

  const handleStock = async () => {
    setSaving(true);
    const result = await updateStock(target.id, parseInt(stockVal));
    setSaving(false);
    if (result.success) { showToast("Stock successfully updated"); closeModal(); }
    else showToast(result.message, "error");
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteProduct(target.id);
    setSaving(false);
    if (result.success) { showToast("Product deleted cleanly"); closeModal(); }
    else showToast(result.message, "error");
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Notifications */}
      {toast && (
        <div className="toast toast-top toast-end z-[9999] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white px-5 py-4 rounded-xl shadow-[0_10px_30px_0_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-3">
             {toast.type === "error" ? <AlertCircle className="text-gray-900 w-5 h-5" /> : <Info className="text-[#f68048] w-5 h-5"/> }
            <span className="font-semibold text-gray-800 text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Top Controller Ribbon */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
        
        {/* Logic Tabs */}
        <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100/60 w-full xl:w-auto relative z-10 overflow-x-auto">
          {["all", "promo", "low_stock"].map((tab) => {
            const labels = {
              all: `Inventori (${products.length})`,
              // FIX: Tani numëron saktë produktet me zbritje aktive nga DB
              promo: `Zbritje Aktive (${products.filter(p => p.active_discount_price != null).length})`,
              low_stock: `Stoku Ulët (${products.filter(p => p.quantity < 5).length})`
            };
            const isActive = activeTab === tab;
            
            return (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  flex-1 md:flex-none px-6 py-2.5 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-200 whitespace-nowrap
                  ${isActive 
                    ? "bg-white text-[#f68048] shadow-sm drop-shadow-[0_2px_4px_rgba(246,128,72,0.12)]" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"}
                `}
              >
                {labels[tab]}
              </button>
            )
          })}
        </div>

        {/* Global Action tools */}
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full xl:w-auto z-10 relative">
          
          <div className="relative w-full sm:w-auto md:w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Kerko produkte" 
              className="w-full bg-gray-50 text-sm h-[44px] pl-[38px] pr-4 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-auto min-w-[160px]">
            <select
              className="w-full bg-gray-50 text-sm h-[44px] pl-4 pr-10 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none appearance-none cursor-pointer font-medium"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Të gjitha kategoritë</option>
              {categories?.map((cat) => (
                <option key={cat.id || cat._id} value={cat.id || cat._id || cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
             <button 
                className="w-full sm:w-auto h-[44px] px-4 bg-white text-gray-700 hover:text-[#f68048] border border-gray-200 hover:border-[#f68048]/30 rounded-xl shadow-sm transition-colors font-bold flex items-center justify-center gap-2 group"
                onClick={() => setModal("categories")}
             >
                 <Plus size={18} strokeWidth={2.5} /> Kategori
             </button>

             <button 
                className="w-full sm:w-auto h-[44px] px-6 bg-[#f68048] hover:bg-[#e67540] text-white rounded-xl transition-all font-semibold flex items-center justify-center gap-2 transform active:scale-95 whitespace-nowrap" 
                onClick={() => setModal("form")}
             >
                <Plus size={18} strokeWidth={2.5} /> Shto produkt
             </button>
          </div>
        </div>
      </div>

      <ProductsTable 
        products={filteredProducts} 
        isLoading={productsLoading}
        onEdit={(p) => { setTarget(p); setModal("form"); }}
        onStock={(p) => { setTarget(p); setStockVal(p.quantity); setModal("stock"); }}
        onDelete={(p) => { setTarget(p); setModal("delete"); }}
      />

      {modal === "form" && (
        <ProductFormModal 
          target={target} 
          categories={categories} 
          onClose={closeModal} 
          onSuccess={(msg) => { showToast(msg); closeModal(); }} 
        />
      )}
      
      {modal === "categories" && (
        <CategoriesManagerModal
           onClose={closeModal}
           showToast={showToast}
        />
      )}

      {modal === "stock" && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="bg-white rounded-[24px] max-w-[340px] w-full p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100">
            <h3 className="font-bold text-xl text-gray-900 mb-1 text-center">Perditso stokun</h3>
            <p className="text-[13px] text-gray-400 font-medium mb-6 truncate text-center">{target?.name}</p>
            <div className="space-y-4">
              <input 
                type="number" min="0" 
                className="w-full text-center text-4xl font-black text-[#f68048] py-4 bg-gray-50 rounded-2xl outline-none border-2 border-transparent focus:bg-white focus:border-[#f68048] transition-all shadow-inner" 
                value={stockVal} onChange={e => setStockVal(e.target.value)} 
              />
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button className="py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors" onClick={closeModal}>Anulo</button>
                <button className="py-3 rounded-xl font-bold text-white bg-[#f68048] hover:bg-[#e67540] shadow-md shadow-[#f68048]/30 transition-transform active:scale-95 flex justify-center items-center" onClick={handleStock} disabled={saving}>
                  {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white animate-spin rounded-full"/> : "Ruaj"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modal === "delete" && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
          <div className="absolute inset-0" onClick={closeModal} />
          <div className="bg-white rounded-[28px] max-w-sm w-full p-8 shadow-2xl relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-[#fff4f0] rounded-full flex items-center justify-center mx-auto mb-5 text-[#f68048]">
               <Trash2 size={26} strokeWidth={2.5}/>
            </div>
            <h3 className="font-black text-2xl tracking-tight mb-2 text-gray-900">Fshij Produktin</h3>
            <p className="text-[14px] font-medium text-gray-500 mb-8 leading-relaxed">
               Jeni duke fshire <span className="text-gray-900 font-bold bg-gray-50 px-2 py-0.5 rounded border border-gray-100">{target?.name}</span> 
            </p>
            <div className="flex gap-3">
              <button className="flex-1 py-3.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors" onClick={closeModal}>Anulo</button>
              <button className="flex-1 py-3.5 rounded-xl font-bold text-white bg-black hover:bg-gray-900 shadow-lg shadow-black/20 transition-transform active:scale-95 flex items-center justify-center" onClick={handleDelete} disabled={saving}>
                {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white animate-spin rounded-full"/> : "Fshij"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}