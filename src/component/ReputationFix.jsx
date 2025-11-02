import React, { useEffect, useMemo, useState } from "react";

/*
  ReputationFix App – single‑file React (JS) front‑end
  ----------------------------------------------------
  ✅ Pure React + TailwindCSS (no TypeScript)
  ✅ One file you can drop into Vite/CRA as a route or component
  ✅ Clean, responsive UI with skeleton loaders & empty states
  ✅ Slots for: News, YouTube, X/Twitter, Reddit, Web Mentions
  ✅ Sentiment summary, filters, saved searches, CSV export

  HOW TO USE
  ----------
  1) Ensure Tailwind is configured in your app (or replace classes with your styles).
  2) Import and render <ReputationFixApp /> anywhere in your React app.
  3) Wire real APIs in the fetch* functions below.
*/

// ---------- Small utilities ----------
const platforms = [
  { key: "news", label: "News" },
  { key: "youtube", label: "YouTube" },
  { key: "twitter", label: "X / Twitter" },
  { key: "reddit", label: "Reddit" },
  { key: "web", label: "Web Mentions" },
];

const timeRanges = [
  { key: "24h", label: "Last 24h" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

const languages = [
  { key: "auto", label: "Auto" },
  { key: "en", label: "English" },
  { key: "hi", label: "Hindi" },
  { key: "bn", label: "Bengali" },
  { key: "mr", label: "Marathi" },
];

const sentimentColor = (s) =>
  s === "positive" ? "text-emerald-600 bg-emerald-50 ring-emerald-200" :
  s === "negative" ? "text-rose-600 bg-rose-50 ring-rose-200" :
  "text-amber-600 bg-amber-50 ring-amber-200";

const scoreToSentiment = (score) => (score > 0.25 ? "positive" : score < -0.25 ? "negative" : "neutral");

function classNames(...c) { return c.filter(Boolean).join(" "); }

// ---------- Mock fetchers (replace with your real API calls) ----------
async function fetchAllSources({ query, range, lang, chosenPlatforms }) {
  // TODO: replace with your backend endpoints.
  // For now, return mocked results with random sentiments.
  await new Promise((r) => setTimeout(r, 900));

  const now = new Date().toISOString();
  const fake = (source, n = 5) =>
    Array.from({ length: n }).map((_, i) => {
      const score = Math.round((Math.random() * 2 - 1) * 100) / 100; // -1..1
      return {
        id: `${source}-${i}`,
        source,
        title: `${source.toUpperCase()} result ${i + 1} for "${query}"`,
        url: "#",
        author: ["TOI", "User123", "Channel XYZ", "Reporter AB"][i % 4],
        published_at: now,
        snippet:
          "This is a placeholder snippet showing how the item preview will look in the UI.",
        score,
        sentiment: scoreToSentiment(score),
        metrics: {
          likes: Math.floor(Math.random() * 900),
          comments: Math.floor(Math.random() * 350),
          shares: Math.floor(Math.random() * 180),
          views: Math.floor(Math.random() * 20000),
        },
      };
    });

  const data = {};
  chosenPlatforms.forEach((p) => {
    data[p] = fake(p, p === "youtube" ? 6 : 5);
  });
  return data;
}

// ---------- CSV export ----------
function exportCSV(rows, filename = "reputationfix_export.csv") {
  const headers = [
    "source",
    "title",
    "url",
    "author",
    "published_at",
    "snippet",
    "score",
    "sentiment",
    "likes",
    "comments",
    "shares",
    "views",
  ];
  const body = rows.map((r) => [
    r.source,
    r.title,
    r.url,
    r.author,
    r.published_at,
    r.snippet,
    r.score,
    r.sentiment,
    r.metrics?.likes ?? "",
    r.metrics?.comments ?? "",
    r.metrics?.shares ?? "",
    r.metrics?.views ?? "",
  ]);
  const csv = [headers, ...body].map((row) => row.map(escapeCSV).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeCSV(v) {
  const s = String(v ?? "");
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return '"' + s.replaceAll('"', '""') + '"';
  }
  return s;
}

// ---------- UI pieces ----------
const StatPill = ({ label, value, tone = "" }) => (
  <div className={classNames(
    "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ring-1",
    tone
  )}>
    <span className="font-medium">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const Skeleton = ({ className }) => (
  <div className={classNames("animate-pulse rounded-lg bg-slate-200/70", className)} />
);

const SectionCard = ({ title, count, children, hint }) => (
  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between px-4 sm:px-6 pt-4">
      <h3 className="text-base sm:text-lg font-semibold text-slate-800">{title}</h3>
      {typeof count === "number" && (
        <span className="text-xs sm:text-sm text-slate-500">{count} items</span>
      )}
    </div>
    {hint && (
      <div className="px-4 sm:px-6 pt-1 pb-2 text-xs text-slate-500">{hint}</div>
    )}
    <div className="p-4 sm:p-6">{children}</div>
  </div>
);

const RowItem = ({ item }) => (
  <a
    href={item.url}
    target="_blank"
    rel="noreferrer"
    className="group block rounded-xl border border-slate-100 p-4 hover:border-slate-200 hover:bg-slate-50 transition"
  >
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-slate-400">{item.source}</span>
          <span className={classNames(
            "text-[11px] rounded-full px-2 py-0.5 ring-1",
            sentimentColor(item.sentiment)
          )}>
            {item.sentiment}
          </span>
        </div>
        <div className="mt-1 text-sm sm:text-base font-medium text-slate-800 line-clamp-2">
          {item.title}
        </div>
        <div className="mt-1 text-xs text-slate-500 line-clamp-2">{item.snippet}</div>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <span>by {item.author}</span>
          <span>•</span>
          <span>{new Date(item.published_at).toLocaleString()}</span>
          <span>•</span>
          <span>❤ {item.metrics.likes}</span>
          <span>💬 {item.metrics.comments}</span>
          <span>↗ {item.metrics.shares}</span>
          <span>▶ {item.metrics.views}</span>
        </div>
      </div>
      <div className="mt-2 sm:mt-0">
        <div className="text-sm font-semibold text-slate-700 text-right">
          {Math.round(item.score * 100) / 100}
        </div>
        <div className="text-[10px] text-slate-400">sentiment score</div>
      </div>
    </div>
  </a>
);

// ---------- Main Component ----------
export default function ReputationFixApp() {
  const [query, setQuery] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState(platforms.map((p) => p.key));
  const [range, setRange] = useState("7d");
  const [lang, setLang] = useState("auto");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem("rf_saved") || "[]"); } catch { return []; }
  });

  const flatItems = useMemo(() => Object.values(data).flat(), [data]);

  const sentimentSummary = useMemo(() => {
    const totals = { positive: 0, neutral: 0, negative: 0 };
    flatItems.forEach((i) => { totals[i.sentiment]++; });
    const scoreAvg = flatItems.length
      ? Math.round((flatItems.reduce((a, b) => a + b.score, 0) / flatItems.length) * 100) / 100
      : 0;
    return { ...totals, scoreAvg, total: flatItems.length };
  }, [flatItems]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const d = await fetchAllSources({ query, range, lang, chosenPlatforms: selectedPlatforms });
      setData(d);
    } catch (e) {
      setError(e?.message || "Failed to fetch results");
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (key) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const saveSearch = () => {
    if (!query.trim()) return;
    const entry = { query, range, lang, selectedPlatforms, ts: Date.now() };
    const next = [entry, ...saved].slice(0, 12);
    setSaved(next);
    localStorage.setItem("rf_saved", JSON.stringify(next));
  };

  const loadSearch = (entry) => {
    setQuery(entry.query);
    setRange(entry.range);
    setLang(entry.lang);
    setSelectedPlatforms(entry.selectedPlatforms);
  };

  const exportAll = () => exportCSV(flatItems);

  useEffect(() => {
    // optional: run a demo search on first mount
    if (!flatItems.length && !loading && !query) {
      setQuery("Katyayani Organics");
    }
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur supports-backdrop-filter:bg-white/70 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-slate-900 text-white grid place-items-center font-bold">RF</div>
              <div>
                <div className="text-slate-900 font-semibold leading-tight">ReputationFix</div>
                <div className="text-xs text-slate-500 -mt-0.5">Online Reputation Monitoring</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2">
              <button onClick={saveSearch} className="rounded-lg px-3 py-2 text-sm font-medium ring-1 ring-slate-200 hover:bg-slate-100">Save search</button>
              <button onClick={exportAll} className="rounded-lg px-3 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800">Export CSV</button>
            </div>
          </div>
        </div>
      </header>

      {/* Controls */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-6">
        <div className="grid gap-4 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <label className="text-xs font-medium text-slate-600">Query / Brand / Keyword</label>
            <div className="mt-1 flex rounded-xl ring-1 ring-slate-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-slate-900">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="something"
                className="w-full px-4 py-2.5 outline-none text-slate-800 placeholder:text-slate-400"/>
              <button
                onClick={handleSearch}
                className="px-4 py-2.5 text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                Search
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Time range</label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value)}
              className="mt-1 w-full rounded-xl ring-1 ring-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              {timeRanges.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
            {range === "custom" && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <input type="date" value={customRange.from} onChange={(e) => setCustomRange((s) => ({ ...s, from: e.target.value }))} className="rounded-lg ring-1 ring-slate-300 px-2 py-2 text-sm" />
                <input type="date" value={customRange.to} onChange={(e) => setCustomRange((s) => ({ ...s, to: e.target.value }))} className="rounded-lg ring-1 ring-slate-300 px-2 py-2 text-sm" />
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600">Language</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="mt-1 w-full rounded-xl ring-1 ring-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              {languages.map((l) => (
                <option key={l.key} value={l.key}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Platform chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {platforms.map((p) => {
            const active = selectedPlatforms.includes(p.key);
            return (
              <button
                key={p.key}
                onClick={() => togglePlatform(p.key)}
                className={classNames(
                  "rounded-full px-3 py-1.5 text-sm ring-1",
                  active ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100"
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Saved searches */}
        {saved.length > 0 && (
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs text-slate-500">Saved:</span>
            {saved.map((s, idx) => (
              <button
                key={idx}
                onClick={() => loadSearch(s)}
                className="whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs ring-1 ring-slate-300 hover:bg-slate-100"
                title={new Date(s.ts).toLocaleString()}
              >
                {s.query} • {s.range} • {s.lang.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Summary + Results */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 mt-6 pb-20">
        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Sentiment summary</h3>
              <div className="flex gap-2">
                <StatPill label="Total" value={sentimentSummary.total} tone="ring-slate-200 text-slate-700 bg-slate-50" />
              </div>
            </div>

            {/* Gauge */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                {/* simple stacked bar */}
                <StackedBar items={flatItems} />
              </div>
              <div className="mt-2 text-xs text-slate-500">
                Avg score: <span className="font-semibold text-slate-700">{sentimentSummary.scoreAvg}</span>
              </div>
              <div className="mt-3 flex gap-2">
                <StatPill label="Positive" value={sentimentSummary.positive} tone="bg-emerald-50 text-emerald-700 ring-emerald-200" />
                <StatPill label="Neutral" value={sentimentSummary.neutral} tone="bg-amber-50 text-amber-700 ring-amber-200" />
                <StatPill label="Negative" value={sentimentSummary.negative} tone="bg-rose-50 text-rose-700 ring-rose-200" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Actions</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              <li>• Click any card to open the source.</li>
              <li>• Toggle platforms above to focus your crawl.</li>
              <li>• Use Export CSV for offline analysis.</li>
              <li>• Save a search to reuse settings.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800">Status</h3>
            <div className="mt-3 text-sm">
              {loading ? (
                <div className="flex items-center gap-2"><Spinner /> Fetching sources…</div>
              ) : error ? (
                <div className="text-rose-600">{error}</div>
              ) : (
                <div className="text-emerald-700">Ready</div>
              )}
            </div>
            <button onClick={handleSearch} className="mt-3 w-full rounded-lg bg-slate-900 py-2 text-sm font-semibold text-white hover:bg-slate-800">Run Search</button>
          </div>
        </div>

        {/* Result sections */}
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* News */}
          <SectionCard title="News" count={data.news?.length} hint="e.g., Times of India, Economic Times, etc.">
            {loading ? <RowsSkeleton /> : data.news?.length ? (
              <div className="space-y-3">
                {data.news.map((it) => <RowItem key={it.id} item={it} />)}
              </div>
            ) : <Empty label="No news yet" />}
          </SectionCard>

          {/* YouTube */}
          <SectionCard title="YouTube" count={data.youtube?.length} hint="Sort by likes/comments to triage quickly.">
            {loading ? <RowsSkeleton /> : data.youtube?.length ? (
              <div className="space-y-3">
                {data.youtube.map((it) => <RowItem key={it.id} item={it} />)}
              </div>
            ) : <Empty label="No videos yet" />}
          </SectionCard>

          {/* X / Twitter */}
          <SectionCard title="X / Twitter" count={data.twitter?.length} hint="Track virality and reply from your CRM.">
            {loading ? <RowsSkeleton /> : data.twitter?.length ? (
              <div className="space-y-3">
                {data.twitter.map((it) => <RowItem key={it.id} item={it} />)}
              </div>
            ) : <Empty label="No tweets yet" />}
          </SectionCard>

          {/* Reddit */}
          <SectionCard title="Reddit" count={data.reddit?.length} hint="Communities often surface detailed user feedback.">
            {loading ? <RowsSkeleton /> : data.reddit?.length ? (
              <div className="space-y-3">
                {data.reddit.map((it) => <RowItem key={it.id} item={it} />)}
              </div>
            ) : <Empty label="No reddit posts yet" />}
          </SectionCard>

          {/* Web Mentions */}
          <SectionCard title="Web Mentions" count={data.web?.length} hint="Blogs, forums, small news sites, etc.">
            {loading ? <RowsSkeleton /> : data.web?.length ? (
              <div className="space-y-3">
                {data.web.map((it) => <RowItem key={it.id} item={it} />)}
              </div>
            ) : <Empty label="No web mentions yet" />}
          </SectionCard>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">© {new Date().getFullYear()} ReputationFix • Front‑end demo</div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Shortcuts:</span>
            <kbd className="rounded border bg-slate-50 px-1.5 py-0.5">Enter</kbd>
            <span>to search</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-slate-900" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
    </svg>
  );
}

function RowsSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
      {label}
    </div>
  );
}

function StackedBar({ items }) {
  const counts = useMemo(() => {
    const c = { positive: 0, neutral: 0, negative: 0 };
    items.forEach((i) => { c[i.sentiment]++; });
    const total = Math.max(1, items.length);
    return {
      posPct: (c.positive / total) * 100,
      neuPct: (c.neutral / total) * 100,
      negPct: (c.negative / total) * 100,
    };
  }, [items]);

  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full">
      <div className="h-full bg-emerald-500/80" style={{ width: `${counts.posPct}%` }} />
      <div className="h-full bg-amber-400/80" style={{ width: `${counts.neuPct}%` }} />
      <div className="h-full bg-rose-500/80" style={{ width: `${counts.negPct}%` }} />
    </div>
  );
}
