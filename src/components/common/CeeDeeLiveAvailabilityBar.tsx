import React, { useEffect, useState } from "react";
import { Clock, Ticket, Users, CheckCircle2 } from "lucide-react";
import {
  CEEDEE_DEFAULT_TOTAL_SLOTS,
  CeeDeePublicSlotStats,
  subscribeToCeeDeePublicSlotStats,
} from "../../services/paymentControlService";
import { cn } from "../../lib/utils";

interface CeeDeeLiveAvailabilityBarProps {
  variant?: "full" | "compact";
  className?: string;
}

// Official AT&T Stadium Public Meet & Greet kickoff: Dec 26, 2026 at 12:00 PM CST (18:00 UTC)
const EVENT_TARGET_MS = Date.UTC(2026, 11, 26, 18, 0, 0);

function formatRelativeTime(tsMs: number, nowMs: number): string {
  if (!tsMs || tsMs <= 0) return "Recently";
  const diff = nowMs - tsMs;
  if (diff < 0) {
    return new Date(tsMs).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

function getCountdownParts(nowMs: number) {
  const remaining = Math.max(0, EVENT_TARGET_MS - nowMs);
  const totalSec = Math.floor(remaining / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return {
    expired: remaining <= 0,
    days,
    hours,
    minutes,
    seconds,
  };
}

const INITIAL_STATS: CeeDeePublicSlotStats = {
  totalSlots: CEEDEE_DEFAULT_TOTAL_SLOTS,
  claimedCount: 0,
  confirmedCount: 0,
  remainingSlots: CEEDEE_DEFAULT_TOTAL_SLOTS,
  percentFilled: 0,
  recentActivity: [],
  loaded: false,
};

export const CeeDeeLiveAvailabilityBar: React.FC<CeeDeeLiveAvailabilityBarProps> = ({
  variant = "full",
  className,
}) => {
  const [stats, setStats] = useState<CeeDeePublicSlotStats>(INITIAL_STATS);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const unsub = subscribeToCeeDeePublicSlotStats((next) => {
      setStats(next);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const countdown = getCountdownParts(nowMs);
  const pad2 = (n: number) => String(n).padStart(2, "0");
  const isLowInventory = stats.loaded && stats.remainingSlots <= 10;
  const latestFan = stats.recentActivity[0] || null;

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[#B0B7BC]/25 bg-[#030816]/90 p-3.5 sm:p-4 space-y-2.5",
          className
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#E2E8F0] font-bold">
            <Ticket className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
            {stats.loaded ? (
              <span className="tabular-nums">
                <strong className="text-white">{stats.claimedCount}</strong> of{" "}
                <strong className="text-white">{stats.totalSlots}</strong> slots claimed
                <span aria-hidden="true" className="text-zinc-500 mx-1.5">·</span>
                <span className={isLowInventory ? "text-amber-300 font-extrabold" : "text-[#7DD3FC]"}>
                  {stats.remainingSlots} remaining
                </span>
              </span>
            ) : (
              <span className="text-zinc-400">Loading live slot availability...</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#CBD5E1] tabular-nums">
            <Clock className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
            {countdown.expired ? (
              <span>Event Day · AT&amp;T Stadium</span>
            ) : (
              <span>
                {countdown.days}d {pad2(countdown.hours)}h {pad2(countdown.minutes)}m {pad2(countdown.seconds)}s left
              </span>
            )}
          </div>
        </div>

        {/* Hairline Capacity Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] via-[#38BDF8] to-[#E2E8F0] transition-all duration-500"
            style={{ width: `${Math.max(stats.loaded ? 4 : 0, stats.percentFilled)}%` }}
          />
        </div>

        {latestFan && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <span className="inline-flex items-center gap-1.5 text-[#CBD5E1]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>
                Latest reservation:{" "}
                <strong className="text-white font-semibold">{latestFan.displayName}</strong>
                <span aria-hidden="true" className="text-zinc-500 mx-1">·</span>
                {latestFan.itemLabel}
              </span>
            </span>
            <span className="font-mono text-[#94A3B8] tabular-nums">
              {formatRelativeTime(latestFan.timestampMs, nowMs)}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#B0B7BC]/30 bg-[#030816]/90 p-4 sm:p-5 space-y-4",
        className
      )}
    >
      {/* Top Row: Real Slot Availability & Real Dec 26 Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-7 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-white">
              <Ticket className="w-4 h-4 text-[#60A5FA] shrink-0" />
              <span>Live Event Capacity</span>
            </span>
            {stats.loaded ? (
              <span className="font-mono text-xs font-bold tabular-nums text-[#CBD5E1]">
                <strong className="text-white">{stats.claimedCount}</strong> / {stats.totalSlots} Reserved ({stats.percentFilled}%)
              </span>
            ) : (
              <span className="font-mono text-xs text-zinc-400">Syncing live count...</span>
            )}
          </div>

          <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#003594] via-[#38BDF8] to-[#E2E8F0] transition-all duration-500"
              style={{ width: `${Math.max(stats.loaded ? 4 : 0, stats.percentFilled)}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#94A3B8]">
            <span>
              {stats.loaded ? (
                <>
                  <strong className={isLowInventory ? "text-amber-300" : "text-white"}>
                    {stats.remainingSlots} of {stats.totalSlots} public slots left
                  </strong>
                  <span aria-hidden="true" className="text-zinc-600 mx-1.5">·</span>
                  <span>AT&amp;T Stadium, Arlington TX</span>
                </>
              ) : (
                "Checking confirmed & active fan reservations"
              )}
            </span>
          </div>
        </div>

        {/* Real Calendar Countdown */}
        <div className="md:col-span-5 rounded-xl bg-[#061229]/90 border border-white/10 px-3.5 py-2.5 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD] flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-[#60A5FA]" />
              <span>Dec 26 Event Countdown</span>
            </span>
            <span className="text-[11px] text-[#94A3B8] block">
              Registration closes prior to kickoff
            </span>
          </div>
          {countdown.expired ? (
            <span className="font-mono text-xs font-extrabold text-white">DEC 26 LIVE</span>
          ) : (
            <div className="flex items-center gap-1.5 font-mono text-white font-black text-sm sm:text-base tabular-nums shrink-0">
              <span>{countdown.days}d</span>
              <span className="text-zinc-500">:</span>
              <span>{pad2(countdown.hours)}h</span>
              <span className="text-zinc-500">:</span>
              <span>{pad2(countdown.minutes)}m</span>
              <span className="text-zinc-500">:</span>
              <span className="text-[#7DD3FC]">{pad2(countdown.seconds)}s</span>
            </div>
          )}
        </div>
      </div>

      {/* Real Anonymized Recent Fan Reservations Feed */}
      {stats.recentActivity.length > 0 && (
        <div className="pt-3 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between gap-2 text-[11px] text-[#94A3B8]">
            <span className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-[#CBD5E1]">
              <Users className="w-3.5 h-3.5 text-[#60A5FA]" />
              <span>Recent Fan Reservations</span>
            </span>
            <span>Live verified activity</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            {stats.recentActivity.slice(0, 4).map((entry) => (
              <div
                key={entry.key}
                className="flex items-center justify-between gap-2 py-1 border-b border-white/[0.06] last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
              >
                <span className="inline-flex items-center gap-1.5 min-w-0 truncate text-[#E2E8F0]">
                  <CheckCircle2
                    className={cn(
                      "w-3.5 h-3.5 shrink-0",
                      entry.isConfirmed ? "text-emerald-400" : "text-[#7DD3FC]"
                    )}
                  />
                  <strong className="text-white font-semibold shrink-0">{entry.displayName}</strong>
                  <span aria-hidden="true" className="text-zinc-600">·</span>
                  <span className="text-[#94A3B8] truncate">{entry.itemLabel}</span>
                </span>
                <span className="font-mono text-[11px] text-[#94A3B8] tabular-nums shrink-0">
                  {formatRelativeTime(entry.timestampMs, nowMs)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
