import React, { useState, useEffect } from "react";
import { 
  X, 
  Check, 
  Copy, 
  Sparkles, 
  Tag, 
  ShieldCheck, 
  Truck, 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  Gift, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  ExternalLink,
  QrCode,
  FileText,
  Lock,
  ArrowRight,
  Smartphone,
  Building2
} from "lucide-react";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { CustomerPaymentWaitingTerminal } from "./common/CustomerPaymentWaitingTerminal";
import { safeSetDoc, db, auth } from "../lib/firebase";
import { doc, serverTimestamp } from "firebase/firestore";
import { PaymentMethodType } from "../services/paymentControlService";

export const PATRIOTS_SIGNED_MERCH_IMAGES = [
  "/postimages/460844974351086634.jpg",
  "/postimages/New-England-Patriots.jpg",
  "/postimages/H8897-L411218893-original.jpg",
  "/postimages/59049311-1.jpg",
  "/postimages/s-l1600.jpg",
  "/postimages/original.jpg",
  "/postimages/2545198.jpg"
];

export const PATRIOTS_VENDOR_PAYPAL = {
  name: "Official Vendor Dispatch",
  email: "",
  type: "FAMILY AND FRIENDS",
  instructions: "Official Team Vendor PayPal Account. Instructions and verified recipient details are dispatched dynamically from the Control Room upon checkout initiation."
};

interface MerchandiseCheckoutModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess?: (order: any) => void;
  initialPromoCode?: string;
}

export const MerchandiseCheckoutModal: React.FC<MerchandiseCheckoutModalProps> = ({
  product,
  isOpen,
  onClose,
  onOrderSuccess,
  initialPromoCode = ""
}) => {
  if (!isOpen || !product) return null;

  // Detect if this is the New England Patriots signed merchandise
  const isPatriotsSigned = 
    product.isPatriotsSignedMerch || 
    product.id === "m-NE-signed-merchandise" ||
    product.id === "m-NE-memorabilia" ||
    (product.name && product.name.toLowerCase().includes("patriots") && product.name.toLowerCase().includes("signed")) ||
    (product.teamId === "NE" && (product.category === "memorabilia" || product.name?.toLowerCase().includes("signed")));

  // Image gallery
  const productImages = isPatriotsSigned 
    ? PATRIOTS_SIGNED_MERCH_IMAGES 
    : (Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || product.imageUrl]);

  const [activeImgIdx, setActiveImgIdx] = useState(0);

  // Pricing & Promo Code
  const baseOriginalPrice = isPatriotsSigned ? 3500 : (product.price || product.basePrice || 100);
  const [promoCodeInput, setPromoCodeInput] = useState(initialPromoCode);
  const [appliedPromo, setAppliedPromo] = useState<string | null>(
    initialPromoCode.trim() === "258025" ? "258025" : null
  );
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccessMsg, setPromoSuccessMsg] = useState<string | null>(
    initialPromoCode.trim() === "258025" ? "VIP Promo Applied: Slashed to $1,000.00!" : null
  );

  // Active payment method: supports all operator-dispatched methods & gift card
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("paypal");
  const [checkoutSessionId] = useState(() => `PAY-MERCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [paymentRef, setPaymentRef] = useState("");

  // Gift card state
  const [giftCardBrand, setGiftCardBrand] = useState("Apple Gift Card");
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardPin, setGiftCardPin] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState("");

  // Customer & Shipping Address State
  const currentUser = auth.currentUser;
  const [customerName, setCustomerName] = useState(currentUser?.displayName || "");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "");
  const [customerPhone, setCustomerPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [aptSuite, setAptSuite] = useState("");
  const [city, setCity] = useState("");
  const [stateProv, setStateProv] = useState("MA");
  const [postalCode, setPostalCode] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  // Receipt upload state
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [receiptImages, setReceiptImages] = useState<string[]>([]);

  // UI status
  const [copiedPaypal, setCopiedPaypal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Price calculations
  // If promo code 258025 is applied, price drops to 1000
  const is258025Active = appliedPromo === "258025";
  const subtotalBeforeDiscount = isPatriotsSigned
    ? (is258025Active ? 1000 : 3500)
    : (is258025Active ? Math.min(product.price, 1000) : product.price);

  // Both PayPal and Gift Card get a 5% discount ("each should have %5 discount")
  const directDiscountPercent = 5;
  const discountAmount = Number(((subtotalBeforeDiscount * directDiscountPercent) / 100).toFixed(2));
  const finalTotal = Number((subtotalBeforeDiscount - discountAmount).toFixed(2));

  const handleApplyPromo = () => {
    const code = promoCodeInput.trim();
    if (!code) {
      setPromoError("Please enter a valid promotional code.");
      return;
    }

    if (code === "258025") {
      setAppliedPromo("258025");
      setPromoError(null);
      setPromoSuccessMsg("VIP Promo Applied: Slashed to $1,000.00!");
    } else {
      setPromoError("Invalid promo code. Please check and try again.");
      setAppliedPromo(null);
      setPromoSuccessMsg(null);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput("");
    setPromoSuccessMsg(null);
    setPromoError(null);
  };

  const handleCopyPaypal = () => {
    navigator.clipboard.writeText(PATRIOTS_VENDOR_PAYPAL.email);
    setCopiedPaypal(true);
    setTimeout(() => setCopiedPaypal(false), 2500);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!customerName.trim()) {
      setFormError("Please provide the recipient's full name for shipping.");
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes("@")) {
      setFormError("Please provide a valid contact email address.");
      return;
    }
    if (!streetAddress.trim()) {
      setFormError("Please provide the destination street address.");
      return;
    }
    if (!city.trim() || !postalCode.trim()) {
      setFormError("Please enter city and ZIP/postal code.");
      return;
    }

    // Payment validation
    if (paymentMethod === "giftcard") {
      if (!giftCardCode.trim() && (!receiptImages || receiptImages.length === 0) && !receiptImage) {
        setFormError("Please enter the Gift Card claim code or upload clear photos of the card.");
        return;
      }
    } else if (paymentMethod === "paypal") {
      if (!receiptImage && (!receiptImages || receiptImages.length === 0)) {
        setFormError("Please attach a screenshot or confirmation receipt of your PayPal payment to authorize dispatch.");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderId = `ORD-PATRIOTS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeReceipts = receiptImages.length > 0 ? receiptImages : (receiptImage ? [receiptImage] : []);

      const payload = {
        id: orderId,
        orderId,
        userId: currentUser?.uid || "guest",
        userEmail: customerEmail.trim().toLowerCase(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: {
          recipientName: customerName.trim(),
          street: streetAddress.trim(),
          aptSuite: aptSuite.trim(),
          city: city.trim(),
          state: stateProv.trim(),
          zip: postalCode.trim(),
          country: "United States",
          deliveryNotes: deliveryNotes.trim()
        },
        product: {
          id: product.id || "m-NE-signed-merchandise",
          name: isPatriotsSigned 
            ? "New England Patriots Official Signed Memorabilia Collection" 
            : product.name,
          category: "memorabilia",
          teamId: "NE",
          originalPrice: baseOriginalPrice,
          image: productImages[0]
        },
        pricing: {
          originalPrice: baseOriginalPrice,
          subtotalBeforeDiscount,
          promoCode: appliedPromo || null,
          is258025Applied: is258025Active,
          discountPercent: directDiscountPercent,
          discountAmount,
          finalTotal
        },
        paymentMethod,
        paymentDetails: paymentMethod === "giftcard" ? {
          brand: giftCardBrand,
          code: giftCardCode ? giftCardCode.slice(0, 4) + "****" : "Photo Attached",
          pin: giftCardPin ? "***" : "N/A",
          declaredBalance: giftCardBalance
        } : {
          method: paymentMethod,
          reference: paymentRef,
          sessionId: checkoutSessionId
        },
        receiptImage: activeReceipts[0] || "",
        receiptImages: activeReceipts.slice(0, 2),
        status: "pending_approval",
        deliveryType: "FedEx Insured Express (Tracked)",
        createdAt: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      // Safely persist to both store_orders and bookings
      await safeSetDoc(doc(db, "store_orders", orderId), payload);
      await safeSetDoc(doc(db, "bookings", orderId), {
        ...payload,
        type: "memorabilia_order",
        ticketCode: orderId,
        qrCode: orderId
      });

      setCompletedOrder(payload);
      if (onOrderSuccess) onOrderSuccess(payload);
    } catch (err: any) {
      console.error("Order submission error:", err);
      setFormError(`Unable to save your order: ${err.message || String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity" onClick={onClose} />

      <div className="relative bg-zinc-950 border border-white/10 rounded-[2rem] max-w-4xl w-full overflow-hidden shadow-2xl z-10 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/50 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-md">
              OFFICIAL LICENSED MEMORABILIA
            </span>
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
              AUTHENTICATED VAULT
            </span>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-8">
          
          {completedOrder ? (
            /* Order Success State */
            <div className="text-center py-8 space-y-6 max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tight">Order Confirmed & Logged</h3>
                <p className="text-zinc-400 text-xs mt-1">
                  Your New England Patriots signed merchandise order has been transmitted to our control dispatch desk.
                </p>
              </div>

              <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 text-left space-y-3 font-mono text-xs">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase">Order Reference:</span>
                  <span className="text-white font-black">{completedOrder.id}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase">Item:</span>
                  <span className="text-white font-bold">{completedOrder.product.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase">Settlement:</span>
                  <span className="text-emerald-400 font-black">${completedOrder.pricing.finalTotal.toFixed(2)} ({completedOrder.paymentMethod.toUpperCase()})</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-zinc-500 font-bold uppercase">Shipping To:</span>
                  <span className="text-white text-right font-bold">
                    {completedOrder.shippingAddress.recipientName}<br />
                    {completedOrder.shippingAddress.street}, {completedOrder.shippingAddress.city}, {completedOrder.shippingAddress.state} {completedOrder.shippingAddress.zip}
                  </span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-500 font-bold uppercase">Tracking Status:</span>
                  <span className="text-amber-400 font-black uppercase">Pending Courier Verification</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-blue-600/20"
                >
                  Return to NFL Exchange
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Left Column: Multi-Image Showcase & Pricing */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Main Image Display */}
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 relative shadow-xl">
                  <img 
                    src={productImages[activeImgIdx] || productImages[0]} 
                    alt={product.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider text-white border border-white/10">
                    Photo {activeImgIdx + 1} of {productImages.length}
                  </div>
                  {isPatriotsSigned && (
                    <div className="absolute bottom-3 right-3 bg-blue-600/90 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded shadow">
                      PATRIOTS SIGNED
                    </div>
                  )}
                </div>

                {/* Thumbnails Strip */}
                {productImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    {productImages.map((img: string, idx: number) => (
                      <button
                        key={`thumb-${idx}`}
                        type="button"
                        onClick={() => setActiveImgIdx(idx)}
                        className={`w-16 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                          activeImgIdx === idx 
                            ? "border-blue-500 scale-105 shadow-md shadow-blue-500/20" 
                            : "border-white/10 opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img 
                          src={img} 
                          alt={`Thumbnail ${idx + 1}`} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover" 
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* Product Title & Info */}
                <div className="space-y-2">
                  <h3 className="text-xl font-black uppercase italic text-white leading-tight">
                    {isPatriotsSigned ? "New England Patriots Official Signed Merchandise" : product.name}
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                    {isPatriotsSigned 
                      ? "Exclusive certified authentic New England Patriots official autographed collector's vault piece with tamper-evident hologram and Fanatics/NFL certificate of authenticity."
                      : product.description}
                  </p>
                </div>

                {/* Authenticity Credentials */}
                <div className="bg-zinc-900/60 border border-white/5 rounded-xl p-3.5 space-y-2 text-[10px] font-semibold text-zinc-400">
                  <div className="flex items-center gap-2 text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span>Includes Tamper-Evident Hologram & Registered COA</span>
                  </div>
                  <div className="flex items-center gap-2 text-white">
                    <Truck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <span>Insured FedEx 2-Day Priority Delivery with Signature</span>
                  </div>
                </div>

                {/* Promo Code Input Box */}
                <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-blue-400" /> Apply Promo Code
                    </span>
                    {appliedPromo && (
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-[9px] text-rose-400 hover:text-rose-300 font-black uppercase underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Enter VIP promo code"
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value)}
                      disabled={!!appliedPromo}
                      className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500 uppercase"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={!!appliedPromo || !promoCodeInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>

                  {promoSuccessMsg && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{promoSuccessMsg}</span>
                    </div>
                  )}

                  {promoError && (
                    <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-[10px] font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{promoError}</span>
                    </div>
                  )}
                </div>

                {/* Price Summary Card */}
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 space-y-2.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">Retail Listed Price:</span>
                    <span className={`font-mono ${is258025Active ? "line-through text-zinc-500" : "font-bold text-white"}`}>
                      ${baseOriginalPrice.toLocaleString()}
                    </span>
                  </div>

                  {is258025Active && (
                    <div className="flex justify-between items-center text-xs text-emerald-400">
                      <span className="font-bold flex items-center gap-1">
                        <Tag className="w-3 h-3" /> VIP Promo Discount:
                      </span>
                      <span className="font-mono font-black">-$2,500.00 (Slashed to $1,000.00)</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-blue-400">
                    <span className="font-bold">Payment Method Discount (5%):</span>
                    <span className="font-mono font-black">-${discountAmount.toFixed(2)}</span>
                  </div>

                  <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                    <div>
                      <span className="text-xs font-black uppercase text-white">Total Amount Due:</span>
                      <p className="text-[9px] text-zinc-500 font-semibold">Includes certified packaging & delivery</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black font-mono text-emerald-400">${finalTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Address Details & Payment Form */}
              <div className="lg:col-span-7 space-y-6">
                
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  
                  {/* SECTION 1: SHIPPING ADDRESS */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Customer & Shipping Address Details
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Recipient Full Name *</label>
                        <div className="relative">
                          <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                          <input 
                            type="text" 
                            required
                            placeholder="John Doe"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Contact Email *</label>
                        <div className="relative">
                          <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                          <input 
                            type="email" 
                            required
                            placeholder="john@example.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Street Address *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="1 Patriot Place"
                          value={streetAddress}
                          onChange={(e) => setStreetAddress(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Apt / Suite</label>
                        <input 
                          type="text" 
                          placeholder="Suite 200"
                          value={aptSuite}
                          onChange={(e) => setAptSuite(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">City *</label>
                        <input 
                          type="text" 
                          required
                          placeholder="Foxborough"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">State / ZIP *</label>
                        <div className="flex gap-1.5">
                          <input 
                            type="text" 
                            required
                            placeholder="MA"
                            value={stateProv}
                            onChange={(e) => setStateProv(e.target.value)}
                            className="w-14 bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs font-semibold text-white uppercase text-center focus:outline-none focus:border-blue-500"
                          />
                          <input 
                            type="text" 
                            required
                            placeholder="02035"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value)}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-2 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Contact Phone Number</label>
                        <div className="relative">
                          <Phone className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" />
                          <input 
                            type="tel" 
                            placeholder="(555) 000-0000"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-zinc-400 block">Special Delivery Notes</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Leave with building concierge"
                          value={deliveryNotes}
                          onChange={(e) => setDeliveryNotes(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: PAYMENT METHOD (PAYPAL & GIFTCARD ONLY) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-black uppercase tracking-wider text-white">
                          Payment Method (5% Discount Included)
                        </h4>
                      </div>
                      <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        5% DIRECT-PAY DISCOUNT
                      </span>
                    </div>

                    {/* Method Selector Tabs */}
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "cashapp", label: "CASH APP", discount: "SAVE 5%", icon: Smartphone, color: "text-emerald-400" },
                        { id: "paypal", label: "PAYPAL", discount: "SAVE 5%", icon: CreditCard, color: "text-blue-400" },
                        { id: "venmo", label: "VENMO", discount: "SAVE 5%", icon: Smartphone, color: "text-sky-400" },
                        { id: "zelle", label: "ZELLE", discount: "SAVE 5%", icon: Smartphone, color: "text-purple-400" },
                        { id: "bank", label: "BMO BANK (WIRE/ACH)", icon: Building2, color: "text-zinc-400" },
                        { id: "crypto", label: "CRYPTO (BTC/ETH/USDT)", discount: "SAVE 5%", icon: QrCode, color: "text-amber-400" },
                        { id: "giftcard", label: "GIFT CARD", discount: "SAVE 5%", icon: Gift, color: "text-amber-400" }
                      ].map(method => {
                        const isSelected = paymentMethod === method.id;
                        return (
                          <button
                            key={method.id}
                            type="button"
                            onClick={() => setPaymentMethod(method.id as any)}
                            className={`px-3.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all border relative ${
                              isSelected
                                ? "bg-white text-black border-white shadow-md"
                                : "bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/20"
                            }`}
                          >
                            <method.icon className={`w-3.5 h-3.5 ${isSelected ? "text-black" : method.color}`} />
                            <span>{method.label}</span>
                            {method.discount && (
                              <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full uppercase tracking-tighter ${
                                isSelected ? "bg-emerald-600 text-white" : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              }`}>
                                {method.discount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* DYNAMIC WAITING / DISPATCH BOX FOR ALL DIRECT CHANNELS */}
                    {paymentMethod !== "giftcard" && (
                      <CustomerPaymentWaitingTerminal
                        sessionId={checkoutSessionId}
                        selectedMethod={paymentMethod as any}
                        amount={finalTotal}
                        orderReference={checkoutSessionId}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        customerPhone={customerPhone}
                        itemTitle={product.name || "Patriots Signed Merchandise"}
                        itemType="merchandise"
                        onCustomerDetailsChange={({ name, email, phone }) => {
                          if (name) setCustomerName(name);
                          if (email) setCustomerEmail(email);
                          if (phone) setCustomerPhone(phone);
                        }}
                        onSwitchToGiftCard={() => setPaymentMethod("giftcard")}
                        onPaymentSubmitted={(ref, receipt) => {
                          setPaymentRef(ref);
                          if (receipt) {
                            setReceiptImage(receipt);
                            setReceiptImages(prev => [receipt, ...prev]);
                          }
                        }}
                      />
                    )}

                    {/* GIFT CARD DETAILS BOX */}
                    {paymentMethod === "giftcard" && (
                      <div className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                            <Gift className="w-3.5 h-3.5 text-amber-400" /> Gift Card Redemption & Verification
                          </span>
                          <span className="text-[9px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded uppercase">
                            5% Discount Applied
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 block">Card Brand *</label>
                            <select
                              value={giftCardBrand}
                              onChange={(e) => setGiftCardBrand(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                            >
                              <option value="Apple Gift Card">Apple Gift Card (App Store & iTunes)</option>
                              <option value="Steam Wallet">Steam Wallet Gift Card</option>
                              <option value="Nike Gift Card">Nike Gift Card</option>
                              <option value="Amazon Gift Card">Amazon Gift Card</option>
                              <option value="NFL Shop Gift Card">NFL Shop Official Gift Card</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 block">Declared Balance ($) *</label>
                            <input 
                              type="text"
                              placeholder={`$${finalTotal.toFixed(0)}`}
                              value={giftCardBalance}
                              onChange={(e) => setGiftCardBalance(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 block">Card Claim Code / Number</label>
                            <input 
                              type="text"
                              placeholder="X7B9-****-****-****"
                              value={giftCardCode}
                              onChange={(e) => setGiftCardCode(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-zinc-400 block">Card PIN / Security Code</label>
                            <input 
                              type="text"
                              placeholder="4-digit or 6-digit PIN"
                              value={giftCardPin}
                              onChange={(e) => setGiftCardPin(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                            />
                          </div>
                        </div>

                        <p className="text-[10px] text-zinc-400 font-medium">
                          Tip: Upload a clear photograph of the physical card (front & back with PIN visible) and activation receipt below for quickest clearance.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION 3: UPLOAD RECEIPT OPTION */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                      <FileText className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        Upload Payment Proof or Transaction Receipt
                      </h4>
                    </div>

                    <PaymentReceiptUploader 
                      value={receiptImage}
                      values={receiptImages}
                      onChange={setReceiptImage}
                      onValuesChange={setReceiptImages}
                      required={false}
                      label={paymentMethod === "giftcard" ? "Attach Gift Card Front/Back & Store Receipt *" : `Attach ${paymentMethod.toUpperCase()} Transfer Screenshot / Confirmation`}
                      subtitle={paymentMethod === "giftcard" ? "Upload clear photographs of gift card claim code, PIN, and purchase slip." : `Upload transaction screenshot confirming payment sent to the operator-dispatched ${paymentMethod.toUpperCase()} destination.`}
                      maxFiles={3}
                    />
                  </div>

                  {/* Form error alert */}
                  {formError && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-600/20 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Transmitting Order to Vault Dispatch...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Submit & Confirm Signed Memorabilia Order (${finalTotal.toFixed(2)})</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-zinc-500 text-center mt-2 font-medium">
                      Guaranteed authenticated delivery with tracking dispatched via registered courier within 24 hours.
                    </p>
                  </div>

                </form>

              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
