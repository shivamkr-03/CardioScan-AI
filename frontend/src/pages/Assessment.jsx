import { motion } from "framer-motion";
import { AlertTriangle, Check, HeartPulse, Loader2, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import InfoTip from "../components/InfoTip.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useSettings } from "../context/SettingsContext.jsx";
import { getHistory, predictRisk } from "../lib/api.js";
import { defaultPatient, readStorage, samplePatient, writeStorage } from "../lib/storage.js";

const STORAGE_KEY = "cardioscan_patient";

const tips = {
  age: "Age is a baseline risk factor because cardiovascular risk generally increases over time.",
  sex: "Biological sex is included because risk patterns can differ between men and women.",
  cp: "Chest pain type describes the character of chest discomfort reported during evaluation.",
  trestbps: "Resting blood pressure is measured in mm Hg before exercise or stress testing.",
  chol: "Serum cholesterol is measured in mg/dl and reflects blood lipid burden.",
  fbs: "Fasting blood sugar above 120 mg/dl can indicate metabolic risk.",
  restecg: "Resting ECG records the heart's electrical pattern before exercise.",
  thalach: "Maximum heart rate achieved is the highest pulse reached during exercise testing.",
  exang: "Exercise-induced angina means chest pain triggered during physical exertion.",
  oldpeak: "ST depression compares exercise ECG tracing to the resting baseline.",
  slope: "ST segment slope describes the shape of ECG recovery after exertion.",
  ca: "Major vessels colored by fluoroscopy estimates visible coronary vessel involvement.",
  thal: "Thalassemia category records a nuclear stress-test blood-flow pattern.",
};

function FieldLabel({ children, tip }) {
  return (
    <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
      {children}
      <InfoTip text={tip} />
    </label>
  );
}

function OptionCard({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition ${
        active
          ? "border-cyan-300 bg-cyan-400/10 text-white shadow-glow"
          : "border-white/10 bg-slate-950/40 text-slate-300 hover:border-cyan-400/40"
      }`}
    >
      {children}
    </button>
  );
}

function Slider({ label, tip, value, min, max, step = 1, unit, onChange, statusClass = "text-cyan-300", displayValue, displayOnChange }) {
  const isCustomDisplay = displayValue !== undefined && displayOnChange !== undefined;
  
  return (
    <div>
      <FieldLabel tip={tip}>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <input
          className="range-input"
          min={min}
          max={max}
          step={step}
          type="range"
          value={isCustomDisplay ? displayValue : value}
          onChange={(event) => isCustomDisplay ? displayOnChange(Number(event.target.value)) : onChange(Number(event.target.value))}
        />
        <span className={`min-w-24 text-right font-bold ${statusClass}`}>
          {isCustomDisplay ? displayValue : value} {unit}
        </span>
      </div>
    </div>
  );
}

export default function Assessment() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { units, defaults, loading: settingsLoading } = useSettings();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => readStorage(STORAGE_KEY, defaultPatient));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastAssessment, setLastAssessment] = useState(null);

  useEffect(() => {
    writeStorage(STORAGE_KEY, form);
  }, [form]);

  useEffect(() => {
    if (settingsLoading) return;
    
    getHistory()
      .then((history) => {
        setLastAssessment(history.assessments?.[0] || null);
        if (!readStorage(STORAGE_KEY, null)) {
          setForm((current) => ({
            ...current,
            trestbps: user?.medical_background?.includes("Hypertension") ? 145 : current.trestbps,
            fbs: user?.medical_background?.includes("Diabetes") || defaults?.diabetic ? 1 : current.fbs,
            exang: user?.medical_background?.includes("Smoker") || defaults?.smoker ? 1 : current.exang,
            age: defaults?.age || current.age,
            sex: defaults?.gender === "Female" ? 0 : (defaults?.gender === "Male" ? 1 : current.sex),
          }));
        }
      })
      .catch(() => {});
  }, [user, defaults, settingsLoading]);

  const bpClass = useMemo(() => {
    if (form.trestbps < 120) return "text-emerald-300";
    if (form.trestbps < 140) return "text-yellow-300";
    return "text-red-300";
  }, [form.trestbps]);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async () => {
    setLoading(true);
    setError("");
    try {
      const { dataset, ...payload } = form;
      const result = await predictRisk(payload);
      writeStorage("cardioscan_result", { result, patient: form, createdAt: new Date().toISOString() });
      toast.success("Assessment saved to your history");
      navigate("/results", { state: { result, patient: form } });
    } catch (err) {
      setError(err?.response?.data?.detail || "Unable to reach the CardioScan API. Start the FastAPI backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-300">Clinical Input</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">Heart Risk Assessment</h1>
        </div>
      </div>

      {lastAssessment && (
        <div className="mb-6 rounded-lg border border-cyan-400/25 bg-cyan-400/10 p-4 text-sm text-cyan-50">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <span>
              Your last assessment: {new Date(lastAssessment.timestamp).toLocaleDateString()} - Risk: {Math.round(lastAssessment.probability * 100)}%
            </span>
            <div className="flex gap-2">
              <button className="rounded-md border border-cyan-300/30 px-3 py-2" onClick={() => navigate("/history")}>View History</button>
              <button
                className="rounded-md bg-cyan-300 px-3 py-2 font-semibold text-slate-950"
                onClick={() => {
                  const next = {};
                  Object.keys(defaultPatient).forEach((key) => {
                    if (key in lastAssessment) next[key] = lastAssessment[key];
                  });
                  setForm({ ...form, ...next });
                }}
              >
                Pre-fill from last assessment
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card rounded-lg p-5">
        <div className="mb-8">
          <div className="flex justify-between text-sm font-medium text-slate-300">
            {[1, 2, 3].map((item) => (
              <span key={item} className={step >= item ? "text-cyan-200" : ""}>Step {item}</span>
            ))}
          </div>
          <div className="mt-3 h-2 rounded-full bg-slate-800">
            <motion.div
              className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-red-400"
              animate={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="grid gap-6">
            <Slider label="Age" tip={tips.age} value={form.age} min={20} max={80} unit="yrs" onChange={(value) => update("age", value)} />
            <div>
              <FieldLabel tip={tips.sex}>Sex</FieldLabel>
              <div className="grid gap-3 sm:grid-cols-2">
                <OptionCard active={form.sex === 1} onClick={() => update("sex", 1)}>
                  <UserRound className="mb-3 text-cyan-300" /> Male
                </OptionCard>
                <OptionCard active={form.sex === 0} onClick={() => update("sex", 0)}>
                  <UserRound className="mb-3 text-red-300" /> Female
                </OptionCard>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-7">
            <div>
              <FieldLabel tip={tips.cp}>Chest Pain Type</FieldLabel>
              <div className="grid gap-3 md:grid-cols-4">
                {[
                  [0, "Typical Angina", "Predictable exertional chest pain."],
                  [1, "Atypical Angina", "Chest pain with some angina features."],
                  [2, "Non-Anginal Pain", "Pain less consistent with angina."],
                  [3, "Asymptomatic", "No reported chest pain symptoms."],
                ].map(([value, title, body]) => (
                  <OptionCard key={value} active={form.cp === value} onClick={() => update("cp", value)}>
                    <div className="font-semibold">{title}</div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{body}</p>
                  </OptionCard>
                ))}
              </div>
            </div>
            <Slider 
              label="Resting Blood Pressure" 
              tip={tips.trestbps} 
              value={form.trestbps} 
              displayValue={units.bp === "kPa" ? Number((form.trestbps / 7.50062).toFixed(1)) : form.trestbps}
              displayOnChange={(val) => update("trestbps", units.bp === "kPa" ? Math.round(val * 7.50062) : val)}
              min={units.bp === "kPa" ? 10.7 : 80} 
              max={units.bp === "kPa" ? 26.7 : 200} 
              step={units.bp === "kPa" ? 0.1 : 1}
              unit={units.bp} 
              statusClass={bpClass} 
              onChange={(value) => update("trestbps", value)} 
            />
            <Slider 
              label="Cholesterol" 
              tip={tips.chol} 
              value={form.chol} 
              displayValue={units.cholesterol === "mmol/L" ? Number((form.chol / 38.67).toFixed(1)) : form.chol}
              displayOnChange={(val) => update("chol", units.cholesterol === "mmol/L" ? Math.round(val * 38.67) : val)}
              min={units.cholesterol === "mmol/L" ? 2.6 : 100} 
              max={units.cholesterol === "mmol/L" ? 15.5 : 600} 
              step={units.cholesterol === "mmol/L" ? 0.1 : 1}
              unit={units.cholesterol} 
              onChange={(value) => update("chol", value)} 
            />
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel tip={tips.fbs}>Fasting Blood Sugar &gt;120 mg/dl</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((value) => <OptionCard key={value} active={form.fbs === value} onClick={() => update("fbs", value)}>{value ? "Yes" : "No"}</OptionCard>)}
                </div>
              </div>
              <div>
                <FieldLabel tip={tips.restecg}>Resting ECG</FieldLabel>
                <div className="grid gap-3">
                  {[[0, "Normal"], [1, "ST-T Abnormality"], [2, "LV Hypertrophy"]].map(([value, label]) => (
                    <OptionCard key={value} active={form.restecg === value} onClick={() => update("restecg", value)}>{label}</OptionCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="grid gap-7">
            <Slider label="Max Heart Rate Achieved" tip={tips.thalach} value={form.thalach} min={60} max={202} unit="bpm" onChange={(value) => update("thalach", value)} />
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <FieldLabel tip={tips.exang}>Exercise Induced Angina</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[0, 1].map((value) => <OptionCard key={value} active={form.exang === value} onClick={() => update("exang", value)}>{value ? "Yes" : "No"}</OptionCard>)}
                </div>
              </div>
              <Slider label="ST Depression" tip={tips.oldpeak} value={form.oldpeak} min={0} max={6} step={0.1} unit="" onChange={(value) => update("oldpeak", value)} />
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <div>
                <FieldLabel tip={tips.slope}>Slope of ST Segment</FieldLabel>
                <div className="grid gap-3">
                  {[[0, "Upsloping"], [1, "Flat"], [2, "Downsloping"]].map(([value, label]) => (
                    <OptionCard key={value} active={form.slope === value} onClick={() => update("slope", value)}>{label}</OptionCard>
                  ))}
                </div>
              </div>
              <div>
                <FieldLabel tip={tips.ca}>Major Vessels Colored</FieldLabel>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 1, 2, 3].map((value) => <OptionCard key={value} active={form.ca === value} onClick={() => update("ca", value)}>{value}</OptionCard>)}
                </div>
              </div>
              <div>
                <FieldLabel tip={tips.thal}>Thalassemia</FieldLabel>
                <div className="grid gap-3">
                  {[[0, "Normal"], [1, "Fixed Defect"], [2, "Reversable Defect"]].map(([value, label]) => (
                    <OptionCard key={value} active={form.thal === value} onClick={() => update("thal", value)}>{label}</OptionCard>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 flex gap-3 rounded-lg border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
            <AlertTriangle size={20} /> {error}
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((value) => Math.max(1, value - 1))}
            className="rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button type="button" onClick={() => setStep((value) => value + 1)} className="rounded-lg bg-cyan-500 px-5 py-3 font-semibold text-slate-950">
              Continue
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-lg bg-medical-red px-5 py-3 font-semibold text-white shadow-redglow disabled:opacity-60"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
              Analyze My Risk →
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
        <HeartPulse size={16} className="text-red-300" />
        This tool supports research workflows and does not diagnose disease.
      </div>
    </div>
  );
}
