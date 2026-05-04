import { Download, RotateCcw, Stethoscope } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation } from "react-router-dom";
import FeatureContribution from "../components/FeatureContribution.jsx";
import RecommendationCard from "../components/RecommendationCard.jsx";
import RiskGauge from "../components/RiskGauge.jsx";
import { generateReport } from "../lib/api.js";
import { readStorage } from "../lib/storage.js";

function statusFor(metric, value) {
  const rules = {
    trestbps: value < 120 ? ["✓ Normal", "text-emerald-300", "<120 mm Hg"] : value < 140 ? ["⚠ Borderline", "text-yellow-300", "<120 mm Hg"] : ["✗ High Risk", "text-red-300", "<120 mm Hg"],
    chol: value < 200 ? ["✓ Normal", "text-emerald-300", "<200 mg/dl"] : value < 240 ? ["⚠ Borderline", "text-yellow-300", "<200 mg/dl"] : ["✗ High Risk", "text-red-300", "<200 mg/dl"],
    thalach: value >= 150 ? ["✓ Normal", "text-emerald-300", "Higher is generally better"] : value >= 120 ? ["⚠ Borderline", "text-yellow-300", "Higher is generally better"] : ["✗ High Risk", "text-red-300", "Higher is generally better"],
    oldpeak: value <= 1 ? ["✓ Normal", "text-emerald-300", "0-1"] : value <= 2 ? ["⚠ Borderline", "text-yellow-300", "0-1"] : ["✗ High Risk", "text-red-300", "0-1"],
  };
  return rules[metric];
}

function recommendations(patient) {
  const cards = [];
  if (patient.chol > 200) cards.push(["Cholesterol Management", "Consider dietary changes to reduce LDL cholesterol and discuss lipid screening with a clinician."]);
  if (patient.trestbps > 140) cards.push(["Blood Pressure Monitoring", "Monitor blood pressure regularly and review sustained high readings with a healthcare professional."]);
  if (patient.exang === 1) cards.push(["Exercise Symptoms", "Discuss exercise-induced angina with your cardiologist, especially if symptoms are new or worsening."]);
  if (patient.age > 55 && patient.sex === 1) cards.push(["Baseline Risk Review", "Men over 55 have elevated baseline cardiovascular risk and may benefit from periodic preventive evaluation."]);
  if (patient.oldpeak > 2) cards.push(["ECG Follow-Up", "ST depression may indicate cardiac stress and should be interpreted by a qualified clinician."]);
  cards.push(["Clinical Confirmation", "Consult a healthcare professional for proper diagnosis, treatment decisions, and interpretation of these findings."]);
  return cards.slice(0, 5);
}

export default function Results() {
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);
  const stored = readStorage("cardioscan_result", null);
  const result = location.state?.result || stored?.result;
  const patient = location.state?.patient || stored?.patient;

  if (!result || !patient) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <h1 className="text-3xl font-bold">No assessment result found</h1>
        <p className="mt-3 text-slate-300">Run an assessment to generate a risk report.</p>
        <Link className="mt-6 inline-block rounded-lg bg-medical-red px-5 py-3 font-semibold text-white" to="/assessment">
          Take Assessment
        </Link>
      </div>
    );
  }

  const metrics = [
    ["Resting BP", "trestbps", patient.trestbps, "mm Hg"],
    ["Cholesterol", "chol", patient.chol, "mg/dl"],
    ["Max Heart Rate", "thalach", patient.thalach, "bpm"],
    ["ST Depression", "oldpeak", patient.oldpeak, ""],
  ];

  const downloadReport = async () => {
    setDownloading(true);
    toast.loading("Generating your PDF report...", { id: "pdf" });
    try {
      const blob = await generateReport(
        result.assessment_id || result.id
          ? { assessment_id: result.assessment_id || result.id }
          : { assessment_data: { result, patient } },
      );
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "cardioscan-ai-report.pdf";
      anchor.click();
      URL.revokeObjectURL(url);
      toast.success("Report downloaded", { id: "pdf" });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Unable to generate report", { id: "pdf" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <section className="glass-card rounded-lg p-6 lg:p-8">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr] lg:items-center">
          <RiskGauge value={result.risk_percentage} level={result.risk_level} />
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-slate-950/60 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-cyan-200">
              {result.risk_level} Risk
            </div>
            <h1 className="mt-5 text-4xl font-extrabold text-white">
              {result.risk_percentage}% probability of heart disease
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
              This estimate is generated by the Gradient Boosting classifier using the submitted 13 clinical parameters.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              <Stethoscope size={18} /> This is an AI prediction, not a medical diagnosis.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <FeatureContribution contributions={result.feature_contributions} />
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-xl font-bold">Key Metrics</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {metrics.map(([label, key, value, unit]) => {
              const [status, color, range] = statusFor(key, value);
              return (
                <div key={key} className="rounded-lg border border-white/10 bg-slate-950/45 p-4">
                  <div className="text-sm text-slate-400">{label}</div>
                  <div className="mt-2 text-2xl font-extrabold text-white">{value} {unit}</div>
                  <div className={`mt-2 text-sm font-semibold ${color}`}>{status}</div>
                  <div className="mt-1 text-xs text-slate-500">Healthy range: {range}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-2xl font-bold">Personalized Recommendations</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recommendations(patient).map(([title, body]) => <RecommendationCard key={title} title={title} body={body} />)}
        </div>
      </section>

      <div className="no-print mt-8 flex flex-col gap-3 sm:flex-row">
        <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-400/30 px-5 py-3 font-semibold text-cyan-100 hover:bg-cyan-400/10" to="/assessment">
          <RotateCcw size={18} /> Take Again
        </Link>
        <button
          type="button"
          onClick={downloadReport}
          disabled={downloading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-medical-red px-5 py-3 font-semibold text-white shadow-redglow disabled:opacity-60"
        >
          <Download size={18} /> {downloading ? "Generating..." : "Download Report"}
        </button>
      </div>

      <div className="print-only mt-8 text-sm">
        CardioScan AI report generated for educational/research use only.
      </div>
    </div>
  );
}
