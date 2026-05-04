import { Info } from "lucide-react";

export default function InfoTip({ text }) {
  return (
    <span className="group relative inline-flex align-middle">
      <Info size={15} className="text-cyan-300" />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-60 -translate-x-1/2 rounded-md border border-white/10 bg-slate-950 px-3 py-2 text-xs leading-5 text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}
