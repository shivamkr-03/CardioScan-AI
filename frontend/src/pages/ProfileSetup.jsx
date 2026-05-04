import { Camera, HeartPulse } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const conditions = ["Diabetes", "Hypertension", "Obesity", "Family history of heart disease", "Smoker"];

export default function ProfileSetup() {
  const { saveProfile } = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState("");
  const [selected, setSelected] = useState([]);

  const upload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const toggle = (condition) => {
    setSelected((items) => items.includes(condition) ? items.filter((item) => item !== condition) : [...items, condition]);
  };

  const finish = async () => {
    await saveProfile({ avatar_url: avatar || null, medical_background: selected });
    navigate("/assessment");
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8">
      <div className="glass-card rounded-lg p-8 text-center">
        <HeartPulse className="mx-auto text-red-300" size={42} />
        <h1 className="mt-4 text-3xl font-extrabold">Let's personalize your experience</h1>
        <p className="mt-3 text-slate-300">These details are optional and help pre-fill relevant assessment defaults later.</p>
        <label className="mx-auto mt-8 grid h-28 w-28 cursor-pointer place-items-center rounded-full border border-cyan-400/30 bg-slate-950/50">
          {avatar ? <img src={avatar} alt="" className="h-full w-full rounded-full object-cover" /> : <Camera className="text-cyan-300" />}
          <input type="file" accept="image/*" className="hidden" onChange={upload} />
        </label>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {conditions.map((condition) => (
            <button key={condition} type="button" className={`rounded-lg border p-3 text-left ${selected.includes(condition) ? "border-cyan-300 bg-cyan-400/10" : "border-white/10 bg-slate-950/40"}`} onClick={() => toggle(condition)}>
              {condition}
            </button>
          ))}
        </div>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button className="rounded-lg border border-white/10 px-5 py-3 font-semibold text-slate-200" onClick={() => navigate("/assessment")}>Skip for now</button>
          <button className="rounded-lg bg-medical-red px-5 py-3 font-semibold text-white shadow-redglow" onClick={finish}>Save and continue</button>
        </div>
      </div>
    </div>
  );
}
