import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { LayoutList, Tags, FolderX, CheckCircle, Info } from "lucide-react";

export default function CategoriesPanel() {
  const { categories, categoriesLoading, fetchCategories, createCategory, deleteCategory } = useAdminStore();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    const result = await createCategory(name.trim());
    setSaving(false);
    if (result.success) { setName(""); showToast("Category pushed alive"); }
    else showToast(result.message, "error");
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteCategory(deleteTarget.id);
    setSaving(false);
    if (result.success) { setDeleteTarget(null); showToast("Link node cleared"); }
    else showToast(result.message, "error");
  };

  return (
    <div className="flex flex-col max-w-4xl gap-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Dynamic simple custom Toast */}
      {toast && (
        <div className="toast toast-top toast-center mt-6 z-[9999] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-gray-900 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-black/10">
             {toast.type === "error" ? <Info className="text-white w-5 h-5"/> : <CheckCircle className="text-[#f68048] w-5 h-5" /> }
            <span className="font-medium text-white text-sm">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Row splitting input & List visually cleaner */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-8">
         
         {/* Creator column side */}
         <div className="flex flex-col gap-5">
           <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex flex-col h-min relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-black">
                <Tags size={80} strokeWidth={3} />
             </div>
             
             <h3 className="text-gray-900 font-bold text-lg mb-1 tracking-tight z-10">New Group Node</h3>
             <p className="text-[13px] text-gray-500 mb-6 leading-relaxed z-10">Generates a categorical container allowing routing structural binds in menus.</p>
             
             <form onSubmit={handleCreate} className="flex flex-col gap-4 z-10">
               <div>
                  <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 pl-1">Unique Identifier</label>
                  <input
                    className="w-full bg-gray-50 rounded-xl px-4 py-3.5 text-sm text-gray-900 border border-transparent focus:bg-white focus:border-[#f68048] focus:ring-4 focus:ring-[#f68048]/10 transition-all outline-none"
                    placeholder="E.g. Electronics"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
               </div>
               
               <button 
                 type="submit" 
                 className="mt-2 w-full py-3.5 bg-black hover:bg-gray-800 text-white rounded-xl font-bold tracking-wide transition-all transform active:scale-95 disabled:opacity-50 shadow-md" 
                 disabled={saving || !name.trim()}
               >
                 {saving ? "Generating..." : "Mount Class"}
               </button>
             </form>
           </div>
         </div>

         {/* Extractor column List */}
         <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 flex flex-col relative min-h-[400px]">
           
           <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 rounded-t-[24px]">
               <div className="flex items-center gap-2 font-bold text-gray-800 text-[15px]">
                  <LayoutList className="text-gray-400" size={18}/> Root Dictionary Map
               </div>
               <span className="text-[11px] bg-white border border-gray-200 px-3 py-1 font-bold rounded-full text-gray-500">
                  {categories.length} Nodes total
               </span>
           </div>

           <div className="p-2 overflow-y-auto max-h-[600px] form-custom-scrollbar">
             {categoriesLoading ? (
               <div className="flex flex-col items-center justify-center py-20 text-gray-300">
                  <div className="animate-spin w-8 h-8 border-4 border-gray-100 border-t-[#f68048] rounded-full mb-4"></div>
                  <span className="text-[13px] font-bold">Scanning Map...</span>
               </div>
             ) : categories.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center px-4 text-gray-400 gap-3">
                 <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-1">
                   <Tags size={28} />
                 </div>
                 <h4 className="text-gray-700 font-bold">A blank slate layout.</h4>
                 <p className="text-[13px] max-w-xs">Establish the baseline architectural tree on the adjoining logic generator.</p>
               </div>
             ) : (
               <ul className="flex flex-col space-y-1 mt-2 mx-2">
                 {categories.map(c => (
                   <li key={c.id} className="group flex items-center justify-between p-4 rounded-xl border border-transparent hover:border-gray-100 hover:bg-[#fafafa] transition-colors cursor-default">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center shadow-sm">
                           <LayoutList className="text-[#f68048] w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-gray-900">{c.name}</span>
                     </div>
                     
                     <button
                       className="px-3 py-2 bg-transparent text-gray-300 font-bold text-xs uppercase tracking-wider rounded-lg group-hover:bg-gray-200 group-hover:text-black transition-colors"
                       onClick={() => setDeleteTarget(c)}
                     >
                       Scrap
                     </button>
                   </li>
                 ))}
               </ul>
             )}
           </div>
         </div>
      </div>

      {/* Delete Warning Frame */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white p-8 max-w-[360px] w-full rounded-[28px] text-center border border-gray-100 shadow-2xl animate-in zoom-in-95">
             <div className="w-16 h-16 bg-gray-50 rounded-full mx-auto flex items-center justify-center text-black mb-5">
                 <FolderX size={26} strokeWidth={2}/>
             </div>
             
             <h3 className="font-bold text-xl text-gray-900 mb-2">Decouple Tree?</h3>
             <p className="text-[14px] text-gray-500 mb-8 px-2">
                Clearing structural node "<span className="text-black font-bold">{deleteTarget.name}</span>". Target allocations bound to this id will collapse to UNGROUPED format organically.
             </p>
             <div className="flex flex-col gap-3">
               <button 
                 className="w-full py-3.5 bg-[#f68048] hover:bg-[#ea7035] shadow-lg shadow-[#f68048]/20 text-white rounded-xl font-bold transition-all transform active:scale-95 disabled:opacity-70 flex justify-center" 
                 onClick={handleDelete} 
                 disabled={saving}
               >
                 {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" /> : "Verify Delete Intent"}
               </button>
               <button 
                 className="w-full py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-black font-bold rounded-xl transition-all" 
                 onClick={() => setDeleteTarget(null)}
               >
                 Keep Tree Intact
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}