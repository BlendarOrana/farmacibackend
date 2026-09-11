import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { X, UploadCloud, CheckCircle2, Plus, Trash2 } from "lucide-react"; 

const EMPTY_FORM = { 
  name: "", 
  description: "", 
  price: "", 
  quantity: "", 
  category_id: "",
  brand_id: ""
};

export default function ProductFormModal({ target, categories, brands, onClose, onSuccess, onError }) {
  const { createProduct, updateProduct } = useAdminStore();
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  
  // ✅ Menaxhimi i ndarë i Imazhit Kryesor dhe Galerisë
  const [mainImageFile, setMainImageFile] = useState(null);
  const [existingMainImage, setExistingMainImage] = useState(null);
  
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [existingGallery, setExistingGallery] = useState([]);

  const mainFileRef = useRef();
  const galleryFileRef = useRef();

  const [hasNutrition, setHasNutrition] = useState(false);
  const [nutritionData, setNutritionData] = useState({
    serving_size: "",
    servings_per_container: "",
    nutrients: [{ name: "", amount: "" }]
  });

  useEffect(() => {
    if (target) {
      setForm({
        name: target.name,
        description: target.description || "",
        price: target.price, 
        quantity: target.quantity,
        category_id: target.category_id || "",
        brand_id: target.brand_id || "" 
      });
      
      // Plotësojmë imazhet ekzistuese nga databaza
      if (target.image_url) setExistingMainImage(target.image_url);
      if (target.gallery_images && Array.isArray(target.gallery_images)) {
        setExistingGallery(target.gallery_images);
      }

      if (target.nutritional_info) {
        setHasNutrition(true);
        setNutritionData({
          serving_size: target.nutritional_info.serving_size || "",
          servings_per_container: target.nutritional_info.servings_per_container || "",
          nutrients: target.nutritional_info.nutrients?.length > 0 
            ? target.nutritional_info.nutrients.map(({ name, amount }) => ({ name, amount }))
            : [{ name: "", amount: "" }]
        });
      }
    }
  }, [target]);

  // Handlers për imazhet
  const handleMainImage = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setMainImageFile(e.target.files[0]);
    }
  };

  const handleGalleryImages = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setGalleryFiles(prev => [...prev, ...files]);
  };

  const removeGalleryFile = (index) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingGalleryImage = (index) => {
    setExistingGallery(prev => prev.filter((_, i) => i !== index));
  };

  // Handlers për vlerat ushqyese
  const handleNutritionChange = (field, value) => {
    setNutritionData(prev => ({ ...prev, [field]: value }));
  };
  const addNutrientRow = () => {
    setNutritionData(prev => ({ ...prev, nutrients: [...prev.nutrients, { name: "", amount: ""}] }));
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

    if (hasNutrition) {
      const cleanNutrients = nutritionData.nutrients
        .filter(n => n.name.trim() !== "")
        .map(({ name, amount }) => ({ name, amount }));      
      const finalNutritionData = { ...nutritionData, nutrients: cleanNutrients };
      fd.append("nutritional_info", JSON.stringify(finalNutritionData));
    } else {
      fd.append("nutritional_info", "null");
    }

    // ✅ Dërgojmë informacion tek backend se çfarë kemi përditësuar
    const isMainUpdated = mainImageFile ? "true" : "false";
    fd.append("main_image_updated", isMainUpdated);
    fd.append("existing_gallery", JSON.stringify(existingGallery));

    // Shtojmë imazhet në radhën e duhur për backend-in
    if (mainImageFile) {
      fd.append("images", mainImageFile);
    }
    galleryFiles.forEach((file) => {
      fd.append("images", file);
    });

    const result = target
      ? await updateProduct(target.id, fd)
      : await createProduct(fd);

    setSaving(false);
    if (result.success) {
      onSuccess(target ? "Produkti u përditësua!" : "Produkti u krijua me sukses!");
    } else {
      if(onError) onError(result.message);
    }
  };

  const LBL = "block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 pl-1";
  const INP = "w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900 border border-gray-100 focus:bg-white focus:border-[#f68048] focus:ring-4 focus:ring-[#f68048]/10 transition-all outline-none placeholder:text-gray-300 font-medium";
  const INP_SM = "min-w-0 bg-white rounded-lg px-3 py-2 text-sm text-gray-900 border border-gray-200 focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/10 transition-all outline-none placeholder:text-gray-300 font-medium";
  
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
      <div className="absolute inset-0 z-[-1]" onClick={onClose} />
      <div className="bg-white rounded-[28px] w-full max-w-[650px] shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200">
        
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

        <div className="overflow-y-auto p-8 pt-6 pb-2 space-y-6 form-custom-scrollbar flex-1">
          
          {/* ✅ Ndarja vizuale midis Imazhit Kryesor dhe Galerisë */}
          <div className="flex flex-col sm:flex-row gap-6">
            
            {/* Imazhi Kryesor */}
            <div>
              <label className={LBL}>Imazhi Kryesor *</label>
              <input ref={mainFileRef} type="file" accept="image/*" className="hidden" onChange={handleMainImage} />
              
              <div 
                onClick={() => mainFileRef.current?.click()}
                className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f68048] flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-orange-50 transition-all relative overflow-hidden group"
              >
                {(mainImageFile || existingMainImage) ? (
                  <>
                    <img 
                      src={mainImageFile ? URL.createObjectURL(mainImageFile) : existingMainImage} 
                      className="w-full h-full object-cover" 
                      alt="Main" 
                    />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-black/40 rounded-md">Ndrysho</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <UploadCloud size={24} className="text-[#f68048] mb-2" />
                    <span className="text-xs font-semibold text-gray-500">Ngarko</span>
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-[#f68048] text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">
                  Kryesore
                </div>
              </div>
            </div>

            {/* Galeria */}
            <div className="flex-1 overflow-hidden">
              <label className={LBL}>Galeria (Opsionale)</label>
              <input ref={galleryFileRef} type="file" multiple accept="image/*" className="hidden" onChange={handleGalleryImages} />
              
              <div className="flex gap-3 overflow-x-auto pb-2 form-custom-scrollbar">
                
                {/* 1. Fotot ekzistuese të galerisë (Vijnë nga DB) */}
                {existingGallery.map((src, idx) => (
                  <div key={`exist-${idx}`} className="relative group shrink-0 w-32 h-32 rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
                    <img src={src} className="w-full h-full object-contain" alt={`Gallery ${idx}`} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeExistingGalleryImage(idx); }}
                      className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}

                {/* 2. Fotot e reja të zgjedhura për galerinë (File Lokale) */}
                {galleryFiles.map((f, idx) => (
                  <div key={`new-${idx}`} className="relative group shrink-0 w-32 h-32 rounded-2xl border-2 border-orange-200 overflow-hidden bg-orange-50/30">
                    <img src={URL.createObjectURL(f)} className="w-full h-full object-contain" alt={`New Gallery ${idx}`} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeGalleryFile(idx); }}
                      className="absolute top-1 right-1 bg-white/90 text-red-500 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white shadow-sm"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-1 left-1 bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow">E RE</div>
                  </div>
                ))}

                {/* Butoni Shto në Galeri */}
                <button 
                  onClick={() => galleryFileRef.current?.click()}
                  className="w-32 h-32 shrink-0 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#f68048] flex flex-col items-center justify-center text-gray-400 hover:text-[#f68048] hover:bg-orange-50 transition-colors"
                >
                  <Plus size={24} />
                  <span className="text-xs font-bold mt-1">Shto foto</span>
                </button>
              </div>
            </div>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LBL}>Kategoria</label>
              <select className={`${INP} cursor-pointer appearance-none bg-no-repeat`} style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundPositionX: "calc(100% - 16px)", backgroundPositionY: "50%" }} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="" disabled className="text-gray-200">Pa kategori</option>
                {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            
            <div>
              <label className={LBL}>Brandi (Opsionale)</label>
              <select className={`${INP} cursor-pointer appearance-none bg-no-repeat`} style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="gray" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')`, backgroundPositionX: "calc(100% - 16px)", backgroundPositionY: "50%" }} value={form.brand_id} onChange={(e) => setForm({ ...form, brand_id: e.target.value })}>
                <option value="" className="text-gray-200">Pa brand (Zgjidh opsionale)</option>
                {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-gray-900 flex items-center gap-2">Vlerat Ushqyese</h4>
                <p className="text-xs text-gray-500 mt-1">(Opsionale)</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={hasNutrition} onChange={() => setHasNutrition(!hasNutrition)} />
                <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f68048]"></div>
              </label>
            </div>
            {hasNutrition && (
              <div className="mt-5 space-y-5 border-t border-gray-200 pt-5 animate-in slide-in-from-top-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={LBL}>Serving Size</label>
                    <input className={INP_SM} placeholder="psh. 1 Tabletë" value={nutritionData.serving_size} onChange={e => handleNutritionChange('serving_size', e.target.value)} />
                  </div>
                  <div>
                    <label className={LBL}>Servings Per Container</label>
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
                    <div className="flex gap-2 px-1">
                      <div className="flex-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Emri</div>
                      <div className="w-24 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Sasia</div>
                      <div className="w-8"></div>
                    </div>
                    {nutritionData.nutrients.map((nutrient, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input className={`${INP_SM} flex-1`} placeholder="psh. Vitamina C" value={nutrient.name} onChange={(e) => handleNutrientRowChange(index, 'name', e.target.value)} />
                        <input className={`${INP_SM} w-24`} placeholder="psh. 100mg" value={nutrient.amount} onChange={(e) => handleNutrientRowChange(index, 'amount', e.target.value)} />
                        <button type="button" onClick={() => removeNutrientRow(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18} /></button>
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