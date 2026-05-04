import { motion } from "framer-motion";
import { Activity, BarChart3, BrainCircuit, ClipboardPlus, Database, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  ["920", "Patients Analyzed"],
  ["84.78%", "Accuracy"],
  ["0.93", "AUC Score"],
  ["13", "Clinical Parameters"],
];

const models = [
  { name: "Logistic Regression", accuracy: "82.07%", auc: "0.90", color: "bg-cyan-400" },
  { name: "Random Forest", accuracy: "84.78%", auc: "0.92", color: "bg-emerald-400" },
  { name: "Gradient Boosting", accuracy: "84.78%", auc: "0.93", color: "bg-red-400" },
];

export default function Landing() {
  return (
    <div>
      <section className="relative overflow-hidden px-4 pb-20 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-sm font-medium text-cyan-200"
            >
              <ShieldCheck size={16} /> Clinical decision support for education
            </motion.div>
            <h1 className="mt-7 max-w-4xl text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
              AI-Powered Heart Disease Risk Assessment
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Built on the UCI Heart Disease Dataset · 3 ML Models · 84.78% Accuracy
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link className="rounded-lg bg-medical-red px-6 py-3 text-center font-semibold text-white shadow-redglow transition hover:bg-red-500" to="/assessment">
                Take Assessment →
              </Link>
              <Link className="rounded-lg border border-cyan-400/30 px-6 py-3 text-center font-semibold text-cyan-100 transition hover:bg-cyan-400/10" to="/dashboard">
                View Analytics
              </Link>
            </div>
          </div>

          <div className="glass-card rounded-lg p-6 shadow-glow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Live Signal</p>
                <h2 className="mt-1 text-2xl font-bold">Cardiac pattern scan</h2>
              </div>
              <Activity className="animate-pulseSoft text-red-300" size={34} />
            </div>
            <svg viewBox="0 0 640 220" className="mt-6 h-56 w-full">
              <defs>
                <linearGradient id="ecgGradient" x1="0" x2="1">
                  <stop stopColor="#06b6d4" />
                  <stop offset="1" stopColor="#e63946" />
                </linearGradient>
              </defs>
              <path
                d="M0 118 H90 L112 118 L130 78 L151 165 L176 118 H238 L260 118 L278 40 L306 182 L333 118 H418 L436 118 L454 92 L472 146 L490 118 H640"
                fill="none"
                stroke="url(#ecgGradient)"
                strokeDasharray="1000"
                strokeWidth="6"
                className="animate-ecg"
              />
              <circle cx="130" cy="78" r="5" fill="#e63946" />
              <circle cx="278" cy="40" r="5" fill="#06b6d4" />
            </svg>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-slate-950/50 p-3 text-center">
                  <div className="text-2xl font-extrabold text-white">{value}</div>
                  <div className="mt-1 text-xs text-slate-400">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/40 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              [ClipboardPlus, "Enter Your Clinical Data", "Input demographics, cardiac indicators, and exercise test values."],
              [BrainCircuit, "AI Analyzes 13 Parameters", "The Gradient Boosting model evaluates normalized clinical patterns."],
              [BarChart3, "Get Instant Risk Assessment", "Review probability, drivers, metrics, and tailored recommendations."],
            ].map(([Icon, title, body]) => (
              <div key={title} className="glass-card rounded-lg p-6">
                <Icon className="text-cyan-300" size={30} />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <Database className="text-red-300" />
            <h2 className="text-3xl font-bold">Model Comparison</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {models.map((model) => (
              <div key={model.name} className="glass-card rounded-lg p-6">
                <h3 className="text-xl font-bold">{model.name}</h3>
                <div className="mt-5 space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-slate-300">
                      <span>Accuracy</span>
                      <span>{model.accuracy}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-800">
                      <div className={`h-2 rounded-full ${model.color}`} style={{ width: model.accuracy }} />
                    </div>
                  </div>
                  <div className="text-sm text-slate-300">AUC Score: <span className="font-semibold text-white">{model.auc}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-10 text-center text-sm text-slate-400">
        For educational/research purposes only. Not a substitute for professional medical advice.
      </footer>
    </div>
  );
}
