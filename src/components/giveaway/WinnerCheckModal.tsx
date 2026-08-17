import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Trophy,
  Gift,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  Truck,
  MapPin,
  Mail,
  User,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Phone,
  Package
} from "lucide-react";
import { collection, query, where, getDocs, doc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { FanProfile, GiveawayWinner, GiveawayEntry } from "../../types/giveaway";
import { NFL_TEAMS } from "../../constants";
import { cn } from "../../lib/utils";

interface WinnerCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  savedFanProfile?: FanProfile | null;
  onOpenRegisterModal?: () => void;
  onViewFanCard?: (fan: FanProfile) => void;
}

interface WinnerResult {
  isWinner: boolean;
  fanProfile?: FanProfile;
  winnerRecords: GiveawayWinner[];
  activeEntries: GiveawayEntry[];
  prizeName?: string;
  claimCode?: string;
  winningMessage?: string;
  claimStatus?: string;
}

export const WinnerCheckModal: React.FC<WinnerCheckModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  savedFanProfile,
  onOpenRegisterModal,
  onViewFanCard
}) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchPerformed, setSearchPerformed] = useState<boolean>(false);
  const [result, setResult] = useState<WinnerResult | null>(null);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Claim form state
  const [showClaimForm, setShowClaimForm] = useState<boolean>(false);
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [deliveryNotes, setDeliveryNotes] = useState<string>("");
  const [isSubmittingClaim, setIsSubmittingClaim] = useState<boolean>(false);
  const [claimSubmitted, setClaimSubmitted] = useState<boolean>(false);
  const [claimReceiptId, setClaimReceiptId] = useState<string>("");

  // Pre-populate search query if user or fan profile exists
  useEffect(() => {
    if (isOpen) {
      const defaultEmail = currentUser?.email || savedFanProfile?.email || savedFanProfile?.fanCode || "";
      if (defaultEmail && !searchQuery) {
        setSearchQuery(defaultEmail);
      }
      setSearchPerformed(false);
      setResult(null);
      setShowClaimForm(false);
      setClaimSubmitted(false);
    }
  }, [isOpen, currentUser, savedFanProfile]);

  if (!isOpen) return null;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const queryTerm = searchQuery.trim().toLowerCase();
    if (!queryTerm) return;

    setIsSearching(true);
    setSearchPerformed(true);
    setShowClaimForm(false);
    setClaimSubmitted(false);

    try {
      let matchedFan: FanProfile | undefined = undefined;
      const winnerRecords: GiveawayWinner[] = [];
      const activeEntries: GiveawayEntry[] = [];

      // 1. Search registered_fans by email or fanCode
      try {
        const fansRef = collection(db, "registered_fans");
        const fanSnap = await getDocs(fansRef);
        fanSnap.forEach((d) => {
          const data = d.data() as FanProfile;
          if (
            (data.email && data.email.toLowerCase() === queryTerm) ||
            (data.fanCode && data.fanCode.toLowerCase() === queryTerm) ||
            (data.fullName && data.fullName.toLowerCase().includes(queryTerm))
          ) {
            matchedFan = { id: d.id, ...data };
          }
        });
      } catch (err) {
        console.error("Error querying fans:", err);
      }

      // Check local saved fan profile if not found in db query
      if (!matchedFan && savedFanProfile) {
        if (
          savedFanProfile.email?.toLowerCase() === queryTerm ||
          savedFanProfile.fanCode?.toLowerCase() === queryTerm
        ) {
          matchedFan = savedFanProfile;
        }
      }

      // 2. Search giveaway_winners collection
      try {
        const winnersRef = collection(db, "giveaway_winners");
        const winnersSnap = await getDocs(winnersRef);
        winnersSnap.forEach((d) => {
          const w = d.data() as GiveawayWinner;
          if (
            (w.winnerEmail && w.winnerEmail.toLowerCase() === queryTerm) ||
            (w.winnerFanCode && w.winnerFanCode.toLowerCase() === queryTerm) ||
            (matchedFan && w.winnerFanCode === matchedFan.fanCode) ||
            (matchedFan && w.winnerEmail?.toLowerCase() === matchedFan.email?.toLowerCase())
          ) {
            winnerRecords.push({ id: d.id, ...w });
          }
        });
      } catch (err) {
        console.error("Error querying winners:", err);
      }

      // 3. Search giveaway_entries collection
      try {
        const entriesRef = collection(db, "giveaway_entries");
        const entriesSnap = await getDocs(entriesRef);
        entriesSnap.forEach((d) => {
          const entry = d.data() as GiveawayEntry;
          if (
            (entry.userEmail && entry.userEmail.toLowerCase() === queryTerm) ||
            (entry.fanCode && entry.fanCode.toLowerCase() === queryTerm) ||
            (matchedFan && entry.fanCode === matchedFan.fanCode)
          ) {
            activeEntries.push({ id: d.id, ...entry });
          }
        });
      } catch (err) {
        console.error("Error querying entries:", err);
      }

      // Determine winning state
      const isFanMarkedWinner = matchedFan?.isWinner === true;
      const hasWinnerRecord = winnerRecords.length > 0;
      const hasWinningEntry = activeEntries.some((e) => e.status === "WINNER");
      const isWinner = isFanMarkedWinner || hasWinnerRecord || hasWinningEntry;

      const prizeName =
        winnerRecords[0]?.prizeName ||
        matchedFan?.winningPrize ||
        activeEntries.find((e) => e.status === "WINNER")?.giveawayTitle ||
        "Official NFL Player Memorabilia Prize";

      const claimCode =
        winnerRecords[0]?.claimCode ||
        matchedFan?.claimCode ||
        activeEntries.find((e) => e.claimCode)?.claimCode ||
        (matchedFan ? `CLAIM-${matchedFan.fanCode.replace(/[^0-9]/g, "") || Date.now().toString().slice(-5)}` : "CLAIM-VIP77");

      const winningMessage =
        winnerRecords[0]?.careMessage ||
        matchedFan?.winningMessage ||
        "Congratulations! You have been officially selected as the winner of this player campaign. Claim your prize below!";

      const claimStatus =
        winnerRecords[0]?.status ||
        matchedFan?.claimStatus ||
        "PENDING_CLAIM";

      setResult({
        isWinner,
        fanProfile: matchedFan,
        winnerRecords,
        activeEntries,
        prizeName,
        claimCode,
        winningMessage,
        claimStatus
      });
    } catch (err) {
      console.error("Error during winner check:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCopyClaimCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result || !shippingAddress.trim()) return;

    setIsSubmittingClaim(true);
    try {
      const email = result.fanProfile?.email || searchQuery;
      const fanCode = result.fanProfile?.fanCode || "FAN-WINNER";
      const name = result.fanProfile?.fullName || searchQuery.split("@")[0] || "Verified Winner";
      const prize = result.prizeName || "Official Player Giveaway Prize";
      const claimCode = result.claimCode || "CLAIM-VERIFIED";
      const ticketId = `claim-dispatch-${Date.now()}`;

      // 1. Log in customer inquiries / concierge dispatch queue
      await setDoc(doc(db, "customer_inquiries", ticketId), {
        id: ticketId,
        type: "GIVEAWAY_PRIZE_CLAIM",
        userEmail: email,
        userName: name,
        fanCode: fanCode,
        claimCode: claimCode,
        prizeName: prize,
        shippingAddress: shippingAddress.trim(),
        phoneNumber: phoneNumber.trim(),
        deliveryNotes: deliveryNotes.trim(),
        timestamp: Date.now(),
        status: "GIFT_CLAIM_SUBMITTED"
      });

      // 2. Create customer support fan ticket for immediate fulfillment
      const reqId = `gift-req-${Date.now()}`;
      await setDoc(doc(db, "fan_card_requests", reqId), {
        id: reqId,
        userId: result.fanProfile?.userId || "guest",
        userName: name,
        userEmail: email,
        contactMethod: "email",
        teamId: result.fanProfile?.favoriteTeam || "NFL",
        timestamp: Date.now(),
        status: "pending",
        message: `[WINNER PRIZE CLAIM CONFIRMED]\nFan: ${name} (${fanCode})\nEmail: ${email}\nPrize: ${prize}\nClaim Code: ${claimCode}\nShipping Address:\n${shippingAddress.trim()}\nPhone: ${phoneNumber.trim() || "N/A"}\nDelivery Notes: ${deliveryNotes.trim() || "None"}`,
        replies: []
      });

      // 3. Update registered_fans status if exists
      if (result.fanProfile?.id) {
        try {
          await updateDoc(doc(db, "registered_fans", result.fanProfile.id), {
            claimStatus: "CLAIMED",
            shippingAddress: shippingAddress.trim(),
            updatedAt: Date.now()
          });
        } catch (e) {}
      }

      setClaimReceiptId(ticketId);
      setClaimSubmitted(true);
      setShowClaimForm(false);
    } catch (err: any) {
      console.error("Error submitting claim:", err);
      alert("Error submitting claim details: " + err.message);
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/15 rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-white my-8 overflow-hidden text-left">
        {/* Background glow accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="space-y-2 mb-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            INSTANT WINNER VERIFICATION
          </div>

          <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white">
            Check If You Won A Giveaway
          </h2>

          <p className="text-xs text-zinc-400 font-medium">
            Enter your registered email address or unique Fan Code to instantly verify if you won an autographed jersey, player memorabilia, or VIP pass.
          </p>
        </div>

        {/* Search Input Box */}
        <form onSubmit={handleSearch} className="space-y-3 mb-6 relative z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Enter your email (e.g. fan@example.com) or Fan Code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900 border border-white/15 pl-11 pr-4 py-3.5 rounded-2xl text-xs md:text-sm text-white placeholder-zinc-500 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isSearching ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Status</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Auto-Fill suggestions if user logged in */}
          {currentUser?.email && searchQuery !== currentUser.email && (
            <div className="flex items-center gap-2 text-[10px] text-zinc-400">
              <span>Logged in as:</span>
              <button
                type="button"
                onClick={() => setSearchQuery(currentUser.email)}
                className="text-blue-400 hover:underline font-bold font-mono"
              >
                {currentUser.email}
              </button>
            </div>
          )}
        </form>

        {/* Search Results Display */}
        {searchPerformed && result && (
          <div className="space-y-4 relative z-10 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {result.isWinner ? (
              /* WINNER STATE */
              <div className="p-6 md:p-8 rounded-[2rem] bg-gradient-to-br from-amber-950/40 via-zinc-900 to-zinc-950 border-2 border-amber-500/50 shadow-2xl relative overflow-hidden space-y-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

                {/* Winner Header Banner */}
                <div className="flex items-start justify-between gap-4 border-b border-amber-500/20 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black text-2xl shadow-lg shadow-amber-500/30">
                      🏆
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-400" /> OFFICIAL WINNER CONFIRMED
                      </span>
                      <h3 className="text-xl md:text-2xl font-black italic uppercase text-white">
                        YOU HAVE WON!
                      </h3>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                    {result.claimStatus === "CLAIMED" ? "Claimed & Processing" : "Gift Ready To Claim"}
                  </span>
                </div>

                {/* Prize Details Card */}
                <div className="p-4 bg-black/40 border border-white/10 rounded-2xl space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block">
                      YOUR OFFICIAL PRIZE
                    </span>
                    <p className="text-lg md:text-xl font-black italic text-amber-300 mt-0.5">
                      {result.prizeName}
                    </p>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    {result.winningMessage}
                  </p>

                  {/* Fan & Claim Code Pill */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {result.fanProfile?.fanCode && (
                      <div className="px-3 py-1.5 bg-zinc-900 border border-white/10 rounded-xl">
                        <span className="text-[9px] text-zinc-500 font-black block uppercase">FAN CODE</span>
                        <span className="text-xs font-mono font-black text-cyan-400">{result.fanProfile.fanCode}</span>
                      </div>
                    )}

                    {result.claimCode && (
                      <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
                        <div>
                          <span className="text-[9px] text-amber-400 font-black block uppercase">OFFICIAL CLAIM CODE</span>
                          <span className="text-xs font-mono font-black text-white">{result.claimCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyClaimCode(result.claimCode!)}
                          className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-300 transition-colors cursor-pointer"
                          title="Copy Claim Code"
                        >
                          {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Claim Confirmation Success Alert */}
                {claimSubmitted ? (
                  <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-white">
                        Prize Claim Successfully Submitted!
                      </h4>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Our official Player Concierge and Customer Care team has received your shipping details. We are packaging your authenticated prize for dispatch. You will receive dispatch updates via email at <strong className="text-white">{result.fanProfile?.email || searchQuery}</strong>.
                    </p>
                    <p className="text-[10px] font-mono text-emerald-400 pt-1">
                      Tracking Receipt ID: {claimReceiptId}
                    </p>
                  </div>
                ) : showClaimForm ? (
                  /* Claim Shipping Address Form */
                  <form onSubmit={handleSubmitClaim} className="p-5 rounded-2xl bg-zinc-950 border border-amber-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                        <Truck className="w-4 h-4" />
                        Enter Delivery & Shipping Address
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowClaimForm(false)}
                        className="text-[10px] text-zinc-400 hover:text-white uppercase font-bold"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                          Full Street Address (Street, Apt/Suite, City, State, ZIP) *
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder="e.g. 1234 Stadium Way, Suite 400, Seattle, WA 98134"
                          value={shippingAddress}
                          onChange={(e) => setShippingAddress(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 p-2.5 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                            Contact Phone (For Courier Delivery)
                          </label>
                          <input
                            type="tel"
                            placeholder="+1 (555) 000-0000"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-zinc-400 block mb-1">
                            Special Delivery Instructions
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Leave at front door, gate code"
                            value={deliveryNotes}
                            onChange={(e) => setDeliveryNotes(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 px-3 py-2 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingClaim || !shippingAddress.trim()}
                      className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isSubmittingClaim ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                          <span>Submitting Dispatch Request...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm Shipping & Dispatch My Prize</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Action Buttons */
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowClaimForm(true)}
                      className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest rounded-xl shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Claim Prize & Set Delivery Address</span>
                    </button>

                    {result.fanProfile && onViewFanCard && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onViewFanCard(result.fanProfile!);
                        }}
                        className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 font-black text-xs uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-cyan-400" />
                        <span>View Winner Fan Card</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : result.activeEntries.length > 0 ? (
              /* ACTIVE ENTRIES BUT NO WIN YET */
              <div className="p-6 rounded-[2rem] bg-zinc-900/90 border border-blue-500/30 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-lg">
                    📋
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">
                      ACTIVE ENTRIES VERIFIED
                    </span>
                    <h4 className="text-base font-black italic uppercase text-white">
                      You Are In The Running!
                    </h4>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed">
                  We found <strong className="text-white">{result.activeEntries.length} active giveaway entry(ies)</strong> for this account. Winner selection drawings are conducted periodically by team coordinators.
                </p>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    Your Entered Campaigns:
                  </span>
                  {result.activeEntries.map((e, idx) => (
                    <div
                      key={e.id || idx}
                      className="p-3 bg-zinc-950 border border-white/5 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-white">{e.giveawayTitle}</p>
                        <p className="text-[10px] text-zinc-500">Player: {e.playerName || "NFL Star"}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[9px] font-black uppercase">
                        Active Entry
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* NO RECORD FOUND */
              <div className="p-6 rounded-[2rem] bg-zinc-900/60 border border-white/10 text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800 text-zinc-400 flex items-center justify-center font-black text-xl mx-auto">
                  🔍
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-black italic uppercase text-white">
                    No Registered Giveaway Entries Found
                  </h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    We could not find an active fan profile or giveaway entries registered under <strong className="text-white">{searchQuery}</strong>.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  {onOpenRegisterModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenRegisterModal();
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Register As Fan In 30 Seconds</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
