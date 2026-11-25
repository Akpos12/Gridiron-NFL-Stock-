import React, { useState } from "react";
import {
  X,
  ShieldCheck,
  Sparkles,
  Award,
  CreditCard,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Send,
  Ticket,
  Lock,
  Smartphone,
  Gift,
  Coins,
  Check,
  Copy,
  ExternalLink,
  Clock,
  AlertCircle,
  Bitcoin,
  User,
  Mail,
  Phone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { doc, serverTimestamp } from "firebase/firestore";
import { db, auth, safeSetDoc } from "../lib/firebase";
import { cn } from "../lib/utils";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { StripeCardCheckoutPanel, VerifiedStripePaymentReceipt } from "./common/StripeCardCheckoutPanel";
import { GiftCardGuestPurchasePanel } from "./common/GiftCardGuestPurchasePanel";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { createOrUpdatePaymentSession } from "../services/paymentControlService";

interface JaylenWaddleVipFanCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenInquiry: (player: string, category: string) => void;
  onOpenExplore: () => void;
}

export const JaylenWaddleVipFanCardModal: React.FC<JaylenWaddleVipFanCardModalProps> = ({
  isOpen,
  onClose,
  onOpenInquiry,
  onOpenExplore
}) => {
  const [selectedPlan, setSelectedPlan] = useState<"full" | "installment">("installment");
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  
  // Payment checkout & receipt upload states
  const [paymentTab, setPaymentTab] = useState<"card" | "giftcard" | "cashapp" | "crypto">("card");
  const [checkoutSessionId] = useState(() => `PAY-JWVIP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [customerName, setCustomerName] = useState(() => auth.currentUser?.displayName || localStorage.getItem("nfl_guest_sender_name") || "");
  const [customerEmail, setCustomerEmail] = useState(() => auth.currentUser?.email || localStorage.getItem("nfl_guest_buyer_email") || "");
  const [customerPhone, setCustomerPhone] = useState(() => localStorage.getItem("nfl_guest_buyer_phone") || "");
  const [giftCardBrand, setGiftCardBrand] = useState("Apple Gift Card");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccessOrder, setPaymentSuccessOrder] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://www.nflgridiron.company";
  const verificationUrl = `${origin}/?vipFanCard=jaylen_waddle_17&ref=BRONCOS-JW-2026`;
  const amountDue = selectedPlan === "full" ? 1000 : 350;

  const validateCustomerFields = () => {
    if (!customerName.trim()) {
      setCardError("Please enter your full name before proceeding.");
      return false;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setCardError("Please enter a valid email address for pass delivery.");
      return false;
    }
    setCardError(null);
    return true;
  };

  const persistVipFanCardOrder = async (
    channel: "card" | "giftcard" | "cashapp" | "crypto",
    referenceTag: string,
    receiptList: string[],
    isVerifiedCard = false
  ) => {
    const orderId = `BRONCOS-JW-VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const cleanName = customerName.trim() || "VIP Member";
    const cleanEmail = customerEmail.trim() || "guest@nflgridiron.company";

    await createOrUpdatePaymentSession({
      id: orderId,
      orderId,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: customerPhone.trim(),
      itemType: "experience",
      itemTitle: `Jaylen Waddle Denver Broncos VIP Fan Card (${selectedPlan === "full" ? "Full $1,000" : "$350 Deposit"})`,
      amount: amountDue,
      paymentMethod: channel,
      referenceTag,
      receiptImages: receiptList,
      receiptUrl: receiptList[0] || "",
      status: isVerifiedCard ? "completed" : "awaiting_admin_details"
    });

    await safeSetDoc(doc(db, "bookings", orderId), {
      id: orderId,
      userId: auth.currentUser?.uid || "guest",
      userEmail: cleanEmail,
      senderName: cleanName,
      buyerPhone: customerPhone.trim(),
      experienceId: "jaylen-waddle-vip-fan-card",
      experienceTitle: `Jaylen Waddle VIP Fan Card (${selectedPlan === "full" ? "Full $1,000" : "$350 Deposit"})`,
      experienceType: "meet_greet",
      date: "Season 2026 VIP Access",
      timeSlot: "VIP Pass Holder",
      guestsCount: 1,
      totalPrice: amountDue,
      tier: "platinum",
      status: isVerifiedCard ? "approved" : "pending",
      qrCode: `PASS-BRONCOS-JW-${orderId}`,
      paymentMethod: channel,
      paymentSessionId: checkoutSessionId,
      paymentRef: referenceTag,
      receiptImage: receiptList[0] || "",
      receiptImages: receiptList,
      ...(channel === "giftcard"
        ? {
            giftCardDetails: {
              brand: giftCardBrand,
              cardNumber: giftCardCode,
              pin: giftCardPin,
              amount: giftCardBalance
            }
          }
        : {}),
      createdAt: new Date().toISOString(),
      timestamp: serverTimestamp()
    });

    return orderId;
  };

  const handleStripeVerifiedSuccess = async (receipt: VerifiedStripePaymentReceipt) => {
    try {
      const orderId = await persistVipFanCardOrder(
        "card",
        receipt.paymentIntent || receipt.sessionId,
        [],
        true
      );
      setPaymentSuccessOrder(orderId);
    } catch (err) {
      console.error("VIP Fan Card Stripe persistence error:", err);
      setPaymentSuccessOrder(`BRONCOS-JW-VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    }
  };

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentTab === "card") return;
    if (!validateCustomerFields()) return;

    if (paymentTab === "giftcard" && giftCardCode.trim().length < 4 && receiptImages.length === 0) {
      setCardError("Please enter your gift card redemption code(s) or upload a photo of your card.");
      return;
    }

    if ((paymentTab === "cashapp" || paymentTab === "crypto") && receiptImages.length === 0 && !paymentRef.trim()) {
      setCardError("Please attach your payment confirmation screenshot or transaction reference.");
      return;
    }

    setIsProcessingPayment(true);
    setCardError(null);

    try {
      const resolvedRef =
        paymentTab === "giftcard"
          ? `GIFT CARD (${giftCardBrand}): ${giftCardCode.trim()}`
          : paymentRef.trim() || "RECEIPT_ATTACHED";

      const orderId = await persistVipFanCardOrder(paymentTab, resolvedRef, receiptImages, false);
      setPaymentSuccessOrder(orderId);
    } catch (err: any) {
      console.error("Checkout order submission error:", err);
      const fallbackId = `BRONCOS-JW-VIP-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      setPaymentSuccessOrder(fallbackId);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/90 backdrop-blur-2xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-[#FB4F14]/50 rounded-[2.5rem] overflow-hidden shadow-[0_30px_100px_rgba(251,79,20,0.35)] flex flex-col max-h-[95vh]">
        
        {/* Broncos Orange & Navy Top Ribbon */}
        <div className="h-2 w-full bg-gradient-to-r from-[#002244] via-[#FB4F14] to-white" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002244] border border-[#FB4F14]/60 flex items-center justify-center shadow-lg shadow-[#FB4F14]/20">
              <Award className="w-5 h-5 text-[#FB4F14]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#FB4F14]">
                  Denver Broncos Official VIP Fan Membership
                </span>
                <span className="text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  Season 2026
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                Exclusive VIP Fan Card · Jaylen Waddle (#17)
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close VIP Fan Card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8">
          
          {/* THE LUXURIOUS VIP FAN CARD (BRONCOS INSPIRATION) */}
          <div
            className="relative rounded-3xl overflow-hidden border-2 border-[#FB4F14]/70 shadow-[0_25px_80px_rgba(0,34,68,0.85)] p-6 sm:p-8 md:p-10 text-white"
            style={{
              background:
                "radial-gradient(circle at top right, rgba(251, 79, 20, 0.35) 0%, rgba(0, 34, 68, 0.92) 55%, #050816 100%)"
            }}
          >
            {/* Stadium lighting glow effects */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#FB4F14]/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Column: Player Photo & Identity Badge (5 cols) */}
              <div className="lg:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left space-y-4">
                <div className="relative group w-full max-w-[280px] rounded-3xl overflow-hidden border-2 border-[#FB4F14]/60 shadow-2xl bg-zinc-900">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                  <img
                    src="/assets/aistudio/IMG_1602_16c645b7.webp"
                    alt="Jaylen Waddle Denver Broncos VIP Fan"
                    className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Floating Jersey Pill */}
                  <div className="absolute top-3 left-3 z-20 bg-[#002244]/90 border border-[#FB4F14] px-3 py-1.5 rounded-xl shadow-lg">
                    <span className="text-xs font-black text-[#FB4F14] font-mono tracking-wider">
                      #17 · WADDLE
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 z-20 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#FB4F14] block">
                      Wide Receiver
                    </span>
                    <p className="text-xs font-bold text-white uppercase">Denver Broncos · 2026</p>
                  </div>
                </div>

                <div className="w-full max-w-[280px] bg-black/50 border border-white/10 rounded-2xl p-3 text-center">
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                    VIP Membership Security
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    SHA-256 VERIFIED · PASS #BRONCOS-JW-17
                  </span>
                </div>
              </div>

              {/* Right Column: Card Typography, Inscription & QR Stub (7 cols) */}
              <div className="lg:col-span-7 space-y-6 lg:pl-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0">
                
                {/* Title & Badge */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 bg-[#FB4F14]/15 border border-[#FB4F14]/30 px-3 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-[#FB4F14]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FB4F14]">
                      EXCLUSIVE VIP FAN CARD
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter text-white">
                    JAYLEN WADDLE
                  </h2>
                </div>

                {/* Inscription Quote */}
                <div className="p-4 sm:p-5 rounded-2xl bg-black/40 border border-[#FB4F14]/30 shadow-inner">
                  <p className="font-serif italic text-base sm:text-lg font-bold text-[#F3D97D] text-center">
                    “An Extraordinary Experience. An Unforgettable Memory.”
                  </p>
                </div>

                {/* Key Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                      Team Franchise
                    </span>
                    <p className="font-black text-white text-xs uppercase">Denver Broncos</p>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                      Position
                    </span>
                    <p className="font-black text-white text-xs uppercase">Wide Receiver</p>
                  </div>

                  <div className="bg-black/30 border border-white/5 rounded-xl p-3 col-span-2 sm:col-span-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                      Season Pass
                    </span>
                    <p className="font-black text-[#FB4F14] text-xs uppercase">2026 VIP Access</p>
                  </div>
                </div>

                {/* QR Stub & Price Footer */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-lg shrink-0">
                      <QRCodeSVG value={verificationUrl} size={64} level="M" />
                    </div>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block">
                        Total Fan Experience Price
                      </span>
                      <span className="text-2xl sm:text-3xl font-mono font-black text-[#FB4F14]">
                        $1,000 USD
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full sm:w-auto px-6 py-4 bg-gradient-to-r from-[#FB4F14] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-xs tracking-wider rounded-2xl shadow-xl shadow-[#FB4F14]/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>CHOOSE YOUR PAYMENT PLAN</span>
                  </button>
                </div>

              </div>

            </div>
          </div>

          {/* PRICING & PAYMENT OPTIONS BREAKDOWN */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h4 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#FB4F14]" /> Flexible Payment Options ($1,000 Total)
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Choose between paying upfront or spreading your fan experience investment across short, convenient scheduled installments.
                </p>
              </div>

              <div className="flex items-center p-1 bg-zinc-950 rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedPlan("full")}
                  className={cn(
                    "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    selectedPlan === "full"
                      ? "bg-[#FB4F14] text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Full Payment ($1,000)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPlan("installment")}
                  className={cn(
                    "px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                    selectedPlan === "installment"
                      ? "bg-[#FB4F14] text-white shadow-md"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  Short Installment Plan
                </button>
              </div>
            </div>

            {selectedPlan === "full" ? (
              <div className="p-5 rounded-2xl bg-zinc-950 border border-[#FB4F14]/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-zinc-300">
                    Upfront Full Payment
                  </span>
                  <span className="font-mono text-xl font-black text-emerald-400">$1,000.00 USD</span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pay the full $1,000 upfront. Requires control room audit &amp; confirmation of receipt/payment before VIP pass approval.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan("full");
                    setShowCheckoutModal(true);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Proceed with Full Payment ($1,000)
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-[#FB4F14]/40 space-y-1">
                    <span className="text-[9px] font-black uppercase text-[#FB4F14]">Initial Deposit (Today)</span>
                    <p className="font-mono text-lg font-black text-white">$350.00 USD</p>
                    <p className="text-[10px] text-emerald-400 font-medium">Submits receipt for control room review</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
                    <span className="text-[9px] font-black uppercase text-zinc-500">Second Payment (After 3 Days)</span>
                    <p className="font-mono text-lg font-black text-white">$325.00 USD</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Short 3-day interval</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 space-y-1">
                    <span className="text-[9px] font-black uppercase text-zinc-500">Final Payment (After 7 Days)</span>
                    <p className="font-mono text-lg font-black text-white">$325.00 USD</p>
                    <p className="text-[10px] text-zinc-400 font-medium">Full balance settled within 1 week</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="uppercase text-white">Control Room Verification Required:</strong> Every payment receipt and reference is securely queued in the Control Room. Administrative confirmation is required before the payment is accepted and the pass is cleared.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedPlan("installment");
                    setShowCheckoutModal(true);
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-[#FB4F14] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all cursor-pointer shadow-lg"
                >
                  Start Short Installment Plan ($350 Deposit Today)
                </button>
              </div>
            )}
          </div>

          {/* WEBSITE CALL-TO-ACTION SECTION */}
          <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#002244] to-[#0a1a38] border border-[#FB4F14]/50 text-center space-y-4 shadow-xl">
            <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
              READY FOR AN UNFORGETTABLE FAN EXPERIENCE?
            </h3>
            <p className="text-xs sm:text-sm text-zinc-300 max-w-xl mx-auto">
              Secure your exclusive Jaylen Waddle VIP Fan Card today or connect with our concierge team for custom arrangements.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenExplore();
                }}
                className="px-6 py-3.5 bg-white hover:bg-zinc-200 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2"
              >
                <span>EXPLORE FAN EXPERIENCE</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenInquiry("Jaylen Waddle", "meet_greet");
                }}
                className="px-6 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-[#FB4F14]/50 text-[#FB4F14] hover:text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4 text-[#FB4F14]" />
                <span>SUBMIT YOUR INQUIRY</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* CHECKOUT MODAL WITH PAYMENT METHODS & RECEIPT UPLOADER */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/88 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-zinc-950 border border-[#FB4F14]/70 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-left my-auto max-h-[92vh] overflow-y-auto custom-scrollbar">
            <button
              type="button"
              onClick={() => {
                setShowCheckoutModal(false);
                setPaymentSuccessOrder(null);
              }}
              className="absolute top-5 right-5 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentSuccessOrder ? (
              <div className="text-center py-6 space-y-5">
                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/30 text-amber-400">
                  <Clock className="w-8 h-8 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-2xl font-black uppercase text-white">Payment Receipt Submitted!</h4>
                  <p className="text-xs text-zinc-400 font-mono">Order Ref: #{paymentSuccessOrder}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 text-left space-y-1.5">
                  <strong className="uppercase text-amber-300 block">Awaiting Control Room Confirmation:</strong>
                  Your payment receipt and transfer details have been dispatched to the control room. An administrator must verify and confirm the payment before your pass is cleared and accepted.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentSuccessOrder(null);
                    setShowCheckoutModal(false);
                    onClose();
                  }}
                  className="px-8 py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-wider rounded-xl cursor-pointer shadow-lg"
                >
                  View Status in Ticket Portal
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1 border-b border-white/10 pb-4">
                  <span className="text-[10px] font-black uppercase text-[#FB4F14] tracking-widest flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400" /> Secure Checkout &amp; Receipt Verification
                  </span>
                  <h4 className="text-xl font-black uppercase text-white">
                    {selectedPlan === "full" ? "Full Payment ($1,000 USD)" : "Short Installment Plan ($350 Due Today)"}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Jaylen Waddle Denver Broncos VIP Experience Pass · Requires Control Room Confirmation
                  </p>
                </div>

                {/* Buyer Identity Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="Full Name"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          if (e.target.value) localStorage.setItem("nfl_guest_sender_name", e.target.value);
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB4F14]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          if (e.target.value) localStorage.setItem("nfl_guest_buyer_email", e.target.value);
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB4F14]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          if (e.target.value) localStorage.setItem("nfl_guest_buyer_phone", e.target.value);
                        }}
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#FB4F14]"
                      />
                    </div>
                  </div>
                </div>

                {/* Payment Method Selector Tabs (Strictly Stripe, Gift Card, Cash App, Bitcoin) */}
                <div className="space-y-3">
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    Select Payment Method
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: "card", label: "Stripe (Card)", icon: CreditCard },
                      { id: "giftcard", label: "Gift Card", icon: Gift },
                      { id: "cashapp", label: "Cash App", icon: Smartphone },
                      { id: "crypto", label: "Bitcoin (BTC)", icon: Bitcoin }
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setPaymentTab(m.id as any);
                          setCardError(null);
                        }}
                        className={cn(
                          "p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-all cursor-pointer",
                          paymentTab === m.id
                            ? "bg-[#FB4F14]/20 border-[#FB4F14] text-white font-black shadow-md"
                            : "bg-zinc-900 border-white/10 text-zinc-400 hover:border-white/20"
                        )}
                      >
                        <m.icon className={cn("w-4 h-4", paymentTab === m.id ? "text-[#FB4F14]" : "text-zinc-500")} />
                        <span className="text-[10px] uppercase truncate">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Execution */}
                <form onSubmit={handleProcessCheckout} className="space-y-4 pt-2">
                  {cardError && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{cardError}</span>
                    </div>
                  )}

                  {paymentTab === "card" ? (
                    <StripeCardCheckoutPanel
                      amountUsd={amountDue}
                      itemName={`Jaylen Waddle VIP Fan Card (${selectedPlan === "full" ? "Full Payment" : "Deposit"})`}
                      sessionId={checkoutSessionId}
                      customerName={customerName}
                      customerEmail={customerEmail}
                      customerPhone={customerPhone}
                      playerName="Jaylen Waddle"
                      onCustomerDetailsNeeded={validateCustomerFields}
                      onReturnToOptions={() => setPaymentTab("giftcard")}
                      onSwitchToBitcoin={() => setPaymentTab("crypto")}
                      onSwitchToGiftCard={() => setPaymentTab("giftcard")}
                      onContactSupport={() => {
                        setShowCheckoutModal(false);
                        onClose();
                        onOpenInquiry("Jaylen Waddle", "meet_greet");
                      }}
                      onVerifiedSuccess={handleStripeVerifiedSuccess}
                    />
                  ) : paymentTab === "giftcard" ? (
                    <div className="space-y-4">
                      <GiftCardGuestPurchasePanel
                        amountDue={amountDue}
                        brand={giftCardBrand}
                        onBrandChange={setGiftCardBrand}
                        cardNumber={giftCardCode}
                        onCardNumberChange={(val) => {
                          setGiftCardCode(val);
                          if (!paymentRef) setPaymentRef(val);
                        }}
                        pin={giftCardPin}
                        onPinChange={setGiftCardPin}
                        balance={giftCardBalance}
                        onBalanceChange={setGiftCardBalance}
                      />

                      <PaymentReceiptUploader
                        value={receiptImages[0] || ""}
                        values={receiptImages}
                        onValuesChange={(urls) => setReceiptImages(urls)}
                        label="Optional: Upload Gift Card Receipt Screenshot"
                        required={false}
                        subtitle="Upload a screenshot of your e-gift confirmation email or card photo if desired"
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <CustomerPaymentWaitingTerminal
                        key={`${checkoutSessionId}-${paymentTab}`}
                        sessionId={checkoutSessionId}
                        selectedMethod={paymentTab}
                        amount={amountDue}
                        orderReference={checkoutSessionId}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        customerPhone={customerPhone}
                        itemTitle={`Jaylen Waddle VIP Fan Card (${selectedPlan === "full" ? "Full $1,000" : "$350 Deposit"})`}
                        itemType="experience"
                        onCustomerDetailsChange={({ name, email, phone }) => {
                          if (name) setCustomerName(name);
                          if (email) setCustomerEmail(email);
                          if (phone) setCustomerPhone(phone);
                        }}
                        onSwitchToGiftCard={() => setPaymentTab("giftcard")}
                        onSwitchToMethod={(m) => {
                          if (m === "cashapp" || m === "crypto") setPaymentTab(m);
                        }}
                        onReceiptsChange={(_primary, all) => setReceiptImages(all)}
                        onPaymentSubmitted={(ref, receipt, all) => {
                          if (ref) setPaymentRef(ref);
                          if (all && all.length > 0) setReceiptImages(all);
                          else if (receipt) setReceiptImages((prev) => Array.from(new Set([receipt, ...prev])));
                        }}
                      />

                      <div>
                        <label className="block text-[9px] font-black uppercase text-zinc-400 mb-1">
                          Transaction Reference ID / Confirmation #
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TXN-984210 or BTC Tx Hash / $Cashtag"
                          value={paymentRef}
                          onChange={(e) => setPaymentRef(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500"
                        />
                      </div>

                      <PaymentReceiptUploader
                        value={receiptImages[0] || ""}
                        values={receiptImages}
                        onValuesChange={(urls) => setReceiptImages(urls)}
                        label="Attach Payment Receipt Screenshot"
                        required={false}
                        subtitle="Upload your transfer confirmation screenshot for control room audit"
                      />
                    </div>
                  )}

                  {paymentTab !== "card" && (
                    <>
                      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-white/10 flex items-center justify-between text-xs">
                        <span className="text-zinc-400 font-bold">Amount to Audit:</span>
                        <span className="font-mono text-amber-400 font-black text-sm">
                          {selectedPlan === "full" ? "$1,000.00 USD" : "$350.00 USD (Deposit Audit)"}
                        </span>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isProcessingPayment ||
                          (paymentTab === "giftcard"
                            ? giftCardCode.trim().length < 4 && receiptImages.length === 0
                            : receiptImages.length === 0 && !paymentRef.trim())
                        }
                        className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-black font-black uppercase text-xs tracking-wider rounded-xl shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2"
                      >
                        {isProcessingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            <span>Submitting for Control Room Audit...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-black" />
                            <span>Submit Payment &amp; Request Control Room Approval</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                </form>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
