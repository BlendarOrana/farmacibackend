import { useEffect, useState } from "react";
import { useAdminStore } from "../../stores/useAdminStore";

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
    if (result.success) { setName(""); showToast("Category created"); }
    else showToast(result.message, "error");
  };

  const handleDelete = async () => {
    setSaving(true);
    const result = await deleteCategory(deleteTarget.id);
    setSaving(false);
    if (result.success) { setDeleteTarget(null); showToast("Category deleted"); }
    else showToast(result.message, "error");
  };

  return (
    <div className="flex flex-col gap-4 max-w-lg">
      {toast && (
        <div className="toast toast-top toast-end z-50">
          <div className={`alert ${toast.type === "error" ? "alert-error" : "alert-success"} shadow`}>
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      <h2 className="text-xl font-bold">Categories</h2>

      {/* Create form */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-4">
          <p className="font-medium text-sm mb-2">Add New Category</p>
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              placeholder="Category name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <button type="submit" className={`btn btn-primary btn-sm ${saving ? "loading" : ""}`} disabled={saving || !name.trim()}>
              Add
            </button>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="card bg-base-100 shadow-sm border border-base-300">
        <div className="card-body p-0">
          {categoriesLoading ? (
            <div className="flex justify-center py-10"><span className="loading loading-spinner" /></div>
          ) : categories.length === 0 ? (
            <p className="text-center text-base-content/40 py-10 text-sm">No categories yet</p>
          ) : (
            <ul className="divide-y divide-base-300">
              {categories.map(c => (
                <li key={c.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium">{c.name}</span>
                  <button
                    className="btn btn-ghost btn-xs text-error"
                    onClick={() => setDeleteTarget(c)}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleteTarget && (
        <dialog className="modal modal-open">
          <div className="modal-box max-w-xs">
            <h3 className="font-bold text-lg">Delete Category?</h3>
            <p className="py-3 text-sm text-base-content/60">
              Delete <strong>{deleteTarget.name}</strong>? Products in this category will be unassigned.
            </p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className={`btn btn-error ${saving ? "loading" : ""}`} onClick={handleDelete} disabled={saving}>Delete</button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setDeleteTarget(null)} />
        </dialog>
      )}
    </div>
  );
}
