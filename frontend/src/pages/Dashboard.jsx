import { Fragment, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getAnalytics } from "../lib/api.js";

const COLORS = ["#06b6d4", "#e63946", "#22c55e", "#facc15"];

function ChartCard({ title, insight, children, className = "" }) {
  return (
    <section className={`glass-card rounded-lg p-5 ${className}`}>
      <h2 className="text-lg font-bold text-white">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
      <p className="mt-4 text-sm text-slate-400">{insight}</p>
    </section>
  );
}

function LoadingState() {
  return <div className="glass-card rounded-lg p-8 text-slate-300">Loading analytics from the CardioScan API...</div>;
}

function ErrorState({ message }) {
  return <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-5 text-red-100">{message}</div>;
}

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics().then(setAnalytics).catch(() => setError("Unable to load analytics. Start the FastAPI backend and refresh this page."));
  }, []);

  if (error) return <div className="mx-auto max-w-7xl px-4 py-10"><ErrorState message={error} /></div>;
  if (!analytics) return <div className="mx-auto max-w-7xl px-4 py-10"><LoadingState /></div>;

  const genderPie = analytics.gender_breakdown.map((item) => ({
    name: item.gender,
    value: item.count,
    disease_rate: Math.round(item.disease_rate * 100),
  }));

  const heatLabels = [...new Set(analytics.correlation_matrix.map((item) => item.x))];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Dataset Analytics</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Clinical Insights Dashboard</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="Heart Disease Distribution" insight="The dataset is moderately balanced, allowing useful binary classification comparisons.">
          <ResponsiveContainer>
            <BarChart data={analytics.disease_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="value" fill="#e63946" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Gender Breakdown with Disease Rates" insight="Male patients show a higher disease share in the historical UCI sample.">
          <ResponsiveContainer>
            <PieChart>
              <Pie data={genderPie} dataKey="value" nameKey="name" outerRadius={92} label>
                {genderPie.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Age Distribution" insight="Most patient records cluster between middle age and older adulthood.">
          <ResponsiveContainer>
            <BarChart data={analytics.age_distribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="bin" stroke="#94a3b8" interval={1} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="count" fill="#06b6d4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Disease Rate by Age Group" insight="Risk prevalence rises across older patient groups in this dataset.">
          <ResponsiveContainer>
            <BarChart data={analytics.age_prevalence.map((item) => ({ ...item, disease_rate: Math.round(item.disease_rate * 100) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="group" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Bar dataKey="disease_rate" fill="#e63946" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Chest Pain Type vs Disease" insight="Asymptomatic chest pain is most strongly associated with disease labels.">
          <ResponsiveContainer>
            <BarChart data={analytics.chest_pain_counts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="type" stroke="#94a3b8" interval={0} tick={{ fontSize: 11 }} />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="no_disease" name="No Disease" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="disease" name="Disease" fill="#e63946" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Max Heart Rate by Disease Status" insight="Lower achieved heart-rate ranges tend to appear more often in disease-positive records.">
          <ResponsiveContainer>
            <BarChart data={analytics.thalach_ranges}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="status" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
              <Legend />
              <Bar dataKey="q1" fill="#0891b2" name="Q1" />
              <Bar dataKey="median" fill="#06b6d4" name="Median" />
              <Bar dataKey="q3" fill="#e63946" name="Q3" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Correlation Heatmap" insight="ST depression, vessel count, and max heart rate carry notable relationships with the target." className="lg:col-span-2">
          <div className="grid h-full place-items-center overflow-auto">
            <div className="grid gap-1" style={{ gridTemplateColumns: `120px repeat(${heatLabels.length}, minmax(64px, 1fr))` }}>
              <div />
              {heatLabels.map((label) => <div key={label} className="text-center text-xs text-slate-400">{label}</div>)}
              {heatLabels.map((row) => (
                <Fragment key={row}>
                  <div key={`${row}-label`} className="pr-2 text-right text-xs text-slate-400">{row}</div>
                  {heatLabels.map((col) => {
                    const cell = analytics.correlation_matrix.find((item) => item.x === row && item.y === col);
                    const value = cell?.value ?? 0;
                    const alpha = Math.min(0.95, Math.abs(value));
                    const bg = value >= 0 ? `rgba(230,57,70,${alpha})` : `rgba(6,182,212,${alpha})`;
                    return (
                      <div key={`${row}-${col}`} className="grid h-11 place-items-center rounded text-xs font-semibold text-white" style={{ backgroundColor: bg }}>
                        {value.toFixed(2)}
                      </div>
                    );
                  })}
                </Fragment>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
