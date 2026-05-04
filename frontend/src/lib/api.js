import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cardioscan_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getAnalytics() {
  const { data } = await api.get("/analytics");
  return data;
}

export async function predictRisk(payload) {
  const { data } = await api.post("/predict", payload);
  return data;
}

export async function registerUser(payload) {
  const { data } = await api.post("/auth/register", payload);
  return data;
}

export async function loginUser(payload) {
  const { data } = await api.post("/auth/login", payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put("/auth/profile", payload);
  return data;
}

export async function getHistory() {
  const { data } = await api.get("/assessments/history");
  return data;
}

export async function deleteAssessment(id) {
  const { data } = await api.delete(`/assessments/${id}`);
  return data;
}

export async function getNotes() {
  const { data } = await api.get("/notes");
  return data;
}

export async function createNote(payload) {
  const { data } = await api.post("/notes", payload);
  return data;
}

export async function deleteNote(id) {
  const { data } = await api.delete(`/notes/${id}`);
  return data;
}

export async function generateReport(payload) {
  const { data } = await api.post("/report/generate", payload, { responseType: "blob", timeout: 60000 });
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.put("/auth/change-password", payload);
  return data;
}

export async function changeEmail(payload) {
  const { data } = await api.put("/auth/change-email", payload);
  return data;
}

export async function getSettings() {
  const { data } = await api.get("/settings");
  return data;
}

export async function updateSettingsUser(payload) {
  const { data } = await api.put("/settings", payload);
  return data;
}

export async function getSessions() {
  const { data } = await api.get("/auth/sessions");
  return data;
}

export async function deleteSession(id) {
  const { data } = await api.delete(`/auth/sessions/${id}`);
  return data;
}

export async function deleteAllSessions() {
  const { data } = await api.delete("/auth/sessions/all");
  return data;
}

export async function exportUserData() {
  const { data } = await api.get("/user/export-data");
  return data;
}

export async function deleteAccount() {
  const { data } = await api.delete("/user/delete-account");
  return data;
}
