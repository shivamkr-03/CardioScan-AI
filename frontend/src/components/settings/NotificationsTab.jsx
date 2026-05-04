import { useSettings } from "../../context/SettingsContext";
import toast from "react-hot-toast";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function NotificationsTab() {
  const { settings, updateSettings, loading } = useSettings();
  const [form, setForm] = useState({
    email_report_delivery: true,
    email_risk_alerts: true,
    email_reminders: true,
    reminder_frequency: "quarterly",
    reminder_next_date: new Date()
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        email_report_delivery: settings.email_report_delivery ?? true,
        email_risk_alerts: settings.email_risk_alerts ?? true,
        email_reminders: settings.email_reminders ?? true,
        reminder_frequency: settings.reminder_frequency || "quarterly",
        reminder_next_date: settings.reminder_next_date ? new Date(settings.reminder_next_date) : new Date(),
      });
    }
  }, [settings]);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        ...form,
        reminder_next_date: form.reminder_next_date.toISOString().split("T")[0]
      };
      await updateSettings(payload);
      toast.success("Notification preferences saved");
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
        <h2 className="text-xl font-bold text-white">Email Notifications</h2>
        <p className="mt-1 text-sm text-slate-400">Control what emails you receive from CardioScan AI.</p>
      </div>

      <div className="space-y-4 rounded-lg border border-white/10 bg-slate-950/40 p-5">
        <label className="flex items-center justify-between">
          <div>
            <div className="font-medium text-white">Report Delivery</div>
            <div className="text-sm text-slate-400">Receive your assessment reports automatically via email.</div>
          </div>
          <input 
            type="checkbox" 
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950" 
            checked={form.email_report_delivery}
            onChange={(e) => handleChange("email_report_delivery", e.target.checked)}
          />
        </label>
        
        <label className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <div className="font-medium text-white">Risk Alerts</div>
            <div className="text-sm text-slate-400">Get notified immediately if a high risk score is detected.</div>
          </div>
          <input 
            type="checkbox" 
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950" 
            checked={form.email_risk_alerts}
            onChange={(e) => handleChange("email_risk_alerts", e.target.checked)}
          />
        </label>

        <label className="flex items-center justify-between border-t border-white/5 pt-4">
          <div>
            <div className="font-medium text-white">Assessment Reminders</div>
            <div className="text-sm text-slate-400">Get reminded to take your regular heart health assessment.</div>
          </div>
          <input 
            type="checkbox" 
            className="h-5 w-5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-950" 
            checked={form.email_reminders}
            onChange={(e) => handleChange("email_reminders", e.target.checked)}
          />
        </label>
      </div>

      {form.email_reminders && (
        <div className="space-y-4 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <h3 className="font-medium text-white">Reminder Schedule</h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Frequency</label>
              <select 
                className="medical-input"
                value={form.reminder_frequency}
                onChange={(e) => handleChange("reminder_frequency", e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Bi-annually</option>
                <option value="annually">Annually</option>
              </select>
            </div>
            
            <div>
              <label className="mb-2 block text-sm text-slate-400">Next Reminder Date</label>
              <DatePicker 
                selected={form.reminder_next_date}
                onChange={(date) => handleChange("reminder_next_date", date)}
                className="medical-input"
                dateFormat="MMMM d, yyyy"
                minDate={new Date()}
              />
            </div>
          </div>
        </div>
      )}

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
