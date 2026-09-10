import { useState, useRef, useEffect } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { X, Tag, Trash2, Plus, ImagePlus } from "lucide-react";

// Renders an image with a graceful fallback to an initial-avatar if the
// src is empty or fails to load (broken URL, 404, deleted file, etc).
function AvatarImage({ src, name, size = "w-8 h-8", shape = "rounded-full" }) {
  const [broken, setBroken] = useState(false);

  useEffect(() => { setBroken(false); }, [src]);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setBroken(true)}
        className={`${size} ${shape} object-cover shadow-sm bg-gray-50 border border-gray-100`}
      />
    );
  }
  return (
    <div className={`${size} ${shape} bg-gray-100 text-gray-400 flex items-center justify-center font-black text-xs uppercase shadow-inner`}>
      {name ? name.charAt(0) : <Tag size={14} className="opacity-40" />}
    </div>
  );
}

export default function CategoriesManagerModal({ onClose, showToast }) {
  const { categories, createCategory, deleteCategory } = useAdminStore();
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState(null); // ✅ Tracking Raw file
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Ju lutem zgjidhni një fajll imazhi.", "error");
      return;
    }
    
    // Store original file object for backend
    setSelectedFile(file);
    
    // Convert preview string for the local browser display
    const reader = new FileReader();
    reader.onloadend = () => setImageUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageUrl("");
    setSelectedFile(null); // Clear file
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    
    // ✅ Form Data usage allows Multer to grab req.file
    const formData = new FormData();
    formData.append("name", name.trim());
    if (selectedFile) {
      formData.append("image", selectedFile);
    }

    const result = await createCategory(formData);
    setSaving(false);

    if (result.success) {
      setName("");
      clearImage();
      showToast("Category created successfully.");
    } else {
      showToast(result.message, "error");
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    const result = await deleteCategory(id);
    setSaving(false);
    if (result.success) { 
      showToast("Category deleted permanently."); 
    } else {
      showToast(result.message, "error");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100] flex justify-center items-center p-4">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white rounded-[28px] max-w-[420px] w-full flex flex-col shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] relative z-10 animate-in zoom-in-95 duration-200 border border-gray-100 overflow-hidden max-h-[85vh]">

        <div className="px-7 py-5 flex justify-between items-center bg-white border-b border-gray-50 shrink-0 z-20">
          <div className="flex flex-col">
            <h3 className="font-black text-xl tracking-tight text-gray-900 flex items-center gap-2">
              Kategoritë
            </h3>
            <p className="text-[12px] font-bold uppercase tracking-wider text-gray-400 mt-0.5">{categories.length} elemente totale</p>
          </div>
          <button className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#fff4f0] hover:text-[#f68048] transition-colors" onClick={onClose}>
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5 bg-gray-50/50 shrink-0">
          <form onSubmit={handleCreate} className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              {/* Preview / upload trigger — click the circle to pick a file */}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                title="Ngarko imazh"
                className="relative shrink-0 w-14 h-14 rounded-2xl bg-white border border-dashed border-gray-200 hover:border-[#f68048] overflow-hidden flex items-center justify-center shadow-sm transition-colors group/upload"
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="Parapamje" className="w-full h-full object-cover" />
                ) : (
                  <ImagePlus size={18} className="text-gray-300 group-hover/upload:text-[#f68048] transition-colors" strokeWidth={1.5} />
                )}
              </button>
              {imageUrl && (
                <button
                  type="button"
                  onClick={clearImage}
                  className="text-[11px] font-bold text-gray-400 hover:text-red-500 transition-colors -ml-1"
                >
                  Hiq imazhin
                </button>
              )}

              <input
                className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none text-gray-900 focus:border-[#f68048] focus:ring-4 focus:ring-[#f68048]/10 transition-all font-medium placeholder-gray-300 shadow-sm"
                placeholder="Emri i kategorisë së re..."
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-black text-white hover:bg-gray-800 rounded-xl shadow-lg shadow-black/10 transition-transform active:scale-95 flex items-center justify-center shrink-0 disabled:opacity-50 mt-1"
              disabled={saving || !name.trim()}
            >
              {saving ? <div className="w-5 h-5 border-2 border-white/50 border-t-white animate-spin rounded-full" /> : <><Plus strokeWidth={2.5} size={18} className="mr-2" /> Shto Kategorinë</>}
            </button>
          </form>
        </div>

        <div className="overflow-y-auto flex-1 p-2 custom-minimal-scrollbar bg-white min-h-[180px]">
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 py-10 px-6 text-center">
              <Tag className="mb-3 opacity-20" size={32} />
              <p className="text-[13px] font-medium leading-relaxed">Aktualisht e zbrazët.<br />Shto kategori të reja më sipër.</p>
            </div>
          ) : (
            <ul className="space-y-1">
              {categories.map((c) => (
                <li key={c.id} className="flex items-center justify-between p-3.5 pl-5 bg-white border border-transparent rounded-[14px] hover:border-gray-100 hover:shadow-[0_2px_10px_-2px_rgba(0,0,0,0.05)] hover:bg-[#fafafa] transition-all group">
                  <div className="flex items-center gap-3">
                    <AvatarImage src={c.image_url} name={c.name} />
                    <span className="text-[15px] font-bold text-gray-800">{c.name}</span>
                  </div>

                  <button
                    type="button"
                    className="w-8 h-8 rounded-lg bg-transparent text-gray-300 hover:bg-[#fff4f0] hover:text-red-500 flex justify-center items-center transition-colors scale-95 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                    onClick={() => handleDelete(c.id)}
                    title="Delete Category"
                    disabled={saving}
                  >
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}