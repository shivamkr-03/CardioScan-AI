import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Key, Mail, Smartphone, Monitor, Trash2, LogOut } from "lucide-react";
import { changePassword, changeEmail, getSessions, deleteSession, deleteAllSessions } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

export default function SecurityTab() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [passwordForm, setPasswordForm] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [emailForm, setEmailForm] = useState({ new_email: "", password: "" });

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getSessions();
      setSessions(data);
    } catch (err) {
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return toast.error("New passwords do not match");
    }
    if (passwordForm.new_password.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    
    try {
      await changePassword({ 
        current_password: passwordForm.current_password, 
        new_password: passwordForm.new_password 
      });
      toast.success("Password updated successfully");
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update password");
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!emailForm.new_email || !emailForm.password) return;
    
    try {
      await changeEmail({ new_email: emailForm.new_email, password: emailForm.password });
      toast.success("Email address updated. Please login again with your new email.");
      // Typically we'd log the user out here, but relying on context for now.
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to update email");
    }
  };

  const handleRevokeSession = async (id) => {
    try {
      await deleteSession(id);
      toast.success("Session revoked");
      loadSessions();
    } catch (err) {
      toast.error("Failed to revoke session");
    }
  };

  const handleRevokeAll = async () => {
    if (!window.confirm("Are you sure you want to log out of all other devices?")) return;
    try {
      await deleteAllSessions();
      toast.success("All other sessions revoked");
      loadSessions();
    } catch (err) {
      toast.error("Failed to revoke sessions");
    }
  };

  const getDeviceIcon = (userAgent) => {
    if (!userAgent) return <Monitor size={20} className="text-slate-400" />;
    const ua = userAgent.toLowerCase();
    if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) {
      return <Smartphone size={20} className="text-slate-400" />;
    }
    return <Monitor size={20} className="text-slate-400" />;
  };

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Mail size={20} className="text-cyan-400" /> Change Email
          </h2>
          <p className="mt-1 text-sm text-slate-400">Current email: <strong className="text-slate-200">{user?.email}</strong></p>
        </div>
        <form onSubmit={handleEmailSubmit} className="grid gap-4 max-w-md rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">New Email Address</label>
            <input 
              type="email" 
              className="medical-input" 
              value={emailForm.new_email} 
              onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} 
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Current Password</label>
            <input 
              type="password" 
              className="medical-input" 
              value={emailForm.password} 
              onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })} 
              required
            />
          </div>
          <button type="submit" className="mt-2 w-full rounded-lg bg-cyan-500/20 py-2.5 font-semibold text-cyan-400 transition hover:bg-cyan-500/30">
            Update Email
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Key size={20} className="text-cyan-400" /> Change Password
          </h2>
        </div>
        <form onSubmit={handlePasswordSubmit} className="grid gap-4 max-w-md rounded-lg border border-white/10 bg-slate-950/40 p-5">
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Current Password</label>
            <input 
              type="password" 
              className="medical-input" 
              value={passwordForm.current_password} 
              onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} 
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">New Password</label>
            <input 
              type="password" 
              className="medical-input" 
              value={passwordForm.new_password} 
              onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} 
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Confirm New Password</label>
            <input 
              type="password" 
              className="medical-input" 
              value={passwordForm.confirm_password} 
              onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} 
              required
            />
          </div>
          <button type="submit" className="mt-2 w-full rounded-lg bg-cyan-500/20 py-2.5 font-semibold text-cyan-400 transition hover:bg-cyan-500/30">
            Update Password
          </button>
        </form>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Active Sessions</h2>
            <p className="mt-1 text-sm text-slate-400">Manage the devices that are currently logged into your account.</p>
          </div>
          {sessions.length > 1 && (
            <button 
              onClick={handleRevokeAll}
              className="flex items-center gap-2 rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut size={16} /> Revoke All Other Sessions
            </button>
          )}
        </div>
        
        {loading ? (
          <div className="text-slate-400">Loading sessions...</div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div key={session.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-950/40 p-4">
                <div className="flex items-center gap-4">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-800">
                    {getDeviceIcon(session.device_info)}
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">
                      {session.ip_address || "Unknown Location"}
                      {session.is_current && <span className="ml-2 inline-flex items-center rounded-full bg-cyan-400/10 px-2 py-0.5 text-xs font-medium text-cyan-400">Current Session</span>}
                    </div>
                    <div className="text-xs text-slate-500">
                      <span className="truncate max-w-xs inline-block align-bottom" title={session.device_info}>{session.device_info || "Unknown Device"}</span>
                      <span className="mx-2">•</span>
                      Last active: {new Date(session.last_active).toLocaleString()}
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <button 
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-2 text-slate-400 transition hover:text-red-400"
                    title="Revoke session"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
