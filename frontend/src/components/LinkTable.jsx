import { useMemo, useState } from "react";

function formatDate(value) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
}

export default function LinkTable({ urls, loading, onRefresh, onDelete }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [selectedActivity, setSelectedActivity] = useState(null);
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
        <LinkTableSkeleton />
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
          <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_1.1fr_.45fr_.6fr] gap-4 border-b border-white/10 px-5 py-4 font-mono text-[10px] font-bold uppercase tracking-widest text-slate-400 sm:px-7">
            <span>Short link</span><span>Destination</span><span>Created</span><span>Activity</span><span>Clicks</span><span>Actions</span>
          </div>
          {filteredUrls.map((url) => (
            <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_1.1fr_.45fr_.6fr] items-center gap-4 border-b border-white/5 px-5 py-5 text-sm sm:px-7" key={url.id}>
              <a className="flex items-center gap-2 font-mono text-lime-300 hover:text-lime-200" href={url.shortUrl} target="_blank" rel="noreferrer">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-300" />
                <span>
                  {url.shortCode}
                  {url.customerName && <small className="mt-1 block max-w-32 truncate font-sans text-[10px] text-slate-500" title={url.customerName}>{url.customerName}</small>}
                </span>
              </a>
              <span className="truncate font-medium text-slate-300" title={url.originalUrl}>{url.originalUrl}</span>
              <span className="font-medium text-slate-400">{formatDate(url.createdAt)}</span>
              <ActivityGraph
                clickHistory={url.clickHistory}
                clickCount={url.clickCount || 0}
                onOpen={() => setSelectedActivity(url)}
              />
              <strong className="text-right font-bold text-white">{url.clickCount || 0}</strong>
              <button type="button" className="rounded-md border border-rose-300/20 px-2 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-300/10 disabled:opacity-50" onClick={() => onDelete?.(url)} aria-label={`Delete ${url.shortCode}`}>Delete</button>
            </div>
          ))}
        </div>
      )}
      {selectedActivity && (
        <ActivityDetails
          url={selectedActivity}
          onClose={() => setSelectedActivity(null)}
        />
      )}
    </section>
  );
}

function getDailyActivity(clickHistory = []) {
  const now = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    return {
      date,
      count: clickHistory.filter((value) => {
        const timestamp = new Date(value);
        return timestamp >= date && timestamp < nextDay;
      }).length,
    };
  });
}

function ActivityGraph({ clickHistory = [], clickCount, onOpen }) {
  const dailyActivity = getDailyActivity(clickHistory);
  const dailyCounts = dailyActivity.map(({ count }) => count);
  const hasHistory = dailyCounts.some((count) => count > 0);
  const max = Math.max(...dailyCounts, 1);
  const points = dailyCounts.map((count, index) => {
    const x = 4 + (index * 92) / 6;
    const y = 30 - (count / max) * 24;
    return `${x},${y}`;
  }).join(" ");

  return (
    <button
      type="button"
      className="group min-w-0 text-left"
      onClick={onOpen}
      title="Open detailed activity"
      aria-label={`View detailed activity for ${clickCount} clicks`}
    >
      {hasHistory ? (
        <svg className="h-10 w-full min-w-28 overflow-visible" viewBox="0 0 100 34" preserveAspectRatio="none" role="img" aria-label={`${clickCount} total clicks over the last 7 days`}>
          <line x1="4" y1="30" x2="96" y2="30" stroke="currentColor" strokeOpacity=".2" vectorEffect="non-scaling-stroke" />
          <polyline points={points} fill="none" stroke="#bef264" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {dailyCounts.map((count, index) => {
            const [x, y] = points.split(" ")[index].split(",");
            return <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="#bef264" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      ) : (
        <div className="flex h-10 items-center text-[10px] font-medium text-slate-500">No activity yet</div>
      )}
      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 transition group-hover:text-lime-300">
        last 7 days <span aria-hidden="true">↗</span>
      </span>
    </button>
  );
}

function ActivityDetails({ url, onClose }) {
  const dailyActivity = getDailyActivity(url.clickHistory || []);
  const recentClicks = dailyActivity.reduce((sum, day) => sum + day.count, 0);
  const max = Math.max(...dailyActivity.map(({ count }) => count), 1);
  const dateFormatter = new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-black/50 sm:p-7" role="dialog" aria-modal="true" aria-labelledby="activity-dialog-title">
        <div className="flex items-start justify-between gap-5">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-[.2em] text-lime-300">Link analytics</p>
            <h2 id="activity-dialog-title" className="mt-2 truncate text-2xl font-bold text-white">{url.customerName || url.shortCode}</h2>
            <p className="mt-1 truncate font-mono text-xs text-slate-400">{url.shortUrl}</p>
          </div>
          <button type="button" className="rounded-lg px-3 py-2 text-xl leading-none text-slate-400 hover:bg-white/10 hover:text-white" onClick={onClose} aria-label="Close activity details">×</button>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-lime-300/20 bg-lime-300/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-lime-100/70">All-time clicks</p>
            <strong className="mt-1 block text-3xl font-bold text-white">{url.clickCount || 0}</strong>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/10 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Last 7 days</p>
            <strong className="mt-1 block text-3xl font-bold text-white">{recentClicks}</strong>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-white/10 bg-black/10 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="font-bold text-white">Daily click activity</h3>
            <span className="text-xs font-medium text-slate-500">Last 7 days</span>
          </div>
          <div className="grid h-48 grid-cols-7 items-end gap-2 sm:gap-4">
            {dailyActivity.map(({ date, count }) => (
              <div className="flex h-full flex-col items-center justify-end gap-2" key={date.toISOString()}>
                <span className="text-xs font-bold text-lime-300">{count}</span>
                <div className="flex h-32 w-full items-end rounded-t-md bg-white/5">
                  <div className="w-full rounded-t-md bg-lime-300 transition-all" style={{ height: `${count ? Math.max((count / max) * 100, 8) : 0}%` }} />
                </div>
                <span className="text-center text-[10px] font-medium text-slate-500">{dateFormatter.format(date)}</span>
              </div>
            ))}
          </div>
        </div>
        <button type="button" className="mt-6 w-full rounded-lg border border-white/10 px-4 py-3 text-sm font-bold text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onClose}>Close details</button>
      </div>
    </div>
  );
}

function LoadingDots({ label = "Refreshing" }) {
  return <span className="flex gap-1" role="status" aria-label={label}><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300 [animation-delay:150ms]" /><i className="h-1.5 w-1.5 animate-bounce rounded-full bg-lime-300 [animation-delay:300ms]" /></span>;
}

function LinkTableSkeleton() {
  return (
    <div className="overflow-x-auto" role="status" aria-label="Loading links">
      <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_1.1fr_.45fr_.6fr] gap-4 border-b border-white/10 px-5 py-4 sm:px-7">
        {["w-20", "w-24", "w-16", "w-20", "w-12", "w-14"].map((width, index) => (
          <SkeletonBlock className={`h-2.5 ${width}`} key={`${width}-${index}`} />
        ))}
      </div>
      <div className="divide-y divide-white/5">
        {[1, 2, 3, 4].map((row) => (
          <div className="grid min-w-[900px] grid-cols-[1.1fr_1.5fr_1fr_1.1fr_.45fr_.6fr] items-center gap-4 px-5 py-5 sm:px-7" key={row}>
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-2 w-2 rounded-full" />
              <div className="grid gap-2">
                <SkeletonBlock className="h-3 w-24" />
                <SkeletonBlock className="h-2 w-16" />
              </div>
            </div>
            <SkeletonBlock className="h-3 w-11/12" />
            <SkeletonBlock className="h-3 w-20" />
            <div className="grid gap-2">
              <SkeletonBlock className="h-8 w-full rounded-md" />
              <SkeletonBlock className="h-2 w-16" />
            </div>
            <SkeletonBlock className="ml-auto h-3 w-6" />
            <SkeletonBlock className="h-7 w-14 rounded-md" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading your links</span>
    </div>
  );
}

function SkeletonBlock({ className }) {
  return <span className={`skeleton-shimmer block rounded bg-white/10 ${className}`} aria-hidden="true" />;
}
