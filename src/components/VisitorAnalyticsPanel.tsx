import React, { useMemo, useState } from "react";
import {
  Activity,
  Eye,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Trash2,
  UserCheck,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";
import {
  clearSiteVisits,
  deleteSiteVisit,
  SiteVisitRecord,
} from "../services/visitorTrackingService";

interface VisitorAnalyticsPanelProps {
  visits: SiteVisitRecord[];
  searchTerm: string;
}

const ONLINE_WINDOW_MS = 2 * 60 * 1000; // Active within last 2 minutes

function formatRelativeTime(ts: number, now: number): string {
  const diffSec = Math.max(0, Math.floor((now - ts) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

function formatDuration(firstSeenAt: number, lastSeenAt: number): string {
  const sec = Math.max(0, Math.floor((lastSeenAt - firstSeenAt) / 1000));
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (min < 60) return `${min}m ${remSec}s`;
  const hr = Math.floor(min / 60);
  return `${hr}h ${min % 60}m`;
}

function getTodayDateKey(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export const VisitorAnalyticsPanel: React.FC<VisitorAnalyticsPanelProps> = ({
  visits,
  searchTerm,
}) => {
  const [excludeAdmin, setExcludeAdmin] = useState(true);
  const [onlyOnline, setOnlyOnline] = useState(false);
  const [onlyGuests, setOnlyGuests] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);

  const now = Date.now();
  const todayKey = getTodayDateKey();

  const scopedVisits = useMemo(() => {
    return visits.filter((v) => {
      if (excludeAdmin && v.isAdmin) return false;
      if (onlyOnline && now - v.lastSeenAt > ONLINE_WINDOW_MS) return false;
      if (onlyGuests && v.isAuthenticated) return false;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const hay = [
          v.visitorId,
          v.userEmail,
          v.currentTab,
          ...(v.tabsViewed || []),
          v.deviceType,
          v.browser,
          v.os,
          v.timezone,
          v.referrer,
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [visits, excludeAdmin, onlyOnline, onlyGuests, searchTerm, now]);

  const metrics = useMemo(() => {
    const base = excludeAdmin ? visits.filter((v) => !v.isAdmin) : visits;
    const onlineCount = base.filter((v) => now - v.lastSeenAt <= ONLINE_WINDOW_MS).length;
    const todayCount = base.filter((v) => v.dateKey === todayKey).length;
    const uniqueDevices = new Set(base.map((v) => v.visitorId)).size;
    const browsingOnlyGuests = base.filter((v) => !v.isAuthenticated).length;

    const sectionCounts: Record<string, number> = {};
    const deviceCounts: Record<string, number> = { Mobile: 0, Desktop: 0, Tablet: 0 };
    for (const v of base) {
      deviceCounts[v.deviceType] = (deviceCounts[v.deviceType] || 0) + 1;
      for (const tab of v.tabsViewed || [v.currentTab]) {
        if (!tab) continue;
        sectionCounts[tab] = (sectionCounts[tab] || 0) + 1;
      }
    }

    const topSections = Object.entries(sectionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    return {
      totalRecorded: base.length,
      onlineCount,
      todayCount,
      uniqueDevices,
      browsingOnlyGuests,
      topSections,
      deviceCounts,
    };
  }, [visits, excludeAdmin, todayKey, now]);

  const handleDeleteRow = async (sessionId: string) => {
    try {
      setBusyId(sessionId);
      await deleteSiteVisit(sessionId);
    } finally {
      setBusyId(null);
    }
  };

  const handleClearFiltered = async () => {
    try {
      setClearingAll(true);
      await clearSiteVisits(scopedVisits.map((v) => v.sessionId));
      setConfirmClearAll(false);
    } finally {
      setClearingAll(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-xl font-black uppercase italic tracking-tight text-white">
              Live Site Visitors & Traffic Log
            </h3>
          </div>
          <p className="text-xs text-zinc-400">
            Automatically records every visitor session—even guests who only browse without logging in, buying, or submitting an inquiry.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setExcludeAdmin((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
              excludeAdmin
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
            }`}
            title="Filter out visits from your own admin browser"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {excludeAdmin ? "Hiding My Admin Visits" : "Showing All (Incl. Admin)"}
          </button>

          <button
            type="button"
            onClick={() => setOnlyOnline((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
              onlyOnline
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            Online Now Only
          </button>

          <button
            type="button"
            onClick={() => setOnlyGuests((v) => !v)}
            className={`px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-2 cursor-pointer ${
              onlyGuests
                ? "bg-purple-600/20 border-purple-500/40 text-purple-300"
                : "bg-zinc-900 border-white/10 text-zinc-400 hover:text-white"
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Anonymous Guests Only
          </button>

          {scopedVisits.length > 0 && (
            confirmClearAll ? (
              <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/40 px-3 py-1.5 rounded-xl">
                <span className="text-[10px] font-black uppercase text-rose-300">
                  Clear {scopedVisits.length}?
                </span>
                <button
                  type="button"
                  disabled={clearingAll}
                  onClick={handleClearFiltered}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase cursor-pointer"
                >
                  {clearingAll ? "Clearing..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClearAll(false)}
                  className="px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-black uppercase cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClearAll(true)}
                className="px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Log
              </button>
            )
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-950/90 border border-emerald-500/20 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Online Right Now
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <p className="text-3xl font-black italic text-emerald-400">{metrics.onlineCount}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Active within last 2 mins</p>
        </div>

        <div className="bg-zinc-950/90 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Today&apos;s Visits
            </span>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-black italic text-white">{metrics.todayCount}</p>
          <p className="text-[10px] text-zinc-500 mt-1">{todayKey}</p>
        </div>

        <div className="bg-zinc-950/90 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Unique Visitors
            </span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-black italic text-white">{metrics.uniqueDevices}</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            Across {metrics.totalRecorded} recorded sessions
          </p>
        </div>

        <div className="bg-zinc-950/90 border border-white/5 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              Browsing-Only Guests
            </span>
            <UserCheck className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black italic text-purple-300">{metrics.browsingOnlyGuests}</p>
          <p className="text-[10px] text-zinc-500 mt-1">Visited without signing in</p>
        </div>
      </div>

      {/* Popular Sections & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
            Most Viewed Sections
          </p>
          {metrics.topSections.length === 0 ? (
            <p className="text-xs text-zinc-500">No section traffic recorded yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {metrics.topSections.map(([section, count]) => (
                <div
                  key={section}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-white/5 flex items-center gap-2"
                >
                  <span className="text-[10px] font-black uppercase text-white">{section}</span>
                  <span className="text-[10px] font-mono text-blue-400">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-zinc-950/70 border border-white/5 rounded-2xl p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-3">
            Device Mix
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-zinc-900/90 rounded-xl p-3 flex items-center gap-2.5 border border-white/5">
              <Smartphone className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-white">{metrics.deviceCounts.Mobile || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">Mobile</p>
              </div>
            </div>
            <div className="bg-zinc-900/90 rounded-xl p-3 flex items-center gap-2.5 border border-white/5">
              <Monitor className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-white">{metrics.deviceCounts.Desktop || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">Desktop</p>
              </div>
            </div>
            <div className="bg-zinc-900/90 rounded-xl p-3 flex items-center gap-2.5 border border-white/5">
              <Tablet className="w-4 h-4 text-purple-400 shrink-0" />
              <div>
                <p className="text-xs font-black text-white">{metrics.deviceCounts.Tablet || 0}</p>
                <p className="text-[9px] uppercase tracking-wider text-zinc-500">Tablet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Visitors Table */}
      <div className="bg-zinc-950/80 border border-white/5 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Status
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Visitor / Identity
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Sections Browsed
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Device & Browser
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Timezone & Source
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">
                  Duration / Last Seen
                </th>
                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {scopedVisits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-xs text-zinc-500">
                    {excludeAdmin && visits.some((v) => v.isAdmin)
                      ? "No external guest visits recorded yet (your own admin browser visits are hidden — toggle 'Hiding My Admin Visits' above to verify live tracking)."
                      : "No visitor sessions match your current filter."}
                  </td>
                </tr>
              ) : (
                scopedVisits.map((v) => {
                  const isOnline = now - v.lastSeenAt <= ONLINE_WINDOW_MS;
                  const shortVisitor = v.visitorId.replace(/^vis-/, "").slice(0, 6).toUpperCase();
                  return (
                    <tr
                      key={v.sessionId}
                      className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="p-4">
                        {isOnline ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Online
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-zinc-900 border border-white/5 text-zinc-400 text-[9px] font-mono">
                            {formatRelativeTime(v.lastSeenAt, now)}
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-black text-white">
                            {v.isAuthenticated ? v.userEmail : `Guest #${shortVisitor}`}
                          </span>
                          {v.visitNumber > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[8px] font-black uppercase">
                              Visit #{v.visitNumber}
                            </span>
                          )}
                          {v.isAdmin && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[8px] font-black uppercase">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] font-mono text-zinc-500 mt-0.5">
                          ID: {v.visitorId.slice(0, 14)}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {(v.tabsViewed || [v.currentTab]).map((tab) => (
                            <span
                              key={tab}
                              className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                tab === v.currentTab
                                  ? "bg-blue-600/25 border border-blue-500/40 text-blue-300"
                                  : "bg-zinc-900 border border-white/5 text-zinc-400"
                              }`}
                            >
                              {tab}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-bold text-zinc-200">
                          {v.deviceType} · {v.os}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {v.browser} · {v.screenSize}
                        </p>
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                          <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                          <span className="truncate max-w-[160px]">{v.timezone}</span>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Source: {v.referrer} · {v.language}
                        </p>
                      </td>

                      <td className="p-4">
                        <p className="text-xs font-mono text-zinc-200">
                          {formatDuration(v.firstSeenAt, v.lastSeenAt)} on site
                        </p>
                        <p className="text-[10px] text-zinc-500 font-mono">
                          {new Date(v.lastSeenAt).toLocaleString()}
                        </p>
                      </td>

                      <td className="p-4 text-right">
                        <button
                          type="button"
                          disabled={busyId === v.sessionId}
                          onClick={() => handleDeleteRow(v.sessionId)}
                          className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50 cursor-pointer"
                          title="Delete visitor session record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
