import toast from "react-hot-toast";
import { useState } from "react";
import { Download, Trash2, AlertTriangle } from "lucide-react";
import { exportUserData, deleteAccount } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function PrivacyTab() {
  const { logout } = useAuth();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await exportUserData();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `cardioscan_export_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    const confirm1 = window.confirm(
      "WARNING: This will permanently delete your account, settings, and assessment history.\n\nAre you absolutely sure you want to proceed?"
    );
    
    if (!confirm1) return;
    
    const confirm2 = window.prompt("To confirm deletion, type 'DELETE' below:");
    
    if (confirm2 !== "DELETE") {
      if (confirm2 !== null) toast.error("Account deletion cancelled: confirmation did not match.");
      return;
    }
    
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success("Your account has been deleted");
      logout();
    } catch (err) {
      toast.error("Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <div>
          <h2 className="text-xl font-bold text-white">Data Export</h2>
          <p className="mt-1 text-sm text-slate-400">
            Download a copy of all your data including your profile, settings, assessment history, and notes.
          </p>
        </div>
        
        <div className="mt-4 rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <p className="mb-4 text-sm text-slate-300">
            Your data will be exported as a JSON file. This process may take a few moments.
          </p>
          <button 
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-70"
          >
            <Download size={18} />
            {exporting ? "Generating Export..." : "Export My Data"}
          </button>
        </div>
      </section>

      <section>
        <div>
          <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
          <p className="mt-1 text-sm text-slate-400">
            Irreversible and destructive actions. Proceed with caution.
          </p>
        </div>
        
        <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-red-500/20 p-2 text-red-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="font-medium text-white">Delete Account</h3>
              <p className="mt-1 text-sm text-slate-400">
                Permanently delete your account, remove all active sessions, and anonymize your data. This action cannot be undone.
              </p>
              <button 
                onClick={handleDelete}
                disabled={deleting}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2 font-medium text-white shadow-redglow transition hover:bg-red-600 disabled:opacity-70"
              >
                <Trash2 size={18} />
                {deleting ? "Deleting Account..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
