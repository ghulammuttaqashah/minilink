import AppHeader from "../components/AppHeader";
import ShortenForm from "../components/ShortenForm";
import { Link } from "react-router-dom";

export default function HomePage({ user, token, onSignOut }) {
  return (
    <>
      <AppHeader user={user} onSignOut={onSignOut} />
      <section className="grid items-center gap-12 py-24 lg:grid-cols-[1.2fr_.8fr] lg:py-32">
        <div>
          <p className="mb-5 font-mono text-xs uppercase tracking-[.2em] text-lime-300">Simple links. Clear insights.</p>
          <h1 className="max-w-3xl text-6xl font-semibold leading-[.9] tracking-[-.08em] text-white sm:text-8xl">Make every link <em className="text-lime-300 not-italic">count.</em></h1>
          <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">Create memorable short links and understand how people use them. Fast, focused, and made for sharing.</p>
          <div className="mt-7 flex flex-wrap gap-4 text-sm text-slate-500"><span>✦ No clutter</span><span>✦ Built for speed</span><span>✦ Insights included</span></div>
          {!user && <Link className="mt-8 inline-flex rounded-lg border border-lime-300/30 px-4 py-3 text-sm text-lime-300 transition hover:bg-lime-300/10" to="/auth">Create your workspace →</Link>}
        </div>
        <div className="relative mx-auto hidden aspect-square w-full max-w-sm place-items-center rounded-full border border-lime-300/20 bg-lime-300/[.03] lg:grid" aria-hidden="true"><div className="absolute inset-8 rounded-full border border-white/10" /><div className="absolute inset-20 rounded-full border border-lime-300/20" /><span className="text-8xl text-lime-300">↗</span></div>
      </section>
      <section><ShortenForm token={token} /></section>
    </>
  );
}
