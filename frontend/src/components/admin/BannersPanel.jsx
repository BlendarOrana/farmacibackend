import { useEffect, useState, useRef } from "react";
import { useAdminStore } from "../../stores/useAdminStore";
import { 
  Trash2, Plus, Image as ImageIcon, ExternalLink, 
  UploadCloud, Loader2, Link2, GripVertical, 
  ChevronLeft, ChevronRight, Eye, EyeOff, Info
} from "lucide-react";
import IphoneMockup from "./IphoneMockup"; // Rregullo rrugen e importit nese duhet

export default function BannersPanel() {
  const { 
    banners, products, fetchBanners, fetchProducts, 
    createBanner, deleteBanner, updateBannerToggle, reorderBanners, bannersLoading 
  } = useAdminStore();
  
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  
  const [localBanners, setLocalBanners] = useState([]);
  const dragItem = useRef();
  const dragOverItem = useRef();

  const [currentSlide, setCurrentSlide] = useState(0);
  const activeBanners = localBanners.filter(b => b.active);

  const fileInputRef = useRef(null);

  useEffect(() => {
    setLocalBanners(banners);
  }, [banners]);

  useEffect(() => {
    fetchBanners();
    if (products.length === 0) fetchProducts();
  }, []);

  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === activeBanners.length - 1 ? 0 : prev + 1));
    }, 3500);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    setTimeout(() => { e.target.style.opacity = "0.4"; }, 0);
  };

  const handleDragEnter = (e, index) => { dragOverItem.current = index; };

  const handleDragEnd = async (e) => {
    e.target.style.opacity = "1";
    const copyList = [...localBanners];
    const dragItemContent = copyList[dragItem.current];
    
    copyList.splice(dragItem.current, 1);
    copyList.splice(dragOverItem.current, 0, dragItemContent);
    
    dragItem.current = null;
    dragOverItem.current = null;
    
    setLocalBanners(copyList);
    await reorderBanners(copyList.map(b => b.id));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const resetForm = () => {
    setShowAdd(false);
    setPreview(null);
    if (preview) URL.revokeObjectURL(preview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.target);
    formData.append("sort_order", localBanners.length); 
    
    const res = await createBanner(formData);
    setLoading(false);
    
    if (res.success) resetForm();
    else alert(res.message);
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => showAdd ? resetForm() : setShowAdd(true)}
          className="px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 bg-[#f68048] text-white hover:bg-gray-800"
        >
          {showAdd ? "Cancel" : <><Plus size={16} /> New Banner</>}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        {/* LEFT COLUMN: Form & List */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Instructions Box */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
            <Info size={20} className="text-blue-500 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Dimensionet e rekomanduara</p>
              <p className="text-blue-600/80">Perdorni imazhe me rezulucion <strong>1080 × 800 px</strong> (4:3 ratio)</p>
            </div>
          </div>

          {/* Add Form */}
          {showAdd && (
            <form onSubmit={handleSubmit} className="p-6 bg-gray-50 border border-gray-200 rounded-xl animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative flex flex-col items-center justify-center aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 bg-white hover:bg-gray-50 cursor-pointer overflow-hidden transition-colors"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4">
                      <UploadCloud size={28} className="text-gray-400 mx-auto mb-2 group-hover:text-gray-600 transition-colors" />
                      <span className="text-sm font-medium text-gray-700">Upload Banner</span>
                      <p className="text-xs text-gray-400 mt-1">1080 × 800px (4:3)</p>
                    </div>
                  )}
                  <input type="file" name="image" ref={fileInputRef} onChange={handleImageChange} className="hidden" accept="image/*" required />
                </div>

                <div className="flex flex-col justify-end space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Target Product <span className="text-gray-400 font-normal">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Link2 size={16} className="absolute left-3 top-2.5 text-gray-400" />
                      <select name="product_id" className="w-full bg-white border border-gray-300 rounded-md pl-9 p-2.5 text-sm focus:border-black focus:ring-0 outline-none transition-all cursor-pointer">
                        <option value="">No link (Image only)</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  <button disabled={loading} className="w-full bg-black text-white py-3 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex justify-center items-center gap-2">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Save to Deck"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List / Deck */}
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Renditja e Banerav</h3>
            
            {localBanners.length === 0 && !bannersLoading ? (
              <div className="text-center py-12 border border-gray-100 rounded-xl bg-gray-50/50">
                <ImageIcon className="text-gray-300 mx-auto mb-3" size={32} />
                <p className="text-sm text-gray-500">Your banner deck is empty.</p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                {localBanners.map((banner, index) => (
                  <div 
                    key={banner.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 group cursor-grab active:cursor-grabbing hover:bg-gray-50 transition-colors"
                  >
                    <div className="text-gray-300 group-hover:text-gray-500">
                      <GripVertical size={18} />
                    </div>

                    <div className="h-14 w-20 rounded bg-gray-100 flex-shrink-0 relative overflow-hidden">
                      <img src={banner.image_url} alt="" className={`w-full h-full object-cover ${!banner.active ? 'opacity-40 grayscale' : ''}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-900">Banner #{banner.id}</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {banner.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center gap-1 truncate">
                        {banner.product_id ? <><ExternalLink size={12} /> {banner.product_name}</> : "No link"}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => updateBannerToggle(banner.id, !banner.active)} className="p-2 text-gray-400 hover:text-black rounded" title={banner.active ? "Hide" : "Show"}>
                        {banner.active ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                      <button onClick={() => deleteBanner(banner.id)} className="p-2 text-gray-400 hover:text-red-600 rounded" title="Delete">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Mobile iPhone Preview duke perdorur komponentin e ri */}
        <div className="lg:col-span-4 flex justify-end lg:justify-end mt-[-100px] ">
          <div className="sticky top-6">
            <IphoneMockup>
              {/* Mbulesë e bardhë (që mbulon gjahtarët) për të simuluar brendësinë e një aplikacioni */}
              <div className="absolute inset-0 bg-white z-10 flex flex-col  pb-5 overflow-hidden">
                {activeBanners.length > 0 ? (
                  <>
                    {/* Banner Edge-to-Edge */}
                    <div className="w-full aspect-[4/3] relative group bg-gray-100 flex-shrink-0">
                      <img 
                        src={activeBanners[currentSlide]?.image_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover transition-opacity duration-700 ease-in-out"
                        key={currentSlide}
                      />
                      <div className="absolute inset-0 bg-black/10" />
                      
                      {/* Controls */}
                      <div className="absolute top-1/2 -translate-y-1/2 w-full flex justify-between px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setCurrentSlide(p => p === 0 ? activeBanners.length - 1 : p - 1)} className="bg-white/80 p-1 rounded-full"><ChevronLeft size={14} /></button>
                        <button onClick={() => setCurrentSlide(p => p === activeBanners.length - 1 ? 0 : p + 1)} className="bg-white/80 p-1 rounded-full"><ChevronRight size={14} /></button>
                      </div>
                    </div>

                    {/* Mock content below banner */}
                    <div className="p-3 flex-1 bg-white">
                      <div className="flex gap-2 mb-4 overflow-hidden">
                        <div className="w-12 h-6 bg-gray-800 rounded-full flex-shrink-0"></div>
                        <div className="w-16 h-6 bg-gray-100 rounded-full flex-shrink-0"></div>
                        <div className="w-14 h-6 bg-gray-100 rounded-full flex-shrink-0"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-32 bg-gray-100 rounded-lg"></div>
                        <div className="h-32 bg-gray-100 rounded-lg"></div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center bg-white text-gray-400 text-xs text-center p-6 border-t border-gray-100">
                    Nuk ka baner aktiv
                  </div>
                )}
              </div>
            </IphoneMockup>
          </div>
        </div>

      </div>
    </div>
  );
}