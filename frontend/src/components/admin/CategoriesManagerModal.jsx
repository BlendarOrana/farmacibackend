import { useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { X, Tag, Trash2, Plus } from "lucide-react";

export default function CategoriesManagerModal({ onClose, showToast }) {
  const { categories, createCategory, deleteCategory } = useAdminStore();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const result = await createCategory(name.trim());
    setSaving(false);
    if (result.success) { setName(""); showToast("Category live map updated."); }
    else showToast(result.message, "error");
  };

  const handleDelete = async (id) => {
    setSaving(true);
    const result = await deleteCategory(id);
    setSaving(false);
    if (result.success) { showToast("Category eradicated from root."); }
    else showToast(result.message, "error");
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      {/* Click-away backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />
      
      {/* Content wrapper purely stylized for Premium Brand minimal vibe */}
      <div className="bg-white rounded-[28px] max-w-[420px] w-full flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden max-h-[80vh]">
        
        {/* Sticky pure White Header */}
        <div className="px-7 py-5 flex justify-between items-center bg-white border-b border-gray-50 shrink-0 z-20">
          <div className="flex flex-col">
              <h3 className="font-black text-xl tracking-tight text-gray-900 flex items-center gap-2">
                 Kategorit
              </h3>
              <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{categories.length} Elements bound</p>
          </div>
          <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#fff4f0] hover:text-[#f68048] transition-colors" onClick={onClose}>
             <X size={18} strokeWidth={2.5}/>
          </button>
        </div>

        {/* Input Additive zone */}
        <div className="p-5 bg-gray-50/50 shrink-0">
          <form onSubmit={handleCreate} className="flex gap-2">
             <input
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 text-sm outline-none text-gray-900 focus:border-[#f68048] focus:ring-4 focus:ring-[#f68048]/10 transition-all font-medium placeholder-gray-300 shadow-sm"
                placeholder="Shto kategori te re..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
             />
             <button 
                type="submit" 
                className="w-12 h-11 bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg shadow-black/10 transition-transform active:scale-90 flex items-center justify-center shrink-0 disabled:opacity-50"
                disabled={saving || !name.trim()}
             >
                {saving ? <div className="w-4 h-4 border-2 border-white/50 border-t-white animate-spin rounded-full"/> : <Plus strokeWidth={3} size={20}/>}
             </button>
          </form>
        </div>

        {/* Scalable Node List Container */}
        <div className="overflow-y-auto flex-1 p-2 custom-minimal-scrollbar bg-white min-h-[150px]">
           {categories.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10 px-6 text-center">
                  <Tag className="mb-3 opacity-20" size={32} />
                  <p className="text-[13px] font-medium leading-relaxed">It is heavily empty in here.<br/>Map groups above to start defining architecture.</p>
               </div>
           ) : (
             <ul className="space-y-1">
               {categories.map((c) => (
                 <li key={c.id} className="flex items-center justify-between p-3.5 pl-5 bg-white border border-transparent rounded-[14px] hover:border-gray-100 hover:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:bg-[#fafafa] transition-all group">
                   <div className="flex items-center gap-3">
                     <span className="text-[15px] font-bold text-gray-800">{c.name}</span>
                   </div>
                   
                   <button 
                     type="button"
                     className="w-8 h-8 rounded-lg bg-transparent text-gray-300 hover:bg-[#fff4f0] hover:text-red-500 flex justify-center items-center transition-colors scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                     onClick={() => handleDelete(c.id)}
                     title="Terminate Tag"
                     disabled={saving}
                   >
                     <Trash2 size={16} strokeWidth={2.5}/>
                   </button>
                 </li>
               ))}
             </ul>
           )}
        </div>

        {/* Footer Done State to bounce user nicely back to app */}
        <div className="p-4 pt-2 shrink-0 bg-gradient-to-t from-white to-transparent flex justify-center pb-5 z-20 pointer-events-none relative">
            <button className="bg-gray-100 border border-gray-200 pointer-events-auto py-2.5 px-8 rounded-xl text-gray-500 font-bold hover:bg-gray-200 hover:text-black transition-colors" onClick={onClose}>
               Mbyll 
            </button>
        </div>

      </div>
    </div>
  );
}