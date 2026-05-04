import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { getMe, loginUser, registerUser, updateProfile } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cardioscan_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setUser(null);
      return;
    }
    getMe()
      .then(setUser)
      .catch(() => {
        localStorage.removeItem("cardioscan_token");
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const storeSession = (data) => {
    localStorage.setItem("cardioscan_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const login = async (payload) => {
    const data = await loginUser(payload);
    storeSession(data);
    toast.success(`Welcome back, ${data.user.name}!`);
    return data.user;
  };

  const register = async (payload) => {
    const data = await registerUser(payload);
    storeSession(data);
    toast.success(`Welcome, ${data.user.name}!`);
    return data.user;
  };

  const saveProfile = async (payload) => {
    const data = await updateProfile(payload);
    setUser(data);
    toast.success("Profile updated");
    return data;
  };

  const logout = () => {
    localStorage.removeItem("cardioscan_token");
    setToken(null);
    setUser(null);
    toast("Logged out");
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      logout,
      saveProfile,
      isAuthenticated: Boolean(token && user),
    }),
    [token, user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
