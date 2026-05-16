import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Newspaper, 
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
  ExternalLink
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
  OAuthProvider,
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
  serverTimestamp,
  query,
  orderBy,
  limit
} from "firebase/firestore";
import { NFL_TEAMS, getLogoUrl, Team } from "./constants";
import { cn, formatCurrency } from "./lib/utils";

// --- Constants ---
const NFL_LOGO_URL = "https://upload.wikimedia.org/wikipedia/en/thumb/a/a2/National_Football_League_logo.svg/1200px-National_Football_League_logo.svg.png";

const LANDING_NEWS = [
  {
    category: "ROSTER EQUITY",
    title: "Free Agency Frenzy: How Star Signings Shift Franchise Valuation",
    source: "Gridiron Exchange Analytics",
    time: "12m ago",
    image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=800"
  },
  {
    category: "DRAFT SPECULATION",
    title: "Top Prospects' Draft Stock Hits New Highs as Combine Data Leaks",
    source: "Sports Business Journal",
    time: "1h ago",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800"
  },
  {
    category: "CAPITAL FLOW",
    title: "Quarterback Liquidity: The Rising Cost of Franchise Protection",
    source: "Bloomberg Sports",
    time: "4h ago",
    image: "https://images.unsplash.com/photo-1610444583731-9ef82ba39235?auto=format&fit=crop&q=80&w=800"
  }
];

const TESTIMONIALS = [
  {
    name: "Marcus V.",
    text: "The precision of the execution and the liquidity provided by NFL EXCHANGE GRIDIRON is unmatched in the sports equity space.",
    rating: 5
  },
  {
    name: "Sarah L.",
    text: "Being able to trade draft speculation before the official draft has revolutionized how we hedge team risk.",
    rating: 5
  },
  {
    name: "Michael T.",
    text: "A sophisticated terminal for a sophisticated class of assets. The only way I manage my franchise holdings.",
    rating: 5
  }
];

const SHOP_ITEMS = {
  tickets: [
    { id: 't1', name: 'Executive Suite - Season Access', price: 25000, description: 'Private climate-controlled suite, 12 guests, all-inclusive catering', image: 'https://images.unsplash.com/photo-1510076857177-7470076d4098?auto=format&fit=crop&q=80&w=800' },
    { id: 't2', name: 'Lower Level Sideline', price: 850, description: 'Row 1-10 sideline seating with VIP lounge entrance', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800' },
    { id: 't3', name: 'Club Level Endzone', price: 425, description: 'Elevated endzone views with exclusive hospitality access', image: 'https://images.unsplash.com/photo-1610444583731-9ef82ba39235?auto=format&fit=crop&q=80&w=800' }
  ],
  jerseys: [
    { id: 'j1', name: 'Vapor Elite Custom Jersey', price: 349, description: 'On-field authentic specification with stitched name and numbers', image: 'https://images.unsplash.com/photo-1629235483163-9585fd473954?auto=format&fit=crop&q=80&w=800' },
    { id: 'j2', name: 'Nike Limited Vapor Jersey', price: 174, description: 'Premium performance fabric with sublimated team graphics', image: 'https://images.unsplash.com/photo-1610530730070-5fa371e27a75?auto=format&fit=crop&q=80&w=800' }
  ],
  fanCards: [
    { id: 'fc1', name: 'Franchise Governance Gold', price: 2500, description: 'Voting rights on minor team decisions + lifetime training access', image: 'https://images.unsplash.com/photo-1466193341027-56e68017ee2d?auto=format&fit=crop&q=80&w=800' },
    { id: 'fc2', name: 'Gridiron Platinum Exchange Pass', price: 950, description: 'Premium digital collectible tier with priority ticket pre-sales', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec1d?auto=format&fit=crop&q=80&w=800' }
  ]
};

const BackgroundRotator = ({ isLanding }: { isLanding?: boolean }) => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden bg-zinc-950">
      {/* Background Image for Landing */}
      {isLanding && (
        <div 
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
          style={{ 
            backgroundImage: `url("https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=100&w=3840")`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/60 to-black" />
        </div>
      )}

      {/* Cinematic Stadium Light Effect */}
      {!isLanding && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-full bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-zinc-950/90 to-zinc-950" />
      )}
      
      {/* Large Watermark Logo */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-opacity duration-1000",
          isLanding ? "opacity-[0.05] scale-100" : "opacity-[0.03] scale-75"
        )}
        style={{ 
          backgroundImage: `url("${NFL_LOGO_URL}")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: 'contain'
        }}
      />

      {/* Grid Pattern Overlay - Reduced for clarity */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.01]" />
    </div>
  );
};

const WalletModal = ({ isOpen, onClose, balance, onWithdraw, transactions }: { isOpen: boolean, onClose: () => void, balance: number, onWithdraw: (amount: number, currency: string, address: string) => Promise<void>, transactions: any[] }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw" | "history">("withdraw");
  const [withdrawTab, setWithdrawTab] = useState<"fiat" | "crypto">("crypto");
  const [selectedCurrency, setSelectedCurrency] = useState("USDT");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

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
        className="w-full max-w-2xl bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden"
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

        <div className="flex gap-4 mb-8 border-b border-white/5">
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
                      <p className="text-[10px] font-black uppercase text-white tracking-widest">{t.type} {t.currency}</p>
                      <p className="text-[8px] font-mono text-zinc-500">{t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'Processing'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("text-xs font-black", t.type === 'withdraw' ? 'text-rose-500' : 'text-emerald-500')}>
                      {t.type === 'withdraw' ? '-' : '+'}{formatCurrency(t.amount)}
                    </p>
                    <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded", t.status === 'Confirmed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-500')}>
                      {t.status || 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "deposit" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest border-b border-white/5 pb-2">Institutional Deposit</h3>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                       Bitcoin (BTC)
                    </p>
                    <button onClick={() => copyToClipboard("bc1qddj8shfsfhgj2rrk24v3gflp234znsxw7d4xtt", "btc")}>
                       {copied === "btc" ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-zinc-500 hover:text-white" />}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono break-all text-zinc-300">bc1qddj8shfsfhgj2rrk24v3gflp234znsxw7d4xtt</p>
                </div>
                <div className="p-4 bg-zinc-800/50 rounded-2xl border border-white/5 group">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                      USDT (ERC-20)
                    </p>
                    <button onClick={() => copyToClipboard("0xBD40A14Dd94403107DD1F81DB5f2b4E80D34A222", "usdt")}>
                      {copied === "usdt" ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-500 hover:text-white" />}
                    </button>
                  </div>
                  <p className="text-[10px] font-mono break-all text-zinc-300">0xBD40A14Dd94403107DD1F81DB5f2b4E80D34A222</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 flex flex-col justify-end">
               <div className="p-6 bg-blue-600/5 border border-blue-600/20 rounded-3xl">
                 <h4 className="text-[10px] font-black uppercase text-blue-400 mb-2">Liquidity Injection</h4>
                 <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">Funds sent to these institutional addresses are automatically credited to your balance upon 3 network confirmations. Ensure high-priority fees for faster clearing.</p>
               </div>
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
  const [shopView, setShopView] = useState<"jerseys" | "tickets" | "cards">("jerseys");

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-16 md:space-y-24 pb-40 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto py-6 sm:py-10 relative">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-blue-600 to-transparent" />
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-8 sm:pt-12 leading-none">The Arena Shop</h2>
        
        {/* Shop Category Navigation */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-4 sm:mb-8">
          {[
            { id: "jerseys", label: "Elite Gear" },
            { id: "tickets", label: "Match Tickets" },
            { id: "cards", label: "Fan Cards" }
          ].map((cat: any) => (
            <button 
              key={cat.id}
              onClick={() => setShopView(cat.id)}
              className={cn(
                "px-5 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border",
                shopView === cat.id 
                  ? "bg-white text-black border-white shadow-xl shadow-white/5" 
                  : "bg-zinc-950 text-zinc-500 border-white/5 hover:border-white/20"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <button 
          onClick={() => setShowInquiryStatus("SEARCH")}
          className="w-full sm:w-auto px-8 py-3 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border bg-zinc-900/50 text-blue-500 border-blue-500/20 hover:bg-blue-500 hover:text-white"
        >
          Track Existing Inquiry
        </button>
      </div>

      {/* Section: Professional Gear (Direct Price View) */}
      {shopView === "jerseys" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-white/5 pb-6">
            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Professional Gear</h3>
            <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">In-Stock Authentic Apparel</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {SHOP_ITEMS.jerseys.map((item: any) => (
              <div key={item.id} className="flex flex-col sm:flex-row gap-6 md:gap-8 bg-zinc-900/20 rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 border border-white/5 group hover:border-blue-500/20 transition-all">
                <div className="w-full sm:w-40 h-48 sm:h-40 rounded-2xl sm:rounded-3xl overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-80" />
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-4 sm:mb-2">
                    <h4 className="text-lg md:text-xl font-black italic uppercase leading-none">{item.name}</h4>
                    <p className="font-mono font-black text-white text-lg md:text-xl">${item.price}</p>
                  </div>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase mb-6 sm:mb-8 tracking-[0.1em]">{item.description}</p>
                  <button 
                    onClick={() => handleStorePurchase(item, 'jersey')}
                    className="w-full sm:w-auto px-10 md:px-12 py-3.5 bg-blue-600 rounded-xl md:rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10"
                  >
                    Acquire Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section: Match Access (Inquiry Flow) */}
      {shopView === "tickets" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-white/5 pb-6">
            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Match Tickets</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Contact Concierge for Seat Pricing</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
            {SHOP_ITEMS.tickets.map((item: any) => (
              <div key={item.id} className="bg-zinc-900/50 border border-white/5 rounded-3xl md:rounded-[2.5rem] overflow-hidden group hover:bg-zinc-900 transition-colors">
                <div className="aspect-[4/3] overflow-hidden relative border-b border-white/5">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" />
                  <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded-lg">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2"><Ticket className="w-3 h-3" /> Booking</p>
                  </div>
                </div>
                <div className="p-6 md:p-8">
                  <h4 className="text-lg font-black italic uppercase leading-none mb-4">{item.name}</h4>
                  <p className="text-zinc-600 text-[10px] font-bold uppercase mb-6 md:mb-8 line-clamp-2 tracking-widest leading-relaxed">{item.description}</p>
                  <button 
                    onClick={() => setShowFanCardForm(true)}
                    className="w-full py-4 bg-zinc-800 hover:bg-white hover:text-black transition-all font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/5"
                  >
                    Check Availability
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section: Fan Cards (Inquiry Flow) */}
      {shopView === "cards" && (
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 md:mb-12 border-b border-white/5 pb-6">
            <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Membership Tiers</h3>
            <span className="w-fit text-[10px] font-black uppercase text-blue-500 tracking-widest bg-blue-600/10 px-4 py-2 rounded-xl">Concierge Exclusive</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">
            {SHOP_ITEMS.fanCards.map((item: any) => (
              <div key={item.id} className="relative group overflow-hidden rounded-3xl md:rounded-[3rem] bg-zinc-900 border border-white/5 flex flex-col md:flex-row hover:border-blue-600/30 transition-all">
                <div className="w-full md:w-2/5 h-48 md:h-auto overflow-hidden border-b md:border-b-0 md:border-r border-white/5 relative">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 opacity-60" />
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
    </div>
  );
};

// --- Customer Care Admin Portal ---
const AdminPortal = ({ user }: { user: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"inquiries" | "orders" | "users" | "transactions">("inquiries");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

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

    const unsubOrders = onSnapshot(query(collection(db, "store_orders"), orderBy("timestamp", "desc")), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setOrders(docs);
    }, (err) => {
      console.error("Orders Listen Error:", err);
      if (err.message.includes("permission")) setPermError("Permission Denied: Order sync restricted.");
    });

    const unsubUsers = onSnapshot(query(collection(db, "users"), orderBy("balance", "desc")), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setUsers(docs);
    }, (err) => {
      console.error("Users Listen Error:", err);
      if (err.message.includes("permission")) setPermError("Permission Denied: Treasury database restricted.");
    });

    // Cross-user transaction monitoring (only for admins)
    // Note: This requires a collection group query or flattened transactions if we want to see ALL user transactions.
    // For now, let's assume we want to see transactions from a 'global_transactions' log if it existed, 
    // OR we just monitor the fan_card_requests and store_orders which are top-level.
    // Since transactions are sub-collections, let's add a global 'transactions' collection for admin monitoring.
    const unsubTransactions = onSnapshot(query(collection(db, "global_transactions"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setTransactions(docs);
    }, (err) => {
      console.error("Transactions Listen Error:", err);
    });

    return () => { unsubInquiries(); unsubOrders(); unsubUsers(); unsubTransactions(); };
  }, [user]);

  const filteredTransactions = transactions.filter(t => 
    (t.userId || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (t.type || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    (u.displayName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInquiries = requests.filter(r => 
    (r.teamId || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (r.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.message || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOrders = orders.filter(o => 
    (o.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
    (o.userEmail || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateTransactionStatus = async (txId: string, userId: string, status: string) => {
    try {
      // Update global log
      await updateDoc(doc(db, "global_transactions", txId), { status });
      // Update user specific log
      await updateDoc(doc(db, "users", userId, "transactions", txId), { status });
      alert(`Transaction ${txId} marked as ${status}`);
    } catch (err) {
      console.error(err);
      alert("Failed to update transaction status.");
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

  const adjustBalance = async (userId: string, amount: number) => {
    const userToUpdate = users.find(u => u.uid === userId);
    if (!userToUpdate) return;
    
    setAdminLoading(true);
    try {
      const newBalance = (userToUpdate.balance || 0) + amount;
      await updateDoc(doc(db, "users", userId), {
        balance: Math.max(0, newBalance),
        updatedAt: serverTimestamp()
      });
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
        </div>
      </div>

      {permError && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-xs font-black uppercase tracking-widest text-rose-400">{permError}</p>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        {activeSubTab === "transactions" ? (
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Timestamp</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Investor ID</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Type</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Value</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Crypto Address / Details</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((t: any) => (
                <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                  <td className="p-6 text-[10px] font-mono text-zinc-400">
                    {t.timestamp?.toDate ? t.timestamp.toDate().toLocaleString() : 'Processing'}
                  </td>
                  <td className="p-6">
                    <p className="text-[10px] font-mono text-zinc-300">{t.userId}</p>
                  </td>
                  <td className="p-6">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                      t.type === 'withdraw' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {t.type}
                    </span>
                  </td>
                  <td className="p-6 font-mono text-xs font-black">
                    {formatCurrency(t.amount || 0)}
                    {t.currency && <span className="ml-2 text-zinc-500 font-normal">{t.currency}</span>}
                  </td>
                  <td className="p-6 max-w-[200px]">
                    <p className="text-[10px] font-mono text-zinc-500 truncate" title={t.destinationAddress || 'N/A'}>
                      {t.destinationAddress || 'N/A'}
                    </p>
                  </td>
                  <td className="p-6 text-right">
                    <div className="flex justify-end items-center gap-2">
                      {t.status === 'pending' && (
                        <button 
                          onClick={() => updateTransactionStatus(t.id, t.userId, 'Confirmed')}
                          className="px-3 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-[8px] font-black uppercase rounded-md hover:bg-emerald-600 hover:text-white transition-all"
                        >
                          Approve
                        </button>
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        t.status === 'Confirmed' ? "text-emerald-400" : 
                        t.status === 'pending' ? "text-blue-400" : "text-zinc-500"
                      )}>
                        {t.status || 'pending'}
                      </span>
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Entity</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Contact Handle</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Message / Detail</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {(activeSubTab === "inquiries" ? filteredInquiries : filteredOrders).map((item: any) => (
                <tr 
                  key={item.id} 
                  className={cn(
                    "border-b border-white/5 hover:bg-white/[0.02] transition-colors cursor-pointer",
                    selectedInquiry?.id === item.id && "bg-white/[0.05]"
                  )}
                  onClick={() => activeSubTab === "inquiries" && setSelectedInquiry(item)}
                >
                  <td className="p-6 text-[10px] font-mono text-zinc-400">
                    {item.timestamp?.toDate ? item.timestamp.toDate().toLocaleString() : 'Recent'}
                  </td>
                  <td className="p-6">
                    <p className="text-xs font-black uppercase italic">{item.userName || item.teamId || item.itemName}</p>
                    <p className="text-[10px] font-bold text-zinc-600 uppercase">
                      {item.userEmail || (item.userId === 'guest' ? 'GUEST' : 'USER')}
                    </p>
                    {activeSubTab === "inquiries" && <p className="text-[8px] font-mono text-zinc-500">{item.id}</p>}
                  </td>
                  <td className="p-6 text-xs font-bold text-blue-400 underline decoration-blue-400/30">
                    {item.contactMethod || (item.userId !== 'guest' ? 'Registered Account' : 'Unknown')}
                  </td>
                  <td className="p-6 text-xs text-zinc-500 max-w-xs truncate">
                    {item.message || `Direct Purchase: ${item.itemName} (${formatCurrency(item.price)})`}
                  </td>
                  <td className="p-6 text-right">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase rounded-lg",
                      item.status === 'responded' ? "bg-emerald-600/10 text-emerald-500" : 
                      item.status === 'pending' ? "bg-blue-600/10 text-blue-400" : "bg-zinc-800 text-zinc-500"
                    )}>
                      {item.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              <h4 className="text-2xl font-black italic uppercase italic tracking-tighter mb-2">Active Conversation: {selectedInquiry.id}</h4>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Reviewing initial inquiry & drafting response...</p>
            </div>
            <button onClick={() => setSelectedInquiry(null)} className="text-zinc-500 hover:text-white"><X /></button>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Original Inquiry</p>
              <p className="text-sm font-medium text-white">{selectedInquiry.message}</p>
            </div>
            {selectedInquiry.replies?.map((r: any, idx: number) => (
              <div key={idx} className="bg-blue-600/5 p-6 rounded-2xl border border-blue-600/10 ml-8">
                <p className="text-[10px] font-black uppercase text-blue-500 mb-2 tracking-widest">{r.sender}</p>
                <p className="text-sm font-medium text-zinc-300">{r.text}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <textarea 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Type your official response here. This will be visible to the user under their Reference ID..."
              rows={4}
              className="w-full bg-zinc-950 border border-white/5 rounded-2xl p-6 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all font-medium"
            />
            <button 
              onClick={handleReply}
              className="px-12 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-200 transition-all flex items-center gap-3"
            >
              <Send className="w-4 h-4" /> Dispatch Official Reply
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default function App() {
  useEffect(() => {
    document.title = "NFL Exchange Gridiron";
  }, []);

  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [marketPrices, setMarketPrices] = useState<Record<string, number>>({});
  const [historicalData, setHistoricalData] = useState<Record<string, any[]>>({});
  const [selectedTeam, setSelectedTeam] = useState<Team>(NFL_TEAMS.find(t => t.id === "MIN")!);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [showFanCardForm, setShowFanCardForm] = useState(false);
  const [activeTicket, setActiveTicket] = useState<string | null>(localStorage.getItem("active_ticket_id"));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"markets" | "draft" | "portfolio" | "shop" | "admin">("markets");
  const [quantity, setQuantity] = useState(1);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [showInquiryStatus, setShowInquiryStatus] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState("");
  const [trackedInquiry, setTrackedInquiry] = useState<any>(null);
  const [resetSent, setResetSent] = useState(false);
  const portfolioRef = useRef<any[]>([]);
  
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

  // Auth & Data syncing
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubPortfolio: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      // Clean up previous listeners
      if (unsubUser) unsubUser();
      if (unsubPortfolio) unsubPortfolio();
      unsubUser = null;
      unsubPortfolio = null;

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
      } else {
        setUser(null);
        setBalance(0);
        setPortfolio([]);
        portfolioRef.current = [];
      }
      setLoading(false);
    });

    return () => {
      unsubAuth();
      if (unsubUser) (unsubUser as () => void)();
      if (unsubPortfolio) (unsubPortfolio as () => void)();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent | "google" | "apple") => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      if (typeof e === "string") {
        let provider;
        if (e === "google") {
          provider = new GoogleAuthProvider();
        } else if (e === "apple") {
          provider = new OAuthProvider("apple.com");
        } else return;

        let cred;
        try {
          await setPersistence(auth, browserLocalPersistence);
          cred = await signInWithPopup(auth, provider, browserPopupRedirectResolver);
        } catch (innerErr: any) {
          console.error("Popup Error Detail:", innerErr);
          if (innerErr.code === "auth/popup-closed-by-user") {
            throw new Error("The sign-in popup was closed before completion. Please try again.");
          }
          if (innerErr.code === "auth/popup-blocked") {
            throw new Error("Sign-in popup was blocked. Please allow popups for this site.");
          }
          if (innerErr.message?.includes("missing initial state") || innerErr.code === "auth/internal-error") {
            throw new Error("Your browser is blocking the sign-in. Please try opening the app in a new tab.");
          }
          throw innerErr;
        }

        const userRef = doc(db, "users", cred.user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: cred.user.uid,
            displayName: cred.user.displayName || cred.user.email?.split("@")[0],
            email: cred.user.email,
            balance: 5000,
            createdAt: serverTimestamp()
          });
        }
        setShowLogin(false);
        return;
      }

      e.preventDefault();
      const formData = new FormData(e.target as HTMLFormElement);
      const password = formData.get("password") as string;
      const rawIdentifier = (formData.get(isSignUp ? "email" : "username") as string || "").trim();
      
      // Clean identifier and convert to email if simple username
      const email = rawIdentifier.includes("@") 
        ? rawIdentifier 
        : `${rawIdentifier.toLowerCase().replace(/[^a-z0-9_]/g, '')}@gridiron.exchange`;

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
                // If account exists but wrong password, try to update it or just fail gracefully
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
          balance: 5000,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowLogin(false);
    } catch (err: any) {
      console.error("Auth Error:", err);
      let friendlyMessage = err.message;
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found") {
        friendlyMessage = isSignUp 
          ? "Unable to create account with these credentials. Please check your email format or use a stronger password."
          : "Invalid access key or password. If you haven't registered, please switch to 'Sign Up' below.";
      } else if (err.code === "auth/invalid-email") {
        friendlyMessage = "Standard formatting required (e.g., name@domain.com).";
      } else if (err.code === "auth/weak-password") {
        friendlyMessage = "Security requirement: Password must be at least 6 characters.";
      } else if (err.code === "auth/email-already-in-use") {
        friendlyMessage = "This identity is already registered in our terminal. Please sign in instead.";
      }
      setAuthError(friendlyMessage);
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

  const handleFanCardRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const requestId = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    
    try {
      await setDoc(doc(db, "fan_card_requests", requestId), {
        userId: user ? user.uid : 'guest',
        userEmail: user ? user.email : null,
        userName: formData.get("name") as string,
        teamId: formData.get("team") as string,
        contactMethod: formData.get("contact") as string,
        message: formData.get("message") as string,
        status: "pending",
        replies: [],
        timestamp: serverTimestamp()
      });
      
      setShowFanCardForm(false);
      setShowInquiryStatus(requestId);
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, "fan_card_requests");
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
        userEmail: user.email,
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
        transactions={userTransactions}
      />

      {/* Nav */}
      <nav className="h-20 bg-zinc-950/60 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-8 z-50">
        <div className="flex items-center gap-4 md:gap-10">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setActiveTab("markets")}>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
              <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black italic uppercase tracking-tighter leading-none">NFL EXCHANGE</h1>
              <p className="hidden xs:block text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Digital Asset Terminal</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-8">
            {([
              { id: "markets", label: "Exchange", icon: LayoutDashboard },
              { id: "draft", label: "Speculation", icon: Target },
              { id: "shop", label: "Arena Shop", icon: ShoppingBag },
              { id: "portfolio", label: "Portfolio", icon: History },
              ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control", icon: ShieldCheck }] : [])
            ] as any[]).map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors",
                  activeTab === tab.id ? "text-blue-500" : "text-zinc-500 hover:text-white"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
            
            <button 
              onClick={() => window.open(window.location.href, '_blank')}
              className="text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors flex items-center gap-2 border-l border-white/10 pl-6 ml-2"
              title="Open in new tab to avoid browser restrictions"
            >
              <ExternalLink className="w-3 h-3" />
              Popout
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user ? (
            <div className="flex items-center gap-3 md:gap-6">
              <div className="text-right hidden lg:block">
                <p className="text-[10px] font-black text-zinc-500 uppercase">AUM Value</p>
                <p className="font-mono text-emerald-400 font-black">{formatCurrency(totalValue)}</p>
              </div>
              <button 
                onClick={() => setShowWallet(true)}
                className="bg-white text-black px-4 md:px-6 py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-zinc-200 transition-all flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" /> <span className="hidden sm:inline">Wallet</span>
              </button>
              <button onClick={() => signOut(auth)} className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center hover:bg-rose-500/10 hover:text-rose-500 transition-all">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <button onClick={() => setShowLogin(true)} className="bg-blue-600 text-white px-5 md:px-8 py-3 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20">
              Investor Portal
            </button>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-zinc-950/80 backdrop-blur-2xl border-t border-white/5 z-50 flex items-center justify-around p-4">
        {[
          { id: "markets", label: "Exchange", icon: LayoutDashboard },
          { id: "draft", label: "Speculation", icon: Target },
          { id: "shop", label: "Shop", icon: ShoppingBag },
          { id: "portfolio", label: "Portfolio", icon: History },
          ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control", icon: ShieldCheck }] : [])
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              activeTab === tab.id ? "text-blue-500" : "text-zinc-500"
            )}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-[8px] font-black uppercase tracking-tighter">{tab.label}</span>
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
              <button onClick={() => { setShowInquiryStatus(null); setTrackedInquiry(null); }} className="absolute top-8 right-8 text-zinc-500"><X /></button>
              
              <div className="text-center mb-6 md:mb-10">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase italic tracking-tighter leading-none mb-2">Concierge Ticket</h2>
                <p className="text-zinc-500 text-[10px] uppercase tracking-[0.4em] font-black">Official Service Support Link</p>
              </div>

              {!trackedInquiry ? (
                <div className="space-y-6 md:space-y-8">
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
                  
                  <div className="bg-zinc-950 p-6 sm:p-8 md:p-10 rounded-2xl md:rounded-[2rem] border border-white/5">
                    <p className="text-[10px] font-black uppercase text-zinc-500 mb-4 tracking-widest text-center md:text-left">Track Existing Ticket</p>
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

                  <div className="max-h-[250px] md:max-h-[300px] overflow-y-auto pr-2 sm:pr-4 space-y-6 custom-scrollbar">
                    <div className="bg-zinc-950 p-4 sm:p-6 rounded-2xl border border-white/5 max-w-[90%] sm:max-w-[80%]">
                      <p className="text-[10px] font-black uppercase text-zinc-500 mb-2">You</p>
                      <p className="text-xs sm:text-sm font-medium text-white">{trackedInquiry.message}</p>
                    </div>
                    {trackedInquiry.replies?.map((r: any, idx: number) => (
                      <div key={idx} className="bg-blue-600/10 p-4 sm:p-6 rounded-2xl border border-blue-600/20 max-w-[90%] sm:max-w-[80%] ml-auto">
                        <p className="text-[10px] font-black uppercase text-blue-500 mb-2">Customer Care</p>
                        <p className="text-xs sm:text-sm font-medium text-zinc-100">{r.text}</p>
                        <p className="text-[8px] font-mono text-blue-400/50 mt-2">{new Date(r.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>

                  <button 
                    onClick={() => setTrackedInquiry(null)}
                    className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-700 transition-all"
                  >
                    Back to Tracking
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Hero / Landing (If not logged in) */}
      {!user && activeTab !== "shop" && !showLogin && (
        <div className="flex-1 overflow-y-auto no-scrollbar bg-black/40">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-center relative overflow-hidden">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-4xl w-full"
            >
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 md:mb-8 leading-none">
                THE <span className="text-blue-600">NFL</span><br/>EXCHANGE
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-zinc-400 mb-8 md:mb-12 max-w-2xl mx-auto font-black italic uppercase tracking-widest leading-relaxed">
                Live Franchise Equity · Institutional Execution · 24/7 Market Liquidity
              </p>
              <div className="flex justify-center gap-4 mb-20 px-4">
                <button onClick={() => setShowLogin(true)} className="w-full sm:w-auto bg-white text-black px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 whitespace-nowrap">
                  ACCESS TRADING TERMINAL
                </button>
              </div>
            </motion.div>
            
            {/* Scroll Indicator */}
            <motion.div 
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-500"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Explore Market</p>
              <div className="w-px h-12 bg-gradient-to-b from-blue-600 to-transparent mx-auto" />
            </motion.div>
          </section>

          {/* Breaking News Section */}
          <section className="py-16 md:py-32 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">Market Intelligence</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Proprietary news and real-time analysis</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-blue-500">Live Terminal Feed</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
              {LANDING_NEWS.map((news, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={news.title} 
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-3xl mb-6 border border-white/5">
                    <img src={news.image} alt={news.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                    <div className="absolute top-4 left-4 bg-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">
                      {news.category}
                    </div>
                  </div>
                  <h3 className="text-lg font-black italic uppercase tracking-tight mb-4 group-hover:text-blue-500 transition-colors leading-tight">
                    {news.title}
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                    <span>{news.source}</span>
                    <span className="w-1 h-1 rounded-full bg-zinc-800" />
                    <span>{news.time}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Shop Highlights for landing */}
            <div className="bg-zinc-900 shadow-2xl rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-12 border border-white/5 relative overflow-hidden">
               <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full" />
               <div className="relative z-10">
                 <div className="flex flex-col lg:flex-row items-center justify-between gap-10 md:gap-12">
                   <div className="max-w-xl text-center lg:text-left">
                     <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter mb-4 md:mb-6 leading-tight">The Arena Shop</h2>
                     <p className="text-zinc-400 text-sm sm:text-base md:text-lg font-bold uppercase tracking-tight mb-8 md:mb-10 italic">Secure matching tickets, authentic franchise gear, and exclusive fan membership cards directly through our secure portal.</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8 mb-10">
                       <div className="flex items-center justify-center lg:justify-start gap-4">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><Ticket className="w-5 h-5 text-blue-500" /></div>
                         <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Match Tickets</p>
                       </div>
                       <div className="flex items-center justify-center lg:justify-start gap-4">
                         <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center"><ShoppingBag className="w-5 h-5 text-blue-500" /></div>
                         <p className="text-[10px] sm:text-xs font-black uppercase tracking-widest">Official Jerseys</p>
                       </div>
                     </div>
                     <button onClick={() => setActiveTab("shop")} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                        ENTER SHOP
                     </button>
                   </div>
                   <div className="grid grid-cols-2 gap-4 w-full sm:w-auto">
                      {SHOP_ITEMS.tickets.slice(0, 2).map((item, i) => (
                        <div key={item.id} className={cn("flex-1 aspect-[3/4] w-full sm:w-48 rounded-2xl sm:rounded-3xl overflow-hidden border border-white/5", i === 1 && "mt-8 sm:mt-12")}>
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
                        </div>
                      ))}
                   </div>
                 </div>
               </div>
            </div>
          </section>

          {/* Testimonials section */}
          <section className="py-16 md:py-32 bg-zinc-950/40 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-4 md:px-8">
              <div className="text-center mb-12 md:20">
                <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4">Institutional Trust</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-xs">Verified feedback from major equity holders</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {TESTIMONIALS.map((t, i) => (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    key={t.name}
                    className="p-6 md:p-10 bg-zinc-900/50 rounded-2xl md:rounded-[2.5rem] border border-white/5 relative group hover:border-blue-600/30 transition-all"
                  >
                    <div className="flex gap-1 mb-6">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-blue-600 text-blue-600" />
                      ))}
                    </div>
                    <p className="text-lg font-black italic uppercase mb-8 leading-relaxed text-zinc-200">
                      "{t.text}"
                    </p>
                    <div className="flex items-center gap-4 border-t border-white/5 pt-8">
                      <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-black text-blue-500 italic uppercase">
                        {t.name[0]}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-tight">{t.name}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer CTA */}
          <section className="py-20 md:py-40 text-center px-4 md:px-8">
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-600 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center mb-10 md:12 shadow-2xl shadow-blue-600/40">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-white" />
              </div>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter mb-6 md:mb-8 leading-none">
                READY TO<br/>SECURE EQUITY?
              </h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px] md:text-sm mb-10 md:12 italic px-4">
                Join 850,000+ dedicated investors trading professional franchise equity
              </p>
              <button onClick={() => setShowLogin(true)} className="bg-white text-black px-10 md:px-12 py-4 md:py-5 rounded-2xl text-[10px] md:text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">
                INITIALIZE PORTFOLIO
              </button>
            </div>
          </section>
        </div>
      )}

      {/* Main Dashboard */}
      {(user || activeTab === "shop") && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
          {/* Sidebar */}
          <aside className={cn(
            "bg-zinc-950/40 border-r border-white/5 flex-col flex shrink-0 transition-all duration-300",
            activeTab === "markets" ? "w-full md:w-80 h-[40%] md:h-full" : "w-full md:w-80"
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
          </aside>

          {/* Activity Area */}
          <main className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar">
            {(activeTab === "markets" && !user) ? (
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8">
                  <LayoutDashboard className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Market Access Restricted</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-10 max-w-md">The trading terminal requires a verified investor profile. Please initialize your slate to execute trades.</p>
                <button onClick={() => setShowLogin(true)} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Initialize Slate</button>
              </div>
            ) : activeTab === "markets" && (
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
                  <div className="bg-zinc-900/50 rounded-2xl md:rounded-[2rem] p-6 md:p-8 border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[.25em]">Market Execution</h3>
                      <div className="flex items-center gap-1 text-emerald-400 text-[10px] font-black tracking-widest">
                        <ShieldCheck className="w-3 h-3" /> SECURE
                      </div>
                    </div>
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
              <div className="flex-1 flex flex-col items-center justify-center p-20 text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mb-8">
                  <Target className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-4">Speculation Locked</h2>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs mb-10 max-w-md">Draft speculation requires institutional clearance. Sign in to place predictive orders.</p>
                <button onClick={() => setShowLogin(true)} className="bg-white text-black px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all">Secure Access</button>
              </div>
            ) : activeTab === "draft" && (
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
              </div>
            )}
          </main>
        </div>
      )}

      {/* Fan Card Modal */}
      <AnimatePresence>
        {showFanCardForm && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm" onClick={() => setShowFanCardForm(false)}>
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl md:rounded-[3rem] p-6 sm:p-10 md:p-12 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
              <button onClick={() => setShowFanCardForm(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 leading-none">Concierge Inquiry</h2>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.1em] mb-6 md:mb-10 italic">Customer Care Protocol: Requesting Asset Pricing & Access</p>
              
              <form onSubmit={handleFanCardRequest} className="space-y-4 md:space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Full Name / Identifier</label>
                  <input name="name" required defaultValue={user?.displayName || ""} placeholder="e.g. Alex Rivera" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all" />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Franchise Asset</label>
                  <select name="team" required defaultValue={selectedTeam.id} className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold uppercase transition-all">
                    {NFL_TEAMS.map(t => <option key={t.id} value={t.id}>{t.city} {t.name} - Asset Allocation</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Contact Handle</label>
                  <input name="contact" required placeholder="e.g. Telegram: @handle / Email: name@domain.com" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all" />
                </div>
                <div>
                  <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Inquiry details</label>
                  <textarea name="message" rows={3} placeholder="Tell us which match tickets or fan cards you are interested in. Our team will reply with current market rates..." className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all" />
                </div>
                <button type="submit" className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl">
                  SUBMIT TO CUSTOMER CARE
                </button>
              </form>
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
              <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              <div className="text-center mb-8 md:mb-10">
                <div className="w-14 md:w-16 h-14 md:h-16 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-6 shadow-xl shadow-blue-600/20">
                  <TrendingUp className="w-8 md:w-10 h-8 md:h-10 text-white" />
                </div>
                <h2 className="text-2xl md:text-3xl font-black italic uppercase italic tracking-tighter leading-none text-white">Investor Portal</h2>
                <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-[0.4em] font-black leading-relaxed px-4 text-center">Secure Node Authorization Required</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-6">
                {authError && (
                  <div className="flex flex-col gap-2 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                    <div className="flex gap-3 text-[10px] font-black uppercase text-rose-400 tracking-widest items-center">
                      <AlertCircle className="w-4 h-4 shrink-0" /> {authError}
                    </div>
                    {authError.includes("new tab") && (
                      <a 
                        href={window.location.href} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase text-white bg-rose-500/20 py-2 px-4 rounded-xl text-center hover:bg-rose-500/30 transition-all border border-rose-500/30 w-full mt-1"
                      >
                        Open Website in New Tab
                      </a>
                    )}
                  </div>
                )}
                
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
                  className="w-full py-5 bg-blue-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 active:scale-95 text-xs flex items-center justify-center gap-2"
                >
                  {authLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    isSignUp ? "Initialize Slate" : "Sync Authorization"
                  )}
                </button>
              </form>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-[8px] font-black uppercase tracking-[0.4em] text-zinc-600">Secure SSO</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleAuth("google")}
                    disabled={authLoading}
                    className="flex items-center justify-center gap-3 py-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-4 h-4 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-white/60 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-1.91 4.34-1.2 1.2-3.07 2.48-6.93 2.48-6.12 0-10.88-4.94-10.88-11.06s4.76-11.06 10.88-11.06c3.28 0 5.66 1.3 7.34 2.9l2.31-2.31c-2.5-2.07-5.59-3.33-9.65-3.33-7.41 0-13.48 6.07-13.48 13.48s6.07 13.48 13.48 13.48c4.08 0 7.34-1.35 9.87-3.99 2.53-2.64 3.34-6.39 3.34-9.28 0-.89-.07-1.74-.2-2.54h-12.8z"/>
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Google</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => handleAuth("apple")}
                    className="flex items-center justify-center gap-3 py-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group"
                  >
                    <svg className="w-4 h-4 fill-white/60 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                      <path d="M17.05 20.28c-.98.95-2.05 1.61-3.11 1.61-1.21 0-1.63-.74-3.06-.74-1.44 0-1.92.71-3.05.74-1.12.03-2.15-.74-3.16-1.68-2.11-1.99-3.72-5.58-3.72-8.73 0-3.15 1.59-5.33 3.63-5.33.91 0 1.76.49 2.49.49.73 0 1.75-.54 2.82-.54 1.13 0 2.14.58 2.87 1.53-1.89 1.14-1.57 3.59.39 4.8 1.05.65 2.18.57 2.84.42-.08.64-.32 1.39-.74 1.96zm-2.48-15.1c0 .85-.36 1.69-.97 2.3-.61.61-1.46.99-2.3.99-.07-.93.41-1.85 1.01-2.46.61-.61 1.54-.99 2.26-.83z"/>
                    </svg>
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Apple</span>
                  </button>
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
    </div>
  );
}
