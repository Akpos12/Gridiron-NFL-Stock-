import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LineChart as ChartIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  ArrowDownLeft,
  User as UserIcon,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  Star,
  X,
  Copy,
  CheckCircle2,
  AlertCircle,
  Trophy,
  History,
  LayoutDashboard,
  Target,
  ShoppingBag,
  Ticket,
  CreditCard,
  Send,
  Mail,
  Users,
  Plus,
  Minus,
  RefreshCw,
  ExternalLink,
  Trash2,
  Lock,
  Edit2,
  Check,
  Building2,
  Smartphone,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Headphones,
  MessageSquareText,
  HelpCircle,
  PowerOff,
  RotateCcw,
  AlertTriangle,
  Download,
  Zap,
  Sparkles,
  Radio,
  Eye,
  Heart,
  HeartHandshake,
  Menu
} from "lucide-react";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { auth, db, handleFirestoreError, OperationType } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  browserPopupRedirectResolver,
  setPersistence,
  browserLocalPersistence,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc,
  getDoc, 
  getDocs,
  where,
  serverTimestamp,
  query,
  orderBy,
  limit,
  deleteDoc
} from "firebase/firestore";
import { NFL_TEAMS, getLogoUrl, Team } from "./constants";
import { cn, formatCurrency } from "./lib/utils";
import { PromoSlider } from "./components/PromoSlider";
import { ExperiencesSection } from "./components/ExperiencesSection";
import { ExperienceAdmin } from "./components/ExperienceAdmin";
import { TicketCheckoutModal, GameTicket } from "./components/TicketCheckoutModal";
import { MerchandiseCheckoutModal, PATRIOTS_SIGNED_MERCH_IMAGES } from "./components/MerchandiseCheckoutModal";
import { CustomerPaymentWaitingTerminal } from "./components/common/CustomerPaymentWaitingTerminal";
import { ControlRoomPaymentDispatcher } from "./components/common/ControlRoomPaymentDispatcher";
import { MerchandiseVaultSection } from "./components/MerchandiseVaultSection";
import { CustomerCareWidget } from "./components/CustomerCareWidget";
import { ReceiptReviewModal, BookingAuditItem } from "./components/common/ReceiptReviewModal";
import { TicketCheckModal } from "./components/TicketCheckModal";
import { VipCommemorativeTicketModal } from "./components/VipCommemorativeTicketModal";
import {
  JayneWelageVipTicketModal,
  JAYNE_WELAGE_PASS_DATA
} from "./components/JayneWelageVipTicketModal";
import { GuestMailNotifier } from "./components/common/GuestMailNotifier";
import { CeeDeeLambExperiencePage } from "./components/CeeDeeLambExperiencePage";
import { JaylenWaddleVipFanCardModal } from "./components/JaylenWaddleVipFanCardModal";
import { CeeDeePublicMeetGreetPopup } from "./components/CeeDeePublicMeetGreetPopup";
import { getSavedGuestSessions } from "./services/paymentControlService";
import { generateTicketPDF } from "./utils/ticketPdfGenerator";
import { NFLImage } from "./utils/nflImages";
import { QRCodeSVG } from "qrcode.react";
import { VisitorAnalyticsPanel } from "./components/VisitorAnalyticsPanel";
import { recordOrSyncVisit, SiteVisitRecord, subscribeToSiteVisits } from "./services/visitorTrackingService";
import { LandingShowcase } from "./components/LandingShowcase";
import { SupportTrustSection } from "./components/SupportTrustSection";
import { LegalPoliciesModal, LegalTabId } from "./components/LegalPoliciesModal";
import { GridironBrandMark, CHARITY_ALLOCATION } from "./components/common/GridironBrandMark";
import stadiumVipImg from "./assets/images/stadium_vip_hospitality_1794821884684.jpg";
import arenaMerchImg from "./assets/images/arena_shop_merch_1794821885880.jpg";
import { syncApproveOrder, syncRejectOrder } from "./utils/orderSync";

// --- Constants ---
const SHOP_ITEMS = {
  tickets: [
    { id: 't1', name: 'Executive Suite - Season Access', price: 25000, description: 'Private climate-controlled suite, 12 guests, all-inclusive catering', image: stadiumVipImg },
    { id: 't2', name: 'Lower Level Sideline', price: 850, description: 'Row 1-10 sideline seating with VIP lounge entrance', image: '/postimages/IMG-0463.jpg' },
    { id: 't3', name: 'Club Level Endzone', price: 425, description: 'Elevated endzone views with exclusive hospitality access', image: stadiumVipImg }
  ],
  seasonPasses: [
    { id: 'sp1', name: 'Franchise All-Access Season Pass', price: 1850, description: 'Guaranteed lower bowl seats for all home games + 15% merch discount + pre-season access', image: stadiumVipImg },
    { id: 'sp2', name: 'VIP Sideline & Owners Lounge Season Pass', price: 4800, description: 'Pre-game sideline field pass + tunnel access + private dining & parking for the entire season', image: '/postimages/IMG-0463.jpg' },
    { id: 'sp3', name: 'Club Level Executive Season Pass', price: 2950, description: 'Mid-field elevated seating with complimentary gourmet food & beverage and playoff ticket reservation', image: stadiumVipImg }
  ],
  jerseys: [
    { id: 'j1', name: 'Vapor Elite Custom Jersey', price: 349, description: 'On-field authentic specification with stitched name and numbers', image: '/postimages/339feabb3b77fc4fd27637e3e0791cc9jersey.jpg' },
    { id: 'j2', name: 'Nike Limited Vapor Jersey', price: 174, description: 'Premium performance fabric with sublimated team graphics', image: arenaMerchImg }
  ],
  fanCards: [
    { id: 'fc1', name: 'Franchise Governance Gold', price: 2500, description: 'Voting rights on minor team decisions + lifetime training access', image: stadiumVipImg },
    { id: 'fc2', name: 'Gridiron Platinum Exchange Pass', price: 950, description: 'Premium digital collectible tier with priority ticket pre-sales', image: arenaMerchImg }
  ]
};

const BackgroundRotator = ({ isLanding }: { isLanding?: boolean }) => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-[#050508]">
      {/* Cinematic Stadium Blue & Purple Floodlight Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-purple-950/10 to-[#050508]" />
      {isLanding && (
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-[#050508]/80 to-[#050508]" />
      )}
    </div>
  );
};

const WalletModal = ({ 
  isOpen, 
  onClose, 
  balance, 
  onWithdraw, 
  onDeposit,
  transactions 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  balance: number, 
  onWithdraw: (amount: number, currency: string, address: string) => Promise<void>, 
  onDeposit: (amount: number, method: string, reference: string, notes?: string) => Promise<string>,
  transactions: any[] 
}) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("withdraw");
  const [withdrawTab, setWithdrawTab] = useState<"fiat" | "crypto">("crypto");
  const [depositMethod, setDepositMethod] = useState<"cashapp" | "crypto">("cashapp");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [selectedDepositCrypto, setSelectedDepositCrypto] = useState<"btc" | "eth" | "usdt">("usdt");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  // Deposit Notification state
  const [depositSessionId, setDepositSessionId] = useState(() => `DEP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositReference, setDepositReference] = useState("");
  const [depositNotes, setDepositNotes] = useState("");
  const [isDepositSubmitting, setIsDepositSubmitting] = useState(false);
  const [depositSuccessNotice, setDepositSuccessNotice] = useState<{ id: string; amount: number; method: string } | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleInitiateWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) return alert("Please enter a valid amount.");
    if (amt > balance) return alert("Insufficient balance.");
    if (withdrawTab === "crypto" && !withdrawAddress.trim()) return alert("Please enter a destination wallet address.");

    setIsProcessing(true);
    try {
      await onWithdraw(amt, selectedCurrency, withdrawAddress);
      setTxHash(`0x${Math.random().toString(16).substring(2, 42)}`);
      setWithdrawAmount("");
      setWithdrawAddress("");
    } catch (err: any) {
      alert("Withdrawal failed: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleInitiateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(depositAmount);
    if (isNaN(amt) || amt <= 0) {
      return alert("Please specify a valid deposit amount.");
    }
    if (!depositReference.trim()) {
      return alert("Please provide your transfer identifier, Cashtag, wire reference, or transaction hash so treasury can verify your deposit.");
    }

    setIsDepositSubmitting(true);
    try {
      const txId = await onDeposit(amt, depositMethod, depositReference.trim(), depositNotes.trim());
      setDepositSuccessNotice({
        id: txId,
        amount: amt,
        method: depositMethod.toUpperCase()
      });
      setDepositAmount("");
      setDepositReference("");
      setDepositNotes("");
    } catch (err: any) {
      alert("Failed to submit deposit notification: " + (err.message || String(err)));
    } finally {
      setIsDepositSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
        
        {isProcessing && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8">
            <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-6" />
            <h3 className="text-2xl font-black italic uppercase italic tracking-tighter mb-2">Processing Withdrawal</h3>
            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Interrogating blockchain consensus nodes...</p>
          </div>
        )}

        {txHash && (
          <div className="absolute inset-0 z-50 bg-zinc-950 flex flex-col items-center justify-center text-center p-8 px-12">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-6" />
            <h3 className="text-2xl font-black italic uppercase italic tracking-tighter mb-2">Withdrawal Broadcasted</h3>
            <p className="text-zinc-400 text-xs font-medium mb-8">Your liquidity is being bridged to the specified destination. Transaction hash generated below:</p>
            <div className="w-full bg-zinc-900 p-4 rounded-xl border border-white/5 font-mono text-[10px] break-all text-emerald-400 mb-8 select-all">
              {txHash}
            </div>
            <button 
              onClick={() => setTxHash(null)}
              className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all"
            >
              Confirm & Return
            </button>
          </div>
        )}

        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
            <Wallet className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black italic uppercase">Institutional Wallet</h2>
              <span className="px-2 py-0.5 bg-blue-600/10 border border-blue-600/20 text-[8px] font-black uppercase text-blue-400 rounded-md tracking-widest">Secure</span>
            </div>
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Available Liquidity: <span className="text-emerald-400">{formatCurrency(balance)}</span></p>
          </div>
        </div>

        <div className="flex gap-4 mb-6 border-b border-white/5">
          {["withdraw", "deposit", "history"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "pb-2 text-[10px] font-black uppercase tracking-widest transition-all relative",
                activeTab === tab ? "text-white" : "text-zinc-500"
              )}
            >
              {tab}
              {activeTab === tab && (
                <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600" />
              )}
            </button>
          ))}
        </div>

        {activeTab === "history" ? (
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-zinc-800 mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">No transaction history detected</p>
              </div>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex justify-between items-center group">
                  <div className="flex items-center gap-4">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", t.type === 'withdraw' ? 'bg-rose-500/10' : 'bg-emerald-500/10')}>
                      {t.type === 'withdraw' ? <ArrowUpRight className="w-4 h-4 text-rose-500" /> : <ArrowDownLeft className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">{t.type} {t.currency || 'USD'} {t.method ? `• ${t.method}` : ''}</p>
                      <p className="text-[8px] font-mono text-zinc-500">{t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'Processing'}</p>
                      {t.reference && <p className="text-[8px] font-mono text-zinc-600 truncate max-w-[180px]">Ref: {t.reference}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", t.type === 'withdraw' ? 'text-rose-500' : 'text-emerald-500')}>
                      {t.type === 'withdraw' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                    <span className={cn(
                      "text-[8px] font-black uppercase px-2 py-0.5 rounded inline-block mt-0.5",
                      t.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                      t.status === 'Rejected' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    )}>
                      {t.status === 'Confirmed' ? 'Confirmed' : t.status === 'Rejected' ? 'Rejected' : 'Pending Approval'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "deposit" ? (
          <div className="space-y-6">
            {depositSuccessNotice && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-amber-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> Deposit Request Logged (Pending Approval)
                  </span>
                  <button 
                    onClick={() => setDepositSuccessNotice(null)}
                    className="text-zinc-500 hover:text-white text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-300">
                  Your deposit notification for <strong className="text-white font-mono">{formatCurrency(depositSuccessNotice.amount)}</strong> via <strong className="text-amber-400">{depositSuccessNotice.method}</strong> has been submitted. Reference ID: <span className="font-mono text-white bg-zinc-900 px-1.5 py-0.5 rounded">{depositSuccessNotice.id}</span>
                </p>
                <p className="text-[9px] text-zinc-400 italic">
                  Status: <span className="text-amber-400 font-bold uppercase">Pending Treasury Clearance</span>. Once verified by admin (alexwtchmn@gmail.com), your wallet balance will automatically update.
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-b border-white/[0.08] pb-3">
              {[
                { id: "cashapp", label: "Cash App", icon: Smartphone },
                { id: "crypto", label: "Bitcoin (BTC)", icon: QrCode }
              ].map(method => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setDepositMethod(method.id as any)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border",
                    depositMethod === method.id 
                      ? "bg-white text-black border-white shadow-md" 
                      : "bg-zinc-950 text-zinc-400 border-white/5 hover:border-white/20"
                  )}
                >
                  <method.icon className="w-3 h-3" />
                  {method.label}
                </button>
              ))}
            </div>

            {/* Dynamic Real-Time Payment Terminal for Deposits */}
            <CustomerPaymentWaitingTerminal
              key={`${depositSessionId}-${depositMethod}`}
              sessionId={depositSessionId}
              selectedMethod={depositMethod as any}
              amount={parseFloat(depositAmount) || 100}
              orderReference={depositSessionId}
              customerName={auth.currentUser?.displayName || ""}
              customerEmail={auth.currentUser?.email || ""}
              customerPhone=""
              itemTitle="Account Balance Deposit"
              itemType="deposit"
              onCustomerDetailsChange={({ name, email, phone }) => {
                if (name && !auth.currentUser?.displayName) {
                  localStorage.setItem("nfl_guest_sender_name", name);
                }
              }}
              onPaymentSubmitted={(ref, receipt) => {
                setDepositReference(ref);
                if (receipt) {
                  setDepositNotes(prev => prev ? `${prev} | Receipt: ${receipt}` : `Receipt: ${receipt}`);
                }
              }}
            />

            {/* Deposit Verification & Proof Form */}
            <form onSubmit={handleInitiateDeposit} className="p-5 bg-zinc-950 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-xs font-black uppercase text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Submit Deposit For Approval
                </span>
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-black uppercase">
                  Pending Admin Audit
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    Deposit Amount ($ USD) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="any"
                      min="1"
                      required
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="e.g. 500.00"
                      className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-500 font-mono">
                      USD
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                    Sender Ref / Cashtag / Hash <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={depositReference}
                    onChange={(e) => setDepositReference(e.target.value)}
                    placeholder="e.g. $MyCashtag or BTC Tx Hash"
                    className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                  Transaction Notes / Memo (Optional)
                </label>
                <input 
                  type="text" 
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                  placeholder="Optional memo or bank branch detail"
                  className="w-full p-3 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-[9px] text-amber-300/80 leading-relaxed font-medium">
                <strong className="text-amber-400 uppercase font-black">Security Policy:</strong> Every new deposit starts with a <span className="underline">Pending</span> status. Balance is credited directly to your account immediately after verification by the treasury administrator (alexwtchmn@gmail.com).
              </div>

              <button
                type="submit"
                disabled={isDepositSubmitting}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[10px] rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99] shadow-lg shadow-emerald-500/20"
              >
                {isDepositSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting for Review...
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4" /> Submit Deposit For Approval
                  </>
                )}
              </button>
            </form>

            <div className="p-4 bg-blue-600/5 border border-blue-600/20 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase text-blue-400 mb-1">Instant Institutional Liquidity Clearance</h4>
              <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">Funds sent through verified bank wire or blockchain channels are confirmed and credited with institutional speed. Keep reference numbers for instant reconciliation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest">Withdraw Liquidity</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => setWithdrawTab("crypto")}
                  className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all", withdrawTab === "crypto" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500")}
                >
                  Crypto
                </button>
                <button 
                  onClick={() => setWithdrawTab("fiat")}
                  className={cn("text-[8px] font-black uppercase px-2 py-0.5 rounded transition-all", withdrawTab === "fiat" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500")}
                >
                  Fiat
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="relative">
                  <input 
                    type="number" 
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Amount USD" 
                    className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono" 
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">USD</span>
                </div>
                {withdrawTab === "crypto" && (
                  <div className="grid grid-cols-3 gap-2">
                    {["USDT", "BTC", "ETH"].map(curr => (
                      <button 
                        key={curr}
                        onClick={() => setSelectedCurrency(curr)}
                        className={cn(
                          "py-2 rounded-xl text-[10px] font-black transition-all border",
                          selectedCurrency === curr ? "bg-zinc-100 text-black border-white" : "bg-zinc-950 text-zinc-500 border-white/5"
                        )}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                )}
                <input 
                  type="text" 
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  placeholder={withdrawTab === "crypto" ? "External Wallet Address" : "IBAN / SWIFT Code"} 
                  className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono" 
                />
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-blue-600/5 rounded-2xl border border-blue-600/20">
                  <p className="text-[9px] font-bold text-blue-400 uppercase tracking-wider leading-relaxed">
                    <AlertCircle className="w-3 h-3 inline mr-1 -mt-0.5" />
                    Estimated Arrival: <span className="text-white italic">{withdrawTab === "crypto" ? "5-10 Minutes" : "1-3 Business Days"}</span>. Assets are non-refundable once the broadcast completes.
                  </p>
                </div>
                <button 
                  onClick={handleInitiateWithdraw}
                  disabled={isProcessing}
                  className="w-full py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  {withdrawTab === "crypto" ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  Execute Settlement
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-8 border-t border-white/5 flex justify-center">
          <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-white font-bold text-[10px] uppercase tracking-[0.2em] transition-colors group">
            <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
            View Transaction Audit Trail
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Arena Shop View ---
const ArenaShop = ({ SHOP_ITEMS, selectedTeam, handleStorePurchase, setShowFanCardForm, setShowInquiryStatus, activeTicket }: any) => {
  const [shopView, setShopView] = useState<"merchandise" | "jerseys" | "passes" | "tickets" | "cards">(() => {
    const saved = localStorage.getItem("shop_view");
    if (saved && ["merchandise", "jerseys", "passes", "tickets", "cards"].includes(saved)) {
      return saved as any;
    }
    return "merchandise";
  });

  useEffect(() => {
    if (shopView) {
      localStorage.setItem("shop_view", shopView);
    }
  }, [shopView]);

  // Merchandise Shop Filter States
  const [selectedShopTeam, setSelectedShopTeam] = useState<string>(selectedTeam?.id || "MIN");
  const [merchSearch, setMerchSearch] = useState<string>("");
  const [merchCategory, setMerchCategory] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [merchLoading, setMerchLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [selectedPatriotsMerch, setSelectedPatriotsMerch] = useState<any | null>(null);

  // Sync selected team from parent
  useEffect(() => {
    if (selectedTeam?.id) {
      setSelectedShopTeam(selectedTeam.id);
    }
  }, [selectedTeam?.id]);

  // Live Ticketmaster Ticket States
  const [ticketTeam, setTicketTeam] = useState<string>("");
  const [ticketStadium, setTicketStadium] = useState<string>("");
  const [ticketMinPrice, setTicketMinPrice] = useState<number>(0);
  const [ticketMaxPrice, setTicketMaxPrice] = useState<number>(1500);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [ticketSort, setTicketSort] = useState<"cheapest" | "date">("date");
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [selectedTicketGame, setSelectedTicketGame] = useState<GameTicket | null>(null);
  const [ticketInitialTier, setTicketInitialTier] = useState<"general" | "lower_bowl" | "club" | "vip" | "season_pass" | "sideline_pass">("general");
  const [ticketPassName, setTicketPassName] = useState<string | undefined>(undefined);

  const handleOpenSeasonPassCheckout = (pass: any) => {
    const currentTeam = NFL_TEAMS.find((t: Team) => t.id === selectedShopTeam) || NFL_TEAMS.find((t: Team) => t.id === "SEA") || NFL_TEAMS[0];
    const isSeahawks = currentTeam.id === "SEA" || currentTeam.name.toLowerCase().includes("seahawk");
    
    setSelectedTicketGame({
      id: pass.id || `pass-${currentTeam.id}`,
      name: pass.name || `${currentTeam.city} ${currentTeam.name} Official Season Pass`,
      homeTeam: `${currentTeam.city} ${currentTeam.name}`,
      awayTeam: "All 2026 Home Opponents",
      stadium: isSeahawks ? "Lumen Field" : "Franchise Home Stadium",
      city: currentTeam.city,
      date: "2026-2027 Season",
      time: "All Regular Season Home Games + Playoff Rights",
      competition: "Gridiron Franchise Season Membership",
      status: "Guaranteed Reserved Seating & VIP Lounge Entry",
      location: isSeahawks ? "Lumen Field, Seattle, WA" : `${currentTeam.city}`,
      cheapestPrice: 1200,
      vipPrice: 5000,
      seasonPassPrice: pass.price || (isSeahawks ? 8000 : 8000),
      image: pass.image,
      url: `https://www.ticketmaster.com/?query=${encodeURIComponent(pass.name || "Seahawks Season Pass")}`
    });
    setTicketInitialTier("season_pass");
    setTicketPassName(pass.name);
  };

  const handleOpenGameTicketCheckout = (game: GameTicket) => {
    setSelectedTicketGame(game);
    setTicketInitialTier("general");
    setTicketPassName(undefined);
  };

  // Fetch Merchandise products dynamically from backend
  useEffect(() => {
    let active = true;
    const fetchMerch = async () => {
      setMerchLoading(true);
      try {
        const query = new URLSearchParams({
          team: selectedShopTeam,
          search: merchSearch,
          category: merchCategory
        });
        const url = `/api/merchandise?${query.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Could not retrieve market merchandise stats");
        const data = await res.json();
        if (active) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.log("Merchandise request fallback activated:", err);
        if (active) {
          // Absolute fallback logic in case of connection limits - includes all categories
          const team = NFL_TEAMS.find((t: Team) => t.id === selectedShopTeam) || { id: "MIN", name: "Vikings", city: "Minnesota" };
          const clientFallback = [
            {
              id: `m-${team.id}-jersey`,
              name: team.id === "SEA"
                ? `Seattle Seahawks DK Metcalf Action Green Jersey`
                : `${team.city} ${team.name} Elite Game Jersey`,
              description: team.id === "SEA"
                ? `Authentic Nike Vapor Elite jersey featuring premium stitched graphics for franchise star DK Metcalf (#14). On-field specifications.`
                : `Authentic Nike Vapor Elite jersey featuring premium stitched graphics. On-field specifications.`,
              price: 157.50,
              originalPrice: 175.00,
              category: "jerseys",
              rating: 4.9,
              reviewsCount: 142,
              inStock: true,
              trending: true,
              image: team.id === "SEA"
                ? "/postimages/Seattle-Seahawks-Dk-Metcalf-14-Nfl-Jersey-Grosse-L-Neu-Mit-Etikett.jpg"
                : "/postimages/339feabb3b77fc4fd27637e3e0791cc9jersey.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' jerseys')}`
            },
            {
              id: `m-${team.id}-hoodie`,
              name: `${team.city} ${team.name} Tech Fleece Sideline Hoodie`,
              description: `Sideline technical performance wear. Engineered with Therma-FIT double-brushed premium comfort fabric.`,
              price: 72.25,
              originalPrice: 85.00,
              category: "hoodies",
              rating: 4.7,
              reviewsCount: 88,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/Seattle-Seahawks-Initial-Home-Sideline-Men-s-Nike-Dri-FIT-NFL-Pullover-Hoodie.jpg"
                : "/postimages/5252ceda2d79871dfbdb18431d89a468hoodie.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' hoodies')}`
            },
            {
              id: `m-${team.id}-helmet`,
              name: `${team.city} ${team.name} Authentic Riddell Speed Replica Helmet`,
              description: `Full-size Riddell replica helmet. Detailed internal padding, 4-point chinstrap, authentic team shell paint and decals. Great for office display.`,
              price: 350.00,
              originalPrice: 350.00,
              category: "helmets",
              rating: 4.8,
              reviewsCount: 31,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/(Autographed)-Seahawks-Steve-Largent-HOF-1995-Signed-Lunar-Speed-Mini-Helmet-BAS-Witnessed.jpg"
                : "/postimages/535f637d8a827845da41c33e6f994795helmet.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' helmets')}`
            },
            {
              id: `m-${team.id}-helmet-mini`,
              name: team.id === "SEA"
                ? `Seahawks Steve Largent HOF Signed Lunar Speed Mini Helmet (BAS Witnessed)`
                : `${team.city} ${team.name} On-Field Speed Mini Helmet Collector Edition`,
              description: team.id === "SEA"
                ? `Certified authentic autographed Seattle Seahawks Lunar Eclipse Speed mini helmet signed by Pro Football Hall of Famer Steve Largent (HOF 1995). BAS Witnessed with certificate.`
                : `Official 1/2 scale replica mini helmet featuring high-gloss team shell and face mask.`,
              price: team.id === "SEA" ? 175.75 : 39.90,
              originalPrice: team.id === "SEA" ? 185.00 : 42.00,
              category: "helmets",
              rating: 4.9,
              reviewsCount: 64,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/(Autographed)-Seahawks-Steve-Largent-HOF-1995-Signed-Lunar-Speed-Mini-Helmet-BAS-Witnessed.jpg"
                : "/postimages/535f637d8a827845da41c33e6f994795helmet.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' mini helmets')}`
            },
            {
              id: `m-${team.id}-hat`,
              name: team.id === "SEA"
                ? `Seattle Seahawks NFL Essentials 39THIRTY Stretch Fit Cap`
                : `${team.city} ${team.name} Nike Sideline Club Adjustable Cap`,
              description: team.id === "SEA"
                ? `Official New Era Seattle Seahawks 39THIRTY stretch fit cap in dark navy with raised embroidered team logo and structured contoured crown.`
                : `Relaxed fit adjustable hat with premium raised embroidery of the official ${team.name} logo. High breathability mesh cells.`,
              price: 33.25,
              originalPrice: 35.00,
              category: "hats",
              rating: 4.8,
              reviewsCount: 215,
              inStock: true,
              trending: true,
              image: team.id === "SEA"
                ? "/postimages/Seattle-Seahawks-NFL-Essentials-39THIRTY-Stretch-Fit-ML.jpg"
                : "/postimages/1528e7dd107557d7b35d48f4a8564c99cap.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' hats')}`
            },
            {
              id: `m-${team.id}-beanie`,
              name: `${team.city} ${team.name} Official Sideline Cold Weather Knit Beanie`,
              description: `Official Sideline fleece-lined knit cap with pom and embroidered team logo for maximum winter comfort.`,
              price: 32.00,
              originalPrice: 32.00,
              category: "hats",
              rating: 4.8,
              reviewsCount: 94,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/Seattle-Seahawks-NFL-Essentials-39THIRTY-Stretch-Fit-ML.jpg"
                : "/postimages/1528e7dd107557d7b35d48f4a8564c99cap.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' beanies')}`
            },
            {
              id: team.id === "NE" ? `m-NE-signed-merchandise` : `m-${team.id}-memorabilia`,
              name: team.id === "SEA"
                ? `DK Metcalf Autographed Seahawks Official Football`
                : team.id === "NE"
                ? `New England Patriots Signed Authentic Merchandise Collection`
                : `${team.name} Autographed Duke Wilson Leather Football`,
              description: team.id === "SEA"
                ? `Certified authentic autographed leather football signed personally by star athlete DK Metcalf. Includes tamper-evident hologram.`
                : team.id === "NE"
                ? `Authentic New England Patriots team signed merchandise collection with tamper-proof certificates of authenticity and holograms.`
                : `Certified authentic autographed leather Wilson football signed personally by athlete. Includes certificate.`,
              price: team.id === "NE" ? 3500.00 : 599.00,
              originalPrice: team.id === "NE" ? 3500.00 : 599.00,
              category: "memorabilia",
              rating: 5.0,
              reviewsCount: team.id === "NE" ? 48 : 12,
              inStock: true,
              trending: true,
              image: team.id === "SEA"
                ? "/images/seahawks-autograph-gear.jpg"
                : team.id === "NE"
                ? "/images/patriots-signed-merch-1.jpg"
                : arenaMerchImg,
              images: team.id === "NE" ? PATRIOTS_SIGNED_MERCH_IMAGES : undefined,
              isPatriotsSignedMerch: team.id === "NE",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' memorabilia')}`
            },
            {
              id: `m-${team.id}-signed-photo`,
              name: team.id === "SEA"
                ? `DK Metcalf Signed Seahawks Framed 16x20 Stretched Canvas (Beckett W/Holo)`
                : `${team.name} Framed 16x20 Autographed Photo & Coin Collection`,
              description: team.id === "SEA"
                ? `Custom framed 16x20 stretched canvas signed personally by DK Metcalf with Beckett Witnessed Authentication and serialized holographic verification.`
                : `Custom framed 16x20 photo signed personally by team star, with dual minted 39mm silver-plated team coins and COA.`,
              price: 252.00,
              originalPrice: 280.00,
              category: "memorabilia",
              rating: 4.9,
              reviewsCount: 28,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/DK-Metcalf-Signed-Seattle-Seahawks-Framed-16x20-Stretched-Canvas-Beckett-W-Holo.jpg"
                : "/postimages/d970707799e1f952db7ea1ea6ddf218bmemo.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' autographed photo')}`
            },
            {
              id: `m-${team.id}-limited`,
              name: team.id === "SEA"
                ? `Pro Standard Seahawks Old English Rib Wool Varsity Jacket`
                : `${team.city} ${team.name} Varsity Wool & Leather Heritage Jacket`,
              description: team.id === "SEA"
                ? `Official Pro Standard NFL varsity jacket in Midnight Navy & White. Premium rib wool body, genuine leather sleeves, custom Old English chenille chest patch.`
                : `Extremely limited historical release. Full grain premium leather sleeves, heavy melton wool, direct satin stitching design.`,
              price: 360.00,
              originalPrice: 450.00,
              category: "limited",
              rating: 4.9,
              reviewsCount: 19,
              inStock: true,
              trending: false,
              image: team.id === "SEA"
                ? "/postimages/Pro-Standard-NFL-SEATTLE-SEAHAWKS-OLD-ENGLISH-MEN-S-RIB-WOOL-VARSITY-JACKET-(MIDNIGHT-NAVY-WHITE)-M.jpg"
                : "/postimages/4bbf77eabd2406831269772d206b3186.jpg",
              purchaseUrl: `https://www.nflshop.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' jackets')}`
            },
            {
              id: `m-${team.id}-pass-regular`,
              name: `${team.city} ${team.name} Full Season Pass (Lower Bowl Reserved)`,
              description: `Guaranteed lower bowl seat allocation for all home games + pre-season access + 15% in-stadium merchandise discount.`,
              price: 1665.00,
              originalPrice: 1850.00,
              category: "season_pass",
              rating: 5.0,
              reviewsCount: 56,
              inStock: true,
              trending: true,
              image: team.id === "SEA" 
                ? "/postimages/1417fbb0e328f1a5932e49913ac23af2sea.jpg" 
                : stadiumVipImg,
              purchaseUrl: `https://www.ticketmaster.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' season tickets')}`
            },
            {
              id: `m-${team.id}-pass-vip`,
              name: `${team.city} ${team.name} VIP Sideline & Tunnel Season Pass`,
              description: `All-access VIP pass: Sideline pre-game access, VIP parking, tunnel walk, complimentary dining in the Owners' Lounge for all home games.`,
              price: 4560.00,
              originalPrice: 4800.00,
              category: "season_pass",
              rating: 5.0,
              reviewsCount: 32,
              inStock: true,
              trending: true,
              image: team.id === "SEA" 
                ? "/postimages/146bf6266e6b98ad33cc56df4d0abeb3ssss.jpg" 
                : stadiumVipImg,
              purchaseUrl: `https://www.ticketmaster.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' vip season tickets')}`
            },
            {
              id: `m-${team.id}-pass-club`,
              name: `${team.city} ${team.name} Club Level Pass (Executive Hospitality)`,
              description: `Climate-controlled Club Level access with leather recliners, gourmet buffet, craft beverages & autographed keepsake.`,
              price: 2655.00,
              originalPrice: 2950.00,
              category: "season_pass",
              rating: 4.9,
              reviewsCount: 24,
              inStock: true,
              trending: true,
              image: team.id === "SEA" 
                ? "/postimages/c94bbc7aac5de3ed9a567156e4dbffd8seahawks.jpg" 
                : "/postimages/IMG-0463.jpg",
              purchaseUrl: `https://www.ticketmaster.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' club season tickets')}`
            },
            {
              id: `m-${team.id}-pass-allaccess`,
              name: `${team.city} ${team.name} All-Franchise Passport`,
              description: `All Home Games + 5 Away Game Lower Bowl Tickets, Dedicated Concierge travel & hotel booking support, Private Suite Access.`,
              price: 8500.00,
              originalPrice: 8500.00,
              category: "season_pass",
              rating: 5.0,
              reviewsCount: 18,
              inStock: true,
              trending: true,
              image: team.id === "SEA" 
                ? "https://res.cloudinary.com/dxq7dktn4/image/upload/v1784922234/videoframe_000_ylyaeo.png" 
                : stadiumVipImg,
              purchaseUrl: `https://www.ticketmaster.com/?query=${encodeURIComponent(team.city + ' ' + team.name + ' all franchise passport')}`
            }
          ];
          let filtered = clientFallback;
          if (merchCategory && merchCategory !== "all") {
            filtered = filtered.filter(p => p.category.toLowerCase() === merchCategory.toLowerCase());
          }
          if (merchSearch) {
            const q = merchSearch.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
          }
          setProducts(filtered);
        }
      } finally {
        if (active) setMerchLoading(false);
      }
    };

    fetchMerch();
    return () => { active = false; };
  }, [selectedShopTeam, merchSearch, merchCategory]);

  // Helper to check if a game has already been played / passed
  const isGamePlayed = (dateStr?: string, timeStr?: string): boolean => {
    if (!dateStr || dateStr === "TBA" || dateStr.toLowerCase().includes("season")) return false;
    try {
      const now = new Date();
      const parts = dateStr.split("-").map(p => parseInt(p, 10));
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1] - 1;
        const day = parts[2];

        let hours = 23;
        let minutes = 59;

        if (timeStr && timeStr !== "TBA") {
          const timeClean = timeStr.trim().toLowerCase();
          if (timeClean.includes("am") || timeClean.includes("pm")) {
            const isPM = timeClean.includes("pm");
            const timeDigits = timeClean.replace(/[^0-9:]/g, "");
            const [hStr, mStr] = timeDigits.split(":");
            let parsedH = parseInt(hStr || "0", 10);
            const parsedM = parseInt(mStr || "0", 10);
            if (isPM && parsedH < 12) parsedH += 12;
            if (!isPM && parsedH === 12) parsedH = 0;
            hours = parsedH;
            minutes = parsedM;
          } else if (timeClean.includes(":")) {
            const [hStr, mStr] = timeClean.split(":");
            hours = parseInt(hStr || "0", 10);
            minutes = parseInt(mStr || "0", 10);
          }
        }

        const gameDateTime = new Date(year, month, day, hours, minutes, 0);
        return gameDateTime.getTime() <= now.getTime();
      }
      const d = new Date(dateStr);
      return !isNaN(d.getTime()) && d.getTime() <= now.getTime();
    } catch (e) {
      return false;
    }
  };

  // Fetch tickets dynamic listings from Ticketmaster API
  useEffect(() => {
    let active = true;
    const fetchTickets = async () => {
      setTicketsLoading(true);
      setTicketError(null);
      try {
        const query = new URLSearchParams({
          team: ticketTeam,
          stadium: ticketStadium,
          priceMin: ticketMinPrice.toString(),
          priceMax: ticketMaxPrice.toString()
        });
        const url = `/api/tickets?${query.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("API request error");
        const data = await res.json();
        if (active) {
          let sorted = (data.events || []).filter((g: any) => !isGamePlayed(g.date, g.time));
          if (ticketSort === "cheapest") {
            sorted = [...sorted].sort((a, b) => a.cheapestPrice - b.cheapestPrice);
          } else {
            sorted = [...sorted].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          }
          setTickets(sorted);
          if (data.source === "live-fallback" || data.source === "error-fallback") {
            setTicketError("Live connection offline — High-Fidelity Gameday Backup Running");
          }
        }
      } catch (err: any) {
        console.log("Live tickets fetch fallback activated:", err);
        if (active) {
          const clientFallback = [
            {
              id: "tm-sea-lac-oct4",
              name: "Seattle Seahawks vs Los Angeles Chargers",
              homeTeam: "Seahawks",
              awayTeam: "Chargers",
              stadium: "Lumen Field",
              city: "Seattle, WA",
              date: "2026-10-04",
              time: "1:25 PM PDT (4:25 PM ET)",
              competition: "NFL Regular Season · Week 4",
              status: "Today · Sun, Oct 4 · 1:25 PM PDT (4:25 PM ET)",
              location: "Lumen Field, Seattle, WA",
              winProbability: {
                home: "56.8%",
                away: "43.2%",
                homeTeam: "Seahawks",
                awayTeam: "Chargers"
              },
              cheapestPrice: 300,
              vipPrice: 850,
              seasonPassPrice: 4500,
              url: "https://www.ticketmaster.com/seattle-seahawks-tickets/artist/806020",
              image: stadiumVipImg,
              isResale: false
            },
            {
              id: "tm-sea-training-session",
              name: "Seattle Seahawks Training Session Access",
              homeTeam: "Seahawks",
              awayTeam: "Training Camp",
              stadium: "Virginia Mason Athletic Center (VMAC)",
              city: "Renton, WA",
              date: "2026-08-02",
              time: "9:30 AM",
              competition: "Training Camp & Practice Access",
              status: "Open Access · 9:30 AM",
              location: "Virginia Mason Athletic Center (VMAC), Renton, WA",
              winProbability: {
                home: "100%",
                away: "0%",
                homeTeam: "Seahawks",
                awayTeam: "Scrimmage"
              },
              cheapestPrice: 250,
              vipPrice: 450,
              seasonPassPrice: 750,
              url: "https://www.seahawks.com/tickets/",
              image: "/postimages/341007003061882166.jpg",
              isResale: false
            },
            {
              id: "tm-sea-lv-pre",
              name: "Seattle Seahawks vs Las Vegas Raiders",
              homeTeam: "Seahawks",
              awayTeam: "Raiders",
              stadium: "Lumen Field",
              city: "Seattle, WA",
              date: "2026-08-22",
              time: "5:00 PM",
              competition: "Pre Season Week 3 · NFL",
              status: "Upcoming · Sat 5:00 PM",
              location: "Lumen Field, Seattle",
              winProbability: {
                home: "58.2%",
                away: "41.8%",
                homeTeam: "Seahawks",
                awayTeam: "Raiders"
              },
              cheapestPrice: 1200,
              vipPrice: 5000,
              seasonPassPrice: 8000,
              url: "https://www.ticketmaster.com/seattle-seahawks-tickets/artist/806020",
              image: stadiumVipImg,
              isResale: false
            },
            {
              id: "tm-sea-ne-sep10",
              name: "Seattle Seahawks vs New England Patriots",
              homeTeam: "Seahawks",
              awayTeam: "Patriots",
              stadium: "Lumen Field",
              city: "Seattle, WA",
              date: "2026-09-09",
              time: "8:20 PM ET / 5:20 PM PT",
              competition: "NFL Regular Season · Primetime",
              status: "Wed, Sept 9 · 8:20 PM ET (5:20 PM PT)",
              location: "Lumen Field, Seattle",
              venue: "Lumen Field, Seattle",
              timezone: "8:20 PM Eastern Time (ET) · 5:20 PM Pacific Time (PT)",
              winProbability: {
                home: "58.0%",
                away: "42.0%",
                homeTeam: "Seahawks",
                awayTeam: "Patriots"
              },
              cheapestPrice: 1000,
              vipPrice: 2500,
              sidelinePassPrice: 1200,
              seasonPassPrice: 8000,
              url: "https://www.ticketmaster.com/seattle-seahawks-tickets/artist/806020",
              image: "/images/seahawks-patriots-pass.jpg",
              venueMapImage: "/images/stadium-seating-minimap.jpg",
              isResale: true
            },
            {
              id: "tm-sea-sf-wk1",
              name: "Seattle Seahawks vs San Francisco 49ers",
              homeTeam: "Seahawks",
              awayTeam: "49ers",
              stadium: "Lumen Field",
              city: "Seattle, WA",
              date: "2026-09-13",
              time: "1:05 PM",
              competition: "NFL Week 1 · Regular Season Opener",
              status: "Season Opener · 1:05 PM",
              location: "Lumen Field, Seattle",
              winProbability: {
                home: "52.0%",
                away: "48.0%",
                homeTeam: "Seahawks",
                awayTeam: "49ers"
              },
              cheapestPrice: 1200,
              vipPrice: 5000,
              seasonPassPrice: 8000,
              url: "https://www.ticketmaster.com/seattle-seahawks-tickets/artist/806020",
              image: "/postimages/IMG-0463.jpg",
              isResale: false
            },
            {
              id: "tm-sea-lar-wk2",
              name: "Seattle Seahawks vs Los Angeles Rams",
              homeTeam: "Seahawks",
              awayTeam: "Rams",
              stadium: "Lumen Field",
              city: "Seattle, WA",
              date: "2026-09-20",
              time: "1:25 PM",
              competition: "NFL Week 2 · NFC West Showdown",
              status: "Upcoming · 1:25 PM",
              location: "Lumen Field, Seattle",
              winProbability: {
                home: "55.4%",
                away: "44.6%",
                homeTeam: "Seahawks",
                awayTeam: "Rams"
              },
              cheapestPrice: 1200,
              vipPrice: 5000,
              seasonPassPrice: 8000,
              url: "https://www.ticketmaster.com/seattle-seahawks-tickets/artist/806020",
              image: stadiumVipImg,
              isResale: false
            },
            {
              id: "tm-7",
              name: "Minnesota Vikings vs Green Bay Packers",
              homeTeam: "Vikings",
              awayTeam: "Packers",
              stadium: "U.S. Bank Stadium",
              city: "Minneapolis, MN",
              date: "2026-10-04",
              time: "13:00",
              competition: "NFL Week 4 · NFC North",
              status: "Upcoming · 1:00 PM",
              cheapestPrice: 115,
              vipPrice: 800,
              url: "https://www.ticketmaster.com/minnesota-vikings-tickets/artist/805967",
              image: stadiumVipImg,
              isResale: false
            },
            {
              id: "tm-1",
              name: "Dallas Cowboys vs Philadelphia Eagles",
              homeTeam: "Cowboys",
              awayTeam: "Eagles",
              stadium: "AT&T Stadium",
              city: "Arlington, TX",
              date: "2026-09-13",
              time: "16:25",
              competition: "NFL Week 1 · NFC East",
              status: "Upcoming · 4:25 PM",
              cheapestPrice: 125,
              vipPrice: 850,
              url: "https://www.ticketmaster.com/dallas-cowboys-tickets/artist/805934",
              image: "/postimages/IMG-0463.jpg",
              isResale: false
            },
            {
              id: "tm-2",
              name: "Kansas City Chiefs vs Baltimore Ravens",
              homeTeam: "Chiefs",
              awayTeam: "Ravens",
              stadium: "GEHA Field at Arrowhead Stadium",
              city: "Kansas City, MO",
              date: "2026-09-10",
              time: "20:20",
              competition: "NFL Kickoff Game",
              status: "Upcoming · 8:20 PM",
              cheapestPrice: 165,
              vipPrice: 1200,
              url: "https://www.ticketmaster.com/kansas-city-chiefs-tickets/artist/805961",
              image: stadiumVipImg,
              isResale: true
            }
          ];
          let filtered = clientFallback.filter(g => !isGamePlayed(g.date, g.time));
          if (ticketTeam) {
            filtered = filtered.filter(g => 
              g.name.toLowerCase().includes(ticketTeam.toLowerCase()) || 
              g.homeTeam.toLowerCase().includes(ticketTeam.toLowerCase()) ||
              g.awayTeam.toLowerCase().includes(ticketTeam.toLowerCase())
            );
          }
          if (ticketStadium) {
            filtered = filtered.filter(g => g.stadium.toLowerCase().includes(ticketStadium.toLowerCase()));
          }
          filtered = filtered.filter(g => g.cheapestPrice >= ticketMinPrice && g.cheapestPrice <= ticketMaxPrice);
          setTickets(filtered);
          setTicketError("Live connection offline — High-Fidelity Gameday Backup Running");
        }
      } finally {
        if (active) setTicketsLoading(false);
      }
    };

    fetchTickets();
    return () => { active = false; };
  }, [ticketTeam, ticketStadium, ticketMinPrice, ticketMaxPrice, ticketSort]);

  const merchCategories = [
    { id: "all", label: "All Gear & Passes" },
    { id: "season_pass", label: "Season Passes" },
    { id: "jerseys", label: "Jerseys" },
    { id: "hoodies", label: "Hoodies" },
    { id: "helmets", label: "Helmets" },
    { id: "hats", label: "Caps & Hats" },
    { id: "memorabilia", label: "Signed Memorabilia" },
    { id: "limited", label: "Heritage Collection" }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-12 md:space-y-16 pb-32 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-[2rem] bg-[#080F22] border border-white/[0.08] p-6 sm:p-10 text-center shadow-2xl">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-600/15 blur-[110px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#013369]/25 blur-[110px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-[0.2em]">
            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
            Official Fan Merchandise, Tickets &amp; Collectibles
          </div>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-extrabold uppercase tracking-tight leading-[0.94] text-white">
            THE{" "}
            <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
              ARENA SHOP
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 max-w-xl mx-auto leading-relaxed">
            Shop authenticated signed memorabilia, Nike jerseys, collectible helmets, match tickets, and season hospitality passes across all 32 teams.
          </p>
        
          {/* Shop Navigation Selector */}
          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3 pt-3">
            {[
              { id: "merchandise", label: "Signed Vault" },
              { id: "jerseys", label: "Jerseys & Gear" },
              { id: "passes", label: "Season Passes" },
              { id: "tickets", label: "Match Tickets" },
              { id: "cards", label: "Fan Cards" }
            ].map((cat: any) => (
              <button 
                key={cat.id}
                onClick={() => setShopView(cat.id)}
                className={cn(
                  "px-4 sm:px-6 py-2.5 sm:py-3 min-h-[44px] rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border cursor-pointer",
                  shopView === cat.id 
                    ? "bg-[#2563EB] text-white border-blue-400/50 shadow-lg shadow-blue-600/25" 
                    : "bg-[#040711] text-zinc-300 border-white/[0.08] hover:border-white/25 hover:text-white"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="pt-1">
            <button 
              onClick={() => setShowInquiryStatus("SEARCH")}
              className="px-6 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all border bg-zinc-950/70 text-sky-400 border-blue-500/30 hover:bg-blue-600 hover:text-white cursor-pointer"
            >
              Track Existing Order / Inquiry
            </button>
          </div>
        </div>
      </div>

      {/* 0. DEDICATED SIGNED MERCHANDISE PLACE IN SHOP */}
      {shopView === "merchandise" && (
        <MerchandiseVaultSection
          onOpenPatriotsCheckout={(prod) => {
            const p = prod || {
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
            setSelectedPatriotsMerch(p);
          }}
          products={products}
          selectedTeamId={selectedShopTeam}
          onSelectTeam={(teamId) => setSelectedShopTeam(teamId)}
        />
      )}

      {/* 1. ELITE NFL MERCHANDISE SECTION */}
      {shopView === "jerseys" && (
        <section className="space-y-12">
          {/* Header & Filter Controls bar */}
          <div className="border-b border-white/5 pb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Elite NFL Gear Store</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-bold">Fanatics Live Merchandise Data Connection</p>
              </div>
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                {/* Team selection dropdown */}
                <select 
                  value={selectedShopTeam}
                  onChange={(e) => setSelectedShopTeam(e.target.value)}
                  className="bg-[#080d22] border border-indigo-500/25 rounded-xl px-4 py-2.5 min-h-[44px] text-xs text-white font-black uppercase tracking-widest focus:outline-none focus:border-blue-500"
                >
                  {NFL_TEAMS.map((t: Team) => (
                    <option key={t.id} value={t.id} className="bg-[#080d22]">{t.city} {t.name}</option>
                  ))}
                </select>
                <div className="relative flex-1 sm:flex-initial">
                  <input 
                    type="text" 
                    placeholder="Search apparel..." 
                    value={merchSearch}
                    onChange={(e) => setMerchSearch(e.target.value)}
                    className="bg-[#080d22] border border-indigo-500/25 rounded-xl pl-9 pr-4 py-2.5 min-h-[44px] text-xs text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-blue-500 w-full sm:w-48 sm:focus:w-56 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Category selection rail */}
            <div className="flex flex-wrap gap-2 pt-2 pb-1">
              {merchCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMerchCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 min-h-[40px] rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all shrink-0 cursor-pointer",
                    merchCategory === cat.id
                      ? "bg-[#2563EB] border-blue-400/50 text-white shadow-lg shadow-blue-600/20"
                      : "bg-[#080F22]/85 text-zinc-300 border-white/[0.08] hover:border-blue-400/40 hover:text-white select-none"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trending & Best Sellers Showcase */}
          {products.filter(p => p.trending).length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <h4 className="text-sm font-black uppercase tracking-widest text-white">Trending on Exchange This Week</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {products.filter(p => p.trending).map((p) => {
                  const saveAmt = Number((p.originalPrice - p.price).toFixed(2));
                  return (
                    <div 
                      key={`trend-${p.id}`} 
                      className="bg-[#080F22] p-5 rounded-2xl border border-white/[0.08] hover:border-blue-400/45 hover:-translate-y-0.5 transition-all group flex flex-col justify-between shadow-xl"
                    >
                      <div>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-white/5 mb-4 relative">
                          <NFLImage item={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95" />
                          <div className="absolute top-2.5 right-2.5 bg-[#2563EB] text-white text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md flex items-center gap-1 shadow">
                            <Star className="w-2.5 h-2.5 fill-white" /> BEST SELLER
                          </div>
                        </div>
                        <h5 className="text-sm font-bold text-white line-clamp-1 group-hover:text-sky-300 transition-colors uppercase">{p.name}</h5>
                        <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">{p.description}</p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-black text-white text-base">${p.price}</p>
                            {p.discount > 0 && (
                              <p className="text-[10px] font-bold text-rose-400 uppercase tracking-wider bg-rose-500/10 px-1.5 py-0.5 rounded">-{p.discount}%</p>
                            )}
                          </div>
                          {p.discount > 0 && (
                            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Save ${saveAmt}</p>
                          )}
                        </div>
                        <button 
                          onClick={() => {
                            const isPatriotsSigned = p.isPatriotsSignedMerch || p.id === "m-NE-signed-merchandise" || p.id === "m-NE-memorabilia" || (p.teamId === "NE" && p.category === "memorabilia") || (p.name && p.name.toLowerCase().includes("patriots") && p.name.toLowerCase().includes("signed"));
                            if (isPatriotsSigned) {
                              setSelectedPatriotsMerch(p);
                            } else {
                              setSelectedProduct(p);
                            }
                          }}
                          className="px-4 py-2.5 min-h-[40px] bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-[11px] rounded-xl tracking-wider uppercase transition-all cursor-pointer shrink-0"
                        >
                          View Gear
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Products Grid list */}
          {merchLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Accessing live NFL Gear inventory database...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-zinc-900/10">
              <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
              <p className="text-xs font-black uppercase text-white tracking-widest">No products matching the selected query</p>
              <button 
                onClick={() => { setMerchSearch(""); setMerchCategory("all"); }}
                className="mt-4 px-6 py-2 border border-white/10 rounded-xl text-[9px] font-black uppercase text-blue-500 tracking-widest hover:bg-white/5 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((item: any) => {
                const saveAmt = Number((item.originalPrice - item.price).toFixed(2));
                return (
                  <div key={item.id} className="bg-[#080c1c] border border-indigo-500/15 hover:border-indigo-400/45 hover:-translate-y-0.5 rounded-3xl p-5 flex flex-col justify-between group transition-all relative shadow-xl">
                    {item.discount > 0 && (
                      <div className="absolute top-4 left-4 z-10 bg-rose-500 text-black text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-lg font-mono">
                        -{item.discount}% SALE
                      </div>
                    )}
                    <div>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 mb-5 relative">
                        <NFLImage item={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase text-sky-400 tracking-wider bg-blue-500/15 border border-blue-400/20 px-2.5 py-0.5 rounded-md">{item.category}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 rounded-md">IN STOCK</span>
                        </div>
                        <h4 className="text-base font-black italic uppercase leading-tight line-clamp-1 text-white group-hover:text-sky-300 transition-colors">{item.name}</h4>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between gap-2">
                      <div>
                        {item.discount > 0 ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-rose-400 text-lg leading-none">${item.price}</span>
                            <span className="font-mono font-medium text-xs text-zinc-500 line-through">${item.originalPrice}</span>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-white text-lg leading-none">${item.price}</span>
                        )}
                        <p className="text-[10px] font-semibold text-zinc-400 mt-1.5 flex items-center gap-1">★ {item.rating} ({item.reviewsCount} reviews)</p>
                      </div>

                      <button 
                        onClick={() => {
                          const isPatriotsSigned = item.isPatriotsSignedMerch || item.id === "m-NE-signed-merchandise" || item.id === "m-NE-memorabilia" || (item.teamId === "NE" && item.category === "memorabilia") || (item.name && item.name.toLowerCase().includes("patriots") && item.name.toLowerCase().includes("signed"));
                          if (isPatriotsSigned) {
                            setSelectedPatriotsMerch(item);
                          } else {
                            setSelectedProduct(item);
                          }
                        }}
                        className="px-5 py-3 min-h-[44px] bg-[#2563EB] hover:bg-blue-500 rounded-xl text-[11px] text-white font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 cursor-pointer shrink-0"
                      >
                        Acquire Options
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* SEASON PASSES SECTION */}
      {shopView === "passes" && (
        <section className="space-y-12">
          {/* Header & Team Filter */}
          <div className="border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Ticket className="w-5 h-5 text-blue-500" />
                <span className="text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-600/10 px-3 py-1 rounded-md">Franchise Annual Membership</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-black italic uppercase tracking-tighter text-white">Official Franchise Season Passes</h3>
              <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Guaranteed Home Stadium Seating, VIP Tailgate Lounges & Playoff Rights
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select Team Franchise:</label>
              <select 
                value={selectedShopTeam}
                onChange={(e) => setSelectedShopTeam(e.target.value)}
                className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-black uppercase tracking-widest focus:outline-none focus:border-blue-500"
              >
                {NFL_TEAMS.map((t: Team) => (
                  <option key={t.id} value={t.id} className="bg-zinc-950">{t.city} {t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Season Pass Tier Showcase Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Tier 1: Lower Bowl Pass */}
            {(() => {
              const currentTeam = NFL_TEAMS.find((t: Team) => t.id === selectedShopTeam) || NFL_TEAMS[0];
              const isSeahawks = currentTeam.id === "SEA" || currentTeam.name.toLowerCase().includes("seahawks");
              const passData = [
                {
                  id: `pass-lower-${currentTeam.id}`,
                  name: `${currentTeam.city} ${currentTeam.name} Lower Bowl Season Pass`,
                  tier: "Lower Bowl Reserved",
                  price: 1850,
                  badge: "BEST VALUE",
                  badgeColor: "bg-blue-600",
                  image: isSeahawks
                    ? "/postimages/1417fbb0e328f1a5932e49913ac23af2sea.jpg"
                    : stadiumVipImg,
                  features: [
                    "Guaranteed Lower Bowl seating (Rows 1-20) for all 8 home games",
                    "All pre-season home game admissions included",
                    "15% in-stadium merchandise & concessions discount",
                    "Dedicated express stadium gate entry"
                  ]
                },
                {
                  id: `pass-vip-${currentTeam.id}`,
                  name: `${currentTeam.city} ${currentTeam.name} VIP Sideline & Tunnel Pass`,
                  tier: "VIP Sideline Executive",
                  price: 4800,
                  badge: "MOST POPULAR",
                  badgeColor: "bg-amber-500 text-black",
                  image: isSeahawks
                    ? "/postimages/146bf6266e6b98ad33cc56df4d0abeb3ssss.jpg"
                    : "/postimages/IMG-0463.jpg",
                  features: [
                    "Midfield Sideline Seating (Rows 1-10)",
                    "Pre-game on-field tunnel & sideline access",
                    "All-inclusive dining & drinks in Owners' Lounge",
                    "Complimentary VIP stadium valet parking & Playoff priority"
                  ]
                },
                {
                  id: `pass-club-${currentTeam.id}`,
                  name: `${currentTeam.city} ${currentTeam.name} Club Level Pass`,
                  tier: "Club Level Hospitality",
                  price: 2950,
                  badge: "EXECUTIVE CLASS",
                  badgeColor: "bg-[#013369] border border-blue-400/30",
                  image: isSeahawks
                    ? "/postimages/c94bbc7aac5de3ed9a567156e4dbffd8seahawks.jpg"
                    : stadiumVipImg,
                  features: [
                    "Climate-controlled Club Level access with leather recliners",
                    "Complimentary gourmet buffet & craft beverages",
                    "2 guest passes for selected regular season games",
                    "Exclusive autographed team keepsake"
                  ]
                },
                {
                  id: `pass-allaccess-${currentTeam.id}`,
                  name: `${currentTeam.city} ${currentTeam.name} All-Franchise Passport`,
                  tier: "All-Access Franchise",
                  price: 8500,
                  badge: "ULTIMATE PASS",
                  badgeColor: "bg-emerald-600",
                  image: isSeahawks
                    ? "https://res.cloudinary.com/dxq7dktn4/image/upload/v1784922234/videoframe_000_ylyaeo.png"
                    : stadiumVipImg,
                  features: [
                    "All Home Games + 5 Away Game Lower Bowl Tickets",
                    "Dedicated Concierge travel & hotel booking support",
                    "Private Suite Access for 2 selected games",
                    "Annual Franchise Shareholder Briefing Invitation"
                  ]
                }
              ];

              return passData.map((pass) => (
                <div 
                  key={pass.id} 
                  className="bg-[#080c1c] border border-indigo-500/20 hover:border-indigo-400/50 hover:-translate-y-0.5 rounded-[2rem] overflow-hidden flex flex-col justify-between group transition-all duration-300 shadow-2xl relative"
                >
                  <div>
                    <div className="aspect-[16/9] overflow-hidden relative border-b border-white/10">
                      <NFLImage item={pass} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#080c1c] via-[#080c1c]/30 to-transparent" />
                      <div className={`absolute top-4 right-4 ${pass.badgeColor} text-white font-bold text-[10px] uppercase tracking-wider px-3 py-1 rounded-full shadow-lg`}>
                        {pass.badge}
                      </div>
                      <div className="absolute bottom-4 left-6 right-6">
                        <span className="text-[10px] font-bold text-sky-300 uppercase tracking-wider bg-indigo-950/85 border border-indigo-400/30 px-3 py-1 rounded-lg backdrop-blur-md">
                          {pass.tier}
                        </span>
                        <h4 className="text-xl md:text-2xl font-black italic uppercase leading-tight text-white mt-2">{pass.name}</h4>
                      </div>
                    </div>

                    <div className="p-6 md:p-8 space-y-6">
                      <div className="space-y-3">
                        <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block">Season Membership Privileges</span>
                        <ul className="space-y-2.5">
                          {pass.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 font-medium leading-relaxed">
                              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 md:p-8 pt-5 border-t border-white/10 mt-2 flex items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider block">Annual Pass Rate</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="font-mono text-white text-2xl font-black">${pass.price.toLocaleString()}</span>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase">/ Season</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => handleOpenSeasonPassCheckout(pass)}
                      className="px-6 py-3.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-xs rounded-xl tracking-wider uppercase transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
                    >
                      <Ticket className="w-4 h-4" /> Acquire Pass
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
        </section>
      )}

      {/* 2. MATCH TICKETS SECTION (LIVETICKETMASTER INTEGRATION) */}
      {shopView === "tickets" && (
        <section className="space-y-12">
          {/* Header & Filter Controls Bar */}
          <div className="border-b border-white/5 pb-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white">Live Official Box Office</h3>
                <p className="text-xs text-zinc-500 uppercase tracking-widest mt-1 font-bold">Authenticated Ticketmaster API Gameday Exchange Connection</p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
                <select 
                  value={ticketSort}
                  onChange={(e: any) => setTicketSort(e.target.value)}
                  className="bg-[#080d22] border border-indigo-500/25 rounded-xl px-4 py-2.5 min-h-[44px] text-xs text-white font-bold uppercase tracking-wider focus:outline-none focus:border-blue-500"
                >
                  <option value="date">Sort By: Gameday Date</option>
                  <option value="cheapest">Sort By: Cheapest Seats First</option>
                </select>

                <div className="relative flex-1 sm:flex-initial">
                  <input 
                    type="text" 
                    placeholder="Filter by Team name..." 
                    value={ticketTeam}
                    onChange={(e) => setTicketTeam(e.target.value)}
                    className="bg-[#080d22] border border-indigo-500/25 rounded-xl pl-9 pr-4 py-2.5 min-h-[44px] text-xs text-white placeholder-zinc-400 font-bold focus:outline-none focus:border-blue-500 w-full sm:w-48"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center justify-between bg-zinc-900/15 p-4 rounded-2xl border border-white/5">
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="w-full sm:w-1/3">
                  <label className="block text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1.5">Stadium Search</label>
                  <input 
                    type="text"
                    placeholder="E.g. AT&T Stadium"
                    value={ticketStadium}
                    onChange={(e) => setTicketStadium(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3.5 py-2 text-xs text-white placeholder-zinc-600 font-bold focus:outline-none focus:border-blue-500/80"
                  />
                </div>
                <div className="w-full sm:w-2/3">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Maximum Price Target</label>
                    <span className="font-mono text-xs font-black text-white">${ticketMaxPrice}</span>
                  </div>
                  <input 
                    type="range"
                    min="50"
                    max="2000"
                    step="25"
                    value={ticketMaxPrice}
                    onChange={(e) => setTicketMaxPrice(parseInt(e.target.value))}
                    className="w-full accent-blue-600 focus:outline-none bg-zinc-950 h-2 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
              <button
                onClick={() => { setTicketTeam(""); setTicketStadium(""); setTicketMaxPrice(1500); }}
                className="text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white bg-zinc-950 px-4 py-2.5 rounded-xl border border-white/5"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Ticket Listings Grid */}
          {ticketsLoading ? (
            <div className="py-24 text-center">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Querying Ticketmaster API database servers...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {ticketError && (
                <div className="p-4 rounded-2xl bg-zinc-950/60 border border-blue-500/10 flex items-center gap-3 max-w-4xl mx-auto shadow-md animate-fade-in">
                  <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Box Office Backup Active</h4>
                    <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5 leading-normal">
                      Live Feed Offline ({ticketError}) — High-Fidelity local Ticket Exchange backup active.
                    </p>
                  </div>
                  <button 
                    onClick={() => { setTicketTeam(""); setTicketStadium(""); }} 
                    className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-white/10 rounded-lg text-[8px] font-black uppercase text-white tracking-widest transition-colors shrink-0"
                  >
                    Reset Search
                  </button>
                </div>
              )}

              {tickets.length === 0 ? (
                <div className="py-24 text-center border border-dashed border-white/5 rounded-3xl bg-zinc-900/10">
                  <AlertCircle className="w-10 h-10 text-zinc-600 mx-auto mb-4" />
                  <p className="text-xs font-black uppercase text-white tracking-widest">No match tickets matching your criteria are listed</p>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Try resetting price limits or searching for simpler terms</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tickets.map((game: any) => {
                const formattedDate = new Date(game.date).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric"
                });

                return (
                  <div key={game.id} className="bg-[#080c1c] border border-indigo-500/20 hover:border-indigo-400/50 hover:-translate-y-0.5 rounded-3xl overflow-hidden group transition-all flex flex-col justify-between shadow-xl">
                    <div>
                      <div className="aspect-[4/3] overflow-hidden relative border-b border-white/5">
                        <NFLImage item={game} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95" />
                        
                        <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white leading-none">
                            {game.competition || "BOX OFFICE OPEN"}
                          </span>
                        </div>

                        {game.status && (
                          <div className="absolute top-4 right-4 bg-emerald-600/90 backdrop-blur-md px-3 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">{game.status}</span>
                          </div>
                        )}

                        {game.isResale && !game.status && (
                          <div className="absolute top-4 right-4 bg-amber-600/90 backdrop-blur-md px-3 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">RESALE TICKETS</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5 font-mono flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-blue-400" />
                            {formattedDate} @ {game.time}
                          </div>
                          <h4 className="text-lg font-black uppercase leading-tight italic line-clamp-1 text-white">{game.name}</h4>
                        </div>

                        {/* Win Probability Bar if available */}
                        {game.winProbability && (
                          <div className="bg-zinc-950/70 p-3.5 rounded-2xl border border-white/5 space-y-2">
                            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                              <span className="text-zinc-400">{game.winProbability.awayTeam || "Away"}: <span className="text-white">{game.winProbability.away}</span></span>
                              <span className="text-[8px] text-zinc-500 font-bold">WIN PROBABILITY</span>
                              <span className="text-blue-400">{game.winProbability.homeTeam || "Home"}: <span className="text-white">{game.winProbability.home}</span></span>
                            </div>
                            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden flex">
                              <div 
                                style={{ width: game.winProbability.away }} 
                                className="h-full bg-zinc-400"
                                title={`Away: ${game.winProbability.away}`}
                              />
                              <div 
                                style={{ width: game.winProbability.home }} 
                                className="h-full bg-blue-500"
                                title={`Home: ${game.winProbability.home}`}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="space-y-2 text-[10px] bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Stadium</span>
                            <span className="text-zinc-300 font-black uppercase tracking-wide truncate max-w-[150px]">{game.stadium}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-red-400" /> Location
                            </span>
                            <span className="text-zinc-300 font-black uppercase tracking-wide">{game.location || `${game.stadium}, ${game.city}`}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Payment Rails</span>
                            <span className="text-emerald-400 font-black uppercase tracking-wider text-[9px] bg-emerald-600/10 px-2 py-0.5 rounded">
                              Stripe · Gift Card · Cash App · Bitcoin
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-white/5 mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="pt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block">Available Rates</span>
                          {game.seasonPassPrice && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded">
                              Season Pass: ${Number(game.seasonPassPrice).toLocaleString()}
                            </span>
                          )}
                          {game.sidelinePassPrice && (
                            <span className="text-[8px] font-black uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">
                              Sideline Pass: ${Number(game.sidelinePassPrice).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="font-mono text-white text-lg font-black">${Number(game.cheapestPrice).toLocaleString()}</span>
                          <span className="text-[9px] text-zinc-500 font-semibold lowercase">to</span>
                          <span className="font-mono text-zinc-400 text-xs font-bold">${Number(game.vipPrice).toLocaleString()} (VIP)</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button 
                          onClick={() => handleOpenGameTicketCheckout(game)}
                          className="flex-1 sm:flex-none px-5 py-3.5 min-h-[44px] bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-xs rounded-xl tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-600/20 cursor-pointer"
                        >
                          <Ticket className="w-4 h-4" /> Buy Ticket
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 3. ORIGINAL FAN CARDS MEMBERSHIP SECTION (LEAVE ALONE EXACTLY) */}
      {shopView === "cards" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-white/5 pb-6">
            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Membership Tiers</h3>
            <span className="w-fit text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-600/10 px-4 py-2 rounded-xl">Concierge Exclusive</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {SHOP_ITEMS.fanCards.map((item: any) => (
              <div key={item.id} className="relative group overflow-hidden rounded-3xl md:rounded-[2.5rem] bg-[#080c1c] border border-indigo-500/20 flex flex-col md:flex-row hover:border-indigo-400/50 transition-all shadow-xl">
                <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-white/5 relative">
                  <NFLImage item={item} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent md:bg-gradient-to-r" />
                </div>
                <div className="p-6 sm:p-8 md:p-10 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xl md:text-2xl font-black italic uppercase mb-2 leading-none text-white">{item.name}</h4>
                    <p className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase mb-6 tracking-wide leading-relaxed">{item.description}</p>
                  </div>
                  <div className="space-y-4">
                    <button 
                      onClick={() => setShowFanCardForm(true)}
                      className="w-full py-4 sm:py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all flex items-center justify-center gap-3"
                    >
                      <Mail className="w-4 h-4" /> Request Pricing
                    </button>
                    <button 
                      onClick={() => setShowInquiryStatus("SEARCH")}
                      className="w-full py-3 border border-white/5 text-zinc-500 font-black uppercase tracking-widest text-[8px] rounded-xl hover:bg-white/[0.02] transition-colors"
                    >
                      Track Existing Inquiry
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* MODAL: LIVE NFL MERCHANDISE ACQUISITION OPTIONS */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProduct(null)} />
          <div className="relative bg-zinc-950 border border-white/10 rounded-[2.5rem] max-w-md w-full overflow-hidden shadow-2xl p-6 sm:p-8 flex flex-col justify-between z-10 space-y-6">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-6 right-6 w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="w-full aspect-video rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 mb-4 relative">
                <NFLImage item={selectedProduct} className="w-full h-full object-cover" />
                {selectedProduct.discount > 0 && (
                  <div className="absolute bottom-3 left-3 bg-rose-500 text-black text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md">
                    -{selectedProduct.discount}% PROMO
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="text-[8px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-500 px-2.5 py-1 rounded">CATEGORIES: {selectedProduct.category}</span>
                  <span className="text-[8px] font-black tracking-widest uppercase bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded">AUTHENTIC LICENSED</span>
                </div>
                <h4 className="text-xl font-black italic uppercase leading-tight text-white pt-1">{selectedProduct.name}</h4>
                <p className="text-xs text-zinc-500 font-semibold leading-relaxed tracking-wide">{selectedProduct.description}</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-baseline">
                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Live Gameday Rate</span>
                <div className="flex gap-2 items-baseline">
                  {selectedProduct.discount > 0 && (
                    <span className="font-mono text-zinc-500 line-through text-stone-500 text-xs">${selectedProduct.originalPrice}</span>
                  )}
                  <span className="font-mono font-black text-rose-400 text-2xl">${selectedProduct.price}</span>
                </div>
              </div>

              <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 text-[10px] font-bold text-zinc-500 space-y-1.5 uppercase tracking-wide">
                <div className="flex justify-between">
                  <span>Shipping Lead</span>
                  <span className="text-white font-black font-mono">2-3 Gamedays Express</span>
                </div>
                <div className="flex justify-between">
                  <span>Merchant Location</span>
                  <span className="text-white font-black font-mono">Gridiron Arena Depot</span>
                </div>
              </div>

              {/* Direct VIP Team Vendor Checkout for Patriots Signed Merch */}
              {Boolean(
                selectedProduct.isPatriotsSignedMerch || 
                selectedProduct.id === "m-NE-signed-merchandise" ||
                selectedProduct.id === "m-NE-memorabilia" ||
                (selectedProduct.teamId === "NE" && selectedProduct.category === "memorabilia") ||
                (selectedProduct.name && selectedProduct.name.toLowerCase().includes("patriots") && selectedProduct.name.toLowerCase().includes("signed"))
              ) && (
                <div className="pt-2">
                  <button 
                    onClick={() => {
                      setSelectedPatriotsMerch(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 transition-all text-white font-black text-[10px] uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 border border-blue-400/30"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    DIRECT TEAM VENDOR ACQUISITION (ALL PAYMENT METHODS)
                  </button>
                  <p className="text-[9px] text-center text-emerald-400 font-bold uppercase tracking-wider mt-1.5">
                    Authorized Team Vendor • All Payment Systems Active • 5% Extra Savings
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* 1. External Store Redirect */}
                <a 
                  href={selectedProduct.purchaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-4 bg-white text-black hover:bg-zinc-200 transition-colors font-black text-[9px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-1.5"
                >
                  NFL SHOP <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {/* 2. Web App Local Simulated Portfolio Balance Checkout */}
                <button 
                  onClick={() => {
                    handleStorePurchase(selectedProduct, selectedProduct.category);
                    setSelectedProduct(null);
                  }}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-black text-[9px] uppercase tracking-widest rounded-2xl shadow-xl shadow-blue-600/10"
                >
                  USE BALANCES ($)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Team Signed Merchandise Checkout Modal */}
      <MerchandiseCheckoutModal
        product={selectedPatriotsMerch}
        isOpen={!!selectedPatriotsMerch}
        onClose={() => setSelectedPatriotsMerch(null)}
        initialPromoCode=""
      />

      {/* Box Office Ticket Purchase Modal with Official Payment Channels & Split Options */}
      <TicketCheckoutModal
        game={selectedTicketGame}
        isOpen={!!selectedTicketGame}
        onClose={() => {
          setSelectedTicketGame(null);
          setTicketPassName(undefined);
          setTicketInitialTier("general");
        }}
        initialTier={ticketInitialTier}
        passName={ticketPassName}
        initialPromoCode=""
      />
    </div>
  );
};

// --- Customer Care Admin Portal ---
const AdminPortal = ({ user }: { user: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [siteVisits, setSiteVisits] = useState<SiteVisitRecord[]>([]);
  const [charityRecords, setCharityRecords] = useState<any[]>([]);
  const [charityPeriodLabel, setCharityPeriodLabel] = useState(() => {
    const now = new Date();
    return now.toLocaleString("en-US", { month: "long", year: "numeric" });
  });
  const [charityAllocated, setCharityAllocated] = useState<string>("25");
  const [charityDisbursed, setCharityDisbursed] = useState<string>("25");
  const [charityStatus, setCharityStatus] = useState<"earmarked" | "scheduled" | "transferred" | "verified">("transferred");
  const [charityMethod, setCharityMethod] = useState("ACH Organizational Transfer");
  const [charityRef, setCharityRef] = useState("");
  const [charityNotes, setCharityNotes] = useState("");
  const [charityFeedback, setCharityFeedback] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"inquiries" | "orders" | "users" | "transactions" | "experiences" | "payments" | "visitors" | "charity">(() => {
    const saved = localStorage.getItem("admin_subtab");
    if (saved && ["inquiries", "orders", "users", "transactions", "experiences", "payments", "visitors", "charity"].includes(saved)) {
      return saved as any;
    }
    return "inquiries";
  });

  useEffect(() => {
    if (activeSubTab) {
      localStorage.setItem("admin_subtab", activeSubTab);
    }
  }, [activeSubTab]);
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [editingReplyIdx, setEditingReplyIdx] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const [inquiryCategoryFilter, setInquiryCategoryFilter] = useState<"all" | "podcast" | "player" | "pending" | "responded">("all");
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'inquiry' | 'ledger' | 'user' | 'order' } | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState<BookingAuditItem | null>(null);
  const [isOrderReviewOpen, setIsOrderReviewOpen] = useState(false);
  const [orderActionFeedback, setOrderActionFeedback] = useState<{ text: string, type: 'success' | 'error' | 'info' } | null>(null);

  const handleDeleteInquiry = async (id: string) => {
    try {
      setAdminLoading(true);
      await deleteDoc(doc(db, "fan_card_requests", id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error("Delete Inquiry Error:", err);
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteOrder = async (id: string) => {
    try {
      setAdminLoading(true);
      const target = orders.find(o => o.id === id);
      const sourceDocs: Array<{ col: string; docId: string }> = Array.isArray(target?._sourceDocs) ? target._sourceDocs : [];

      const deleteMap = new Map<string, { col: string; docId: string }>();
      for (const src of sourceDocs) {
        if (src?.col && src?.docId) {
          deleteMap.set(`${src.col}::${src.docId}`, src);
        }
      }

      const candidateIds = Array.from(new Set(
        [
          id,
          target?._docId,
          target?.orderId,
          target?.bookingId,
          String(id || "").replace(/^order-/i, ""),
          id && !/^order-/i.test(id) ? `order-${id}` : ""
        ]
          .map(v => String(v || "").trim())
          .filter(Boolean)
      ));

      for (const colName of ["store_orders", "bookings", "ticket_orders", "customer_inquiries"]) {
        for (const cid of candidateIds) {
          deleteMap.set(`${colName}::${cid}`, { col: colName, docId: cid });
        }
      }

      await Promise.all(
        Array.from(deleteMap.values()).map(({ col, docId }) =>
          deleteDoc(doc(db, col, docId))
        )
      );

      if (selectedOrderForReview?.id === id) {
        setSelectedOrderForReview(null);
        setIsOrderReviewOpen(false);
      }
      setOrders(prev => prev.filter(o => o.id !== id));
      const idStr = String(id || "ORDER");
      setOrderActionFeedback({ text: `Order #${idStr.slice(-6)} deleted successfully from database.`, type: 'info' });
      setTimeout(() => setOrderActionFeedback(null), 3500);
    } catch (err: any) {
      console.error("Delete Order Error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setOrderActionFeedback({ text: `Failed to delete order: ${msg}`, type: 'error' });
      setTimeout(() => setOrderActionFeedback(null), 5000);
      if (msg.includes("permission") || msg.includes("Missing or insufficient permissions")) {
        handleFirestoreError(err, OperationType.DELETE, "store_orders");
      }
    } finally {
      setAdminLoading(false);
    }
  };

  const handleApproveOrder = async (orderId: string, customCode?: string) => {
    try {
      setAdminLoading(true);
      const target = orders.find(o => o.id === orderId) || selectedOrderForReview || { id: orderId };
      const result = await syncApproveOrder({
        item: target,
        issuedCode: customCode,
        reviewedBy: user?.email || "Control Room Admin"
      });

      const orderIdStr = String(orderId || (target as any).id || "ORD");
      const updateFields = {
        status: "approved",
        isApproved: true,
        ticketCode: result.finalCode,
        qrCode: result.finalCode,
        approvedAt: result.approvedAt,
        rejectReason: "",
        rejectionReason: "",
        requiresReceiptReupload: false,
        orderStatus: "APPROVED · READY TO PROCEED"
      };

      // Optimistic local update for table and currently open modal
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateFields } : o));
      setSelectedOrderForReview(prev => prev && prev.id === orderId ? { ...prev, ...updateFields } : prev);

      setOrderActionFeedback({
        text: `Order #${orderIdStr.slice(-6)} Approved! Pass Code Issued: ${result.finalCode}`,
        type: 'success'
      });
      setTimeout(() => setOrderActionFeedback(null), 4000);
    } catch (err: any) {
      console.error("Approve Order Error:", err);
      setOrderActionFeedback({ text: `Failed to approve order: ${err.message}`, type: 'error' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleRejectOrder = async (orderId: string, reason: string) => {
    try {
      setAdminLoading(true);
      const target = orders.find(o => o.id === orderId) || selectedOrderForReview || { id: orderId };
      const result = await syncRejectOrder({
        item: target,
        reason,
        reviewedBy: user?.email || "Control Room Admin"
      });

      const orderIdStr = String(orderId || (target as any).id || "ORD");
      const updateFields = {
        status: "rejected",
        isApproved: false,
        requiresReceiptReupload: true,
        rejectReason: result.reason,
        rejectionReason: result.reason,
        orderStatus: "RECEIPT REJECTED · RE-UPLOAD REQUIRED"
      };

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateFields } : o));
      setSelectedOrderForReview(prev => prev && prev.id === orderId ? { ...prev, ...updateFields } : prev);

      setOrderActionFeedback({
        text: `Order #${orderIdStr.slice(-6)} marked rejected. Customer can upload a corrected receipt.`,
        type: 'info'
      });
      setTimeout(() => setOrderActionFeedback(null), 4000);
    } catch (err: any) {
      console.error("Reject Order Error:", err);
      setOrderActionFeedback({ text: `Failed to reject receipt: ${err.message}`, type: 'error' });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleOpenOrderReview = (item: any) => {
    const allReceipts = Array.from(new Set([
      ...(Array.isArray(item.receiptImages) ? item.receiptImages : []),
      ...(item.receiptImage ? [item.receiptImage] : []),
      ...(item.receiptImageUrl ? [item.receiptImageUrl] : []),
      ...(item.receiptUrl ? [item.receiptUrl] : [])
    ].filter((u): u is string => typeof u === "string" && u.trim().length > 0)));

    setSelectedOrderForReview({
      id: item.id,
      orderId: item.orderId || item.id,
      userId: item.userId,
      userEmail: item.userEmail || item.buyerEmail,
      userName: item.userName || item.senderName || item.buyerName,
      senderName: item.senderName || item.buyerName || item.userName,
      buyerName: item.buyerName || item.userName || item.senderName,
      buyerEmail: item.buyerEmail || item.userEmail,
      buyerPhone: item.buyerPhone || item.contactMethod,
      experienceId: item.experienceId || item.gameId,
      experienceTitle: item.experienceTitle || item.itemName || item.gameName || "NFL Official Experience / Match Pass",
      experienceType: item.experienceType,
      teamId: item.teamId,
      itemName: item.itemName || item.experienceTitle || item.gameName,
      gameName: item.gameName || item.experienceTitle || item.itemName,
      date: item.date,
      timeSlot: item.timeSlot || item.time,
      tier: item.tier || item.itemType || "Standard",
      guestsCount: item.guestsCount || item.quantity || 1,
      quantity: item.quantity || item.guestsCount || 1,
      totalPrice: item.totalPrice || item.price || item.totalAmount || 0,
      price: item.price || item.totalPrice || item.totalAmount || 0,
      totalAmount: item.totalAmount || item.totalPrice || item.price || 0,
      dueToday: item.dueToday,
      paymentMethod: item.paymentMethod || item.paymentChannel || "Direct Settlement",
      paymentRef: item.paymentRef || item.paymentReference || "N/A",
      paymentReference: item.paymentReference || item.paymentRef || "N/A",
      receiptImage: allReceipts[0] || "",
      receiptImageUrl: allReceipts[0] || "",
      receiptImages: allReceipts,
      status: item.status || "pending",
      qrCode: item.qrCode || item.ticketCode,
      ticketCode: item.ticketCode || item.qrCode,
      messagingPlatform: item.messagingPlatform,
      messagingDetails: item.messagingDetails,
      favoritePlayer: item.favoritePlayer,
      inquiryObjective: item.inquiryObjective,
      specialNotes: item.specialNotes,
      rejectReason: item.rejectReason || item.rejectionReason,
      rejectionReason: item.rejectionReason || item.rejectReason,
      notificationStatus: item.notificationStatus,
      notifiedAt: item.notifiedAt,
      notifiedChannel: item.notifiedChannel,
      _sourceDocs: item._sourceDocs,
      timestamp: item.timestamp
    });
    setIsOrderReviewOpen(true);
  };

  const handleEndSession = async (id: string) => {
    try {
      setAdminLoading(true);
      const target = requests.find(r => r.id === id) || (selectedInquiry?.id === id ? selectedInquiry : null);
      const existingReplies = target?.replies || [];
      const endNotice = {
        sender: 'Customer Care',
        text: '— Support Session Ended by Concierge Team —',
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      await updateDoc(doc(db, "fan_card_requests", id), {
        status: 'ended',
        endedAt: serverTimestamp(),
        endedBy: user?.email || "Control Room Admin",
        replies: [...existingReplies, endNotice]
      });
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev: any) => prev ? { ...prev, status: 'ended' } : null);
      }
      alert(`Customer Support Session ${id} marked as ENDED.`);
    } catch (err: any) {
      console.error("End Session Error:", err);
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleReopenSession = async (id: string) => {
    try {
      setAdminLoading(true);
      const target = requests.find(r => r.id === id) || (selectedInquiry?.id === id ? selectedInquiry : null);
      const existingReplies = target?.replies || [];
      const reopenNotice = {
        sender: 'Customer Care',
        text: '— Support Session Reopened by Concierge Team —',
        timestamp: new Date().toISOString(),
        isSystem: true
      };
      await updateDoc(doc(db, "fan_card_requests", id), {
        status: 'responded',
        reopenedAt: serverTimestamp(),
        reopenedBy: user?.email || "Control Room Admin",
        replies: [...existingReplies, reopenNotice]
      });
      if (selectedInquiry?.id === id) {
        setSelectedInquiry((prev: any) => prev ? { ...prev, status: 'responded' } : null);
      }
      alert(`Customer Support Session ${id} reopened.`);
    } catch (err: any) {
      console.error("Reopen Session Error:", err);
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteLedger = async (id: string) => {
    try {
      setAdminLoading(true);
      await deleteDoc(doc(db, "global_transactions", id));
    } catch (err: any) {
      console.error("Delete Ledger Error:", err);
      handleFirestoreError(err, OperationType.WRITE, "global_transactions");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      setAdminLoading(true);
      await deleteDoc(doc(db, "users", id));
    } catch (err: any) {
      console.error("Delete User Error:", err);
      handleFirestoreError(err, OperationType.WRITE, "users");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveCharityBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    const period = charityPeriodLabel.trim().slice(0, 80);
    const allocatedNum = Math.max(0, Math.min(1000000, Number(charityAllocated) || 0));
    const disbursedNum = Math.max(0, Math.min(1000000, Number(charityDisbursed) || 0));
    if (!period) {
      setCharityFeedback({ text: "Please enter a reporting period label.", type: "error" });
      return;
    }

    try {
      setAdminLoading(true);
      const now = Date.now();
      const recordId = `bgca-${now}`;
      const payload: Record<string, any> = {
        id: recordId,
        beneficiary: CHARITY_ALLOCATION.beneficiary,
        periodLabel: period,
        allocatedAmount: allocatedNum,
        disbursedAmount: disbursedNum,
        status: charityStatus,
        transferMethod: charityMethod.trim() || "ACH Organizational Transfer",
        transferReference: charityRef.trim() || `BGCA-${String(now).slice(-6)}`,
        notes: charityNotes.trim(),
        recordedBy: user?.email || "Control Room Admin",
        createdAt: now,
        updatedAt: now
      };
      if (charityStatus === "transferred" || charityStatus === "verified") {
        payload.transferredAt = now;
      }

      await setDoc(doc(db, "charity_records", recordId), payload);
      setCharityRef("");
      setCharityNotes("");
      setCharityFeedback({ text: `Charitable record "${period}" saved to public ledger.`, type: "success" });
      setTimeout(() => setCharityFeedback(null), 4000);
    } catch (err: any) {
      console.error("Save Charity Record Error:", err);
      setCharityFeedback({ text: err?.message || "Failed to save charitable record.", type: "error" });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleMarkCharityStatus = async (rec: any, nextStatus: "earmarked" | "scheduled" | "transferred" | "verified") => {
    try {
      setAdminLoading(true);
      const now = Date.now();
      const updatedPayload: Record<string, any> = {
        id: rec.id,
        beneficiary: rec.beneficiary || CHARITY_ALLOCATION.beneficiary,
        periodLabel: rec.periodLabel || "Monthly Period",
        allocatedAmount: typeof rec.allocatedAmount === "number" ? rec.allocatedAmount : 0,
        disbursedAmount: typeof rec.disbursedAmount === "number" ? rec.disbursedAmount : (nextStatus === "transferred" || nextStatus === "verified" ? (rec.allocatedAmount || 0) : 0),
        status: nextStatus,
        transferMethod: rec.transferMethod || "ACH Organizational Transfer",
        transferReference: rec.transferReference || "",
        notes: rec.notes || "",
        recordedBy: user?.email || rec.recordedBy || "Control Room Admin",
        createdAt: typeof rec.createdAt === "number" ? rec.createdAt : now,
        updatedAt: now
      };
      if (nextStatus === "transferred" || nextStatus === "verified") {
        updatedPayload.transferredAt = typeof rec.transferredAt === "number" ? rec.transferredAt : now;
      }
      await setDoc(doc(db, "charity_records", rec.id), updatedPayload);
      setCharityFeedback({ text: `Record ${rec.periodLabel} updated to ${nextStatus.toUpperCase()}.`, type: "info" });
      setTimeout(() => setCharityFeedback(null), 3500);
    } catch (err: any) {
      console.error("Update Charity Record Error:", err);
      setCharityFeedback({ text: err?.message || "Failed to update record.", type: "error" });
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteCharityBatch = async (id: string) => {
    try {
      setAdminLoading(true);
      await deleteDoc(doc(db, "charity_records", id));
      setCharityFeedback({ text: "Charitable ledger record deleted.", type: "info" });
      setTimeout(() => setCharityFeedback(null), 3000);
    } catch (err: any) {
      console.error("Delete Charity Record Error:", err);
      setCharityFeedback({ text: err?.message || "Failed to delete record.", type: "error" });
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    setPermError(null);
    const unsubInquiries = onSnapshot(query(collection(db, "fan_card_requests"), orderBy("timestamp", "desc")), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setRequests(docs);
    }, (err) => {
      console.error("Inquiries Listen Error:", err);
      if (err.message.includes("permission")) setPermError("Permission Denied: Ensure your email is alexwtchmn@gmail.com and rules are deployed.");
    });

    // Multi-collection order sync: store_orders, ticket_orders, bookings + payment_sessions receipt enrichment
    let storeOrdersMap = new Map<string, any>();
    let ticketOrdersMap = new Map<string, any>();
    let bookingsMap = new Map<string, any>();
    let paymentSessionsMap = new Map<string, any>();

    const collectReceiptsFromObj = (obj: any): string[] => {
      if (!obj) return [];
      const urls: string[] = [];
      if (Array.isArray(obj.receiptImages)) {
        for (const u of obj.receiptImages) {
          if (typeof u === "string" && u.trim()) urls.push(u.trim());
        }
      }
      for (const single of [obj.receiptImage, obj.receiptImageUrl, obj.receiptUrl]) {
        if (typeof single === "string" && single.trim()) urls.push(single.trim());
      }
      return urls;
    };

    const updateMergedOrders = () => {
      const mergedMap = new Map<string, any>();
      const addEntry = (col: "store_orders" | "ticket_orders" | "bookings", docId: string, v: any) => {
        const rawKey = String(v.orderId || v.bookingId || v.id || docId).trim();
        const groupKey = rawKey.replace(/^order-(?=ORD-)/i, "").toUpperCase();
        const existing = mergedMap.get(groupKey);
        const existingDocs: Array<{ col: string; docId: string }> = existing?._sourceDocs || [];
        const hasDoc = existingDocs.some(d => d.col === col && d.docId === docId);
        const nextDocs = hasDoc ? existingDocs : [...existingDocs, { col, docId }];
        const primaryId = existing?.id || docId;

        const mergedReceipts = Array.from(new Set([
          ...collectReceiptsFromObj(existing),
          ...collectReceiptsFromObj(v)
        ]));
        const primaryReceipt = mergedReceipts[0] || "";

        mergedMap.set(groupKey, {
          ...existing,
          ...v,
          id: primaryId,
          _docId: primaryId,
          _sourceDocs: nextDocs,
          receiptImage: primaryReceipt,
          receiptImageUrl: primaryReceipt,
          receiptImages: mergedReceipts,
          paymentSessionId: v.paymentSessionId || v.sessionId || existing?.paymentSessionId || existing?.sessionId || "",
          paymentRef: v.paymentRef || v.paymentReference || existing?.paymentRef || existing?.paymentReference || "",
          buyerName: v.buyerName || v.senderName || v.userName || v.customerName || existing?.buyerName || existing?.senderName || existing?.userName || "",
          buyerEmail: v.buyerEmail || v.userEmail || v.email || existing?.buyerEmail || existing?.userEmail || "",
          messagingPlatform: v.messagingPlatform || existing?.messagingPlatform || "",
          messagingDetails: v.messagingDetails || existing?.messagingDetails || "",
          favoritePlayer: v.favoritePlayer || existing?.favoritePlayer || "",
          inquiryObjective: v.inquiryObjective || existing?.inquiryObjective || "",
          specialNotes: v.specialNotes || existing?.specialNotes || "",
          experienceType: v.experienceType || existing?.experienceType || "",
          teamId: v.teamId || existing?.teamId || "",
          rejectReason: v.rejectReason ?? existing?.rejectReason ?? "",
          rejectionReason: v.rejectionReason ?? existing?.rejectionReason ?? "",
          notificationStatus: v.notificationStatus || existing?.notificationStatus || "",
          notifiedAt: v.notifiedAt || existing?.notifiedAt || "",
          notifiedChannel: v.notifiedChannel || existing?.notifiedChannel || ""
        });
      };

      storeOrdersMap.forEach((v, k) => addEntry("store_orders", k, v));
      ticketOrdersMap.forEach((v, k) => addEntry("ticket_orders", k, v));
      bookingsMap.forEach((v, k) => addEntry("bookings", k, v));

      // Enrich merged orders with any receipts stored on linked payment_sessions
      mergedMap.forEach((order, key) => {
        const refCandidates = [
          order.paymentSessionId,
          order.sessionId,
          order.paymentRef,
          order.paymentReference,
          order.orderId,
          order.id
        ]
          .filter(Boolean)
          .map((s: any) => String(s).trim());

        const matchedSessions: any[] = [];
        paymentSessionsMap.forEach((sess, sessId) => {
          const isMatch = refCandidates.some((c) => c === sessId || (c.startsWith("INQ-") && c === `INQ-${sessId}`) || (sess.orderId && c === sess.orderId));
          if (isMatch) matchedSessions.push(sess);
        });

        if (matchedSessions.length > 0) {
          const extraReceipts = matchedSessions.flatMap((s) => collectReceiptsFromObj(s));
          if (extraReceipts.length > 0) {
            const combined = Array.from(new Set([...(order.receiptImages || []), ...extraReceipts]));
            mergedMap.set(key, {
              ...order,
              receiptImages: combined,
              receiptImage: combined[0] || "",
              receiptImageUrl: combined[0] || ""
            });
          }
        }
      });
      
      const list = Array.from(mergedMap.values()).sort((a, b) => {
        const timeA = new Date(a.createdAt || a.timestamp?.toDate?.() || a.timestamp || 0).getTime();
        const timeB = new Date(b.createdAt || b.timestamp?.toDate?.() || b.timestamp || 0).getTime();
        return timeB - timeA;
      });
      setOrders(list);
    };

    const unsubStoreOrders = onSnapshot(query(collection(db, "store_orders"), orderBy("timestamp", "desc")), (snap) => {
      storeOrdersMap.clear();
      snap.forEach(d => storeOrdersMap.set(d.id, { ...d.data(), id: d.id, _docId: d.id }));
      updateMergedOrders();
    }, (err) => {
      console.error("Store Orders Listen Error:", err);
    });

    const unsubTicketOrders = onSnapshot(collection(db, "ticket_orders"), (snap) => {
      ticketOrdersMap.clear();
      snap.forEach(d => ticketOrdersMap.set(d.id, { ...d.data(), id: d.id, _docId: d.id }));
      updateMergedOrders();
    }, (err) => {
      console.error("Ticket Orders Listen Error:", err);
    });

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      bookingsMap.clear();
      snap.forEach(d => bookingsMap.set(d.id, { ...d.data(), id: d.id, _docId: d.id }));
      updateMergedOrders();
    }, (err) => {
      console.error("Bookings Listen Error:", err);
    });

    const unsubPaymentSessions = onSnapshot(collection(db, "payment_sessions"), (snap) => {
      paymentSessionsMap.clear();
      snap.forEach(d => paymentSessionsMap.set(d.id, { ...d.data(), id: d.id }));
      updateMergedOrders();
    }, (err) => {
      console.warn("Payment Sessions Listen Error:", err);
    });

    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("balance", "desc")), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setUsers(docs);
    }, (err) => {
      console.error("Users Listen Error:", err);
      if (err.message.includes("permission")) setPermError("Permission Denied: Treasury database restricted.");
    });

    const unsubTransactions = onSnapshot(query(collection(db, "global_transactions"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setTransactions(docs);
    }, (err) => {
      console.error("Transactions Listen Error:", err);
    });

    const unsubVisitors = subscribeToSiteVisits((visitsList) => {
      setSiteVisits(visitsList);
    }, (err) => {
      console.warn("Site Visits Listen Error:", err);
    });

    const unsubCharity = onSnapshot(query(collection(db, "charity_records"), orderBy("createdAt", "desc")), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      setCharityRecords(list);
    }, (err) => {
      console.warn("Charity Records Listen Error:", err);
    });

    return () => {
      unsubInquiries();
      unsubStoreOrders();
      unsubTicketOrders();
      unsubBookings();
      unsubPaymentSessions();
      unsubUsers();
      unsubTransactions();
      unsubVisitors();
      unsubCharity();
    };
  }, [user]);

  // Keep selectedInquiry in real-time sync with database requests list
  useEffect(() => {
    if (selectedInquiry) {
      const updated = requests.find(r => r.id === selectedInquiry.id);
      if (updated) {
        setSelectedInquiry(updated);
      }
    }
  }, [requests, selectedInquiry?.id]);

  const filteredTransactions = transactions.filter(t => 
    (t.userId || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInquiries = requests.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (r.teamId || "").toLowerCase().includes(term) || 
      (r.userEmail || "").toLowerCase().includes(term) ||
      (r.userName || "").toLowerCase().includes(term) ||
      (r.targetPlayer || "").toLowerCase().includes(term) ||
      (r.id || "").toLowerCase().includes(term) ||
      (r.podcastDetails?.showName || "").toLowerCase().includes(term) ||
      (r.message || "").toLowerCase().includes(term);

    if (!matchesSearch) return false;

    if (inquiryCategoryFilter === "podcast") {
      return r.category === "podcast" || !!r.podcastDetails || (r.message || "").toLowerCase().includes("podcast") || (r.targetPlayer || "").toLowerCase().includes("nix");
    }
    if (inquiryCategoryFilter === "player") {
      return r.category === "player_experience" || !!r.targetPlayer || r.category === "podcast";
    }
    if (inquiryCategoryFilter === "pending") {
      return r.status === "pending" || !r.status;
    }
    if (inquiryCategoryFilter === "responded") {
      return r.status === "responded";
    }
    return true;
  });

  const filteredOrders = orders.filter(o => 
    (o.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.experienceTitle || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.gameName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.buyerEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.buyerName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.userName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.ticketCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.qrCode || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.paymentMethod || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.paymentRef || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (o.status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateTransactionStatus = async (tx: any, newStatus: string) => {
    try {
      setAdminLoading(true);
      const txId = tx.id;
      const userId = tx.userId;

      // Update global transaction log safely using setDoc with merge
      await setDoc(doc(db, "global_transactions", txId), { 
        status: newStatus,
        reviewedAt: serverTimestamp(),
        reviewedBy: user?.email || "alexwtchmn@gmail.com"
      }, { merge: true });

      // Update user specific sub-collection log and balance if not a guest
      if (userId && userId !== "guest") {
        try {
          await setDoc(doc(db, "users", userId, "transactions", txId), { 
            status: newStatus,
            reviewedAt: serverTimestamp() 
          }, { merge: true });
        } catch (subErr) {
          console.warn("Subcollection transaction sync notice:", subErr);
        }

        // If this is a pending deposit and Admin approves it, credit the user's available balance!
        if (tx.type === "deposit" && newStatus === "Confirmed" && tx.status !== "Confirmed") {
          const userDocRef = doc(db, "users", userId);
          const userSnap = await getDoc(userDocRef);
          const currentBalance = userSnap.exists() ? (userSnap.data().balance || 0) : 0;
          const depositAmt = parseFloat(tx.amount) || 0;
          await setDoc(userDocRef, {
            balance: currentBalance + depositAmt,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        // If this is a pending withdrawal and Admin rejects it, refund the deducted amount back to user's balance
        if (tx.type === "withdraw" && newStatus === "Rejected" && tx.status === "pending") {
          const userDocRef = doc(db, "users", userId);
          const userSnap = await getDoc(userDocRef);
          const currentBalance = userSnap.exists() ? (userSnap.data().balance || 0) : 0;
          const withdrawAmt = parseFloat(tx.amount) || 0;
          await setDoc(userDocRef, {
            balance: currentBalance + withdrawAmt,
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      }

      alert(`Transaction #${txId ? txId.slice(-6).toUpperCase() : 'ENTRY'} marked as ${newStatus}${userId && userId !== 'guest' && tx.type === 'deposit' && newStatus === 'Confirmed' ? ` — Credited ${formatCurrency(tx.amount)} to user account!` : ''}`);
    } catch (err: any) {
      console.error("Update Transaction Status Error:", err);
      alert("Failed to update transaction status: " + (err.message || String(err)));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleReply = async () => {
    if (!selectedInquiry || !replyText.trim()) return;
    try {
      const newReply = {
        sender: 'Customer Care',
        text: replyText,
        timestamp: new Date().toISOString()
      };
      
      const updatedReplies = [...(selectedInquiry.replies || []), newReply];
      
      await updateDoc(doc(db, "fan_card_requests", selectedInquiry.id), {
        replies: updatedReplies,
        status: 'responded'
      });
      
      setReplyText("");
      setSelectedInquiry(null);
      alert("Reply sent to user's ticket.");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEditedReply = async (idx: number) => {
    if (!selectedInquiry || !editReplyText.trim()) return;
    try {
      setAdminLoading(true);
      const updatedReplies = [...(selectedInquiry.replies || [])];
      if (updatedReplies[idx]) {
        updatedReplies[idx] = {
          ...updatedReplies[idx],
          text: editReplyText.trim(),
          editedAt: new Date().toISOString(),
          isEdited: true,
          editedBy: user?.email || "Customer Care Representative"
        };
        await updateDoc(doc(db, "fan_card_requests", selectedInquiry.id), {
          replies: updatedReplies,
          lastUpdated: serverTimestamp()
        });
        setSelectedInquiry((prev: any) => prev ? { ...prev, replies: updatedReplies } : null);
        setEditingReplyIdx(null);
        setEditReplyText("");
      }
    } catch (err: any) {
      console.error("Error editing reply:", err);
      alert("Failed to edit reply: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdminLoading(false);
    }
  };

  const handleDeleteReply = async (idx: number) => {
    if (!selectedInquiry) return;
    if (!window.confirm("Are you sure you want to delete this reply from the support thread?")) return;
    try {
      setAdminLoading(true);
      const updatedReplies = [...(selectedInquiry.replies || [])];
      updatedReplies.splice(idx, 1);
      
      await updateDoc(doc(db, "fan_card_requests", selectedInquiry.id), {
        replies: updatedReplies,
        lastUpdated: serverTimestamp()
      });
      setSelectedInquiry((prev: any) => prev ? { ...prev, replies: updatedReplies } : null);
    } catch (err: any) {
      console.error("Error deleting reply:", err);
      alert("Failed to delete reply: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdminLoading(false);
    }
  };

  const adjustBalance = async (userId: string, amount: number) => {
    if (!userId || userId === "guest") return;
    const userToUpdate = users.find(u => u.uid === userId || u.id === userId);
    if (!userToUpdate) return;
    
    setAdminLoading(true);
    try {
      const newBalance = (userToUpdate.balance || 0) + amount;
      await setDoc(doc(db, "users", userId), {
        balance: Math.max(0, newBalance),
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error(err);
      alert("Failed to adjust balance: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="p-10 space-y-12 pb-40 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">Command Center</h2>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">Customer Care Oversight & Request Management</p>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 sm:pb-0">
          <div className="relative mr-4">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
            <input 
              type="text" 
              placeholder="Search data..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-950 border border-white/5 pl-12 pr-6 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all w-64"
            />
          </div>
          <button 
            onClick={() => { setActiveSubTab("inquiries"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "inquiries" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            Inquiries ({requests.length})
          </button>
          <button 
            onClick={() => { setActiveSubTab("orders"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "orders" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            Store Orders ({orders.length})
          </button>
          <button 
            onClick={() => { setActiveSubTab("users"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "users" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            User Treasury ({users.length})
          </button>
          <button 
            onClick={() => { setActiveSubTab("transactions"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "transactions" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            Ledger ({transactions.length})
          </button>
          <button 
            onClick={() => { setActiveSubTab("experiences"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "experiences" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            Experiences
          </button>
          <button 
            onClick={() => { setActiveSubTab("payments"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", activeSubTab === "payments" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/20" : "bg-zinc-900 text-zinc-500 hover:text-white")}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            Live Payment Dispatcher
          </button>
          <button 
            onClick={() => { setActiveSubTab("visitors"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", activeSubTab === "visitors" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-zinc-900 text-zinc-500 hover:text-white")}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-400" />
            Visitors ({siteVisits.filter(v => !v.isAdmin).length})
          </button>
          <button 
            onClick={() => { setActiveSubTab("charity"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2", activeSubTab === "charity" ? "bg-[#013369] text-white border border-blue-400/40 shadow-lg shadow-blue-900/30" : "bg-zinc-900 text-zinc-500 hover:text-white")}
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Charity Ledger ({charityRecords.length})
          </button>
        </div>
      </div>

      {permError && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-xs font-black uppercase tracking-widest text-rose-400">{permError}</p>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        {activeSubTab === "charity" ? (
          (() => {
            const invitationOrders = orders.filter((o: any) =>
              o.experienceType === "player_inquiry" ||
              String(o.experienceTitle || "").toLowerCase().includes("meet & greet") ||
              String(o.experienceTitle || "").toLowerCase().includes("invitation") ||
              Number(o.totalPrice || o.price || 0) === 100
            );
            const verifiedInvitationCount = invitationOrders.filter((o: any) =>
              o.status === "approved" || o.isApproved || o.status === "confirmed" || o.paymentMethod === "Stripe Card Checkout"
            ).length;
            const autoEarmarkedTotal = verifiedInvitationCount * CHARITY_ALLOCATION.charitableContributionUsd;
            const ledgerAllocatedTotal = charityRecords.reduce((sum, r) => sum + (Number(r.allocatedAmount) || 0), 0);
            const ledgerDisbursedTotal = charityRecords.reduce(
              (sum, r) => sum + (r.status === "transferred" || r.status === "verified" ? (Number(r.disbursedAmount ?? r.allocatedAmount) || 0) : 0),
              0
            );

            return (
              <div className="p-6 sm:p-8 space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/5 pb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-sky-400">
                      Charitable Contributions &amp; Transfers · {CHARITY_ALLOCATION.beneficiary}
                    </p>
                    <h3 className="text-2xl font-bold text-white mt-1">
                      Contribution Earmarks &amp; Disbursement Audit Ledger
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                      Track ${CHARITY_ALLOCATION.charitableContributionUsd}.00 per verified $100 Meet &amp; Greet Invitation (${CHARITY_ALLOCATION.coordinationFeeUsd}.00 coordination fee / ${CHARITY_ALLOCATION.charitableContributionUsd}.00 BGCA allocation) and publish verified monthly transfers to the public ledger.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-2xl bg-[#03050C] border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Verified $100 Invitations</p>
                    <p className="text-2xl font-mono font-bold text-white mt-1">{verifiedInvitationCount}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{invitationOrders.length} total invitation orders</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#03050C] border border-[#013369]/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-sky-400">Auto-Earmarked ($25/ea)</p>
                    <p className="text-2xl font-mono font-bold text-sky-400 mt-1">{formatCurrency(autoEarmarkedTotal)}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Calculated from verified bookings</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#03050C] border border-white/10">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Logged Batch Allocations</p>
                    <p className="text-2xl font-mono font-bold text-white mt-1">{formatCurrency(ledgerAllocatedTotal)}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">{charityRecords.length} ledger batches</p>
                  </div>
                  <div className="p-5 rounded-2xl bg-[#03050C] border border-emerald-500/25">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Transferred / Verified</p>
                    <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{formatCurrency(ledgerDisbursedTotal)}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">Direct to BGCA beneficiary</p>
                  </div>
                </div>

                {charityFeedback && (
                  <div className={cn(
                    "px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2 border",
                    charityFeedback.type === "success" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                    charityFeedback.type === "error" ? "bg-rose-500/15 text-rose-300 border-rose-500/30" :
                    "bg-blue-500/15 text-blue-300 border-blue-500/30"
                  )}>
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{charityFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleSaveCharityBatch} className="p-6 rounded-2xl bg-[#050816] border border-white/10 space-y-4">
                  <h4 className="text-sm font-bold text-white">Record Monthly Contribution Batch / Transfer</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Reporting Period</label>
                      <input
                        type="text"
                        value={charityPeriodLabel}
                        onChange={(e) => setCharityPeriodLabel(e.target.value)}
                        placeholder="e.g. November 2026"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Earmarked Amount (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={charityAllocated}
                        onChange={(e) => setCharityAllocated(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Disbursed Amount (USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={charityDisbursed}
                        onChange={(e) => setCharityDisbursed(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Status</label>
                      <select
                        value={charityStatus}
                        onChange={(e) => setCharityStatus(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="earmarked">Earmarked</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="transferred">Transferred</option>
                        <option value="verified">Verified Receipt</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Transfer Method</label>
                      <input
                        type="text"
                        value={charityMethod}
                        onChange={(e) => setCharityMethod(e.target.value)}
                        placeholder="ACH Organizational Transfer"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Transfer Reference ID</label>
                      <input
                        type="text"
                        value={charityRef}
                        onChange={(e) => setCharityRef(e.target.value)}
                        placeholder="e.g. ACH-BGCA-2026-11"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">Audit Notes</label>
                      <input
                        type="text"
                        value={charityNotes}
                        onChange={(e) => setCharityNotes(e.target.value)}
                        placeholder="Consolidated monthly youth mentorship grant"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#03050C] border border-white/10 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={adminLoading}
                      className="px-6 py-3 min-h-[44px] rounded-xl bg-[#013369] hover:bg-blue-700 text-white border border-blue-400/35 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                    >
                      Publish Record to Ledger
                    </button>
                  </div>
                </form>

                <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#03050C]">
                  {charityRecords.length === 0 ? (
                    <div className="p-10 text-center text-xs text-zinc-400">
                      No published transfer records yet. Use the form above to record the first Boys &amp; Girls Clubs of America allocation batch.
                    </div>
                  ) : (
                    <table className="w-full text-left min-w-[700px]">
                      <thead className="bg-zinc-950 border-b border-white/5">
                        <tr>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Period</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Beneficiary &amp; Method</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Allocated / Disbursed</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Ref</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {charityRecords.map((rec: any) => (
                          <tr key={rec.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="p-4">
                              <p className="text-xs font-bold text-white">{rec.periodLabel}</p>
                              <p className="text-[10px] font-mono text-zinc-500">
                                {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString() : ""}
                              </p>
                            </td>
                            <td className="p-4">
                              <p className="text-xs font-semibold text-white">{rec.beneficiary}</p>
                              <p className="text-[11px] text-zinc-400">{rec.transferMethod || "ACH Organizational Transfer"}</p>
                            </td>
                            <td className="p-4 font-mono text-xs">
                              <span className="text-sky-400 font-bold">{formatCurrency(rec.allocatedAmount || 0)}</span>
                              <span className="text-zinc-500"> / </span>
                              <span className="text-emerald-400 font-bold">{formatCurrency(rec.disbursedAmount ?? 0)}</span>
                            </td>
                            <td className="p-4 text-[11px] font-mono text-zinc-300">
                              {rec.transferReference || "Pending"}
                            </td>
                            <td className="p-4">
                              <span className={cn(
                                "inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border",
                                rec.status === "verified" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" :
                                rec.status === "transferred" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" :
                                rec.status === "scheduled" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" :
                                "bg-zinc-800 text-zinc-300 border-white/10"
                              )}>
                                {rec.status}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                {rec.status !== "verified" && (
                                  <button
                                    type="button"
                                    onClick={() => handleMarkCharityStatus(rec, rec.status === "transferred" ? "verified" : "transferred")}
                                    disabled={adminLoading}
                                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    {rec.status === "transferred" ? "Verify" : "Mark Transferred"}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCharityBatch(rec.id)}
                                  disabled={adminLoading}
                                  className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                                  title="Delete Charity Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            );
          })()
        ) : activeSubTab === "visitors" ? (
          <VisitorAnalyticsPanel visits={siteVisits} searchTerm={searchTerm} />
        ) : activeSubTab === "payments" ? (
          <div className="p-6 sm:p-8">
            <ControlRoomPaymentDispatcher />
          </div>
        ) : activeSubTab === "experiences" ? (
          <ExperienceAdmin />
        ) : activeSubTab === "transactions" ? (
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Timestamp</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Investor Account</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Type</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Value</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Channel & Sender Ref</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Status & Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 text-[10px] font-mono text-zinc-400">
                    {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'Processing'}
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-black uppercase italic text-white">{t.userName || 'Investor'}</p>
                    <p className="text-[10px] font-mono text-zinc-400">{t.userEmail || t.userId}</p>
                    <p className="text-[8px] font-mono text-zinc-600">ID: {t.id}</p>
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest inline-flex items-center gap-1",
                      t.type === 'withdraw' ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    )}>
                      {t.type === 'withdraw' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      {t.type || 'deposit'}
                    </span>
                  </td>
                  <td className="p-6 font-mono text-xs font-black">
                    <span className={t.type === 'withdraw' ? 'text-rose-400' : 'text-emerald-400'}>
                      {t.type === 'withdraw' ? '-' : '+'}{formatCurrency(t.amount || 0)}
                    </span>
                  </td>
                  <td className="p-6 max-w-[220px]">
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{t.method || 'Standard Wire'}</p>
                    <p className="text-[9px] font-mono text-zinc-400 truncate" title={t.reference || t.destinationAddress || 'N/A'}>
                      Ref: {t.reference || t.destinationAddress || 'N/A'}
                    </p>
                    {t.notes && <p className="text-[8px] text-zinc-500 italic truncate" title={t.notes}>Note: {t.notes}</p>}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end items-center gap-2 flex-wrap">
                      {t.status === 'pending' ? (
                        <>
                          <button 
                            onClick={() => updateTransactionStatus(t, 'Confirmed')}
                            disabled={adminLoading}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[9px] uppercase rounded-lg transition-all shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
                            title={t.type === 'deposit' ? 'Approve deposit & credit user balance' : 'Approve withdrawal'}
                          >
                            <Check className="w-3 h-3" />
                            {t.type === 'deposit' ? 'Approve & Credit' : 'Confirm'}
                          </button>
                          <button 
                            onClick={() => updateTransactionStatus(t, 'Rejected')}
                            disabled={adminLoading}
                            className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white font-black text-[9px] uppercase rounded-lg transition-all border border-rose-500/20 active:scale-95 disabled:opacity-50"
                            title={t.type === 'deposit' ? 'Reject deposit request' : 'Reject & refund withdrawal'}
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        </>
                      ) : (
                        <span className={cn(
                          "text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border",
                          t.status === 'Confirmed' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : 
                          t.status === 'Rejected' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-zinc-800 text-zinc-500 border-white/5"
                        )}>
                          {t.status || 'Processed'}
                        </span>
                      )}

                      {confirmDelete?.id === t.id && confirmDelete.type === 'ledger' ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                          <button
                            onClick={() => {
                              handleDeleteLedger(t.id);
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[8px] font-black uppercase rounded hover:bg-rose-500 transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase rounded hover:bg-zinc-700 transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDelete({ id: t.id, type: 'ledger' })}
                          disabled={adminLoading}
                          className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50 ml-1"
                          title="Delete Ledger Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeSubTab === "users" ? (
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">User / Account</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Balance</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Adjust Liquidity</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u: any) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase italic">{u.displayName || 'Anonymous Investor'}</p>
                        <p className="text-[10px] font-mono text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-right font-mono text-xs font-black text-emerald-400">
                    {formatCurrency(u.balance || 0)}
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => adjustBalance(u.uid, -1000)}
                        disabled={adminLoading}
                        className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                        title="Reduce $1,000"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => adjustBalance(u.uid, 1000)}
                        disabled={adminLoading}
                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                        title="Increase $1,000"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => {
                          const amt = prompt("Enter amount to set as balance:");
                          if (amt !== null) {
                            const val = parseFloat(amt);
                            if (!isNaN(val)) adjustBalance(u.uid, val - (u.balance || 0));
                          }
                        }}
                        disabled={adminLoading}
                        className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                        title="Set Custom Balance"
                      >
                        <RefreshCw className="w-3 h-3" />
                      </button>
                      {confirmDelete?.id === u.id && confirmDelete.type === 'user' ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                          <button
                            onClick={() => {
                              handleDeleteUser(u.id);
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[8px] font-black uppercase rounded hover:bg-rose-500 transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase rounded hover:bg-zinc-700 transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setConfirmDelete({ id: u.id, type: 'user' })}
                          disabled={adminLoading}
                          className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                          title="Delete User Account / Treasury Data"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeSubTab === "orders" ? (
          <div>
            {/* Orders Header Stats Strip */}
            <div className="p-6 bg-zinc-950/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-wrap">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 block">Total Orders</span>
                  <span className="text-xl font-mono font-black text-white">{orders.length}</span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Pending Audit
                  </span>
                  <span className="text-xl font-mono font-black text-amber-300">
                    {orders.filter(o => o.status !== 'rejected' && (o.status === 'pending' || o.status === 'pending_approval' || !o.isApproved)).length}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Approved &amp; Issued
                  </span>
                  <span className="text-xl font-mono font-black text-emerald-400">
                    {orders.filter(o => o.status === 'approved' || o.isApproved || o.status === 'confirmed').length}
                  </span>
                </div>
                <div className="h-8 w-px bg-white/10" />
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 block flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Rejected
                  </span>
                  <span className="text-xl font-mono font-black text-rose-400">
                    {orders.filter(o => o.status === 'rejected').length}
                  </span>
                </div>
              </div>

              {orderActionFeedback && (
                <div className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 animate-fade-in",
                  orderActionFeedback.type === 'success' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" :
                  orderActionFeedback.type === 'error' ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" :
                  "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                )}>
                  <CheckCircle2 className="w-4 h-4" />
                  {orderActionFeedback.text}
                </div>
              )}
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-16 text-center text-zinc-500 space-y-2">
                <Ticket className="w-12 h-12 mx-auto text-zinc-600 stroke-[1.5]" />
                <p className="text-sm font-black uppercase tracking-wider text-zinc-400">No Store Orders Found</p>
                <p className="text-xs text-zinc-600">Customer ticket orders, passes, and merchandise purchases will appear here in real-time.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-zinc-950 border-b border-white/5">
                    <tr>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Date & Order ID</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Item & Tier</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Purchaser Account</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Amount & Plan</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Payment Proof & Ref</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Audit Status</th>
                      <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Box Office Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((item: any, idx: number) => {
                      const isApproved = item.status === 'approved' || item.isApproved || item.status === 'confirmed';
                      const isPending = !isApproved && item.status !== 'rejected';
                      const formattedDate = item.createdAt 
                        ? new Date(item.createdAt).toLocaleString() 
                        : (item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Recent');
                      const title = item.experienceTitle || item.itemName || item.gameName || 'NFL Experience Pass';
                      const amount = item.totalPrice || item.price || item.totalAmount || 0;
                      const receiptList: string[] = Array.from(new Set([
                        ...(Array.isArray(item.receiptImages) ? item.receiptImages : []),
                        ...(item.receiptImage ? [item.receiptImage] : []),
                        ...(item.receiptImageUrl ? [item.receiptImageUrl] : []),
                        ...(item.receiptUrl ? [item.receiptUrl] : [])
                      ].filter((u): u is string => typeof u === 'string' && u.trim().length > 0)));
                      const receiptUrl = receiptList[0] || '';
                      const ticketCode = item.ticketCode || item.qrCode;

                      return (
                        <tr 
                          key={`${item.id || item.orderId || idx}-${idx}`} 
                          className={cn(
                            "border-b border-white/5 hover:bg-white/[0.02] transition-colors",
                            isPending && "bg-amber-500/[0.02]"
                          )}
                        >
                          <td className="p-6">
                            <p className="text-[10px] font-mono text-zinc-400">{formattedDate}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-xs font-mono font-black text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-white/5">
                                #{String(item.id || item.orderId || "ITEM").slice(-8).toUpperCase()}
                              </span>
                            </div>
                          </td>

                          <td className="p-6 max-w-xs">
                            <p className="text-xs font-black uppercase italic text-white line-clamp-1">{title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {item.tier && (
                                <span className="text-[9px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                                  {String(item.tier).toUpperCase().replace('_', ' ')}
                                </span>
                              )}
                              {(item.guestsCount || item.quantity) && (
                                <span className="text-[9px] font-mono text-zinc-400">
                                  Qty: {item.guestsCount || item.quantity}x
                                </span>
                              )}
                              {ticketCode && (
                                <span className="text-[8px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  PASS: {ticketCode}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-6">
                            <p className="text-xs font-black text-white">{item.buyerName || item.userName || item.senderName || 'Valued Fan'}</p>
                            <p className="text-[10px] font-mono text-zinc-400">{item.buyerEmail || item.userEmail || 'GUEST'}</p>
                            {item.buyerPhone && (
                              <p className="text-[9px] font-mono text-zinc-500">{item.buyerPhone}</p>
                            )}
                            {item.messagingPlatform && (
                              <p className="text-[9px] font-mono text-indigo-300 mt-0.5">
                                {item.messagingPlatform}: {item.messagingDetails || "Handle provided"}
                              </p>
                            )}
                          </td>

                          <td className="p-6">
                            <span className="text-sm font-mono font-black text-emerald-400 block">
                              ${Number(amount).toLocaleString()}
                            </span>
                            {item.dueToday && item.dueToday !== amount && (
                              <span className="text-[9px] font-mono text-cyan-400 block">
                                Due Today: ${Number(item.dueToday).toLocaleString()}
                              </span>
                            )}
                            {item.splitMode && item.splitMode !== 'full' && (
                              <span className="text-[8px] font-black uppercase text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded block w-fit mt-0.5">
                                Plan: {item.splitMode}
                              </span>
                            )}
                          </td>

                          <td className="p-6">
                            <div className="space-y-1.5">
                              <span className="text-[10px] font-black uppercase text-zinc-300 block">
                                {item.paymentMethod || item.paymentChannel || 'Direct Settlement'}
                              </span>
                              <p className="text-[9px] font-mono text-zinc-500 truncate max-w-[140px]" title={item.paymentRef || item.paymentReference || 'N/A'}>
                                Ref: {item.paymentRef || item.paymentReference || 'Direct'}
                              </p>
                              {receiptUrl ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenOrderReview(item)}
                                  className="group flex items-center gap-2 p-1.5 bg-zinc-950 hover:bg-zinc-800 border border-emerald-500/30 rounded-xl transition-all cursor-pointer text-left"
                                  title="Click to inspect attached receipt image"
                                >
                                  <div className="relative shrink-0">
                                    <img
                                      src={receiptUrl}
                                      alt="Attached Receipt"
                                      className="w-10 h-10 object-cover rounded-lg border border-white/10 group-hover:scale-105 transition-transform"
                                    />
                                    {receiptList.length > 1 && (
                                      <span className="absolute -top-1 -right-1 bg-blue-600 text-[7px] font-mono font-black text-white px-1 rounded-full border border-zinc-950">
                                        +{receiptList.length}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[9px]">
                                    <span className="font-black uppercase text-emerald-400 flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> View Receipt
                                    </span>
                                    <span className="font-mono text-zinc-400 block">
                                      {receiptList.length > 1 ? `${receiptList.length} Images` : "Proof Attached"}
                                    </span>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-[8px] font-mono text-zinc-600 block">
                                  No image uploaded
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-6">
                            <div className="flex flex-col items-start gap-1">
                              <span className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase rounded-lg inline-flex items-center gap-1.5",
                                isApproved ? "bg-emerald-600/10 text-emerald-400 border border-emerald-500/20" :
                                isPending ? "bg-amber-600/10 text-amber-400 border border-amber-500/20 animate-pulse" :
                                "bg-rose-600/10 text-rose-400 border border-rose-500/20"
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  isApproved ? "bg-emerald-400" : isPending ? "bg-amber-400" : "bg-rose-400"
                                )} />
                                {isApproved ? "Approved / Pass Issued" : isPending ? "Awaiting Verification" : "Rejected"}
                              </span>
                              {item.leftSiteForApplePurchase && !isApproved && (
                                <span className="text-[8px] font-black uppercase text-amber-300 bg-amber-500/15 border border-amber-400/35 px-2 py-0.5 rounded-full">
                                  Left Site for Apple Card ({item.applePartnerName || "Partner"})
                                </span>
                              )}
                              {item.notificationStatus === "sent" && (
                                <span className="text-[8px] font-black uppercase text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                  Notified ✓ {item.notifiedChannel ? `(${item.notifiedChannel})` : ""}
                                </span>
                              )}
                              {item.status === "rejected" && (item.rejectReason || item.rejectionReason) && (
                                <span className="text-[9px] text-rose-300 max-w-[190px] truncate" title={item.rejectReason || item.rejectionReason}>
                                  {item.rejectReason || item.rejectionReason}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              {/* Audit Receipt Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenOrderReview(item)}
                                disabled={adminLoading}
                                className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-sm"
                                title="Audit Payment Receipt, Issue Official Pass, or Print Invoice"
                              >
                                <ShieldCheck className="w-3 h-3" />
                                <span>Audit & Approve</span>
                              </button>

                              {/* Quick Issue Pass Code */}
                              {!isApproved && (
                                <button
                                  type="button"
                                  onClick={() => handleApproveOrder(item.id)}
                                  disabled={adminLoading}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[9px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                  title="Approve transaction and issue ticket barcode immediately"
                                >
                                  <Ticket className="w-3 h-3" />
                                  <span>Issue Pass</span>
                                </button>
                              )}

                              {/* Receipt / Invoice Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenOrderReview(item)}
                                disabled={adminLoading}
                                className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg transition-all"
                                title="View & Print Official Receipt of Payment"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Order with Inline Confirmation */}
                              {confirmDelete?.id === item.id && confirmDelete.type === 'order' ? (
                                <div className="flex items-center gap-1 justify-end bg-rose-500/10 p-1 rounded-lg border border-rose-500/20">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteOrder(item.id);
                                      setConfirmDelete(null);
                                    }}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[8px] font-black uppercase rounded transition-all"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDelete(null)}
                                    className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase rounded hover:bg-zinc-700 transition-all"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDelete({ id: item.id, type: 'order' })}
                                  disabled={adminLoading}
                                  className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                                  title="Delete Order Entry Permanently"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div>
            {/* Quick Filters for Inquiries & Podcast Reservations */}
            <div className="p-4 bg-zinc-950/80 border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mr-1">Concierge Filter:</span>
                {[
                  { id: "all", label: `All Inquiries (${requests.length})` },
                  { id: "podcast", label: `🎙️ Podcast & Bo Nix (${requests.filter(r => r.category === 'podcast' || r.podcastDetails || (r.message || "").toLowerCase().includes("podcast") || (r.targetPlayer || "").toLowerCase().includes("nix")).length})` },
                  { id: "player", label: `🏈 Player Inquiries (${requests.filter(r => r.category === 'player_experience' || !!r.targetPlayer).length})` },
                  { id: "pending", label: `Awaiting Reply (${requests.filter(r => r.status === 'pending' || !r.status).length})` },
                  { id: "responded", label: `Responded (${requests.filter(r => r.status === 'responded').length})` }
                ].map(flt => (
                  <button
                    key={flt.id}
                    type="button"
                    onClick={() => setInquiryCategoryFilter(flt.id as any)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border cursor-pointer",
                      inquiryCategoryFilter === flt.id 
                        ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20" 
                        : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                    )}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>

            <table className="w-full text-left">
              <thead className="bg-zinc-950 border-b border-white/5">
                <tr>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Date</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Entity / Talent</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Contact Handle</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Message / Detail</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Status</th>
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.map((item: any) => (
                  <tr 
                    key={item.id} 
                    className={cn(
                      "border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer",
                      selectedInquiry?.id === item.id && "bg-white/[0.05]"
                    )}
                    onClick={() => setSelectedInquiry(item)}
                  >
                    <td className="p-6 text-[10px] font-mono text-zinc-400">
                      {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Recent'}
                    </td>
                    <td className="p-6">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <p className="text-xs font-black uppercase italic">{item.userName || item.teamId || item.itemName}</p>
                        {(item.category === 'podcast' || item.podcastDetails || (item.message || "").toLowerCase().includes("podcast") || (item.targetPlayer || "").toLowerCase().includes("bo nix")) && (
                          <span className="px-2 py-0.5 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-[8px] font-black uppercase rounded-md tracking-wider flex items-center gap-1">
                            <Radio className="w-2.5 h-2.5 text-purple-400 animate-pulse" />
                            Podcast: {item.targetPlayer || "Bo Nix"}
                          </span>
                        )}
                        {item.category !== 'podcast' && !item.podcastDetails && item.targetPlayer && (
                          <span className="px-2 py-0.5 bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[8px] font-black uppercase rounded-md tracking-wider flex items-center gap-1">
                            Player: {item.targetPlayer}
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-600 uppercase">
                        {item.userEmail || (item.userId === 'guest' ? 'GUEST' : 'USER')}
                      </p>
                      <p className="text-[8px] font-mono text-zinc-500">{item.id}</p>
                    </td>
                  <td className="p-6 text-xs font-bold text-blue-400 underline decoration-blue-400/30">
                    {item.contactMethod || (item.userId !== 'guest' ? 'Registered Account' : 'Unknown')}
                  </td>
                  <td className="p-6 text-xs text-zinc-500 max-w-xs truncate">
                    {item.message || `Inquiry / Request: ${item.id}`}
                  </td>
                  <td className="p-6 text-right">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase rounded-lg inline-flex items-center gap-1.5",
                      item.status === 'ended' ? "bg-zinc-800 text-zinc-400 border border-zinc-700/50" :
                      item.status === 'responded' ? "bg-emerald-600/10 text-emerald-500 border border-emerald-500/20" : 
                      item.status === 'pending' ? "bg-blue-600/10 text-blue-400 border border-blue-500/20" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {item.status === 'ended' && <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />}
                      {item.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />}
                      {item.status === 'responded' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                      {item.status === 'ended' ? 'Ended' : item.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === 'ended' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReopenSession(item.id);
                          }}
                          disabled={adminLoading}
                          className="px-2.5 py-1.5 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                          title="Reopen Customer Support Session"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span className="hidden sm:inline">Reopen</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEndSession(item.id);
                          }}
                          disabled={adminLoading}
                          className="px-2.5 py-1.5 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/20 text-amber-400 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                          title="End Customer Support Session"
                        >
                          <PowerOff className="w-3 h-3" />
                          <span className="hidden sm:inline">End Session</span>
                        </button>
                      )}

                      {confirmDelete?.id === item.id && confirmDelete.type === 'inquiry' ? (
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteInquiry(item.id);
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 bg-rose-600 text-white text-[8px] font-black uppercase rounded hover:bg-rose-500 transition-all"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(null);
                            }}
                            className="px-2 py-1 bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase rounded hover:bg-zinc-700 transition-all"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmDelete({ id: item.id, type: 'inquiry' });
                          }}
                          disabled={adminLoading}
                          className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
                          title="Delete Inquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reply Section */}
      {selectedInquiry && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-zinc-900 border border-blue-600/30 rounded-[2.5rem] p-10 space-y-8"
        >
          <div className="flex justify-between items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h4 className="text-2xl font-black italic uppercase tracking-tighter">
                  Active Conversation: {selectedInquiry.id}
                </h4>
                <span className={cn(
                  "px-3 py-1 text-[9px] font-black uppercase rounded-lg border",
                  selectedInquiry.status === 'ended' ? "bg-zinc-800 text-zinc-400 border-zinc-700" :
                  selectedInquiry.status === 'responded' ? "bg-emerald-600/10 text-emerald-400 border-emerald-500/20" :
                  "bg-blue-600/10 text-blue-400 border-blue-500/20"
                )}>
                  {selectedInquiry.status === 'ended' ? 'Session Concluded / Ended' : selectedInquiry.status || 'Active Session'}
                </span>
                {(selectedInquiry.category === 'podcast' || selectedInquiry.podcastDetails || (selectedInquiry.targetPlayer || "").toLowerCase().includes("bo nix")) && (
                  <span className="px-3 py-1 text-[9px] font-black uppercase rounded-lg bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center gap-1.5">
                    <Radio className="w-3 h-3 text-purple-400 animate-pulse" />
                    Podcast Session: {selectedInquiry.targetPlayer || "Bo Nix"}
                  </span>
                )}
              </div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">User Email: {selectedInquiry.userEmail || "GUEST"} · Replying live as Customer Care representative...</p>
            </div>
            
            <div className="flex items-center gap-3">
              {selectedInquiry.status === 'ended' ? (
                <button
                  onClick={() => handleReopenSession(selectedInquiry.id)}
                  disabled={adminLoading}
                  className="px-3.5 py-2 bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 text-emerald-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reopen Session
                </button>
              ) : (
                <button
                  onClick={() => handleEndSession(selectedInquiry.id)}
                  disabled={adminLoading}
                  className="px-3.5 py-2 bg-amber-600/10 hover:bg-amber-600 border border-amber-500/20 text-amber-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Click to End Session so user can submit new inquiries or conclude support"
                >
                  <PowerOff className="w-3.5 h-3.5" /> End Session
                </button>
              )}

              {confirmDelete?.id === selectedInquiry.id && confirmDelete.type === 'inquiry' ? (
                <div className="flex items-center gap-2 bg-rose-500/10 p-2 rounded-xl border border-rose-500/20">
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest animate-pulse">Are you sure?</span>
                  <button
                    onClick={() => {
                      handleDeleteInquiry(selectedInquiry.id);
                      setConfirmDelete(null);
                    }}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                  >
                    Yes, Delete
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete({ id: selectedInquiry.id, type: 'inquiry' })}
                  disabled={adminLoading}
                  className="px-3 py-2 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-500 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                  title="Delete Inquiry Permanently"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              )}

              <button onClick={() => setSelectedInquiry(null)} className="text-zinc-500 hover:text-white p-2 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Specialized Player Podcast & Media Session Card */}
          {(selectedInquiry.category === 'podcast' || selectedInquiry.podcastDetails || (selectedInquiry.targetPlayer || "").toLowerCase().includes("bo nix") || selectedInquiry.targetPlayer) && (
            <div className="bg-gradient-to-r from-purple-950/60 via-indigo-950/40 to-blue-950/60 border border-purple-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                    <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-purple-300 block">
                      Player Podcast & Media Reservation Session
                    </span>
                    <h5 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                      {selectedInquiry.targetPlayer || "Bo Nix"}
                      <span className="text-[8px] font-black uppercase bg-purple-500 text-black px-2 py-0.5 rounded font-mono">
                        VERIFIED NFL TALENT
                      </span>
                    </h5>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-400 block">
                    Session Ref: {selectedInquiry.id}
                  </span>
                  <span className="text-[8px] font-black uppercase text-purple-400 font-mono">
                    Direct Concierge Queue
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Podcast Show / Channel</p>
                  <p className="text-xs font-black text-white truncate mt-0.5">
                    {selectedInquiry.podcastDetails?.showName || selectedInquiry.itemName || "Show Name Not Provided"}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Recording Format</p>
                  <p className="text-xs font-black text-purple-300 truncate mt-0.5">
                    {selectedInquiry.podcastDetails?.format || "Virtual Stream / Studio"}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Proposed Window</p>
                  <p className="text-xs font-black text-white truncate mt-0.5">
                    {selectedInquiry.podcastDetails?.recordingWindow || "Flexible Window"}
                  </p>
                </div>
                <div className="bg-black/50 p-3.5 rounded-xl border border-white/5">
                  <p className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Proposed Honorarium</p>
                  <p className="text-xs font-black text-emerald-400 truncate mt-0.5">
                    {selectedInquiry.podcastDetails?.budget ? `$${selectedInquiry.podcastDetails.budget}` : "To Negotiate / Quote"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 pt-1">
                <span>Client Contact: <strong className="text-white">{selectedInquiry.contactMethod || selectedInquiry.userEmail}</strong></span>
                <span>Category: <strong className="text-purple-300 uppercase">{selectedInquiry.category || 'Podcast'}</strong></span>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Original Inquiry Message</p>
              <p className="text-sm font-medium text-white leading-relaxed">{selectedInquiry.message}</p>
            </div>
            {selectedInquiry.replies?.map((r: any, idx: number) => {
              const isCc = r.sender === 'Customer Care' || (r.sender && r.sender.toLowerCase().includes('care')) || (r.sender && r.sender.toLowerCase().includes('concierge'));
              const isEditing = editingReplyIdx === idx;
              return (
                <div key={idx} className={cn(
                  "p-6 rounded-2xl border ml-4 sm:ml-8 relative group transition-all",
                  isCc ? "bg-blue-600/5 border-blue-600/20" : "bg-zinc-900/40 border-white/5"
                )}>
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <p className={cn(
                        "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                        isCc ? "text-blue-400" : "text-zinc-400"
                      )}>
                        {r.sender || "Customer Care"}
                      </p>
                      {r.isEdited && (
                        <span className="px-2 py-0.5 bg-zinc-800 border border-white/10 text-[8px] text-zinc-400 font-bold uppercase rounded-md flex items-center gap-1" title={r.editedAt ? `Edited: ${new Date(r.editedAt).toLocaleString()}` : "Edited"}>
                          <Edit2 className="w-2 h-2 text-blue-400" /> edited
                        </span>
                      )}
                      {r.timestamp && (
                        <span className="text-[8px] font-mono text-zinc-500">
                          {new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {isCc && !isEditing && (
                      <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingReplyIdx(idx);
                            setEditReplyText(r.text || "");
                          }}
                          className="text-[9px] font-black uppercase tracking-wider text-blue-300 hover:text-white flex items-center gap-1 bg-blue-950/60 hover:bg-blue-600 border border-blue-500/30 px-3 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                          title="Edit this Customer Care response"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit Reply
                        </button>
                        <button
                          onClick={() => handleDeleteReply(idx)}
                          className="text-[9px] font-black uppercase tracking-wider text-rose-400 hover:text-white flex items-center gap-1 bg-rose-950/40 hover:bg-rose-600 border border-rose-500/30 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-sm"
                          title="Delete this reply"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3 mt-2 bg-zinc-950 p-4 rounded-xl border border-blue-500/30 shadow-inner">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase text-blue-400 tracking-wider">
                        <span>Editing Customer Care Response</span>
                        <span className="text-zinc-500 font-normal">Press Save to update for the fan in real-time</span>
                      </div>
                      <textarea
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        rows={3}
                        placeholder="Edit your Customer Care response here..."
                        className="w-full bg-zinc-900 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium text-white resize-y"
                        autoFocus
                      />
                      <div className="flex gap-2 justify-end items-center">
                        <button
                          onClick={() => {
                            setEditingReplyIdx(null);
                            setEditReplyText("");
                          }}
                          disabled={adminLoading}
                          className="px-3 py-1.5 bg-zinc-900 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors border border-white/5 cursor-pointer disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditedReply(idx)}
                          disabled={adminLoading || !editReplyText.trim()}
                          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
                        >
                          <Check className="w-3 h-3" /> Save Changes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-zinc-200 whitespace-pre-line leading-relaxed">{r.text}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Quick-Reply Customer Care Templates */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                Customer Care Quick Response Templates (1-Click to Insert)
              </p>
              <span className="text-[8px] text-zinc-500 font-mono uppercase">Replying as Customer Care</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setReplyText(`Hello! Thank you for inquiring with Customer Care about reserving a podcast session with ${selectedInquiry.targetPlayer || "Bo Nix"}. The player is currently accepting select media appearances and studio recordings during scheduled bye weeks and team media days. We would love to coordinate with your show producer. Please confirm your planned interview duration (e.g. 45-60 min), proposed recording dates, and whether your recording will be conducted via remote studio link (Riverside.fm) or in Denver.`)}
                className="text-[9px] font-black uppercase tracking-wider px-3.5 py-2 bg-purple-950/70 hover:bg-purple-900 border border-purple-500/40 hover:border-purple-300 text-purple-300 rounded-xl transition-all cursor-pointer text-left shadow-sm flex items-center gap-1.5"
              >
                <Radio className="w-3 h-3 text-purple-400" />
                🎙️ {selectedInquiry.targetPlayer || "Bo Nix"} Podcast Availability
              </button>

              <button
                type="button"
                onClick={() => setReplyText(`Thank you for reaching out to NFL Concierge Customer Care regarding ${selectedInquiry.targetPlayer || "Bo Nix"}. We have logged your show details with the player's media coordination team. Before confirming the studio recording window, please provide your production tech rider and topic outline for pre-production clearance.`)}
                className="text-[9px] font-black uppercase tracking-wider px-3.5 py-2 bg-indigo-950/70 hover:bg-indigo-900 border border-indigo-500/40 hover:border-indigo-300 text-indigo-300 rounded-xl transition-all cursor-pointer text-left shadow-sm flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-indigo-400" />
                📋 Tech Rider & Studio Clearance
              </button>

              <button
                type="button"
                onClick={() => setReplyText(`Thank you for contacting NFL Concierge Customer Care. We are currently checking active training schedules and appearance availability for ${selectedInquiry.targetPlayer || "the requested player"}. Our talent liaison will update your ticket thread with confirmed scheduling windows and appearance credentials.`)}
                className="text-[9px] font-black uppercase tracking-wider px-3.5 py-2 bg-blue-950/70 hover:bg-blue-900 border border-blue-500/40 hover:border-blue-300 text-blue-300 rounded-xl transition-all cursor-pointer text-left shadow-sm flex items-center gap-1.5"
              >
                <Star className="w-3 h-3 text-blue-400" />
                🏈 Player Schedule & Concierge Check
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Active Session: <strong className="text-white">Customer Care Terminal</strong>
              </span>
              <span className="font-mono text-zinc-500">Replies sync to customer in real-time</span>
            </div>
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your official Customer Care response here. This will be visible to the customer under their Reference ID..."
              rows={4}
              className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-6 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium text-white resize-y"
            />
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="text-[10px] font-bold text-zinc-500">
                Author: <strong className="text-zinc-300">Customer Care ({user?.email || "Control Room"})</strong>
              </span>
              <button 
                onClick={handleReply}
                disabled={!replyText.trim() || adminLoading}
                className="px-10 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all flex items-center gap-2.5 shadow-xl shadow-blue-600/25 disabled:opacity-50 cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" /> Dispatch Reply as Customer Care
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Box Office Receipt Review & Pass Issuance Modal */}
      {isOrderReviewOpen && selectedOrderForReview && (
        <ReceiptReviewModal
          isOpen={isOrderReviewOpen}
          onClose={() => {
            setIsOrderReviewOpen(false);
            setSelectedOrderForReview(null);
          }}
          booking={selectedOrderForReview}
          onApprove={(orderId, issuedCode) => handleApproveOrder(orderId, issuedCode)}
          onReject={(orderId, reason) => handleRejectOrder(orderId, reason)}
          onStatusUpdated={() => {
            // Real-time Firestore snapshot listeners automatically sync state
          }}
        />
      )}
    </div>
  );
};

export default function App() {
  useEffect(() => {
    document.title = "NFL Gridiron Experience | VIP Meet & Greets & Fan Hospitality";
  }, []);

  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [historicalData, setHistoricalData] = useState<Record<string, any[]>>({});
  const [selectedTeam, setSelectedTeam] = useState<Team>(() => {
    const saved = localStorage.getItem("selected_team_id");
    if (saved) {
      const found = NFL_TEAMS.find(t => t.id === saved);
      if (found) return found;
    }
    return NFL_TEAMS.find(t => t.id === "MIN") || NFL_TEAMS[0];
  });

  useEffect(() => {
    if (selectedTeam?.id) {
      localStorage.setItem("selected_team_id", selectedTeam.id);
    }
  }, [selectedTeam]);

  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalTabId | null>(null);
  const [showFanCardForm, setShowFanCardForm] = useState(false);
  const [selectedInquiryCategory, setSelectedInquiryCategory] = useState("general");
  const [selectedInquiryPlayer, setSelectedInquiryPlayer] = useState("Bo Nix");
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [podcastShowInput, setPodcastShowInput] = useState("");
  const [podcastFormatInput, setPodcastFormatInput] = useState("Virtual Studio Stream (Riverside.fm / Zoom 4K)");
  const [podcastWindowInput, setPodcastWindowInput] = useState("Next 2-4 Weeks (Flexible Schedule)");
  const [podcastBudgetInput, setPodcastBudgetInput] = useState("");
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [ongoingSessionAlert, setOngoingSessionAlert] = useState<any | null>(null);
  const [checkingOngoingSession, setCheckingOngoingSession] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [detectedOngoingSession, setDetectedOngoingSession] = useState<any | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  const [activeTicket, setActiveTicket] = useState<string | null>(localStorage.getItem("active_ticket_id"));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"markets" | "draft" | "portfolio" | "shop" | "admin" | "experiences" | "care" | "stocks" | "ceedee">(() => {
    const saved = localStorage.getItem("active_tab");
    if (saved && ["markets", "draft", "portfolio", "shop", "admin", "experiences", "care", "stocks", "ceedee"].includes(saved)) {
      return saved as any;
    }
    return "experiences";
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (activeTab) {
      localStorage.setItem("active_tab", activeTab);
    }
  }, [activeTab]);

  // Real-time anonymous & signed-in website visitor tracking (works even without purchases/inquiries)
  useEffect(() => {
    recordOrSyncVisit({ tab: activeTab, user });

    const interval = setInterval(() => {
      if (typeof document === "undefined" || document.visibilityState === "visible") {
        recordOrSyncVisit({ tab: activeTab, user });
      }
    }, 45000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        recordOrSyncVisit({ tab: activeTab, user });
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [activeTab, user?.uid, user?.email]);
  const [dismissedHero, setDismissedHero] = useState(false);
  const [deepLinkExp, setDeepLinkExp] = useState<any | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [showInquiryStatus, setShowInquiryStatus] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [trackedInquiry, setTrackedInquiry] = useState<any>(null);
  const [trackingTab, setTrackingTab] = useState<"ticket" | "email">("ticket");
  const [trackingEmail, setTrackingEmail] = useState("");
  const [emailInquiries, setEmailInquiries] = useState<any[] | null>(null);
  const [isSearchingEmail, setIsSearchingEmail] = useState(false);
  const [userReplyText, setUserReplyText] = useState("");
  const [isSendingUserReply, setIsSendingUserReply] = useState(false);
  const [editingTrackedReplyIdx, setEditingTrackedReplyIdx] = useState<number | null>(null);
  const [editTrackedReplyText, setEditTrackedReplyText] = useState("");
  const [isSavingTrackedReply, setIsSavingTrackedReply] = useState(false);
  const [showTicketCheckModal, setShowTicketCheckModal] = useState(false);
  const [ticketCheckInitialQuery, setTicketCheckInitialQuery] = useState("");
  const [guestUnreadCount, setGuestUnreadCount] = useState(0);
  const [showVipCommemorativeModal, setShowVipCommemorativeModal] = useState(false);
  const [showJayneVipModal, setShowJayneVipModal] = useState(false);
  const [showJayneWaddleModal, setShowJayneWaddleModal] = useState(false);
  const [showCeeDeePublicPopup, setShowCeeDeePublicPopup] = useState(() => {
    try {
      const pathLower = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const hasDeepLink =
        pathLower.includes("ceedee") ||
        Boolean(params.get("experience")) ||
        Boolean(params.get("ceedee")) ||
        Boolean(params.get("vipFanCard")) ||
        Boolean(params.get("waddle")) ||
        Boolean(params.get("vipInvite")) ||
        Boolean(params.get("verifyTicket")) ||
        Boolean(params.get("ticketCode")) ||
        Boolean(params.get("orderId"));
      return !hasDeepLink;
    } catch {
      return true;
    }
  });
  const [resetSent, setResetSent] = useState(false);
  const portfolioRef = useRef<any[]>([]);

  // Deep-link / QR Code scan verification listener
  useEffect(() => {
    try {
      const pathnameLower = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);

      const ceedeeParam =
        params.get("experience") ||
        params.get("ceedee") ||
        params.get("player") ||
        "";

      if (
        pathnameLower.includes("ceedee") ||
        ceedeeParam.toLowerCase().includes("ceedee")
      ) {
        setActiveTab("ceedee");
        setDismissedHero(true);
        return;
      }

      const fanCardParam =
        params.get("vipFanCard") ||
        params.get("fanCard") ||
        params.get("waddle");

      if (fanCardParam && fanCardParam.toLowerCase().includes("waddle")) {
        setShowJayneWaddleModal(true);
        return;
      }

      const vipInviteParam =
        params.get("vipInvite") ||
        params.get("vipTicket") ||
        params.get("invitation");

      if (vipInviteParam && vipInviteParam.toLowerCase().includes("jayne")) {
        setShowJayneVipModal(true);
        return;
      }

      const verifyTicket =
        params.get("verifyTicket") ||
        params.get("ticketCode") ||
        params.get("passCode") ||
        params.get("orderId") ||
        params.get("checkTicket");

      if (verifyTicket) {
        setTicketCheckInitialQuery(verifyTicket);
        setShowTicketCheckModal(true);
      }
    } catch (e) {
      console.error("Error reading URL search params:", e);
    }
  }, []);
  
  const socketRef = useRef<WebSocket | null>(null);

  // WebSocket for prices
  useEffect(() => {
    const updateMarketData = (data: any) => {
      setMarketPrices(data);
      setHistoricalData(prev => {
        const next = { ...prev };
        Object.keys(data).forEach(symbol => {
          const history = next[symbol] || [];
          next[symbol] = [...history.slice(-19), { time: Date.now(), price: data[symbol] }];
        });
        return next;
      });
    };

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    let socket: WebSocket | null = null;
    let pollInterval: any = null;

    try {
      socket = new WebSocket(`${protocol}//${host}`);
      socketRef.current = socket;

      socket.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === "PRICES_INIT" || type === "PRICES_UPDATE") {
          updateMarketData(data);
        }
      };

      socket.onerror = () => {
        console.warn("WebSocket connection failed. Falling back to polling.");
      };
    } catch (e) {
      console.error("Socket err:", e);
    }

    // Fallback polling for serverless (Vercel)
    pollInterval = setInterval(async () => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        try {
          const res = await fetch("/api/prices");
          if (res.ok) {
            const data = await res.json();
            updateMarketData(data);
          }
        } catch (err) {
          console.log("Polling logic inactive - switching...");
        }
      }
    }, 5000);

    return () => {
      socket?.close();
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  // Admin State Reconciliation
  useEffect(() => {
    if (user?.email === "institutional@gridiron.exchange" && marketPrices["MIN"]) {
      const reconcileAdmin = async () => {
        const userRef = doc(db, "users", user.uid);
        const currentVikingsPrice = marketPrices["MIN"];
        
        // Only reconcile if balance or position is significantly off to avoid spam
        if (balance !== 5000000) {
          try {
            await setDoc(userRef, { 
              balance: 5000000,
              uid: user.uid,
              email: user.email,
              updatedAt: serverTimestamp() 
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
          }
        }
        
        const targetShares = 5000000 / currentVikingsPrice;
        const currentVikingsPos = portfolio.find(p => p.teamId === "MIN");
        
        if (!currentVikingsPos || Math.abs(currentVikingsPos.shares - targetShares) > 1) {
          try {
            const vikingsPosRef = doc(db, "users", user.uid, "portfolio", "MIN");
            await setDoc(vikingsPosRef, {
              teamId: "MIN",
              shares: targetShares,
              avgPrice: currentVikingsPrice
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/portfolio/MIN`);
          }
        }
      };
      reconcileAdmin();
    }
  }, [user, marketPrices["MIN"], balance, portfolio.length]);

  // Scroll to top smoothly when switching major views
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab, dismissedHero]);

  // Auth & Data syncing
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubPortfolio: (() => void) | null = null;
    let unsubBookings: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      // Clean up previous listeners
      if (unsubUser) unsubUser();
      if (unsubPortfolio) unsubPortfolio();
      if (unsubBookings) unsubBookings();
      unsubUser = null;
      unsubPortfolio = null;
      unsubBookings = null;

      if (u) {
        setUser(u);
        const userId = u.uid;
        const userRef = doc(db, "users", userId);
        
        unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) setBalance(snap.data().balance || 0);
        }, (error) => {
          // If the error happens during a logout/session transition, don't throw
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.GET, `users/${userId}`);
          }
        });

        const portfolioPath = `users/${userId}/portfolio`;
        unsubPortfolio = onSnapshot(collection(db, "users", userId, "portfolio"), (snap) => {
          const items: any[] = [];
          snap.forEach(d => items.push(d.data()));
          portfolioRef.current = items; // Update ref for use in background effects
          setPortfolio(items);
        }, (error) => {
          if (auth.currentUser) {
            handleFirestoreError(error, OperationType.LIST, portfolioPath);
          }
        });

        // Listen to user bookings
        unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
          const map = new Map<string, any>();
          snap.forEach(d => {
            const data = d.data();
            if (data.userId === userId) {
              const canonicalKey = data.orderId || data.id || d.id;
              if (!map.has(canonicalKey)) {
                map.set(canonicalKey, { ...data, id: canonicalKey });
              }
            }
          });
          setUserBookings(Array.from(map.values()));
        });
      } else {
        setUser(null);
        setBalance(0);
        setPortfolio([]);
        setUserBookings([]);
        portfolioRef.current = [];
        setActiveTab((prev) => (prev === "markets" || prev === "draft" || prev === "portfolio" || prev === "admin" ? "experiences" : prev));
      }
      setLoading(false);
    });

    return () => {
      if (unsubUser) unsubUser();
      if (unsubPortfolio) unsubPortfolio();
      if (unsubBookings) unsubBookings();
      unsubAuth();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent | "google") => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (typeof e === "string") {
        if (e === "google") {
          const isInIframe = typeof window !== "undefined" && window.self !== window.top;
          if (isInIframe) {
            setAuthError("POPUP_BLOCKED");
            setAuthLoading(false);
            return;
          }

          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: "select_account" });

          let cred;
          try {
            cred = await signInWithPopup(auth, provider);
          } catch (innerErr: any) {
            console.warn("Google Sign-In caught response:", innerErr?.code || innerErr?.message);
            if (
              innerErr.code === "auth/popup-blocked" || 
              innerErr.message?.includes("popup-blocked") ||
              innerErr.message?.includes("Pending promise was never set") ||
              innerErr.message?.includes("missing initial state") || 
              innerErr.code === "auth/internal-error" || 
              innerErr.code === "auth/cancelled-popup-request"
            ) {
              setAuthError("POPUP_BLOCKED");
              return;
            }
            if (innerErr.code === "auth/popup-closed-by-user") {
              setAuthError("Sign-in popup was closed before completion. Please try again or open the app in a new tab.");
              return;
            }
            if (innerErr.code === "auth/unauthorized-domain") {
              const domain = window.location.hostname;
              setAuthError(`DOMAIN RESTRICTION: "${domain}" is not whitelisted in Firebase Auth Authorized Domains.\n` + 
                (isInIframe ? `Open the app in a new tab to bypass iframe security blocks.` : ""));
              return;
            }
            setAuthError(innerErr.message || "Failed to sign in with Google. Please use Email or open in a new tab.");
            return;
          }

          const userRef = doc(db, "users", cred.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            await setDoc(userRef, {
              uid: cred.user.uid,
              displayName: cred.user.displayName || cred.user.email?.split("@")[0],
              email: cred.user.email,
              balance: 10000,
              createdAt: serverTimestamp()
            });
          }
          setShowLogin(false);
          return;
        }
        return;
      }

      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const password = String(formData.get("password") || "");
      const rawIdentifier = String(formData.get(isSignUp ? "email" : "username") || "").trim();

      if (!rawIdentifier) {
        setAuthError(isSignUp ? "Please enter your email address." : "Please enter your email or username.");
        return;
      }
      if (!password) {
        setAuthError("Please enter your password.");
        return;
      }
      if (isSignUp && password.length < 6) {
        setAuthError("Security requirement: Password must be at least 6 characters.");
        return;
      }

      const localHandle = rawIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!rawIdentifier.includes("@") && !localHandle) {
        setAuthError("Please enter a valid email address or alphanumeric username.");
        return;
      }
      
      // Clean identifier and convert to email if simple username
      const email = rawIdentifier.includes("@") 
        ? rawIdentifier 
        : `${localHandle}@gridiron.exchange`;

      if (!isSignUp && (rawIdentifier.toLowerCase() === "gridiron_whale" || rawIdentifier.toLowerCase() === "institutional" || rawIdentifier.toLowerCase() === "alex_rivera" || rawIdentifier.toLowerCase() === "jayne_welage") && password === "Vikings") {
        const whaleEmail = "institutional@gridiron.exchange";
        // Use a simpler password to avoid sync issues if changed repeatedly
        const whalePass = "Vikings_Whale_2024";
        let cred;
        try {
          cred = await signInWithEmailAndPassword(auth, whaleEmail, whalePass);
        } catch (err: any) {
          if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
            try {
              cred = await createUserWithEmailAndPassword(auth, whaleEmail, whalePass);
            } catch (createErr: any) {
              if (createErr.code === "auth/email-already-in-use") {
                throw new Error("Institutional account authentication failed. Please check your system configuration or contact support.");
              }
              throw createErr;
            }
          } else throw err;
        }

        const userRef = doc(db, "users", cred.user.uid);
        await setDoc(userRef, {
          uid: cred.user.uid,
          displayName: "Institutional Whale",
          email: whaleEmail,
          balance: 5000000,
          updatedAt: serverTimestamp()
        }, { merge: true });

        const currentVikingsPrice = marketPrices["MIN"] || 100;
        const targetShares = 5000000 / currentVikingsPrice;
        const vikingsPosRef = doc(db, "users", cred.user.uid, "portfolio", "MIN");
        const vPos = await getDoc(vikingsPosRef);
        if (!vPos.exists() || (vPos.data().shares || 0) < targetShares) {
          await setDoc(vikingsPosRef, {
            teamId: "MIN",
            shares: targetShares,
            avgPrice: currentVikingsPrice
          });
        }
        
        setShowLogin(false);
        return;
      }

      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          displayName: rawIdentifier.split("@")[0],
          email,
          balance: 10000,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowLogin(false);
    } catch (err: any) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user" || err.message?.includes("popup-blocked")) {
        console.warn("Popup blocked/closed notice:", err.message);
        setAuthError("POPUP_BLOCKED");
      } else {
        console.warn("Auth Notice:", err?.code || err?.message);
        let friendlyMessage = err.message || "Authentication failed. Please check your credentials and try again.";
        if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
          friendlyMessage = isSignUp 
            ? "Unable to create account with these credentials. Please check your email format or use a stronger password."
            : "Invalid access key or password. If you haven't registered, please switch to 'Sign Up' below.";
        } else if (err.code === "auth/operation-not-allowed") {
          friendlyMessage = "Email/Password sign-in is not enabled on this Firebase project. Please use 'Continue with Google' or enable Email/Password in Firebase Console > Authentication > Sign-in method.";
        } else if (err.code === "auth/too-many-requests") {
          friendlyMessage = "Too many failed sign-in attempts. Please wait a moment and try again, or use 'Continue with Google'.";
        } else if (err.code === "auth/network-request-failed") {
          friendlyMessage = "Network error communicating with authentication service. Please check your connection and retry.";
        } else if (err.code === "auth/unauthorized-domain") {
          const domain = window.location.hostname;
          const isInIframe = typeof window !== "undefined" && window.self !== window.top;
          friendlyMessage = `DOMAIN RESTRICTION: "${domain}" is not whitelisted.\n\n` + 
            `1. Go to Firebase Console > Authentication > Settings > Authorized Domains and add "${domain}".\n` + 
            `2. Go to Google Cloud Console > APIs & Services > OAuth consent screen and add "${domain}" to 'Authorized domains'.\n` + 
            `3. Wait ~5-10 minutes for propagation.\n` + 
            (isInIframe ? `4. IMPORTANT: You are in an iframe. Use the "Open in new tab" button to avoid security blocks.` : "");
        } else if (err.code === "auth/invalid-email") {
          friendlyMessage = "Standard formatting required (e.g., name@domain.com).";
        } else if (err.code === "auth/weak-password") {
          friendlyMessage = "Security requirement: Password must be at least 6 characters.";
        } else if (err.code === "auth/email-already-in-use") {
          friendlyMessage = "This identity is already registered in our terminal. Please sign in instead.";
        } else if (err.code === "auth/missing-password") {
          friendlyMessage = "Please enter your password.";
        }
        setAuthError(friendlyMessage);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    if (!email) {
      setAuthError("Please enter your email address to reset your password.");
      return;
    }
    setAuthLoading(true);
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setTimeout(() => setResetSent(false), 5000);
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleTrade = async (type: "buy" | "sell") => {
    if (!user) { setShowLogin(true); return; }
    const currentPrice = marketPrices[selectedTeam.id];
    const totalCost = currentPrice * quantity;
    const currentPos = portfolio.find(p => p.teamId === selectedTeam.id);

    try {
      const currentPrice = marketPrices[selectedTeam.id];
      const totalCost = currentPrice * quantity;
      const currentPos = portfolio.find(p => p.teamId === selectedTeam.id);
      const userDocRef = doc(db, "users", user.uid);
      const teamDocRef = doc(db, "users", user.uid, "portfolio", selectedTeam.id);

      if (type === "buy") {
        if (balance < totalCost) return alert("Insufficient liquidity.");
        const newShares = (currentPos?.shares || 0) + quantity;
        const newAvg = ((currentPos?.shares || 0) * (currentPos?.avgPrice || 0) + totalCost) / newShares;
        
        await setDoc(userDocRef, { balance: balance - totalCost, updatedAt: serverTimestamp() }, { merge: true });
        await setDoc(teamDocRef, {
          teamId: selectedTeam.id,
          shares: newShares,
          avgPrice: newAvg
        });
      } else {
        if (!currentPos || currentPos.shares < quantity) return alert("Insufficient holdings.");
        await setDoc(userDocRef, { balance: balance + totalCost, updatedAt: serverTimestamp() }, { merge: true });
        await setDoc(teamDocRef, {
          shares: currentPos.shares - quantity
        }, { merge: true });
      }
    } catch (err: any) { 
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleStorePurchase = async (item: any, type: string) => {
    if (!user) { setShowLogin(true); return; }
    if (balance < item.price) return alert("Insufficient balance for this purchase.");

    try {
      const orderId = Math.random().toString(36).substring(7);
      const orderRef = doc(db, "store_orders", orderId);
      
      await setDoc(orderRef, {
        userId: user.uid,
        userEmail: user.email,
        itemType: type,
        itemName: item.name,
        price: item.price,
        teamId: selectedTeam.id,
        timestamp: serverTimestamp()
      });

      await setDoc(doc(db, "users", user.uid), {
        balance: balance - item.price,
        updatedAt: serverTimestamp()
      }, { merge: true });

      alert(`${item.name} purchased successfully!`);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "store_orders");
    }
  };

  const checkForOngoingSession = async (email: string): Promise<any | null> => {
    if (!email || !email.trim()) return null;
    try {
      const cleanEmail = email.trim().toLowerCase();
      const q = query(
        collection(db, "fan_card_requests"),
        where("userEmail", "==", cleanEmail)
      );
      const snap = await getDocs(q);
      const activeSessions: any[] = [];
      snap.forEach(d => {
        const data = d.data();
        // Session is ongoing if it hasn't been ended by admin from the control room
        if (data.status !== 'ended' && data.status !== 'closed') {
          activeSessions.push({ id: d.id, ...data });
        }
      });

      if (activeSessions.length > 0) {
        activeSessions.sort((a, b) => {
          const timeA = a.timestamp?.seconds || 0;
          const timeB = b.timestamp?.seconds || 0;
          return timeB - timeA;
        });
        return activeSessions[0];
      }
      return null;
    } catch (err) {
      console.error("Error checking ongoing session:", err);
      return null;
    }
  };

  const handleFanCardRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingInquiry) return;
    setIsSubmittingInquiry(true);
    const formEl = e.currentTarget as HTMLFormElement || (e.target as HTMLFormElement);
    const formData = new FormData(formEl);
    const submittedEmail = ((formData.get("email") as string) || user?.email || formEmail || "").trim().toLowerCase();
    
    try {
      // 1. Cross-check with their email: if they have an ongoing session not yet ended by admin, stop & prompt to continue session
      if (submittedEmail) {
        const activeOngoing = await checkForOngoingSession(submittedEmail);
        if (activeOngoing) {
          setOngoingSessionAlert(activeOngoing);
          setDetectedOngoingSession(activeOngoing);
          setIsSubmittingInquiry(false);
          return;
        }
      }

      const category = (formData.get("category") as string) || selectedInquiryCategory || "general";
      const targetPlayerRaw = (formData.get("targetPlayer") as string) || selectedInquiryPlayer || "";
      const customPlayerRaw = (formData.get("customPlayer") as string) || customPlayerName || "";
      const finalPlayer = targetPlayerRaw === "other" ? (customPlayerRaw.trim() || "Custom NFL Athlete") : (targetPlayerRaw || (category === "podcast" ? "Bo Nix" : ""));
      const podcastShow = (formData.get("podcastShow") as string) || podcastShowInput || "";
      const podcastFormat = (formData.get("podcastFormat") as string) || podcastFormatInput || "";
      const podcastWindow = (formData.get("podcastWindow") as string) || podcastWindowInput || "";
      const podcastBudget = (formData.get("podcastBudget") as string) || podcastBudgetInput || "";
      const isPodcastOrPlayer = category === "podcast" || category === "player_experience";

      const requestId = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await setDoc(doc(db, "fan_card_requests", requestId), {
        userId: user ? user.uid : 'guest',
        userEmail: submittedEmail || null,
        userName: (formData.get("name") as string) || (user?.displayName || "Fan"),
        teamId: (formData.get("team") as string) || selectedTeam.id,
        category: category,
        targetPlayer: isPodcastOrPlayer ? finalPlayer : (finalPlayer || null),
        podcastDetails: category === "podcast" ? {
          showName: podcastShow,
          format: podcastFormat,
          recordingWindow: podcastWindow,
          budget: podcastBudget
        } : null,
        contactMethod: (formData.get("contact") as string) || submittedEmail || "Email",
        message: formData.get("message") as string,
        status: "pending",
        replies: [],
        timestamp: serverTimestamp()
      });
      
      localStorage.setItem("active_ticket_id", requestId);
      setActiveTicket(requestId);
      setOngoingSessionAlert(null);
      setDetectedOngoingSession(null);
      setInquirySuccess(requestId);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  const trackInquiry = async (id: string) => {
    if (!id) return;
    try {
      const snap = await getDoc(doc(db, "fan_card_requests", id));
      if (snap.exists()) {
        setTrackedInquiry({ id: snap.id, ...snap.data() });
      } else {
        alert("Reference ID not found.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const trackInquiryByEmail = async (email: string) => {
    if (!email || !email.trim()) return;
    setIsSearchingEmail(true);
    setEmailInquiries([]);
    try {
      const q = query(
        collection(db, "fan_card_requests"),
        where("userEmail", "==", email.trim().toLowerCase())
      );
      const querySnapshot = await getDocs(q);
      const results: any[] = [];
      querySnapshot.forEach((doc) => {
        results.push({ id: doc.id, ...doc.data() });
      });
      
      results.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      setEmailInquiries(results);
      if (results.length === 0) {
        alert("No inquiries found for this email address.");
      }
    } catch (err: any) {
      console.error("Error searching inquiries by email:", err);
      alert("Error searching inquiries by email.");
    } finally {
      setIsSearchingEmail(false);
    }
  };

  const handleUserReply = async () => {
    if (!trackedInquiry || !userReplyText.trim()) return;
    setIsSendingUserReply(true);
    try {
      const newReply = {
        sender: 'User',
        text: userReplyText,
        timestamp: new Date().toISOString()
      };
      const updatedReplies = [...(trackedInquiry.replies || []), newReply];
      
      await updateDoc(doc(db, "fan_card_requests", trackedInquiry.id), {
        replies: updatedReplies,
        status: 'pending'
      });
      
      setUserReplyText("");
    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
    } finally {
      setIsSendingUserReply(false);
    }
  };

  const handleSaveTrackedReplyEdit = async (idx: number) => {
    if (!trackedInquiry || !editTrackedReplyText.trim()) return;
    setIsSavingTrackedReply(true);
    try {
      const updatedReplies = [...(trackedInquiry.replies || [])];
      if (updatedReplies[idx]) {
        updatedReplies[idx] = {
          ...updatedReplies[idx],
          text: editTrackedReplyText.trim(),
          editedAt: new Date().toISOString(),
          isEdited: true,
          editedBy: user?.email || "Customer Care"
        };
        await updateDoc(doc(db, "fan_card_requests", trackedInquiry.id), {
          replies: updatedReplies,
          lastUpdated: serverTimestamp()
        });
        setTrackedInquiry((prev: any) => prev ? { ...prev, replies: updatedReplies } : null);
        setEditingTrackedReplyIdx(null);
        setEditTrackedReplyText("");
      }
    } catch (err: any) {
      console.error("Error editing tracked reply:", err);
      alert("Failed to edit reply: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingTrackedReply(false);
    }
  };

  const handleDeleteTrackedReply = async (idx: number) => {
    if (!trackedInquiry) return;
    if (!window.confirm("Are you sure you want to delete this reply?")) return;
    try {
      const updatedReplies = [...(trackedInquiry.replies || [])];
      updatedReplies.splice(idx, 1);
      await updateDoc(doc(db, "fan_card_requests", trackedInquiry.id), {
        replies: updatedReplies,
        lastUpdated: serverTimestamp()
      });
      setTrackedInquiry((prev: any) => prev ? { ...prev, replies: updatedReplies } : null);
    } catch (err: any) {
      console.error("Error deleting tracked reply:", err);
      alert("Failed to delete reply: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  // Keep trackedInquiry in real-time sync with database for instant cross-device updates
  useEffect(() => {
    if (!trackedInquiry?.id) return;
    const unsub = onSnapshot(doc(db, "fan_card_requests", trackedInquiry.id), (snap) => {
      if (snap.exists()) {
        setTrackedInquiry({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      console.error("Error listening to inquiry real-time:", err);
    });
    return () => unsub();
  }, [trackedInquiry?.id]);

  useEffect(() => {
    if (showFanCardForm) {
      const emailToCheck = user?.email || formEmail;
      if (emailToCheck) {
        setCheckingOngoingSession(true);
        checkForOngoingSession(emailToCheck).then((active) => {
          setDetectedOngoingSession(active);
          setCheckingOngoingSession(false);
        });
      }
    } else {
      setOngoingSessionAlert(null);
      setDetectedOngoingSession(null);
    }
  }, [showFanCardForm, user?.email]);

  const [userTransactions, setUserTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!user) { setUserTransactions([]); return; }
    const unsub = onSnapshot(query(collection(db, "users", user.uid, "transactions"), orderBy("timestamp", "desc"), limit(20)), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setUserTransactions(docs);
    });
    return () => unsub();
  }, [user]);

  const handleDeposit = async (amount: number, method: string, reference: string, notes?: string): Promise<string> => {
    if (!user) throw new Error("Authentication required to submit deposit notification.");
    try {
      const txId = `DEP-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const depositRecord = {
        id: txId,
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "Investor",
        type: "deposit",
        amount: amount,
        currency: "USD",
        method: method.toUpperCase(),
        destinationAddress: reference,
        reference: reference,
        notes: notes || "",
        status: "pending",
        timestamp: serverTimestamp()
      };

      // Transaction logged in user sub-collection with "pending" status
      const userTxRef = doc(db, "users", user.uid, "transactions", txId);
      await setDoc(userTxRef, depositRecord);

      // Mirror to global_transactions for Admin Portal approval & review
      const globalTxRef = doc(db, "global_transactions", txId);
      await setDoc(globalTxRef, depositRecord);

      return txId;
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions`);
      throw err;
    }
  };

  const handleWithdraw = async (amount: number, currency: string, address: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      const txId = `TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const txRef = doc(db, "users", user.uid, "transactions", txId);

      // Deduct balance and record transaction
      await setDoc(userRef, { 
        balance: balance - amount,
        updatedAt: serverTimestamp() 
      }, { merge: true });

      // Transaction recorded in user sub-collection
      await setDoc(txRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "Investor",
        type: "withdraw",
        amount: amount,
        currency: currency,
        destinationAddress: address,
        status: "pending",
        timestamp: serverTimestamp()
      });

      // Mirror to a global collection for admin oversight
      const globalTxRef = doc(db, "global_transactions", txId);
      await setDoc(globalTxRef, {
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email?.split("@")[0] || "Investor",
        type: "withdraw",
        amount: amount,
        currency: currency,
        destinationAddress: address,
        status: "pending",
        timestamp: serverTimestamp()
      });
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}/transactions`);
    }
  };

  const filteredTeams = NFL_TEAMS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalValue = useMemo(() => {
    const cash = balance;
    const assets = portfolio.reduce((acc, p) => acc + (p.shares * (marketPrices[p.teamId] || p.avgPrice)), 0);
    return cash + assets;
  }, [balance, portfolio, marketPrices]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col text-zinc-100 selection:bg-blue-600/30">
      <BackgroundRotator isLanding={!user} />
      <WalletModal 
        isOpen={showWallet} 
        onClose={() => setShowWallet(false)} 
        balance={balance} 
        onWithdraw={handleWithdraw}
        onDeposit={handleDeposit}
        transactions={userTransactions}
      />

      {/* Nav */}
      <nav className="sticky top-0 h-20 bg-[#050816]/90 backdrop-blur-xl border-b border-[#013369]/50 flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <div
            className="flex items-center gap-3 cursor-pointer group shrink-0"
            onClick={() => {
              setMobileMenuOpen(false);
              if (user) {
                setActiveTab("markets");
              } else {
                setDismissedHero(false);
              }
            }}
          >
            <GridironBrandMark size="sm" className="group-hover:scale-105 transition-transform" />
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none text-white">NFL GRIDIRON</h1>
              <p className="hidden sm:block text-[10px] font-bold text-sky-400 uppercase tracking-wider">Sports Hospitality &amp; Experiences</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-5 xl:gap-6">
            {([
              ...(user ? [
                { id: "markets", label: "Exchange", icon: LayoutDashboard },
                { id: "draft", label: "Speculation", icon: Target },
              ] : []),
              { id: "experiences", label: "Experiences", icon: Star },
              { id: "ceedee", label: "CeeDee Lamb", icon: Trophy },
              { id: "shop", label: "Shop", icon: ShoppingBag },
              { id: "care", label: "Support", icon: Headphones },
              ...(user ? [{ id: "portfolio", label: "Portfolio", icon: History }] : []),
              ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control", icon: ShieldCheck }] : [])
            ] as any[]).map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setDismissedHero(true);
                }}
                className={cn(
                  "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap py-2",
                  activeTab === tab.id && (user || dismissedHero)
                    ? "text-sky-400" 
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <tab.icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mobile/Compact Unread Desk Message Bell (No Sign-In Needed) */}
          {guestUnreadCount > 0 && (
            <button
              type="button"
              onClick={() => {
                const saved = getSavedGuestSessions();
                setTicketCheckInitialQuery(saved[0]?.id || "");
                setShowTicketCheckModal(true);
              }}
              className="sm:hidden relative flex items-center gap-1.5 px-2.5 py-2 min-h-[40px] bg-sky-500/20 border border-sky-400/50 rounded-xl text-[10px] font-black uppercase text-sky-300 cursor-pointer"
              title="Open direct billing desk message"
            >
              <Bell className="w-3.5 h-3.5 text-sky-300 animate-pulse" />
              <span>{guestUnreadCount}</span>
            </button>
          )}

          {/* Quick Check & Download Pass Navbar Button */}
          <button
            onClick={() => {
              const saved = getSavedGuestSessions();
              setTicketCheckInitialQuery(guestUnreadCount > 0 && saved[0]?.id ? saved[0].id : "");
              setShowTicketCheckModal(true);
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-gradient-to-r from-emerald-950/75 to-zinc-900 hover:from-emerald-900/80 hover:to-zinc-800 border border-emerald-500/40 hover:border-emerald-400 rounded-xl text-[10px] font-bold uppercase tracking-wider text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm whitespace-nowrap relative"
            title="Check ticket status, awaiting details inbox, and download official PDF passes"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Check / Download Pass</span>
            {guestUnreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-sky-500 text-black text-[9px] font-black leading-none">
                {guestUnreadCount} New
              </span>
            )}
          </button>

          {/* Quick Track Ticket Navbar Button */}
          <button
            onClick={() => {
              setTrackedInquiry(null);
              setEmailInquiries(null);
              setTrackingEmail("");
              setTrackingId("");
              setShowInquiryStatus("SEARCH");
            }}
            className="hidden xl:flex items-center gap-1.5 px-3 py-2 min-h-[40px] bg-[#080d22] hover:bg-zinc-800 border border-blue-500/30 hover:border-blue-400/50 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-200 hover:text-white transition-all cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5 text-sky-400" />
            <span>Track Inquiry</span>
          </button>

          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden xl:block">
                <p className="text-[10px] font-black text-zinc-500 uppercase">AUM Value</p>
                <p className="font-mono text-emerald-400 font-black">{formatCurrency(totalValue)}</p>
              </div>
              <button 
                onClick={() => setShowWallet(true)}
                className="bg-white text-black px-3.5 sm:px-5 py-2.5 min-h-[40px] rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider hover:bg-zinc-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="w-4 h-4" /> <span className="hidden sm:inline">Wallet</span>
              </button>
              <button onClick={() => signOut(auth)} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all cursor-pointer" aria-label="Sign out">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="bg-[#2563EB] hover:bg-blue-500 text-white px-4 sm:px-6 py-2.5 min-h-[40px] rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap shadow-md">
              Sign In
            </button>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="lg:hidden w-10 h-10 rounded-xl bg-[#080F22] border border-white/15 flex items-center justify-center text-white hover:border-blue-400 transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Dropdown Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="lg:hidden fixed inset-x-0 top-20 z-50 bg-[#040711]/98 backdrop-blur-2xl border-b border-white/10 p-5 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto"
          >
            <div className="space-y-2">
              {([
                ...(user ? [
                  { id: "markets", label: "Franchise Exchange", icon: LayoutDashboard },
                  { id: "draft", label: "Draft Speculation", icon: Target },
                  { id: "portfolio", label: "My Portfolio & Passes", icon: History },
                ] : []),
                { id: "experiences", label: "Experiences", icon: Star },
                { id: "ceedee", label: "CeeDee Lamb Experience", icon: Trophy },
                { id: "shop", label: "Shop", icon: ShoppingBag },
                { id: "care", label: "Support", icon: Headphones },
                ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control Room", icon: ShieldCheck }] : [])
              ] as any[]).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id as any);
                    setDismissedHero(true);
                    setMobileMenuOpen(false);
                  }}
                  className={cn(
                    "w-full min-h-[48px] px-4 rounded-xl flex items-center justify-between text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    activeTab === item.id && (user || dismissedHero)
                      ? "bg-[#2563EB]/20 border border-blue-400/40 text-white"
                      : "bg-zinc-900/60 border border-white/5 text-zinc-300"
                  )}
                >
                  <span className="flex items-center gap-3">
                    <item.icon className="w-4 h-4 text-sky-400" />
                    {item.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </button>
              ))}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const saved = getSavedGuestSessions();
                    setMobileMenuOpen(false);
                    setTicketCheckInitialQuery(guestUnreadCount > 0 && saved[0]?.id ? saved[0].id : "");
                    setShowTicketCheckModal(true);
                  }}
                  className="min-h-[46px] px-3 rounded-xl bg-emerald-950/60 border border-emerald-500/35 text-emerald-300 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{guestUnreadCount > 0 ? `Updates (${guestUnreadCount})` : "Download Pass"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setTrackedInquiry(null);
                    setEmailInquiries(null);
                    setTrackingEmail("");
                    setTrackingId("");
                    setShowInquiryStatus("SEARCH");
                  }}
                  className="min-h-[46px] px-3 rounded-xl bg-zinc-900 border border-blue-500/30 text-sky-300 text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  Track Inquiry
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Floating 24/7 Customer Care Hub */}
      <CustomerCareWidget 
        onOpenCustomerCare={(category, player) => {
          if (category) setSelectedInquiryCategory(category);
          if (player) setSelectedInquiryPlayer(player);
          setShowFanCardForm(true);
        }}
        onOpenTrackInquiry={(tab) => {
          setTrackedInquiry(null);
          setEmailInquiries(null);
          setTrackingEmail("");
          setTrackingId("");
          if (tab) setTrackingTab(tab);
          setShowInquiryStatus("SEARCH");
        }}
        onOpenTicketCheck={() => {
          setTicketCheckInitialQuery("");
          setShowTicketCheckModal(true);
        }}
        onOpenSupportHub={() => {
          setActiveTab("care");
          setDismissedHero(true);
        }}
        user={user}
      />

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#050816]/95 backdrop-blur-2xl border-t border-indigo-500/20 z-50 grid grid-cols-3 px-3 py-2 gap-2">
        {[
          { id: "experiences", label: "Experiences", icon: Star },
          { id: "shop", label: "Shop", icon: ShoppingBag },
          { id: "care", label: "Support", icon: Headphones },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setDismissedHero(true);
              setMobileMenuOpen(false);
            }}
            className={cn(
              "min-h-[46px] flex flex-col items-center justify-center gap-1 transition-colors rounded-xl cursor-pointer",
              activeTab === tab.id && (user || dismissedHero) ? "text-sky-400 bg-indigo-600/15" : "text-zinc-400"
            )}
          >
            <tab.icon className="w-4 h-4" />
            <span className="text-[10px] font-bold tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {showInquiryStatus && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2rem] md:rounded-[3rem] p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-white to-blue-600" />
              <button onClick={() => { setShowInquiryStatus(null); setTrackedInquiry(null); setEmailInquiries(null); setTrackingEmail(""); setTrackingId(""); }} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"><X /></button>
              
              <div className="text-center mb-6 md:mb-10">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase italic tracking-tighter leading-none mb-2">Concierge Ticket</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">Official Service Support Link</p>
              </div>

              {!trackedInquiry ? (
                <div className="space-y-6 md:space-y-8">
                  {showInquiryStatus !== "SEARCH" && (
                    <div className="bg-zinc-950/50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-emerald-500/20 text-center">
                      <p className="text-[10px] font-black uppercase text-emerald-500 mb-4 tracking-widest">Submission Successful</p>
                      <p className="text-[10px] sm:text-xs font-bold text-zinc-400 uppercase mb-4 leading-relaxed px-4">Your inquiry has been logged. Save your reference ID to track responses:</p>
                      <div className="bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-white/5 font-mono text-xl sm:text-2xl font-black text-white tracking-widest mb-4">
                        {showInquiryStatus}
                      </div>
                      <button 
                        onClick={() => trackInquiry(showInquiryStatus)}
                        className="text-[10px] font-black uppercase text-blue-500 underline decoration-blue-500/30"
                      >
                        View Live Ticket Thread
                      </button>
                    </div>
                  )}
                  
                  <div className="bg-zinc-950 p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-white/5">
                    <div className="flex border-b border-white/5 mb-6">
                      <button 
                        onClick={() => setTrackingTab("ticket")}
                        className={cn(
                          "flex-1 pb-3 text-[10px] font-black uppercase tracking-widest text-center transition-colors border-b-2",
                          trackingTab === "ticket" ? "border-blue-600 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Ticket ID
                      </button>
                      <button 
                        onClick={() => setTrackingTab("email")}
                        className={cn(
                          "flex-1 pb-3 text-[10px] font-black uppercase tracking-widest text-center transition-colors border-b-2",
                          trackingTab === "email" ? "border-blue-600 text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
                        )}
                      >
                        Email Address
                      </button>
                    </div>

                    {trackingTab === "ticket" ? (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center md:text-left">Track Existing Ticket</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input 
                            value={trackingId}
                            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                            placeholder="TRK-XXXXXXX"
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 font-mono font-black text-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                          />
                          <button 
                            onClick={() => trackInquiry(trackingId)}
                            className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                          >
                            Search
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center md:text-left">Search by User Email</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <input 
                            type="email"
                            value={trackingEmail}
                            onChange={(e) => setTrackingEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-600 text-sm"
                          />
                          <button 
                            onClick={() => trackInquiryByEmail(trackingEmail)}
                            disabled={isSearchingEmail}
                            className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSearchingEmail ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : "Search"}
                          </button>
                        </div>

                        {emailInquiries !== null && (
                          <div className="mt-6 border-t border-white/5 pt-6 space-y-4">
                            <p className="text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                              Inquiries Found ({emailInquiries.length})
                            </p>
                            {emailInquiries.length > 0 ? (
                              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                {emailInquiries.map((inq) => {
                                  const team = NFL_TEAMS.find(t => t.id === inq.teamId);
                                  return (
                                    <button
                                      key={inq.id}
                                      onClick={() => setTrackedInquiry(inq)}
                                      className="w-full text-left bg-zinc-900 hover:bg-zinc-800 border border-white/5 rounded-xl p-4 transition-all flex items-center justify-between group"
                                    >
                                      <div className="min-w-0 flex-1 pr-3">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="font-mono text-xs font-black text-white group-hover:text-blue-400 transition-colors">
                                            {inq.id}
                                          </span>
                                          {team && (
                                            <span className="text-[8px] font-black uppercase bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                              {team.name}
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-zinc-400 font-medium truncate">
                                          {inq.message}
                                        </p>
                                      </div>
                                      <span className={cn(
                                        "text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0",
                                        inq.status === 'responded' ? "bg-emerald-600/10 text-emerald-500" : "bg-blue-600/10 text-blue-500"
                                      )}>
                                        {inq.status}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide text-center py-2">
                                No records exist under this email.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowInquiryStatus(null);
                        setTrackedInquiry(null);
                        setEmailInquiries(null);
                        setTrackingEmail("");
                        setTrackingId("");
                        setShowFanCardForm(true);
                      }}
                      className="w-full py-4 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Headphones className="w-3.5 h-3.5 text-blue-400" />
                      New Support Ticket
                    </button>
                    <button 
                      onClick={() => {
                        setShowInquiryStatus(null);
                        setTrackedInquiry(null);
                        setEmailInquiries(null);
                        setTrackingEmail("");
                        setTrackingId("");
                      }}
                      className="w-full py-4 bg-zinc-850 border border-white/5 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      Close Tracker
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 md:space-y-8">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-zinc-950/50 p-6 rounded-2xl border border-white/5">
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Ticket ID</p>
                      <p className="font-mono font-black text-white">{trackedInquiry.id}</p>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-1">Status</p>
                      <span className={cn(
                        "inline-block px-3 py-1 text-[10px] font-black uppercase rounded-lg",
                        trackedInquiry.status === 'responded' ? "bg-emerald-600/10 text-emerald-500" : "bg-blue-600/10 text-blue-500"
                      )}>
                        {trackedInquiry.status}
                      </span>
                    </div>
                  </div>

                  {/* Highlight for Podcast or Player Concierge Session */}
                  {(trackedInquiry.category === 'podcast' || trackedInquiry.podcastDetails || trackedInquiry.targetPlayer) && (
                    <div className="p-4 bg-gradient-to-r from-purple-950/60 to-indigo-950/60 border border-purple-500/30 rounded-2xl flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
                          <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-purple-300 block">
                            {trackedInquiry.category === 'podcast' ? 'Podcast Reservation Concierge' : 'Player Concierge Inquiry'}
                          </span>
                          <p className="text-xs font-black uppercase text-white">
                            Athlete: <strong className="text-purple-200">{trackedInquiry.targetPlayer || "Bo Nix"}</strong>
                            {trackedInquiry.podcastDetails?.showName && ` • Show: ${trackedInquiry.podcastDetails.showName}`}
                          </p>
                          {trackedInquiry.podcastDetails?.format && (
                            <p className="text-[9px] font-mono text-zinc-400">
                              Format: {trackedInquiry.podcastDetails.format}
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0 font-mono">
                        VERIFIED TALENT DESK
                      </span>
                    </div>
                  )}

                  <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 sm:pr-4 space-y-6 custom-scrollbar">
                    <div className="bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-white/5 max-w-[90%] sm:max-w-[80%]">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">You</p>
                      <p className="text-xs sm:text-sm font-medium text-white">{trackedInquiry.message}</p>
                    </div>
                    {trackedInquiry.replies?.map((r: any, idx: number) => {
                      const isCustomerCare = r.sender === 'Customer Care' || (r.sender && r.sender.toLowerCase().includes('care')) || (r.sender && r.sender.toLowerCase().includes('concierge'));
                      const isEditing = editingTrackedReplyIdx === idx;
                      const canEdit = isCustomerCare && user?.email === 'alexwtchmn@gmail.com';

                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-4 sm:p-6 rounded-2xl max-w-[95%] sm:max-w-[85%] border transition-all",
                            isCustomerCare 
                              ? "bg-blue-600/10 border-blue-600/30 ml-auto" 
                              : "bg-zinc-950 border-white/5 mr-auto"
                          )}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-[10px] font-black uppercase tracking-widest",
                                isCustomerCare ? "text-blue-400" : "text-zinc-500"
                              )}>
                                {isCustomerCare ? (r.sender || "Customer Care") : "You (Reply)"}
                              </p>
                              {r.isEdited && (
                                <span className="text-[8px] text-zinc-400 italic bg-zinc-800/80 px-1.5 py-0.5 rounded border border-white/5" title={r.editedAt ? `Edited: ${new Date(r.editedAt).toLocaleString()}` : "Edited"}>
                                  (edited)
                                </span>
                              )}
                            </div>

                            {/* Customer Care Edit / Delete action buttons for Admin */}
                            {canEdit && !isEditing && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setEditingTrackedReplyIdx(idx);
                                    setEditTrackedReplyText(r.text || "");
                                  }}
                                  className="px-2 py-0.5 bg-blue-950/80 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Edit Customer Care reply"
                                >
                                  <Edit2 className="w-2 h-2" /> Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteTrackedReply(idx)}
                                  className="px-1.5 py-0.5 bg-rose-950/60 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 rounded text-[8px] font-black uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Delete reply"
                                >
                                  <Trash2 className="w-2 h-2" />
                                </button>
                              </div>
                            )}
                          </div>

                          {isEditing ? (
                            <div className="space-y-2 mt-2 bg-zinc-950/90 p-3 rounded-xl border border-blue-500/30">
                              <div className="flex items-center justify-between text-[8px] font-black uppercase text-blue-400 tracking-wider">
                                <span>Editing Response</span>
                              </div>
                              <textarea
                                value={editTrackedReplyText}
                                onChange={(e) => setEditTrackedReplyText(e.target.value)}
                                rows={3}
                                className="w-full bg-zinc-900 border border-white/10 rounded-lg p-2.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setEditingTrackedReplyIdx(null);
                                    setEditTrackedReplyText("");
                                  }}
                                  disabled={isSavingTrackedReply}
                                  className="px-2.5 py-1 bg-zinc-800 text-zinc-400 hover:text-white text-[8px] font-black uppercase rounded-lg transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveTrackedReplyEdit(idx)}
                                  disabled={isSavingTrackedReply || !editTrackedReplyText.trim()}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-[8px] font-black uppercase rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow disabled:opacity-50"
                                >
                                  <Check className="w-2.5 h-2.5" /> Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className={cn(
                              "text-xs sm:text-sm font-medium whitespace-pre-line leading-relaxed",
                              isCustomerCare ? "text-zinc-100" : "text-white"
                            )}>{r.text}</p>
                          )}

                          {r.timestamp && (
                            <p className={cn(
                              "text-[8px] font-mono mt-2",
                              isCustomerCare ? "text-blue-400/60" : "text-zinc-600"
                            )}>{new Date(r.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Reply Box or Session Ended Indicator */}
                  {trackedInquiry.status === 'ended' ? (
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-left">
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 shrink-0">
                          <PowerOff className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-zinc-300">Session Concluded by Control Room</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">This customer care inquiry has reached completion. You can create a new support session whenever needed.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowInquiryStatus(null);
                          setTrackedInquiry(null);
                          setShowFanCardForm(true);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer text-center"
                      >
                        New Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 space-y-3">
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Send Reply</p>
                      <div className="flex gap-2">
                        <textarea
                          value={userReplyText}
                          onChange={(e) => setUserReplyText(e.target.value)}
                          placeholder="Type a reply to keep the conversation going..."
                          rows={2}
                          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl p-3 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium text-white resize-none"
                        />
                        <button
                          onClick={handleUserReply}
                          disabled={isSendingUserReply || !userReplyText.trim()}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTrackedInquiry(null)}
                      className="py-4 bg-zinc-850 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all border border-white/5"
                    >
                      Back to Search
                    </button>
                    <button 
                      onClick={() => {
                        setShowInquiryStatus(null);
                        setTrackedInquiry(null);
                      }}
                      className="py-4 bg-blue-600/20 border border-blue-500/20 text-blue-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-blue-600 hover:text-white transition-all"
                    >
                      Return to Menu
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero / Landing (If not logged in) */}
      {!user && !dismissedHero && !showLogin && (
        <LandingShowcase
          shopItems={SHOP_ITEMS?.tickets || []}
          onExploreExperiences={() => {
            setDeepLinkExp(null);
            setActiveTab("experiences");
            setDismissedHero(true);
          }}
          onDiscoverGameDay={() => {
            setActiveTab("shop");
            setDismissedHero(true);
          }}
          onOpenTrackInquiry={() => {
            setTrackedInquiry(null);
            setEmailInquiries(null);
            setTrackingEmail("");
            setTrackingId("");
            setShowInquiryStatus("SEARCH");
          }}
          onSelectExperience={(targetId) => {
            setDeepLinkExp({ targetId });
            setActiveTab("experiences");
            setDismissedHero(true);
          }}
          onOpenPlayerInquiry={(prefill) => {
            setDeepLinkExp({ id: "promo-player-inquiry", prefill, nonce: Date.now() });
            setActiveTab("experiences");
            setDismissedHero(true);
          }}
          onOpenCustomerCare={() => setShowFanCardForm(true)}
          onOpenTicketCheck={() => {
            setTicketCheckInitialQuery("");
            setShowTicketCheckModal(true);
          }}
          onOpenSignIn={() => {
            setIsSignUp(false);
            setShowLogin(true);
          }}
          onOpenLegalModal={(tab) => setLegalModalTab(tab)}
          onOpenCeeDeeExperience={() => {
            setActiveTab("ceedee");
            setDismissedHero(true);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOpenWaddleVipCard={() => {
            setShowJayneWaddleModal(true);
          }}
        />
      )}

      {/* Main Dashboard */}
      {(user || dismissedHero) && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-24 lg:pb-0">
          {/* Sidebar */}
          {user && (
            <aside className={cn(
              "bg-zinc-950/40 border-r border-white/5 flex-col shrink-0 transition-all duration-300",
              activeTab === "markets" ? "flex w-full md:w-80 h-[40%] md:h-full" : "hidden md:flex md:w-80"
            )}>
              <div className="p-6 flex items-center justify-between">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input 
                    type="text" 
                    placeholder="Search assets..." 
                    className="w-full bg-zinc-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
                {filteredTeams.map(t => {
                  const price = marketPrices[t.id] || 100;
                  const hist = historicalData[t.id] || [];
                  const change = hist.length > 1 ? ((price - hist[0].price) / hist[0].price) * 100 : 0;
                  return (
                    <button 
                      key={t.id}
                      onClick={() => { setSelectedTeam(t); setActiveTab("markets"); }}
                      className={cn(
                        "w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group",
                        selectedTeam.id === t.id && activeTab === "markets" && "bg-blue-600/10 border-l-4 border-blue-600"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 p-2 group-hover:scale-105 transition-transform">
                          <img src={getLogoUrl(t.id)} alt={t.id} className="w-full h-full object-contain" />
                        </div>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-tight">{t.name}</h3>
                          <p className="text-[10px] font-bold text-zinc-600 uppercase">{t.id} · {t.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-xs font-black">${price.toFixed(2)}</p>
                        <p className={cn("text-[9px] font-black", change >= 0 ? "text-emerald-400" : "text-rose-400")}>
                          {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sidebar Concierge & Track Footer */}
              <div className="p-4 border-t border-white/5 bg-zinc-950/80 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowFanCardForm(true)}
                    className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-blue-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Headphones className="w-3.5 h-3.5 text-blue-400" />
                    Support
                  </button>
                  <button
                    onClick={() => {
                      setTrackedInquiry(null);
                      setEmailInquiries(null);
                      setTrackingEmail("");
                      setTrackingId("");
                      setShowInquiryStatus("SEARCH");
                    }}
                    className="flex-1 py-2.5 px-3 bg-zinc-900 hover:bg-zinc-800 border border-white/10 hover:border-emerald-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Track Ticket
                  </button>
                </div>
              </div>
            </aside>
          )}

          {/* Activity Area */}
          <main className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar">
            {(activeTab === "markets" && !user) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20">
                  <Lock className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-4 leading-none">Exchange Restricted</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-8 max-w-md leading-relaxed">
                  Live franchise trading and order books require an active registered investor account. Create an account or sign in to access the trading terminal.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => { setIsSignUp(true); setShowLogin(true); }} className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg">
                    Create Account
                  </button>
                  <button onClick={() => { setIsSignUp(false); setShowLogin(true); }} className="bg-zinc-900 border border-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    Sign In
                  </button>
                  <button onClick={() => setActiveTab("experiences")} className="bg-transparent border border-white/5 text-zinc-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                    View Experiences
                  </button>
                </div>
              </div>
            ) : activeTab === "markets" && user && (
              <div className="p-4 sm:p-6 md:p-10 space-y-6 md:space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="flex items-center gap-4 md:gap-8">
                    <div className="w-16 h-16 md:w-24 md:h-24 bg-zinc-900 border border-white/5 rounded-2xl md:rounded-3xl p-3 md:p-5 shadow-2xl">
                      <img src={getLogoUrl(selectedTeam.id)} alt={selectedTeam.id} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">{selectedTeam.city} {selectedTeam.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 md:gap-6">
                        <p className="text-2xl md:text-4xl font-mono font-black">${(marketPrices[selectedTeam.id] || 100).toFixed(2)}</p>
                        <div className={cn(
                          "flex items-center gap-1 font-black bg-emerald-500/10 px-2 py-0.5 md:px-3 md:py-1 rounded-lg text-sm md:text-lg",
                          (historicalData[selectedTeam.id]?.length || 0) > 0 && marketPrices[selectedTeam.id] >= historicalData[selectedTeam.id]![0].price ? "text-emerald-400" : "text-rose-400 bg-rose-500/10"
                        )}>
                          <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5" /> 2.45%
                        </div>
                        <div className="hidden xs:block h-4 md:h-6 w-px bg-white/10" />
                        <p className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">Market Cap: {formatCurrency((marketPrices[selectedTeam.id] || 100) * 1000000)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 md:gap-2 bg-zinc-900 p-1 rounded-xl w-fit">
                    {["1H", "1D", "1W", "1M"].map(f => (
                      <button key={f} className={cn("px-3 md:px-4 py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all", f === "1H" ? "bg-white text-black" : "text-zinc-500 hover:text-white")}>{f}</button>
                    ))}
                  </div>
                </div>

                <div className="h-[250px] sm:h-[300px] md:h-[400px] w-full bg-zinc-900/30 rounded-2xl md:rounded-[2.5rem] border border-white/5 p-4 md:p-8 relative">
                   <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historicalData[selectedTeam.id] || []}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis domain={["auto", "auto"]} hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: "16px", background: "#09090b", border: "1px solid #27272a", color: "#fff" }}
                        itemStyle={{ fontWeight: "bold" }}
                        labelStyle={{ display: "none" }}
                      />
                      <Area type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                  <div className="bg-zinc-900/50 rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[.25em]">Market Execution</h3>
                      <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> SECURE
                      </div>
                    </div>
                    {user ? (
                      <>
                        <div className="mb-8">
                          <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-600 mb-4 tracking-widest">Quantity</label>
                          <div className="flex items-center gap-4 bg-zinc-950 p-2 rounded-2xl border border-white/5">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-colors">-</button>
                            <input type="number" value={quantity} onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} className="flex-1 bg-transparent text-center font-mono font-black text-lg md:text-xl outline-none" />
                            <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 md:w-12 md:h-12 bg-zinc-800 rounded-xl font-bold hover:bg-zinc-700 transition-colors">+</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleTrade("buy")} className="bg-emerald-500 hover:bg-emerald-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 uppercase tracking-widest text-xs">Buy</button>
                          <button onClick={() => handleTrade("sell")} className="bg-rose-500 hover:bg-rose-400 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-500/20 uppercase tracking-widest text-xs">Sell</button>
                        </div>
                      </>
                    ) : (
                      <div className="py-4 text-center space-y-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto text-blue-500">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider text-white mb-1.5">Trading Portfolio Locked</h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase leading-relaxed max-w-xs mx-auto">
                            You must create an account or sign in with Google to buy and sell {selectedTeam.name} franchise equity.
                          </p>
                        </div>
                        <button 
                          onClick={() => setShowLogin(true)} 
                          className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                        >
                          Initialize Portfolio
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-zinc-900/50 rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5">
                    <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[.25em] mb-8">Asset Concentration</h3>
                    {portfolio.find(p => p.teamId === selectedTeam.id && p.shares > 0) ? (
                      <div className="space-y-4 md:space-y-6">
                        <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                          <span className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase">Equity Stake</span>
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">{portfolio.find(p => p.teamId === selectedTeam.id).shares.toLocaleString()} Units</span>
                        </div>
                        <div className="flex justify-between items-center py-3 md:py-4 border-b border-white/5">
                          <span className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase">Average Basis</span>
                          <span className="text-[10px] md:text-xs font-mono font-black text-white">${portfolio.find(p => p.teamId === selectedTeam.id).avgPrice.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center py-4">
                          <span className="text-xs text-zinc-500 font-bold uppercase">Unrealized P/L</span>
                          <span className="text-xs font-mono font-black text-emerald-400">
                            +{formatCurrency((marketPrices[selectedTeam.id] - portfolio.find(p => p.teamId === selectedTeam.id).avgPrice) * portfolio.find(p => p.teamId === selectedTeam.id).shares)}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                        <ChartIcon className="w-10 h-10 mb-4" />
                        <p className="text-xs font-bold uppercase tracking-widest">No Active Position</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "draft" && !user) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-20 text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20">
                  <Lock className="w-10 h-10 text-blue-500" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter mb-4 leading-none">Speculation Locked</h2>
                <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mb-8 max-w-md leading-relaxed">
                  Draft speculation and rookie asset trading are restricted to authenticated accounts. Create an account or sign in to participate.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button onClick={() => { setIsSignUp(true); setShowLogin(true); }} className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-lg">
                    Create Account
                  </button>
                  <button onClick={() => { setIsSignUp(false); setShowLogin(true); }} className="bg-zinc-900 border border-white/10 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all">
                    Sign In
                  </button>
                  <button onClick={() => setActiveTab("experiences")} className="bg-transparent border border-white/5 text-zinc-400 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                    View Experiences
                  </button>
                </div>
              </div>
            ) : activeTab === "draft" && user && (
              <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-10">
                <div className="text-center max-w-3xl mx-auto py-6 md:py-10">
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 leading-none">Draft Speculation</h2>
                  <p className="text-zinc-500 text-sm md:text-lg uppercase tracking-tight font-medium px-4">Predict the future. Trade rookie-assets before they hit the big stage.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 pb-20">
                  {[
                    { id: "CW", name: "Caleb Williams", pos: "QB", school: "USC", price: 142.50 },
                    { id: "DM", name: "Drake Maye", pos: "QB", school: "UNC", price: 118.20 },
                    { id: "MH", name: "Marvin Harrison Jr.", pos: "WR", school: "OSU", price: 105.15 },
                    { id: "JD", name: "Jayden Daniels", pos: "QB", school: "LSU", price: 92.40 },
                    { id: "BN", name: "Bo Nix", pos: "QB", school: "ORE", price: 78.50 },
                    { id: "MN", name: "Malik Nabers", pos: "WR", school: "LSU", price: 89.90 }
                  ].map(p => (
                    <div key={p.id} className="bg-zinc-900 border border-white/5 rounded-[2rem] p-6 hover:border-blue-600/50 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                         <TrendingUp className="w-20 h-20 text-blue-500" />
                      </div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-xs text-zinc-400">{p.pos}</div>
                        <div className="text-right">
                          <p className="font-mono font-black text-white">${p.price.toFixed(2)}</p>
                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">+12.4% ACTIVE</p>
                        </div>
                      </div>
                      <h3 className="text-lg font-black uppercase tracking-tight italic mb-1">{p.name}</h3>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{p.school}</p>
                      <button className="w-full mt-8 py-3 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-zinc-200 transition-all">Acquire Position</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dedicated Buy Team Stocks Gateway for Non-Logged In Users */}
            {(activeTab === ("stocks" as any) && !user) && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 md:p-20 text-center max-w-4xl mx-auto my-auto">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8 border border-blue-500/20 shadow-xl">
                  <Lock className="w-10 h-10 text-blue-500" />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest mb-6">
                  Franchise Equity Trading
                </div>
                <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter mb-6 leading-none">
                  Buy Franchise Team Equities
                </h2>
                <p className="text-zinc-400 font-medium text-sm sm:text-base mb-10 max-w-xl mx-auto leading-relaxed">
                  Access live valuation charts for all 32 franchises, trade team equity shares in real time, and build your sports portfolio. Create a free account or sign in to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto justify-center">
                  <button 
                    onClick={() => { setIsSignUp(true); setShowLogin(true); }} 
                    className="bg-white text-black px-10 py-4 sm:py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4 text-blue-600" /> Create Account to Trade
                  </button>
                  <button 
                    onClick={() => { setIsSignUp(false); setShowLogin(true); }} 
                    className="bg-zinc-900 border border-white/10 text-white px-8 py-4 sm:py-5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-zinc-800 transition-all active:scale-95"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {activeTab === "care" && (
              <SupportTrustSection
                onOpenCustomerCare={() => setShowFanCardForm(true)}
                onOpenTrackInquiry={() => {
                  setTrackedInquiry(null);
                  setEmailInquiries(null);
                  setTrackingEmail("");
                  setTrackingId("");
                  setShowInquiryStatus("SEARCH");
                }}
                onOpenTicketCheck={() => {
                  setTicketCheckInitialQuery("");
                  setShowTicketCheckModal(true);
                }}
                onOpenLegalModal={(tab) => setLegalModalTab(tab)}
              />
            )}

            {activeTab === "shop" && (
              <ArenaShop 
                SHOP_ITEMS={SHOP_ITEMS} 
                selectedTeam={selectedTeam} 
                handleStorePurchase={handleStorePurchase} 
                setShowFanCardForm={setShowFanCardForm} 
                activeTicket={activeTicket}
                setShowInquiryStatus={setShowInquiryStatus}
              />
            )}

            {activeTab === "ceedee" && (
              <CeeDeeLambExperiencePage
                onBackToSite={() => {
                  setActiveTab("experiences");
                  setDismissedHero(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onOpenTicketPortal={(queryText) => {
                  setTicketCheckInitialQuery(queryText || "");
                  setShowTicketCheckModal(true);
                }}
                onOpenSupport={() => setShowFanCardForm(true)}
              />
            )}

            {activeTab === "experiences" && (
              <div className="p-4 sm:p-6 md:p-10 space-y-12">
                {/* TOP FEATURED EVENT: CeeDee Lamb Public Meet & Greet – December 10th – $100 */}
                <div
                  className="rounded-3xl border border-[#B0B7BC]/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg, #030712 0%, #002244 55%, #003594 100%)"
                  }}
                >
                  <img
                    src="/assets/aistudio/IMG_1832_f33e4b9e.jpeg"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-[72%_18%] opacity-25 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#030712]/95 via-[#040B1A]/80 to-[#003594]/50 pointer-events-none" />
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                    <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border border-[#B0B7BC]/40 bg-[#030712] shrink-0 shadow-lg">
                      <img
                        src="/assets/aistudio/IMG_1832_f33e4b9e.jpeg"
                        alt="CeeDee Lamb #88 Dallas Cowboys"
                        className="w-full h-full object-cover object-[center_18%]"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8]" />
                        <span>Dallas Cowboys #88 · December 10th · AT&amp;T Stadium, Arlington, TX · $100 Admission</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                        CEEDÉE LAMB PUBLIC MEET &amp; GREET
                      </h3>
                      <p className="text-xs sm:text-sm text-[#E2E8F0] max-w-xl leading-relaxed">
                        Get ready for an unforgettable fan experience! Join us on December 10th at AT&amp;T Stadium in Arlington, Texas for an exclusive opportunity to meet CeeDee Lamb in person. Limited slots — $100 per ticket.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        setDeepLinkExp({
                          id: "promo-ceedee-dec10",
                          prefill: {
                            playerName: "CeeDee Lamb",
                            teamId: "DAL",
                            objective: "Public Meet & Greet — December 10th ($100)",
                          },
                          nonce: Date.now(),
                        });
                      }}
                      className="px-6 py-3.5 bg-gradient-to-r from-[#003594] via-[#1D4ED8] to-[#003594] hover:brightness-115 text-white border border-[#B0B7BC]/35 font-black uppercase text-xs tracking-wider rounded-xl shadow-xl transition-all cursor-pointer"
                    >
                      SECURE YOUR SLOT ($100)
                    </button>
                  </div>
                </div>

                {/* Visual advertising rotating banners */}
                <PromoSlider 
                  onActionClick={(banner) => {
                    if (banner.id === "promo-podcast-bo-nix" || banner.id?.includes("podcast")) {
                      setSelectedInquiryCategory("podcast");
                      setSelectedInquiryPlayer("Bo Nix");
                      setShowFanCardForm(true);
                    } else {
                      setDeepLinkExp(banner);
                    }
                  }}
                />

                {/* Experiences listings and bookings core */}
                <ExperiencesSection 
                  initialTargetExperience={deepLinkExp}
                  onRequestLoginModal={() => setShowLogin(true)}
                  onNotifyCheckout={() => {
                    console.log("Invoice finalized.");
                  }}
                  onOpenPodcastInquiry={(player, showTitle) => {
                    setSelectedInquiryCategory("podcast");
                    setSelectedInquiryPlayer(player || "Bo Nix");
                    if (showTitle) setPodcastShowInput(showTitle);
                    setShowFanCardForm(true);
                  }}
                  onOpenCommemorativeTicket={() => setShowVipCommemorativeModal(true)}
                  onOpenTicketPortal={(queryText) => {
                    setTicketCheckInitialQuery(queryText || "");
                    setShowTicketCheckModal(true);
                  }}
                  onOpenSupport={() => setShowFanCardForm(true)}
                  onOpenLegalModal={(tab) => setLegalModalTab(tab || "about")}
                />

                {/* FEATURED PLAYERS & EXCLUSIVE VIP EVENTS (Moved from Top Section) */}
                <div className="pt-4 border-t border-white/10 space-y-6">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">
                      Additional Featured Players &amp; Private VIP Experiences
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-1">
                      Featured Player Lineup &amp; Exclusive VIP Packages
                    </h3>
                  </div>

                  {/* Exclusive CeeDee Lamb Private Fan Experience Banner (Moved Down) */}
                  <div
                    className="rounded-3xl border border-[#D4AF37]/45 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, #030714 0%, #041E42 58%, #0A2E5C 100%)"
                    }}
                  >
                    <img
                      src="/assets/aistudio/IMG_1832_f33e4b9e.jpeg"
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover object-[72%_18%] opacity-25 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#030714]/95 via-[#041E42]/80 to-[#041E42]/55 pointer-events-none" />
                    <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                      <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border border-[#D4AF37]/45 bg-[#030714] shrink-0 shadow-lg">
                        <video
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-cover object-center"
                        >
                          <source src="/assets/ceedee_lamb_meet_greet.mp4" type="video/mp4" />
                          <source src="/assets/aistudio/8da36c2f93d942ae940bac3b1a95872d_bf09d367.mov" type="video/quicktime" />
                        </video>
                      </div>
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-[#D4AF37]/15 border border-[#D4AF37]/40 px-3 py-1 rounded-full">
                          <Trophy className="w-3.5 h-3.5 text-[#F3D97D]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F3D97D]">
                            Dallas Cowboys · December 27, 2026 · Arlington, Texas
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                          EXCLUSIVE CEEDÉE LAMB FAN EXPERIENCE
                        </h3>
                        <p className="text-xs sm:text-sm text-[#C4CDD5] max-w-xl">
                          Personal meet and greet with CeeDee Lamb, exclusive stadium tour, signed merchandise, and photo opportunity. Total package $1,000 or two installments of $500 each.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab("ceedee");
                          setDismissedHero(true);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="px-6 py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#EBD078] to-[#C9A227] hover:brightness-110 text-[#041E42] font-black uppercase text-xs tracking-wider rounded-xl shadow-xl transition-all cursor-pointer"
                      >
                        SECURE YOUR EXPERIENCE ($1,000)
                      </button>
                    </div>
                  </div>

                  {/* Denver Broncos Jaylen Waddle VIP Fan Card Banner (Moved Down) */}
                  <div
                    className="rounded-3xl border border-[#FB4F14]/60 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden"
                    style={{
                      background:
                        "linear-gradient(135deg, #002244 0%, #102a4c 50%, #FB4F14 100%)"
                    }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FB4F14]/20 rounded-full blur-3xl pointer-events-none" />
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 relative z-10">
                      <div className="w-24 sm:w-28 aspect-[3/4] rounded-2xl overflow-hidden border border-[#FB4F14]/50 bg-[#002244] shrink-0 shadow-lg">
                        <img
                          src="/assets/aistudio/IMG_1602_16c645b7.webp"
                          alt="Jaylen Waddle Denver Broncos VIP Fan"
                          className="w-full h-full object-cover object-center"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 bg-[#FB4F14]/20 border border-[#FB4F14]/40 px-3 py-1 rounded-full">
                          <Sparkles className="w-3.5 h-3.5 text-[#FB4F14]" />
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FB4F14]">
                            Denver Broncos · Season 2026
                          </span>
                        </div>
                        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
                          Jaylen Waddle (#17) · Exclusive VIP Fan Card
                        </h3>
                        <p className="text-xs sm:text-sm text-zinc-200 max-w-xl">
                          “An Extraordinary Experience. An Unforgettable Memory.” Explore the luxurious VIP fan membership card, flexible $1,000 installment plan, and priority access.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0 relative z-10">
                      <button
                        type="button"
                        onClick={() => setShowJayneWaddleModal(true)}
                        className="px-6 py-3.5 bg-gradient-to-r from-[#FB4F14] to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-xl transition-all cursor-pointer hover:scale-[1.02]"
                      >
                        View Jaylen Waddle VIP Fan Card ($1,000)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === "admin" && user?.email === "alexwtchmn@gmail.com" && (
              <AdminPortal user={user} />
            )}

            {(activeTab === "portfolio" && !user) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8">
                  <History className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Portfolio Offline</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-10 max-w-md">Login to synchronize your global franchise holdings and live equity valuations.</p>
                <button onClick={() => setShowLogin(true)} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Sync Portfolio</button>
              </div>
            ) : activeTab === "portfolio" && (
              <div className="p-4 sm:p-6 md:p-10 space-y-8 md:space-y-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
                  <div className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Portfolio Value</p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-white">{formatCurrency(totalValue)}</p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Available Cash</p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-emerald-400">{formatCurrency(balance)}</p>
                  </div>
                  <div className="bg-zinc-900/50 p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-white/5 sm:col-span-2 md:col-span-1">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Total ROI</p>
                    <p className="text-2xl md:text-3xl font-mono font-black text-white">+14.2%</p>
                  </div>
                </div>

                {/* Exclusive Jayne Welage Minnesota Vikings VIP Invitation Highlight */}
                {user?.email === "institutional@gridiron.exchange" && (
                  <div
                    className="rounded-3xl border border-[#D4AF37]/55 p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 shadow-2xl"
                    style={{
                      background:
                        "linear-gradient(125deg, #2B0F4E 0%, #4F2683 45%, #0B0613 100%)"
                    }}
                  >
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#F6E27A] block">
                        MINNESOTA VIKINGS VIP EXPERIENCE · MARCH 14, 2027 · 5:30 PM
                      </span>
                      <h3 className="font-luxury text-2xl sm:text-3xl font-bold uppercase tracking-wider text-white">
                        THE ULTIMATE VIP EXPERIENCE — JAYNE WELAGE
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-200 max-w-2xl">
                        Private Meet &amp; Greet + Investment &amp; Networking Party · Black Tie Elegance · One Month After Super Bowl LXI.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowJayneVipModal(true)}
                        className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F3D97D] text-[#0E0719] font-extrabold uppercase text-xs tracking-wider cursor-pointer shadow-lg hover:brightness-105 transition-all"
                      >
                        Open VIP Invitation &amp; Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => generateTicketPDF(JAYNE_WELAGE_PASS_DATA)}
                        className="min-h-[44px] px-4 py-2.5 rounded-xl bg-black/50 hover:bg-black/75 border border-[#D4AF37]/50 text-[#F6E27A] font-bold uppercase text-xs tracking-wider cursor-pointer transition-all"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-zinc-900/50 rounded-2xl md:rounded-[2.5rem] border border-white/5 overflow-hidden">
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left min-w-[600px]">
                      <thead className="bg-zinc-950/50 border-b border-white/5">
                        <tr>
                          <th className="p-4 sm:p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Asset</th>
                          <th className="p-4 sm:p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Shares</th>
                          <th className="p-4 sm:p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Basis</th>
                          <th className="p-4 sm:p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right hidden sm:table-cell">Market Price</th>
                          <th className="p-4 sm:p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Total Equity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {portfolio.filter(p => p.shares > 0).map(p => {
                          const team = NFL_TEAMS.find(t => t.id === p.teamId)!;
                          const price = marketPrices[p.teamId] || p.avgPrice;
                          return (
                            <tr key={p.teamId} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => { setSelectedTeam(team); setActiveTab("markets"); }}>
                              <td className="p-4 sm:p-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-zinc-900 rounded-lg p-1.5 sm:p-2 border border-white/5">
                                    <img src={getLogoUrl(p.teamId)} alt={p.teamId} className="w-full h-full object-contain" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] sm:text-xs font-black uppercase italic">{team.name}</p>
                                    <p className="text-[8px] sm:text-[10px] font-bold text-zinc-600 uppercase">{team.id}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 sm:p-6 text-right font-mono text-[10px] sm:text-xs font-bold">{p.shares.toLocaleString()}</td>
                              <td className="p-4 sm:p-6 text-right font-mono text-[10px] sm:text-xs font-bold">${p.avgPrice.toFixed(2)}</td>
                              <td className="p-4 sm:p-6 text-right font-mono text-[10px] sm:text-xs font-black text-emerald-400 hidden sm:table-cell">${price.toFixed(2)}</td>
                              <td className="p-4 sm:p-6 text-right font-mono text-[10px] sm:text-xs font-black">{formatCurrency(p.shares * price)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Active Experience booked tickets list */}
                {userBookings && userBookings.length > 0 && (
                  <div className="space-y-6 pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-xl font-black italic uppercase tracking-tighter text-white flex items-center gap-2">
                          <Ticket className="w-5 h-5 text-emerald-400" /> My Active Passes
                        </h4>
                        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Authorized tickets & secure access passes for upcoming VIP NFL events.</p>
                      </div>
                      <button
                        onClick={() => {
                          setTicketCheckInitialQuery(user?.email || "");
                          setShowTicketCheckModal(true);
                        }}
                        className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-850 border border-emerald-500/30 hover:border-emerald-400 text-emerald-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-sm self-start sm:self-auto"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        Ticket Portal & PDF Downloads
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userBookings.map((b: any, bIdx: number) => (
                        <div key={`${b.id || b.orderId || bIdx}-${bIdx}`} className="p-5 bg-zinc-900/80 border border-white/10 rounded-[2rem] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 hover:border-white/20 transition-all">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <NFLImage item={b} className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-white/5 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className={cn(
                                "inline-flex px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest mb-1.5",
                                b.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              )}>
                                {b.status === "approved" ? "AUTHORIZED & APPROVED" : "PENDING CONTROL ROOM AUDIT"}
                              </span>
                              <h5 className="text-xs font-black uppercase tracking-tight text-white truncate">{b.experienceTitle}</h5>
                              <p className="text-[9px] font-black text-zinc-500 font-mono uppercase mt-0.5">{b.tier?.toUpperCase()} · {b.date} · {b.timeSlot}</p>
                              <p className="text-[8px] font-mono font-black text-blue-400 mt-1 uppercase select-all">PASSCODE: {b.qrCode}</p>
                            </div>
                          </div>

                          <div className="w-full sm:w-auto flex sm:flex-col items-center gap-2 shrink-0">
                            {b.status === "approved" ? (
                              <button
                                onClick={() => generateTicketPDF(b)}
                                className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer active:scale-95"
                                title="Download official ticket PDF with QR code"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setTicketCheckInitialQuery(b.id || b.qrCode || "");
                                  setShowTicketCheckModal(true);
                                }}
                                className="w-full sm:w-auto px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                Check Status
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Persistent Legal & Transparency Footer across Dashboard Views */}
            <footer className="mt-auto border-t border-[#013369]/50 bg-[#03050C] px-6 sm:px-10 py-8">
              <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-xl">
                  <div className="flex items-center gap-2.5">
                    <GridironBrandMark size="sm" />
                    <span className="text-sm font-bold text-white">{CHARITY_ALLOCATION.operatorLegalName}</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {CHARITY_ALLOCATION.websiteDomain} is operated by {CHARITY_ALLOCATION.operatorLegalName}. Each $100 Meet &amp; Greet Invitation includes a ${CHARITY_ALLOCATION.coordinationFeeUsd}.00 coordination fee and a ${CHARITY_ALLOCATION.charitableContributionUsd}.00 charitable contribution toward {CHARITY_ALLOCATION.beneficiary}.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {([
                    { id: "about", label: "About Us" },
                    { id: "contact", label: "Contact" },
                    { id: "charity", label: "Charitable Initiative" },
                    { id: "privacy", label: "Privacy Policy" },
                    { id: "terms", label: "Terms & Conditions" },
                    { id: "refund", label: "Refund Policy" },
                  ] as { id: LegalTabId; label: string }[]).map((link) => (
                    <button
                      key={link.id}
                      type="button"
                      onClick={() => setLegalModalTab(link.id)}
                      className="px-3 py-2 min-h-[40px] rounded-xl bg-[#08112B]/80 hover:bg-[#013369] border border-white/10 hover:border-blue-400/50 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
                    >
                      {link.label}
                    </button>
                  ))}
                </div>
              </div>
            </footer>
          </main>
        </div>
      )}

      {/* Fan Card Modal */}
      <AnimatePresence>
        {showFanCardForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={() => { setShowFanCardForm(false); setInquirySuccess(null); }}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
              <button onClick={() => { setShowFanCardForm(false); setInquirySuccess(null); setOngoingSessionAlert(null); }} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              {ongoingSessionAlert ? (
                <div className="text-left py-2 space-y-6">
                  <div className="p-4 sm:p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl sm:rounded-3xl flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase text-amber-300 tracking-tight flex items-center gap-2">
                        Active Support Session In Progress
                      </h3>
                      <p className="text-xs text-zinc-300 font-medium mt-1 leading-relaxed">
                        We noticed you already have an ongoing customer support session registered under <span className="font-mono text-white font-bold">{ongoingSessionAlert.userEmail}</span> that is still active and awaiting resolution or response from the Control Room.
                      </p>
                    </div>
                  </div>

                  <div className="bg-zinc-950 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/10 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Ticket Reference</p>
                        <p className="font-mono text-sm font-black text-white">{ongoingSessionAlert.id}</p>
                      </div>
                      <span className={cn(
                        "px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border",
                        ongoingSessionAlert.status === 'responded' 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                      )}>
                        {ongoingSessionAlert.status === 'responded' ? "Care Team Responded" : "Awaiting Agent / Active"}
                      </span>
                    </div>

                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Your Inquiry Message</p>
                      <p className="text-xs text-zinc-300 bg-zinc-900/80 p-3.5 rounded-xl border border-white/5 font-medium leading-relaxed">
                        "{ongoingSessionAlert.message}"
                      </p>
                    </div>

                    {ongoingSessionAlert.replies && ongoingSessionAlert.replies.length > 0 && (
                      <div className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1.5 pt-1">
                        <MessageSquareText className="w-3.5 h-3.5" />
                        {ongoingSessionAlert.replies.length} update(s) in active thread
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const sid = ongoingSessionAlert.id;
                        setOngoingSessionAlert(null);
                        setDetectedOngoingSession(null);
                        setShowFanCardForm(false);
                        setShowInquiryStatus(sid);
                        trackInquiry(sid);
                      }}
                      className="w-full py-4.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <MessageSquareText className="w-4 h-4" />
                      Click to Continue Previous Session
                    </button>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setOngoingSessionAlert(null);
                        }}
                        className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                      >
                        Change Email Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOngoingSessionAlert(null);
                          setShowFanCardForm(false);
                        }}
                        className="flex-1 py-3 bg-zinc-950 border border-white/5 text-zinc-500 hover:text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : inquirySuccess ? (
                <div className="text-center py-6 space-y-6">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  
                  <div className="space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">Inquiry Delivered</h2>
                    <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">Your message has been successfully logged</p>
                  </div>

                  <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-sm mx-auto">
                    To prevent double submissions, please keep track of your ticket. Use your ticket reference ID to see live responses from Customer Care:
                  </p>

                  <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                    <span className="font-mono text-base sm:text-lg font-black text-white tracking-widest pl-2">
                      {inquirySuccess}
                    </span>
                    <button 
                      onClick={() => copyToClipboard(inquirySuccess, "inquiry-ticket")}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied === "inquiry-ticket" ? "Copied" : "Copy"}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <button
                      onClick={() => {
                        setShowInquiryStatus(inquirySuccess);
                        setInquirySuccess(null);
                        setShowFanCardForm(false);
                        trackInquiry(inquirySuccess);
                      }}
                      className="flex-grow py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      View Live Thread
                    </button>
                    <button
                      onClick={() => {
                        setInquirySuccess(null);
                        setShowFanCardForm(false);
                      }}
                      className="flex-grow py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-black italic uppercase tracking-tighter leading-none text-white">Customer Care</h2>
                      <p className="text-zinc-500 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.1em] mt-1 italic">NFL Exchange Concierge & Support Terminal</p>
                    </div>
                  </div>

                  {/* Mode switcher inside the modal */}
                  <div className="flex bg-zinc-950 p-1 rounded-2xl border border-white/10 mb-5">
                    <button
                      type="button"
                      className="flex-1 py-2.5 bg-blue-600 text-white font-black uppercase text-[10px] tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5"
                    >
                      <MessageSquareText className="w-3.5 h-3.5" />
                      New Inquiry
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowFanCardForm(false);
                        setTrackedInquiry(null);
                        setEmailInquiries(null);
                        setTrackingEmail("");
                        setTrackingId("");
                        setShowInquiryStatus("SEARCH");
                      }}
                      className="flex-1 py-2.5 text-zinc-400 hover:text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5 text-blue-400" />
                      Track Existing
                    </button>
                  </div>

                  {/* Active ongoing session alert ribbon if detected */}
                  {detectedOngoingSession && (
                    <div className="mb-4 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3 text-left">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black uppercase text-amber-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          Ongoing Session Active ({detectedOngoingSession.id})
                        </p>
                        <p className="text-[9px] text-zinc-400 truncate mt-0.5">
                          {detectedOngoingSession.message}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const sid = detectedOngoingSession.id;
                          setDetectedOngoingSession(null);
                          setOngoingSessionAlert(null);
                          setShowFanCardForm(false);
                          setShowInquiryStatus(sid);
                          trackInquiry(sid);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer shadow-md"
                      >
                        Continue Session
                      </button>
                    </div>
                  )}
                  
                  <form onSubmit={handleFanCardRequest} className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Full Name / Identifier</label>
                        <input 
                          name="name" 
                          required 
                          disabled={isSubmittingInquiry} 
                          defaultValue={user?.displayName || ""} 
                          autoComplete="off"
                          placeholder="Your full name or identifier" 
                          className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50 text-white" 
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Email Address</label>
                        <input 
                          type="email" 
                          name="email" 
                          required 
                          disabled={isSubmittingInquiry} 
                          defaultValue={user?.email || formEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormEmail(val);
                            if (val && val.includes("@") && val.includes(".")) {
                              checkForOngoingSession(val).then((active) => {
                                setDetectedOngoingSession(active);
                              });
                            } else {
                              setDetectedOngoingSession(null);
                            }
                          }}
                          autoComplete="off"
                          placeholder="name@example.com" 
                          className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50 text-white" 
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Inquiry Category</label>
                        <select 
                          name="category" 
                          disabled={isSubmittingInquiry} 
                          value={selectedInquiryCategory}
                          onChange={(e) => setSelectedInquiryCategory(e.target.value)}
                          className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold uppercase transition-all disabled:opacity-50 text-white"
                        >
                          <option value="podcast">🎙️ Player Podcast Reservation & Studio Session</option>
                          <option value="player_experience">🏈 Player Private Experience & Custom Booking</option>
                          <option value="general">General Support & Customer Care</option>
                          <option value="passes">VIP Experiences & Match Passes</option>
                          <option value="merchandise">Arena Shop & Merchandise Orders</option>
                          <option value="wallet">Wallet & Transaction Assistance</option>
                          <option value="pricing">Franchise Asset & Equity Pricing</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Franchise Asset (Optional)</label>
                        <select 
                          name="team" 
                          disabled={isSubmittingInquiry} 
                          defaultValue={selectedTeam.id} 
                          className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold uppercase transition-all disabled:opacity-50 text-white"
                        >
                          {NFL_TEAMS.map(t => <option key={t.id} value={t.id}>{t.city} {t.name} - Asset Allocation</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Specialized Athlete & Podcast Selection Module */}
                    {(selectedInquiryCategory === "podcast" || selectedInquiryCategory === "player_experience") && (
                      <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-blue-950/40 border border-purple-500/30 rounded-2xl p-4 sm:p-5 space-y-4 text-left">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <Radio className="w-4 h-4 text-purple-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                              {selectedInquiryCategory === "podcast" ? "Podcast Guest Appearance Reservation" : "Player Concierge Scheduling"}
                            </span>
                          </div>
                          <span className="text-[8px] font-mono text-zinc-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded">
                            Verified NFL Talent
                          </span>
                        </div>

                        {/* Player Selector */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[8px] md:text-[9px] font-black uppercase text-purple-300 mb-1.5 tracking-wider">Target Player / Athlete</label>
                            <select
                              name="targetPlayer"
                              value={selectedInquiryPlayer}
                              onChange={(e) => setSelectedInquiryPlayer(e.target.value)}
                              disabled={isSubmittingInquiry}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 font-bold text-white uppercase"
                            >
                              <option value="Bo Nix">Bo Nix (Denver Broncos - QB)</option>
                              <option value="Justin Jefferson">Justin Jefferson (Minnesota Vikings - WR)</option>
                              <option value="Patrick Mahomes">Patrick Mahomes (Kansas City Chiefs - QB)</option>
                              <option value="Drake Maye">Drake Maye (New England Patriots - QB)</option>
                              <option value="Jalen Pitre">Jalen Pitre (Houston Texans - S)</option>
                              <option value="Lamar Jackson">Lamar Jackson (Baltimore Ravens - QB)</option>
                              <option value="Josh Allen">Josh Allen (Buffalo Bills - QB)</option>
                              <option value="C.J. Stroud">C.J. Stroud (Houston Texans - QB)</option>
                              <option value="Travis Kelce">Travis Kelce (Kansas City Chiefs - TE)</option>
                              <option value="Caleb Williams">Caleb Williams (Chicago Bears - QB)</option>
                              <option value="other">Other NFL Player / Custom Request</option>
                            </select>
                          </div>

                          {selectedInquiryPlayer === "other" ? (
                            <div>
                              <label className="block text-[8px] md:text-[9px] font-black uppercase text-purple-300 mb-1.5 tracking-wider">Specify Player Name & Team</label>
                              <input
                                name="customPlayer"
                                value={customPlayerName}
                                onChange={(e) => setCustomPlayerName(e.target.value)}
                                disabled={isSubmittingInquiry}
                                placeholder="e.g. Derrick Henry - Baltimore Ravens"
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[8px] md:text-[9px] font-black uppercase text-purple-300 mb-1.5 tracking-wider">Podcast / Show Name</label>
                              <input
                                name="podcastShow"
                                value={podcastShowInput}
                                onChange={(e) => setPodcastShowInput(e.target.value)}
                                disabled={isSubmittingInquiry}
                                placeholder="e.g. The Gridiron Breakdown / YouTube Show"
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* Format & Recording Window (if podcast) */}
                        {selectedInquiryCategory === "podcast" && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            <div>
                              <label className="block text-[8px] md:text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-wider">Recording Format</label>
                              <select
                                name="podcastFormat"
                                value={podcastFormatInput}
                                onChange={(e) => setPodcastFormatInput(e.target.value)}
                                disabled={isSubmittingInquiry}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="Virtual Studio Stream (Riverside.fm / Zoom 4K)">Virtual Studio Stream (Riverside.fm / Zoom 4K)</option>
                                <option value="In-Studio Recording (Denver, CO Studio)">In-Studio Recording (Denver, CO Studio)</option>
                                <option value="On-Location / Team Facility Media Room">On-Location / Team Facility Media Room</option>
                                <option value="Live Stage / Tour Guest Appearance">Live Stage / Tour Guest Appearance</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[8px] md:text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-wider">Preferred Window</label>
                              <select
                                name="podcastWindow"
                                value={podcastWindowInput}
                                onChange={(e) => setPodcastWindowInput(e.target.value)}
                                disabled={isSubmittingInquiry}
                                className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-purple-500"
                              >
                                <option value="Next 1-2 Weeks (Priority Window)">Next 1-2 Weeks (Priority Window)</option>
                                <option value="Next 3-4 Weeks (Mid-Season)">Next 3-4 Weeks (Mid-Season)</option>
                                <option value="Post-Game Media Day / Bye Week">Post-Game Media Day / Bye Week</option>
                                <option value="Off-Season / Studio Tour">Off-Season / Studio Tour</option>
                                <option value="Flexible Producer Schedule">Flexible Producer Schedule</option>
                              </select>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] font-bold text-zinc-400 pt-1">
                          <span>Concierge Direct: <strong className="text-white">{selectedInquiryPlayer === 'other' ? (customPlayerName || 'Requested Athlete') : selectedInquiryPlayer}</strong></span>
                          <span className="text-purple-300">Customer Care responds in real-time</span>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Contact Handle / Phone</label>
                      <input 
                        name="contact" 
                        required 
                        disabled={isSubmittingInquiry} 
                        defaultValue=""
                        autoComplete="off"
                        placeholder="e.g. Email: name@domain.com / Phone: +1 555-0199 / Telegram: @handle" 
                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50 text-white" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">
                        {selectedInquiryCategory === "podcast" ? "Show Notes & Interview Synopsis" : "Inquiry Details"}
                      </label>
                      <textarea 
                        name="message" 
                        required 
                        disabled={isSubmittingInquiry} 
                        rows={3} 
                        placeholder={
                          selectedInquiryCategory === "podcast" 
                            ? `Describe your show format, topics, planned interview duration (e.g. 45-60 min), and recording window for ${selectedInquiryPlayer === 'other' ? (customPlayerName || 'the athlete') : selectedInquiryPlayer}...` 
                            : selectedInquiryCategory === "player_experience"
                              ? `Describe your custom event, private appearance, or VIP booking request for ${selectedInquiryPlayer === 'other' ? (customPlayerName || 'the athlete') : selectedInquiryPlayer}...`
                              : "Describe your inquiry, order, or concierge support request. Our customer care team responds in real-time..."
                        } 
                        className="w-full bg-zinc-950 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50 text-white resize-none" 
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingInquiry}
                      className={cn(
                        "w-full py-4.5 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer",
                        selectedInquiryCategory === "podcast"
                          ? "bg-[#013369] hover:bg-blue-700 shadow-blue-600/25"
                          : "bg-[#2563EB] hover:bg-blue-500 shadow-blue-600/20"
                      )}
                    >
                      {isSubmittingInquiry ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          DELIVERING INQUIRY...
                        </>
                      ) : (
                        <>
                          {selectedInquiryCategory === "podcast" ? (
                            <>
                              <Radio className="w-4 h-4 text-purple-200" />
                              RESERVE PODCAST SESSION WITH {selectedInquiryPlayer === 'other' ? (customPlayerName.toUpperCase() || 'PLAYER') : selectedInquiryPlayer.toUpperCase()}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              SUBMIT TO CUSTOMER CARE
                            </>
                          )}
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 sm:p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#013369] via-white to-[#D50A0A]" />
              <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              <div className="text-center mb-8 md:mb-10">
                <GridironBrandMark size="lg" className="mx-auto mb-5" />
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">Member Portal</h2>
                <p className="text-zinc-400 text-[10px] mt-2 uppercase tracking-[0.35em] font-bold leading-relaxed px-4 text-center">Gridiron Fan Hospitality Account</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {authError === "POPUP_BLOCKED" ? (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl space-y-3 text-left">
                    <div className="flex gap-2.5 items-start text-amber-300">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      <div className="space-y-1">
                        <span className="text-[11px] font-black uppercase tracking-wider block">
                          Browser Blocked Google Sign-In Popup
                        </span>
                        <p className="text-[10px] text-zinc-400 normal-case leading-relaxed font-medium">
                          Because this terminal is running in a sandboxed preview iframe, your browser prevented Google's authentication window from opening. Choose a quick option below:
                        </p>
                      </div>
                    </div>

                    <div className="pt-1">
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Open App in New Tab (Bypasses Popup Blocker)
                      </a>
                    </div>
                  </div>
                ) : authError ? (
                  <div className="flex flex-col gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl">
                    <div className="flex gap-3 text-[10px] font-black uppercase text-rose-300 tracking-wider items-start leading-relaxed">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                    {(authError.toLowerCase().includes("popup") || authError.toLowerCase().includes("tab") || authError.toLowerCase().includes("blocked")) && (
                      <div className="flex items-center gap-2 pt-1">
                        <a 
                          href={window.location.href} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] font-black uppercase text-white bg-blue-600 hover:bg-blue-500 py-2.5 px-4 rounded-xl text-center transition-all w-full flex items-center justify-center gap-1.5 shadow-md"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Open App in New Tab
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 ml-1">Username or Email</label>
                    <input 
                      name={isSignUp ? "email" : "username"} 
                      type={isSignUp ? "email" : "text"}
                      placeholder={isSignUp ? "yourname@gmail.com" : "Username or Email"} 
                      className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono" 
                      required
                    />
                  </div>
                  {isSignUp && (
                    <input name="username" type="text" placeholder="Preferred Username" className="hidden" />
                  )}
                  <div>
                    <div className="flex justify-between items-center mb-2 ml-1">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-600">Password</label>
                      {!isSignUp && (
                        <button 
                          type="button"
                          onClick={() => {
                            const emailInput = document.querySelector('input[name="username"]') as HTMLInputElement;
                            handlePasswordReset(emailInput?.value || "");
                          }}
                          className="text-[8px] font-black uppercase tracking-widest text-blue-500 hover:text-white transition-colors"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input name="password" type="password" placeholder="••••••••" className="w-full p-4 bg-zinc-950 border border-white/5 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-mono" required />
                  </div>
                </div>

                {resetSent && (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Reset link sent to your email.
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={authLoading}
                  className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isSignUp ? "Initialize Slate" : "Sync Authorization"
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Institutional SSO</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="space-y-2">
                  <button 
                    onClick={() => handleAuth("google")}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 py-3.5 bg-zinc-950 border border-white/10 hover:border-white/20 rounded-2xl hover:bg-white/5 transition-all group disabled:opacity-50 cursor-pointer"
                  >
                    {authLoading ? (
                      <div className="w-4 h-4 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-white/60 group-hover:fill-white transition-colors shrink-0" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-1.91 4.34-1.2 1.2-3.07 2.48-6.93 2.48-6.12 0-10.88-4.94-10.88-11.06s4.76-11.06 10.88-11.06c3.28 0 5.66 1.3 7.34 2.9l2.31-2.31c-2.5-2.07-5.59-3.33-9.65-3.33-7.41 0-13.48 6.07-13.48 13.48s6.07 13.48 13.48 13.48c4.08 0 7.34-1.35 9.87-3.99 2.53-2.64 3.34-6.39 3.34-9.28 0-.89-.07-1.74-.2-2.54h-12.8z"/>
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Continue with Google</span>
                      </>
                    )}
                  </button>

                  {typeof window !== "undefined" && window.self !== window.top && (
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 pt-1 px-1">
                      <span className="text-zinc-500">Iframe preview mode</span>
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                      >
                        Open in New Tab <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col items-center gap-4">
                <button onClick={() => setIsSignUp(!isSignUp)} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">
                  {isSignUp ? "Return to Login" : "Initialize New Slate"}
                </button>
                <div className="text-[10px] text-zinc-600 font-bold max-w-[200px] text-center leading-relaxed">
                   BY SYNCING, YOU ACKNOWLEDGE THE TERMS OF INSTITUTIONAL ASSET FLOW.
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Ticket Check & PDF Download Portal Modal */}
      <TicketCheckModal
        isOpen={showTicketCheckModal}
        onClose={() => setShowTicketCheckModal(false)}
        initialSearchQuery={ticketCheckInitialQuery}
        onOpenLiveChat={(emailOrOrderId) => {
          setTrackedInquiry(null);
          setEmailInquiries(null);
          setTrackingEmail(emailOrOrderId || "");
          setTrackingId(emailOrOrderId || "");
          setShowInquiryStatus("SEARCH");
        }}
      />

      {/* Global Real-Time Guest Mail & Awaiting-Details Swift Notifier (No Login Needed) */}
      <GuestMailNotifier
        onOpenSession={(sessionId) => {
          setTicketCheckInitialQuery(sessionId);
          setShowTicketCheckModal(true);
        }}
        onUnreadCountChange={setGuestUnreadCount}
      />

      {/* Official VIP Commemorative Game Ticket Modal */}
      <VipCommemorativeTicketModal
        isOpen={showVipCommemorativeModal}
        onClose={() => setShowVipCommemorativeModal(false)}
      />

      {/* Jayne Welage Minnesota Vikings VIP Invitation & Ticket Modal */}
      <JayneWelageVipTicketModal
        isOpen={showJayneVipModal}
        onClose={() => setShowJayneVipModal(false)}
        ticketData={JAYNE_WELAGE_PASS_DATA}
      />

      {/* Jaylen Waddle Denver Broncos VIP Fan Card Modal */}
      <JaylenWaddleVipFanCardModal
        isOpen={showJayneWaddleModal}
        onClose={() => setShowJayneWaddleModal(false)}
        onOpenInquiry={(player, cat) => {
          setSelectedInquiryCategory(cat);
          setSelectedInquiryPlayer(player);
          setShowFanCardForm(true);
        }}
        onOpenExplore={() => {
          setActiveTab("experiences");
        }}
      />

      {/* Trust, Governance & Legal Policies Modal */}
      <LegalPoliciesModal
        isOpen={legalModalTab !== null}
        initialTab={legalModalTab || "about"}
        onClose={() => setLegalModalTab(null)}
      />

      {/* Immediate CeeDee Lamb Public Meet & Greet Announcement Pop-Up (Dec 10 · $100) */}
      <CeeDeePublicMeetGreetPopup
        isOpen={showCeeDeePublicPopup && !showLogin && activeTab !== "ceedee"}
        onClose={() => setShowCeeDeePublicPopup(false)}
        onSecureSlot={() => {
          setShowCeeDeePublicPopup(false);
          setDeepLinkExp({
            id: "promo-ceedee-dec10",
            prefill: {
              playerName: "CeeDee Lamb",
              teamId: "DAL",
              objective: "Public Meet & Greet — December 10th ($100)",
            },
            nonce: Date.now(),
          });
          setActiveTab("experiences");
          setDismissedHero(true);
        }}
      />
    </div>
  );
}
