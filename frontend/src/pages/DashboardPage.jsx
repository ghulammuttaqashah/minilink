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

  async function handleDelete(url) {
    if (!window.confirm(`Delete "${url.customerName || url.shortCode}"? This cannot be undone.`)) return;
    setDeleteError("");
    try {
      await apiRequest(`/api/v1/urls/${url.id}`, { method: "DELETE" }, token);
      await loadUrls();
    } catch (error) {
      setDeleteError(error.message);
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
          <LinkTable urls={urls} loading={loading} onRefresh={loadUrls} onDelete={handleDelete} />
        </section>
      )}
    </>
  );
}
