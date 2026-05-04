import { Camera, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "../context/AuthContext.jsx";
import { getHistory } from "../lib/api.js";

const conditions = ["Diabetes", "Hypertension", "Obesity", "Family history of heart disease", "Smoker"];

function trend(items) {
  if (items.length < 2) return "stable";
  const latest = items[0].probability;
  const previous = items[1].probability;
  if (latest < previous - 0.02) return "improving";
  if (latest > previous + 0.02) return "worsening";
  return "stable";
}

export default function Profile() {
  const { user, saveProfile } = useAuth();
  const [history, setHistory] = useState({ assessments: [], summary: {} });
  const [tab, setTab] = useState("overview");
  const [form, setForm] = useState({ name: "", date_of_birth: "", gender: "", avatar_url: "", medical_background: [] });
  const trendState = useMemo(() => trend(history.assessments), [history.assessments]);
  const latest = history.assessments[0];

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        date_of_birth: user.date_of_birth || "",
        gender: user.gender || "Prefer not to say",
        avatar_url: user.avatar_url || "",
        medical_background: user.medical_background || [],
      });
    }
  }, [user]);

  const chart = [...history.assessments].reverse().map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    risk: Math.round(item.probability * 100),
  }));

  const save = async (event) => {
    event.preventDefault();
    const payload = { ...form };
    await saveProfile(payload);
  };

  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, avatar_url: reader.result }));
    reader.readAsDataURL(file);
  };

  const journeyText = {
    improving: "Great progress! Your latest risk score has decreased compared with your prior assessment.",
    worsening: "Your risk score has increased. Consider consulting a healthcare professional.",
    stable: "Your risk has remained stable. Keep up your healthy habits.",
  }[trendState];

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 pb-24 pt-8 lg:grid-cols-[320px_1fr]">
      <aside className="glass-card rounded-lg p-6">
        <label className="group relative mx-auto block h-32 w-32 cursor-pointer">
          <img alt="" className="h-32 w-32 rounded-full object-cover" src={form.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name || "CS")}`} />
          <span className="absolute inset-0 hidden place-items-center rounded-full bg-black/55 group-hover:grid"><Camera /></span>
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
        </label>
        <h1 className="mt-5 text-center text-2xl font-extrabold">{user?.name}</h1>
        <p className="text-center text-sm text-slate-400">{user?.email}</p>
        <p className="mt-3 text-center text-xs text-slate-500">Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}</p>
        <div className="mt-6 grid gap-3 text-center">
          <div className="rounded-lg bg-slate-950/45 p-3"><div className="text-2xl font-bold">{history.summary?.total || 0}</div><div className="text-xs text-slate-400">Total Assessments</div></div>
          <div className="rounded-lg bg-slate-950/45 p-3"><div className="font-bold text-cyan-200">{latest?.risk_level || "No data"}</div><div className="text-xs text-slate-400">Latest Risk Level</div></div>
          <div className="rounded-lg bg-slate-950/45 p-3"><div className="font-bold">{trendState === "improving" ? "down" : trendState === "worsening" ? "up" : "stable"}</div><div className="text-xs text-slate-400">Risk Trend</div></div>
        </div>
      </aside>

      <main className="glass-card rounded-lg p-6">
        <div className="flex gap-2 border-b border-white/10 pb-4">
          {["overview", "edit profile"].map((item) => (
            <button key={item} className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize ${tab === item ? "bg-cyan-400 text-slate-950" : "text-slate-300"}`} onClick={() => setTab(item)}>{item}</button>
          ))}
        </div>

        {tab === "overview" ? (
          <div className="pt-6">
            <h2 className="text-2xl font-bold">Your Risk Journey</h2>
            <p className="mt-2 text-slate-300">{journeyText}</p>
            <div className="mt-6 h-72">
              {chart.length ? (
                <ResponsiveContainer>
                  <AreaChart data={chart}>
                    <defs><linearGradient id="riskTrend" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#e63946" stopOpacity={0.45} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="date" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
                    <Area dataKey="risk" stroke="#e63946" fill="url(#riskTrend)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <div className="grid h-full place-items-center text-slate-400">Take an assessment to start your chart.</div>}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-slate-950/45 p-5">Based on your profile and latest score, you are at lower risk than <b>{latest ? Math.max(5, 100 - Math.round(latest.probability * 100)) : 0}%</b> of similar patients.</div>
              <div className="rounded-lg border border-white/10 bg-slate-950/45 p-5">Last assessment: <b>{latest ? `${Math.round(latest.probability * 100)}% ${latest.risk_level}` : "No assessment yet"}</b><br />Top factors: {latest?.feature_contributions?.slice(0, 2).map((item) => item.feature).join(", ") || "-"}</div>
            </div>
          </div>
        ) : (
          <form className="grid gap-5 pt-6" onSubmit={save}>
            <input className="medical-input" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <input className="medical-input" type="date" value={form.date_of_birth || ""} onChange={(event) => setForm({ ...form, date_of_birth: event.target.value })} />
            <select className="medical-input" value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value })}>
              <option>Male</option><option>Female</option><option>Prefer not to say</option>
            </select>
            <div className="grid gap-2 md:grid-cols-2">
              {conditions.map((condition) => (
                <label key={condition} className="rounded-lg border border-white/10 bg-slate-950/40 p-3 text-sm">
                  <input className="mr-2" type="checkbox" checked={form.medical_background.includes(condition)} onChange={() => setForm((current) => ({ ...current, medical_background: current.medical_background.includes(condition) ? current.medical_background.filter((item) => item !== condition) : [...current.medical_background, condition] }))} />
                  {condition}
                </label>
              ))}
            </div>
            <div className="text-sm text-slate-400">
              To change your password or email, please visit the <Link to="/settings" className="text-cyan-400 hover:underline">Settings page</Link>.
            </div>
            <button className="inline-flex w-fit items-center gap-2 rounded-lg bg-medical-red px-5 py-3 font-semibold text-white shadow-redglow"><Save size={18} /> Save Changes</button>
          </form>
        )}
      </main>
    </div>
  );
}
