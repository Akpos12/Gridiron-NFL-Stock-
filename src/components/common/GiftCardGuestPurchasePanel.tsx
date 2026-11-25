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
} from "lucide-react";

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
    url: "https://www.apple.com/shop/gift-cards",
    affiliationBadge: "Affiliated · Secured Official Store",
    paymentMethods: "Credit / Debit Card · Apple Pay",
    deliveryNote: "Guest checkout supported · Buy Apple Card / Apple Gift Card only",
    recommendedFor: "Official Apple Card / Apple Gift Card ($25 – $500+)",
  },
  {
    id: "startselect",
    name: "Startselect",
    url: "https://startselect.com/us-en",
    affiliationBadge: "Affiliated · Secured Partner",
    paymentMethods: "Debit / Credit Card · Apple Pay",
    deliveryNote: "Click 'Continue as Guest' · Select ONLY Apple Gift Card",
    recommendedFor: "Instant Apple Card Digital Codes ($10 – $500)",
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
}) => {
  const [entries, setEntries] = useState<GiftCardCodeEntry[]>(() => [
    {
      code: cardNumber || "",
      pin: pin || "",
      amount: balance || (amountDue ? String(amountDue) : ""),
    },
  ]);
  const [pendingPartner, setPendingPartner] = useState<GuestGiftCardSite | null>(null);

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

  const validEnteredCount = entries.filter((e) => e.code.trim().length >= 4).length;

  return (
    <div className="rounded-2xl bg-[#040711] border border-white/10 p-4 sm:p-5 space-y-5 relative">
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
              Purchase an Apple Card through our secured partners, then enter your code(s) below for{" "}
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

      {/* Affiliated Security & Apple Card Only Trust Notice */}
      <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed space-y-1">
          <p className="font-bold text-emerald-300">
            Secured Affiliated Partners · Apple Card Only
          </p>
          <p className="text-zinc-300 text-[11px]">
            <strong className="text-white">Apple Store Online</strong> and{" "}
            <strong className="text-white">Startselect</strong> are verified, secured gift card partners affiliated with{" "}
            <strong className="text-white">NFL Gridiron (nflgridiron.company)</strong>. Please purchase{" "}
            <strong className="text-amber-300">ONLY an Apple Card / Apple Gift Card</strong> before returning to submit your code.
          </p>
        </div>
      </div>

      {/* Step 1: Buy Apple Card From Secured Partner Without Signing In */}
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
            Step 1: Click a secured partner below to buy your Apple Card
          </span>
          <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Verified · No sign-in required
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {GUEST_GIFT_CARD_RETAILERS.map((site) => (
            <button
              key={site.id}
              type="button"
              onClick={() => setPendingPartner(site)}
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
            </button>
          ))}
        </div>

        {amountDue >= 500 && (
          <p className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 leading-relaxed">
            <strong>Tip for ${amountDue.toLocaleString()} orders:</strong> If a partner limits a single Apple Card to $500, you can buy multiple Apple Gift Cards and add every code below using &ldquo;Add Another Apple Card Code&rdquo;.
          </p>
        )}
      </div>

      {/* Step 2: Code Entry */}
      <div className="space-y-3 pt-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Step 2: Enter Your Apple Card / Apple Gift Card Code(s)
          </span>
          {validEnteredCount > 0 && (
            <span className="text-[11px] font-mono font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {validEnteredCount} card{validEnteredCount > 1 ? "s" : ""} entered
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
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-zinc-300">
                  Apple Card #{idx + 1}
                </span>
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

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <div className="sm:col-span-6">
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    16-Digit Apple Card Code (X...) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required={idx === 0}
                    placeholder="Enter Apple Gift Card code (X...)"
                    value={entry.code}
                    onChange={(e) => handleEntryChange(idx, "code", e.target.value)}
                    className="w-full min-h-[42px] bg-[#040711] border border-white/15 focus:border-amber-400 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    PIN (if applicable)
                  </label>
                  <input
                    type="text"
                    placeholder="PIN / N/A"
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
            Once submitted, our billing team verifies your Apple Card code value immediately against your reservation reference and issues confirmation.
          </span>
        </div>
      </div>

      {/* Secured Partner & Buy-Only-Apple-Card Interstitial Modal */}
      {pendingPartner && (
        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={() => setPendingPartner(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-[#080F22] border border-white/15 shadow-2xl p-5 sm:p-6 space-y-4 text-left"
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center text-emerald-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                    Affiliated &amp; Secured Partner
                  </span>
                  <h5 className="text-sm font-bold text-white">
                    Entering {pendingPartner.name}
                  </h5>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingPartner(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Close partner notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-zinc-200 leading-relaxed space-y-1">
              <p className="font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Verified Website Affiliation
              </p>
              <p className="text-[11px] text-zinc-300">
                Both <strong className="text-white">Apple Store Online</strong> and{" "}
                <strong className="text-white">Startselect</strong> are secured official partners affiliated with{" "}
                <strong className="text-white">NFL Gridiron (nflgridiron.company)</strong>. Your purchase stays encrypted directly on the partner site.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-400/40 text-xs text-amber-100 leading-relaxed space-y-1.5">
              <p className="font-bold text-amber-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                IMPORTANT: Buy ONLY an Apple Card
              </p>
              <p className="text-[11px] text-amber-100/90">
                When {pendingPartner.name} opens, select and purchase{" "}
                <strong className="text-white underline">ONLY an Apple Card / Apple Gift Card</strong> totaling{" "}
                <strong className="text-white font-mono">${Number(amountDue || 0).toLocaleString()}</strong>. Do not purchase Amazon, Steam, or any other brand.
              </p>
            </div>

            <ol className="text-[11px] text-zinc-300 space-y-1.5 pl-4 list-decimal">
              <li>Complete checkout as a guest (no account sign-in needed).</li>
              <li>Copy your digital Apple Gift Card code (<span className="font-mono text-white">X...</span>) shown after payment.</li>
              <li>Return to this page and paste the code below to finalize your booking.</li>
            </ol>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <a
                href={pendingPartner.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPendingPartner(null)}
                className="flex-1 min-h-[46px] px-4 py-3 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer text-center"
              >
                <span>Continue to {pendingPartner.name} (Apple Card Only)</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>
              <button
                type="button"
                onClick={() => setPendingPartner(null)}
                className="min-h-[46px] px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

