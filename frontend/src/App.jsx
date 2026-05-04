import { AnimatePresence, motion } from "framer-motion";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Landing from "./pages/Landing.jsx";
import Assessment from "./pages/Assessment.jsx";
import Results from "./pages/Results.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ModelInfo from "./pages/ModelInfo.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ProfileSetup from "./pages/ProfileSetup.jsx";
import Profile from "./pages/Profile.jsx";
import History from "./pages/History.jsx";
import Settings from "./pages/Settings.jsx";
import NotFound from "./pages/NotFound.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

const pageMotion = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.28, ease: "easeOut" },
};

function AnimatedRoute({ children }) {
  return (
    <motion.main {...pageMotion} className="min-h-screen pt-20">
      {children}
    </motion.main>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <>
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<AnimatedRoute><Landing /></AnimatedRoute>} />
          <Route path="/login" element={<AnimatedRoute><Login /></AnimatedRoute>} />
          <Route path="/register" element={<AnimatedRoute><Register /></AnimatedRoute>} />
          <Route path="/assessment" element={<AnimatedRoute><ProtectedRoute><Assessment /></ProtectedRoute></AnimatedRoute>} />
          <Route path="/results" element={<AnimatedRoute><ProtectedRoute><Results /></ProtectedRoute></AnimatedRoute>} />
          <Route path="/dashboard" element={<AnimatedRoute><Dashboard /></AnimatedRoute>} />
          <Route path="/model" element={<AnimatedRoute><ModelInfo /></AnimatedRoute>} />
          <Route path="/profile/setup" element={<AnimatedRoute><ProtectedRoute><ProfileSetup /></ProtectedRoute></AnimatedRoute>} />
          <Route path="/profile" element={<AnimatedRoute><ProtectedRoute><Profile /></ProtectedRoute></AnimatedRoute>} />
          <Route path="/settings" element={<AnimatedRoute><ProtectedRoute><Settings /></ProtectedRoute></AnimatedRoute>} />
          <Route path="/history" element={<AnimatedRoute><ProtectedRoute><History /></ProtectedRoute></AnimatedRoute>} />
          <Route path="*" element={<AnimatedRoute><NotFound /></AnimatedRoute>} />
        </Routes>
      </AnimatePresence>
      <div className="floating-disclaimer fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-lg border border-cyan-400/25 bg-slate-950/90 px-4 py-3 text-center text-sm text-slate-200 shadow-glow backdrop-blur">
        ⚕️ For Research & Educational Use Only
      </div>
    </>
  );
}
