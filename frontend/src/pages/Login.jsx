import { Activity, Loader2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "", remember: true });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email: form.email, password: form.password });
      navigate(location.state?.from || "/assessment", { replace: true });
    } catch (err) {
      setError(err?.response?.data?.detail || "Wrong credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-slate-950/55 shadow-2xl lg:grid-cols-2">
      <section className="relative min-h-[520px] bg-[#0a0f1e] p-8">
        <div className="flex items-center gap-3 text-2xl font-extrabold">
          <Activity className="text-red-300" /> CardioScan AI
        </div>
        <h1 className="mt-12 max-w-md text-4xl font-extrabold">Secure risk tracking for your heart health journey.</h1>
        <p className="mt-4 max-w-md leading-7 text-slate-300">Save assessments, monitor trends, and generate research-grade PDF reports.</p>
        <svg viewBox="0 0 640 180" className="absolute bottom-8 left-8 right-8 h-44 w-[calc(100%-4rem)]">
          <path d="M0 94 H120 L140 62 L165 132 L190 94 H300 L320 35 L352 152 L384 94 H510 L530 76 L550 118 L570 94 H640" fill="none" stroke="#06b6d4" strokeDasharray="1000" strokeWidth="5" className="animate-ecg" />
        </svg>
      </section>
      <section className="bg-[#111827] p-8 sm:p-10">
        <h2 className="text-3xl font-extrabold">Welcome Back</h2>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <div>
            <label className="text-sm font-semibold text-slate-300">Email</label>
            <input className="medical-input mt-2" required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-300">Password</label>
            <input className="medical-input mt-2" required type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          </div>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-300">
              <input type="checkbox" checked={form.remember} onChange={(event) => setForm({ ...form, remember: event.target.checked })} /> Remember me
            </label>
            <button type="button" className="text-cyan-300" onClick={() => toast("Feature coming soon")}>Forgot password?</button>
          </div>
          {error && <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-medical-red px-5 py-3 font-bold text-white shadow-redglow" disabled={loading}>
            {loading && <Loader2 className="animate-spin" size={18} />} Login
          </button>
        </form>
        <div className="my-6 flex items-center gap-3 text-sm text-slate-500"><span className="h-px flex-1 bg-white/10" />or<span className="h-px flex-1 bg-white/10" /></div>
        <button title="OAuth integration ready" className="w-full rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-200 hover:bg-white/5">
          Continue with Google
        </button>
        <p className="mt-6 text-center text-sm text-slate-400">
          Don't have an account? <Link className="text-cyan-300" to="/register">Sign up</Link>
        </p>
      </section>
    </div>
  );
}
