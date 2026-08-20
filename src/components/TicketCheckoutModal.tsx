import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  CheckCircle2, 
  Copy, 
  Ticket, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  TrendingUp, 
  Building2, 
  Smartphone, 
  QrCode, 
  Sparkles, 
  ExternalLink, 
  AlertCircle, 
  Check,
  Send,
  Tag,
  Gift,
  BadgePercent,
  Users,
  CreditCard,
  Layers,
  Divide,
  Share2,
  DollarSign,
  Wallet,
  ChevronRight
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";

export interface GameTicket {
  id: string;
  name: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  city: string;
  date: string;
  time: string;
  competition?: string;
  status?: string;
  location?: string;
  winProbability?: {
    home: string;
    away: string;
    homeTeam?: string;
    awayTeam?: string;
  };
  cheapestPrice: number;
  vipPrice: number;
  seasonPassPrice?: number;
  url?: string;
  image?: string;
  isResale?: boolean;
}

interface TicketCheckoutModalProps {
  game: GameTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTier?: "general" | "lower_bowl" | "club" | "vip" | "season_pass";
  initialPromoCode?: string;
  passName?: string;
}

export const OFFICIAL_PAYMENT_CHANNELS = {
  bank: {
    bankName: "BMO bank",
    accountName: "Matthew Golom",
    accountNumber: "4859176529",
    routingNumber: "071025661",
    notes: "Direct ACH / Domestic Wire Transfer"
  },
  cashapp: {
    tag: "$Mickobabe32",
    display: "$Mickobabe32"
  },
  venmo: {
    handle: "@DomickoChopin",
    display: "@DomickoChopin"
  },
  zelle: {
    email: "matthewgolom21@gmail.com",
    name: "Matthew Golom"
  },
  crypto: {
    btc: {
      name: "Bitcoin (BTC)",
      address: "16246wmdY6kGfFkWevPKCQrTKH8CRJ62yJ",
      network: "Bitcoin Mainnet"
    },
    eth: {
      name: "Ethereum (ETH)",
      address: "0x3adbc9f41f882b54ddd54b7bea8b9bfd2ad8d2cf",
      network: "Ethereum (ERC-20)"
    },
    usdt: {
      name: "USDT (Ethereum ERC-20)",
      address: "0x3adbc9f41f882b54ddd54b7bea8b9bfd2ad8d2cf",
      network: "Ethereum (ERC-20)"
    }
  }
};

export const TicketCheckoutModal: React.FC<TicketCheckoutModalProps> = ({
  game,
  isOpen,
  onClose,
  onSuccess,
  initialTier = "general",
  initialPromoCode = "",
  passName
}) => {
  const [selectedTier, setSelectedTier] = useState<"general" | "lower_bowl" | "club" | "vip" | "season_pass">(initialTier);
  const [quantity, setQuantity] = useState(1);
  const [paymentTab, setPaymentTab] = useState<"bank" | "cashapp" | "venmo" | "zelle" | "crypto">("bank");
  const [selectedCrypto, setSelectedCrypto] = useState<"btc" | "eth" | "usdt">("usdt");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  
  // Split Price / Payment Plan States
  const [splitMode, setSplitMode] = useState<"full" | "split_2" | "split_4" | "group">("full");
  const [groupSplitCount, setGroupSplitCount] = useState<number>(2);
  const [groupLinkCopied, setGroupLinkCopied] = useState<boolean>(false);

  // Promo / Bonus Code State
  const [promoCodeInput, setPromoCodeInput] = useState(initialPromoCode || "");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(initialPromoCode ? initialPromoCode.trim() : null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(
    initialPromoCode ? "VIP Promo Applied: 50% Off Match Tickets & $3,000 Off Season Pass!" : null
  );

  // Update initial tier when opened
  React.useEffect(() => {
    if (initialTier) {
      setSelectedTier(initialTier);
    }
  }, [initialTier, isOpen]);

  // Buyer Details
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedTicket, setConfirmedTicket] = useState<any | null>(null);

  if (!isOpen || !game) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Base tier pricing determination
  const isSeahawksGame = game.id.includes("sea") || game.homeTeam?.toLowerCase().includes("seahawk") || game.name?.toLowerCase().includes("seahawk");
  
  const basePrice = isSeahawksGame ? 1200 : (game.cheapestPrice || 1200);
  const vipPrice = isSeahawksGame ? 5000 : (game.vipPrice || 5000);
  const seasonPassPrice = isSeahawksGame ? 8000 : (game.seasonPassPrice || 8000);
  
  // Standard full prices before discount
  const originalTierRates: Record<"general" | "lower_bowl" | "club" | "vip" | "season_pass", number> = {
    general: basePrice,
    lower_bowl: isSeahawksGame ? 2400 : Math.round(basePrice * 1.8),
    club: isSeahawksGame ? 3600 : Math.round(basePrice * 3.0),
    vip: vipPrice,
    season_pass: seasonPassPrice
  };

  // Check if promo code is applied
  const is258025Applied = !!appliedPromo;

  // Discounted rates when code 258025 is active:
  // Match tickets -> 50% off (e.g. $1200 -> $600, $2400 -> $1200, $3600 -> $1800, $5000 -> $2500)
  // Season Pass -> $8k to $5k ($8,000 -> $5,000)
  const discountedTierRates: Record<"general" | "lower_bowl" | "club" | "vip" | "season_pass", number> = {
    general: is258025Applied ? Math.round(originalTierRates.general * 0.5) : originalTierRates.general,
    lower_bowl: is258025Applied ? Math.round(originalTierRates.lower_bowl * 0.5) : originalTierRates.lower_bowl,
    club: is258025Applied ? Math.round(originalTierRates.club * 0.5) : originalTierRates.club,
    vip: is258025Applied ? Math.round(originalTierRates.vip * 0.5) : originalTierRates.vip,
    season_pass: is258025Applied ? 5000 : originalTierRates.season_pass
  };

  const currentPricePerTicket = discountedTierRates[selectedTier];
  const originalPricePerTicket = originalTierRates[selectedTier];
  
  const subtotal = currentPricePerTicket * quantity;
  const originalSubtotal = originalPricePerTicket * quantity;
  const totalSavings = originalSubtotal - subtotal;
  
  const facilityFee = Math.round(subtotal * 0.05);
  const totalAmount = subtotal + facilityFee;

  // Split Price Calculations
  const splitCalculations = {
    full: {
      dueToday: totalAmount,
      installmentsCount: 1,
      installmentAmount: totalAmount,
      scheduleText: "100% settled upon order confirmation"
    },
    split_2: {
      dueToday: Math.ceil(totalAmount / 2),
      installmentsCount: 2,
      installmentAmount: Math.ceil(totalAmount / 2),
      scheduleText: "2 equal payments of $" + Math.ceil(totalAmount / 2).toLocaleString() + " (50% today, 50% in 30 days — 0% interest)"
    },
    split_4: {
      dueToday: Math.ceil(totalAmount / 4),
      installmentsCount: 4,
      installmentAmount: Math.ceil(totalAmount / 4),
      scheduleText: "4 bi-weekly payments of $" + Math.ceil(totalAmount / 4).toLocaleString() + " (0% interest, 0 hidden fees)"
    },
    group: {
      dueToday: Math.ceil(totalAmount / groupSplitCount),
      installmentsCount: groupSplitCount,
      installmentAmount: Math.ceil(totalAmount / groupSplitCount),
      scheduleText: `Split evenly among ${groupSplitCount} people ($${Math.ceil(totalAmount / groupSplitCount).toLocaleString()} per person)`
    }
  };

  const currentSplit = splitCalculations[splitMode];

  const handleApplyPromo = (codeToApply?: string) => {
    const code = (codeToApply || promoCodeInput).trim();
    if (!code) {
      setPromoError("Please enter a bonus or promo code.");
      return;
    }

    if (code === "258025" || code === "SPLIT50" || code === "SEAHAWKS50" || code === "12THMAN") {
      setAppliedPromo("VIP_258025");
      setPromoError(null);
      setPromoSuccessMsg("VIP Promo Applied: 50% Off Match Tickets & $3,000 Off Season Pass ($8,000 → $5,000)!");
    } else {
      setPromoError("Invalid promo code. Please check your VIP code and try again.");
      setPromoSuccessMsg(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoError(null);
    setPromoSuccessMsg(null);
  };

  const handleCopyGroupInvite = () => {
    const shareText = `Hey! Join my Seattle Seahawks ${selectedTier === "season_pass" ? "Season Pass" : "Match Ticket"} group! Our split total is $${totalAmount.toLocaleString()} ($${currentSplit.dueToday.toLocaleString()} per person for ${groupSplitCount} people). VIP discount active!`;
    navigator.clipboard.writeText(shareText);
    setGroupLinkCopied(true);
    setTimeout(() => setGroupLinkCopied(false), 2500);
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim()) {
      alert("Please provide your name and contact email for pass delivery.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderId = `${selectedTier === "season_pass" ? "PASS" : "TKT"}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      const ticketOrderData = {
        orderId,
        gameId: game.id,
        gameName: passName || game.name,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        stadium: game.stadium,
        city: game.city,
        date: game.date,
        time: game.time,
        tier: selectedTier,
        quantity,
        originalPricePerTicket,
        pricePerTicket: currentPricePerTicket,
        originalTotal: originalSubtotal + Math.round(originalSubtotal * 0.05),
        totalAmount,
        dueToday: currentSplit.dueToday,
        splitMode,
        groupSplitCount: splitMode === "group" ? groupSplitCount : 1,
        installmentsSummary: currentSplit.scheduleText,
        promoCodeApplied: appliedPromo,
        totalSavings,
        paymentMethod: paymentTab,
        selectedCrypto: paymentTab === "crypto" ? selectedCrypto : null,
        buyerName,
        buyerEmail,
        buyerPhone,
        paymentReference: paymentRef || (splitMode !== "full" ? `Split Payment (1 of ${currentSplit.installmentsCount})` : "Direct Verified Transfer"),
        receiptImage: paymentReceiptUrl,
        receiptImageUrl: paymentReceiptUrl,
        status: "pending",
        isApproved: false,
        createdAt: new Date().toISOString(),
        userId: auth.currentUser?.uid || "guest",
        userEmail: auth.currentUser?.email || buyerEmail
      };

      // Save to Firestore ticket_orders
      await setDoc(doc(db, "ticket_orders", orderId), ticketOrderData);
      
      // Also write to bookings so it's queryable in portfolio and Control Room
      await setDoc(doc(db, "bookings", orderId), {
        id: orderId,
        userId: auth.currentUser?.uid || "guest",
        userEmail: buyerEmail,
        senderName: buyerName,
        buyerName: buyerName,
        buyerPhone: buyerPhone,
        experienceId: game.id,
        experienceTitle: `${passName || game.name} · ${selectedTier.toUpperCase().replace("_", " ")} (${quantity}x)${appliedPromo ? " [VIP PROMO APPLIED]" : ""}${splitMode !== "full" ? ` [${splitMode.toUpperCase()}]` : ""}`,
        experienceType: selectedTier === "season_pass" ? "season_pass" : "match_ticket",
        date: game.date,
        timeSlot: game.time,
        guestsCount: quantity,
        totalPrice: totalAmount,
        dueToday: currentSplit.dueToday,
        tier: selectedTier,
        status: "pending",
        paymentMethod: paymentTab,
        paymentRef: paymentRef || "Direct Transfer",
        receiptImage: paymentReceiptUrl,
        receiptImageUrl: paymentReceiptUrl,
        qrCode: `NFL-${selectedTier === "season_pass" ? "SEASON-PASS" : "MATCH"}-${orderId}`,
        createdAt: new Date().toISOString(),
        imageUrl: game.image
      });

      setConfirmedTicket(ticketOrderData);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Ticket/Pass purchase dispatch error:", err);
      alert("Order logged! Support concierge will deliver your electronic RFID passes.");
      setConfirmedTicket({
        orderId: `${selectedTier === "season_pass" ? "PASS" : "TKT"}-${Date.now().toString(36).toUpperCase()}`,
        gameName: passName || game.name,
        tier: selectedTier,
        quantity,
        totalAmount,
        dueToday: currentSplit.dueToday,
        splitMode,
        buyerEmail,
        promoCodeApplied: appliedPromo,
        totalSavings
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] overflow-y-auto custom-scrollbar"
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 bg-zinc-800 hover:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {confirmedTicket ? (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-3xl flex items-center justify-center mx-auto text-amber-400 animate-pulse">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                PAYMENT RECEIPT SUBMITTED · PENDING MANAGER APPROVAL
              </span>
              <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                Reservation Logged For Review
              </h3>
              <p className="text-zinc-400 text-xs font-medium max-w-md mx-auto">
                Your payment reference and receipt proof have been delivered to the Control Room. Box office management will review your receipt to confirm payment and issue your official pass to <strong className="text-white">{confirmedTicket.buyerEmail}</strong>.
              </p>
            </div>

            <div className="p-6 bg-zinc-950 rounded-3xl border border-white/10 max-w-md mx-auto text-left space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-mono font-black text-white">{confirmedTicket.orderId}</span>
                </div>
                <span className="text-[10px] font-black uppercase bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded">
                  Pending Review
                </span>
              </div>

              {confirmedTicket.receiptImage && (
                <div className="p-2.5 bg-zinc-900 rounded-2xl border border-white/10 flex items-center gap-3">
                  <img
                    src={confirmedTicket.receiptImage}
                    alt="Uploaded Receipt"
                    className="w-12 h-12 object-cover rounded-xl border border-white/10 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Receipt Screenshot Attached
                    </p>
                    <p className="text-[9px] text-zinc-400 truncate">Queued for manager verification</p>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <h4 className="text-sm font-black uppercase italic text-white">{confirmedTicket.gameName}</h4>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-red-400" /> {game.location || `${game.stadium}, ${game.city}`}
                </p>
                <p className="text-[10px] text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-blue-400" /> {game.status || `${game.date} @ ${game.time}`}
                </p>
              </div>

              {confirmedTicket.promoCodeApplied && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <BadgePercent className="w-3.5 h-3.5" /> Bonus Code {confirmedTicket.promoCodeApplied} Applied
                  </span>
                  <span className="font-mono font-bold text-emerald-400">-${confirmedTicket.totalSavings?.toLocaleString()} Saved</span>
                </div>
              )}

              {confirmedTicket.splitMode && confirmedTicket.splitMode !== "full" && (
                <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-between text-xs">
                  <span className="text-[10px] font-black uppercase text-cyan-400 flex items-center gap-1">
                    <Divide className="w-3.5 h-3.5" /> Plan: {confirmedTicket.splitMode.toUpperCase()}
                  </span>
                  <span className="font-mono font-bold text-cyan-300">Today: ${confirmedTicket.dueToday?.toLocaleString()} USD</span>
                </div>
              )}

              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase text-zinc-500 block">
                    {confirmedTicket.splitMode && confirmedTicket.splitMode !== "full" ? "Total Order Value" : "Amount Paid"}
                  </span>
                  {confirmedTicket.dueToday && confirmedTicket.splitMode !== "full" && (
                    <span className="text-[10px] text-cyan-400 font-bold uppercase">
                      Due Today: ${confirmedTicket.dueToday.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-lg font-mono font-black text-emerald-400">${confirmedTicket.totalAmount.toLocaleString()} USD</span>
              </div>

              <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-center gap-2 text-amber-300">
                <Clock className="w-5 h-5 text-amber-400" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-zinc-300 font-bold">MANUAL MANAGER AUDIT IN PROGRESS</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
              <button
                onClick={onClose}
                className="px-8 py-3.5 bg-white hover:bg-zinc-200 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {/* Header Game Metadata Banner */}
            <div className="border-b border-white/10 pb-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-red-600/20 border border-red-500/30 text-red-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                  <Ticket className="w-3 h-3" /> {game.competition || "Pre Season · NFL"}
                </span>
                <span className="px-3 py-1 bg-blue-600/20 border border-blue-500/30 text-blue-400 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {game.status || `${game.date} @ ${game.time}`}
                </span>
                <span className="px-3 py-1 bg-zinc-800 text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" /> {game.location || `${game.stadium}, ${game.city}`}
                </span>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">
                    {game.name}
                  </h2>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">
                    Official NFL Box Office Match Tickets & Full Season Pass Reservations
                  </p>
                </div>

                {game.url && (
                  <a
                    href={game.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all self-start md:self-auto"
                  >
                    View on Ticketmaster <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Win Probability Bar if available */}
              {(game.winProbability || game.id.includes("sea-dal")) && (
                <div className="mt-4 p-3.5 bg-zinc-950/80 rounded-2xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider">
                    <span className="text-blue-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      Cowboys (Away): {game.winProbability?.away || "43.5%"}
                    </span>
                    <span className="text-zinc-500 font-mono text-[9px] flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-zinc-400" /> WIN PROBABILITY
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1.5">
                      Seahawks (Home): {game.winProbability?.home || "56.5%"}
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                    <div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: game.winProbability?.away || "43.5%" }} />
                    <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: game.winProbability?.home || "56.5%" }} />
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleCompleteOrder} className="space-y-6">
              {/* Step 1: Seat Tier & Quantity Selection */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    1. SELECT SEATING TIER OR SEASON PASS
                  </label>
                  <span className="text-[9px] font-black uppercase text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Season Pass Options Active
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                  {[
                    { 
                      id: "general", 
                      label: "General Admin", 
                      origPrice: originalTierRates.general, 
                      currPrice: discountedTierRates.general,
                      desc: "Upper Deck Bowl" 
                    },
                    { 
                      id: "lower_bowl", 
                      label: "Lower Bowl", 
                      origPrice: originalTierRates.lower_bowl, 
                      currPrice: discountedTierRates.lower_bowl,
                      desc: "50-Yard Line Views" 
                    },
                    { 
                      id: "club", 
                      label: "Club Level", 
                      origPrice: originalTierRates.club, 
                      currPrice: discountedTierRates.club,
                      desc: "Lounge & Hospitality" 
                    },
                    { 
                      id: "vip", 
                      label: "VIP Sideline", 
                      origPrice: originalTierRates.vip, 
                      currPrice: discountedTierRates.vip,
                      desc: "Tunnel + Food Included" 
                    },
                    { 
                      id: "season_pass", 
                      label: "Season Pass", 
                      origPrice: originalTierRates.season_pass, 
                      currPrice: discountedTierRates.season_pass,
                      desc: "All Season Home Matches",
                      isFeatured: true
                    },
                  ].map(tier => {
                    const isSelected = selectedTier === tier.id;
                    const hasDiscount = is258025Applied && tier.origPrice !== tier.currPrice;

                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setSelectedTier(tier.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden ${
                          isSelected 
                            ? tier.isFeatured
                              ? "bg-amber-500/15 border-amber-400 text-white shadow-lg shadow-amber-500/20"
                              : "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-600/10" 
                            : tier.isFeatured
                              ? "bg-zinc-950 border-amber-500/30 text-zinc-300 hover:border-amber-500/50"
                              : "bg-zinc-950 border-white/5 text-zinc-400 hover:border-white/20"
                        }`}
                      >
                        {tier.isFeatured && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-amber-600 text-black text-[7px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider">
                            Full Year Access
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-1">
                          <span className={`text-[10px] font-black uppercase ${tier.isFeatured ? "text-amber-400" : ""}`}>
                            {tier.label}
                          </span>
                          {isSelected && <Check className={`w-3.5 h-3.5 ${tier.isFeatured ? "text-amber-400" : "text-blue-400"}`} />}
                        </div>

                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-base font-mono font-black ${tier.isFeatured ? "text-amber-300" : "text-white"}`}>
                            ${tier.currPrice.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] font-mono text-zinc-500 line-through">
                              ${tier.origPrice.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {hasDiscount && (
                          <span className="inline-block mt-0.5 text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-mono">
                            {tier.id === "season_pass" ? "-$3,000 OFF" : "-50% OFF"}
                          </span>
                        )}

                        <div className="text-[8px] text-zinc-500 uppercase mt-1 leading-tight">{tier.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between bg-zinc-950 p-3.5 rounded-2xl border border-white/5">
                  <span className="text-xs font-black uppercase text-zinc-400">
                    {selectedTier === "season_pass" ? "Passes / Holders Count:" : "Quantity of Tickets:"}
                  </span>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {[1, 2, 3, 4, 6, 8].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setQuantity(qty)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-black font-mono transition-all ${
                          quantity === qty 
                            ? "bg-white text-black font-black" 
                            : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                        }`}
                      >
                        {qty}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bonus / VIP Promo Code Section */}
              <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      VIP Bonus & Promo Code
                    </span>
                  </div>
                  {is258025Applied ? (
                    <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" /> VIP Code Active
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase text-zinc-500">
                      Enter code to unlock instant rate reduction
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Enter promo / bonus code"
                      value={promoCodeInput}
                      onChange={(e) => {
                        setPromoCodeInput(e.target.value);
                        if (promoError) setPromoError(null);
                      }}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 tracking-wider uppercase"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyPromo()}
                      className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1"
                    >
                      <BadgePercent className="w-4 h-4" /> Apply Code
                    </button>

                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-bold text-xs uppercase rounded-xl transition-all"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {promoSuccessMsg && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 flex-shrink-0" />
                      {promoSuccessMsg}
                    </span>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded font-black">
                      Active
                    </span>
                  </div>
                )}

                {promoError && (
                  <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {promoError}
                  </div>
                )}
              </div>

              {/* Step 2: Split the Price & Multi-Pay Options */}
              <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Divide className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-black uppercase text-white tracking-wider">
                      2. SPLIT THE PRICE & PAYMENT PLANS
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-full w-fit">
                    0% Interest • Flexible Settlement
                  </span>
                </div>

                {/* Split Mode Selector Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: "full",
                      title: "Pay in Full (1x)",
                      badge: "Instant Pass",
                      amountText: `$${totalAmount.toLocaleString()}`,
                      subText: "100% full payment today",
                      icon: DollarSign,
                      color: "blue"
                    },
                    {
                      id: "split_2",
                      title: "2-Way Split (50/50)",
                      badge: "2 Equal Payments",
                      amountText: `$${Math.ceil(totalAmount / 2).toLocaleString()}/mo`,
                      subText: "50% today, 50% in 30 days",
                      icon: Layers,
                      color: "emerald"
                    },
                    {
                      id: "split_4",
                      title: "4-Pay Plan (4x)",
                      badge: "0% Interest",
                      amountText: `$${Math.ceil(totalAmount / 4).toLocaleString()}/ea`,
                      subText: "4 bi-weekly payments",
                      icon: CreditCard,
                      color: "purple"
                    },
                    {
                      id: "group",
                      title: "Group / Friends Split",
                      badge: "Multi-Holder",
                      amountText: `$${Math.ceil(totalAmount / groupSplitCount).toLocaleString()}/person`,
                      subText: `Even split among ${groupSplitCount} holders`,
                      icon: Users,
                      color: "amber"
                    }
                  ].map((mode) => {
                    const isSelected = splitMode === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setSplitMode(mode.id as any)}
                        className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/40"
                            : "bg-zinc-900 border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[8px] font-black uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded text-zinc-400">
                              {mode.badge}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                          </div>
                          <h4 className="text-xs font-black uppercase text-white tracking-tight flex items-center gap-1.5">
                            <mode.icon className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                            {mode.title}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2 border-t border-white/5">
                          <span className="text-sm font-mono font-black text-cyan-300 block">
                            {mode.amountText}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-medium block mt-0.5">
                            {mode.subText}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Group Split Customizer */}
                {splitMode === "group" && (
                  <div className="p-4 bg-zinc-900/90 rounded-2xl border border-amber-500/20 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4" /> Select Number of Co-Holders to Split:
                        </span>
                        <p className="text-[10px] text-zinc-400 mt-0.5">
                          Each person pays <strong className="text-white font-mono">${Math.ceil(totalAmount / groupSplitCount).toLocaleString()} USD</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {[2, 3, 4, 5, 6].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setGroupSplitCount(count)}
                            className={`w-8 h-8 rounded-xl text-xs font-black font-mono transition-all ${
                              groupSplitCount === count
                                ? "bg-amber-400 text-black font-black shadow-md shadow-amber-400/20"
                                : "bg-zinc-800 text-zinc-400 hover:text-white border border-white/5"
                            }`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2">
                      <div className="text-[10px] text-zinc-400">
                        Share this group split link with friends or co-members so everyone can submit their share:
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyGroupInvite}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all w-full sm:w-auto justify-center"
                      >
                        {groupLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                        {groupLinkCopied ? "Invite Copied!" : "Copy Split Invite"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Active Split Summary Banner */}
                <div className="p-3 bg-cyan-950/40 border border-cyan-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div>
                      <span className="text-[9px] font-black uppercase text-cyan-400 block tracking-wider">
                        Selected Settlement Plan
                      </span>
                      <span className="font-bold text-white text-xs">
                        {currentSplit.scheduleText}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase text-zinc-400 block">Due Now</span>
                    <span className="text-base font-mono font-black text-cyan-300">
                      ${currentSplit.dueToday.toLocaleString()} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 3: Payment Rails */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    3. OFFICIAL PAYMENT METHOD
                  </label>
                  <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> SECURE CONCIERGE SETTLEMENT
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "bank", label: "BMO Bank (Wire/ACH)", icon: Building2 },
                    { id: "cashapp", label: "Cash App", icon: Smartphone },
                    { id: "venmo", label: "Venmo", icon: Smartphone },
                    { id: "zelle", label: "Zelle", icon: Smartphone },
                    { id: "crypto", label: "Crypto (BTC/ETH/USDT)", icon: QrCode }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPaymentTab(tab.id as any)}
                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${
                        paymentTab === tab.id
                          ? "bg-white text-black border-white shadow-md"
                          : "bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/20"
                      }`}
                    >
                      <tab.icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Selected Payment Details Display */}
                <div className="p-4 sm:p-5 bg-zinc-950 rounded-2xl border border-white/10 space-y-4">
                  {/* Amount to send banner */}
                  <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-[8px] font-black uppercase text-zinc-500 block">
                        Amount to Send Now ({splitMode === "full" ? "Full Amount" : `Payment 1 of ${currentSplit.installmentsCount}`})
                      </span>
                      <span className="text-lg font-mono font-black text-emerald-400">
                        ${currentSplit.dueToday.toLocaleString()} USD
                      </span>
                    </div>
                    <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded font-bold">
                      {paymentTab.toUpperCase()} ACTIVE
                    </span>
                  </div>

                  {paymentTab === "bank" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-400" /> BMO Bank Wire & Direct ACH
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                          Domestic ACH & Wire
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Bank Name</span>
                            <span className="font-bold text-white">{OFFICIAL_PAYMENT_CHANNELS.bank.bankName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.bank.bankName, "bankName")}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            {copiedKey === "bankName" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Account Name</span>
                            <span className="font-bold text-white">{OFFICIAL_PAYMENT_CHANNELS.bank.accountName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.bank.accountName, "accountName")}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            {copiedKey === "accountName" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Account Number</span>
                            <span className="font-mono font-black text-cyan-300">{OFFICIAL_PAYMENT_CHANNELS.bank.accountNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.bank.accountNumber, "accountNum")}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            {copiedKey === "accountNum" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>

                        <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[8px] font-black uppercase text-zinc-500 block">Routing Number (Routine #)</span>
                            <span className="font-mono font-black text-amber-300">{OFFICIAL_PAYMENT_CHANNELS.bank.routingNumber}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.bank.routingNumber, "routingNum")}
                            className="text-zinc-500 hover:text-white p-1"
                          >
                            {copiedKey === "routingNum" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {paymentTab === "cashapp" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-emerald-400" /> Cash App Mobile Pay
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                          Instant Clearing
                        </span>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-black uppercase text-zinc-500 block">Official Cashtag</span>
                          <span className="text-lg font-mono font-black text-emerald-400">{OFFICIAL_PAYMENT_CHANNELS.cashapp.tag}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.cashapp.tag, "cashapp")}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          {copiedKey === "cashapp" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedKey === "cashapp" ? "Copied!" : "Copy Cashtag"}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentTab === "venmo" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-blue-400" /> Venmo Account
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-bold">
                          Instant Clearing
                        </span>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                        <div>
                          <span className="text-[8px] font-black uppercase text-zinc-500 block">Official Handle</span>
                          <span className="text-lg font-mono font-black text-blue-400">{OFFICIAL_PAYMENT_CHANNELS.venmo.handle}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.venmo.handle, "venmo")}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          {copiedKey === "venmo" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedKey === "venmo" ? "Copied!" : "Copy Venmo"}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentTab === "zelle" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-purple-400" /> Zelle Direct Bank Transfer
                        </span>
                        <span className="text-[9px] font-mono uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded font-bold">
                          0% Transfer Fees
                        </span>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-[8px] font-black uppercase text-zinc-500 block">Zelle Recipient Email & Name</span>
                          <span className="text-sm font-mono font-black text-purple-300 block">{OFFICIAL_PAYMENT_CHANNELS.zelle.email}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Name: {OFFICIAL_PAYMENT_CHANNELS.zelle.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.zelle.email, "zelle")}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto"
                        >
                          {copiedKey === "zelle" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          {copiedKey === "zelle" ? "Copied!" : "Copy Zelle"}
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentTab === "crypto" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <div className="flex gap-2">
                          {[
                            { id: "usdt", label: "USDT (ERC-20)" },
                            { id: "btc", label: "BTC (Bitcoin)" },
                            { id: "eth", label: "ETH (Ethereum)" }
                          ].map(c => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setSelectedCrypto(c.id as any)}
                              className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                selectedCrypto === c.id 
                                  ? "bg-blue-600 text-white" 
                                  : "bg-zinc-900 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {c.label}
                            </button>
                          ))}
                        </div>
                        <span className="text-[9px] font-mono uppercase text-zinc-400">
                          {OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].network}
                        </span>
                      </div>

                      <div className="p-4 bg-zinc-900 rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-black uppercase text-zinc-500">
                            {OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].name} DEPOSIT ADDRESS
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].address, "cryptoAddress")}
                            className="text-xs font-black uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1"
                          >
                            {copiedKey === "cryptoAddress" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedKey === "cryptoAddress" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                        <p className="text-xs font-mono break-all text-emerald-400 font-bold bg-zinc-950 p-2.5 rounded-lg select-all">
                          {OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 4: Contact & Order Details */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  4. TICKET HOLDER & DELIVERY CONTACT
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[8px] font-black uppercase text-zinc-500 mb-1">Full Name</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jon Doe"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="block text-[8px] font-black uppercase text-zinc-500 mb-1">Email (For Barcode Dispatch)</span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. example@gmail.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="block text-[8px] font-black uppercase text-zinc-500 mb-1">Phone Number (Optional SMS Pass)</span>
                    <input
                      type="tel"
                      placeholder="e.g. +1 (555) 019-2834"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <span className="block text-[8px] font-black uppercase text-zinc-500 mb-1">Payment Reference / Transaction ID</span>
                    <input
                      type="text"
                      placeholder="e.g. CashApp tag / Wire Ref / Hash"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Upload Payment Screenshot or Picture of Receipt */}
                <div className="pt-2">
                  <PaymentReceiptUploader
                    value={paymentReceiptUrl}
                    onChange={setPaymentReceiptUrl}
                    label="Attach Payment Receipt / Screenshot Proof"
                    description="Upload or drag & drop a screenshot of your payment confirmation, wire slip, or receipt for manager approval."
                    required={false}
                  />
                </div>
              </div>

              {/* Order Total & Submit Bar */}
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/10 space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center text-zinc-400">
                    <span>
                      {selectedTier === "season_pass" ? "Season Pass" : "Match Ticket"} ({quantity}x @ ${currentPricePerTicket.toLocaleString()})
                    </span>
                    <span className="font-mono text-white font-bold">${subtotal.toLocaleString()}</span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between items-center text-emerald-400">
                      <span className="flex items-center gap-1 font-bold">
                        <Tag className="w-3.5 h-3.5" /> Bonus Code Discount ({appliedPromo})
                      </span>
                      <span className="font-mono font-bold">-${totalSavings.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-zinc-400">
                    <span>Digital Barcode & Gate Processing Fee</span>
                    <span className="font-mono text-zinc-300">${facilityFee.toLocaleString()}</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-black uppercase text-white block">
                        {splitMode === "full" ? "Total Amount Due" : "Total Order Value"}
                      </span>
                      {splitMode !== "full" && (
                        <span className="text-[10px] text-cyan-400 font-bold uppercase block">
                          Plan: {currentSplit.scheduleText}
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-2 justify-end">
                        {totalSavings > 0 && (
                          <span className="text-xs font-mono text-zinc-500 line-through">
                            ${(originalSubtotal + Math.round(originalSubtotal * 0.05)).toLocaleString()}
                          </span>
                        )}
                        <span className="text-2xl font-mono font-black text-emerald-400">
                          ${totalAmount.toLocaleString()} USD
                        </span>
                      </div>
                      {totalSavings > 0 && (
                        <span className="text-[10px] text-emerald-400 font-bold uppercase block">
                          You save ${totalSavings.toLocaleString()} with code {appliedPromo}!
                        </span>
                      )}
                    </div>
                  </div>

                  {splitMode !== "full" && (
                    <div className="p-3 bg-cyan-950/60 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase">
                        <Divide className="w-4 h-4 text-cyan-400" />
                        <span>Amount Due Today:</span>
                      </div>
                      <span className="text-xl font-mono font-black text-cyan-300">
                        ${currentSplit.dueToday.toLocaleString()} USD
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>Verifying Dispatch...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" /> {splitMode === "full" ? `Confirm & Issue Pass ($${totalAmount.toLocaleString()})` : `Confirm & Settle Today's Split ($${currentSplit.dueToday.toLocaleString()})`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>
  );
};
