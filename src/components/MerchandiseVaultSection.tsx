import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  X, 
  Check, 
  Copy, 
  Truck, 
  FileCheck, 
  Award, 
  Package, 
  CreditCard, 
  Gift, 
  Lock, 
  ExternalLink,
  ArrowRight,
  Info
} from "lucide-react";
import { PATRIOTS_SIGNED_MERCH_IMAGES, PATRIOTS_VENDOR_PAYPAL } from "./MerchandiseCheckoutModal";
import { NFLImage } from "../utils/nflImages";

interface MerchandiseVaultSectionProps {
  onOpenPatriotsCheckout: (product?: any, promoCode?: string) => void;
  products?: any[];
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

export const MerchandiseVaultSection: React.FC<MerchandiseVaultSectionProps> = ({
  onOpenPatriotsCheckout,
  products = [],
  selectedTeamId = "NE",
  onSelectTeam
}) => {
  // Active photo index in 7-photo gallery
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Quick promo test state in showcase (hidden/private by default)
  const [promoInput, setPromoInput] = useState("");
  const [isPromoApplied, setIsPromoApplied] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Keyboard navigation for image gallery
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === "ArrowLeft") {
        setActivePhotoIdx(prev => (prev === 0 ? PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 : prev - 1));
      } else if (e.key === "ArrowRight") {
        setActivePhotoIdx(prev => (prev === PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 ? 0 : prev + 1));
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyPromo = () => {
    if (promoInput.trim() === "258025") {
      setIsPromoApplied(true);
    } else {
      setIsPromoApplied(false);
    }
  };

  // Pricing math:
  // Base: $3500
  // With 258025: $1000
  // 5% payment method discount on PayPal/Gift Card:
  const basePrice = 3500;
  const slashedPrice = isPromoApplied ? 1000 : basePrice;
  const paymentDiscount = Number((slashedPrice * 0.05).toFixed(2));
  const finalPrice = Number((slashedPrice - paymentDiscount).toFixed(2));

  // The primary Patriots item object for modal dispatch
  const patriotsProductObject = {
    id: "m-NE-signed-merchandise",
    name: "New England Patriots Official Signed Merchandise Collection",
    description: "Exclusive certified authentic New England Patriots official autographed collector's vault piece with tamper-evident hologram, certificate of authenticity (COA), and luxury presentation display.",
    basePrice: 3500,
    price: 3500,
    category: "memorabilia",
    teamId: "NE",
    image: PATRIOTS_SIGNED_MERCH_IMAGES[0],
    images: PATRIOTS_SIGNED_MERCH_IMAGES,
    isPatriotsSignedMerch: true,
    rating: 5.0,
    reviewsCount: 68
  };

  // Other memorabilia items from products list
  const memorabiliaItems = products.filter(p => 
    p.category === "memorabilia" || 
    p.category === "limited" || 
    (p.name && (p.name.toLowerCase().includes("signed") || p.name.toLowerCase().includes("autographed")))
  );

  return (
    <div className="space-y-16">
      {/* SECTION HEADER */}
      <div className="border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            Official Authenticated Merchandise Department
          </div>
          <h3 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            Signed Merchandise Vault
          </h3>
          <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mt-2 max-w-2xl leading-relaxed">
            Direct team vendor certified authentic NFL autographed vault artifacts, player game-used memorabilia, and limited collector pieces.
          </p>
        </div>

        {onSelectTeam && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Filter Team:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => onSelectTeam(e.target.value)}
              className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-black uppercase tracking-widest focus:outline-none focus:border-blue-500"
            >
              <option value="NE">New England Patriots</option>
              <option value="SEA">Seattle Seahawks</option>
              <option value="MIN">Minnesota Vikings</option>
              <option value="DAL">Dallas Cowboys</option>
              <option value="KC">Kansas City Chiefs</option>
              <option value="SF">San Francisco 49ers</option>
            </select>
          </div>
        )}
      </div>

      {/* FLAGSHIP SHOWCASE: NEW ENGLAND PATRIOTS SIGNED MERCHANDISE */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border border-blue-500/30 p-6 sm:p-8 md:p-12 shadow-2xl">
        {/* Glow backdrop accent */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-8 border-b border-white/5 relative z-10">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-blue-600/30">
              <Award className="w-3.5 h-3.5" /> 100% Authentic Vault Piece
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Hologram & Registered COA
            </span>
            <span className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest">
              Exclusive VIP Team Vendor
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px] font-mono font-bold text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/5">
            <span>VAULT REF:</span>
            <span className="text-white">NE-PAT-7X-AUTOGRAPHED</span>
          </div>
        </div>

        {/* Main Content Grid: Left 7-Photo Gallery, Right Details & Pricing */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 pt-8 relative z-10">
          
          {/* LEFT: Complete 7-Photo Interactive Gallery (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Active Large Display Photo */}
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-black border border-white/10 group shadow-2xl">
              <img
                src={PATRIOTS_SIGNED_MERCH_IMAGES[activePhotoIdx]}
                alt={`New England Patriots Signed Merchandise Photo ${activePhotoIdx + 1}`}
                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105 cursor-pointer"
                onClick={() => setLightboxOpen(true)}
              />

              {/* Prev / Next Arrows */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(prev => (prev === 0 ? PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 : prev - 1));
                }}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all backdrop-blur-sm"
                aria-label="Previous photo"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePhotoIdx(prev => (prev === PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 ? 0 : prev + 1));
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 flex items-center justify-center transition-all backdrop-blur-sm"
                aria-label="Next photo"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Photo Index Badge & Zoom Button */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                <span className="px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/15 text-white font-mono text-[10px] font-black tracking-widest uppercase">
                  Photo {activePhotoIdx + 1} of {PATRIOTS_SIGNED_MERCH_IMAGES.length}
                </span>

                <button
                  type="button"
                  onClick={() => setLightboxOpen(true)}
                  className="pointer-events-auto px-3 py-1 rounded-lg bg-black/75 hover:bg-blue-600 text-white border border-white/15 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"
                >
                  <Maximize2 className="w-3 h-3" /> Zoom Full
                </button>
              </div>
            </div>

            {/* Complete 7 Thumbnails Row */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span>Complete Photo Archive ({PATRIOTS_SIGNED_MERCH_IMAGES.length} Angles):</span>
                <span className="text-blue-400">Click any image to inspect</span>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {PATRIOTS_SIGNED_MERCH_IMAGES.map((imgUrl, idx) => (
                  <button
                    key={`thumb-${idx}`}
                    type="button"
                    onClick={() => setActivePhotoIdx(idx)}
                    className={`relative aspect-square rounded-xl overflow-hidden bg-black border-2 transition-all group ${
                      activePhotoIdx === idx 
                        ? "border-blue-500 ring-2 ring-blue-500/40 scale-105 shadow-lg shadow-blue-500/20" 
                        : "border-white/10 hover:border-white/40 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img 
                      src={imgUrl} 
                      alt={`Thumbnail ${idx + 1}`} 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span className="absolute bottom-0.5 right-1 text-[8px] font-mono font-black text-white/80 bg-black/60 px-1 rounded">
                      {idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Authenticity Credentials Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 text-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <p className="text-[8px] font-black uppercase text-zinc-500">Verification</p>
                <p className="text-[10px] font-bold text-white">Beckett Witnessed</p>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 text-center">
                <FileCheck className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <p className="text-[8px] font-black uppercase text-zinc-500">Security</p>
                <p className="text-[10px] font-bold text-white">Tamper Hologram</p>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 text-center">
                <Package className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <p className="text-[8px] font-black uppercase text-zinc-500">Packaging</p>
                <p className="text-[10px] font-bold text-white">Museum UV Case</p>
              </div>
              <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 text-center">
                <Truck className="w-4 h-4 text-rose-400 mx-auto mb-1" />
                <p className="text-[8px] font-black uppercase text-zinc-500">Delivery</p>
                <p className="text-[10px] font-bold text-white">Insured Priority</p>
              </div>
            </div>
          </div>

          {/* RIGHT: Product Specs, VIP Pricing & Checkout Triggers (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <p className="text-blue-400 font-mono font-black text-xs uppercase tracking-widest mb-1">
                  NEW ENGLAND PATRIOTS · OFFICIAL MERCHANDISE
                </p>
                <h4 className="text-2xl sm:text-3xl font-black italic uppercase leading-none text-white">
                  Official Signed Merchandise Collection
                </h4>
                <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-3">
                  Certified authentic autographed official New England Patriots collector's vault piece with tamper-evident hologram, certificate of authenticity (COA), and presentation display.
                </p>
              </div>

              {/* Promo Code Box */}
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-blue-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5" /> VIP Promo Code
                  </span>
                  {isPromoApplied && (
                    <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase">
                      VIP Discount Active
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(e) => setPromoInput(e.target.value)}
                    placeholder="Enter VIP promo code"
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-zinc-500 uppercase tracking-widest focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromo}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                  >
                    Apply
                  </button>
                </div>

                {isPromoApplied ? (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/15">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>VIP Promo Verified: Price slashed from $3,500.00 to $1,000.00!</span>
                  </div>
                ) : (
                  <p className="text-[9px] text-zinc-500 font-medium">
                    Have an authorized VIP discount code? Enter it above to unlock preferred pricing.
                  </p>
                )}
              </div>

              {/* Price Breakdown Calculation */}
              <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-bold uppercase">Catalog Price:</span>
                  <span className={`font-mono font-bold ${isPromoApplied ? "line-through text-zinc-500" : "text-white"}`}>
                    ${basePrice.toFixed(2)}
                  </span>
                </div>

                {isPromoApplied && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-blue-400 font-bold uppercase">VIP Promo Slashed:</span>
                    <span className="font-mono font-bold text-blue-400">$1,000.00</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold uppercase">5% Payment Option Discount:</span>
                  <span className="font-mono font-bold text-emerald-400">-${paymentDiscount.toFixed(2)}</span>
                </div>

                <div className="pt-3 border-t border-white/5 flex justify-between items-baseline">
                  <div>
                    <span className="text-[10px] font-black uppercase text-zinc-400 block tracking-wider">
                      Authorized Net Total
                    </span>
                    <span className="text-[9px] text-emerald-400 font-bold uppercase">
                      Includes 5% PayPal/Giftcard discount
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-white text-3xl sm:text-4xl text-emerald-400">
                      ${finalPrice.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Official Vendor PayPal Credentials Box */}
              <div className="p-4 bg-blue-950/20 border border-blue-500/20 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authorized Team Vendor
                  </span>
                  <span className="text-[8px] font-black uppercase bg-blue-600/20 text-blue-300 px-2 py-0.5 rounded">
                    FAMILY AND FRIENDS ONLY
                  </span>
                </div>

                <div className="space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between items-center bg-zinc-950/60 px-3 py-1.5 rounded-lg">
                    <span className="text-zinc-500 text-[9px] uppercase">Vendor:</span>
                    <span className="text-white font-bold">{PATRIOTS_VENDOR_PAYPAL.name}</span>
                  </div>

                  <div className="flex justify-between items-center bg-zinc-950/60 px-3 py-1.5 rounded-lg">
                    <span className="text-zinc-500 text-[9px] uppercase">PayPal:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-blue-400 font-bold">{PATRIOTS_VENDOR_PAYPAL.email}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(PATRIOTS_VENDOR_PAYPAL.email, "email")}
                        className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                        title="Copy PayPal Email"
                      >
                        {copiedField === "email" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Checkout Trigger Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => onOpenPatriotsCheckout(patriotsProductObject, isPromoApplied ? "258025" : "")}
                className="w-full py-4 sm:py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                ACQUIRE PATRIOTS SIGNED MERCHANDISE ({finalPrice.toFixed(2)}$)
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[9px] text-zinc-500 font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-zinc-400" /> Secure Checkout</span>
                <span>•</span>
                <span>Requires Address & Receipt</span>
                <span>•</span>
                <span>PayPal / Gift Card</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN LIGHTBOX MODAL FOR 7 COMPLETE PICTURES */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-zinc-900 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors z-20"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center">
            <div className="relative max-w-4xl max-h-[75vh] w-full flex items-center justify-center">
              <img
                src={PATRIOTS_SIGNED_MERCH_IMAGES[activePhotoIdx]}
                alt={`Photo ${activePhotoIdx + 1}`}
                className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl"
              />

              {/* Prev / Next controls */}
              <button
                type="button"
                onClick={() => setActivePhotoIdx(prev => (prev === 0 ? PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 : prev - 1))}
                className="absolute left-2 sm:-left-14 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/90 text-white border border-white/20 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => setActivePhotoIdx(prev => (prev === PATRIOTS_SIGNED_MERCH_IMAGES.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 sm:-right-14 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-zinc-900/90 text-white border border-white/20 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Bottom Thumbnail Strip */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-xl">
              {PATRIOTS_SIGNED_MERCH_IMAGES.map((img, idx) => (
                <button
                  key={`lb-thumb-${idx}`}
                  type="button"
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    activePhotoIdx === idx ? "border-blue-500 scale-110 ring-2 ring-blue-500/40" : "border-white/10 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>

            <p className="text-zinc-400 font-mono text-xs uppercase tracking-widest mt-4">
              Photo {activePhotoIdx + 1} of {PATRIOTS_SIGNED_MERCH_IMAGES.length} · New England Patriots Official Signed Merchandise Collection
            </p>
          </div>
        </div>
      )}

      {/* ADDITIONAL SIGNED MEMORABILIA GALLERY */}
      {memorabiliaItems.length > 0 && (
        <div className="space-y-6 pt-8 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xl font-black italic uppercase tracking-wider text-white">
                More Authenticated Memorabilia & Collectibles
              </h4>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
                Certified pieces from across the National Football League
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {memorabiliaItems.map((item) => (
              <div 
                key={item.id}
                className="bg-zinc-950 p-5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/5 mb-4 relative">
                    <NFLImage item={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest">
                      {item.category}
                    </span>
                  </div>
                  <h5 className="text-sm font-bold text-white uppercase italic line-clamp-1 group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h5>
                  <p className="text-[10px] text-zinc-500 font-medium line-clamp-2 mt-1.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[8px] font-black uppercase text-zinc-500 block">Listed Price</span>
                    <span className="font-mono font-black text-white text-base">${item.price}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenPatriotsCheckout(item, isPromoApplied ? "258025" : "");
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    Acquire Piece
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
