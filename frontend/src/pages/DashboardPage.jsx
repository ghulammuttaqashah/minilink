import { useCallback, useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import LinkTable from "../components/LinkTable";
import ShortenForm from "../components/ShortenForm";
import StatsCards from "../components/StatsCards";
import LoadingSpinner from "../components/LoadingSpinner";
import { apiRequest } from "../api/client";

export default function DashboardPage({ user, token, onSignOut }) {
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteError, setDeleteError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteError("");
    setDeleting(true);
    try {
      await apiRequest(`/api/v1/urls/${deleteTarget.id}`, { method: "DELETE" }, token);
      setDeleteTarget(null);
      await loadUrls();
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleting(false);
    }
  }

  const loadUrls = useCallback(async () => {
    setLoading(true);
    try {
      setUrls(await apiRequest("/api/v1/urls/mine", {}, token));
    } catch (error) {
      if (error.message.toLowerCase().includes("token")) onSignOut();
    } finally {
      setLoading(false);
    }
  }, [token, onSignOut]);

  useEffect(() => {
    loadUrls();
  }, [loadUrls]);

  return (
    <>
      <AppHeader user={user} onSignOut={onSignOut} />
      <section className="flex flex-col justify-between gap-6 py-16 sm:flex-row sm:items-end">
        <div><p className="mb-4 font-mono text-xs font-bold uppercase tracking-[.2em] text-lime-300">Your workspace</p><h1 className="text-5xl font-bold tracking-[-.07em] text-white sm:text-7xl">Good to see you, <em className="text-lime-300 not-italic">{user.name.split(" ")[0]}.</em></h1><p className="mt-5 text-base font-medium text-slate-300">Create, share, and keep an eye on every link.</p></div>
        <div className="w-fit rounded-full border border-lime-300/20 bg-lime-300/10 px-4 py-2 text-xs font-bold text-lime-300">● Live dashboard</div>
      </section>
      {loading && urls.length === 0 ? (
        <div className="flex min-h-64 items-center justify-center"><LoadingSpinner label="Loading your links" /></div>
      ) : (
        <section className="grid gap-6">
          <StatsCards urls={urls} />
          <ShortenForm token={token} onCreated={loadUrls} />
          {deleteError && <p className="rounded-lg border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-200">{deleteError}</p>}
          <LinkTable urls={urls} loading={loading} onRefresh={loadUrls} onDelete={setDeleteTarget} />
        </section>
      )}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !deleting) setDeleteTarget(null);
        }}>
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl shadow-black/50" role="dialog" aria-modal="true" aria-labelledby="delete-dialog-title">
            <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-rose-400/10 text-xl text-rose-300">!</div>
            <h2 id="delete-dialog-title" className="text-xl font-bold text-white">Delete this short link?</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">This will permanently remove the link and its click count. Anyone using the short URL will no longer be redirected.</p>
            <div className="mt-4 rounded-lg border border-white/10 bg-black/20 px-4 py-3">
              <p className="font-mono text-sm font-bold text-lime-300">{deleteTarget.shortCode}</p>
              {deleteTarget.customerName && <p className="mt-1 text-xs font-medium text-slate-400">{deleteTarget.customerName}</p>}
            </div>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/10 disabled:opacity-50" onClick={() => setDeleteTarget(null)} disabled={deleting}>Keep link</button>
              <button type="button" className="flex items-center justify-center gap-2 rounded-lg bg-rose-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-rose-300 disabled:cursor-wait disabled:opacity-60" onClick={handleDelete} disabled={deleting}>
                {deleting ? <><LoadingSpinner size="sm" /> Deleting...</> : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
