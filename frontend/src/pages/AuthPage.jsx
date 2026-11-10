import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import AuthForm from "../components/AuthForm";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const [mode, setMode] = useState("login");
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleAuthenticated(data) {
    signIn(data);
    navigate(location.state?.from?.pathname || "/dashboard", { replace: true });
  }

  return (
    <>
      <AppHeader />
      <section className="grid min-h-[650px] items-center gap-16 py-12 sm:py-16 lg:grid-cols-[1fr_420px]">
        <div>
          <p className="mb-6 font-mono text-xs font-bold uppercase tracking-[.2em] text-lime-300">Your links, your data</p>
          <h1 className="max-w-xl text-6xl font-bold leading-[.95] tracking-[-.08em] text-white sm:text-8xl">{mode === "login" ? "Welcome back." : "Start making links count."}</h1>
          <p className="mt-8 max-w-lg text-lg font-medium leading-8 text-slate-300">{mode === "login" ? "Sign in to pick up where you left off." : "Create a free workspace to track every click."}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <p className="mb-3 font-mono text-xs font-bold uppercase tracking-[.2em] text-lime-300">{mode === "login" ? "Sign in" : "Create account"}</p>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-white">{mode === "login" ? "Access your workspace" : "Build your link library"}</h2>
          <AuthForm mode={mode} onModeChange={setMode} onAuthenticated={handleAuthenticated} />
        </div>
      </section>
    </>
  );
}
