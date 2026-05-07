import { useEffect, useState, useRef } from "react";
import { useAdminStore } from "../../stores/useAdminStore";

const EMPTY_FORM = { name: "", description: "", price: "", quantity: "", category_id: "" };

export default function ProductsPanel() {
  const {
    products, productsLoading, fetchProducts,
    categories, fetchCategories,
    createProduct, updateProduct, deleteProduct, updateStock,
  } = useAdminStore();

  const [modal, setModal] = useState(null); 
  const [form, setForm] = useState(EMPTY_FORM);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [target, setTarget] = useState(null);
  const [stockVal, setStockVal] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const fileRef = useRef();

  useEffect(() => { fetchProducts(); fetchCategories(); }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openCreate = () => {
    setForm(EMPTY_FORM); setImageFile(null); setImagePreview(null); setTarget(null);
    setModal("create");
  };

  const openEdit = (p) => {
    setForm({ name: p.name, description: p.description || "", price: p.price, quantity: p.quantity, category_id: p.category_id || "" });
    setImagePreview(p.image_url || null); setImageFile(null); setTarget(p);
    setModal("edit");
  };

  const openStock = (p) => { setTarget(p); setStockVal(p.quantity); setModal("stock"); };
  const openDelete = (p) => { setTarget(p); setModal("delete"); };
  const closeModal = () => { setModal(null); setTarget(null); };

  const handleImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    setSaving(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v !== "") fd.append(k, v); });
    if (imageFile) fd.append("image", imageFile);

    const result = modal === "create"
      ? await createProduct(fd)
      : await updateProduct(target.id, fd);

    setSaving(false);
    if (result.success) { showToast(modal === "create" ? "Product created" : "Product updated"); closeModal(); }
    else showToast(result.message, "error");
  };

  const handleStock = async () => {
    setSaving(true);
    const result = await updateStock(target.id, parseInt(stockVal));
    setSaving(false);
    if (result.success) { showToast("Stock updated"); closeModal(); }
    else showToast(result.message, "error");
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteProduct(target.id);
    setSaving(false);
    if (result.success) { showToast("Product deleted"); closeModal(); }
    else showToast(result.message, "error");
  };

  return (
    <div className="flex flex-col gap-6 text-base-content">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-top toast-end z-50`}>
          <div className={`alert rounded-md text-sm font-medium ${toast.type === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-green-50 text-green-700 border-green-200"} shadow-sm border`}>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Products <span className="text-sm font-medium text-base-content/50 ml-2">({products.length})</span></h2>
        <button className="btn btn-neutral btn-sm rounded-md" onClick={openCreate}>
          + New Product
        </button>
      </div>

      {/* Table */}
      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        {productsLoading ? (
          <div className="flex justify-center py-16"><span className="loading loading-spinner loading-md text-neutral" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-base-content/40 text-sm">No products found. Start by creating one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="bg-base-200/50 text-base-content/70 border-b border-base-200 text-xs uppercase tracking-wider">
                  <th className="font-semibold py-3">Product</th>
                  <th className="font-semibold py-3">Category</th>
                  <th className="font-semibold py-3">Price</th>
                  <th className="font-semibold py-3">Stock</th>
                  <th className="text-right font-semibold py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-base-50 border-b border-base-200 last:border-none transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-base-200 border border-base-300 overflow-hidden flex-shrink-0">
                          {p.image_url
                            ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                            : <span className="flex items-center justify-center w-full h-full text-base-content/30 text-xs">No img</span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-base-content">{p.name}</p>
                          <p className="text-xs text-base-content/50 line-clamp-1 max-w-[200px] mt-0.5">{p.description || "No description"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-base-content/70">{p.category_name || "—"}</td>
                    <td className="py-3 font-medium">€{parseFloat(p.price).toFixed(2)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        p.quantity === 0 ? "bg-red-50 text-red-600 border border-red-100" : 
                        p.quantity < 5 ? "bg-orange-50 text-orange-600 border border-orange-100" : 
                        "bg-slate-100 text-slate-600 border border-slate-200"
                      }`}>
                        {p.quantity} in stock
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2 justify-end">
                        <button className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content rounded" onClick={() => openStock(p)}>Stock</button>
                        <button className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content rounded" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-ghost btn-xs text-red-500 hover:bg-red-50 hover:text-red-600 rounded" onClick={() => openDelete(p)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === "create" || modal === "edit") && (
        <dialog className="modal modal-open bg-black/40 backdrop-blur-sm">
          <div className="modal-box max-w-lg rounded-xl shadow-xl border border-base-200">
            <h3 className="font-bold text-xl mb-6 tracking-tight">{modal === "create" ? "Regjistro Produkt" : "Edit Product"}</h3>
            <div className="flex flex-col gap-4">
              
              {/* Image Uploader optimized for 1:1 format */}
              <div className="form-control gap-1 mb-2">
                <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Product Image</span></label>
                <div
                  className="border-2 border-dashed border-base-300 bg-base-50 rounded-xl p-6 text-center cursor-pointer hover:border-neutral hover:bg-base-200 transition-all flex flex-col items-center justify-center group"
                  onClick={() => fileRef.current?.click()}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-32 h-32 object-cover rounded-lg shadow-sm border border-base-200" alt="Preview" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-base-200 flex items-center justify-center mb-3 group-hover:bg-base-300 transition-colors">
                        <svg className="w-6 h-6 text-base-content/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <span className="text-sm font-semibold text-base-content/80">Click to upload product image</span>
                      <div className="mt-2 text-xs text-base-content/50 bg-base-200/50 px-3 py-1.5 rounded-md border border-base-200">
                        <span className="font-bold text-base-content/70">Required format:</span> 1:1 Aspect Ratio (Square)<br/>
                        Min Size: 800x800px · WebP, JPG, PNG
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>

              <div className="form-control gap-1">
                <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Name *</span></label>
                <input className="input input-bordered w-full rounded-md" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Emri i produktit" />
              </div>
              <div className="form-control gap-1">
                <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Description</span></label>
                <textarea className="textarea textarea-bordered rounded-md resize-none" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Pershkrimi..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-control gap-1">
                  <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Price (€) *</span></label>
                  <input type="number" step="0.01" min="0" className="input input-bordered w-full rounded-md" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
                </div>
                <div className="form-control gap-1">
                  <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Initial Stock</span></label>
                  <input type="number" min="0" className="input input-bordered w-full rounded-md" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div className="form-control gap-1">
                <label className="label py-0"><span className="label-text font-semibold text-xs uppercase tracking-wider text-base-content/70">Category</span></label>
                <select className="select select-bordered w-full rounded-md" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
                  <option value="">No category selected</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-action mt-6 pt-4 border-t border-base-200">
              <button className="btn btn-ghost rounded-md" onClick={closeModal}>Cancel</button>
              <button className={`btn btn-neutral rounded-md ${saving ? "loading" : ""}`} onClick={handleSave} disabled={saving || !form.name || !form.price}>
                {saving ? "Saving..." : "Save Product"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop bg-transparent" onClick={closeModal} />
        </dialog>
      )}

      {/* Stock Modal */}
      {modal === "stock" && (
        <dialog className="modal modal-open bg-black/40 backdrop-blur-sm">
          <div className="modal-box max-w-xs rounded-xl shadow-xl">
            <h3 className="font-bold text-lg mb-1">Update Inventory</h3>
            <p className="text-sm text-base-content/60 mb-5">{target?.name}</p>
            <input type="number" min="0" className="input input-bordered w-full rounded-md text-lg font-mono" value={stockVal} onChange={e => setStockVal(e.target.value)} />
            <div className="modal-action">
              <button className="btn btn-ghost rounded-md" onClick={closeModal}>Cancel</button>
              <button className={`btn btn-neutral rounded-md ${saving ? "loading" : ""}`} onClick={handleStock} disabled={saving}>Confirm</button>
            </div>
          </div>
        </dialog>
      )}

      {/* Delete Confirm */}
      {modal === "delete" && (
        <dialog className="modal modal-open bg-black/40 backdrop-blur-sm">
          <div className="modal-box max-w-sm rounded-xl shadow-xl">
            <h3 className="font-bold text-lg text-red-600">Delete Product</h3>
            <p className="py-4 text-sm text-base-content/70 leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-base-content">{target?.name}</span>? This action is permanent and cannot be undone.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost rounded-md" onClick={closeModal}>Cancel</button>
              <button className={`btn bg-red-600 text-white hover:bg-red-700 border-none rounded-md ${saving ? "loading" : ""}`} onClick={handleDelete} disabled={saving}>Yes, Delete</button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}