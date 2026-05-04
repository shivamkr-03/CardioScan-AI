import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { getSettings, updateSettingsUser } from "../lib/api";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getSettings();
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (payload) => {
    try {
      const updated = await updateSettingsUser(payload);
      setSettings(updated);
      return updated;
    } catch (err) {
      console.error("Failed to update settings:", err);
      throw err;
    }
  };

  const value = {
    settings,
    updateSettings,
    loading,
    units: {
      height: settings?.height_unit || "cm",
      weight: settings?.weight_unit || "kg",
      cholesterol: settings?.cholesterol_unit || "mg/dl",
      bp: settings?.bp_unit || "mmHg",
    },
    defaults: {
      age: settings?.default_age || "",
      gender: settings?.default_gender || "",
      smoker: settings?.default_smoker || false,
      diabetic: settings?.default_diabetic || false,
    }
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
