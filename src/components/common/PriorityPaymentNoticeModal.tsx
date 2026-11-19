import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bitcoin,
  Gift,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  MailOpen,
} from "lucide-react";

const SESSION_STORAGE_KEY = "nfl_priority_concierge_letter_v2";
export const OPEN_PRIORITY_LETTER_EVENT = "nfl:open-priority-letter";

interface PriorityPaymentNoticeModalProps {
  /** Suppress automatic pop-up when another modal or deep-link overlay is already active */
  suppressAutoOpen?: boolean;
  /** Optional callback when user clicks the primary express action */
  onExploreExpress?: () => void;
}

export const PriorityPaymentNoticeModal: React.FC<PriorityPaymentNoticeModalProps> = ({
  suppressAutoOpen = false,
  onExploreExpress,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const formattedDate = React.useMemo(() => {
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(new Date());
    } catch {
      return "Official Seasonal Notice";
    }
  }, []);

  useEffect(() => {
    const handleManualOpen = () => setIsOpen(true);
    window.addEventListener(OPEN_PRIORITY_LETTER_EVENT, handleManualOpen);
    return () => window.removeEventListener(OPEN_PRIORITY_LETTER_EVENT, handleManualOpen);
  }, []);

  useEffect(() => {
    if (suppressAutoOpen) return;

    try {
      if (window.sessionStorage.getItem(SESSION_STORAGE_KEY) === "1") {
        return;
      }
    } catch {
      // Ignore storage access errors in restricted frames
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 800);

    return () => window.clearTimeout(timer);
  }, [suppressAutoOpen]);

  const handleDismiss = () => {
    setIsOpen(false);
    try {
      window.sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
    } catch {
      // Ignore storage access errors
    }
  };

  const handlePrimaryAction = () => {
    handleDismiss();
    onExploreExpress?.();
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleDismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="priority-letter-title"
          className="fixed inset-0 z-[1250] flex items-center justify-center p-4 sm:p-6 bg-[#02050F]/84 backdrop-blur-md overflow-y-auto"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[590px] rounded-[28px] p-[1px] bg-gradient-to-br from-[#D4AF37]/60 via-white/15 to-[#2563EB]/45 shadow-[0_34px_95px_-15px_rgba(0,0,0,0.92)] my-auto"
          >
            <div className="relative rounded-[27px] bg-[#060B19] overflow-hidden">
              {/* Top Champagne-Gold to Sapphire Stationery Rule */}
              <div className="h-[3px] w-full bg-gradient-to-r from-[#013369] via-[#F3D97D] to-[#D4AF37]" />

              {/* Subtle Radial Ambient Light */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.13),transparent_70%)]"
              />

              {/* Formal Letterhead Header */}
              <div className="relative px-6 sm:px-9 pt-6 pb-5 border-b border-[#D4AF37]/20 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/12 border border-[#D4AF37]/35 text-[#F3D97D] flex items-center justify-center shrink-0 mt-0.5">
                    <MailOpen className="w-5 h-5" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#F3D97D]">
                      Office of Concierge &amp; Billing Dispatch
                    </p>
                    <h2
                      id="priority-letter-title"
                      className="font-display text-2xl sm:text-[28px] font-black uppercase tracking-wide text-white leading-[1.06]"
                    >
                      A Personal Note Regarding Your Order
                    </h2>
                    <p className="text-xs font-mono text-zinc-400">
                      {formattedDate} · Gridiron Hospitality Priority Desk
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Close concierge letter"
                  className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Letter Sheet Body */}
              <div className="relative px-6 sm:px-9 py-6 space-y-5">
                <div className="rounded-2xl bg-[#091024]/90 border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
                  <p className="font-luxury italic text-lg sm:text-xl text-[#F3D97D]">
                    Dear Valued Guest,
                  </p>

                  <div className="space-y-3 text-[13.5px] sm:text-sm text-zinc-200 leading-relaxed">
                    <p>
                      Thank you for visiting Gridiron Fan Hospitality. Due to an
                      extraordinary surge in{" "}
                      <span className="text-white font-semibold">
                        VIP player encounter inquiries and game-week reservation orders
                      </span>
                      , our billing team is currently working through an unusually high
                      queue of manual third-party verifications.
                    </p>
                    <p>
                      Because of this demand, payment methods other than{" "}
                      <strong className="text-[#F3D97D]">Bitcoin</strong> or{" "}
                      <strong className="text-[#F3D97D]">Gift Card</strong> (including
                      Credit/Debit Card, Cash App, Venmo, Zelle, PayPal, and Bank
                      transfers) may experience temporary processing delays while
                      accounts are reconciled in sequence.
                    </p>
                    <p>
                      If you would like the{" "}
                      <span className="text-white font-semibold">
                        fastest confirmation and immediate priority response
                      </span>{" "}
                      from our concierge team, please select{" "}
                      <strong className="text-[#F3D97D]">Bitcoin (BTC)</strong> or a{" "}
                      <strong className="text-sky-300">Gift Card</strong> when checking
                      out—these channels clear directly through our express desk without
                      waiting in standard banking queues.
                    </p>
                  </div>

                  {/* Two Express Choices Highlighted Inside Letter */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl border border-[#D4AF37]/35 bg-[#D4AF37]/[0.07] space-y-1">
                      <div className="flex items-center gap-2 text-[#F3D97D]">
                        <Bitcoin className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Bitcoin (BTC)
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug">
                        Fastest clearance · Includes 5% express savings on eligible requests.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-[#60A5FA]/35 bg-[#2563EB]/[0.09] space-y-1">
                      <div className="flex items-center gap-2 text-sky-300">
                        <Gift className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-black uppercase tracking-wider">
                          Gift Card
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-snug">
                        Instant digital or physical card entry · Express verification queue.
                      </p>
                    </div>
                  </div>

                  {/* Formal Sign-Off */}
                  <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                    <div>
                      <p className="font-luxury italic text-base text-zinc-200">
                        Warm regards,
                      </p>
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#F3D97D] mt-0.5">
                        Gridiron Hospitality Concierge Desk
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                      <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                      <span>Other methods remain open (standard queue)</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="flex-1 min-h-[46px] px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#050816] font-black text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Proceed with Express Payment</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="sm:w-auto min-h-[46px] px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-[0.12em] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Acknowledge Letter
                  </button>
                </div>

                {/* Verified Trust Line */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Verified Guest Protection · Priority Express Support Active</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
