import { Activity, ChevronDown, LogOut, Menu, Settings, UserRound, X, Sun, Moon } from "lucide-react";
import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";


const links = [
  { to: "/", label: "Home" },
  { to: "/assessment", label: "Assessment" },
  { to: "/dashboard", label: "Analytics" },
  { to: "/model", label: "Model Info" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const navClass = ({ isActive }) =>
    `rounded-md px-3 py-2 text-sm font-medium transition ${
      isActive ? "bg-cyan-400/10 text-cyan-200" : "text-slate-300 hover:text-white"
    }`;

  const themeToggle = (
    <button
      onClick={toggleTheme}
      className="grid h-9 w-9 place-items-center rounded-full bg-transparent text-slate-300 transition hover:bg-white/10 hover:text-white"
      aria-label="Toggle Theme"
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );

  const confirmLogout = () => {
    if (window.confirm("Log out of CardioScan AI?")) {
      logout();
      setMenuOpen(false);
    }
  };

  const authControls = isAuthenticated ? (
    <div className="relative">
      <button
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 text-sm text-white"
        onClick={() => setMenuOpen((value) => !value)}
      >
        <img
          alt=""
          className="h-8 w-8 rounded-full object-cover"
          src={user?.avatar_url || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.name || "CS")}`}
        />
        <span className="hidden lg:inline">{user?.name}</span>
        <ChevronDown size={16} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg border border-white/10 bg-slate-950 p-2 shadow-2xl">
          <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10" to="/profile" onClick={() => setMenuOpen(false)}>
            <UserRound size={16} /> My Profile
          </Link>
          <Link className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10" to="/history" onClick={() => setMenuOpen(false)}>
            <Activity size={16} /> Assessment History
          </Link>
          <Link className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/10" to="/settings" onClick={() => setMenuOpen(false)}>
            <Settings size={16} /> Settings
          </Link>
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-red-200 hover:bg-red-500/10" onClick={confirmLogout}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      )}
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link className="rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-400/10" to="/login">
        Login
      </Link>
      <Link className="rounded-lg bg-medical-red px-4 py-2 text-sm font-semibold text-white shadow-redglow transition hover:bg-red-500" to="/register">
        Sign Up
      </Link>
    </div>
  );

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0a0f1e]/92 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/15 text-red-300">
            <Activity size={22} />
          </span>
          CardioScan AI
        </Link>

        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass}>
              {link.label}
            </NavLink>
          ))}
          {themeToggle}
          {authControls}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          {themeToggle}
          <button
            aria-label="Toggle menu"
            className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 text-slate-100"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0a0f1e] px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setOpen(false)}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-2">{authControls}</div>
          </div>
        </div>
      )}

    </nav>
  );
}
