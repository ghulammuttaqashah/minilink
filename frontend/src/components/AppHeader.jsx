import Brand from "./Brand";
import { Link } from "react-router-dom";

export default function AppHeader({ user, onSignIn, onSignOut }) {
  return (
    <header className="flex items-center justify-between border-b border-white/10 py-5">
      <Brand />
      {user ? (
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-lime-300 font-bold text-slate-950" aria-hidden="true">
            {user.name?.slice(0, 1).toUpperCase()}
          </div>
          <span className="hidden sm:inline">{user.name}</span>
          <Link className="rounded-lg px-3 py-2 text-slate-400 transition hover:bg-white/10 hover:text-white" to="/dashboard">
            Dashboard
          </Link>
          <button className="rounded-lg px-3 py-2 transition hover:bg-white/10 hover:text-white" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      ) : (
        <Link className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-300 transition hover:border-lime-300 hover:text-lime-300" to="/auth">
          Sign in <span aria-hidden="true">↗</span>
        </Link>
      )}
    </header>
  );
}
