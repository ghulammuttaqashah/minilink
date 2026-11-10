import { useState } from "react";
import { apiRequest } from "../api/client";
import LoadingSpinner from "./LoadingSpinner";
import Notice from "./Notice";

export default function ShortenForm({ token, onCreated }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState({ message: "", type: "error" });
  const [createdLink, setCreatedLink] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    setNotice({ message: "", type: "error" });
    setLoading(true);

    try {
      const anonymousOwnerToken = token ? null : localStorage.getItem("anonymous_owner_token");
      const { shortUrl, ownershipToken } = await apiRequest(
        "/api/v1/urls",
        { method: "POST", body: JSON.stringify({ originalUrl, customerName, customCode }), headers: anonymousOwnerToken ? { "X-Anonymous-Owner-Token": anonymousOwnerToken } : {} },
        token,
      );
      if (!token && ownershipToken) localStorage.setItem("anonymous_owner_token", ownershipToken);
      setOriginalUrl("");
      setCustomerName("");
      setCustomCode("");
      setCreatedLink(shortUrl);
      setNotice({ message: "Your short link is ready.", type: "success" });
      onCreated?.();
      try {
        await navigator.clipboard?.writeText(shortUrl);
      } catch {
        // Clipboard permissions vary by browser; link creation already succeeded.
      }
    } catch (error) {
      setNotice({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.04] p-5 shadow-2xl shadow-black/20 sm:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-3 font-mono text-xs uppercase tracking-[.2em] text-lime-300">Create a new link</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white">Turn long into memorable.</h2>
        </div>
        <span className="text-2xl text-lime-300" aria-hidden="true">✦</span>
      </div>
      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="original-url">Long URL</label>
        <input
          id="original-url"
          type="url"
          placeholder="Paste your long URL here..."
          value={originalUrl}
          onChange={(event) => setOriginalUrl(event.target.value)}
          required
        />
        <button         className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-lime-300 px-5 font-semibold text-slate-950 transition hover:bg-lime-200 disabled:cursor-wait disabled:opacity-60" disabled={loading}>
          {loading ? <><LoadingSpinner size="sm" /> Creating...</> : <>Shorten link <span>→</span></>}
        </button>
      </form>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-2 text-xs text-slate-400">Customer or campaign name<input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-slate-600 focus:border-lime-300" value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Acme launch" maxLength="100" /></label>
        <label className="grid gap-2 text-xs text-slate-400">Custom short code<input className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 font-mono text-white outline-none placeholder:text-slate-600 focus:border-lime-300" value={customCode} onChange={(event) => setCustomCode(event.target.value)} placeholder="e.g. acme-launch" pattern="[a-zA-Z0-9_-]{3,32}" maxLength="32" /></label>
      </div>
      <Notice message={notice.message} type={notice.type} />
      {createdLink && (
        <div className="mt-5 flex flex-col gap-3 rounded-xl border border-lime-300/20 bg-lime-300/[.07] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] uppercase tracking-[.2em] text-lime-300">Your short link</p>
            <a className="block truncate font-mono text-sm text-white hover:text-lime-200" href={createdLink} target="_blank" rel="noreferrer">{createdLink}</a>
          </div>
          <div className="flex shrink-0 gap-2">
            <button type="button" className="rounded-lg border border-lime-300/30 px-3 py-2 text-xs text-lime-200 hover:bg-lime-300/10" onClick={() => navigator.clipboard?.writeText(createdLink)}>Copy</button>
            <a className="rounded-lg bg-lime-300 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-lime-200" href={createdLink} target="_blank" rel="noreferrer">Open ↗</a>
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-600">Press enter to create · Your link will be copied automatically</p>
    </div>
  );
}
