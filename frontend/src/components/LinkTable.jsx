import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function LinkTable({ urls, loading, onRefresh, onDelete }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const maxClicks = Math.max(...urls.map((url) => url.clickCount || 0), 1);
  const filteredUrls = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const results = urls.filter((url) => {
      const searchableFields = [
        url.shortCode,
        url.originalUrl,
        url.customerName,
      ].filter(Boolean).map((value) => value.toLowerCase());
      const matchesQuery = !normalizedQuery || searchableFields.some((value) => value.includes(normalizedQuery));
      const clicks = url.clickCount || 0;
      const matchesFilter =
        filter === "all" ||
        (filter === "clicked" && clicks > 0) ||
        (filter === "not-clicked" && clicks === 0) ||
        (filter === "named" && Boolean(url.customerName)) ||
        (filter === "unnamed" && !url.customerName);
      return matchesQuery && matchesFilter;
    });

    return [...results].sort((a, b) => {
      if (sort === "clicks") return (b.clickCount || 0) - (a.clickCount || 0);
      if (sort === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }, [filter, query, sort, urls]);

  return (
    <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.04]">
      <div className="flex flex-col gap-5 border-b border-white/10 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="mb-3 font-mono text-xs uppercase tracking-[.2em] text-lime-300">Your library</p>
            <h2 className="text-2xl font-bold tracking-tight text-white">Your links</h2>
          </div>
          <button className="rounded-lg px-3 py-2 text-sm text-slate-400 transition hover:bg-white/10 hover:text-white" onClick={onRefresh} disabled={loading}>
            {loading ? <LoadingDots /> : "Refresh"}
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
          <label>
            <span className="sr-only">Search links</span>
            <input className="w-full rounded-lg border border-white/10 bg-black/10 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-600 focus:border-lime-300" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code, customer, or destination..." />
          </label>
          <label>
            <span className="sr-only">Filter links</span>
            <select className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-300 sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="all">All links</option>
              <option value="clicked">With clicks</option>
              <option value="not-clicked">No clicks yet</option>
              <option value="named">With customer name</option>
              <option value="unnamed">Without customer name</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort links</span>
            <select className="w-full rounded-lg border border-white/10 bg-slate-950 px-4 py-2.5 text-sm text-slate-300 outline-none focus:border-lime-300 sm:w-auto" value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="recent">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="clicks">Most clicks</option>
            </select>
          </label>
        </div>
        <p className="text-xs text-slate-600" aria-live="polite">
          Showing {filteredUrls.length} of {urls.length} {urls.length === 1 ? "link" : "links"}
        </p>
      </div>
      {loading ? (
        <div className="flex min-h-48 items-center justify-center"><LoadingDots label="Loading links" /></div>
      ) : urls.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-sm text-slate-500">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-lime-300/10 text-xl text-lime-300">↗</span>
          <strong className="text-white">No links yet</strong>
          <span>Create your first short link above to see it here.</span>
        </div>
      ) : filteredUrls.length === 0 ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 px-5 text-center text-sm text-slate-500">
          <strong className="text-white">No matching links</strong>
          <span>Try a different search term or filter.</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_.8fr_.45fr_.6fr] gap-4 border-b border-white/10 px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:px-7">
            <span>Short link</span><span>Destination</span><span>Created</span><span>Activity</span><span>Clicks</span><span>Actions</span>
          </div>
          {filteredUrls.map((url) => (
            <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_.8fr_.45fr_.6fr] items-center gap-4 border-b border-white/5 px-5 py-5 text-sm sm:px-7" key={url.id}>
              <a className="flex items-center gap-2 font-mono text-lime-300 hover:text-lime-200" href={url.shortUrl} target="_blank" rel="noreferrer">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                <span>
                  {url.shortCode}
                  {url.customerName && <small className="mt-1 block max-w-32 truncate font-sans text-[10px] text-slate-500" title={url.customerName}>{url.customerName}</small>}
                </span>
              </a>
              <span className="truncate font-medium text-slate-300" title={url.originalUrl}>{url.originalUrl}</span>
              <span className="font-medium text-slate-400">{formatDate(url.createdAt)}</span>
              <div className="grid gap-1.5" title={`${url.clickCount || 0} clicks relative to your most clicked link`}>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-lime-300 transition-all" style={{ width: `${((url.clickCount || 0) / maxClicks) * 100}%` }} /></div>
                <span className="text-[10px] text-slate-600">relative activity</span>
              </div>
              <strong className="text-right font-bold text-white">{url.clickCount || 0}</strong>
              <button type="button" className="rounded-md border border-rose-300/20 px-2 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-50" onClick={() => onDelete?.(url)} aria-label={`Delete ${url.shortCode}`}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LoadingDots({ label = "Refreshing" }) {
  return <span className="flex gap-1" role="status" aria-label={label}><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300 [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300 [animation-delay:300ms]" /></span>;
}
