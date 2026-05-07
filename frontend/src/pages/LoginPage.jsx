import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/useAuthStore";

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const { login, isLoading, error, admin, clearError } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (admin) navigate("/admin/dashboard");
  }, [admin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(form.email, form.password);
    if (result.success) navigate("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo / Brand */}


        {/* Card */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body gap-4">

 

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-control gap-1">
                <label className="label py-0">
                  <span className="label-text font-medium">Email</span>
                </label>
                <input
                  type="email"
                  placeholder="admin@example.com"
                  className="input input-bordered w-full"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  autoFocus
                />
              </div>

              <div className="form-control gap-1">
                <label className="label py-0">
                  <span className="label-text font-medium">Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className={`btn btn-primary w-full mt-2 ${isLoading ? "loading" : ""}`}
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

          </div>
        </div>


      </div>
    </div>
  );
}
