export default function StatsCards({ urls }) {
  const totalClicks = urls.reduce((sum, url) => sum + (url.clickCount || 0), 0);
  const average = urls.length ? Math.round(totalClicks / urls.length) : 0;

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <article className="rounded-2xl border border-lime-300/20 bg-lime-300/[.08] p-5">
        <span className="text-lime-300">↗</span>
        <span className="mt-6 block text-xs text-lime-100/60">Total links</span>
        <strong className="mt-1 block text-4xl tracking-[-.08em] text-white">{urls.length}</strong>
        <span className="mt-2 block text-xs text-lime-100/50">Your short link library</span>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <span className="text-orange-300">◉</span>
        <span className="mt-6 block text-xs text-slate-500">Total clicks</span>
        <strong className="mt-1 block text-4xl tracking-[-.08em] text-white">{totalClicks}</strong>
        <span className="mt-2 block text-xs text-slate-600">Across all your links</span>
      </article>
      <article className="rounded-2xl border border-white/10 bg-white/[.04] p-5">
        <span className="text-violet-300">✦</span>
        <span className="mt-6 block text-xs text-slate-500">Avg. clicks</span>
        <strong className="mt-1 block text-4xl tracking-[-.08em] text-white">{average}</strong>
        <span className="mt-2 block text-xs text-slate-600">Clicks per link</span>
      </article>
    </div>
  );
}
