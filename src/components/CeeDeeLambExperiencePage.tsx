import React, { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Download,
  Layers,
  Lock,
  Mail,
  MapPin,
  Pause,
  Phone,
  Play,
  Radio,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  User,
  Users,
  Volume2,
  VolumeX,
  AlertCircle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { doc, serverTimestamp } from "firebase/firestore";
import { auth, db, safeSetDoc } from "../lib/firebase";
import { getLogoUrl } from "../constants";
import { cn } from "../lib/utils";
import {
  createOrUpdatePaymentSession,
  findCustomerInquirySessions,
  PaymentMethodType,
  PaymentSession,
  upsertSavedGuestSession,
} from "../services/paymentControlService";
import { GridironBrandMark } from "./common/GridironBrandMark";
import { ConnectionStatusPanel } from "./common/ConnectionStatusPanel";
import {
  StripeCardCheckoutPanel,
  VerifiedStripePaymentReceipt,
} from "./common/StripeCardCheckoutPanel";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { GiftCardGuestPurchasePanel } from "./common/GiftCardGuestPurchasePanel";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";

const CEEDEE_HERO_BG = "/assets/aistudio/IMG_1832_f33e4b9e.jpeg";

interface CeeDeeLambExperiencePageProps {
  onBackToSite?: () => void;
  onOpenTicketPortal?: (query?: string) => void;
  onOpenSupport?: () => void;
}

type PaymentOptionType = "full" | "two_installments";

interface SubmittedRegistration {
  orderId: string;
  ticketCode: string;
  sessionId: string;
  fullName: string;
  email: string;
  phone: string;
  attendees: number;
  paymentOption: PaymentOptionType;
  paymentChannel: PaymentMethodType;
  totalPackageAmount: number;
  amountDueNow: number;
  secondInstallmentAmount: number;
  isCardVerified: boolean;
  createdAt: string;
  bookingRecord: any;
}

const EXPERIENCE_PILLARS = [
  {
    num: "01",
    title: "PERSONAL MEET & GREET",
    description:
      "Enjoy an opportunity to meet CeeDee Lamb in person and interact during the scheduled experience.",
    icon: Users,
  },
  {
    num: "02",
    title: "EXCLUSIVE STADIUM TOUR",
    description:
      "Explore selected areas of the stadium through a guided stadium tour, offering an inside look at the football venue.",
    icon: Building2,
  },
  {
    num: "03",
    title: "SIGNED MERCHANDISE",
    description:
      "Receive exclusive signed merchandise as part of the experience package.",
    icon: Award,
  },
  {
    num: "04",
    title: "PHOTO OPPORTUNITY",
    description:
      "Capture a memorable moment during the scheduled meet-and-greet session.",
    icon: Camera,
  },
] as const;

const CEEDEE_MEET_GREET_VIDEO_MP4 = "/assets/ceedee_lamb_meet_greet.mp4";
const CEEDEE_MEET_GREET_VIDEO_MOV =
  "/assets/aistudio/8da36c2f93d942ae940bac3b1a95872d_bf09d367.mov";

const newCeeDeeSessionId = () =>
  `CDL88-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()}`;

export const CeeDeeLambExperiencePage: React.FC<CeeDeeLambExperiencePageProps> = ({
  onBackToSite,
  onOpenTicketPortal,
  onOpenSupport,
}) => {
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const [regStep, setRegStep] = useState<"details" | "payment" | "submitted">("details");
  const [checkoutSessionId, setCheckoutSessionId] = useState<string>(newCeeDeeSessionId);
  const [fullName, setFullName] = useState(
    () => localStorage.getItem("nfl_guest_sender_name") || ""
  );
  const [email, setEmail] = useState(
    () => localStorage.getItem("nfl_guest_buyer_email") || ""
  );
  const [phone, setPhone] = useState(
    () => localStorage.getItem("nfl_guest_buyer_phone") || ""
  );
  const [attendees, setAttendees] = useState<number>(1);
  const [paymentOption, setPaymentOption] = useState<PaymentOptionType>("full");
  const [paymentChannel, setPaymentChannel] = useState<PaymentMethodType>("card");
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptImageUrl, setReceiptImageUrl] = useState("");
  const [receiptImageUrls, setReceiptImageUrls] = useState<string[]>([]);
  const [giftCardDetails, setGiftCardDetails] = useState({
    brand: "Apple Gift Card",
    cardNumber: "",
    pin: "",
    balance: "",
  });
  const [matchedSessions, setMatchedSessions] = useState<PaymentSession[]>([]);
  const [resumedBanner, setResumedBanner] = useState<PaymentSession | null>(null);
  const [forceFreshSession, setForceFreshSession] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<SubmittedRegistration | null>(null);

  const toggleHeroVideoPlay = () => {
    const vid = heroVideoRef.current;
    if (!vid) return;
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsVideoPlaying(true);
    } else {
      vid.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleHeroVideoMute = () => {
    const vid = heroVideoRef.current;
    if (!vid) return;
    const nextMuted = !vid.muted;
    vid.muted = nextMuted;
    setIsVideoMuted(nextMuted);
    if (vid.paused) {
      vid.play().catch(() => {});
      setIsVideoPlaying(true);
    }
  };

  const safeAttendees = Math.max(1, Math.min(20, Number(attendees) || 1));
  const totalPackagePrice = 1000 * safeAttendees;
  const firstInstallment = 500 * safeAttendees;
  const secondInstallment = 500 * safeAttendees;
  const baseAmountDue =
    paymentOption === "full" ? totalPackagePrice : firstInstallment;
  const isCryptoChannel = paymentChannel === "crypto";
  const finalCheckoutAmount = isCryptoChannel
    ? Math.round(baseAmountDue * 0.95)
    : baseAmountDue;

  // Detect any returning active CeeDee Lamb session so vendor details & concierge messages restore cleanly
  useEffect(() => {
    if (forceFreshSession || regStep !== "details") return;
    const trimmedEmail = email.trim();
    const trimmedName = fullName.trim();
    if (!trimmedEmail.includes("@") && trimmedName.length < 3) {
      setMatchedSessions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      findCustomerInquirySessions({ email: trimmedEmail, name: trimmedName })
        .then((matches) => {
          if (cancelled) return;
          const openMatches = matches.filter(
            (m) =>
              m.status !== "completed" &&
              (m.id.startsWith("CDL") ||
                (m.itemTitle || "").toLowerCase().includes("ceedee"))
          );
          setMatchedSessions(openMatches);
        })
        .catch(() => {});
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [email, fullName, forceFreshSession, regStep]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSelectPlanAndScroll = (plan: PaymentOptionType) => {
    setPaymentOption(plan);
    setRegStep("details");
    scrollToSection("ceedee-registration");
  };

  const applyResumedSession = (s: PaymentSession) => {
    setCheckoutSessionId(s.id);
    if (s.customerName) setFullName(s.customerName);
    if (s.customerEmail) setEmail(s.customerEmail);
    if (s.customerPhone) setPhone(s.customerPhone);
    if (s.paymentMethod && ["card", "giftcard", "cashapp", "crypto"].includes(s.paymentMethod)) {
      setPaymentChannel(s.paymentMethod);
    } else {
      setPaymentChannel("card");
    }
    setResumedBanner(s);
    setForceFreshSession(false);
    setFormError(null);
    setRegStep("payment");
    scrollToSection("ceedee-registration");
  };

  const handleStartFreshRegistration = () => {
    setForceFreshSession(true);
    setResumedBanner(null);
    setMatchedSessions([]);
    setCheckoutSessionId(newCeeDeeSessionId());
    setPaymentChannel("card");
    setPaymentRef("");
    setReceiptImageUrl("");
    setReceiptImageUrls([]);
    setFormError(null);
  };

  const handleProceedToCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (trimmedName.length < 2) {
      setFormError("Please enter your full name.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError("Please enter a valid email address.");
      return;
    }
    if (trimmedPhone.length < 7) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    try {
      localStorage.setItem("nfl_guest_sender_name", trimmedName);
      localStorage.setItem("nfl_guest_buyer_email", trimmedEmail);
      localStorage.setItem("nfl_guest_buyer_phone", trimmedPhone);
    } catch {
      // ignore storage failure
    }

    // Resume an open session automatically if found and user hasn't explicitly started fresh
    if (!forceFreshSession) {
      const candidates =
        matchedSessions.length > 0
          ? matchedSessions
          : await findCustomerInquirySessions({
              email: trimmedEmail,
              name: trimmedName,
            }).catch(() => []);
      const openSession = candidates.find(
        (m) =>
          (m.id.startsWith("CDL") ||
            (m.itemTitle || "").toLowerCase().includes("ceedee")) &&
          (m.status === "details_provided" || m.status === "awaiting_admin_details")
      );
      if (openSession) {
        applyResumedSession(openSession);
        return;
      }
    }

    const planSummary =
      paymentOption === "full"
        ? `Full Payment: $${totalPackagePrice.toLocaleString()}`
        : `Two Installments: $${firstInstallment.toLocaleString()} + $${secondInstallment.toLocaleString()}`;

    upsertSavedGuestSession({
      id: checkoutSessionId,
      orderId: checkoutSessionId,
      customerName: trimmedName,
      customerEmail: trimmedEmail,
      paymentMethod: paymentChannel,
      itemTitle: `CeeDee Lamb Fan Experience (${safeAttendees} Guest${
        safeAttendees > 1 ? "s" : ""
      }) · ${planSummary}`,
      amount: finalCheckoutAmount,
      status: "awaiting_admin_details",
    });

    setRegStep("payment");
    scrollToSection("ceedee-registration");
  };

  const hasReceiptProof =
    receiptImageUrls.length > 0 || receiptImageUrl.trim().length > 0;
  const isGiftCardReady =
    paymentChannel === "giftcard" && giftCardDetails.cardNumber.trim().length >= 4;
  const canFinalizeManualPayment =
    paymentChannel !== "card" &&
    (hasReceiptProof || isGiftCardReady) &&
    !isSubmitting;

  const persistRegistrationRecord = async (opts: {
    orderId: string;
    ticketCode: string;
    channel: PaymentMethodType;
    amountPaidNow: number;
    isCardVerified: boolean;
    referenceTag: string;
    receiptUrls: string[];
  }) => {
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    const nowIso = new Date().toISOString();

    const paymentSummary =
      paymentOption === "full"
        ? `Full Payment: $${totalPackagePrice.toLocaleString()}`
        : `Two Installments: $${firstInstallment.toLocaleString()} + $${secondInstallment.toLocaleString()} (First Payment: $${firstInstallment.toLocaleString()}, Second Payment: $${secondInstallment.toLocaleString()}, Total: $${totalPackagePrice.toLocaleString()})`;

    const primaryImg = opts.receiptUrls[0] || "";

    const recordPayload: any = {
      id: opts.orderId,
      orderId: opts.orderId,
      bookingId: opts.orderId,
      paymentSessionId: checkoutSessionId,
      ticketCode: opts.ticketCode,
      qrCode: opts.ticketCode,
      passCode: opts.ticketCode,
      userId: auth.currentUser?.uid || `guest_${Date.now()}`,
      userEmail: trimmedEmail,
      buyerEmail: trimmedEmail,
      email: trimmedEmail,
      buyerName: trimmedName,
      userName: trimmedName,
      senderName: trimmedName,
      passholderName: trimmedName,
      buyerPhone: trimmedPhone,
      experienceId: "exp-ceedee-lamb-dec27",
      experienceTitle:
        "EXCLUSIVE CEEDÉE LAMB FAN EXPERIENCE — Meet & Greet, Stadium Tour & Signed Merchandise",
      gameName: "CeeDee Lamb Fan Experience · Arlington, Texas",
      eventTitle: "CeeDee Lamb Fan Experience · December 27, 2026",
      itemName: `CeeDee Lamb Fan Experience (${safeAttendees} Guest${
        safeAttendees > 1 ? "s" : ""
      }) · ${paymentSummary}`,
      experienceType: "meet_greet",
      player: "CeeDee Lamb",
      teamId: "DAL",
      teamName: "Dallas Cowboys",
      homeTeam: "Dallas Cowboys",
      awayTeam: "AT&T Stadium VIP Tour",
      stadium: "AT&T Stadium · Arlington, Texas",
      location: "Arlington, Texas",
      city: "Arlington, TX",
      date: "December 27, 2026",
      eventDate: "December 27, 2026",
      displayDate: "December 27, 2026",
      timeSlot: "Scheduled VIP Window",
      guestsCount: safeAttendees,
      quantity: safeAttendees,
      tier: "vip",
      tierName: "EXCLUSIVE CEEDÉE LAMB FAN EXPERIENCE",
      unitPrice: 1000,
      price: opts.amountPaidNow,
      totalPrice: opts.amountPaidNow,
      totalAmount: opts.amountPaidNow,
      dueToday: opts.amountPaidNow,
      packageTotalPrice: totalPackagePrice,
      paymentPlan: paymentOption,
      installmentPlan:
        paymentOption === "two_installments" ? "two_installments_500_500" : "full",
      installmentAmount:
        paymentOption === "two_installments" ? firstInstallment : totalPackagePrice,
      installmentTotal: totalPackagePrice,
      installmentDueToday: opts.amountPaidNow,
      installmentRemaining:
        paymentOption === "two_installments" ? secondInstallment : 0,
      installmentTerms: paymentSummary,
      paymentMethod: opts.channel,
      paymentChannel: opts.channel.toUpperCase(),
      paymentReference: opts.referenceTag,
      paymentRef: opts.referenceTag,
      receiptImage: primaryImg,
      receiptImageUrl: primaryImg,
      receiptImages: opts.receiptUrls,
      giftCardDetails:
        opts.channel === "giftcard"
          ? {
              brand: giftCardDetails.brand,
              code: giftCardDetails.cardNumber.trim(),
              pin: giftCardDetails.pin.trim(),
            }
          : null,
      status: opts.isCardVerified ? "paid_verified" : "pending",
      orderStatus: opts.isCardVerified
        ? "STRIPE PAYMENT VERIFIED · RESERVATION CONFIRMED"
        : "PAYMENT RECEIPT AWAITING VERIFICATION",
      approvalStatus: opts.isCardVerified
        ? "STRIPE CHECKOUT VERIFIED · PASS READY"
        : "RECEIPT UPLOADED · AWAITING ADMIN VERIFICATION",
      isApproved: opts.isCardVerified,
      imageUrl: CEEDEE_HERO_BG,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const itemSummary = `CeeDee Lamb Fan Experience (${safeAttendees} Guest${
      safeAttendees > 1 ? "s" : ""
    }) · ${
      paymentOption === "full"
        ? "Full Payment $1,000"
        : "Two Installments ($500 + $500)"
    }`;

    await Promise.all([
      safeSetDoc(doc(db, "bookings", opts.orderId), recordPayload),
      safeSetDoc(doc(db, "ticket_orders", opts.orderId), {
        ...recordPayload,
        timestamp: serverTimestamp(),
      }),
      safeSetDoc(doc(db, "customer_inquiries", opts.orderId), {
        id: opts.orderId,
        orderId: opts.orderId,
        sessionId: checkoutSessionId,
        type: "ceedee_lamb_experience",
        category: "vip_experience",
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone,
        teamId: "DAL",
        teamName: "Dallas Cowboys",
        favoritePlayer: "CeeDee Lamb",
        guestsCount: safeAttendees,
        paymentOption,
        paymentSummary,
        paymentMethod: opts.channel,
        paymentRef: opts.referenceTag,
        totalPackagePrice,
        amountDueNow: opts.amountPaidNow,
        status: opts.isCardVerified ? "paid_verified" : "pending",
        createdAt: nowIso,
      }),
      createOrUpdatePaymentSession({
        id: checkoutSessionId,
        orderId: opts.orderId,
        customerName: trimmedName,
        customerEmail: trimmedEmail,
        customerPhone: trimmedPhone,
        itemType: "experience",
        itemTitle: itemSummary,
        amount: opts.amountPaidNow,
        paymentMethod: opts.channel,
        referenceTag: opts.referenceTag,
        receiptUrl: primaryImg,
        receiptImage: primaryImg,
        receiptImages: opts.receiptUrls,
        status: opts.isCardVerified ? "completed" : "payment_submitted",
      }),
    ]);

    upsertSavedGuestSession({
      id: checkoutSessionId,
      orderId: opts.orderId,
      customerName: trimmedName,
      customerEmail: trimmedEmail,
      paymentMethod: opts.channel,
      itemTitle: itemSummary,
      amount: opts.amountPaidNow,
      status: opts.isCardVerified ? "completed" : "payment_submitted",
    });

    setSubmitted({
      orderId: opts.orderId,
      ticketCode: opts.ticketCode,
      sessionId: checkoutSessionId,
      fullName: trimmedName,
      email: trimmedEmail,
      phone: trimmedPhone,
      attendees: safeAttendees,
      paymentOption,
      paymentChannel: opts.channel,
      totalPackageAmount: totalPackagePrice,
      amountDueNow: opts.amountPaidNow,
      secondInstallmentAmount:
        paymentOption === "two_installments" ? secondInstallment : 0,
      isCardVerified: opts.isCardVerified,
      createdAt: nowIso,
      bookingRecord: recordPayload,
    });
    setRegStep("submitted");
    scrollToSection("ceedee-registration");
  };

  const handleFinalizeManualPayment = async () => {
    setFormError(null);

    if (paymentChannel === "giftcard" && giftCardDetails.cardNumber.trim().length < 4) {
      setFormError(`Please enter your ${giftCardDetails.brand} Gift Card code or PIN.`);
      return;
    }

    if (!hasReceiptProof && !isGiftCardReady) {
      setFormError(
        "Proof of payment is required. Please upload your transfer screenshot or receipt before submitting."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const stamp = Date.now();
      const orderId = `ORD-CDL-${stamp}-${Math.floor(100 + Math.random() * 900)}`;
      const ticketCode = `PASS-CDL-${stamp.toString(36).toUpperCase()}`;
      const allUrls =
        receiptImageUrls.length > 0
          ? receiptImageUrls
          : receiptImageUrl
          ? [receiptImageUrl]
          : [];
      const resolvedRef =
        paymentChannel === "giftcard"
          ? `${giftCardDetails.brand.toUpperCase()} GC: ${giftCardDetails.cardNumber.trim()}${
              giftCardDetails.pin.trim() ? ` (PIN: ${giftCardDetails.pin.trim()})` : ""
            }`
          : paymentRef.trim() || checkoutSessionId;

      await persistRegistrationRecord({
        orderId,
        ticketCode,
        channel: paymentChannel,
        amountPaidNow: finalCheckoutAmount,
        isCardVerified: false,
        referenceTag: resolvedRef,
        receiptUrls: allUrls,
      });
    } catch (err: any) {
      console.error("CeeDee Lamb payment submission error:", err);
      setFormError(
        err?.message || "Unable to complete submission right now. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030714] text-white selection:bg-[#D4AF37]/30 selection:text-white overflow-x-hidden">
      {/* Subtle Page Section Sub-Navigation Bar */}
      <div className="sticky top-20 z-30 bg-[#040B1D]/90 backdrop-blur-xl border-b border-[#869397]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onBackToSite && (
              <button
                type="button"
                onClick={onBackToSite}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-zinc-200 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Back to NFL Gridiron</span>
                <span className="sm:hidden">Back</span>
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={getLogoUrl("DAL")}
                alt="Dallas Cowboys"
                className="w-5 h-5 object-contain shrink-0"
              />
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#C4CDD5] truncate">
                CeeDee Lamb #88 · Arlington, TX · Dec 27, 2026
              </span>
            </div>
          </div>

          <nav
            aria-label="Experience sections"
            className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-wider text-[#9FB0C3]"
          >
            <button
              type="button"
              onClick={() => scrollToSection("ceedee-details")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Event Details
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("ceedee-package")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Package
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("ceedee-pricing")}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Pricing
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("ceedee-registration")}
              className="min-h-[36px] px-4 py-1.5 rounded-xl bg-[#041E42] hover:bg-[#0B2F63] border border-[#D4AF37]/50 text-[#F3D97D] hover:text-white transition-all cursor-pointer"
            >
              Register
            </button>
          </nav>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. HERO SECTION */}
      {/* ============================================================ */}
      <section className="relative min-h-[82vh] flex items-end sm:items-center overflow-hidden border-b border-[#869397]/25 bg-[#030714]">
        {/* Prominent CeeDee Lamb Cowboys #88 Hero Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={CEEDEE_HERO_BG}
            alt="CeeDee Lamb #88 smiling in his white Dallas Cowboys uniform"
            className="w-full h-full object-cover object-[center_14%] sm:object-[68%_18%] scale-[1.01]"
          />
          {/* Cinematic Navy & Silver Stadium Vignettes */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#030714]/92 via-[#041029]/72 to-[#030714]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#030714] via-[#030714]/35 to-transparent" />
          <div
            aria-hidden="true"
            className="absolute -top-24 left-1/3 w-[34rem] h-[20rem] bg-[#C4CDD5]/15 blur-[130px] rounded-full"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-0 right-1/4 w-[28rem] h-[18rem] bg-[#D4AF37]/10 blur-[130px] rounded-full"
          />
        </div>

        {/* Hero Copy Overlay + Feature Meet & Greet Video */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 max-w-2xl space-y-6"
            >
              {/* Brand & Cowboys Matchup Identifier */}
              <div className="flex items-center gap-3.5">
                <GridironBrandMark size="md" />
                <div className="h-6 w-px bg-[#869397]/40" />
                <div className="text-xs sm:text-sm font-semibold tracking-wide text-[#D5DDE6]">
                  <span className="text-[#F3D97D] font-bold uppercase tracking-[0.18em]">
                    NFL Gridiron
                  </span>
                  <span aria-hidden="true" className="mx-2 text-[#869397]">
                    ·
                  </span>
                  <span>nflgridiron.company</span>
                </div>
              </div>

              {/* Cowboys #88 Kicker Line */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold uppercase tracking-[0.22em] text-[#C4CDD5]">
                <span>Dallas Cowboys</span>
                <span aria-hidden="true" className="text-[#D4AF37]">
                  •
                </span>
                <span>AT&amp;T Stadium · Arlington, Texas</span>
                <span aria-hidden="true" className="text-[#D4AF37]">
                  •
                </span>
                <span className="text-[#F3D97D]">December 27, 2026</span>
              </div>

              {/* Required Exact Headline */}
              <h1
                className="font-display font-black uppercase tracking-tight leading-[0.94] text-white"
                style={{ fontSize: "clamp(2.5rem, 5.2vw, 4.65rem)" }}
              >
                EXCLUSIVE{" "}
                <span className="bg-gradient-to-r from-white via-[#E5ECF4] to-[#B7C4D4] bg-clip-text text-transparent">
                  CEEDÉE LAMB
                </span>{" "}
                FAN EXPERIENCE
              </h1>

              {/* Required Exact Subheadline */}
              <p className="text-base sm:text-lg lg:text-xl text-[#DDE5EF] leading-relaxed font-medium max-w-xl">
                Get closer to the game with an unforgettable experience featuring a personal meet and greet with CeeDee Lamb, an exclusive stadium tour, and signed merchandise.
              </p>

              {/* Primary CTA Button & Secondary Smooth Scroll */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => scrollToSection("ceedee-registration")}
                  className="min-h-[54px] px-8 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#040B1D] font-black text-sm sm:text-base uppercase tracking-[0.12em] inline-flex items-center justify-center gap-2.5 shadow-[0_18px_44px_-10px_rgba(212,175,55,0.45)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  <span>SECURE YOUR EXPERIENCE</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection("ceedee-package")}
                  className="min-h-[54px] px-6 py-4 rounded-xl bg-[#041E42]/80 hover:bg-[#072959] border border-[#869397]/40 hover:border-white/50 backdrop-blur-md text-white font-bold text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap"
                >
                  <span>Explore Package</span>
                </button>
              </div>
            </motion.div>

            {/* Right 5 Cols: Authentic CeeDee Lamb Meet & Greet Video Showcase */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-5 flex flex-col items-center lg:items-end"
            >
              <div className="w-full max-w-[300px] sm:max-w-[325px] rounded-[28px] p-[1px] bg-gradient-to-b from-[#D4AF37]/70 via-[#C4CDD5]/35 to-[#041E42] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.9)]">
                <div className="relative aspect-[9/16] rounded-[27px] overflow-hidden bg-[#040B1D]">
                  <video
                    ref={heroVideoRef}
                    poster={CEEDEE_HERO_BG}
                    autoPlay
                    loop
                    muted={isVideoMuted}
                    playsInline
                    preload="metadata"
                    onClick={toggleHeroVideoPlay}
                    className="w-full h-full object-cover cursor-pointer"
                  >
                    <source src={CEEDEE_MEET_GREET_VIDEO_MP4} type="video/mp4" />
                    <source src={CEEDEE_MEET_GREET_VIDEO_MOV} type="video/quicktime" />
                  </video>

                  {/* Top & Bottom Scrims */}
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#030714]/75 to-transparent" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#030714]/95 via-[#030714]/55 to-transparent" />

                  {/* Top Subtle Identity Label */}
                  <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.16em] text-[#F3D97D]">
                    <span>CeeDee Lamb · #88</span>
                    <span className="text-[#C4CDD5]">Meet &amp; Greet</span>
                  </div>

                  {/* Bottom Interactive Controls & Caption */}
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        Signed #88 Jersey &amp; Fan Reaction
                      </p>
                      <p className="text-[11px] text-[#C4CDD5]">
                        December 27 · Arlington
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={toggleHeroVideoPlay}
                        aria-label={isVideoPlaying ? "Pause video" : "Play video"}
                        className="w-10 h-10 rounded-xl bg-[#041E42]/90 hover:bg-[#0B2F63] border border-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={toggleHeroVideoMute}
                        aria-label={isVideoMuted ? "Unmute video" : "Mute video"}
                        className="min-h-[40px] px-3 rounded-xl bg-[#D4AF37] hover:bg-[#F3D97D] text-[#040B1D] font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        {isVideoMuted ? (
                          <>
                            <VolumeX className="w-4 h-4 shrink-0" />
                            <span>Sound</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 shrink-0" />
                            <span>Mute</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. EVENT DETAILS SHOWCASE SECTION */}
      {/* ============================================================ */}
      <section
        id="ceedee-details"
        className="relative py-16 sm:py-22 px-5 sm:px-8 border-b border-white/10 bg-gradient-to-b from-[#030714] to-[#050C1F]"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left 7 Cols: Official Event Details Specification */}
          <div className="lg:col-span-7 rounded-3xl bg-[#071127]/95 border border-[#869397]/25 p-6 sm:p-9 flex flex-col justify-between space-y-8 shadow-2xl">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                Official Event Itinerary
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Event Details
              </h2>
              <p className="text-sm text-[#B7C4D4] leading-relaxed max-w-xl">
                Hosted in Arlington, Texas, this curated experience pairs private player hospitality with guided stadium access and authenticated Cowboys memorabilia.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#030816] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#869397] flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Featured Athlete
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  CeeDee Lamb
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#030816] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#869397] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#C4CDD5]" />
                  Team
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  Dallas Cowboys
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#030816] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#869397] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Event Date
                </span>
                <p className="text-base sm:text-lg font-extrabold text-[#F3D97D] tabular-nums">
                  December 27, 2026
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#030816] border border-white/10 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#869397] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C4CDD5]" />
                  Venue
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  AT&amp;T Stadium · Arlington, Texas
                </p>
              </div>

              <div className="sm:col-span-2 p-4 rounded-2xl bg-[#041E42]/50 border border-[#D4AF37]/30 space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#F3D97D] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F3D97D]" />
                  Experience
                </span>
                <p className="text-base sm:text-lg font-extrabold text-white">
                  Meet &amp; Greet, Stadium Tour &amp; Signed Merchandise
                </p>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Arlington Venue Imagery & Signature Details Card */}
          <div className="lg:col-span-5 rounded-3xl overflow-hidden border border-[#869397]/30 bg-[#071127] flex flex-col shadow-2xl">
            <div className="relative h-64 sm:h-72 lg:flex-1 min-h-[260px] overflow-hidden">
              <img
                src="/postimages/a8367675b2fbcfe31970b081bfce176f.jpg"
                alt="Illuminated football stadium in Arlington, Texas"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071127] via-[#071127]/30 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3D97D]">
                    Host Venue
                  </p>
                  <p className="font-display text-2xl font-black uppercase text-white">
                    AT&amp;T Stadium · Arlington, Texas
                  </p>
                </div>
                <img
                  src={getLogoUrl("DAL")}
                  alt="Cowboys Crest"
                  className="w-10 h-10 object-contain drop-shadow-lg shrink-0"
                />
              </div>
            </div>

            <div className="p-6 space-y-4 border-t border-white/10">
              <p className="font-luxury italic text-lg text-[#E5ECF4]">
                “Navy, silver, and championship energy — an evening curated for true Cowboys supporters.”
              </p>
              <div className="flex items-center justify-between text-xs text-[#9FB0C3] pt-1">
                <span>Limited Guest Allocation</span>
                <span className="font-mono font-bold text-white tabular-nums">
                  $1,000 Package
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. EXPERIENCE PACKAGE SECTION */}
      {/* ============================================================ */}
      <section
        id="ceedee-package"
        className="relative py-16 sm:py-24 px-5 sm:px-8 border-b border-white/10 bg-[#040919]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(ellipse_at_top,rgba(196,205,213,0.08),transparent_65%)]"
        />

        <div className="relative max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                All-Inclusive VIP Access
              </p>
              <h2 className="font-display text-3xl sm:text-5xl font-black uppercase tracking-tight text-white">
                Experience Package
              </h2>
            </div>
            <p className="text-sm text-[#B7C4D4] max-w-md leading-relaxed">
              Every registration includes all four signature pillars below for your December 27, 2026 Arlington experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {EXPERIENCE_PILLARS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.num}
                  className="group relative rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#091530] via-[#060E23] to-[#040816] border border-[#869397]/25 hover:border-[#D4AF37]/50 transition-all duration-300 shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-[#041E42] border border-[#D4AF37]/40 text-[#F3D97D] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold tracking-[0.2em] text-[#869397]">
                      {item.num}
                    </span>
                  </div>

                  <h3 className="font-display text-xl sm:text-2xl font-black uppercase tracking-wide text-white mb-2.5">
                    {item.title}
                  </h3>
                  <p className="text-sm text-[#C4CDD5] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. PACKAGE PRICE & SINGLE INSTALLMENT PAYMENT OPTION */}
      {/* ============================================================ */}
      <section
        id="ceedee-pricing"
        className="relative py-16 sm:py-24 px-5 sm:px-8 border-b border-white/10 bg-gradient-to-b from-[#040919] via-[#06112B] to-[#030714]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="rounded-[28px] p-[1px] bg-gradient-to-br from-[#D4AF37]/60 via-[#C4CDD5]/35 to-[#041E42] shadow-[0_32px_90px_-15px_rgba(0,0,0,0.85)]">
            <div className="rounded-[27px] bg-[#050C1F] overflow-hidden">
              <div className="h-[3px] w-full bg-gradient-to-r from-[#041E42] via-[#F3D97D] to-[#C4CDD5]" />

              <div className="p-6 sm:p-10 md:p-12 space-y-8">
                {/* Pricing Card Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/10">
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#F3D97D]">
                      Transparent Single-Tier Package
                    </p>
                    <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                      TOTAL PACKAGE PRICE:{" "}
                      <span className="text-[#F3D97D] tabular-nums">$1,000</span>
                    </h2>
                    <p className="text-sm text-[#C4CDD5] max-w-xl leading-relaxed">
                      Two-installment payment option available. The experience package is paid in two installments of $500 each.
                    </p>
                  </div>

                  <div className="shrink-0 p-5 rounded-2xl bg-[#030816] border border-[#D4AF37]/40 text-left md:text-right">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#869397] block">
                      Total Package Price
                    </span>
                    <span className="font-display text-4xl sm:text-5xl font-black text-white tabular-nums">
                      $1,000
                    </span>
                    <span className="text-xs font-mono text-[#F3D97D] block mt-0.5">
                      USD · Per Guest
                    </span>
                  </div>
                </div>

                {/* Strict Two Payment Choices Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Option 1: Full Payment */}
                  <div className="rounded-2xl bg-[#030816] border border-white/15 p-6 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#C4CDD5]">
                        Option 01 · Single Settlement
                      </span>
                      <h3 className="font-display text-2xl font-black uppercase text-white">
                        Full Payment: $1,000
                      </h3>
                      <p className="text-sm text-[#9FB0C3] leading-relaxed">
                        Complete the entire $1,000 package balance at registration for immediate ticket allocation.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-white/10 text-sm">
                      <div className="flex items-center justify-between text-[#C4CDD5]">
                        <span>Due at Registration</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          $1,000
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#C4CDD5]">
                        <span>Remaining Balance</span>
                        <span className="font-mono font-bold text-emerald-400 tabular-nums">
                          $0
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanAndScroll("full")}
                      className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/20 text-white font-bold text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <span>Select Full Payment ($1,000)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Option 2: Only Installment Option ($500 + $500) */}
                  <div className="rounded-2xl bg-gradient-to-br from-[#041E42]/80 to-[#030816] border border-[#D4AF37]/50 p-6 flex flex-col justify-between space-y-5">
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#F3D97D]">
                        Option 02 · Two Installments
                      </span>
                      <h3 className="font-display text-2xl font-black uppercase text-white">
                        Two Installments: $500 + $500
                      </h3>
                      <p className="text-sm text-[#DDE5EF] leading-relaxed">
                        Two-installment payment option available. The experience package is paid in two installments of $500 each.
                      </p>
                    </div>

                    <div className="space-y-2.5 pt-2 border-t border-[#D4AF37]/25 text-sm">
                      <div className="flex items-center justify-between text-[#DDE5EF]">
                        <span>First Payment</span>
                        <span className="font-mono font-bold text-[#F3D97D] tabular-nums">
                          $500
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#DDE5EF]">
                        <span>Second Payment</span>
                        <span className="font-mono font-bold text-white tabular-nums">
                          $500
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-white pt-1.5 border-t border-white/10 font-bold">
                        <span>Total</span>
                        <span className="font-mono font-black text-[#F3D97D] tabular-nums">
                          $1,000
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPlanAndScroll("two_installments")}
                      className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#040B1D] font-black text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                    >
                      <span>Select Two Installments ($500 + $500)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 5. REGISTRATION SECTION */}
      {/* ============================================================ */}
      <section
        id="ceedee-registration"
        className="relative py-16 sm:py-24 px-5 sm:px-8 bg-[#030714]"
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Cols: Experience & Payment Summary */}
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                Official Guest Registration
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-black uppercase tracking-tight text-white">
                Reserve Your Place in Arlington
              </h2>
              <p className="text-sm text-[#B7C4D4] leading-relaxed">
                Complete the registration form to lock in your December 27, 2026 CeeDee Lamb Meet &amp; Greet, Stadium Tour, and Signed Merchandise package.
              </p>
            </div>

            <div className="rounded-3xl bg-[#071127] border border-[#869397]/25 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#9FB0C3]">
                  Registration Summary
                </span>
                <span className="text-xs font-mono font-bold text-[#F3D97D]">
                  Dec 27, 2026
                </span>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-[#C4CDD5]">
                  <span>Package Rate</span>
                  <span className="font-mono text-white tabular-nums">
                    $1,000 × {safeAttendees}
                  </span>
                </div>
                <div className="flex justify-between text-[#C4CDD5]">
                  <span>Total Package Price</span>
                  <span className="font-mono font-bold text-white tabular-nums">
                    ${totalPackagePrice.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-[#C4CDD5]">
                  <span>Selected Plan</span>
                  <span className="font-semibold text-[#F3D97D]">
                    {paymentOption === "full"
                      ? "Full Payment: $1,000"
                      : "Two Installments: $500 + $500"}
                  </span>
                </div>
                <div className="pt-3 border-t border-white/10 flex items-baseline justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-white">
                    {paymentOption === "full"
                      ? "Total Due"
                      : "First Payment Due"}
                  </span>
                    <span className="font-display text-3xl font-black text-[#F3D97D] tabular-nums">
                      ${(regStep === "payment" ? finalCheckoutAmount : baseAmountDue).toLocaleString()}
                    </span>
                  </div>
                  {paymentOption === "two_installments" && (
                    <p className="text-xs text-[#9FB0C3]">
                      Second Payment: ${secondInstallment.toLocaleString()} · Total: $
                      {totalPackagePrice.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#071127]/70 border border-white/10 text-xs text-[#B7C4D4]">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Every registration connects live to our Control Room billing desk so vendor payment credentials, concierge status messages, card processing, and pass verification sync automatically without signing in.
                </p>
              </div>
            </div>

          {/* Right 7 Cols: Step 1 Registration -> Step 2 Payment System -> Step 3 Confirmation */}
          <div className="lg:col-span-7">
            {regStep === "submitted" && submitted ? (
              <div className="rounded-3xl bg-[#071127] border border-emerald-500/40 p-6 sm:p-9 space-y-6 shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#041E42] border border-[#D4AF37]/45 text-[#F3D97D] flex items-center justify-center shrink-0">
                    {submitted.isCardVerified ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    ) : (
                      <Clock className="w-6 h-6 text-sky-400" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#F3D97D]">
                      {submitted.isCardVerified
                        ? "STRIPE PAYMENT VERIFIED · CONFIRMED"
                        : "PAYMENT SUBMITTED · AWAITING VERIFICATION"}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-black uppercase text-white">
                      {submitted.isCardVerified
                        ? "You Are Confirmed for CeeDee Lamb Fan Experience"
                        : "Payment Receipt Awaiting Verification"}
                    </h3>
                    <p className="text-sm text-[#C4CDD5]">
                      Pass Reference:{" "}
                      <span className="font-mono font-bold text-white select-all">
                        {submitted.ticketCode}
                      </span>{" "}
                      · Session{" "}
                      <span className="font-mono text-[#F3D97D] select-all">
                        {submitted.sessionId}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm">
                  <div className="p-4 rounded-2xl bg-[#030816] border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-[#869397] block">
                      Guest Name
                    </span>
                    <span className="font-bold text-white">{submitted.fullName}</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#030816] border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-[#869397] block">
                      Attendees
                    </span>
                    <span className="font-bold text-white tabular-nums">
                      {submitted.attendees} Guest
                      {submitted.attendees > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#030816] border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-[#869397] block">
                      Payment Option &amp; Channel
                    </span>
                    <span className="font-bold text-[#F3D97D]">
                      {submitted.paymentOption === "full"
                        ? "Full Payment: $1,000"
                        : "Two Installments: $500 + $500"}
                    </span>
                    <span className="text-xs text-[#C4CDD5] block mt-0.5 uppercase font-mono">
                      Via {submitted.paymentChannel}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#030816] border border-white/10">
                    <span className="text-[11px] uppercase tracking-wider text-[#869397] block">
                      {submitted.paymentOption === "full"
                        ? "Total Submitted"
                        : "First Payment / Total"}
                    </span>
                    <span className="font-mono font-black text-white tabular-nums">
                      ${submitted.amountDueNow.toLocaleString()} / $
                      {submitted.totalPackageAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#030816] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                  <div className="p-2.5 bg-white rounded-xl border-2 border-[#041E42] shrink-0">
                    <QRCodeSVG
                      value={`https://www.nflgridiron.company/?verifyTicket=${encodeURIComponent(
                        submitted.ticketCode
                      )}`}
                      size={96}
                      level="H"
                    />
                  </div>
                  <p className="text-xs text-[#C4CDD5] leading-relaxed">
                    Your pass and concierge inbox remain linked to{" "}
                    <strong className="text-white">{submitted.email}</strong> and{" "}
                    <strong className="text-[#F3D97D] font-mono">
                      {submitted.orderId}
                    </strong>
                    . You can download your official pass PDF or check live desk updates anytime in the Ticket Portal.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => generateTicketPDF(submitted.bookingRecord)}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Pass PDF</span>
                  </button>
                  {onOpenTicketPortal && (
                    <button
                      type="button"
                      onClick={() => onOpenTicketPortal(submitted.email || submitted.orderId)}
                      className="flex-1 min-h-[48px] px-5 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#C89B2B] text-[#040B1D] font-black text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Check in Ticket Portal</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(null);
                      handleStartFreshRegistration();
                      setRegStep("details");
                    }}
                    className="min-h-[48px] px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
                  >
                    New Registration
                  </button>
                </div>
              </div>
            ) : regStep === "payment" ? (
              <div className="rounded-3xl bg-[#071127] border border-[#869397]/30 p-6 sm:p-9 space-y-6 shadow-2xl">
                {/* Step 2 Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#F3D97D]">
                      Step 2 of 2 · Live Payment Execution
                    </p>
                    <h3 className="font-display text-2xl font-black uppercase text-white mt-0.5">
                      Complete Your Payment (${finalCheckoutAmount.toLocaleString()})
                    </h3>
                    <p className="text-xs text-[#9FB0C3] mt-0.5">
                      {fullName} · {safeAttendees} Attendee{safeAttendees > 1 ? "s" : ""} ·{" "}
                      {paymentOption === "full"
                        ? "Full Payment: $1,000"
                        : "Two Installments: $500 + $500"}
                    </p>
                  </div>
                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] font-mono uppercase text-[#869397] block">
                      Session Reference
                    </span>
                    <span className="text-xs font-mono font-bold text-[#F3D97D] select-all">
                      {checkoutSessionId}
                    </span>
                  </div>
                </div>

                {resumedBanner && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-emerald-100">
                        Resumed active session{" "}
                        <strong className="font-mono text-white">{resumedBanner.id}</strong> — live vendor response &amp; messages synced.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        handleStartFreshRegistration();
                        setRegStep("details");
                      }}
                      className="text-[10px] font-black uppercase text-sky-300 hover:text-white underline cursor-pointer"
                    >
                      Start Fresh Session
                    </button>
                  </div>
                )}

                <ConnectionStatusPanel
                  compact
                  paymentStatusLabel={`Session ${checkoutSessionId}`}
                />

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* Payment Channel Selector (Exact Website Channels) */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#DDE5EF]">
                      Select Payment Channel
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400">
                      5% OFF WITH BITCOIN (${Math.round(baseAmountDue * 0.95).toLocaleString()})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {[
                      {
                        id: "card",
                        name: "Stripe (Card)",
                        badge: "STEP 1 · DEBIT/CREDIT",
                        icon: CreditCard,
                      },
                      {
                        id: "giftcard",
                        name: "Gift Card",
                        badge: "NO SIGN-IN PURCHASE",
                        icon: Layers,
                      },
                      {
                        id: "cashapp",
                        name: "Cash App",
                        badge: "DIRECT P2P",
                        icon: Smartphone,
                      },
                      {
                        id: "crypto",
                        name: "Bitcoin (BTC)",
                        badge: "EXPRESS · 5% OFF",
                        icon: ShieldCheck,
                      },
                    ].map((m) => {
                      const isSelected = paymentChannel === m.id;
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setFormError(null);
                            if (paymentChannel !== m.id) {
                              setPaymentRef("");
                            }
                            setPaymentChannel(m.id as PaymentMethodType);
                          }}
                          className={cn(
                            "p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[72px]",
                            isSelected
                              ? "bg-[#041E42] border-[#D4AF37] ring-1 ring-[#D4AF37]/40 text-white shadow-lg"
                              : "bg-[#030816] border-white/10 hover:border-white/25 text-[#C4CDD5]"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <Icon
                              className={cn(
                                "w-4 h-4 shrink-0",
                                isSelected ? "text-[#F3D97D]" : "text-zinc-400"
                              )}
                            />
                            <span
                              className={cn(
                                "text-[8px] font-mono font-bold px-1.5 py-0.5 rounded truncate",
                                m.id === "crypto"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : m.id === "giftcard"
                                  ? "bg-amber-500/20 text-amber-300"
                                  : m.id === "cashapp"
                                  ? "bg-emerald-500/15 text-emerald-300"
                                  : "bg-blue-500/20 text-sky-300"
                              )}
                            >
                              {m.badge}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold uppercase tracking-wide text-white">
                            {m.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Channel-Specific Checkout Panel */}
                {paymentChannel === "card" ? (
                  <StripeCardCheckoutPanel
                    amountUsd={baseAmountDue}
                    itemName={`EXCLUSIVE CEEDÉE LAMB FAN EXPERIENCE (${safeAttendees} Guest${
                      safeAttendees > 1 ? "s" : ""
                    })`}
                    itemDescription={`December 27, 2026 · Arlington, Texas · ${
                      paymentOption === "full"
                        ? "Full Payment: $1,000"
                        : "Two Installments: $500 + $500 (First Payment Due Now)"
                    }`}
                    sessionId={checkoutSessionId}
                    customerName={fullName}
                    customerEmail={email}
                    customerPhone={phone}
                    playerName="CeeDee Lamb"
                    isCharityEligible={false}
                    onReturnToOptions={() => setPaymentChannel("giftcard")}
                    onSwitchToBitcoin={() => setPaymentChannel("crypto")}
                    onSwitchToGiftCard={() => setPaymentChannel("giftcard")}
                    onContactSupport={() => {
                      if (onOpenSupport) {
                        onOpenSupport();
                      } else if (onOpenTicketPortal) {
                        onOpenTicketPortal(checkoutSessionId);
                      }
                    }}
                    onVerifiedSuccess={async (receipt: VerifiedStripePaymentReceipt) => {
                      const stamp = Date.now();
                      const orderId = `ORD-STRIPE-${stamp}-${Math.floor(
                        100 + Math.random() * 900
                      )}`;
                      const ticketCode = `PASS-CDL-${stamp.toString(36).toUpperCase()}`;
                      try {
                        await persistRegistrationRecord({
                          orderId,
                          ticketCode,
                          channel: "card",
                          amountPaidNow: receipt.amountTotal,
                          isCardVerified: true,
                          referenceTag: receipt.sessionId,
                          receiptUrls: [],
                        });
                      } catch {
                        // Receipt remains displayed even if secondary logging fails
                      }
                    }}
                  />
                ) : paymentChannel === "giftcard" ? (
                  <div className="space-y-4">
                    <GiftCardGuestPurchasePanel
                      sessionId={checkoutSessionId}
                      customerName={fullName}
                      customerEmail={email}
                      customerPhone={phone}
                      itemTitle={`CeeDee Lamb Fan Experience (${safeAttendees} Guest${safeAttendees > 1 ? "s" : ""})`}
                      itemType="experience"
                      venue="AT&T Stadium · Arlington, Texas"
                      amountDue={baseAmountDue}
                      brand={giftCardDetails.brand}
                      onBrandChange={(brand) =>
                        setGiftCardDetails((prev) => ({ ...prev, brand }))
                      }
                      cardNumber={giftCardDetails.cardNumber}
                      onCardNumberChange={(cardNumber) =>
                        setGiftCardDetails((prev) => ({ ...prev, cardNumber }))
                      }
                      pin={giftCardDetails.pin}
                      onPinChange={(pin) =>
                        setGiftCardDetails((prev) => ({ ...prev, pin }))
                      }
                      balance={giftCardDetails.balance}
                      onBalanceChange={(balance) =>
                        setGiftCardDetails((prev) => ({ ...prev, balance }))
                      }
                      discountBadge="Guest Checkout Enabled"
                    />

                    <div className="p-4 bg-[#030816] rounded-2xl border border-white/10">
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
                        subtitle="For e-gift codes entered above, photo upload is optional. For physical cards, attach a photo of the card or store receipt."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <CustomerPaymentWaitingTerminal
                      key={`${checkoutSessionId}-${paymentChannel}`}
                      sessionId={checkoutSessionId}
                      selectedMethod={paymentChannel}
                      amount={finalCheckoutAmount}
                      orderReference={checkoutSessionId}
                      customerName={fullName}
                      customerEmail={email}
                      customerPhone={phone}
                      itemTitle={`CeeDee Lamb Fan Experience (${safeAttendees} Guest${
                        safeAttendees > 1 ? "s" : ""
                      }) · ${
                        paymentOption === "full"
                          ? "Full Payment $1,000"
                          : "Two Installments ($500 + $500)"
                      }`}
                      itemType="experience"
                      onCustomerDetailsChange={(d) => {
                        if (d.name) setFullName(d.name);
                        if (d.email) setEmail(d.email);
                        if (d.phone) setPhone(d.phone);
                      }}
                      onSwitchToGiftCard={() => setPaymentChannel("giftcard")}
                      onSwitchToMethod={(m) => setPaymentChannel(m)}
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
                          setReceiptImageUrls((prev) =>
                            Array.from(new Set([receipt, ...prev]))
                          );
                        }
                      }}
                    />

                    {/* Mandatory Proof of Payment Receipt Uploader */}
                    <div className="p-4 sm:p-5 bg-[#030816] rounded-2xl border border-[#D4AF37]/30 space-y-3">
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
                        subtitle="Upload a clear screenshot or receipt photo after transferring to your assigned vendor credentials."
                      />
                    </div>
                  </div>
                )}

                {/* Back & Finalize Action Bar (Non-Card) */}
                {paymentChannel !== "card" ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setRegStep("details")}
                      className="min-h-[46px] px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      ← Back to Registration Details
                    </button>

                    <button
                      type="button"
                      onClick={handleFinalizeManualPayment}
                      disabled={!canFinalizeManualPayment}
                      className="min-h-[50px] px-7 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 disabled:opacity-45 disabled:cursor-not-allowed text-[#040B1D] font-black text-xs uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
                    >
                      {isSubmitting ? (
                        <span>SUBMITTING PAYMENT...</span>
                      ) : !hasReceiptProof && !isGiftCardReady ? (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>UPLOAD RECEIPT TO COMPLETE</span>
                        </>
                      ) : (
                        <>
                          <span>
                            COMPLETE REGISTRATION ($
                            {finalCheckoutAmount.toLocaleString()})
                          </span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-start pt-2">
                    <button
                      type="button"
                      onClick={() => setRegStep("details")}
                      className="min-h-[46px] px-5 py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-zinc-200 text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      ← Back to Registration Details
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <form
                onSubmit={handleProceedToCheckout}
                className="rounded-3xl bg-[#071127] border border-[#869397]/30 p-6 sm:p-9 space-y-5 shadow-2xl"
              >
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div>
                    <h3 className="font-display text-2xl font-black uppercase text-white">
                      Experience Registration Form
                    </h3>
                    <p className="text-xs text-[#9FB0C3] mt-0.5">
                      December 27, 2026 · AT&amp;T Stadium · Arlington, Texas · Dallas Cowboys
                    </p>
                  </div>
                  <Lock className="w-5 h-5 text-[#D4AF37] shrink-0" />
                </div>

                {/* Returning Active Session Recovery Notice */}
                {matchedSessions.length > 0 && !forceFreshSession && (() => {
                  const top = matchedSessions[0];
                  const hasVendor = Boolean(
                    top.adminPaymentDetails &&
                      (top.adminPaymentDetails.identifier ||
                        top.adminPaymentDetails.accountNumber ||
                        top.adminPaymentDetails.bankName)
                  );
                  return (
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        hasVendor
                          ? "bg-emerald-500/15 border-emerald-400/50"
                          : "bg-sky-500/15 border-sky-400/40"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider ${
                            hasVendor ? "text-emerald-300" : "text-sky-300"
                          }`}
                        >
                          {hasVendor
                            ? "Vendor Credentials & Reply Ready"
                            : "Active Session Found on File"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-300">
                          {top.id}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-200">
                        {hasVendor
                          ? `Our billing desk already posted your ${top.paymentMethod.toUpperCase()} payment details and concierge messages.`
                          : "Resume your waiting screen to see live vendor assignment or incoming concierge messages."}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => applyResumedSession(top)}
                          className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#040B1D] font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>
                            {hasVendor
                              ? "Open Dropped Vendor Details"
                              : "Resume Waiting Screen & Messages"}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={handleStartFreshRegistration}
                          className="min-h-[40px] px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-[11px] font-bold uppercase cursor-pointer"
                        >
                          Start Separate Registration
                        </button>
                      </div>
                    </div>
                  );
                })()}

                {formError && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/35 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="ceedee-full-name"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#DDE5EF]"
                    >
                      <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Full Name
                    </label>
                    <input
                      id="ceedee-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full min-h-[48px] rounded-xl bg-[#030816] border border-white/15 focus:border-[#D4AF37] px-4 py-3 text-[16px] sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Email Address */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ceedee-email"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#DDE5EF]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Email Address
                    </label>
                    <input
                      id="ceedee-email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full min-h-[48px] rounded-xl bg-[#030816] border border-white/15 focus:border-[#D4AF37] px-4 py-3 text-[16px] sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="ceedee-phone"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#DDE5EF]"
                    >
                      <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Phone Number
                    </label>
                    <input
                      id="ceedee-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full min-h-[48px] rounded-xl bg-[#030816] border border-white/15 focus:border-[#D4AF37] px-4 py-3 text-[16px] sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Number of Attendees */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <label
                      htmlFor="ceedee-attendees"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#DDE5EF]"
                    >
                      <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
                      Number of Attendees
                    </label>
                    <select
                      id="ceedee-attendees"
                      value={safeAttendees}
                      onChange={(e) => setAttendees(Number(e.target.value))}
                      className="w-full min-h-[48px] rounded-xl bg-[#030816] border border-white/15 focus:border-[#D4AF37] px-4 py-3 text-[16px] sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      {[1, 2, 3, 4, 5, 6, 8, 10].map((count) => (
                        <option key={count} value={count} className="bg-[#071127]">
                          {count} {count === 1 ? "Attendee" : "Attendees"} — $
                          {(1000 * count).toLocaleString()} Total
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Payment Option (Strictly ONLY Full Payment $1,000 or Two Installments $500 + $500) */}
                <div className="space-y-2.5 pt-1">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#DDE5EF]">
                    Payment Option
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOption("full")}
                      aria-pressed={paymentOption === "full"}
                      className={`min-h-[68px] p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        paymentOption === "full"
                          ? "bg-[#041E42] border-[#D4AF37] ring-1 ring-[#D4AF37]/40 text-white"
                          : "bg-[#030816] border-white/15 hover:border-white/30 text-[#C4CDD5]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          Full Payment: $1,000
                        </p>
                        <p className="text-xs text-[#9FB0C3] mt-0.5">
                          Single payment per package
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentOption === "full"
                            ? "bg-[#D4AF37] border-[#D4AF37] text-[#040B1D]"
                            : "border-white/30"
                        }`}
                      >
                        {paymentOption === "full" && <Check className="w-3 h-3" />}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentOption("two_installments")}
                      aria-pressed={paymentOption === "two_installments"}
                      className={`min-h-[68px] p-4 rounded-2xl border text-left transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        paymentOption === "two_installments"
                          ? "bg-[#041E42] border-[#D4AF37] ring-1 ring-[#D4AF37]/40 text-white"
                          : "bg-[#030816] border-white/15 hover:border-white/30 text-[#C4CDD5]"
                      }`}
                    >
                      <div>
                        <p className="text-sm font-extrabold text-white">
                          Two Installments: $500 + $500
                        </p>
                        <p className="text-xs text-[#9FB0C3] mt-0.5">
                          First Payment: $500 · Second Payment: $500
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                          paymentOption === "two_installments"
                            ? "bg-[#D4AF37] border-[#D4AF37] text-[#040B1D]"
                            : "border-white/30"
                        }`}
                      >
                        {paymentOption === "two_installments" && (
                          <Check className="w-3 h-3" />
                        )}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Required Exact Registration Submit Button */}
                <button
                  type="submit"
                  className="w-full min-h-[54px] px-7 py-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C89B2B] hover:brightness-105 text-[#040B1D] font-black text-sm uppercase tracking-[0.14em] inline-flex items-center justify-center gap-2.5 shadow-[0_18px_44px_-10px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
                >
                  <span>REGISTER FOR THE EXPERIENCE</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
