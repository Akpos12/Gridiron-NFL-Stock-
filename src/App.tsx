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
  ExternalLink,
  Trash2,
  Lock,
  Edit2,
  Check,
  Save,
  BellRing
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
import { NFLImage } from "./utils/nflImages";

// --- Constants ---
const NFL_LOGO_URL = "/nfl_logo.svg";

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
    { id: 't1', name: 'Executive Suite - Season Access', price: 25000, description: 'Private climate-controlled suite, 12 guests, all-inclusive catering', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800' },
    { id: 't2', name: 'Lower Level Sideline', price: 850, description: 'Row 1-10 sideline seating with VIP lounge entrance', image: 'https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=800' },
    { id: 't3', name: 'Club Level Endzone', price: 425, description: 'Elevated endzone views with exclusive hospitality access', image: 'https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=800' }
  ],
  jerseys: [
    { id: 'j1', name: 'Vapor Elite Custom Jersey', price: 349, description: 'On-field authentic specification with stitched name and numbers', image: 'https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?auto=format&fit=crop&q=80&w=800' },
    { id: 'j2', name: 'Nike Limited Vapor Jersey', price: 174, description: 'Premium performance fabric with sublimated team graphics', image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?auto=format&fit=crop&q=80&w=800' }
  ],
  fanCards: [
    { id: 'fc1', name: 'Franchise Governance Gold', price: 2500, description: 'Voting rights on minor team decisions + lifetime training access', image: 'https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=800' },
    { id: 'fc2', name: 'Gridiron Platinum Exchange Pass', price: 950, description: 'Premium digital collectible tier with priority ticket pre-sales', image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800' }
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

  // Merchandise Shop Filter States
  const [selectedShopTeam, setSelectedShopTeam] = useState<string>(selectedTeam?.id || "MIN");
  const [merchSearch, setMerchSearch] = useState<string>("");
  const [merchCategory, setMerchCategory] = useState<string>("all");
  const [products, setProducts] = useState<any[]>([]);
  const [merchLoading, setMerchLoading] = useState<boolean>(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);

  // Live Ticketmaster Ticket States
  const [ticketTeam, setTicketTeam] = useState<string>("");
  const [ticketStadium, setTicketStadium] = useState<string>("");
  const [ticketMinPrice, setTicketMinPrice] = useState<number>(0);
  const [ticketMaxPrice, setTicketMaxPrice] = useState<number>(1500);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState<boolean>(true);
  const [ticketSort, setTicketSort] = useState<"cheapest" | "date">("date");
  const [ticketError, setTicketError] = useState<string | null>(null);

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
          // Absolute fallback logic in case of connection limits
          const clientFallback = [
            {
              id: `m-MIN-jersey`,
              name: `Minnesota Vikings Justin Jefferson Game Jersey`,
              description: `Authentic Nike Vapor Elite jersey featuring premium stitched graphics for franchise star Justin Jefferson (#18). On-field specifications.`,
              price: 157.50,
              originalPrice: 175.00,
              category: "jerseys",
              rating: 4.9,
              reviewsCount: 142,
              inStock: true,
              trending: true,
              image: "https://images.unsplash.com/photo-1594470117722-de4b9a02ebed?auto=format&fit=crop&q=80&w=800",
              purchaseUrl: "https://www.nflshop.com/?query=Minnesota%20Vikings%20jerseys"
            },
            {
              id: `m-MIN-hoodie`,
              name: `Minnesota Vikings Tech Fleece Sideline Hoodie`,
              description: `Official NFL Sideline technical performance wear. Engineered with Therma-FIT double-brushed premium comfort fabric.`,
              price: 72.25,
              originalPrice: 85.00,
              category: "hoodies",
              rating: 4.7,
              reviewsCount: 88,
              inStock: true,
              trending: false,
              image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800",
              purchaseUrl: "https://www.nflshop.com/?query=Minnesota%20Vikings%20hoodies"
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
          let sorted = data.events || [];
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
              id: "tm-7",
              name: "Minnesota Vikings vs Green Bay Packers",
              homeTeam: "Vikings",
              awayTeam: "Packers",
              stadium: "U.S. Bank Stadium",
              city: "Minneapolis, MN",
              date: "2026-10-04",
              time: "13:00",
              cheapestPrice: 115,
              vipPrice: 800,
              url: "https://www.ticketmaster.com/minnesota-vikings-tickets/artist/805967",
              image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=800",
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
              cheapestPrice: 125,
              vipPrice: 850,
              url: "https://www.ticketmaster.com/dallas-cowboys-tickets/artist/805934",
              image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
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
              cheapestPrice: 165,
              vipPrice: 1200,
              url: "https://www.ticketmaster.com/kansas-city-chiefs-tickets/artist/805961",
              image: "https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=800",
              isResale: true
            }
          ];
          let filtered = clientFallback;
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
    { id: "all", label: "All Gear" },
    { id: "jerseys", label: "Jerseys" },
    { id: "hoodies", label: "Hoodies" },
    { id: "helmets", label: "Helmets" },
    { id: "hats", label: "Caps & Hats" },
    { id: "memorabilia", label: "Signed Memorabilia" },
    { id: "limited", label: "Heritage Collection" }
  ];

  return (
    <div className="p-4 sm:p-6 md:p-10 space-y-16 md:space-y-24 pb-40 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto py-6 sm:py-10 relative">
        <div className="hidden sm:block absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-blue-600 to-transparent" />
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter mb-8 sm:pt-12 leading-none">The Arena Shop</h2>
        
        {/* Shop Navigation Selector */}
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
              <div className="flex flex-wrap items-center gap-3">
                {/* Team selection dropdown */}
                <select 
                  value={selectedShopTeam}
                  onChange={(e) => setSelectedShopTeam(e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-black uppercase tracking-widest"
                >
                  {NFL_TEAMS.map((t: Team) => (
                    <option key={t.id} value={t.id} className="bg-zinc-950">{t.city} {t.name}</option>
                  ))}
                </select>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Search apparel..." 
                    value={merchSearch}
                    onChange={(e) => setMerchSearch(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 font-bold focus:outline-none focus:border-blue-500 w-44 focus:w-56 transition-all"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5" />
                </div>
              </div>
            </div>

            {/* Category selection rail */}
            <div className="flex flex-wrap gap-2 pt-2 overflow-x-auto pb-1 scrollbar-hide">
              {merchCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setMerchCategory(cat.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all shrink-0",
                    merchCategory === cat.id
                      ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/10"
                      : "bg-zinc-900/50 text-zinc-400 border-white/5 hover:border-white/20 select-none"
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
                      className="bg-gradient-to-br from-zinc-900/40 via-zinc-900/20 to-transparent p-5 rounded-2xl border border-blue-500/10 hover:border-blue-500/35 transition-all group flex flex-col justify-between"
                    >
                      <div>
                        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-950 border border-white/5 mb-4 relative">
                          <NFLImage item={p} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                          <div className="absolute top-2.5 right-2.5 bg-blue-600/90 text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-white" /> BEST SELLER
                          </div>
                        </div>
                        <h5 className="text-sm font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors uppercase italic">{p.name}</h5>
                        <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1.5 font-semibold tracking-wide leading-relaxed">{p.description}</p>
                      </div>
                      <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-black text-white text-base">${p.price}</p>
                            {p.discount > 0 && (
                              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded">-{p.discount}%</p>
                            )}
                          </div>
                          {p.discount > 0 && (
                            <p className="text-[8px] text-zinc-500 font-bold uppercase mt-0.5">Live Discount (Save ${saveAmt})</p>
                          )}
                        </div>
                        <button 
                          onClick={() => setSelectedProduct(p)}
                          className="px-4 py-2 bg-blue-600 text-white font-black text-[9px] rounded-lg tracking-wider uppercase hover:bg-blue-500 transition-colors"
                        >
                          Checkout Details
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
                  <div key={item.id} className="bg-zinc-950 border border-white/5 hover:border-white/10 rounded-[2rem] p-5 flex flex-col justify-between group transition-all relative">
                    {item.discount > 0 && (
                      <div className="absolute top-4 left-4 z-10 bg-rose-500 text-black text-[8px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full shadow-lg font-mono">
                        -{item.discount}% SALE
                      </div>
                    )}
                    <div>
                      <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 mb-5 relative">
                        <NFLImage item={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[8px] font-black uppercase text-blue-500 tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-md">{item.category}</span>
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-500/10 bg-emerald-500/5 px-2 py-0.5 rounded-md">IN STOCK</span>
                        </div>
                        <h4 className="text-base font-black italic uppercase leading-tight line-clamp-1 text-white">{item.name}</h4>
                        <p className="text-zinc-500 text-[10px] font-semibold leading-relaxed tracking-wide line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        {item.discount > 0 ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-mono font-black text-rose-400 text-lg leading-none">${item.price}</span>
                            <span className="font-mono font-medium text-xs text-zinc-500 line-through">${item.originalPrice}</span>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-white text-lg leading-none">${item.price}</span>
                        )}
                        <p className="text-[8px] font-black uppercase text-zinc-500 tracking-wider mt-1.5 flex items-center gap-1">★ {item.rating} ({item.reviewsCount} verified reviews)</p>
                      </div>

                      <button 
                        onClick={() => setSelectedProduct(item)}
                        className="px-5 py-3 bg-blue-600 rounded-xl text-[9px] text-white font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/10"
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

              <div className="flex flex-wrap items-center gap-3">
                <select 
                  value={ticketSort}
                  onChange={(e: any) => setTicketSort(e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-black uppercase tracking-widest"
                >
                  <option value="date">Sort By: Gameday Date</option>
                  <option value="cheapest">Sort By: Cheapest Seats First</option>
                </select>

                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Filter by Team name..." 
                    value={ticketTeam}
                    onChange={(e) => setTicketTeam(e.target.value)}
                    className="bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 font-bold focus:outline-none focus:border-blue-500 w-44"
                  />
                  <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3.5" />
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
                  <div key={game.id} className="bg-zinc-900/20 border border-white/5 hover:border-white/10 rounded-[2rem] overflow-hidden group hover:bg-zinc-900/45 transition-all flex flex-col justify-between">
                    <div>
                      <div className="aspect-[4/3] overflow-hidden relative border-b border-white/5">
                        <NFLImage item={game} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95" />
                        
                        <div className="absolute top-4 left-4 bg-zinc-950/85 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                          <Ticket className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-white leading-none">BOX OFFICE OPEN</span>
                        </div>

                        {game.isResale && (
                          <div className="absolute top-4 right-4 bg-amber-600/90 backdrop-blur-md px-3 py-1 rounded-xl">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white">RESALE TICKETS</span>
                          </div>
                        )}
                      </div>

                      <div className="p-6 space-y-4">
                        <div>
                          <div className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-1.5 font-mono">{formattedDate} @ {game.time}</div>
                          <h4 className="text-lg font-black uppercase leading-tight italic line-clamp-1 text-white">{game.name}</h4>
                        </div>
                        
                        <div className="space-y-2 text-[10px] bg-zinc-950/40 p-4 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Stadium</span>
                            <span className="text-zinc-300 font-black uppercase tracking-wide truncate max-w-[150px]">{game.stadium}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Location</span>
                            <span className="text-zinc-300 font-black uppercase tracking-wide">{game.city}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-500 font-bold uppercase tracking-wider">Tier Options</span>
                            <span className="text-white font-black uppercase tracking-wider text-[9px] bg-blue-600/10 text-blue-400 px-2 py-0.5 rounded">VIP + General</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 border-t border-white/5 mt-4 flex items-center justify-between">
                      <div className="pt-4">
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest block">Available Seat Rates</span>
                        <div className="flex items-baseline gap-1 mt-1">
                          <span className="font-mono text-white text-lg font-black">${game.cheapestPrice}</span>
                          <span className="text-[9px] text-zinc-500 font-semibold lowercase">to</span>
                          <span className="font-mono text-zinc-400 text-xs font-bold">${game.vipPrice} (VIP)</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <a 
                          href={game.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-3.5 bg-white hover:bg-zinc-200 text-black font-black text-[9px] rounded-xl tracking-widest uppercase flex items-center gap-1.5 transition-colors shadow-2xl"
                        >
                          Buy Ticket <ExternalLink className="w-3 h-3" />
                        </a>
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
              <div key={item.id} className="relative group overflow-hidden rounded-3xl md:rounded-[3rem] bg-zinc-900 border border-white/5 flex flex-col md:flex-row hover:border-blue-600/30 transition-all">
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
                  <span className="text-white font-black font-mono">Official NFL Fanatics Depot</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* 1. Official NFL External Store Redirect */}
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
    </div>
  );
};

// --- Customer Care Admin Portal ---
const AdminPortal = ({ user }: { user: any }) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"inquiries" | "orders" | "users" | "transactions" | "experiences">("inquiries");
  const [searchTerm, setSearchTerm] = useState("");
  const [replyText, setReplyText] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<any | null>(null);
  const [editingReplyIdx, setEditingReplyIdx] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);
  const [permError, setPermError] = useState<string | null>(null);

  const [notificationSettings, setNotificationSettings] = useState<any>({
    discord: { enabled: false, url: "" },
    telegram: { enabled: false, botToken: "", chatId: "" },
    slack: { enabled: false, url: "" },
    email: { enabled: false, smtpHost: "", smtpPort: "587", smtpSecure: false, smtpUser: "", smtpPass: "", fromEmail: "", toEmail: "" }
  });
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [isSavingNotificationSettings, setIsSavingNotificationSettings] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'inquiry' | 'ledger' | 'user' } | null>(null);

  const handleDeleteInquiry = async (id: string) => {
    try {
      setAdminLoading(true);
      await deleteDoc(doc(db, "fan_card_requests", id));
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null);
      }
    } catch (err: any) {
      console.error("Delete Inquiry Error:", err);
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

  // Keep selectedInquiry in real-time sync with database requests list
  useEffect(() => {
    if (selectedInquiry) {
      const updated = requests.find(r => r.id === selectedInquiry.id);
      if (updated) {
        setSelectedInquiry(updated);
      }
    }
  }, [requests, selectedInquiry?.id]);

  // Load notification settings for admin
  useEffect(() => {
    if (user?.email === "alexwtchmn@gmail.com") {
      const loadNotificationSettings = async () => {
        try {
          const snap = await getDoc(doc(db, "admin_settings", "notifications"));
          if (snap.exists()) {
            const data = snap.data();
            setNotificationSettings(data);
            
            // Automatically keep server config in sync when admin loads control desk
            const token = await user.getIdToken();
            await fetch("/api/save-settings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify(data)
            });
          }
        } catch (err) {
          console.error("Error loading notification settings:", err);
        }
      };
      loadNotificationSettings();
    }
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

  const handleSaveEditedReply = async (idx: number) => {
    if (!selectedInquiry || !editReplyText.trim()) return;
    try {
      const updatedReplies = [...(selectedInquiry.replies || [])];
      if (updatedReplies[idx]) {
        updatedReplies[idx] = {
          ...updatedReplies[idx],
          text: editReplyText,
          editedAt: new Date().toISOString(),
          isEdited: true
        };
        await updateDoc(doc(db, "fan_card_requests", selectedInquiry.id), {
          replies: updatedReplies
        });
        setEditingReplyIdx(null);
        setEditReplyText("");
      }
    } catch (err) {
      console.error("Error editing reply:", err);
      alert("Failed to edit reply.");
    }
  };

  const handleDeleteReply = async (idx: number) => {
    if (!selectedInquiry) return;
    try {
      const updatedReplies = [...(selectedInquiry.replies || [])];
      updatedReplies.splice(idx, 1);
      
      await updateDoc(doc(db, "fan_card_requests", selectedInquiry.id), {
        replies: updatedReplies
      });
    } catch (err) {
      console.error("Error deleting reply:", err);
      alert("Failed to delete reply.");
    }
  };

  const saveNotificationSettings = async () => {
    setIsSavingNotificationSettings(true);
    try {
      // 1. Save to Firestore (client-side backup)
      await setDoc(doc(db, "admin_settings", "notifications"), notificationSettings);
      
      // 2. Save securely to server-side filesystem
      if (user) {
        const token = await user.getIdToken();
        const response = await fetch("/api/save-settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify(notificationSettings)
        });
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Failed to persist config on server side");
        }
      }
      
      alert("Notification settings saved successfully.");
    } catch (err) {
      console.error("Error saving notification settings:", err);
      alert("Failed to save notification settings: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSavingNotificationSettings(false);
    }
  };

  const testNotification = async () => {
    setIsTestingNotification(true);
    try {
      const response = await fetch("/api/notify-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: "TEST-12345",
          name: "Terminal Administrator",
          email: "alexwtchmn@gmail.com",
          contact: "System Console",
          message: "This is a secure connection verification test for your inquiry notification system.",
          isTest: true
        })
      });
      const data = await response.json();
      if (data.success) {
        alert("Test alert successfully dispatched to enabled channels!");
      } else {
        alert("Alert dispatch failed: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Error testing notifications:", err);
      alert("Test request failed: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsTestingNotification(false);
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
          <button 
            onClick={() => { setActiveSubTab("experiences"); setSearchTerm(""); }}
            className={cn("px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap", activeSubTab === "experiences" ? "bg-blue-600 text-white" : "bg-zinc-900 text-zinc-500")}
          >
            Experiences
          </button>
        </div>
      </div>

      {activeSubTab === "inquiries" && (
        <div className="bg-zinc-950/40 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/10 rounded-2xl border border-blue-600/20 text-blue-400 shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                  Real-Time Inquiry Alerts
                  <span className="bg-blue-500/10 text-blue-400 text-[8px] font-mono uppercase tracking-widest px-2 py-0.5 rounded border border-blue-400/15">Active</span>
                </h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest leading-relaxed">Connect Discord, Slack, Telegram, or custom SMTP Email (Zoho, Gmail, etc.) to get instant push notifications when clients make an inquiry</p>
              </div>
            </div>
            <button
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all self-start sm:self-center"
            >
              {showNotificationSettings ? "Hide Settings" : "Configure Channels"}
            </button>
          </div>

          {showNotificationSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 border-t border-white/5">
              {/* Discord Configuration */}
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#5865F2]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Discord Webhook</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.discord?.enabled || false}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          discord: { ...notificationSettings.discord, enabled: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#5865F2]" />
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Webhook URL</label>
                    <input 
                      type="password" 
                      placeholder="https://discord.com/api/webhooks/..." 
                      value={notificationSettings.discord?.url || ""}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        discord: { ...notificationSettings.discord, url: e.target.value }
                      })}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono transition-all text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Slack Configuration */}
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#4A154B]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Slack Webhook</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.slack?.enabled || false}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          slack: { ...notificationSettings.slack, enabled: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4A154B]" />
                    </label>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Webhook URL</label>
                    <input 
                      type="password" 
                      placeholder="https://hooks.slack.com/services/..." 
                      value={notificationSettings.slack?.url || ""}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        slack: { ...notificationSettings.slack, url: e.target.value }
                      })}
                      className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono transition-all text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Telegram Configuration */}
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#0088cc]" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Telegram Bot</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.telegram?.enabled || false}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          telegram: { ...notificationSettings.telegram, enabled: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0088cc]" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Bot Token</label>
                      <input 
                        type="password" 
                        placeholder="123456:ABC..." 
                        value={notificationSettings.telegram?.botToken || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          telegram: { ...notificationSettings.telegram, botToken: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Chat ID</label>
                      <input 
                        type="text" 
                        placeholder="-100123..." 
                        value={notificationSettings.telegram?.chatId || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          telegram: { ...notificationSettings.telegram, chatId: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono transition-all text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Email/SMTP (Zoho/Gmail) Configuration */}
              <div className="bg-zinc-900/60 p-6 rounded-3xl border border-white/5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Email SMTP</h4>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={notificationSettings.email?.enabled || false}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, enabled: e.target.checked }
                        })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-zinc-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">SMTP Host</label>
                      <input 
                        type="text" 
                        placeholder="smtp.zoho.com" 
                        value={notificationSettings.email?.smtpHost || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, smtpHost: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Port</label>
                      <input 
                        type="text" 
                        placeholder="465" 
                        value={notificationSettings.email?.smtpPort || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, smtpPort: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 font-mono transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Username / SMTP User</label>
                      <input 
                        type="text" 
                        placeholder="admin@yourdomain.com" 
                        value={notificationSettings.email?.smtpUser || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, smtpUser: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••" 
                        value={notificationSettings.email?.smtpPass || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, smtpPass: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Sender Name</label>
                      <input 
                        type="text" 
                        placeholder='"Gridiron Admin" <user@domain.com>' 
                        value={notificationSettings.email?.fromEmail || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, fromEmail: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Alert Receiver Email</label>
                      <input 
                        type="email" 
                        placeholder="alexwtchmn@gmail.com" 
                        value={notificationSettings.email?.toEmail || ""}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          email: { ...notificationSettings.email, toEmail: e.target.value }
                        })}
                        className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-blue-600 transition-all text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="smtpSecure"
                      checked={notificationSettings.email?.smtpSecure || false}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: { ...notificationSettings.email, smtpSecure: e.target.checked }
                      })}
                      className="rounded border-white/10 bg-zinc-950 text-blue-600 focus:ring-blue-600"
                    />
                    <label htmlFor="smtpSecure" className="text-[9px] font-black uppercase tracking-wider text-zinc-400 cursor-pointer selection:bg-transparent">
                      SSL/TLS Connection (Secure)
                    </label>
                  </div>
                </div>
              </div>

              {/* Save & Test Buttons Row */}
              <div className="lg:col-span-4 flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  onClick={testNotification}
                  disabled={isTestingNotification}
                  className="px-6 py-2 bg-zinc-950 hover:bg-zinc-900 border border-white/10 text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" /> {isTestingNotification ? "Dispatching..." : "Send Test Notification"}
                </button>
                <button
                  onClick={saveNotificationSettings}
                  disabled={isSavingNotificationSettings}
                  className="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {isSavingNotificationSettings ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {permError && (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl flex items-center gap-4">
          <AlertCircle className="w-6 h-6 text-rose-500" />
          <p className="text-xs font-black uppercase tracking-widest text-rose-400">{permError}</p>
        </div>
      )}

      <div className="bg-zinc-900/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
        {activeSubTab === "experiences" ? (
          <ExperienceAdmin />
        ) : activeSubTab === "transactions" ? (
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
                    <div className="flex justify-end items-center gap-3">
                      {t.status === 'pending' && (
                        <button 
                          onClick={() => updateTransactionStatus(t.id, t.userId, 'Confirmed')}
                          className="px-3 py-1 bg-emerald-600/20 border border-emerald-600/30 text-emerald-400 text-[8px] font-black uppercase rounded-md hover:bg-emerald-600 hover:text-white transition-all mr-1"
                        >
                          Approve
                        </button>
                      )}
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest mr-2",
                        t.status === 'Confirmed' ? "text-emerald-400" : 
                        t.status === 'pending' ? "text-blue-400" : "text-zinc-500"
                      )}>
                        {t.status || 'pending'}
                      </span>
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
                          className="p-1.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 rounded-lg transition-all hover:text-white disabled:opacity-50"
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
        ) : (
          <table className="w-full text-left">
            <thead className="bg-zinc-950 border-b border-white/5">
              <tr>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Entity</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Contact Handle</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono">Message / Detail</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Status</th>
                {activeSubTab === "inquiries" && (
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 font-mono text-right">Actions</th>
                )}
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
                  {activeSubTab === "inquiries" && (
                    <td className="p-6 text-right" onClick={(e) => e.stopPropagation()}>
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
                    </td>
                  )}
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
              <h4 className="text-2xl font-black italic uppercase italic tracking-tighter mb-2 flex items-center gap-4">
                Active Conversation: {selectedInquiry.id}
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
                    className="px-3 py-1 bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-500 hover:text-white text-[8px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1"
                    title="Delete Inquiry Permanently"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete Inquiry
                  </button>
                )}
              </h4>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Reviewing initial inquiry & drafting response...</p>
            </div>
            <button onClick={() => setSelectedInquiry(null)} className="text-zinc-500 hover:text-white"><X /></button>
          </div>

          <div className="space-y-4">
            <div className="bg-zinc-950 p-6 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Original Inquiry</p>
              <p className="text-sm font-medium text-white">{selectedInquiry.message}</p>
            </div>
            {selectedInquiry.replies?.map((r: any, idx: number) => {
              const isCc = r.sender === 'Customer Care';
              const isEditing = editingReplyIdx === idx;
              return (
                <div key={idx} className={cn(
                  "p-6 rounded-2xl border ml-8 relative group transition-all",
                  isCc ? "bg-blue-600/5 border-blue-600/10" : "bg-zinc-900/40 border-white/5"
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest flex items-center gap-2",
                      isCc ? "text-blue-500" : "text-zinc-500"
                    )}>
                      {r.sender} {r.isEdited && <span className="text-[8px] text-zinc-500 italic font-medium lowercase tracking-normal">(edited)</span>}
                    </p>
                    {isCc && !isEditing && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingReplyIdx(idx);
                            setEditReplyText(r.text);
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white flex items-center gap-1 bg-zinc-950 border border-white/5 px-2.5 py-1 rounded-lg"
                        >
                          <Edit2 className="w-2.5 h-2.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteReply(idx)}
                          className="text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400 flex items-center gap-1 bg-zinc-950 border border-white/5 px-2.5 py-1 rounded-lg"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-3 mt-2">
                      <textarea
                        value={editReplyText}
                        onChange={(e) => setEditReplyText(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-medium"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingReplyIdx(null);
                            setEditReplyText("");
                          }}
                          className="px-3 py-1.5 bg-zinc-900 text-zinc-400 text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-800 transition-colors border border-white/5"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSaveEditedReply(idx)}
                          className="px-4 py-1.5 bg-white text-black text-[9px] font-black uppercase tracking-wider rounded-xl hover:bg-zinc-200 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-zinc-300 whitespace-pre-line">{r.text}</p>
                  )}
                </div>
              );
            })}
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
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };
  const [activeTicket, setActiveTicket] = useState<string | null>(localStorage.getItem("active_ticket_id"));
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"markets" | "draft" | "portfolio" | "shop" | "admin" | "experiences">("markets");
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
          const items: any[] = [];
          snap.forEach(d => {
            const data = d.data();
            if (data.userId === userId) {
              items.push({ id: d.id, ...data });
            }
          });
          setUserBookings(items);
        });
      } else {
        setUser(null);
        setBalance(0);
        setPortfolio([]);
        setUserBookings([]);
        portfolioRef.current = [];
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
        let provider;
        if (e === "google") {
          provider = new GoogleAuthProvider();
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
      } else if (err.code === "auth/unauthorized-domain") {
        const domain = window.location.hostname;
        const isInIframe = window.self !== window.top;
        console.error("FIREBASE UNAUTHORIZED DOMAIN ERROR:", domain);
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
    if (isSubmittingInquiry) return;
    setIsSubmittingInquiry(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const requestId = `TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const submittedEmail = (user?.email || formData.get("email") as string || "").trim().toLowerCase();
    
    try {
      await setDoc(doc(db, "fan_card_requests", requestId), {
        userId: user ? user.uid : 'guest',
        userEmail: submittedEmail || null,
        userName: formData.get("name") as string,
        teamId: formData.get("team") as string,
        contactMethod: formData.get("contact") as string,
        message: formData.get("message") as string,
        status: "pending",
        replies: [],
        timestamp: serverTimestamp()
      });
      
      setInquirySuccess(requestId);

      // Securely dispatch notification alerts via our backend API
      try {
        await fetch("/api/notify-inquiry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId,
            name: formData.get("name") as string,
            email: submittedEmail || null,
            contact: formData.get("contact") as string,
            message: formData.get("message") as string,
            isTest: false
          })
        });
      } catch (notifyErr) {
        console.warn("Handled warning sending notification alert:", notifyErr);
      }
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
            <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-950 rounded-lg md:rounded-xl flex items-center justify-center border border-white/10 group-hover:scale-105 transition-all overflow-hidden">
              <img src={NFL_LOGO_URL} alt="NFL Shield Logo" className="w-full h-full object-contain p-1" />
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
              { id: "experiences", label: "Experiences", icon: Star },
              { id: "shop", label: "Arena Shop", icon: ShoppingBag },
              { id: "portfolio", label: "Portfolio", icon: History },
              ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control", icon: ShieldCheck }] : [])
            ] as any[]).map(tab => (
              <button 
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setDismissedHero(true);
                }}
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
          { id: "experiences", label: "Experiences", icon: Star },
          { id: "shop", label: "Shop", icon: ShoppingBag },
          { id: "portfolio", label: "Portfolio", icon: History },
          ...(user?.email === "alexwtchmn@gmail.com" ? [{ id: "admin", label: "Control", icon: ShieldCheck }] : [])
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setDismissedHero(true);
            }}
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

                  <button 
                    onClick={() => {
                      setShowInquiryStatus(null);
                      setTrackedInquiry(null);
                      setEmailInquiries(null);
                      setTrackingEmail("");
                      setTrackingId("");
                    }}
                    className="w-full py-4 bg-zinc-850 border border-white/5 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl hover:bg-zinc-800 transition-all"
                  >
                    Return to Main Menu
                  </button>
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
                    {trackedInquiry.replies?.map((r: any, idx: number) => {
                      const isCustomerCare = r.sender === 'Customer Care';
                      return (
                        <div 
                          key={idx} 
                          className={cn(
                            "p-4 sm:p-6 rounded-2xl max-w-[90%] sm:max-w-[80%] border transition-all",
                            isCustomerCare 
                              ? "bg-blue-600/10 border-blue-600/20 ml-auto" 
                              : "bg-zinc-950 border-white/5 mr-auto"
                          )}
                        >
                          <p className={cn(
                            "text-[10px] font-black uppercase mb-2 tracking-widest",
                            isCustomerCare ? "text-blue-500" : "text-zinc-500"
                          )}>
                            {isCustomerCare ? "Customer Care" : "You (Reply)"}
                          </p>
                          <p className={cn(
                            "text-xs sm:text-sm font-medium",
                            isCustomerCare ? "text-zinc-100" : "text-white"
                          )}>{r.text}</p>
                          {r.timestamp && (
                            <p className={cn(
                              "text-[8px] font-mono mt-2",
                              isCustomerCare ? "text-blue-400/50" : "text-zinc-600"
                            )}>{new Date(r.timestamp).toLocaleString()}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Reply Box */}
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
        <div className="flex-1 overflow-y-auto no-scrollbar bg-black/40">
          {/* Hero Section */}
          <section className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 text-center relative overflow-hidden">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-4xl w-full flex flex-col items-center"
            >
              <div className="w-20 h-28 md:w-28 md:h-36 bg-zinc-950 rounded-2xl p-2.5 border border-white/10 mb-6 shadow-2xl overflow-hidden flex items-center justify-center">
                <img src={NFL_LOGO_URL} alt="NFL Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-8xl font-black italic uppercase tracking-tighter mb-6 md:mb-8 leading-none">
                THE <span className="text-blue-600">NFL</span><br/>EXCHANGE
              </h1>
              <p className="text-sm sm:text-lg md:text-xl text-zinc-400 mb-8 md:mb-12 max-w-2xl mx-auto font-black italic uppercase tracking-widest leading-relaxed">
                Live Franchise Equity · Institutional Execution · 24/7 Market Liquidity
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 px-4 w-full sm:w-auto">
                <button onClick={() => setShowLogin(true)} className="bg-white text-black px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-zinc-200 transition-all shadow-2xl shadow-white/5 whitespace-nowrap">
                  ACCESS TRADING TERMINAL
                </button>
                <button onClick={() => setDismissedHero(true)} className="bg-zinc-900 border border-white/10 text-white px-6 sm:px-12 py-4 sm:py-5 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-2xl whitespace-nowrap">
                  EXPLORE LIVE EXCHANGE
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
                    <NFLImage item={news} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
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
                          <NFLImage item={item} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" />
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
      {(user || dismissedHero) && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
          {/* Sidebar */}
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
          </aside>

          {/* Activity Area */}
          <main className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto custom-scrollbar">
            {activeTab === "markets" && (
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

            {activeTab === "experiences" && (
              <div className="p-4 sm:p-6 md:p-10 space-y-12">
                {/* Visual advertising rotating banners */}
                <PromoSlider 
                  onActionClick={(banner) => {
                    setDeepLinkExp(banner);
                  }}
                />

                {/* Experiences listings and bookings core */}
                <ExperiencesSection 
                  initialTargetExperience={deepLinkExp}
                  onRequestLoginModal={() => setShowLogin(true)}
                  onNotifyCheckout={() => {
                    console.log("Invoice finalized.");
                  }}
                />
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
                    <div>
                      <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">My Active Passes</h4>
                      <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-1">Authorized tickets & secure access passes for upcoming VIP NFL events.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userBookings.map((b: any) => (
                        <div key={b.id} className="p-5 bg-zinc-900/60 border border-white/5 rounded-[2rem] flex items-center gap-5">
                          <NFLImage item={b} className="w-20 h-20 rounded-2xl object-cover border border-white/5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <span className={cn(
                              "inline-flex px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-widest mb-1.5",
                              b.status === "approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-amber-500/10 text-amber-500 border border-amber-500/10"
                            )}>
                              {b.status === "approved" ? "AUTHORIZED PASS" : "PENDING AUDIT"}
                            </span>
                            <h5 className="text-xs font-black uppercase tracking-tight text-white truncate">{b.experienceTitle}</h5>
                            <p className="text-[9px] font-black text-zinc-500 font-mono uppercase mt-0.5">{b.tier.toUpperCase()} · {b.date} · {b.timeSlot}</p>
                            <p className="text-[8px] font-mono font-black text-blue-400 mt-1 uppercase select-all">PASSCODE: {b.qrCode}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
              <button onClick={() => { setShowFanCardForm(false); setInquirySuccess(null); }} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              {inquirySuccess ? (
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
                      className="flex-grow py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                    >
                      View Live Thread
                    </button>
                    <button
                      onClick={() => {
                        setInquirySuccess(null);
                        setShowFanCardForm(false);
                      }}
                      className="flex-grow py-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-black uppercase tracking-widest text-[10px] rounded-xl transition-all"
                    >
                      Close Window
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-4 leading-none">Concierge Inquiry</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.1em] mb-6 md:mb-10 italic">Customer Care Protocol: Requesting Asset Pricing & Access</p>
                  
                  <form onSubmit={handleFanCardRequest} className="space-y-4 md:space-y-8 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Full Name / Identifier</label>
                      <input name="name" required disabled={isSubmittingInquiry} defaultValue={user?.displayName || ""} placeholder="e.g. Alex Rivera" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Franchise Asset</label>
                      <select name="team" required disabled={isSubmittingInquiry} defaultValue={selectedTeam.id} className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold uppercase transition-all disabled:opacity-50">
                        {NFL_TEAMS.map(t => <option key={t.id} value={t.id}>{t.city} {t.name} - Asset Allocation</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Email Address</label>
                      <input 
                        type="email" 
                        name="email" 
                        required 
                        disabled={isSubmittingInquiry || !!user} 
                        defaultValue={user?.email || ""} 
                        placeholder="e.g. alex@example.com" 
                        className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50" 
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Contact Handle</label>
                      <input name="contact" required disabled={isSubmittingInquiry} placeholder="e.g. Telegram: @handle / Email: name@domain.com" className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50" />
                    </div>
                    <div>
                      <label className="block text-[8px] md:text-[10px] font-black uppercase text-zinc-500 mb-2 md:mb-3 tracking-widest">Inquiry details</label>
                      <textarea name="message" required disabled={isSubmittingInquiry} rows={3} placeholder="Tell us which match tickets or fan cards you are interested in. Our team will reply with current market rates..." className="w-full bg-zinc-950 border border-white/5 rounded-2xl px-6 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold transition-all disabled:opacity-50" />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isSubmittingInquiry}
                      className="w-full py-5 bg-white text-black font-black uppercase tracking-widest text-[10px] md:text-xs rounded-2xl hover:bg-zinc-200 transition-all shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmittingInquiry ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          DELIVERING INQUIRY...
                        </>
                      ) : "SUBMIT TO CUSTOMER CARE"}
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
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-white to-red-600" />
              <button onClick={() => setShowLogin(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
                <X />
              </button>

              <div className="text-center mb-8 md:mb-10">
                <div className="w-14 md:w-16 h-18 md:h-22 bg-zinc-950 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-6 -rotate-6 shadow-xl border border-white/10 overflow-hidden">
                  <img src={NFL_LOGO_URL} alt="NFL Logo" className="w-full h-full object-contain p-1.5" />
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
                
                <div>
                  <button 
                    onClick={() => handleAuth("google")}
                    disabled={authLoading}
                    className="w-full flex items-center justify-center gap-3 py-4 bg-zinc-950 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group disabled:opacity-50"
                  >
                    {authLoading ? (
                      <div className="w-4 h-4 border-2 border-white/10 border-t-white/60 rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-white/60 group-hover:fill-white transition-colors" viewBox="0 0 24 24">
                          <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.9 3.33-1.91 4.34-1.2 1.2-3.07 2.48-6.93 2.48-6.12 0-10.88-4.94-10.88-11.06s4.76-11.06 10.88-11.06c3.28 0 5.66 1.3 7.34 2.9l2.31-2.31c-2.5-2.07-5.59-3.33-9.65-3.33-7.41 0-13.48 6.07-13.48 13.48s6.07 13.48 13.48 13.48c4.08 0 7.34-1.35 9.87-3.99 2.53-2.64 3.34-6.39 3.34-9.28 0-.89-.07-1.74-.2-2.54h-12.8z"/>
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">Continue with Google</span>
                      </>
                    )}
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
