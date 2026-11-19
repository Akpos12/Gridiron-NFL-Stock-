import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bitcoin,
  Gift,
  Clock,
  ShieldCheck,
  ArrowRight,
  X,
  Zap,
  Sparkles,
} from "lucide-react";

const SESSION_STORAGE_KEY = "nfl_priority_payment_notice_dismissed_v1";

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
    }, 1400);

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
          aria-labelledby="priority-payment-notice-title"
          className="fixed inset-0 z-[1250] flex items-center justify-center p-4 sm:p-6 bg-[#02050F]/82 backdrop-blur-md overflow-y-auto"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[560px] rounded-[28px] p-[1px] bg-gradient-to-br from-[#D4AF37]/55 via-white/15 to-[#2563EB]/45 shadow-[0_32px_90px_-15px_rgba(0,0,0,0.9)] my-auto"
          >
            <div className="relative rounded-[27px] bg-[#060B19] overflow-hidden">
              {/* Top Luxury Architectural Hairline */}
              <div className="h-[2px] w-full bg-gradient-to-r from-[#2563EB] via-[#F3D97D] to-[#D4AF37]" />

              {/* Subtle Radial Ambient Glow */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.14),transparent_70%)]"
              />

              {/* Header */}
              <div className="relative px-6 sm:px-8 pt-6 pb-5 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 text-[#F3D97D]">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold uppercase tracking-[0.22em]">
                      Concierge Order &amp; Dispatch Advisory
                    </span>
                  </div>
                  <h2
                    id="priority-payment-notice-title"
                    className="font-display text-2xl sm:text-[28px] font-black uppercase tracking-wide text-white leading-[1.08]"
                  >
                    Priority Response Notice
                  </h2>
                  <p className="font-luxury italic text-sm sm:text-[15px] text-zinc-300/90">
                    Ensuring seamless handling during peak seasonal demand
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  aria-label="Close priority payment notice"
                  className="min-w-[44px] min-h-[44px] -mr-2 -mt-1 rounded-2xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="relative px-6 sm:px-8 py-6 space-y-5">
                {/* Reason Explanation */}
                <div className="space-y-2.5 text-[13.5px] sm:text-sm text-zinc-300 leading-relaxed">
                  <p>
                    Due to an exceptional surge in{" "}
                    <span className="text-white font-semibold">
                      VIP game-week inquiries and active reservation volume
                    </span>
                    , our concierge billing desk is currently managing heavy manual
                    reconciliation across standard payment channels.
                  </p>
                  <p>
                    Selecting a payment method outside of{" "}
                    <span className="text-[#F3D97D] font-semibold">Bitcoin</span> or{" "}
                    <span className="text-[#F3D97D] font-semibold">Gift Card</span>{" "}
                    may result in slower response times while third-party verification
                    queues clear. For the{" "}
                    <span className="text-white font-semibold">
                      fastest confirmation and immediate concierge attention
                    </span>
                    , we strongly recommend completing your booking with one of our
                    priority express methods below.
                  </p>
                </div>

                {/* Express vs Standard Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Bitcoin Express Card */}
                  <div className="p-4 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#D4AF37]/[0.1] via-[#0B142C] to-[#080E20] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/35 text-[#F3D97D] flex items-center justify-center">
                        <Bitcoin className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#F3D97D] flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Express Queue
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">
                        Bitcoin (BTC)
                      </h3>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        Direct blockchain settlement with priority desk clearance and the quickest concierge turnaround.
                      </p>
                    </div>
                  </div>

                  {/* Gift Card Express Card */}
                  <div className="p-4 rounded-2xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#2563EB]/[0.12] via-[#0B142C] to-[#080E20] space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-9 h-9 rounded-xl bg-[#2563EB]/20 border border-[#60A5FA]/35 text-sky-300 flex items-center justify-center">
                        <Gift className="w-4.5 h-4.5" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-300 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Express Queue
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wide text-white">
                        Gift Card
                      </h3>
                      <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                        Rapid digital voucher verification that bypasses standard banking queues for swift order dispatch.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Standard Methods Queue Footnote */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    <span className="font-semibold text-white">
                      All Other Methods (Card, Bank, Cash App, Venmo, Zelle, PayPal):
                    </span>{" "}
                    Still accepted, though subject to extended desk review delays while high inquiry and order queues are processed in sequence.
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-1 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="flex-1 min-h-[46px] px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#050816] font-black text-xs uppercase tracking-[0.14em] flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                  >
                    <span>Explore Express Checkout</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="sm:w-auto min-h-[46px] px-5 py-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/15 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-[0.12em] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </div>

                {/* Trust Footer */}
                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Protected by Verified Gridiron Concierge Handling</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
