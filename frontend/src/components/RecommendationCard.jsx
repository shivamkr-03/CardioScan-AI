import { CheckCircle2 } from "lucide-react";

export default function RecommendationCard({ title, body }) {
  return (
    <article className="glass-card rounded-lg p-5">
      <div className="flex gap-3">
        <span className="mt-1 text-cyan-300">
          <CheckCircle2 size={20} />
        </span>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
        </div>
      </div>
    </article>
  );
}
