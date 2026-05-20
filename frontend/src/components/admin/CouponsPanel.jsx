import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { Plus, Trash2, AlertCircle, Info, Tag, Search, X, Check, Wand2 } from "lucide-react";

// --- KOMPONENTË NDIHMËS ---
function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
    orange: "bg-orange-50 text-[#f68048]",
    gray: "bg-gray-50 text-gray-500",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold ${colors[color]}`}>
      {children}
    </span>
  );
}

// --- MODALI I KRIJIMIT TË KUPONIT ---
function CouponFormModal({ onClose, onSuccess }) {
  const { createCoupon, products, categories } = useAdminStore();
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    code: "", discount_type: "percentage", discount_value: "", valid_for_name: "", max_uses: ""
  });

  // Logjika e targetimit
  const [targetType, setTargetType] = useState("all"); // 'all', 'category', 'products'
  const [selectedCat, setSelectedCat] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const generateCode = () => {
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    set("code", code);
  };

  const handleSubmit = async () => {
    if (!form.code || !form.discount_value) return;
    setSaving(true);

    let product_ids = [];
    
    // Gjej ID-të e produkteve nëse zgjidhet Kategori
    if (targetType === "category" && selectedCat) {
      product_ids = products
        .filter(p => 
          String(p.category_id) === String(selectedCat) || 
          String(p.category?.id) === String(selectedCat) ||
          String(p.category) === String(selectedCat)
        )
        .map(p => p.id);
    } 
    // Ose ID-të e zgjedhura manualisht
    else if (targetType === "products") {
      product_ids = selectedProducts;
    }

    const payload = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      valid_for_name: form.valid_for_name.trim() || null,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      product_ids: product_ids,
    };

    const result = await createCoupon(payload);
    setSaving(false);
    if (result.success) onSuccess("Kuponi u krijua me sukses");
    else onSuccess(result.message, "error");
  };

  const inputCls = "w-full bg-gray-50 text-sm h-[42px] px-3 rounded-lg border border-transparent focus:bg-white focus:border-[#f68048] outline-none transition-all";
  const labelCls = "block text-[11px] font-bold text-gray-500 uppercase mb-1";

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Krijo Kupon</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex flex-col gap-4">
          
          {/* Kodi */}
          <div>
            <label className={labelCls}>Kodi</label>
            <div className="flex gap-2">
              <input className={`${inputCls} uppercase font-bold`} placeholder="psh. ZBRITJE20" value={form.code} onChange={(e) => set("code", e.target.value)} />
              <button onClick={generateCode} className="px-3 bg-[#fff4f0] text-[#f68048] rounded-lg font-bold text-xs hover:bg-[#ffe5da] flex items-center gap-1 transition-colors">
                <Wand2 size={14}/> Gjenero
              </button>
            </div>
          </div>

          {/* Vlera */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Lloji</label>
              <select className={inputCls} value={form.discount_type} onChange={(e) => set("discount_type", e.target.value)}>
                <option value="percentage">Përqindje (%)</option>
                <option value="fixed">Vlerë Fikse (€)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Vlera</label>
              <input type="number" min="0" className={inputCls} placeholder="20" value={form.discount_value} onChange={(e) => set("discount_value", e.target.value)} />
            </div>
          </div>

          {/* Targetimi - Pjesa e thjeshtuar */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <label className={labelCls}>Kush përfiton zbritje?</label>
            <select className={`${inputCls} bg-white mb-3`} value={targetType} onChange={e => { setTargetType(e.target.value); setSelectedCat(""); setSelectedProducts([]); }}>
              <option value="all">Të gjitha produktet</option>
              <option value="category">Kategori Specifike</option>
              <option value="products">Produkte Specifike</option>
            </select>

            {targetType === "category" && (
              <select className={`${inputCls} bg-white`} value={selectedCat} onChange={e => setSelectedCat(e.target.value)}>
                <option value="">-- Zgjidh Kategorinë --</option>
                {categories?.map(c => <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>)}
              </select>
            )}

            {targetType === "products" && (
              <div className="bg-white border border-gray-200 rounded-lg max-h-32 overflow-y-auto p-2 space-y-1">
                {products?.map(p => (
                  <label key={p.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={(e) => {
                      if (e.target.checked) setSelectedProducts([...selectedProducts, p.id]);
                      else setSelectedProducts(selectedProducts.filter(id => id !== p.id));
                    }} className="accent-[#f68048]" />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Opsionale */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Për Klientin <span className="text-gray-400 normal-case">(Opsional)</span></label>
              <input className={inputCls} placeholder="Emri klientit" value={form.valid_for_name} onChange={(e) => set("valid_for_name", e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Limiti përdorimeve <span className="text-gray-400 normal-case">(Opsional)</span></label>
              <input type="number" min="1" className={inputCls} placeholder="Pa limit" value={form.max_uses} onChange={(e) => set("max_uses", e.target.value)} />
            </div>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button className="flex-1 py-3 rounded-lg font-bold text-gray-600 bg-gray-100 hover:bg-gray-200" onClick={onClose}>Anulo</button>
          <button 
            className="flex-1 py-3 rounded-lg font-bold text-white bg-[#f68048] hover:bg-[#e67540] disabled:opacity-50 flex justify-center items-center gap-2"
            onClick={handleSubmit} 
            disabled={saving || !form.code || !form.discount_value}
          >
            {saving ? "Po ruhet..." : <><Check size={18}/> Ruaj Kuponin</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- MODALI I FSHIRJES ---
function DeleteModal({ target, onClose, onConfirm, saving }) {
  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center relative z-10">
        <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
          <Trash2 size={24} />
        </div>
        <h3 className="font-bold text-xl mb-2">Fshi Kuponin</h3>
        <p className="text-sm text-gray-500 mb-6">Jeni i sigurt që doni të fshini kuponin <b className="text-gray-900">{target?.code}</b>?</p>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-lg font-bold bg-gray-100 text-gray-600" onClick={onClose}>Anulo</button>
          <button className="flex-1 py-3 rounded-lg font-bold bg-black text-white disabled:opacity-50" onClick={onConfirm} disabled={saving}>
            {saving ? "Po fshihet..." : "Fshi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- KOMPONENTI KRYESOR ---
export default function CouponsPanel() {
  const { coupons, fetchCoupons, deleteCoupon, categories, fetchCategories, products, fetchProducts } = useAdminStore();
  const [modal, setModal] = useState(null);
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // Bëj fetch automatikisht vetëm nëse të dhënat janë bosh
  useEffect(() => { 
    fetchCoupons(); 
    if (!categories || categories.length === 0) fetchCategories();
    if (!products || products.length === 0) fetchProducts();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => { setModal(null); setTarget(null); };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteCoupon(target.id);
    setSaving(false);
    if (result.success) { showToast("Kuponi u fshi"); closeModal(); }
    else showToast(result.message, "error");
  };

  const filtered = coupons?.filter((c) => c.code.toLowerCase().includes(search.toLowerCase()) );
  const isExpired = (c) => c.max_uses !== null && c.used_count >= c.max_uses;

  return (
    <div className="flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] bg-white px-5 py-4 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3 animate-in slide-in-from-top-4">
          {toast.type === "error" ? <AlertCircle className="text-gray-900 w-5 h-5" /> : <Info className="text-[#f68048] w-5 h-5" />}
          <span className="font-semibold text-gray-800 text-sm">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex gap-6 items-center">
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Totali</p>
            <p className="text-2xl font-black">{coupons?.length || 0}</p>
          </div>
          <div className="w-px h-10 bg-gray-100" />
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase">Aktivë</p>
            <p className="text-2xl font-black text-[#f68048]">{coupons?.filter(c => !isExpired(c)).length || 0}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="relative w-full sm:w-60">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" placeholder="Kërko kodin..." 
              className="w-full bg-gray-50 text-sm h-11 pl-9 pr-4 rounded-xl outline-none focus:border-[#f68048] border border-transparent"
              value={search} onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="h-11 px-5 bg-[#f68048] hover:bg-[#e67540] text-white rounded-xl font-semibold flex items-center gap-2" onClick={() => setModal("create")}>
            <Plus size={18} /> Shto Kupon
          </button>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        {filtered?.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm font-bold">Nuk ka kuponë për tu shfaqur.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50/80 text-[11px] text-gray-400 uppercase font-bold">
              <tr>
                <th className="px-6 py-4">Kodi</th>
                <th className="px-4 py-4">Zbritja</th>
                <th className="px-4 py-4">Produktet</th>
                <th className="px-4 py-4">Përdorimet</th>
                <th className="px-4 py-4">Statusi</th>
                <th className="px-4 py-4 text-right">Aksion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered?.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-black text-gray-900">{coupon.code}</td>
                  <td className="px-4 py-4">
                    <Badge color="orange">{coupon.discount_type === "percentage" ? `-${coupon.discount_value}%` : `-€${coupon.discount_value}`}</Badge>
                  </td>
                  <td className="px-4 py-4">
                    {!coupon.product_ids?.length ? "Të gjitha" : <span className="text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">{coupon.product_ids.length} produkte</span>}
                  </td>
                  <td className="px-4 py-4 font-semibold text-gray-700">
                    {coupon.used_count ?? 0} {coupon.max_uses && <span className="text-gray-400 font-normal">/ {coupon.max_uses}</span>}
                  </td>
                  <td className="px-4 py-4">
                    {isExpired(coupon) ? <Badge color="red">Përfunduar</Badge> : <Badge color="green">Aktiv</Badge>}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="text-gray-400 hover:text-red-500 p-2" onClick={() => { setTarget(coupon); setModal("delete"); }}>
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal === "create" && <CouponFormModal onClose={closeModal} onSuccess={(msg, type) => { showToast(msg, type); if (type !== "error") closeModal(); }} />}
      {modal === "delete" && <DeleteModal target={target} onClose={closeModal} onConfirm={handleDelete} saving={saving} />}
    </div>
  );
}