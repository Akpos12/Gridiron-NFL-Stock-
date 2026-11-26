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
  Calendar,
  MapPin,
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
  HeartHandshake,
  Building2,
  CreditCard,
  RefreshCw,
  ExternalLink,
  Loader2
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth, safeSetDoc } from "../lib/firebase";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { cn } from "../lib/utils";
import stadiumVipImg from "../assets/images/stadium_vip_hospitality_1794821884684.jpg";
import { CHARITY_ALLOCATION } from "./common/GridironBrandMark";
import { ConnectionStatusPanel } from "./common/ConnectionStatusPanel";
import {
  StripeCardCheckoutPanel,
  VerifiedStripePaymentReceipt
} from "./common/StripeCardCheckoutPanel";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { GiftCardGuestPurchasePanel } from "./common/GiftCardGuestPurchasePanel";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";
import {
  findCustomerInquirySessions,
  getSavedGuestSessions,
  PaymentSession,
  PaymentMethodType,
  SAVED_SESSIONS_EVENT
} from "../services/paymentControlService";
import {
  CeeDeePublicPromoOfferModal,
  CeeDeePromoSelection,
  CEEDEE_APPLE_PAY_DISCOUNT_USD,
  CEEDEE_SIGNED_JERSEY_ADDON_USD,
} from "./CeeDeePublicPromoOfferModal";

const CEEDEE_PROMO_SESSION_KEY = "nfl_ceedee_public_promo_choice_v1";
const CEEDEE_PROMO_JERSEY_KEY = "nfl_ceedee_public_promo_jersey_v1";

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
  initialSessionId?: string;
  initialPaymentMethod?: PaymentMethodType | null;
  initialMode?: "new" | "check_existing";
  onOpenTicketPortal?: (query?: string) => void;
  onOpenSupport?: () => void;
  onOpenLegalModal?: (tab?: "about" | "contact" | "charity" | "privacy" | "terms" | "refund") => void;
}

const MESSAGING_PLATFORMS = [
  { id: "whatsapp", name: "WhatsApp", icon: "💬", badge: "Direct Chat & Voice", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  { id: "zangi", name: "Zangi", icon: "🛡️", badge: "Private Zangi Safe Chat", color: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  { id: "telegram", name: "Telegram", icon: "✈️", badge: "Fast Encrypted Ping", color: "text-blue-400 border-blue-500/30 bg-blue-500/10" }
];

const INQUIRY_OBJECTIVES = [
  "Public Meet & Greet — December 26th ($100)",
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
  initialSessionId,
  initialPaymentMethod,
  initialMode,
  onOpenTicketPortal,
  onOpenSupport,
  onOpenLegalModal
}) => {
  const [modalMode, setModalMode] = useState<"new" | "check_existing">(initialMode || "new");
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

  // Payment State (Stripe first, followed by Gift Card, Cash App, and Bitcoin)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "giftcard" | "cashapp" | "crypto" | null>("card");
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [receiptImageUrls, setReceiptImageUrls] = useState<string[]>([]);
  const [giftCardDetails, setGiftCardDetails] = useState({ brand: "Apple Gift Card", cardNumber: "", pin: "", amount: "100" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Completed & Existing Inquiry Lookup State
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const [checkoutSessionId, setCheckoutSessionId] = useState(() => `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [matchedExistingSessions, setMatchedExistingSessions] = useState<PaymentSession[]>([]);
  const [resumedSessionBanner, setResumedSessionBanner] = useState<PaymentSession | null>(null);
  const [forceBrandNew, setForceBrandNew] = useState(false);

  // Explicit "Already Started? Check Awaiting Details" lookup state
  const [lookupInput, setLookupInput] = useState("");
  const [lookupResults, setLookupResults] = useState<PaymentSession[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasSearchedExisting, setHasSearchedExisting] = useState(false);
  const [savedDeviceSessions, setSavedDeviceSessions] = useState(() => getSavedGuestSessions());

  // Exclusive CeeDee Lamb Public Meet & Greet Promo Offer State
  const [showCeeDeePromoModal, setShowCeeDeePromoModal] = useState(false);
  const [applePayDiscountApplied, setApplePayDiscountApplied] = useState(false);
  const [includeSignedJersey, setIncludeSignedJersey] = useState(false);
  const [promoApplePayAvailable, setPromoApplePayAvailable] = useState(false);

  const applyResumedSession = (s: PaymentSession) => {
    setCheckoutSessionId(s.id);
    if (s.customerName && !fullName.trim()) setFullName(s.customerName);
    if (s.customerEmail && !email.trim()) setEmail(s.customerEmail);
    if (s.customerPhone && !phone.trim()) setPhone(s.customerPhone);
    if (!messagingDetails.trim() && s.customerPhone) setMessagingDetails(s.customerPhone);
    if (s.itemTitle && !favoritePlayer.trim()) {
      const cleaned = s.itemTitle.replace(/^Player Inquiry:\s*/i, "").replace(/\s*\([A-Z]{2,3}\)\s*$/i, "").trim();
      if (cleaned) setFavoritePlayer(cleaned);
    }
    const pm = s.paymentMethod;
    if (pm && ["card", "giftcard", "cashapp", "crypto"].includes(pm)) {
      setPaymentMethod(pm as any);
    } else {
      setPaymentMethod("giftcard");
    }
    setResumedSessionBanner(s);
    setForceBrandNew(false);
    setModalMode("new");
    setStep("payment");
  };

  useEffect(() => {
    const syncSaved = () => setSavedDeviceSessions(getSavedGuestSessions());
    window.addEventListener(SAVED_SESSIONS_EVENT, syncSaved);
    return () => window.removeEventListener(SAVED_SESSIONS_EVENT, syncSaved);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const resolvedName = (initialFullName || localStorage.getItem("nfl_guest_sender_name") || "").trim();
    const resolvedEmail = (initialEmail || localStorage.getItem("nfl_guest_buyer_email") || "").trim();
    const resolvedPlayer = (initialPlayer || "").trim();
    const resolvedMessaging = (initialMessagingDetails || "").trim();

    if (initialPlayer !== undefined) setFavoritePlayer(initialPlayer);
    if (initialTeamId) setSelectedTeamId(initialTeamId);
    if (initialObjective) setInquiryObjective(initialObjective);
    if (initialFullName) setFullName(initialFullName);
    if (initialEmail) setEmail(initialEmail);
    if (initialMessagingPlatform) setMessagingPlatform(initialMessagingPlatform);
    if (initialMessagingDetails !== undefined) setMessagingDetails(initialMessagingDetails);
    if (initialSpecialNotes !== undefined) setSpecialNotes(initialSpecialNotes);

    setSavedDeviceSessions(getSavedGuestSessions());
    setLookupInput(resolvedEmail || resolvedName || "");
    setLookupResults([]);
    setHasSearchedExisting(false);
    setFormError(null);
    setPaymentRef("");
    setReceiptImageUrl("");
    setReceiptImageUrls([]);
    setCompletedOrder(null);
    setResumedSessionBanner(null);
    setForceBrandNew(false);
    setModalMode(initialMode || "new");

    if (initialSessionId) {
      setCheckoutSessionId(initialSessionId);
      setPaymentMethod(
        initialPaymentMethod && ["card", "giftcard", "cashapp", "crypto"].includes(initialPaymentMethod)
          ? (initialPaymentMethod as any)
          : "card"
      );
      setStep("payment");
      return;
    }

    const freshId = `INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setCheckoutSessionId(freshId);
    setPaymentMethod("card");

    const isCeeDeePublicTarget =
      resolvedPlayer.toLowerCase().includes("ceedee") &&
      (initialObjective || "").toLowerCase().includes("public meet");

    const canStartOnPayment =
      initialStep === "payment" &&
      resolvedName.length > 0 &&
      resolvedEmail.includes("@") &&
      (isCeeDeePublicTarget
        ? true
        : resolvedPlayer.length > 0 && resolvedMessaging.length > 0);

    setStep(canStartOnPayment ? "payment" : "details");

    if (isCeeDeePublicTarget && (initialMode || "new") === "new") {
      try {
        const storedChoice = sessionStorage.getItem(CEEDEE_PROMO_SESSION_KEY);
        const storedJersey = sessionStorage.getItem(CEEDEE_PROMO_JERSEY_KEY) === "true";
        if (!storedChoice) {
          setApplePayDiscountApplied(false);
          setIncludeSignedJersey(false);
          setShowCeeDeePromoModal(true);
        } else {
          setShowCeeDeePromoModal(false);
          setIncludeSignedJersey(storedJersey);
          setApplePayDiscountApplied(false);
        }
      } catch {
        setShowCeeDeePromoModal(true);
      }
    } else {
      setShowCeeDeePromoModal(false);
      setApplePayDiscountApplied(false);
      setIncludeSignedJersey(false);
    }

    // Immediately check if this returning customer already has an active / responded inquiry!
    if (resolvedEmail.includes("@") || resolvedName.length >= 2) {
      findCustomerInquirySessions({ email: resolvedEmail, name: resolvedName })
        .then((matches) => {
          const openMatches = matches.filter((m) => m.status !== "completed");
          setMatchedExistingSessions(openMatches);
          if (canStartOnPayment && openMatches.length > 0) {
            const top = openMatches[0];
            if (top.status === "details_provided" || top.status === "awaiting_admin_details") {
              applyResumedSession(top);
            }
          }
        })
        .catch(() => {});
    } else {
      setMatchedExistingSessions([]);
    }
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
    initialSessionId,
    initialPaymentMethod,
    initialMode,
  ]);

  // Live debounced auto-lookup whenever returning user types their email or name in Step 1
  useEffect(() => {
    if (!isOpen || forceBrandNew) return;
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    if (!trimmedEmail.includes("@") && trimmedName.length < 3) {
      setMatchedExistingSessions([]);
      return;
    }
    const timer = setTimeout(() => {
      findCustomerInquirySessions({ email: trimmedEmail, name: trimmedName })
        .then((matches) => {
          setMatchedExistingSessions(matches.filter((m) => m.status !== "completed"));
        })
        .catch(() => {});
    }, 350);
    return () => clearTimeout(timer);
  }, [isOpen, email, fullName, forceBrandNew]);

  if (!isOpen) return null;

  const selectedTeam = NFL_TEAMS.find(t => t.id === selectedTeamId) || NFL_TEAMS[0];
  const suggestedPlayers = POPULAR_PLAYERS_BY_TEAM[selectedTeamId] || ["Patrick Mahomes", "Lamar Jackson", "Brock Purdy", "Josh Allen", "Justin Jefferson"];
  const isPublicCeeDeeMeetGreet =
    favoritePlayer.trim().toLowerCase().includes("ceedee") &&
    inquiryObjective.toLowerCase().includes("public meet");
  const effectiveVenue = isPublicCeeDeeMeetGreet ? "AT&T Stadium · Arlington, Texas" : "Hospitality Concierge Scheduling Queue";

  // Calculate price dynamically:
  // - Standard: $100 ($95 w/ Bitcoin 5% off)
  // - CeeDee Public Meet & Greet Promo: $95 w/ Apple Pay 5% off (or supported promo checkout) + optional $195 Signed Jersey add-on
  const isCrypto = paymentMethod === "crypto";
  const ticketBasePrice = isPublicCeeDeeMeetGreet
    ? (applePayDiscountApplied || isCrypto ? 95 : 100)
    : (isCrypto ? 95 : 100);
  const signedJerseyAddonPrice =
    isPublicCeeDeeMeetGreet && includeSignedJersey ? CEEDEE_SIGNED_JERSEY_ADDON_USD : 0;
  const finalPrice = ticketBasePrice + signedJerseyAddonPrice;

  const handlePromoSelection = (selection: CeeDeePromoSelection) => {
    setShowCeeDeePromoModal(false);
    setIncludeSignedJersey(selection.includeJersey);
    setPromoApplePayAvailable(false);
    setApplePayDiscountApplied(false);

    const nextName = (selection.customerName ?? fullName).trim();
    const nextEmail = (selection.customerEmail ?? email).trim();
    if (nextName) setFullName(nextName);
    if (nextEmail) setEmail(nextEmail);

    try {
      if (nextName) localStorage.setItem("nfl_guest_sender_name", nextName);
      if (nextEmail) localStorage.setItem("nfl_guest_buyer_email", nextEmail);
      sessionStorage.setItem(CEEDEE_PROMO_SESSION_KEY, "regular");
      sessionStorage.setItem(CEEDEE_PROMO_JERSEY_KEY, String(selection.includeJersey));
    } catch {
      // ignore storage errors
    }

    setPaymentMethod("card");
    setGiftCardDetails((prev) => ({
      ...prev,
      amount: String(selection.totalUsd),
    }));

    const hasValidNameAndGmail = nextName.length > 0 && nextEmail.includes("@");
    if (hasValidNameAndGmail) {
      setStep("payment");
    } else {
      setStep("details");
    }
  };

  const handleDismissPromoModal = () => {
    setShowCeeDeePromoModal(false);
    try {
      if (!sessionStorage.getItem(CEEDEE_PROMO_SESSION_KEY)) {
        sessionStorage.setItem(CEEDEE_PROMO_SESSION_KEY, "dismissed");
      }
    } catch {
      // ignore storage errors
    }
    onClose();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRunExistingLookup = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? lookupInput).trim();
    if (!q) return;
    setIsLookingUp(true);
    setHasSearchedExisting(true);
    try {
      const results = await findCustomerInquirySessions({
        email: q.includes("@") ? q : undefined,
        name: !q.includes("@") ? q : undefined,
        sessionId: q
      });
      setLookupResults(results);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleStartFreshNewInquiry = () => {
    setForceBrandNew(true);
    setResumedSessionBanner(null);
    setMatchedExistingSessions([]);
    setCheckoutSessionId(`INQ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setPaymentMethod(null);
    setPaymentRef("");
  };

  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError("Please enter your Full Name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Please enter a valid Gmail or Email Address for ticket delivery and approval.");
      return;
    }
    if (!isPublicCeeDeeMeetGreet && !favoritePlayer.trim()) {
      setFormError("Please specify the favorite NFL player you wish to inquire about.");
      return;
    }
    if (!isPublicCeeDeeMeetGreet && !messagingDetails.trim()) {
      setFormError(`Please provide your ${MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name} phone number or username handle.`);
      return;
    }

    // Save to localStorage for convenience
    localStorage.setItem("nfl_guest_sender_name", fullName.trim());
    localStorage.setItem("nfl_guest_buyer_email", email.trim());
    if (phone.trim()) localStorage.setItem("nfl_guest_buyer_phone", phone.trim());
    if (isPublicCeeDeeMeetGreet && !messagingDetails.trim()) {
      setMessagingDetails(email.trim());
    }

    // Check if returning user already has a responded or awaiting inquiry so we resume instead of duplicating
    if (!forceBrandNew) {
      const candidates = matchedExistingSessions.length > 0
        ? matchedExistingSessions
        : await findCustomerInquirySessions({ email: email.trim(), name: fullName.trim() }).catch(() => []);
      const openSession = candidates.find(
        (m) => m.status === "details_provided" || m.status === "awaiting_admin_details"
      );
      if (openSession) {
        applyResumedSession(openSession);
        return;
      }
    }

    if (selectionFallbackShouldKeepMethod(paymentMethod, applePayDiscountApplied, promoApplePayAvailable)) {
      // preserve supported alternative choice (e.g. giftcard) when Apple Pay wasn't available
    } else {
      setPaymentMethod("card");
    }
    setStep("payment");
  };

  function selectionFallbackShouldKeepMethod(
    currentMethod: PaymentMethodType | null,
    discountApplied: boolean,
    applePayReady: boolean
  ) {
    return Boolean(
      isPublicCeeDeeMeetGreet &&
        discountApplied &&
        !applePayReady &&
        currentMethod &&
        currentMethod !== "card"
    );
  }

  const hasRequiredProfileFields = isPublicCeeDeeMeetGreet
    ? fullName.trim().length > 0 && email.trim().includes("@")
    : fullName.trim().length > 0 &&
      email.trim().includes("@") &&
      favoritePlayer.trim().length > 0 &&
      messagingDetails.trim().length > 0;
  const hasReceiptProof =
    receiptImageUrls.length > 0 || receiptImageUrl.trim().length > 0;
  const isGiftCardReady =
    paymentMethod === "giftcard" && giftCardDetails.cardNumber.trim().length >= 4;
  const hasValidGiftCard =
    paymentMethod !== "giftcard" || giftCardDetails.cardNumber.trim().length > 0;
  const hasSelectedSupportedPayment = paymentMethod !== null;
  const canSubmitInquiry =
    hasRequiredProfileFields &&
    hasSelectedSupportedPayment &&
    hasValidGiftCard &&
    (hasReceiptProof || isGiftCardReady) &&
    !isSubmitting;

  const handleFinalizeInquiry = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError(null);

    if (!hasRequiredProfileFields) {
      setFormError(
        isPublicCeeDeeMeetGreet
          ? "Please enter your Full Name and Gmail Address to continue."
          : "Please complete your Full Name, Email Address, Favorite Player, and Preferred Messaging details."
      );
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

    if (!hasReceiptProof && !isGiftCardReady) {
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
      const platformName = isPublicCeeDeeMeetGreet ? "Gmail" : (platformObj?.name || messagingPlatform.toUpperCase());
      const resolvedContact = isPublicCeeDeeMeetGreet ? email.trim() : messagingDetails.trim();
      const targetPlayerName = favoritePlayer.trim() || "CeeDee Lamb";

      const orderData: any = {
        id: orderId,
        orderId: orderId,
        bookingId: orderId,
        shortId: `INQ-${selectedTeam.id}-${targetPlayerName.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`,
        ticketCode: passCode,
        qrCode: passCode,
        passCode: passCode,
        rfidCode: rfidCode,
        securitySignature: isPublicCeeDeeMeetGreet
          ? "SHA-256 CEEDEE LAMB PUBLIC MEET & GREET PASS ($100)"
          : "SHA-256 MEET & GREET INVITATION REQUEST ($100)",
        experienceId: isPublicCeeDeeMeetGreet ? "exp-ceedee-public-dec26" : "exp-player-inquiry-session",
        gameId: isPublicCeeDeeMeetGreet ? "exp-ceedee-public-dec26" : "exp-player-inquiry-session",
        experienceTitle: isPublicCeeDeeMeetGreet
          ? "CEEDÉE LAMB PUBLIC MEET & GREET — DECEMBER 26TH"
          : `MEET & GREET INVITATION REQUEST: ${targetPlayerName.toUpperCase()} (${selectedTeam.city} ${selectedTeam.name})`,
        gameName: isPublicCeeDeeMeetGreet
          ? "CeeDee Lamb Public Meet & Greet · December 26th"
          : `Player Meet & Greet Invitation: ${targetPlayerName}`,
        eventTitle: isPublicCeeDeeMeetGreet
          ? "CeeDee Lamb Public Meet & Greet · AT&T Stadium, Arlington, TX"
          : `Player Meet & Greet Invitation: ${targetPlayerName}`,
        itemName: isPublicCeeDeeMeetGreet
          ? `CeeDee Lamb Public Meet & Greet — December 26th · AT&T Stadium ($${ticketBasePrice}${includeSignedJersey ? " + Signed #88 Jersey $195" : ""})`
          : `Meet & Greet Invitation Request (${targetPlayerName}) - $100 ($75 Coordination + $25 BGCA Support)`,
        experienceType: isPublicCeeDeeMeetGreet ? "meet_greet" : "player_inquiry",
        player: targetPlayerName,
        favoritePlayer: targetPlayerName,
        teamId: selectedTeam.id,
        teamName: `${selectedTeam.city} ${selectedTeam.name}`,
        homeTeam: `${selectedTeam.city} ${selectedTeam.name}`,
        awayTeam: isPublicCeeDeeMeetGreet ? "Public Fan Meet & Greet" : "Concierge Coordination",
        stadium: effectiveVenue,
        venue: effectiveVenue,
        location: isPublicCeeDeeMeetGreet ? "Arlington, Texas" : "Subject to player availability, confirmed events & authorized arrangements",
        city: isPublicCeeDeeMeetGreet ? "Arlington, TX" : selectedTeam.city,
        state: isPublicCeeDeeMeetGreet ? "TX" : "US",
        date: isPublicCeeDeeMeetGreet ? "December 26th" : "Next invite update sent once availability is confirmed",
        eventDate: isPublicCeeDeeMeetGreet ? "December 26th" : "Awaiting Receipt Verification",
        displayDate: isPublicCeeDeeMeetGreet ? "December 26th" : "Subject to Player Availability",
        formattedDate: isPublicCeeDeeMeetGreet ? "December 26th" : "Awaiting Receipt Verification",
        time: isPublicCeeDeeMeetGreet ? "Doors Open · Public Meet & Greet" : "Priority Concierge Review",
        timeSlot: isPublicCeeDeeMeetGreet ? "December 26th Public Access" : "Next Invite Notification",
        admissionTime: isPublicCeeDeeMeetGreet ? "December 26th" : "Upon Confirmed Arrangement",
        tier: "standard",
        tierName: isPublicCeeDeeMeetGreet ? "PUBLIC MEET & GREET ADMISSION" : "MEET & GREET INVITATION REQUEST",
        seatDetails: isPublicCeeDeeMeetGreet
          ? `AT&T Stadium · Arlington, Texas · December 26th · Delivery: ${email.trim()}${includeSignedJersey ? " · Add-On: Signed #88 Jersey ($195)" : ""}`
          : `Requested Player: ${targetPlayerName} · Preferred Contact: ${platformName} (${resolvedContact})`,
        quantity: 1,
        guestsCount: 1,
        unitPrice: ticketBasePrice,
        price: finalPrice,
        totalPrice: finalPrice,
        totalAmount: finalPrice,
        dueToday: finalPrice,
        applePayDiscountApplied: isPublicCeeDeeMeetGreet && applePayDiscountApplied,
        applePayDiscountUsd: isPublicCeeDeeMeetGreet && applePayDiscountApplied ? CEEDEE_APPLE_PAY_DISCOUNT_USD : 0,
        signedJerseyIncluded: isPublicCeeDeeMeetGreet && includeSignedJersey,
        signedJerseyPriceUsd: signedJerseyAddonPrice,
        coordinationFeeUsd: CHARITY_ALLOCATION.coordinationFeeUsd,
        charitableAllocationUsd: CHARITY_ALLOCATION.charitableContributionUsd,
        charityBeneficiary: CHARITY_ALLOCATION.beneficiary,
        currency: "USD",
        isCharityContribution: true,
        charityNote: `$${CHARITY_ALLOCATION.coordinationFeeUsd} concierge coordination fee + $${CHARITY_ALLOCATION.charitableContributionUsd} earmarked charitable contribution toward ${CHARITY_ALLOCATION.beneficiary}`,
        messagingPlatform: platformName,
        messagingDetails: resolvedContact,
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
        buyerPhone: phone.trim() || resolvedContact,
        status: "pending", // Never mark manual proof inquiries paid until verified by admin
        orderStatus: "PAYMENT RECEIPT AWAITING VERIFICATION",
        approvalStatus: "RECEIPT UPLOADED ($100) · AWAITING ADMIN VERIFICATION",
        isApproved: false,
        verificationNotice: `AUDITED BY GRIDIRON FAN HOSPITALITY · $100 RECEIPT SUBMITTED FOR ${targetPlayerName.toUpperCase()}`,
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
        imageUrl: stadiumVipImg,
        ticketImageUrl: stadiumVipImg,
        features: [
          `Featured Player: ${targetPlayerName}`,
          `Franchise: ${selectedTeam.city} ${selectedTeam.name}`,
          `Venue: ${effectiveVenue}`,
          `Contact Channel: ${platformName} (${resolvedContact})`
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
        buyerPhone: phone.trim() || resolvedContact,
        itemType: "ticket",
        itemName: isPublicCeeDeeMeetGreet
          ? `CeeDee Lamb Public Meet & Greet · Dec 26 (AT&T Stadium, Arlington, TX)${includeSignedJersey ? " + Signed #88 Jersey" : ""}`
          : `NFL Player Inquiry Session (${targetPlayerName}) [${platformName}]`,
        venue: effectiveVenue,
        price: finalPrice,
        signedJerseyIncluded: isPublicCeeDeeMeetGreet && includeSignedJersey,
        signedJerseyPriceUsd: signedJerseyAddonPrice,
        applePayDiscountApplied: isPublicCeeDeeMeetGreet && applePayDiscountApplied,
        teamId: selectedTeam.id,
        paymentMethod: paymentMethod,
        paymentRef: paymentRef || `INQ-${checkoutSessionId}`,
        receiptImage: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImageUrl: receiptImageUrls[0] || receiptImageUrl || "",
        receiptImages: receiptImageUrls.length > 0 ? receiptImageUrls : (receiptImageUrl ? [receiptImageUrl] : []),
        status: "pending_approval",
        orderStatus: "PAYMENT RECEIPT AWAITING VERIFICATION",
        isApproved: false,
        favoritePlayer: targetPlayerName,
        messagingPlatform: platformName,
        messagingDetails: resolvedContact,
        timestamp: nowIso
      });

      // 4. Also store in customer_inquiries collection for real-time concierge dispatch
      await safeSetDoc(doc(db, "customer_inquiries", orderId), {
        id: orderId,
        orderId: orderId,
        sessionId: checkoutSessionId,
        type: isPublicCeeDeeMeetGreet ? "ceedee_public_meet_greet" : "player_inquiry",
        category: "player_inquiry",
        customerName: fullName.trim(),
        customerEmail: email.trim(),
        customerPhone: phone.trim() || resolvedContact,
        teamId: selectedTeam.id,
        teamName: `${selectedTeam.city} ${selectedTeam.name}`,
        venue: effectiveVenue,
        favoritePlayer: targetPlayerName,
        messagingPlatform: platformName,
        messagingDetails: resolvedContact,
        inquiryObjective: inquiryObjective,
        specialNotes: specialNotes.trim(),
        feePaid: finalPrice,
        signedJerseyIncluded: isPublicCeeDeeMeetGreet && includeSignedJersey,
        signedJerseyPriceUsd: signedJerseyAddonPrice,
        applePayDiscountApplied: isPublicCeeDeeMeetGreet && applePayDiscountApplied,
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

  if (showCeeDeePromoModal && isPublicCeeDeeMeetGreet && modalMode === "new") {
    return (
      <CeeDeePublicPromoOfferModal
        isOpen={true}
        initialIncludeJersey={includeSignedJersey}
        initialCustomerName={fullName}
        initialCustomerEmail={email}
        sessionId={checkoutSessionId}
        onClose={handleDismissPromoModal}
        onSelectOffer={handlePromoSelection}
        onCustomerDetailsChange={(name, gmail) => {
          setFullName(name);
          setEmail(gmail);
        }}
      />
    );
  }

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
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-[#050816] via-[#08112B] to-[#03050C] border-b border-[#013369]/60">
          <div className="flex items-center flex-wrap gap-3 mb-2 text-xs font-bold text-sky-400">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              {isPublicCeeDeeMeetGreet
                ? "CeeDee Lamb Public Meet & Greet · December 26th"
                : "Meet & Greet Invitation Request"}
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="inline-flex items-center gap-1.5 font-mono text-white">
              {isPublicCeeDeeMeetGreet ? (
                <>
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  <span>AT&amp;T Stadium · Arlington, TX · ${finalPrice}</span>
                </>
              ) : (
                <>
                  <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />
                  <span>$100 ($75 Fee + $25 BGCA Support)</span>
                </>
              )}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white leading-tight">
            {isPublicCeeDeeMeetGreet ? (
              <>
                CEEDÉE LAMB PUBLIC MEET &amp; GREET — <span className="text-sky-400">${finalPrice} TOTAL</span>
              </>
            ) : (
              <>
                GET AN INVITATION TO YOUR FAVORITE PLAYER&apos;S MEET &amp; GREET FOR JUST <span className="text-sky-400">$100</span>
              </>
            )}
          </h3>
          <p className="text-xs text-zinc-300 mt-1.5 max-w-lg font-medium leading-relaxed">
            {isPublicCeeDeeMeetGreet
              ? "Enter your Full Name and Gmail Address below to proceed immediately to checkout for December 26th at AT&T Stadium, Arlington, Texas."
              : "Your favorite player could be closer than you think! Submit your request for an opportunity to attend an exclusive meet-and-greet experience with the player you admire. Invitations are subject to player availability, confirmed events, and authorized arrangements — a direct message will be sent to you for the next available invite."}
          </p>

          {/* Mode Switcher: New Inquiry vs Already Started? Check Awaiting Details */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setModalMode("new")}
              className={cn(
                "min-h-[42px] px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                modalMode === "new"
                  ? "bg-blue-600 border-blue-400 text-white shadow-md"
                  : "bg-zinc-900/80 border-white/10 text-zinc-400 hover:text-white"
              )}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{isPublicCeeDeeMeetGreet ? `Reserve Slot ($${finalPrice})` : "New Player Inquiry"}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setModalMode("check_existing");
                const preQuery = (email || fullName || "").trim();
                if (preQuery && !hasSearchedExisting) {
                  setLookupInput(preQuery);
                  handleRunExistingLookup(preQuery);
                }
              }}
              className={cn(
                "min-h-[42px] px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border transition-all cursor-pointer flex items-center justify-center gap-1.5",
                modalMode === "check_existing"
                  ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md"
                  : "bg-zinc-900/80 border-emerald-500/35 text-emerald-300 hover:text-white"
              )}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Already Started? Check Details
                {matchedExistingSessions.length > 0 ? ` (${matchedExistingSessions.length})` : ""}
              </span>
            </button>
          </div>

          {/* Stepper indicator */}
          {modalMode === "new" && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest">
              <div className={cn("flex items-center gap-1.5", step === "details" ? "text-blue-400" : "text-zinc-500")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "details" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")}>1</span>
                <span>{isPublicCeeDeeMeetGreet ? "Name & Gmail" : "Player & Contact Info"}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-700" />
              <div className={cn("flex items-center gap-1.5", step === "payment" ? "text-blue-400" : "text-zinc-500")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "payment" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")}>2</span>
                <span>{isPublicCeeDeeMeetGreet ? `Checkout ($${finalPrice})` : "$100 Contribution & Proof"}</span>
              </div>
              <ArrowRight className="w-3 h-3 text-zinc-700" />
              <div className={cn("flex items-center gap-1.5", step === "success" ? "text-emerald-400" : "text-zinc-500")}>
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px]", step === "success" ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-400")}>3</span>
                <span>Awaiting Verification</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-8 max-h-[68vh] overflow-y-auto no-scrollbar space-y-6">
          {formError && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-2 text-rose-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {/* DEDICATED MODE: ALREADY STARTED AN INQUIRY & AWAITING VENDOR DETAILS */}
          {modalMode === "check_existing" && (
            <div className="space-y-5">
              <div className="p-5 bg-zinc-900/70 border border-emerald-500/30 rounded-3xl space-y-4">
                <div>
                  <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-emerald-400" />
                    Resume Existing Inquiry &amp; Check Vendor Response
                  </h4>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                    Already started an inquiry and waiting for vendor details? Enter the <strong className="text-white">Email Address, Full Name, or Reference ID</strong> you used earlier to check if the vendor has responded—without creating a duplicate request.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRunExistingLookup();
                  }}
                  className="flex flex-col sm:flex-row gap-2.5"
                >
                  <input
                    type="text"
                    placeholder="Enter your Email, Name, or Ref ID (e.g. INQ-...)"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    className="flex-1 min-h-[46px] bg-zinc-950 border border-white/15 focus:border-emerald-400 rounded-2xl px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isLookingUp || !lookupInput.trim()}
                    className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shrink-0"
                  >
                    {isLookingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    <span>{isLookingUp ? "Checking..." : "Check Status"}</span>
                  </button>
                </form>

                {savedDeviceSessions.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Recent on this device:
                    </span>
                    {savedDeviceSessions.slice(0, 3).map((ds) => (
                      <button
                        key={ds.id}
                        type="button"
                        onClick={() => {
                          setLookupInput(ds.customerEmail || ds.id);
                          handleRunExistingLookup(ds.id);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/15 text-[11px] font-mono text-sky-300 cursor-pointer flex items-center gap-1.5"
                      >
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{ds.id}</span>
                        {ds.paymentMethod && <span className="text-zinc-500 uppercase">({ds.paymentMethod})</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isLookingUp ? (
                <div className="py-10 text-center space-y-2">
                  <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mx-auto" />
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Checking live vendor dispatch queue...
                  </p>
                </div>
              ) : hasSearchedExisting && lookupResults.length === 0 ? (
                <div className="p-6 bg-zinc-900/50 border border-white/10 rounded-3xl text-center space-y-3">
                  <p className="text-sm font-black uppercase text-white">No Existing Inquiry Found</p>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto">
                    We couldn&apos;t find a previous inquiry matching &ldquo;{lookupInput}&rdquo;. Double-check the email or Reference ID, or switch to New Player Inquiry.
                  </p>
                  <button
                    type="button"
                    onClick={() => setModalMode("new")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase cursor-pointer"
                  >
                    Start a New Player Inquiry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {lookupResults.map((s) => {
                    const hasVendorDetails = Boolean(
                      s.adminPaymentDetails &&
                        (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)
                    );
                    const isSubmitted = s.status === "payment_submitted" || s.status === "completed";
                    const elapsedMins = s.createdAt ? Math.max(0, Math.floor((Date.now() - s.createdAt) / 60000)) : 0;

                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "p-4 sm:p-5 rounded-3xl border space-y-3",
                          hasVendorDetails && !isSubmitted
                            ? "bg-emerald-500/10 border-emerald-500/40"
                            : isSubmitted
                            ? "bg-amber-500/10 border-amber-500/30"
                            : "bg-zinc-900/80 border-sky-500/30"
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider",
                              hasVendorDetails && !isSubmitted
                                ? "bg-emerald-500 text-black"
                                : isSubmitted
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-sky-500/20 text-sky-300"
                            )}
                          >
                            {hasVendorDetails && !isSubmitted
                              ? "VENDOR RESPONDED · DETAILS READY"
                              : isSubmitted
                              ? "PAYMENT PROOF SUBMITTED"
                              : `AWAITING VENDOR DETAILS (${elapsedMins}m ago)`}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Ref: <strong className="text-white">{s.id}</strong>
                          </span>
                        </div>

                        <div>
                          <h5 className="text-sm font-black uppercase text-white">
                            {s.itemTitle || "Custom Player Inquiry"}
                          </h5>
                          <p className="text-xs text-zinc-300 mt-0.5">
                            {s.customerName} ({s.customerEmail}) · <strong className="uppercase">{s.paymentMethod}</strong> · ${Number(s.amount || 100).toLocaleString()}
                          </p>
                        </div>

                        {hasVendorDetails && s.adminPaymentDetails && !isSubmitted && (
                          <div className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <span className="text-[9px] font-black uppercase text-zinc-500 block">Assigned Vendor Destination</span>
                              <span className="text-sm font-mono font-black text-emerald-400 break-all">
                                {s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName}
                              </span>
                            </div>
                          </div>
                        )}

                        {Array.isArray(s.messages) && s.messages.length > 0 && (
                          <div className="p-3 rounded-2xl bg-zinc-950/90 border border-sky-500/25 text-xs space-y-1">
                            <span className="text-[9px] font-black uppercase text-sky-300 block">
                              Latest Concierge Update ({s.messages.length} msg)
                            </span>
                            <p className="text-zinc-200 line-clamp-2">
                              {s.messages[s.messages.length - 1].body}
                            </p>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => applyResumedSession(s)}
                            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <span>
                              {hasVendorDetails && !isSubmitted
                                ? "Open Vendor Details & Upload Receipt"
                                : "Resume Awaiting Screen & Messages"}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          {onOpenTicketPortal && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenTicketPortal(s.id);
                              }}
                              className="px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-xs font-bold uppercase flex items-center gap-1.5 cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Full Tracker
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 1: PLAYER & CUSTOMER DETAILS FORM */}
          {modalMode === "new" && step === "details" && (
            <form onSubmit={handleProceedToPayment} className="space-y-6">
              {/* Auto-Detected Returning Inquiry Banner */}
              {matchedExistingSessions.length > 0 && !forceBrandNew && (() => {
                const top = matchedExistingSessions[0];
                const hasVendorDetails = Boolean(
                  top.adminPaymentDetails &&
                    (top.adminPaymentDetails.identifier || top.adminPaymentDetails.accountNumber || top.adminPaymentDetails.bankName)
                );
                return (
                  <div className={cn(
                    "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3",
                    hasVendorDetails
                      ? "bg-emerald-500/15 border-emerald-400/50"
                      : "bg-sky-500/15 border-sky-400/40"
                  )}>
                    <div className="space-y-0.5">
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-wider block",
                        hasVendorDetails ? "text-emerald-300" : "text-sky-300"
                      )}>
                        {hasVendorDetails
                          ? "Existing Inquiry Found · Vendor Has Responded!"
                          : "Existing Inquiry Found · Awaiting Vendor Details"}
                      </span>
                      <p className="text-xs text-white font-semibold">
                        Ref <span className="font-mono">{top.id}</span> · {top.itemTitle} ({String(top.paymentMethod || "").toUpperCase()})
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => applyResumedSession(top)}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        {hasVendorDetails ? "View Vendor Response" : "Resume Awaiting Screen"}
                      </button>
                      <button
                        type="button"
                        onClick={handleStartFreshNewInquiry}
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/15 text-zinc-300 hover:text-white font-bold text-[10px] uppercase cursor-pointer"
                      >
                        New Instead
                      </button>
                    </div>
                  </div>
                );
              })()}
              {isPublicCeeDeeMeetGreet ? (
                <div className="space-y-5">
                  {/* Streamlined Public Meet & Greet Event Recap + Promo Selection Summary */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-[#040B1A] border border-[#60A5FA]/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[#030712]/80 border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Date
                      </span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">
                        December 26th
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#030712]/80 border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#60A5FA]" />
                        Venue
                      </span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">
                        AT&amp;T Stadium, Arlington, TX
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#030712]/80 border border-[#60A5FA]/35">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD] block">
                        {applePayDiscountApplied ? "Promo Total (5% Off)" : "Checkout Total"}
                      </span>
                      <span className="font-mono text-base font-black text-white mt-0.5 block tabular-nums">
                        ${finalPrice}.00 USD
                      </span>
                      {includeSignedJersey && (
                        <span className="text-[10px] text-sky-300 font-semibold block">
                          Includes Signed #88 Jersey (+$195)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Promo Offer / Signed Jersey Review Strip */}
                  <div className="p-3.5 rounded-2xl bg-[#07142E]/75 border border-[#B0B7BC]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-white block">
                        {applePayDiscountApplied
                          ? "5% Fan Offer Active ($95.00 Ticket)"
                          : "Standard Admission ($100.00 Ticket)"}
                        {includeSignedJersey ? " + Signed CeeDee Lamb #88 Jersey ($195.00)" : ""}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        Need to add/remove the signed jersey or review the 5% Apple Pay offer?
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCeeDeePromoModal(true)}
                      className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-[#B0B7BC]/30 text-[11px] font-bold uppercase tracking-wider text-sky-300 hover:text-white cursor-pointer shrink-0"
                    >
                      View Fan Offer &amp; Jersey
                    </button>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6 bg-zinc-900/50 rounded-3xl border border-white/10">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-wider text-white">
                        Enter Your Name &amp; Gmail to Proceed to Checkout
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Quick registration — only your Name and Gmail are needed to secure your December 26th slot.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label
                          htmlFor="ceedee-public-full-name"
                          className="text-[10px] font-black uppercase text-zinc-300 flex items-center gap-1.5"
                        >
                          <User className="w-3.5 h-3.5 text-[#60A5FA]" />
                          Full Name <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="ceedee-public-full-name"
                          type="text"
                          required
                          autoFocus
                          placeholder="Enter your full name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="w-full min-h-[48px] bg-zinc-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor="ceedee-public-gmail"
                          className="text-[10px] font-black uppercase text-zinc-300 flex items-center gap-1.5"
                        >
                          <Mail className="w-3.5 h-3.5 text-[#60A5FA]" />
                          Gmail Address <span className="text-rose-400">*</span>
                        </label>
                        <input
                          id="ceedee-public-gmail"
                          type="email"
                          required
                          placeholder="yourname@gmail.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full min-h-[48px] bg-zinc-950 border border-white/15 rounded-xl px-4 py-3 text-sm text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setInquiryObjective(INQUIRY_OBJECTIVES[1])}
                        className="text-xs font-semibold text-zinc-400 hover:text-white underline text-left cursor-pointer"
                      >
                        Looking for a different player inquiry?
                      </button>

                      <button
                        type="submit"
                        className="w-full sm:w-auto min-h-[52px] px-8 py-3.5 bg-gradient-to-r from-[#003594] via-[#1D4ED8] to-[#003594] hover:brightness-115 text-white border border-[#B0B7BC]/35 font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <span>PROCEED TO CHECKOUT — ${finalPrice}.00</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
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

                  {/* Transparent $100 Invitation Fee & Charitable Allocation Disclosure */}
                  <div className="p-5 bg-gradient-to-br from-[#050816] via-[#08112B] to-[#03050C] rounded-3xl border border-[#013369]/60 space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase text-sky-400 tracking-wider inline-flex items-center gap-1.5">
                        <HeartHandshake className="w-3.5 h-3.5 text-sky-400" />
                        Invitation Process &amp; Transparent $100 Breakdown
                      </span>
                      <h4 className="text-sm font-black uppercase tracking-tight text-white">
                        $75.00 Concierge Coordination Fee + $25.00 Charitable Allocation
                      </h4>
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                        Every <strong className="text-white">$100</strong> invitation request includes a <strong className="text-white">$75.00</strong> coordination and processing fee plus a <strong className="text-emerald-400">$25.00</strong> contribution earmarked toward{" "}
                        <strong className="text-white">{CHARITY_ALLOCATION.beneficiary}</strong> youth education and mentorship initiatives. Invitations remain subject to player availability, confirmed events, and authorized arrangements, and our team will message you for the next available invite.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px]">
                      <div className="p-3 rounded-2xl bg-[#03050C]/90 border border-white/10">
                        <span className="text-[9px] font-mono font-black uppercase text-sky-400 block">Step 1 · Select Payment</span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">Pay securely via Stripe (Debit / Credit Card), buy &amp; redeem a Gift Card without signing in, or use Cash App or Bitcoin (5% off).</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#03050C]/90 border border-white/10">
                        <span className="text-[9px] font-mono font-black uppercase text-sky-400 block">Step 2 · Verify Transaction</span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">Card payments confirm automatically; manual transfers require genuine receipt upload before verification.</p>
                      </div>
                      <div className="p-3 rounded-2xl bg-[#03050C]/90 border border-white/10">
                        <span className="text-[9px] font-mono font-black uppercase text-emerald-400 block">Step 3 · Next Invite Update</span>
                        <p className="text-zinc-300 mt-0.5 leading-snug">Once confirmed, our concierge messages you via {MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name || "your chosen app"} &amp; email when an invite window opens.</p>
                      </div>
                    </div>

                    <div className="pt-1 flex flex-wrap items-center justify-between gap-3">
                      {onOpenLegalModal && (
                        <button
                          type="button"
                          onClick={() => onOpenLegalModal("charity")}
                          className="text-xs font-semibold text-sky-400 hover:text-white hover:underline cursor-pointer"
                        >
                          View Charitable Initiative &amp; Refund Policy Disclosures →
                        </button>
                      )}
                      <button
                        type="submit"
                        className="w-full sm:w-auto px-8 py-4 bg-[#D50A0A] hover:bg-[#B91C1C] text-white border border-white/15 font-extrabold uppercase text-xs tracking-wider rounded-2xl transition-all shadow-lg shadow-red-900/30 flex items-center justify-center gap-2.5 cursor-pointer"
                      >
                        <span>GET YOUR INVITATION – $100</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </form>
          )}

          {/* STEP 2: PAYMENT EXECUTION ($100) */}
          {modalMode === "new" && step === "payment" && (
            <div className="space-y-6">
              {resumedSessionBanner && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-100">
                      Resumed active inquiry <strong className="font-mono text-white">{resumedSessionBanner.id}</strong> — live vendor response &amp; messages synced.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleStartFreshNewInquiry();
                      setStep("details");
                    }}
                    className="text-[10px] font-black uppercase text-sky-300 hover:text-white underline cursor-pointer"
                  >
                    Start Separate Inquiry
                  </button>
                </div>
              )}
              {/* Order recap card */}
              <div className="p-4 bg-zinc-900/60 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img 
                    src={getLogoUrl(selectedTeam.id)} 
                    alt={selectedTeam.name} 
                    className="w-10 h-10 object-contain shrink-0" 
                  />
                  <div className="min-w-0">
                    <span className="text-[8px] font-black uppercase text-blue-400 tracking-widest block">
                      {isPublicCeeDeeMeetGreet
                        ? "PUBLIC MEET & GREET · DECEMBER 26TH"
                        : "PLAYER INQUIRY CLEARANCE"}
                    </span>
                    <h5 className="text-sm font-black uppercase text-white truncate">
                      {isPublicCeeDeeMeetGreet
                        ? "CeeDee Lamb · Public Meet & Greet"
                        : `${favoritePlayer} · ${selectedTeam.city} ${selectedTeam.name}`}
                    </h5>
                    <p className="text-[9px] font-mono text-zinc-400 truncate">
                      {isPublicCeeDeeMeetGreet
                        ? `AT&T Stadium, Arlington, TX · ${fullName} (${email})`
                        : `Liaison Channel: ${MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform)?.name} (${messagingDetails})`}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[9px] font-mono text-zinc-400 uppercase block">
                    {isPublicCeeDeeMeetGreet
                      ? includeSignedJersey
                        ? "Ticket + Signed Jersey"
                        : applePayDiscountApplied
                        ? "5% Off Ticket Price"
                        : "Ticket Price"
                      : "Invitation Fee"}
                  </span>
                  <span className="text-xl font-mono font-black text-white tabular-nums">
                    ${finalPrice}.00 USD
                  </span>
                </div>
              </div>

              {isPublicCeeDeeMeetGreet && (applePayDiscountApplied || includeSignedJersey) && (
                <div className="p-3.5 rounded-2xl bg-[#07142E]/70 border border-[#B0B7BC]/25 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="space-y-0.5 text-zinc-200">
                    <span className="font-bold text-white block">
                      {applePayDiscountApplied ? "Apple Pay 5% Fan Discount ($95.00 Ticket)" : "Public Meet & Greet ($100.00 Ticket)"}
                      {includeSignedJersey ? " + Signed CeeDee Lamb #88 Jersey ($195.00)" : ""}
                    </span>
                    <span className="text-[11px] text-zinc-400 block">
                      {!promoApplePayAvailable && applePayDiscountApplied
                        ? "Apple Pay unavailable on this device — supported checkout options preserve your $95.00 promo price."
                        : "Promotional total calculated live in your checkout below."}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCeeDeePromoModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[10px] font-bold uppercase tracking-wider text-sky-300 hover:text-white cursor-pointer"
                  >
                    Adjust Offer / Jersey
                  </button>
                </div>
              )}

              <ConnectionStatusPanel
                compact
                paymentStatusLabel={`Request ${checkoutSessionId}`}
              />

              {/* Fee vs Charitable Contribution Transparency Banner */}
              <div className="p-4 rounded-2xl bg-[#050816] border border-[#013369]/60 flex items-start gap-3">
                <HeartHandshake className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-200 leading-relaxed">
                  <strong className="text-sky-400 uppercase tracking-wide">Fee &amp; Charity Transparency:</strong> Of your ${finalPrice}.00 total,{" "}
                  <strong className="text-white">$25.00</strong> is allocated toward{" "}
                  <strong className="text-white">{CHARITY_ALLOCATION.beneficiary}</strong> youth mentorship programs, and the remaining balance covers hospitality coordination and processing. No official partnership with BGCA is claimed.
                </p>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                  <span>Select Payment Channel (All Systems Active)</span>
                  <span className="text-[9px] font-mono text-emerald-400">
                    {isPublicCeeDeeMeetGreet && includeSignedJersey
                      ? `TOTAL DUE: $${finalPrice}.00`
                      : "5% OFF WITH BITCOIN ($95)"}
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    { id: "card", name: "Stripe (Card)", badge: "DEBIT / CREDIT", icon: CreditCard },
                    { id: "giftcard", name: "Gift Card", badge: "NO SIGN-IN BUY", icon: Layers },
                    { id: "cashapp", name: "Cash App", badge: "DIRECT P2P", icon: Smartphone },
                    { id: "crypto", name: "Bitcoin (BTC)", badge: "EXPRESS · 5% OFF", icon: ShieldCheck }
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
                          "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px]",
                          isSelected
                            ? "bg-zinc-900 border-blue-500 ring-1 ring-blue-500/30 text-white shadow-lg"
                            : "bg-zinc-900/40 border-white/5 hover:border-white/15 text-zinc-400"
                        )}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <m.icon className={cn("w-4 h-4 shrink-0", isSelected ? "text-blue-400" : "text-zinc-400")} />
                          <span className={cn(
                            "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded truncate",
                            m.id === "crypto"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : m.id === "giftcard"
                                ? "bg-amber-500/20 text-amber-300"
                                : m.id === "cashapp"
                                ? "bg-emerald-500/15 text-emerald-300"
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
              ) : paymentMethod === "card" ? (
                <StripeCardCheckoutPanel
                  amountUsd={finalPrice}
                  itemName={
                    isPublicCeeDeeMeetGreet
                      ? `CeeDee Lamb Public Meet & Greet · December 26th${includeSignedJersey ? " + Signed #88 Jersey" : ""}`
                      : `Meet & Greet Invitation — ${favoritePlayer || "Selected Player"}`
                  }
                  itemDescription={
                    isPublicCeeDeeMeetGreet
                      ? `CeeDee Lamb Public Meet & Greet · December 26th · AT&T Stadium, Arlington, Texas${applePayDiscountApplied ? " (5% Apple Pay Discount Applied)" : ""}${includeSignedJersey ? " + Authentic Signed CeeDee Lamb #88 Jersey Add-On ($195.00)" : ""}.`
                      : `Invitation request for ${favoritePlayer || "Selected Player"} (${selectedTeam.city} ${selectedTeam.name}). Includes $75.00 coordination fee + $25.00 earmarked support for Boys & Girls Clubs of America.`
                  }
                  sessionId={checkoutSessionId}
                  customerName={fullName}
                  customerEmail={email}
                  customerPhone={phone || (isPublicCeeDeeMeetGreet ? email : messagingDetails)}
                  playerName={favoritePlayer || "CeeDee Lamb"}
                  isCharityEligible={!isPublicCeeDeeMeetGreet}
                  preferredWallet={isPublicCeeDeeMeetGreet && applePayDiscountApplied ? "apple_pay" : "card"}
                  applePayDiscountApplied={isPublicCeeDeeMeetGreet && applePayDiscountApplied}
                  signedJerseyIncluded={isPublicCeeDeeMeetGreet && includeSignedJersey}
                  onReturnToOptions={() => setPaymentMethod("giftcard")}
                  onSwitchToBitcoin={() => setPaymentMethod("crypto")}
                  onSwitchToGiftCard={() => setPaymentMethod("giftcard")}
                  onContactSupport={() => {
                    onClose();
                    if (onOpenSupport) {
                      onOpenSupport();
                    } else if (onOpenTicketPortal) {
                      onOpenTicketPortal(checkoutSessionId);
                    }
                  }}
                  onVerifiedSuccess={async (receipt: VerifiedStripePaymentReceipt) => {
                    const orderId = `ORD-STRIPE-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
                    const passCode = `PASS-INQ-${Date.now().toString(36).toUpperCase()}`;
                    const nowIso = new Date().toISOString();
                    const platformObj = MESSAGING_PLATFORMS.find(p => p.id === messagingPlatform);
                    const platformName = isPublicCeeDeeMeetGreet ? "Gmail" : (platformObj?.name || messagingPlatform.toUpperCase());
                    const contactHandle = isPublicCeeDeeMeetGreet ? email.trim() : messagingDetails.trim();
                    const playerLabel = favoritePlayer.trim() || "CeeDee Lamb";

                    const verifiedData: any = {
                      id: orderId,
                      orderId,
                      bookingId: orderId,
                      shortId: `INQ-${selectedTeam.id}-${playerLabel.replace(/\s+/g, "").slice(0, 6).toUpperCase()}`,
                      ticketCode: passCode,
                      qrCode: passCode,
                      passCode,
                      experienceId: isPublicCeeDeeMeetGreet ? "exp-ceedee-public-dec26" : "exp-player-inquiry-session",
                      experienceTitle: isPublicCeeDeeMeetGreet
                        ? "CEEDÉE LAMB PUBLIC MEET & GREET — DECEMBER 26TH"
                        : `MEET & GREET INVITATION: ${playerLabel.toUpperCase()} (${selectedTeam.city} ${selectedTeam.name})`,
                      gameName: isPublicCeeDeeMeetGreet
                        ? "CeeDee Lamb Public Meet & Greet · December 26th"
                        : `Meet & Greet Invitation: ${playerLabel}`,
                      eventTitle: isPublicCeeDeeMeetGreet
                        ? "CeeDee Lamb Public Meet & Greet · AT&T Stadium, Arlington, TX"
                        : `Meet & Greet Invitation: ${playerLabel}`,
                      itemName: isPublicCeeDeeMeetGreet
                        ? `CeeDee Lamb Public Meet & Greet (December 26th · AT&T Stadium)${includeSignedJersey ? " + Signed #88 Jersey" : ""} - Stripe Verified`
                        : `Meet & Greet Invitation (${playerLabel}) - Stripe Verified`,
                      experienceType: isPublicCeeDeeMeetGreet ? "meet_greet" : "player_inquiry",
                      player: playerLabel,
                      favoritePlayer: playerLabel,
                      teamId: selectedTeam.id,
                      teamName: `${selectedTeam.city} ${selectedTeam.name}`,
                      stadium: effectiveVenue,
                      venue: effectiveVenue,
                      city: isPublicCeeDeeMeetGreet ? "Arlington, TX" : selectedTeam.city,
                      date: isPublicCeeDeeMeetGreet ? "December 26th" : "Subject to player availability & confirmed events",
                      tier: "standard",
                      tierName: isPublicCeeDeeMeetGreet ? "PUBLIC MEET & GREET ADMISSION" : "MEET & GREET INVITATION REQUEST",
                      quantity: 1,
                      guestsCount: 1,
                      unitPrice: receipt.amountTotal,
                      price: receipt.amountTotal,
                      totalPrice: receipt.amountTotal,
                      totalAmount: receipt.amountTotal,
                      applePayDiscountApplied: isPublicCeeDeeMeetGreet && applePayDiscountApplied,
                      signedJerseyIncluded: isPublicCeeDeeMeetGreet && includeSignedJersey,
                      signedJerseyPriceUsd: signedJerseyAddonPrice,
                      coordinationFeeUsd: CHARITY_ALLOCATION.coordinationFeeUsd,
                      charitableAllocationUsd: CHARITY_ALLOCATION.charitableContributionUsd,
                      charityBeneficiary: CHARITY_ALLOCATION.beneficiary,
                      buyerName: receipt.customerName || fullName.trim() || "VIP Guest",
                      senderName: receipt.customerName || fullName.trim() || "VIP Guest",
                      buyerEmail: receipt.customerEmail || email.trim(),
                      userEmail: receipt.customerEmail || email.trim(),
                      buyerPhone: phone.trim() || contactHandle,
                      messagingPlatform: platformName,
                      messagingDetails: contactHandle,
                      status: "paid_verified",
                      orderStatus: "STRIPE PAYMENT VERIFIED · RESERVATION CONFIRMED",
                      approvalStatus: "STRIPE CHECKOUT VERIFIED · PASS READY",
                      isApproved: false,
                      paymentMethod: "card",
                      paymentSessionId: receipt.sessionId,
                      paymentReference: receipt.sessionId,
                      paymentRef: receipt.sessionId,
                      paymentChannel: "STRIPE CARD CHECKOUT",
                      imageUrl: stadiumVipImg,
                      createdAt: nowIso,
                      updatedAt: nowIso,
                    };

                    try {
                      await safeSetDoc(doc(db, "bookings", orderId), verifiedData);
                      await safeSetDoc(doc(db, "customer_inquiries", orderId), {
                        id: orderId,
                        orderId,
                        sessionId: receipt.sessionId,
                        type: isPublicCeeDeeMeetGreet ? "ceedee_public_meet_greet" : "player_inquiry",
                        category: "player_inquiry",
                        customerName: verifiedData.buyerName,
                        customerEmail: verifiedData.buyerEmail,
                        customerPhone: verifiedData.buyerPhone,
                        teamId: selectedTeam.id,
                        teamName: `${selectedTeam.city} ${selectedTeam.name}`,
                        venue: effectiveVenue,
                        favoritePlayer: verifiedData.player,
                        messagingPlatform: platformName,
                        messagingDetails: contactHandle,
                        feePaid: receipt.amountTotal,
                        applePayDiscountApplied: isPublicCeeDeeMeetGreet && applePayDiscountApplied,
                        signedJerseyIncluded: isPublicCeeDeeMeetGreet && includeSignedJersey,
                        signedJerseyPriceUsd: signedJerseyAddonPrice,
                        paymentMethod: "card",
                        paymentRef: receipt.sessionId,
                        status: "paid_verified",
                        orderStatus: "STRIPE PAYMENT VERIFIED",
                        isApproved: false,
                        createdAt: nowIso,
                      });
                    } catch {
                      // Receipt card remains displayed to user even if optional extra log fails
                    }
                    setCompletedOrder(verifiedData);
                  }}
                />
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
                      customerPhone={phone || (isPublicCeeDeeMeetGreet ? email : messagingDetails)}
                      itemTitle={
                        isPublicCeeDeeMeetGreet
                          ? `CeeDee Lamb Public Meet & Greet · Dec 26 (AT&T Stadium, Arlington, TX)${includeSignedJersey ? " + Signed #88 Jersey" : ""}`
                          : `Player Inquiry: ${favoritePlayer} (${selectedTeam.id})`
                      }
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
                        subtitle="Upload a clear screenshot or receipt photo confirming your contribution. Required before submitting."
                      />
                    </div>
                  </div>
              ) : (
                <div className="space-y-4">
                  <GiftCardGuestPurchasePanel
                    amountDue={finalPrice}
                    brand={giftCardDetails.brand}
                    onBrandChange={(brand) => setGiftCardDetails(prev => ({ ...prev, brand }))}
                    cardNumber={giftCardDetails.cardNumber}
                    onCardNumberChange={(cardNumber) => setGiftCardDetails(prev => ({ ...prev, cardNumber }))}
                    pin={giftCardDetails.pin}
                    onPinChange={(pin) => setGiftCardDetails(prev => ({ ...prev, pin }))}
                    balance={giftCardDetails.amount}
                    onBalanceChange={(amount) => setGiftCardDetails(prev => ({ ...prev, amount }))}
                    discountBadge={applePayDiscountApplied ? "5% Fan Promo Applied" : "Guest Checkout Enabled"}
                    sessionId={checkoutSessionId}
                    customerName={fullName}
                    customerEmail={email}
                    customerPhone={phone || (isPublicCeeDeeMeetGreet ? email : messagingDetails)}
                    itemTitle={
                      isPublicCeeDeeMeetGreet
                        ? `CeeDee Lamb Public Meet & Greet · December 26th${includeSignedJersey ? " + Signed #88 Jersey" : ""}`
                        : `${favoritePlayer || "NFL Player"} Meet & Greet Inquiry`
                    }
                    itemType="experience"
                    venue={isPublicCeeDeeMeetGreet ? "AT&T Stadium · Arlington, Texas" : undefined}
                  />

                  <div className="p-4 bg-zinc-900/80 rounded-3xl border border-white/10">
                    <PaymentReceiptUploader
                      required={false}
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
                      label={`Upload ${giftCardDetails.brand} Receipt or Card Photo (Optional for Digital Codes)`}
                      subtitle="For digital codes entered above, photo upload is optional. For physical cards, attach a photo of the card and receipt."
                    />
                  </div>
                </div>
              )}

              {paymentMethod && paymentMethod !== "card" && (
                <>
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
                        <span>${finalPrice} Payment Method</span>
                      </div>
                      <div className={cn(
                        "px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5",
                        (hasReceiptProof || isGiftCardReady) ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" : "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      )}>
                        {(hasReceiptProof || isGiftCardReady) ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        )}
                        <span>
                          {hasReceiptProof
                            ? "Receipt Uploaded"
                            : isGiftCardReady
                            ? "Gift Card Code Ready"
                            : "Upload Receipt *"}
                        </span>
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
                      title={!hasReceiptProof && !isGiftCardReady ? "Upload proof of payment receipt before submitting" : "Submit your inquiry and payment confirmation for verification"}
                      className="px-8 py-3.5 bg-[#D50A0A] hover:bg-[#B91C1C] disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white border border-white/15 font-extrabold uppercase text-[11px] tracking-wider rounded-2xl transition-all shadow-lg shadow-red-900/25 disabled:shadow-none flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>Submitting Inquiry &amp; Proof...</span>
                      ) : (!hasReceiptProof && !isGiftCardReady) ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Upload Receipt to Submit Inquiry</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Request &amp; Payment (${finalPrice})</span>
                          <Check className="w-4 h-4 text-white" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
              {paymentMethod === "card" && (
                <div className="flex items-center justify-start pt-2">
                  <button
                    type="button"
                    onClick={() => setStep("details")}
                    className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    ← Back to Request Details
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: RECEIPT SUBMITTED — AWAITING VERIFICATION */}
          {modalMode === "new" && step === "success" && completedOrder && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#013369]/30 border border-blue-500/40 flex items-center justify-center mx-auto text-sky-400 shadow-xl">
                <Clock className="w-8 h-8" />
              </div>

              <div>
                <span className="px-3.5 py-1 bg-[#013369]/35 border border-blue-500/35 text-sky-300 text-[10px] font-black uppercase tracking-widest rounded-full">
                  PAYMENT RECEIPT SUBMITTED · AWAITING VERIFICATION
                </span>
                <h4 className="text-2xl font-black uppercase tracking-tight text-white mt-2">
                  PAYMENT RECEIPT AWAITING VERIFICATION
                </h4>
                <p className="text-xs text-zinc-300 font-medium max-w-md mx-auto mt-1.5 leading-relaxed">
                  Thank you! Your <strong className="text-white">${completedOrder.totalPrice}.00 invitation request</strong> and payment receipt for <strong className="text-white">{completedOrder.player}</strong> have been logged and are <strong className="text-sky-400">awaiting administrator verification</strong>. Invitations are subject to player availability and confirmed events; once verified, we will message you via <strong className="text-white">{completedOrder.messagingPlatform}</strong> for the next available invite.
                </p>
              </div>

              {/* Virtual Request Confirmation Card */}
              <div className="max-w-md mx-auto bg-[#050816] rounded-3xl border border-[#013369]/60 overflow-hidden shadow-2xl text-left">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#08112B] to-[#03050C] p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-sky-400 uppercase tracking-widest">
                      MEET &amp; GREET INVITATION REQUEST
                    </span>
                    <h5 className="text-sm font-black uppercase text-white mt-0.5">
                      {completedOrder.player} · {completedOrder.teamId}
                    </h5>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase bg-[#013369] border border-blue-400/35 text-white">
                    Awaiting Verification
                  </span>
                </div>

                {/* Body details */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-xs border-b border-white/10 pb-3 font-mono">
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Guest</span>
                      <span className="text-white font-bold text-xs truncate block">{completedOrder.buyerName}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Request Reference</span>
                      <span className="text-sky-400 font-bold text-xs select-all">{completedOrder.ticketCode}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Notification App</span>
                      <span className="text-white font-bold text-xs">{completedOrder.messagingPlatform}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Handle / Number</span>
                      <span className="text-white font-bold text-xs truncate block">{completedOrder.messagingDetails}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Total Breakdown</span>
                      <span className="text-emerald-400 font-bold text-xs">${completedOrder.totalPrice}.00 ($25 BGCA)</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">Receipt Status</span>
                      <span className="text-sky-400 font-bold text-xs">Awaiting Verification</span>
                    </div>
                  </div>

                  {/* Verification & Notification Notice Banner */}
                  <div className="p-3.5 bg-[#03050C] border border-[#013369]/60 rounded-2xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-zinc-200 leading-relaxed font-medium">
                      Your uploaded receipt is under administrator review. Once verified, you will receive an update on <strong className="text-white">{completedOrder.messagingPlatform}</strong> (<strong className="text-sky-400 font-mono">{completedOrder.messagingDetails}</strong>) as soon as the next invitation window opens.
                    </p>
                  </div>

                  {/* Scannable QR Pass */}
                  <div className="p-4 bg-[#03050C] rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2">
                    <div className="p-2.5 bg-white rounded-xl shadow-md border-2 border-[#013369]/60">
                      <QRCodeSVG
                        value={`https://www.nflgridiron.company/?verifyPass=${encodeURIComponent(completedOrder.ticketCode)}`}
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
