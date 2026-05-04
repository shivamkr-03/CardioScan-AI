import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function strength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d|[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "", date_of_birth: "", gender: "Prefer not to say", terms: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const passwordStrength = useMemo(() => strength(form.password), [form.password]);
  const labels = ["Weak", "Medium", "Strong"];

  const submit = async (event) => {
    event.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords do not match.");
    if (!form.terms) return setError("Please accept the educational-use terms.");
    setError("");
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender,
      });
      navigate("/profile/setup");
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 pb-20 pt-8">
      <div className="glass-card rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold">Create your account</h1>
        <form className="mt-8 grid gap-5" onSubmit={submit}>
          <input className="medical-input" required placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input className="medical-input" required placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="medical-input" required placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <div>
            <div className="h-2 rounded-full bg-slate-800">
              <div className={`h-2 rounded-full ${passwordStrength < 2 ? "bg-red-400" : passwordStrength < 3 ? "bg-yellow-300" : "bg-emerald-400"}`} style={{ width: `${Math.max(1, passwordStrength) * 33.3}%` }} />
            </div>
            <p className="mt-1 text-xs text-slate-400">Password strength: {labels[Math.max(0, passwordStrength - 1)]}</p>
          </div>
          <input className="medical-input" required placeholder="Confirm password" type="password" value={form.confirm} onChange={(event) => setForm({ ...form, confirm: event.target.value })} />
          <input className="medical-input" type="date" value={form.date_of_birth} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
          <div className="flex flex-wrap gap-2">
            {["Male", "Female", "Prefer not to say"].map((gender) => (
              <button key={gender} type="button" className={`rounded-full px-4 py-2 text-sm font-semibold ${form.gender === gender ? "bg-cyan-400 text-slate-950" : "border border-white/10 text-slate-300"}`} onClick={() => setForm({ ...form, gender })}>
                {gender}
              </button>
            ))}
          </div>
          <label className="flex gap-3 text-sm leading-6 text-slate-300">
            <input type="checkbox" checked={form.terms} onChange={(event) => setForm({ ...form, terms: event.target.checked })} />
            I understand this tool is for educational purposes and not a substitute for medical advice.
          </label>
          {error && <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>}
          <button className="flex items-center justify-center gap-2 rounded-lg bg-medical-red px-5 py-3 font-bold text-white shadow-redglow" disabled={loading}>
            {loading && <Loader2 className="animate-spin" size={18} />} Sign Up
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">Already have an account? <Link className="text-cyan-300" to="/login">Login</Link></p>
      </div>
    </div>
  );
}
