import { Download, FileText, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";
import { createNote, deleteAssessment, deleteNote, generateReport, getHistory, getNotes } from "../lib/api.js";

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function History() {
  const [data, setData] = useState({ assessments: [], summary: {} });
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [noteText, setNoteText] = useState("");
  const [linkedAssessment, setLinkedAssessment] = useState("");
  const [downloading, setDownloading] = useState(null);

  const load = async () => {
    setLoading(true);
    const [history, noteRows] = await Promise.all([getHistory(), getNotes()]);
    setData(history);
    setNotes(noteRows);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const chart = useMemo(() => [...data.assessments].reverse().map((item) => ({ ...item, date: new Date(item.timestamp).toLocaleDateString(), risk: Math.round(item.probability * 100) })), [data.assessments]);
  const compareItems = selected.map((id) => data.assessments.find((item) => item.id === id)).filter(Boolean);

  const report = async (assessmentId) => {
    setDownloading(assessmentId);
    toast.loading("Generating your PDF report...", { id: "pdf" });
    try {
      const blob = await generateReport({ assessment_id: assessmentId });
      downloadBlob(blob, `cardioscan-report-${assessmentId}.pdf`);
      toast.success("Report downloaded", { id: "pdf" });
    } finally {
      setDownloading(null);
    }
  };

  const removeAssessment = async (id) => {
    if (!window.confirm("Delete this assessment?")) return;
    await deleteAssessment(id);
    toast.success("Assessment deleted");
    load();
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    const note = await createNote({ note_text: noteText, assessment_id: linkedAssessment ? Number(linkedAssessment) : null });
    setNotes((items) => [note, ...items]);
    setNoteText("");
    toast.success("Note saved");
  };

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="glass-card animate-pulse rounded-lg p-10 text-slate-300">Loading your history...</div></div>;
  }

  if (!data.assessments.length) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-cyan-400/10 text-cyan-300"><FileText size={42} /></div>
        <h1 className="mt-6 text-3xl font-extrabold">No assessments yet</h1>
        <p className="mt-3 text-slate-300">Take your first risk assessment to start tracking your heart health.</p>
        <Link className="mt-6 inline-block rounded-lg bg-medical-red px-5 py-3 font-semibold text-white" to="/assessment">Take Assessment</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold">Assessment History</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        <div className="glass-card rounded-lg p-4"><div className="text-2xl font-bold">{data.summary.total}</div><div className="text-sm text-slate-400">Total Assessments</div></div>
        <div className="glass-card rounded-lg p-4"><div className="text-2xl font-bold">{data.summary.average_risk}%</div><div className="text-sm text-slate-400">Average Risk</div></div>
        <div className="glass-card rounded-lg p-4"><div className="text-2xl font-bold">{Math.round(data.summary.lowest.probability * 100)}%</div><div className="text-sm text-slate-400">Lowest Risk</div></div>
        <div className="glass-card rounded-lg p-4"><div className="text-2xl font-bold">{Math.round(data.summary.highest.probability * 100)}%</div><div className="text-sm text-slate-400">Highest Risk</div></div>
      </div>

      <section className="glass-card mt-6 rounded-lg p-5">
        <h2 className="text-xl font-bold">Risk Trend</h2>
        <div className="mt-4 h-80">
          {chart.length > 1 ? (
            <ResponsiveContainer>
              <AreaChart data={chart}>
                <defs><linearGradient id="historyRisk" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#e63946" stopOpacity={0.5} /><stop offset="95%" stopColor="#06b6d4" stopOpacity={0.08} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #334155" }} />
                <Area dataKey="risk" stroke="#e63946" fill="url(#historyRisk)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <div className="grid h-full place-items-center text-slate-400">Take more assessments to see your trend.</div>}
        </div>
      </section>

      <section className="glass-card mt-6 overflow-x-auto rounded-lg p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Assessment History Table</h2>
          {selected.length === 2 && <button className="rounded-lg bg-cyan-400 px-4 py-2 font-semibold text-slate-950">Compare Selected</button>}
        </div>
        <table className="w-full min-w-[850px] text-sm">
          <thead className="text-left text-slate-400"><tr><th>Date</th><th>Risk Score</th><th>Risk Level</th><th>Top Risk Factor</th><th>Compare</th><th>Actions</th></tr></thead>
          <tbody>
            {data.assessments.map((item) => (
              <tr key={item.id} className="border-t border-white/10">
                <td className="py-4">{new Date(item.timestamp).toLocaleString()}</td>
                <td><div className="h-2 w-36 rounded-full bg-slate-800"><div className="h-2 rounded-full bg-medical-red" style={{ width: `${Math.round(item.probability * 100)}%` }} /></div><span>{Math.round(item.probability * 100)}%</span></td>
                <td><span className="rounded-full bg-cyan-400/10 px-3 py-1 text-cyan-200">{item.risk_level}</span></td>
                <td>{item.top_risk_factor}</td>
                <td><input type="checkbox" checked={selected.includes(item.id)} onChange={(event) => setSelected((ids) => event.target.checked ? [...ids, item.id].slice(-2) : ids.filter((id) => id !== item.id))} /></td>
                <td className="flex gap-2 py-3">
                  <Link className="rounded-md border border-white/10 px-3 py-2" to="/results" state={{ result: item, patient: item }}>View Details</Link>
                  <button title="Download PDF" className="rounded-md border border-white/10 p-2" onClick={() => report(item.id)} disabled={downloading === item.id}><Download size={16} /></button>
                  <button title="Delete" className="rounded-md border border-red-400/30 p-2 text-red-200" onClick={() => removeAssessment(item.id)}><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="glass-card mt-6 rounded-lg p-5">
        <h2 className="text-xl font-bold">Health Notes</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_260px_auto]">
          <textarea className="medical-input min-h-24" placeholder="Add a note for today..." value={noteText} onChange={(event) => setNoteText(event.target.value)} />
          <select className="medical-input" value={linkedAssessment} onChange={(event) => setLinkedAssessment(event.target.value)}>
            <option value="">No linked assessment</option>
            {data.assessments.map((item) => <option key={item.id} value={item.id}>Link to assessment from {new Date(item.timestamp).toLocaleDateString()}</option>)}
          </select>
          <button className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950" onClick={addNote}>Add Note</button>
        </div>
        {!notes.length && (
          <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/35 p-4 text-slate-400">
            Start journaling your health journey. Small notes, big insights.
            <div className="mt-3 grid gap-2 text-sm">
              <span>Example: Started daily 30-min walks</span>
              <span>Example: Reduced salt intake this week</span>
              <span>Example: Visited cardiologist - all clear</span>
            </div>
          </div>
        )}
        <div className="mt-5 grid gap-3">
          {notes.map((note) => (
            <article key={note.id} className="group flex items-start justify-between gap-3 rounded-lg border border-white/10 bg-slate-950/45 p-4">
              <div><div className="text-xs text-slate-500">{new Date(note.created_at).toLocaleString()}</div><p className="mt-2 text-slate-200">{note.note_text}</p></div>
              <button className="opacity-40 hover:opacity-100" onClick={async () => { await deleteNote(note.id); setNotes((items) => items.filter((item) => item.id !== note.id)); }}><X size={18} /></button>
            </article>
          ))}
        </div>
      </section>

      {compareItems.length === 2 && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/70 p-4">
          <div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-lg bg-[#111827] p-6">
            <div className="flex justify-between"><h2 className="text-2xl font-bold">Assessment Comparison</h2><button onClick={() => setSelected([])}><X /></button></div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {compareItems.map((item) => (
                <div key={item.id} className="rounded-lg border border-white/10 p-4">
                  <h3 className="font-bold">{new Date(item.timestamp).toLocaleString()}</h3>
                  <p className="mt-2 text-2xl font-extrabold">{Math.round(item.probability * 100)}%</p>
                  {["age", "trestbps", "chol", "thalach", "oldpeak", "ca"].map((key) => <div key={key} className="mt-2 text-sm text-slate-300">{key}: {item[key]}</div>)}
                </div>
              ))}
            </div>
            <p className="mt-5 text-cyan-200">Risk changed by {Math.abs(Math.round((compareItems[0].probability - compareItems[1].probability) * 100))}%.</p>
          </div>
        </div>
      )}
    </div>
  );
}
