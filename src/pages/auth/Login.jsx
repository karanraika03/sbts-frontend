import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ArrowRight,
  Wrench,
  MessageCircle,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

const features = [
  { icon: Wrench, text: "Track every repair job from received to ready" },
  { icon: MessageCircle, text: "Send WhatsApp updates and pickup reminders" },
  { icon: BarChart3, text: "See revenue, customers and parts in one place" },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ id: "", password: "" });
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id.trim() || !form.password) {
      setError("Phone/email aur password dono daalo.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }
    setLoading(true);
    try {
      // TODO: yaha apni real API call lagana
      await new Promise((r) => setTimeout(r, 900));

      login(form.id, remember);
      navigate("/", { replace: true });
    } catch {
      setError("Login fail ho gaya. Dobara try karo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#faf9fd]">
      {/* Left branding panel */}
      <div className="relative hidden w-[46%] overflow-hidden bg-gradient-to-br from-violet-600 via-violet-600 to-indigo-500 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-40 right-10 h-32 w-32 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-sm font-extrabold text-violet-700">
            SB
          </div>
          <div>
            <p className="text-base font-extrabold leading-tight">
              Shree Bhanu
            </p>
            <p className="text-xs text-violet-200">Technical Solutions</p>
          </div>
        </div>

        <div className="relative">
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight">
            Your repair shop,
            <br />
            sorted and simple.
          </h1>
          <p className="mt-4 max-w-md text-sm text-violet-100">
            Jobs, customers, parts and WhatsApp updates, sab ek dashboard me.
          </p>
          <div className="mt-8 space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-3 text-sm text-violet-50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                  <Icon size={18} />
                </div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-violet-200">
          © {new Date().getFullYear()} Shree Bhanu Technical Solutions, Hisar
        </p>
      </div>

      {/* Right form */}
      <div className="flex flex-1 items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white">
              SB
            </div>
            <div>
              <p className="text-sm font-extrabold leading-tight text-slate-900">
                Shree Bhanu
              </p>
              <p className="text-xs text-slate-500">Technical Solutions</p>
            </div>
          </div>

          <div className="rounded-[28px] border border-violet-100/80 bg-white p-6 shadow-xl shadow-violet-100/60 sm:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[1.5px] text-violet-500">
              WELCOME BACK
            </p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-[30px]">
              Sign in
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Enter credentials to manage repair queue
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Phone or email
                </label>
                <div className="flex items-center gap-3 rounded-full border border-violet-100 bg-white px-4 py-3 transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                  <User size={17} className="text-slate-400" />
                  <input
                    name="id"
                    value={form.id}
                    onChange={onChange}
                    autoComplete="username"
                    placeholder="Enter phone or email"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Password
                </label>
                <div className="flex items-center gap-3 rounded-full border border-violet-100 bg-white px-4 py-3 transition focus-within:border-violet-400 focus-within:ring-4 focus-within:ring-violet-100">
                  <Lock size={17} className="text-slate-400" />
                  <input
                    name="password"
                    type={show ? "text" : "password"}
                    value={form.password}
                    onChange={onChange}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    className="text-slate-400 transition hover:text-violet-600"
                    aria-label={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 accent-violet-600"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="font-bold text-violet-600 hover:text-violet-800"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-violet-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:-translate-y-0.5 hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    Sign in <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            Trouble logging in? Shop admin se contact karo.
          </p>
        </div>
      </div>
    </div>
  );
}
