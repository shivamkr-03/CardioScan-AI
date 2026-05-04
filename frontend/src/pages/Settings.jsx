import { useState } from "react";
import { Bell, Lock, Activity, Sliders, Shield } from "lucide-react";

import NotificationsTab from "../components/settings/NotificationsTab.jsx";
import SecurityTab from "../components/settings/SecurityTab.jsx";
import UnitsTab from "../components/settings/UnitsTab.jsx";
import DefaultsTab from "../components/settings/DefaultsTab.jsx";
import PrivacyTab from "../components/settings/PrivacyTab.jsx";

const TABS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security & Sessions", icon: Lock },
  { id: "units", label: "Unit Preferences", icon: Activity },
  { id: "defaults", label: "Assessment Defaults", icon: Sliders },
  { id: "privacy", label: "Privacy & Data", icon: Shield },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("notifications");

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white">Settings</h1>
        <p className="mt-2 text-slate-400">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-cyan-500/10 text-cyan-400"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon size={18} className={isActive ? "text-cyan-400" : "text-slate-400"} />
                {tab.label}
              </button>
            );
          })}
        </aside>

        <main className="glass-card rounded-xl p-6 lg:p-8 min-h-[500px]">
          {activeTab === "notifications" && <NotificationsTab />}
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "units" && <UnitsTab />}
          {activeTab === "defaults" && <DefaultsTab />}
          {activeTab === "privacy" && <PrivacyTab />}
        </main>
      </div>
    </div>
  );
}
