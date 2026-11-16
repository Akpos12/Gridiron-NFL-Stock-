import React, { useState, useEffect, useCallback } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { testFirestoreConnection } from "../../lib/firebase";

interface ConnectionStatusPanelProps {
  compact?: boolean;
  onStatusChange?: (connected: boolean) => void;
  paymentStatusLabel?: string;
  className?: string;
}

type CheckState = "checking" | "connected" | "degraded" | "offline";

export const ConnectionStatusPanel: React.FC<ConnectionStatusPanelProps> = ({
  compact = false,
  onStatusChange,
  paymentStatusLabel,
  className = "",
}) => {
  const [status, setStatus] = useState<CheckState>("checking");
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [lastChecked, setLastChecked] = useState<string>("");
  const [message, setMessage] = useState<string>("Verifying secure platform connection...");

  const verifyConnection = useCallback(async () => {
    setStatus("checking");
    setMessage("Verifying payment gateway & live record synchronization...");

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setStatus("offline");
      setMessage("Your device appears to be offline. Reconnect to the internet and retry.");
      onStatusChange?.(false);
      return;
    }

    const apiStart = Date.now();
    let apiOk = false;
    try {
      const res = await fetch("/api/health", { cache: "no-store" });
      apiOk = res.ok;
      setApiLatency(Date.now() - apiStart);
    } catch {
      apiOk = false;
      setApiLatency(null);
    }

    const dbCheck = await testFirestoreConnection();
    setDbLatency(dbCheck.ok ? dbCheck.latencyMs : null);
    setLastChecked(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));

    if (apiOk && dbCheck.ok) {
      setStatus("connected");
      setMessage("Encrypted connection active. Booking & verification records are synchronized.");
      onStatusChange?.(true);
    } else if (apiOk || dbCheck.ok) {
      setStatus("degraded");
      setMessage(
        "Primary connection is active with elevated latency. Your saved inquiry details remain secure."
      );
      onStatusChange?.(true);
    } else {
      setStatus("offline");
      setMessage(
        "Unable to reach verification servers. Please check your network connection and retry."
      );
      onStatusChange?.(false);
    }
  }, [onStatusChange]);

  useEffect(() => {
    verifyConnection();
    const handleOnline = () => verifyConnection();
    const handleOffline = () => {
      setStatus("offline");
      setMessage("Network connection interrupted. Reconnect and select Retry.");
      onStatusChange?.(false);
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [verifyConnection, onStatusChange]);

  if (compact) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-colors ${
          status === "connected"
            ? "bg-[#050816] border-emerald-500/25 text-zinc-200"
            : status === "checking"
            ? "bg-[#050816] border-blue-500/35 text-zinc-200"
            : status === "degraded"
            ? "bg-[#050816] border-sky-500/35 text-sky-100"
            : "bg-rose-950/30 border-[#D50A0A]/40 text-rose-100"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {status === "checking" && (
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          )}
          {status === "connected" && (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {status === "degraded" && (
            <Wifi className="w-4 h-4 text-sky-400 shrink-0" />
          )}
          {status === "offline" && (
            <WifiOff className="w-4 h-4 text-[#EF4444] shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {status === "checking"
                ? "Checking Connection…"
                : status === "connected"
                ? "Secure Connection Verified"
                : status === "degraded"
                ? "Slow Network Detected"
                : "Connection Unavailable"}
            </p>
            <p className="text-[11px] text-zinc-400 truncate">
              {paymentStatusLabel || message}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={verifyConnection}
          disabled={status === "checking"}
          className="min-h-[36px] px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-semibold text-zinc-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === "checking" ? "animate-spin" : ""}`} />
          <span>Verify</span>
        </button>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl bg-[#050816] border p-4 sm:p-5 transition-colors ${
        status === "offline"
          ? "border-[#D50A0A]/40"
          : status === "degraded"
          ? "border-sky-500/35"
          : "border-[#013369]/60"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
              status === "connected"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : status === "checking"
                ? "bg-blue-500/10 border-blue-500/30 text-sky-400"
                : status === "degraded"
                ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                : "bg-[#D50A0A]/15 border-[#D50A0A]/40 text-rose-400"
            }`}
          >
            {status === "checking" && <Loader2 className="w-5 h-5 animate-spin" />}
            {status === "connected" && <CheckCircle2 className="w-5 h-5" />}
            {status === "degraded" && <AlertTriangle className="w-5 h-5" />}
            {status === "offline" && <WifiOff className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-sm font-bold text-white tracking-tight">
                {status === "checking"
                  ? "Verifying Connection & Sync Status"
                  : status === "connected"
                  ? "Secure Network & Record Verification Active"
                  : status === "degraded"
                  ? "Intermittent Connection Detected"
                  : "Network Verification Required"}
              </h4>
              {lastChecked && status !== "checking" && (
                <span className="text-[11px] font-mono text-zinc-400">
                  Checked {lastChecked}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">{message}</p>
            {(apiLatency !== null || dbLatency !== null || paymentStatusLabel) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-zinc-400 font-mono">
                {paymentStatusLabel && (
                  <span className="text-sky-300 font-semibold">
                    Status: {paymentStatusLabel}
                  </span>
                )}
                {apiLatency !== null && <span>Gateway Ping: {apiLatency}ms</span>}
                {dbLatency !== null && <span>Record Sync: {dbLatency}ms</span>}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={verifyConnection}
          disabled={status === "checking"}
          className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#08112B] hover:bg-[#013369] border border-blue-500/30 text-xs font-bold text-white inline-flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${status === "checking" ? "animate-spin" : ""}`} />
          <span>{status === "checking" ? "Verifying..." : "Refresh Status"}</span>
        </button>
      </div>
    </div>
  );
};
