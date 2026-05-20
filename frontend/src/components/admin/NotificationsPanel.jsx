import { useEffect, useState } from "react";
import { useNotificationStore } from "../../stores/useNotificationStore";
import { useAdminStore } from "../../stores/useAdminStore";
import { 
  Bell, Send, Smartphone, Info, AlertCircle, 
  Users, Apple, History, Lock, Flashlight, Camera, X
} from "lucide-react";

export default function NotificationsPanel() {
  const { 
    stats, history, fetchStats, fetchHistory, sendNotification, isSending 
  } = useNotificationStore();
  const { products, categories, fetchProducts, fetchCategories } = useAdminStore();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [productId, setProductId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [includeImage, setIncludeImage] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchHistory();
    if (products.length === 0) fetchProducts();
    if (categories.length === 0) fetchCategories();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSend = async () => {
    if (!title || !body) return showToast("Titulli dhe permbajtja jane te detyrueshme", "error");

    const payload = {
      title,
      body,
      product_id: productId || null,
      category_id: categoryId || null,
      include_image: includeImage
    };

    const res = await sendNotification(payload);
    if (res.success) {
      showToast(`U dergua te ${res.stats.sent} pajisje! (${res.stats.failed} deshtuan)`);
      setTitle("");
      setBody("");
      setProductId("");
      setCategoryId("");
      setIncludeImage(false);
    } else {
      showToast(res.message, "error");
    }
  };

  const selectedProduct = products.find(p => String(p.id) === String(productId));

  return (
    <div className="flex flex-col gap-6 relative font-sans">
      
      {/* Njoftimi Toast */}
      {toast && (
        <div className="toast toast-top toast-end z-[9999] animate-in slide-in-from-top-4 fade-in">
          <div className="bg-white px-5 py-4 rounded-xl shadow-[0_10px_30px_0_rgba(0,0,0,0.08)] border border-gray-100 flex items-center gap-3">
             {toast.type === "error" ? <AlertCircle className="text-red-500 w-5 h-5" /> : <Info className="text-[#f68048] w-5 h-5"/> }
            <span className="font-semibold text-gray-800 text-sm tracking-wide">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Shiriti i Statistikave */}
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 bg-orange-50 text-[#f68048] rounded-full flex items-center justify-center">
      <Users size={18} strokeWidth={2.2} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">Pajisje Aktive</p>
      <h3 className="text-lg font-bold text-gray-900">
        {stats.active_tokens || 0}
      </h3>
    </div>
  </div>

  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 bg-gray-50 text-gray-800 rounded-full flex items-center justify-center">
      <Apple size={18} strokeWidth={2.2} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">Perdorues iOS</p>
      <h3 className="text-lg font-bold text-gray-900">
        {stats.ios_tokens || 0}
      </h3>
    </div>
  </div>

  <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
    <div className="w-10 h-10 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
      <Smartphone size={18} strokeWidth={2.2} />
    </div>
    <div>
      <p className="text-xs font-medium text-gray-500">Perdorues Android</p>
      <h3 className="text-lg font-bold text-gray-900">
        {stats.android_tokens || 0}
      </h3>
    </div>
  </div>
</div>

      {/* Rrjeti Kryesor: Formulari & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Majtas: Formulari */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-5">
          <div className="flex items-center gap-3 mb-2">
  
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Krijo Njoftim</h2>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Titulli i Njoftimit</label>
            <input 
              type="text" maxLength={50}
              placeholder=" psh Zbritje"
              className="w-full bg-gray-50 text-sm h-[48px] px-4 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none font-medium"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
            <div className="text-right mt-1 text-[11px] text-gray-400 font-medium">{title.length}/50</div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Permbajtja e Mesazhit</label>
            <textarea 
              rows="3" maxLength={150}
              placeholder="Shkruani mesazhin tuaj ketu..."
              className="w-full bg-gray-50 text-sm p-4 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none resize-none font-medium"
              value={body} onChange={(e) => setBody(e.target.value)}
            />
            <div className="text-right mt-1 text-[11px] text-gray-400 font-medium">{body.length}/150</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Lidh me nje Produkt</label>
              <select
                className="w-full bg-gray-50 text-sm h-[48px] px-4 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none font-medium cursor-pointer"
                value={productId} onChange={(e) => { setProductId(e.target.value); setCategoryId(""); }}
              >
                <option value="">Asnje produkt i lidhur</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Lidh me nje Kategori</label>
              <select
                className="w-full bg-gray-50 text-sm h-[48px] px-4 rounded-xl border-transparent focus:bg-white focus:border-[#f68048] focus:ring-2 focus:ring-[#f68048]/20 transition-all text-gray-900 outline-none font-medium cursor-pointer"
                value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setProductId(""); }}
                disabled={!!productId}
              >
                <option value="">Asnje kategori e lidhur</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {productId && selectedProduct?.image_url && (
            <div className="pt-2">
              <label className="flex items-center gap-3 cursor-pointer group bg-gray-50 p-4 rounded-xl border border-gray-100 hover:border-[#f68048]/30 transition-all">
                <div className="relative inline-block w-10 h-6">
                  <input type="checkbox" className="sr-only peer" checked={includeImage} onChange={() => setIncludeImage(!includeImage)} />
                  <div className="w-10 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#f68048]"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-gray-800">Bashkengjit Imazhin e Produktit</span>
                </div>
              </label>
            </div>
          )}

          <button 
            onClick={handleSend} disabled={isSending || !title || !body}
            className="w-full mt-4 h-[54px] bg-[#f68048] hover:bg-[#e67540] text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#f68048]/20 text-[15px]"
          >
            {isSending ? (
              <div className="w-5 h-5 border-2 border-white/50 border-t-white animate-spin rounded-full"/>
            ) : (
              <><Send size={18} strokeWidth={2.5}/> Dergo</>
            )}
          </button>
        </div>

        {/* Djathtas: Prezantimi Live (Mockup i EKRANIT Te KYÇUR iOS 17/18) */}
        <div className="lg:col-span-5 flex justify-center     ">
          <div className="relative w-[320px] h-[660px] bg-black rounded-[50px]  p-[10px] flex-shrink-0">
            
            {/* Ekrani i brendshem */}
            <div className="relative w-full h-full bg-[#fcee0d] rounded-[38px] overflow-hidden">
              
              {/* Imazhi i sfondit (Erresuar pak per te nxjerre ne pah tekstin e bardhe si ne screenshot) */}
              <div className="absolute inset-0 bg-[url('/hunters.webp')] bg-contain bg-center bg-no-repeat"></div>
              
              {/* Dynamic Island me Ikonen e Kyçit */}
                    <div className="absolute top-2.5 inset-x-0 flex justify-center z-20">
                <div className="w-[120px] h-[34px] bg-black rounded-full shadow-sm"></div>

              </div>

 

   
              {/* Njoftimi Kompakt (Si ne foton tende - Poshte, i gjere dhe i holle) */}
              <div className="absolute top-[60px] left-[12px] right-[12px] z-10 animate-in slide-in-from-bottom-4 fade-in duration-500">
                <div className="bg-[#2c2c2e]/60 backdrop-blur-2xl rounded-[24px] p-[12px] shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-white/10 flex items-center gap-3">
                  
                  {/* Imazhi / Ikona e App-it (E vogel, 38x38) */}
                  <div className="flex-shrink-0">
                    <img 
                      src="/adaptive-icon.png" 
                      alt="App Icon" 
                      className="w-[38px] h-[38px] rounded-[10px] object-cover bg-white shadow-sm"
                    />
                  </div>

                  {/* Teksti (Titulli + Koha ne nje rresht, Trupi poshte) */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[14px] font-semibold text-white truncate">
                        {title || "Titulli"}
                      </h4>
     
                    </div>
                    <p className="text-[13px] font-normal text-white/80 mt-[2px] leading-snug line-clamp-1">
                      {body || "Mesazhi juaj do te shfaqet ketu..."}
                    </p>
                  </div>
                  
                  {/* Imazhi bashkengjitur (Nese ka) */}
                  {includeImage && productId && selectedProduct?.image_url && (
                    <div className="flex-shrink-0 ml-1">
                      <div className="w-[38px] h-[38px] bg-white/10 rounded-[8px] overflow-hidden shadow-sm">
                        <img 
                          src={selectedProduct.image_url} 
                          alt="thumbnail" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Butonat e poshtem (Elektriku dhe Kamera) */}
  

              {/* Home Indicator */}
              <div className="absolute bottom-2 inset-x-0 flex justify-center">
                <div className="w-[120px] h-1.5 bg-black/80 rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela e Historikut */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-2">
        <div className="p-6 border-b border-gray-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center">
            <History size={20} className="text-gray-500" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Historiku i Dergesave</h2>
            <p className="text-[13px] text-gray-500 font-medium">Njoftimet e fundit te derguara</p>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Data & Ora</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Mesazhi</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider">Artikulli i Lidhur</th>
                <th className="px-6 py-4 text-[12px] font-bold text-gray-400 uppercase tracking-wider text-right">Statistikat e Dergeses</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-gray-400 text-sm font-medium">Nuk ka ende njoftime te derguara.</td></tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {new Date(item.sent_at).toLocaleDateString('sq-AL')}
                      </div>
                      <div className="text-[12px] text-gray-500 font-medium mt-0.5">
                        {new Date(item.sent_at).toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 min-w-[250px]">
                      <div className="text-sm font-bold text-gray-900 truncate max-w-[300px]">{item.title}</div>
                      <div className="text-[13px] text-gray-500 truncate max-w-[300px] mt-0.5">{item.body}</div>
                    </td>
                    <td className="px-6 py-4">
                      {item.product_name ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 text-[#f68048] text-[12px] font-bold border border-orange-100">
                          Produkti: {item.product_name}
                        </span>
                      ) : (
                        <span className="text-[13px] text-gray-400 font-medium">Asnje</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="text-[12px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-md">
                          {item.total_sent} Dorezuar
                        </span>
                        {item.total_failed > 0 && (
                          <span className="text-[12px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-md">
                            {item.total_failed} Deshtuan
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}