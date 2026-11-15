import React, { useEffect, useState } from "react";
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
  AlertTriangle,
  DollarSign, 
  Smartphone, 
  Radio, 
  Layers, 
  Lock,
  Heart,
  Building2,
  CreditCard
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, safeSetDoc } from "../lib/firebase";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { cn } from "../lib/utils";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";

interface PlayerInquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlayer?: string;
  initialTeamId?: string;
  initialObjective?: string;
  initialFullName?: string;
  initialEmail?: string;
  initialMessagingPlatform?: "whatsapp" | "zangi" | "telegram";
  initialMessagingDetails?: string;
  initialSpecialNotes?: string;
  initialStep?: "details" | "payment";
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
  initialObjective,
  initialFullName,
  initialEmail,
  initialMessagingPlatform,
  initialMessagingDetails,
  initialSpecialNotes,
  initialStep,
  onOpenTicketPortal
}) => {
  const [step, setStep] = useState<"details" | "payment" | "success">("details");

  // Form State
  const [fullName, setFullName] = useState(() => initialFullName || localStorage.getItem("nfl_guest_sender_name") || "");
  const [email, setEmail] = useState(() => initialEmail || localStorage.getItem("nfl_guest_buyer_email") || "");
  const [phone, setPhone] = useState(() => localStorage.getItem("nfl_guest_buyer_phone") || "");
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || "KC");
  const [teamSearch, setTeamSearch] = useState("");
  const [favoritePlayer, setFavoritePlayer] = useState(initialPlayer || "");
  const [messagingPlatform, setMessagingPlatform] = useState<string>(initialMessagingPlatform || "whatsapp");
  const [messagingDetails, setMessagingDetails] = useState(initialMessagingDetails || "");
  const [inquiryObjective, setInquiryObjective] = useState<string>(initialObjective || INQUIRY_OBJECTIVES[0]);
  const [specialNotes, setSpecialNotes] = useState(initialSpecialNotes || "");

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<"cashapp" | "crypto" | "paypal" | "venmo" | "zelle" | "giftcard" | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [receiptImageUrls, setReceiptImageUrls] = useState<string[]>([]);
  const [giftCardDetails, setGiftCardDetails] = useState({ brand: "Apple", cardNumber: "", pin: "", amount: "100" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Completed Inquiry Session Data
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState(() => `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const resolvedName = (initialFullName || localStorage.getItem("nfl_guest_sender_name") || "").trim();
    const resolvedEmail = (initialEmail || localStorage.getItem("nfl_guest_buyer_email") || "").trim();
    const resolvedPlayer = (initialPlayer || "").trim();
    const resolvedPlatform = initialMessagingPlatform || "whatsapp";
    const resolvedMessaging = (initialMessagingDetails || "").trim();

    if (initialPlayer !== undefined) setFavoritePlayer(initialPlayer);
    if (initialTeamId) setSelectedTeamId(initialTeamId);
    if (initialObjective) setInquiryObjective(initialObjective);
    if (initialFullName) setFullName(initialFullName);
    if (initialEmail) setEmail(initialEmail);
    if (initialMessagingPlatform) setMessagingPlatform(initialMessagingPlatform);
    if (initialMessagingDetails !== undefined) setMessagingDetails(initialMessagingDetails);
    if (initialSpecialNotes !== undefined) setSpecialNotes(initialSpecialNotes);

    setCheckoutSessionId(`INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setFormError(null);
    setPaymentMethod(null);
    setPaymentRef("");
    setReceiptImageUrl("");
    setReceiptImageUrls([]);
    setCompletedOrder(null);

    const canStartOnPayment =
      initialStep === "payment" &&
      resolvedName.length > 0 &&
      resolvedEmail.includes("@") &&
      resolvedPlayer.length > 0 &&
      resolvedMessaging.length > 0;

    setStep(canStartOnPayment ? "payment" : "details");
  }, [
    isOpen,
    initialPlayer,
    initialTeamId,
    initialObjective,
    initialFullName,
    initialEmail,
    initialMessagingPlatform,
    initialMessagingDetails,
    initialSpecialNotes,
    initialStep,
  ]);

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

    setPaymentMethod(null);
    setStep("payment");
  };

  const hasRequiredProfileFields =
    fullName.trim().length > 0 &&
    email.trim().includes("@") &&
    favoritePlayer.trim().length > 0 &&
    messagingDetails.trim().length > 0;
  const hasReceiptProof =
    receiptImageUrls.length > 0 || receiptImageUrl.trim().length > 0;
  const hasValidGiftCard =
    paymentMethod !== "giftcard" || giftCardDetails.cardNumber.trim().length > 0;
  const hasSelectedSupportedPayment = paymentMethod !== null;
  const canSubmitInquiry =
    hasRequiredProfileFields &&
    hasSelectedSupportedPayment &&
    hasValidGiftCard &&
    hasReceiptProof &&
    !isSubmitting;

  const handleFinalizeInquiry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!hasRequiredProfileFields) {
      setFormError("Please complete your Full Name, Email Address, Favorite Player, and Preferred Messaging details.");
      return;
    }

    if (!paymentMethod) {
      setFormError("Please select a payment channel to complete your $100 charitable contribution.");
      return;
    }

    if (paymentMethod === "giftcard" && !giftCardDetails.cardNumber.trim()) {
      setFormError(`Please enter your ${giftCardDetails.brand || "Gift Card"} code or PIN.`);
      return;
    }

    if (!hasReceiptProof) {
      setFormError("Proof of payment is required. Please upload a valid payment receipt or screenshot before submitting your inquiry.");
      return;
    }

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
        securitySignature: "SHA-256 PLAYER INQUIRY $100 CHARITABLE CONTRIBUTION",
        experienceId: "exp-player-inquiry-session",
        gameId: "exp-player-inquiry-session",
        experienceTitle: `NFL STAR PLAYER INQUIRY: ${favoritePlayer.toUpperCase()} (${selectedTeam.city} ${selectedTeam.name})`,
        gameName: `NFL Player Inquiry Session: ${favoritePlayer}`,
        eventTitle: `NFL Player Inquiry Session: ${favoritePlayer}`,
        itemName: `NFL Player Inquiry Session (${favoritePlayer}) - $100 Charitable Contribution`,
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
        date: "Coordinated once payment receipt is verified",
        eventDate: "Awaiting Receipt Verification",
        displayDate: "Coordinated after receipt verification",
        formattedDate: "Awaiting Receipt Verification",
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
        isCharityContribution: true,
        charityNote: "100% of the $100 charitable contribution goes directly to charity",
        messagingPlatform: platformName,
        messagingDetails: messagingDetails.trim(),
        inquiryObjective: inquiryObjective,
        specialNotes: specialNotes.trim(),
        inquiryStatus: "awaiting_verification",
        playerDetailsStatus: "awaiting_verification",
        buyerName: fullName.trim(),
        userName: fullName.trim(),
        senderName: fullName.trim(),
        passholderName: fullName.trim(),
        buyerEmail: email.trim(),
        userEmail: email.trim(),
        email: email.trim(),
        userId: auth.currentUser?.uid || `guest_${Date.now()}`,
        buyerPhone: phone.trim() || messagingDetails.trim(),
        status: "pending", // Payment receipt awaiting administrator verification
        orderStatus: "PAYMENT RECEIPT AWAITING VERIFICATION",
        approvalStatus: "RECEIPT UPLOADED ($100) · AWAITING ADMIN VERIFICATION",
        isApproved: false,
        verificationNotice: `AUDITED BY NFL GRIDIRON EXECUTIVE TREASURY · $100 CHARITABLE CONTRIBUTION RECEIPT SUBMITTED FOR ${favoritePlayer.toUpperCase()}`,
        paymentMethod: paymentMethod,
        paymentSessionId: checkoutSessionId,
        paymentReference: paymentRef || `INQ-${checkoutSessionId}`,
        paymentRef: paymentRef || `INQ-${checkoutSessionId}`,
        paymentChannel: paymentMethod.toUpperCase(),
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImageUrl: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImages: receiptImageUrls.length > 0 ? receiptImageUrls : (receiptImageUrl ? [receiptImageUrl] : []),
        ...(paymentMethod === "giftcard" ? { giftCardDetails } : {}),
        createdAt: nowIso,
        updatedAt: nowIso,
        imageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200",
        ticketImageUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200",
        features: [
          `Target Player Inquired: ${favoritePlayer.trim()}`,
          `Franchise: ${selectedTeam.city} ${selectedTeam.name}`,
          `100% of the $100 inquiry fee goes directly to charity`,
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
        id: `order-${orderId}`,
        orderId: orderId,
        sessionId: checkoutSessionId,
        paymentSessionId: checkoutSessionId,
        userId: auth.currentUser?.uid || "guest",
        userEmail: email.trim(),
        buyerName: fullName.trim(),
        buyerPhone: phone.trim() || messagingDetails.trim(),
        itemType: "ticket",
        itemName: `NFL Player Inquiry Session (${favoritePlayer.trim()}) [${platformName}]`,
        price: finalPrice,
        teamId: selectedTeam.id,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef || `INQ-${checkoutSessionId}`,
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImageUrl: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImages: receiptImageUrls.length > 0 ? receiptImageUrls : (receiptImageUrl ? [receiptImageUrl] : []),
        status: "pending_approval",
        orderStatus: "PAYMENT RECEIPT AWAITING VERIFICATION",
        isApproved: false,
        favoritePlayer: favoritePlayer.trim(),
        messagingPlatform: platformName,
        messagingDetails: messagingDetails.trim(),
        timestamp: nowIso
      });

      // 4. Also store in customer_inquiries collection for real-time concierge dispatch
      await safeSetDoc(doc(db, "customer_inquiries", orderId), {
        id: orderId,
        orderId: orderId,
        sessionId: checkoutSessionId,
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
        receiptImageUrl: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImages: receiptImageUrls.length > 0 ? receiptImageUrls : (receiptImageUrl ? [receiptImageUrl] : []),
        status: "pending",
        orderStatus: "PAYMENT RECEIPT AWAITING VERIFICATION",
        isApproved: false,
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
      setFormError("Could not generate PDF directly. Please take a screenshot or use the Ticket Portal.");
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
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-400">
              <Sparkles className="w-3.5 h-3.5" />
              NFL Roster Concierge
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-mono font-black text-emerald-300">
              <Heart className="w-3 h-3 fill-emerald-400/30" />
              $100 FEE · 100% GOES TO CHARITY
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-white">
            CUSTOM NFL PLAYER INQUIRY & LIAISON
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-lg font-medium leading-relaxed">
            Inquire about any active NFL superstar or roster talent across all 32 franchises. <strong className="text-emerald-300">100% of your $100 inquiry fee goes directly to charity</strong> while our team connects with player representation.
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
              <span>$100 Contribution & Proof</span>
            </div>
            <ArrowRight className="w-3 h-3 text-zinc-700" />
            <div className={cn("flex items-center gap-1.5", step === "success" ? "text-emerald-400" : "text-zinc-500")}>
              <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "success" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400")}>3</span>
              <span>Awaiting Verification</span>
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

              {/* Pre-Payment $100 Charitable Contribution Explanation & Submission Rules */}
              <div className="p-5 bg-gradient-to-br from-emerald-950/50 via-zinc-900 to-zinc-950 rounded-3xl border border-emerald-500/30 space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-300 tracking-wider inline-flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
                    Before You Begin Payment: Required $100 Charitable Contribution
                  </span>
                  <h4 className="text-sm font-black uppercase tracking-tight text-white">
                    100% of Your $100 Contribution Goes to Charity
                  </h4>
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    To submit an official NFL player inquiry, customers must complete a mandatory <strong className="text-emerald-300">$100 charitable contribution</strong> before submission. Every dollar directly supports youth athletics and community outreach programs.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                  <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10">
                    <span className="text-[9px] font-mono font-black uppercase text-blue-400 block">Step 1 · Contribute $100</span>
                    <p className="text-zinc-300 mt-0.5 leading-snug">Complete the $100 contribution via Cash App, PayPal, Venmo, Zelle, Crypto, or Gift Card.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10">
                    <span className="text-[9px] font-mono font-black uppercase text-amber-400 block">Step 2 · Upload Receipt</span>
                    <p className="text-zinc-300 mt-0.5 leading-snug">Attach a valid receipt or screenshot before submitting your inquiry.</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-zinc-950/80 border border-white/10">
                    <span className="text-[9px] font-mono font-black uppercase text-emerald-400 block">Step 3 · Verify & Notify</span>
                    <p className="text-zinc-300 mt-0.5 leading-snug">Once verified by our admin, we notify you on WhatsApp, Zangi, or Telegram to proceed.</p>
                  </div>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transform active:scale-95 cursor-pointer"
                  >
                    <span>Continue to $100 Payment & Receipt Upload</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
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
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Charity Inquiry Fee</span>
                  <span className="text-xl font-mono font-black text-emerald-400">${finalPrice} USD</span>
                </div>
              </div>

              {/* Charity Transparency Banner */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                <Heart className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5 fill-emerald-400/20" />
                <p className="text-xs text-emerald-100 leading-relaxed">
                  <strong className="text-emerald-300 uppercase tracking-wide">100% Goes to Charity:</strong> Your ${finalPrice} USD player inquiry fee is donated directly to charity—helping fund youth football &amp; community outreach initiatives.
                </p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Select Payment Channel (All Systems Active)</span>
                  <span className="text-[9px] font-mono text-emerald-400">5% OFF WITH BITCOIN ($95)</span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: "cashapp", name: "Cash App", badge: "ACTIVE", icon: Smartphone },
                    { id: "paypal", name: "PayPal", badge: "ACTIVE", icon: DollarSign },
                    { id: "venmo", name: "Venmo", badge: "ACTIVE", icon: Radio },
                    { id: "zelle", name: "Zelle", badge: "ACTIVE", icon: CheckCircle2 },
                    { id: "crypto", name: "Bitcoin (BTC / Crypto)", badge: "5% OFF ($95)", icon: ShieldCheck },
                    { id: "giftcard", name: "Gift Card", badge: "INSTANT", icon: Layers }
                  ].map(m => {
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setFormError(null);
                          if (paymentMethod !== m.id) {
                            setPaymentRef("");
                          }
                          setPaymentMethod(m.id as any);
                        }}
                        className={cn(
                          "p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between",
                          isSelected
                            ? "bg-zinc-900 border-blue-500 ring-1 ring-blue-500/30 text-white shadow-lg"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/15 text-zinc-400"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <m.icon className={cn("w-4 h-4", isSelected ? "text-blue-400" : "text-zinc-400")} />
                          <span className={cn(
                            "text-[8px] font-mono font-bold px-1.5 py-0.2 rounded",
                            m.id === "crypto"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : m.id === "giftcard"
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-blue-500/15 text-blue-300"
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
              {!paymentMethod ? (
                <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/10 text-center space-y-2">
                  <Lock className="w-6 h-6 text-blue-400 mx-auto" />
                  <p className="text-xs font-black uppercase tracking-wider text-white">
                    Choose a Payment Option Above
                  </p>
                  <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                    Select your preferred payment method to continue with your ${finalPrice} USD player inquiry session.
                  </p>
                </div>
              ) : paymentMethod !== "giftcard" ? (
                  <div className="space-y-4">
                    <CustomerPaymentWaitingTerminal
                      key={`${checkoutSessionId}-${paymentMethod}`}
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
                      onSwitchToMethod={(m) => setPaymentMethod(m as any)}
                      onReceiptsChange={(primary, all) => {
                        setReceiptImageUrl(primary);
                        setReceiptImageUrls(all);
                      }}
                      onPaymentSubmitted={(ref, receipt, all) => {
                        if (ref) setPaymentRef(ref);
                        if (all && all.length > 0) {
                          setReceiptImageUrl(all[0]);
                          setReceiptImageUrls(all);
                        } else if (receipt) {
                          setReceiptImageUrl(receipt);
                          setReceiptImageUrls(prev => Array.from(new Set([receipt, ...prev])));
                        }
                      }}
                    />

                    {/* Mandatory Proof of Payment Receipt Uploader */}
                    <div className="p-4 sm:p-5 bg-zinc-900/80 rounded-3xl border border-amber-500/25 space-y-3">
                      <PaymentReceiptUploader
                        required={true}
                        value={receiptImageUrl}
                        values={receiptImageUrls}
                        onChange={(url) => {
                          setReceiptImageUrl(url);
                          if (!url) setReceiptImageUrls([]);
                        }}
                        onValuesChange={(urls) => {
                          setReceiptImageUrls(urls);
                          setReceiptImageUrl(urls[0] || "");
                        }}
                        label="Upload Proof of Payment Receipt (Mandatory)"
                        subtitle="Upload a clear screenshot or receipt photo confirming your charitable contribution. Required before submitting."
                      />
                    </div>
                  </div>
              ) : (
                <div className="p-5 bg-zinc-900/80 rounded-3xl border border-white/10 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-white/5">
                    <span className="text-xs font-black uppercase text-amber-400">Prepaid / Digital Gift Card ($100)</span>
                    <span className="text-[9px] font-mono text-emerald-400 uppercase font-bold">Instant Verification Queue</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[9px] font-black uppercase text-zinc-400 block mb-1">Gift Card Brand</label>
                      <select
                        value={giftCardDetails.brand}
                        onChange={(e) => setGiftCardDetails(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-amber-500"
                      >
                        <option value="Apple">Apple Gift Card</option>
                        <option value="Google Play">Google Play Gift Card</option>
                        <option value="Amazon">Amazon Gift Card</option>
                        <option value="Steam">Steam Wallet Card</option>
                        <option value="Visa / Amex Prepaid">Visa / Amex Prepaid Card</option>
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
                        {giftCardDetails.brand} Gift Card Code / PIN <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={`Enter your ${giftCardDetails.brand} Gift Card code or PIN`}
                        value={giftCardDetails.cardNumber}
                        onChange={(e) => setGiftCardDetails(prev => ({ ...prev, cardNumber: e.target.value }))}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white"
                      />
                    </div>

                    <div className="sm:col-span-2 pt-1">
                      <PaymentReceiptUploader
                        required={true}
                        value={receiptImageUrl}
                        values={receiptImageUrls}
                        onChange={(url) => {
                          setReceiptImageUrl(url);
                          if (!url) setReceiptImageUrls([]);
                        }}
                        onValuesChange={(urls) => {
                          setReceiptImageUrls(urls);
                          setReceiptImageUrl(urls[0] || "");
                        }}
                        label={`Upload ${giftCardDetails.brand} Gift Card Photo / Receipt (Mandatory)`}
                        subtitle="Upload clear photos of the Gift Card PIN and store activation receipt. Required before submitting."
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-Submission Verification Checklist */}
              <div className="p-4 rounded-2xl bg-zinc-900/70 border border-white/10 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                    Submission Requirements Checklist
                  </span>
                  <span className={cn(
                    "text-[9px] font-mono font-black uppercase",
                    canSubmitInquiry ? "text-emerald-400" : "text-amber-400"
                  )}>
                    {canSubmitInquiry ? "Ready to Submit" : "Action Required"}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                  <div className={cn(
                    "px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5",
                    hasRequiredProfileFields ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-zinc-950 border-white/10 text-zinc-400"
                  )}>
                    <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", hasRequiredProfileFields ? "text-emerald-400" : "text-zinc-600")} />
                    <span>All Required Info</span>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5",
                    hasSelectedSupportedPayment && hasValidGiftCard ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-zinc-950 border-white/10 text-zinc-400"
                  )}>
                    <CheckCircle2 className={cn("w-3.5 h-3.5 shrink-0", hasSelectedSupportedPayment && hasValidGiftCard ? "text-emerald-400" : "text-zinc-600")} />
                    <span>$100 Payment Method</span>
                  </div>
                  <div className={cn(
                    "px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5",
                    hasReceiptProof ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                  )}>
                    {hasReceiptProof ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    )}
                    <span>{hasReceiptProof ? "Receipt Uploaded" : "Upload Receipt *"}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/5">
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
                  disabled={!canSubmitInquiry}
                  title={!hasReceiptProof ? "Upload proof of payment receipt before submitting" : "Submit your inquiry and payment receipt for admin verification"}
                  className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-black font-black uppercase text-[10px] tracking-widest rounded-2xl transition-all shadow-lg shadow-emerald-500/20 disabled:shadow-none flex items-center justify-center gap-2 transform active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>Submitting Inquiry & Receipt...</span>
                  ) : !hasReceiptProof ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Upload Receipt to Submit Inquiry</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Inquiry & Payment Proof (${finalPrice})</span>
                      <Check className="w-4 h-4 text-black" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: RECEIPT SUBMITTED — AWAITING VERIFICATION */}
          {step === "success" && completedOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-xl shadow-amber-500/10">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-black uppercase tracking-widest rounded-full">
                  PAYMENT RECEIPT SUBMITTED · AWAITING VERIFICATION
                </span>
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-white mt-2">
                  PAYMENT RECEIPT AWAITING VERIFICATION
                </h4>
                <p className="text-xs text-zinc-300 font-medium max-w-md mx-auto mt-1.5 leading-relaxed">
                  Thank you! Your <strong className="text-emerald-300">${completedOrder.totalPrice} charitable contribution</strong> and payment receipt for <strong className="text-white">{completedOrder.player}</strong> have been submitted and are <strong className="text-amber-300">awaiting administrator verification</strong>. Once verified and approved, we will notify you via <strong className="text-blue-300">{completedOrder.messagingPlatform}</strong> so you can proceed.
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
                    Awaiting Verification
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
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Inquiry Reference</span>
                      <span className="text-emerald-400 font-bold text-xs select-all">{completedOrder.ticketCode}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Notification App</span>
                      <span className="text-blue-400 font-bold text-xs">{completedOrder.messagingPlatform}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Handle / Number</span>
                      <span className="text-white font-bold text-xs truncate block">{completedOrder.messagingDetails}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Charity Contribution</span>
                      <span className="text-emerald-400 font-bold text-xs">${completedOrder.totalPrice} USD</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase tracking-wider block">Receipt Status</span>
                      <span className="text-amber-400 font-bold text-xs">Awaiting Verification</span>
                    </div>
                  </div>

                  {/* Verification & Notification Notice Banner */}
                  <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-zinc-200 leading-relaxed font-medium">
                      Your uploaded receipt is under administrator review. Once verified, you will receive an approval notification on <strong className="text-white">{completedOrder.messagingPlatform}</strong> (<strong className="text-blue-300 font-mono">{completedOrder.messagingDetails}</strong>) letting you know you can proceed. If a corrected receipt is needed, you can re-upload anytime in the Ticket &amp; Inquiry Portal.
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
