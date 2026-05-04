import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function UnitsTab() {
  const { settings, updateSettings, loading } = useSettings();
  const [form, setForm] = useState({
    height_unit: "cm",
    weight_unit: "kg",
    cholesterol_unit: "mg/dl",
    bp_unit: "mmHg",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        height_unit: settings.height_unit || "cm",
        weight_unit: settings.weight_unit || "kg",
        cholesterol_unit: settings.cholesterol_unit || "mg/dl",
        bp_unit: settings.bp_unit || "mmHg",
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(form);
      toast.success("Unit preferences saved");
    } catch (err) {
      toast.error("Failed to save preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Unit Preferences</h2>
        <p className="mt-1 text-sm text-slate-400">Choose how medical and physical metrics are displayed throughout the application.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="font-medium text-white">Height</label>
            <p className="text-xs text-slate-400">Used for BMI calculations.</p>
          </div>
          <div className="flex gap-2">
            {["cm", "in"].map((unit) => (
              <button
                key={unit}
                onClick={() => handleChange("height_unit", unit)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.height_unit === unit
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {unit === "cm" ? "Centimeters (cm)" : "Inches (in)"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="font-medium text-white">Weight</label>
            <p className="text-xs text-slate-400">Used for BMI calculations.</p>
          </div>
          <div className="flex gap-2">
            {["kg", "lbs"].map((unit) => (
              <button
                key={unit}
                onClick={() => handleChange("weight_unit", unit)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.weight_unit === unit
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {unit === "kg" ? "Kilograms (kg)" : "Pounds (lbs)"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="font-medium text-white">Cholesterol</label>
            <p className="text-xs text-slate-400">Serum cholesterol display format.</p>
          </div>
          <div className="flex gap-2">
            {["mg/dl", "mmol/L"].map((unit) => (
              <button
                key={unit}
                onClick={() => handleChange("cholesterol_unit", unit)}
                className={`flex-1 rounded-lg border px-2 py-2 text-sm font-medium transition ${
                  form.cholesterol_unit === unit
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="font-medium text-white">Blood Pressure</label>
            <p className="text-xs text-slate-400">Resting blood pressure format.</p>
          </div>
          <div className="flex gap-2">
            {["mmHg", "kPa"].map((unit) => (
              <button
                key={unit}
                onClick={() => handleChange("bp_unit", unit)}
                className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  form.bp_unit === unit
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-400"
                    : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-400 disabled:opacity-70"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Preferences"}
        </button>
      </div>
    </div>
  );
}
