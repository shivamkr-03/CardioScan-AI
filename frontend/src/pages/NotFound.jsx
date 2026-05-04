import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto grid min-h-[70vh] max-w-3xl place-items-center px-4 text-center">
      <div>
        <svg viewBox="0 0 640 140" className="mx-auto h-32 w-full">
          <path d="M0 70 H210 L245 70 L260 25 L285 115 L310 70 H640" fill="none" stroke="#e63946" strokeDasharray="900" strokeWidth="5" className="animate-ecg" />
        </svg>
        <h1 className="text-5xl font-extrabold">Signal Lost</h1>
        <p className="mt-4 text-slate-300">The page you requested is not transmitting.</p>
        <Link className="mt-6 inline-block rounded-lg bg-medical-red px-5 py-3 font-semibold text-white shadow-redglow" to="/">Go Home</Link>
      </div>
    </div>
  );
}
