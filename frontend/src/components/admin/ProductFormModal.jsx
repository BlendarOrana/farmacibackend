import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { X, UploadCloud, CheckCircle2, Plus, Trash2 } from "lucide-react"; // Shtova Plus dhe Trash2

const EMPTY_FORM = { 
  name: "", 
  description: "", 
  price: "", 
  quantity: "", 
  category_id: "" 
};

export default function ProductFormModal({ target, categories, onClose, onSuccess }) {
  const { createProduct, updateProduct } = useAdminStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  // --- STATE PËR VLERAT USHQYESE (NUTRITION) ---
  const [hasNutrition, setHasNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState({
    serving_size: "",
    servings_per_container: "",
    nutrients: [{ name: "", amount: "",}]
  });

  useEffect(() => {
    if (target) {
      setForm({
        name: target.name,
        description: target.description || "",
        price: target.price, 
        quantity: target.quantity,
        category_id: target.category_id || "",
      });
      setImagePreview(target.image_url || null);

      // Ngarko të dhënat e suplementeve nëse ekzistojnë
      if (target.nutritional_info) {
        setHasNutrition(true);
        setNutritionData({
          serving_size: target.nutritional_info.serving_size || "",
          servings_per_container: target.nutritional_info.servings_per_container || "",
nutrients: target.nutritional_info.nutrients?.length > 0 
  ? target.nutritional_info.nutrients.map(({ name, amount }) => ({ name, amount }))
  : [{ name: "", amount: "" }]
        });
      } else {
        setHasNutrition(false);
      }
    }
  }, [target]);

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  // Funksionet për Nutrients
  const handleNutritionChange = (field, value) => {
    setNutritionData(prev => ({ ...prev, [field]: value }));
  };

  const addNutrientRow = () => {
    setNutritionData(prev => ({
      ...prev,
      nutrients: [...prev.nutrients, { name: "", amount: ""}]
    }));
  };

  const removeNutrientRow = (index) => {
    const updated = [...nutritionData.nutrients];
    updated.splice(index, 1);
    setNutritionData(prev => ({ ...prev, nutrients: updated }));
  };

  const handleNutrientRowChange = (index, field, value) => {
    const updated = [...nutritionData.nutrients];
    updated[index][field] = value;
    setNutritionData(prev => ({ ...prev, nutrients: updated }));
  };

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v !== "" && v !== null) fd.append(k, v);
    });
    if (imageFile) fd.append("image", imageFile);

    // Shto të dhënat e suplementit nëse opsioni është aktiv
    if (hasNutrition) {
      // Pastro rreshtat bosh që mos të ruhen kot në DB
const cleanNutrients = nutritionData.nutrients
  .filter(n => n.name.trim() !== "")
  .map(({ name, amount }) => ({ name, amount }));      const finalNutritionData = { ...nutritionData, nutrients: cleanNutrients };
      fd.append("nutritional_info", JSON.stringify(finalNutritionData));
    } else {
      fd.append("nutritional_info", "null"); // Fshijeni nëse u çaktivizua
    }

    const result = target
      ? await updateProduct(target.id, fd)
      : await createProduct(fd);

    setSaving(false);
    if (result.success) onSuccess(target ? "Produkti u përditësua!" : "Produkti u krijua me sukses!");
  };

  const LBL = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1";
  const INP = "w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900 border border-gray-100 focus:bg-white focus:border-[#f68048] focus:ring-4 focus:ring-[#f68048]/10 transition-all outline-none placeholder:text-gray-300 font-medium";
const INP_SM = "min-w-0 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 border border-gray-200 focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/10 transition-all outline-none placeholder:text-gray-300 font-medium";
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
      <div className="bg-white rounded-[28px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-2xl tracking-tight text-gray-900 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f68048]/10 text-[#f68048] flex items-center justify-center">
              <CheckCircle2 size={18} strokeWidth={2.5} />
            </div>
            {target ? "Përditëso Produktin" : "Krijo Produkt"}
          </h3>
          <button className="text-gray-400 hover:bg-gray-100 hover:text-black p-2 rounded-full transition-colors" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-8 pt-6 pb-2 space-y-6 form-custom-scrollbar flex-1">
          {/* Imazhi */}
          <div>
            <label className={LBL}>Imazhi i Produktit</label>
            <div className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden bg-gray-50/50 hover:bg-orange-50 group min-h-[160px] ${imagePreview ? "border-transparent bg-black relative" : "border-gray-200 hover:border-[#f68048]/60"}`} onClick={() => fileRef.current?.click()}>
              {imagePreview ? (
                <div className="w-full relative flex justify-center group bg-black rounded-xl">
                  <img src={imagePreview} className="max-h-[220px] object-contain bg-white w-full rounded-xl opacity-90 group-hover:opacity-60 transition-opacity" alt="Preview" />
                  <div className="absolute inset-0 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-bold bg-black/60 px-4 py-2 rounded-lg text-sm flex gap-2"><UploadCloud size={18} /> Ndrysho imazhin</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full space-y-3 py-6 pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform"><UploadCloud size={24} className="text-[#f68048]" strokeWidth={2.5} /></div>
                  <span className="text-sm font-semibold text-gray-500">Kliko për të ngarkuar imazh</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </div>

          <div>
            <label className={LBL}>Emri i Produktit *</label>
            <input className={INP} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shkruaj emrin e produktit..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Çmimi BAZË *</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">€</span>
                <input type="number" step="0.01" className={`${INP} pl-8 text-[#f68048] font-black`} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
              </div>
            </div>
            <div>
              <label className={LBL}>Sasia e Stokut</label>
              <input type="number" min="0" className={INP} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
            </div>
          </div>

          <div>
            <label className={LBL}>Kategoria</label>
            <select className={`${INP} cursor-pointer appearance-none bg-no-repeat`} style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundPositionX: "calc(100% - 16px)", backgroundPositionY: "50%" }} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="" disabled className="text-gray-200">Pa kategori</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* --- NUTRITION SECTION --- */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                   Vlerat Ushqyese 
                </h4>
                <p className="text-xs text-gray-500 mt-1">(Opsionale)</p>
              </div>
              
              {/* Toggle Button */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasNutrition} onChange={() => setHasNutrition(!hasNutrition)} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f68048]"></div>
              </label>
            </div>

            {hasNutrition && (
              <div className="mt-5 space-y-5 border-t border-gray-200 pt-5 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LBL}>
                      Serving Size <span className="normal-case font-normal text-gray-400 ml-1">(Opcionale)</span>
                    </label>
                    <input className={INP_SM} placeholder="psh. 1 Tabletë" value={nutritionData.serving_size} onChange={e => handleNutritionChange('serving_size', e.target.value)} />
                  </div>
                  <div>
                    <label className={LBL}>
                      Servings Per Container <span className="normal-case font-normal text-gray-400 ml-1">(Opcionale)</span>
                    </label>
                    <input className={INP_SM} placeholder="psh. 60" value={nutritionData.servings_per_container} onChange={e => handleNutritionChange('servings_per_container', e.target.value)} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className={LBL}>Përbërësit (Vitamina / Minerale)</label>
                    <button type="button" onClick={addNutrientRow} className="text-xs font-bold text-[#f68048] hover:text-[#e06830] flex items-center gap-1 bg-[#f68048]/10 hover:bg-[#f68048]/20 px-2 py-1 rounded-lg transition-colors">
                      <Plus size={14} strokeWidth={3} /> Shto Rresht
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Headers */}
                    <div className="flex gap-2 px-1">
                      <div className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emri</div>
                      <div className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sasia</div>
                      <div className="w-8"></div>
                    </div>

                    {nutritionData.nutrients.map((nutrient, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input className={`${INP_SM} flex-1 `} placeholder="psh. Vitamina C" value={nutrient.name} onChange={(e) => handleNutrientRowChange(index, 'name', e.target.value)} />
                        <input className={`${INP_SM} w-24`} placeholder="psh. 100mg" value={nutrient.amount} onChange={(e) => handleNutrientRowChange(index, 'amount', e.target.value)} />
                        <button type="button" onClick={() => removeNutrientRow(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="pb-4">
            <label className={LBL}>Përshkrimi</label>
            <textarea className={`${INP} resize-none min-h-[90px]`} rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Shkruaj përshkrimin e produktit..." />
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-gray-100 flex justify-end gap-3 shrink-0 bg-gray-50/50 rounded-b-[28px]">
          <button className="px-6 py-3 font-bold rounded-xl text-gray-500 hover:text-black transition-colors" onClick={onClose} disabled={saving}>Anulo</button>
          <button className="px-8 py-3 rounded-xl font-bold bg-[#f68048] hover:bg-[#eb743b] text-white shadow-lg flex items-center gap-2 transform active:scale-95 disabled:opacity-50 transition-all" onClick={handleSave} disabled={saving || !form.name || !form.price}>
            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : "Ruaj Produktin"}
          </button>
        </div>
      </div>
    </div>
  );
}