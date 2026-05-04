export default function FeatureContribution({ contributions = [] }) {
  const max = Math.max(...contributions.map((item) => Math.abs(item.impact)), 0.01);

  return (
    <section className="glass-card rounded-lg p-5">
      <h2 className="text-xl font-bold text-white">What's Driving Your Risk Score</h2>
      <div className="mt-5 space-y-4">
        {contributions.map((item) => {
          const width = `${Math.max(8, (Math.abs(item.impact) / max) * 100)}%`;
          const positive = item.direction === "positive";
          return (
            <div key={`${item.feature}-${item.value}`}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-slate-200">{item.feature}</span>
                <span className="text-slate-400">Value: {item.value}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-800">
                <div
                  className={`h-3 rounded-full ${positive ? "bg-medical-red" : "bg-emerald-500"}`}
                  style={{ width }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
