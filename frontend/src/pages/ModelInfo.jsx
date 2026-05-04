import { Crown } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics } from "../lib/api.js";

const modelColors = {
  "Logistic Regression": "#06b6d4",
  "Random Forest": "#22c55e",
  "Gradient Boosting": "#e63946",
};

function Progress({ label, value }) {
  return (
    <div>
      <div className="flex justify-between text-sm text-slate-300">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-800">
        <div className="h-2 rounded-full bg-cyan-400" style={{ width: `${value * 100}%` }} />
      </div>
    </div>
  );
}

export default function ModelInfo() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => setError("Unable to load model analytics. Start the FastAPI backend and refresh this page."));
  }, []);

  if (error) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-red-100">{error}</div></div>;
  if (!analytics) return <div className="mx-auto max-w-7xl px-4 py-10"><div className="glass-card rounded-lg p-8 text-slate-300">Loading model information...</div></div>;

  const rocData = [];
  Object.entries(analytics.roc_curves).forEach(([model, points]) => {
    points.forEach((point, index) => {
      rocData[index] = { ...(rocData[index] || {}), fpr: point.fpr, [model]: point.tpr, baseline: point.fpr };
    });
  });

  const cm = analytics.confusion_matrix;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Machine Learning</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Model Info</h1>
      </div>

      <section className="grid gap-5 lg:grid-cols-3">
        {Object.entries(analytics.model_metrics).map(([name, metrics]) => (
          <article key={name} className={`glass-card rounded-lg p-5 ${name === "Gradient Boosting" ? "border-red-400/40 shadow-redglow" : ""}`}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{name}</h2>
              {name === "Gradient Boosting" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold text-red-200">
                  <Crown size={14} /> Best Model
                </span>
              )}
            </div>
            <div className="mt-5 space-y-4">
              <Progress label="Accuracy" value={metrics.accuracy} />
              <Progress label="Precision" value={metrics.precision} />
              <Progress label="Recall" value={metrics.recall} />
              <Progress label="F1" value={metrics.f1} />
              <Progress label="AUC" value={metrics.auc} />
            </div>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-xl font-bold">ROC Curves</h2>
          <div className="mt-4 h-96">
            <ResponsiveContainer>
              <LineChart data={rocData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="fpr" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
                <Legend />
                {Object.keys(analytics.roc_curves).map((name) => (
                  <Line key={name} dot={false} dataKey={name} stroke={modelColors[name]} strokeWidth={2} />
                ))}
                <Line dot={false} dataKey="baseline" stroke="#64748b" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h2 className="text-xl font-bold">Confusion Matrix</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {[
              ["TN", cm.tn, "True Negative", "bg-cyan-500/18"],
              ["FP", cm.fp, "False Positive", "bg-yellow-500/18"],
              ["FN", cm.fn, "False Negative", "bg-red-500/18"],
              ["TP", cm.tp, "True Positive", "bg-emerald-500/18"],
            ].map(([key, value, label, bg]) => (
              <div key={key} className={`rounded-lg border border-white/10 p-5 text-center ${bg}`}>
                <div className="text-sm font-bold text-slate-300">{key}</div>
                <div className="mt-2 text-4xl font-extrabold text-white">{value}</div>
                <div className="mt-1 text-xs text-slate-400">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 glass-card rounded-lg p-5">
        <h2 className="text-xl font-bold">Feature Importance</h2>
        <div className="mt-4 h-[430px]">
          <ResponsiveContainer>
            <BarChart data={analytics.feature_importance} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis dataKey="feature" type="category" stroke="#94a3b8" width={150} />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="importance" fill="#06b6d4" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mt-6 glass-card rounded-lg p-6">
        <h2 className="text-xl font-bold">Dataset Info</h2>
        <p className="mt-3 text-slate-300">
          920 patients · 4 clinical centers (Cleveland, Hungary, Switzerland, VA Long Beach) · 13 features · Binary classification
        </p>
      </section>
    </div>
  );
}
