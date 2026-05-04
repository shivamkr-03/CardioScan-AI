import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";

export default function DefaultsTab() {
  const { settings, updateSettings, loading } = useSettings();
  const [form, setForm] = useState({
    default_age: "",
    default_gender: "Male",
    default_smoker: false,
    default_diabetic: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        default_age: settings.default_age || "",
        default_gender: settings.default_gender || "Male",
        default_smoker: settings.default_smoker || false,
        default_diabetic: settings.default_diabetic || false,
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings({
        ...form,
        default_age: form.default_age ? parseInt(form.default_age, 10) : null,
      });
      toast.success("Default values saved");
    } catch (err) {
      toast.error("Failed to save default values");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-slate-400">Loading settings...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Assessment Defaults</h2>
        <p className="mt-1 text-sm text-slate-400">
          Pre-fill the assessment form with these values to save time. Leave blank to start fresh each time.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Default Age</label>
          <input
            type="number"
            className="medical-input"
            value={form.default_age}
            onChange={(e) => handleChange("default_age", e.target.value)}
            placeholder="e.g., 45"
            min="20"
            max="100"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Default Sex</label>
          <select
            className="medical-input"
            value={form.default_gender}
            onChange={(e) => handleChange("default_gender", e.target.value)}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-white/10 bg-slate-950/40 p-5 mt-4">
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white">Smoker</div>
            <div className="text-sm text-slate-400">Set smoker status to "Yes" by default.</div>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
            checked={form.default_smoker}
            onChange={(e) => handleChange("default_smoker", e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <div className="font-medium text-white">Diabetic</div>
            <div className="text-sm text-slate-400">Set diabetic status to "Yes" by default.</div>
          </div>
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950"
            checked={form.default_diabetic}
            onChange={(e) => handleChange("default_diabetic", e.target.checked)}
          />
        </label>
      </div>

      <div className="pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-5 py-2.5 font-semibold text-slate-950 shadow-glow transition hover:bg-cyan-400 disabled:opacity-70"
        >
          <Save size={18} />
          {saving ? "Saving..." : "Save Defaults"}
        </button>
      </div>
    </div>
  );
}
