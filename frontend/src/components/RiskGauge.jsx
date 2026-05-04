import { motion } from "framer-motion";

export default function RiskGauge({ value = 0, level = "Low" }) {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.max(0, Math.min(100, value));
  const offset = circumference - (percentage / 100) * circumference;
  const color = percentage < 30 ? "#22c55e" : percentage < 60 ? "#facc15" : "#e63946";

  return (
    <div className="relative mx-auto h-64 w-64">
      <svg viewBox="0 0 220 220" className="h-full w-full -rotate-90">
        <circle cx="110" cy="110" r={radius} fill="none" stroke="rgba(148, 163, 184, 0.16)" strokeWidth="18" />
        <motion.circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeWidth="18"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-5xl font-extrabold" style={{ color }}>
            {percentage}%
          </div>
          <div className="mt-2 text-sm font-semibold uppercase tracking-[0.22em] text-slate-300">{level} Risk</div>
        </div>
      </div>
    </div>
  );
}
