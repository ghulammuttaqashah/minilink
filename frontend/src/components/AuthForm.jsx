import { useState } from "react";
import { apiRequest } from "../api/client";
import LoadingSpinner from "./LoadingSpinner";
import Notice from "./Notice";

const passwordChecks = [
  { key: "length", label: "8+ characters", test: (password) => password.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { key: "lowercase", label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { key: "number", label: "One number", test: (password) => /\d/.test(password) },
];

export default function AuthForm({ mode, onModeChange, onAuthenticated }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isRegistering = mode === "register";
  const completedChecks = passwordChecks.filter(({ test }) => test(form.password)).length;
  const passwordIsValid = completedChecks === passwordChecks.length;

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    if (isRegistering && !passwordIsValid) {
      setError("Complete all password requirements before creating your account.");
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest(`/api/v1/auth/${mode}`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuthenticated(data);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <Notice message={error} />
      {mode === "register" && (
        <label className="grid gap-2 text-xs text-slate-400">Full name<input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-lime-300" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Alex Morgan" required /></label>
      )}
      <label className="grid gap-2 text-xs text-slate-400">Email address<input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-lime-300" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" required /></label>
      <label className="grid gap-2 text-xs text-slate-400">
        <span className="flex items-center justify-between">
          <span>Password</span>
          {isRegistering && <span className={passwordIsValid ? "text-lime-300" : "text-slate-500"}>{form.password.length}/8 minimum</span>}
        </span>
        <input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-lime-300" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder={isRegistering ? "Create a strong password" : "Your password"} required />
      </label>
      {isRegistering && (
        <div className="rounded-lg border border-white/10 bg-black/10 p-3" aria-live="polite">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">Password strength</span>
            <span className={passwordIsValid ? "text-lime-300" : "text-slate-500"}>{completedChecks}/{passwordChecks.length} complete</span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-lime-300 transition-all duration-300" style={{ width: `${(completedChecks / passwordChecks.length) * 100}%` }} />
          </div>
          <ul className="grid gap-1.5 text-xs sm:grid-cols-2">
            {passwordChecks.map(({ key, label, test }) => {
              const complete = test(form.password);
              return <li className={complete ? "text-lime-300" : "text-slate-500"} key={key}>{complete ? "✓" : "○"} {label}</li>;
            })}
          </ul>
        </div>
      )}
      <button className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-lime-300 font-semibold text-slate-950 transition hover:bg-lime-200 disabled:opacity-60" disabled={loading}>
        {loading ? <><LoadingSpinner size="sm" /> Please wait...</> : mode === "login" ? "Sign in" : "Create account"}
      </button>
      <button type="button" className="text-sm text-lime-300 hover:text-lime-200" onClick={() => { setError(""); onModeChange(mode === "login" ? "register" : "login"); }}>
        {mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </form>
  );
}
