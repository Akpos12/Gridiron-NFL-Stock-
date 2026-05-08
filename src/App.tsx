import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Newspaper, 
  LineChart as ChartIcon, 
  ArrowUpRight, 
  ArrowDownRight,
  User as UserIcon,
  LogOut,
  Bell,
  Search,
  ChevronRight,
  ShieldCheck,
  Star
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { auth, db } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "firebase/auth";
import { collection, onSnapshot, query, where, doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { NFL_TEAMS, getLogoUrl, Team } from "./constants";
import { cn, formatCurrency, formatPercent } from "./lib/utils";

// Mock Data Generator for Charts
const generateHistory = (basePrice: number) => {
  const data = [];
  let current = basePrice;
  for (let i = 0; i < 20; i++) {
    const change = (Math.random() - 0.45) * (basePrice * 0.05);
    current += change;
    data.push({ time: i, price: current });
  }
  return data;
};

// --- Sub-components ---

const TeamTicker = ({ team, price, change }: { team: Team, price: number, change: number }) => (
  <div className="flex items-center gap-3 py-2 px-4 border-r border-white/10 shrink-0">
    <img src={getLogoUrl(team.id)} alt={team.id} className="w-6 h-6" referrerPolicy="no-referrer" />
    <span className="font-mono font-bold text-sm tracking-tight">{team.id}</span>
    <span className="font-mono text-xs">${price.toFixed(2)}</span>
    <span className={cn(
      "text-[10px] font-bold px-1.5 py-0.5 rounded",
      change >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
    )}>
      {change >= 0 ? "+" : ""}{change.toFixed(2)}%
    </span>
  </div>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<Record<string, { price: number, change: number, history: any[] }>>({});
  const [selectedTeam, setSelectedTeam] = useState<Team>(NFL_TEAMS.find(t => t.id === "MIN")!);
  const [showLogin, setShowLogin] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showWallet, setShowWallet] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [news, setNews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState<number>(1);
  const [balance, setBalance] = useState<number>(0);

  // Simulation of Live Prices
  useEffect(() => {
    const initial: any = {};
    NFL_TEAMS.forEach(t => {
      const base = 50 + Math.random() * 200;
      initial[t.id] = {
        price: base,
        change: (Math.random() - 0.5) * 5,
        history: generateHistory(base)
      };
    });
    setMarketData(initial);

    const interval = setInterval(() => {
      setMarketData(prev => {
        const next = { ...prev };
        NFL_TEAMS.forEach(t => {
          const change = (Math.random() - 0.48) * 0.5;
          const old = next[t.id];
          const newPrice = old.price + change;
          next[t.id] = {
            ...old,
            price: newPrice,
            change: ((newPrice - old.history[0].price) / old.history[0].price) * 100,
            history: [...old.history.slice(1), { time: Date.now(), price: newPrice }]
          };
        });
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Auth & Data fetching
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // Listen to User Profile (Balance)
        const userRef = doc(db, "users", u.uid);
        const unsubUser = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setBalance(snap.data().balance);
          }
        });

        // Listen to Portfolio
        const portfolioRef = collection(db, "users", u.uid, "portfolio");
        const unsubPortfolio = onSnapshot(portfolioRef, (snap) => {
          const items: any[] = [];
          snap.forEach(doc => items.push(doc.data()));
          setPortfolio(items);
        });

        return () => {
          unsubUser();
          unsubPortfolio();
        };
      } else {
        setUser(null);
        setPortfolio([]);
        setBalance(0);
      }
    });

    // Load News
    fetch("/api/news").then(r => r.json()).then(setNews);

    return () => unsub();
  }, []);

  const handleTrade = async (type: "buy" | "sell") => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    const price = marketData[selectedTeam.id].price;
    const totalCost = price * quantity;
    const portfolioItem = portfolio.find(p => p.teamId === selectedTeam.id);

    try {
      if (type === "buy") {
        if (balance < totalCost) {
          alert("Insufficient funds for this trade.");
          return;
        }

        const newShares = (portfolioItem?.shares || 0) + quantity;
        const newAvgPrice = ((portfolioItem?.shares || 0) * (portfolioItem?.avgPrice || 0) + totalCost) / newShares;

        // Update Balance
        await setDoc(doc(db, "users", user.uid), { balance: balance - totalCost }, { merge: true });
        
        // Update Portfolio
        await setDoc(doc(db, "users", user.uid, "portfolio", selectedTeam.id), {
          teamId: selectedTeam.id,
          shares: newShares,
          avgPrice: newAvgPrice
        });
      } else {
        if (!portfolioItem || portfolioItem.shares < quantity) {
          alert("You do not own enough shares to sell.");
          return;
        }

        const newShares = portfolioItem.shares - quantity;
        
        // Update Balance
        await setDoc(doc(db, "users", user.uid), { balance: balance + totalCost }, { merge: true });

        // Update Portfolio
        if (newShares === 0) {
          // Delete item using simulated persistence or just update to 0
          await setDoc(doc(db, "users", user.uid, "portfolio", selectedTeam.id), { shares: 0 }, { merge: true });
        } else {
          await setDoc(doc(db, "users", user.uid, "portfolio", selectedTeam.id), {
            shares: newShares
          }, { merge: true });
        }
      }

      // Record Transaction
      await setDoc(doc(collection(db, "users", user.uid, "transactions")), {
        userId: user.uid,
        type: type,
        assetId: selectedTeam.id,
        amount: totalCost,
        shares: quantity,
        price: price,
        timestamp: serverTimestamp()
      });

      alert(`Successfully ${type === "buy" ? "bought" : "sold"} ${quantity} shares of ${selectedTeam.name}`);
    } catch (err: any) {
      alert("Trade failed: " + err.message);
    }
  };

  const totalPortfolioValue = useMemo(() => {
    return portfolio.reduce((acc, item) => {
      const livePrice = marketData[item.teamId]?.price || item.avgPrice;
      return acc + (item.shares * livePrice);
    }, 0);
  }, [portfolio, marketData]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    try {
      if (username === "Jayne_Welage" && password === "Vikings") {
        await signInAnonymously(auth);
        const userDoc = doc(db, "users", auth.currentUser!.uid);
        await setDoc(userDoc, {
          uid: auth.currentUser!.uid,
          displayName: "Jayne_Welage",
          email: "jayne@gridironcapital.com",
          balance: 1250000,
          createdAt: serverTimestamp()
        });
        setShowLogin(false);
        return;
      }

      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "users", cred.user.uid), {
          uid: cred.user.uid,
          displayName: email.split('@')[0],
          email: email,
          balance: 10000,
          createdAt: serverTimestamp()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setShowLogin(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const userDocRef = doc(db, "users", cred.user.uid);
      const userSnap = await getDoc(userDocRef);
      
      if (!userSnap.exists()) {
        await setDoc(userDocRef, {
          uid: cred.user.uid,
          displayName: cred.user.displayName,
          email: cred.user.email,
          balance: 10000,
          createdAt: serverTimestamp()
        });
      }
      setShowLogin(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredTeams = NFL_TEAMS.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [activeTab, setActiveTab] = useState<"markets" | "draft">("markets");

  return (
    <div className="min-h-screen flex flex-col market-gradient overflow-hidden">
      {/* Ticker Bar */}
      <div className="h-10 bg-zinc-900/80 border-b border-white/5 flex items-center overflow-x-auto no-scrollbar whitespace-nowrap">
        {NFL_TEAMS.map(team => (
          <TeamTicker 
            key={team.id} 
            team={team} 
            price={marketData[team.id]?.price || 0} 
            change={marketData[team.id]?.change || 0} 
          />
        ))}
      </div>

      {/* Top Navbar */}
      <nav className="h-20 glass-card px-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.location.reload()}>
            <div className="w-10 h-10 bg-nfl-blue rounded-xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform">
              <TrendingUp className="text-white w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tighter leading-none italic uppercase leading-tight">Gridiron NFL</h1>
              <p className="text-[10px] tracking-[0.25em] font-bold text-zinc-500 uppercase">Stock Market</p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <button 
              onClick={() => setActiveTab("markets")}
              className={cn(activeTab === "markets" ? "text-white" : "hover:text-white transition-colors")}
            >Active Markets</button>
            <button 
              onClick={() => setActiveTab("draft")}
              className={cn(activeTab === "draft" ? "text-white" : "hover:text-white transition-colors")}
            >Draft Speculation</button>
            <button className="hover:text-white transition-colors">History</button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search teams, players..." 
              className="bg-zinc-800/50 border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-nfl-blue w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-zinc-500 font-bold uppercase">Liquidity</p>
                <p className="font-mono text-emerald-400 font-bold">{formatCurrency(balance)}</p>
              </div>
              <button 
                onClick={() => setShowWallet(true)}
                className="bg-nfl-blue hover:bg-nfl-blue/80 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-nfl-blue/20"
              >
                <Wallet className="w-4 h-4" />
                Wallet
              </button>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/10 group cursor-pointer relative">
                <UserIcon className="w-5 h-5 text-zinc-400" />
                <div className="absolute top-12 right-0 w-48 glass-card rounded-xl p-2 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity">
                  <div className="p-2 border-b border-white/5 mb-2">
                    <p className="text-xs font-bold truncate">{user.displayName || user.email}</p>
                    <p className="text-[10px] text-zinc-500">Tier: Pro Admin</p>
                  </div>
                  <button onClick={() => signOut(auth)} className="w-full text-left p-2 hover:bg-white/5 rounded text-xs flex items-center gap-2 text-rose-400">
                    <LogOut className="w-3 h-3" /> Log Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="bg-white text-black px-6 py-2 rounded-xl text-sm font-black uppercase tracking-tight hover:bg-zinc-200 transition-colors"
            >
              Investor Portal
            </button>
          )}
        </div>
      </nav>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {activeTab === "markets" ? (
          <>
            {/* Left Sidebar - Markets */}
            <aside className="w-80 border-r border-white/5 bg-zinc-900/30 flex flex-col">
          <div className="p-4 border-b border-white/5 flex justify-between items-center">
            <h2 className="font-black text-sm uppercase tracking-widest text-zinc-500">NFL Markets</h2>
            <div className="flex gap-2">
              <button className="w-7 h-7 bg-zinc-800 rounded flex items-center justify-center hover:bg-zinc-700 transition-colors">
                <TrendingUp className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTeams.map((team) => {
              const data = marketData[team.id];
              return (
                <button
                  key={team.id}
                  onClick={() => setSelectedTeam(team)}
                  className={cn(
                    "w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors border-b border-white/5 group",
                    selectedTeam.id === team.id && "bg-nfl-blue/10 border-l-2 border-l-nfl-blue"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800 p-1 group-hover:scale-110 transition-transform">
                      <img src={getLogoUrl(team.id)} alt={team.id} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-sm leading-none">{team.name}</h3>
                      <p className="text-[10px] text-zinc-500 uppercase mt-1">{team.id} · {team.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm">${data?.price.toFixed(2)}</p>
                    <p className={cn(
                      "text-[10px] font-bold",
                      (data?.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {(data?.change || 0) >= 0 ? "+" : ""}{(data?.change || 0).toFixed(2)}%
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Center - Chart & Trading */}
        <section className="flex-1 flex flex-col bg-zinc-950 overflow-y-auto">
          {/* Market Overview */}
          <div className="p-8 pb-0">
            <div className="flex items-end justify-between mb-8">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-zinc-900 rounded-3xl p-4 flex items-center justify-center border border-white/10 shadow-2xl">
                  <img src={getLogoUrl(selectedTeam.id)} alt={selectedTeam.id} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                </div>
                <div>
                  <h2 className="text-4xl font-black">{selectedTeam.city} {selectedTeam.name}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="font-mono text-3xl font-bold">${marketData[selectedTeam.id]?.price.toFixed(2)}</p>
                    <p className={cn(
                      "flex items-center gap-1 font-bold",
                      (marketData[selectedTeam.id]?.change || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {(marketData[selectedTeam.id]?.change || 0) >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      {Math.abs(marketData[selectedTeam.id]?.change || 0).toFixed(2)}%
                    </p>
                    <div className="h-4 w-px bg-white/10 mx-2" />
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Market Cap: ${((marketData[selectedTeam.id]?.price || 0) * 1000000).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                {["1H", "1D", "1W", "1M", "YTD", "ALL"].map(t => (
                  <button key={t} className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all",
                    t === "1D" ? "bg-white text-black" : "hover:bg-white/10 text-zinc-500"
                  )}>{t}</button>
                ))}
              </div>
            </div>

            {/* Price Chart */}
            <div className="h-[400px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={marketData[selectedTeam.id]?.history || []}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={marketData[selectedTeam.id]?.change >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={marketData[selectedTeam.id]?.change >= 0 ? "#10b981" : "#f43f5e"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={['auto', 'auto']} hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #3f3f46', background: '#18181b', color: '#fff' }}
                    labelStyle={{ display: 'none' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke={marketData[selectedTeam.id]?.change >= 0 ? "#10b981" : "#f43f5e"} 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Activity / Order Book / Portfolio Info */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-6 flex items-center justify-between">
                Market Execution
                <span className="text-emerald-400 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> SECURE</span>
              </h3>
              
              <div className="mb-6">
                <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 ml-1">Order Quantity</label>
                <div className="flex items-center gap-4 bg-zinc-800/50 border border-white/5 rounded-2xl p-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center font-bold hover:bg-zinc-600 transition-colors"
                  >-</button>
                  <input 
                    type="number" 
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="flex-1 bg-transparent text-center font-mono font-bold focus:outline-none"
                  />
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-xl bg-zinc-700 flex items-center justify-center font-bold hover:bg-zinc-600 transition-colors"
                  >+</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleTrade("buy")}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >BUY</button>
                <button 
                  onClick={() => handleTrade("sell")}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
                >SELL</button>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Order Stability</span>
                  <span className="font-bold text-emerald-400">ULTRA HIGH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Processing Fee</span>
                  <span className="font-bold">0.00%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total Estimate</span>
                  <span className="font-mono font-bold">{formatCurrency((marketData[selectedTeam.id]?.price || 0) * quantity)}</span>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-3xl p-6">
              <h3 className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-6">Your Position</h3>
              {portfolio.find(p => p.teamId === selectedTeam.id) ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Equity Value</p>
                      <p className="text-xl font-mono font-bold">{formatCurrency((portfolio.find(p => p.teamId === selectedTeam.id).shares * marketData[selectedTeam.id]?.price))}</p>
                    </div>
                    <div className="bg-zinc-800/50 p-4 rounded-2xl border border-white/5">
                      <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Return</p>
                      <p className="text-xl font-mono font-bold text-emerald-400">+{formatCurrency((portfolio.find(p => p.teamId === selectedTeam.id).shares * marketData[selectedTeam.id]?.price) - (portfolio.find(p => p.teamId === selectedTeam.id).shares * portfolio.find(p => p.teamId === selectedTeam.id).avgPrice))}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm uppercase tracking-tighter">
                      <span className="text-zinc-500">Shares Owned</span>
                      <span className="font-bold">{portfolio.find(p => p.teamId === selectedTeam.id).shares.toLocaleString()} units</span>
                    </div>
                    <div className="flex justify-between text-sm uppercase tracking-tighter">
                      <span className="text-zinc-500">Avg. Cost</span>
                      <span className="font-bold">${portfolio.find(p => p.teamId === selectedTeam.id).avgPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm uppercase tracking-tighter">
                      <span className="text-zinc-500">Portfolio Weight</span>
                      <span className="font-bold">100%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ChartIcon className="w-12 h-12 text-zinc-700 mb-4" />
                  <p className="text-sm font-medium text-zinc-500">No active position in {selectedTeam.name}</p>
                  <button className="text-nfl-blue text-xs font-bold uppercase mt-4 hover:underline">View Market Depth</button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Right Sidebar - News & Reviews */}
        <aside className="w-96 border-l border-white/5 bg-zinc-900/30 flex flex-col p-6 overflow-y-auto custom-scrollbar">
          <div className="mb-8">
            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Newspaper className="w-3 h-3" /> Gridiron Intel
            </h3>
            <div className="space-y-4">
              {news.map(item => (
                <div key={item.id} className="p-4 rounded-2xl bg-zinc-800/30 border border-white/5 hover:border-white/10 transition-colors cursor-pointer group">
                  <p className="text-[10px] text-nfl-blue font-bold uppercase mb-1">Breaking News</p>
                  <h4 className="font-bold text-sm leading-tight group-hover:text-white transition-colors">{item.title}</h4>
                  <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{item.summary}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] text-zinc-600 font-mono">15 min ago</p>
                    <ChevronRight className="w-3 h-3 text-zinc-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h3 className="font-black text-xs uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-2">
              <Star className="w-3 h-3 text-amber-400" /> Member Reviews
            </h3>
            <div className="space-y-4">
              {[
                { name: "Chad J.", text: "Gridiron Capital changed how I watch football. The market depth is insane.", rating: 5 },
                { name: "Sarah M.", text: "Best sports financial app out there. Fast deposits and sleek UI.", rating: 5 },
                { name: "Mike T.", text: "Turned my draft knowledge into real capital. Incredible platform.", rating: 4 }
              ].map((rev, i) => (
                <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 italic">
                  <div className="flex gap-1 mb-2">
                    {[...Array(rev.rating)].map((_, j) => <Star key={j} className="w-2 h-2 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-xs text-zinc-400">"{rev.text}"</p>
                  <p className="text-[10px] text-white font-bold mt-2">— {rev.name}</p>
                </div>
              ))}
            </div>
          </div>

              <div className="mt-auto glass-card p-4 rounded-2xl border-dashed border-zinc-700">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Live Notifications</p>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-medium">Draft Market opens in 48:12:05</p>
                </div>
              </div>
            </aside>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-zinc-950">
            <div className="max-w-2xl w-full">
              <div className="w-24 h-24 bg-nfl-blue/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-nfl-blue/30">
                <Search className="w-10 h-10 text-nfl-blue" />
              </div>
              <h2 className="text-4xl font-black mb-4 italic uppercase">Draft Speculation Market</h2>
              <p className="text-zinc-400 text-lg mb-12">
                Predict the future. Buy stock in college prospects before they hit the NFL big stage. 
                Our scout-driven valuation engine updates in real-time as the scouting combine approaches.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { name: "Caleb Williams", pos: "QB", school: "USC", price: 124.50 },
                  { name: "Drake Maye", pos: "QB", school: "UNC", price: 98.20 },
                  { name: "Marvin Harrison Jr.", pos: "WR", school: "OSU", price: 110.15 }
                ].map((p, i) => (
                  <div key={i} className="glass-card p-6 rounded-3xl text-left border-white/10 hover:border-nfl-blue transition-colors group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-lg flex items-center justify-center font-bold text-xs">{p.pos}</div>
                      <p className="font-mono text-emerald-400 text-xs">+12.4%</p>
                    </div>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{p.school}</p>
                    <div className="mt-6 flex items-center justify-between">
                      <p className="font-mono font-bold">${p.price.toFixed(2)}</p>
                      <button className="bg-white text-black px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors uppercase">Buy</button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-16 p-8 border border-dashed border-zinc-800 rounded-3xl">
                <p className="text-zinc-500 text-sm italic font-medium">"The Draft Market is currently in 'Limited Preview' mode for Pro accounts like yours."</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      <AnimatePresence>
        {showLogin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-nfl-blue via-white to-nfl-red" />
              <button 
                onClick={() => setShowLogin(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                &times;
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-nfl-blue rounded-2xl flex items-center justify-center mx-auto mb-4 -rotate-3">
                  <TrendingUp className="text-white w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black italic uppercase italic leading-tight">Gridiron NFL<br/>Stock Market</h2>
                <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-black text-[10px]">Investor Terminal</p>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isSignUp && (
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1">Legacy Institutional ID (Optional)</label>
                    <input 
                      name="username"
                      type="text" 
                      placeholder="System Access Key" 
                      className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-nfl-blue"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1">Email Connection</label>
                  <input 
                    name="email"
                    type="email" 
                    placeholder="investor@domain.com" 
                    required={isSignUp}
                    className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-nfl-blue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1">Access Key</label>
                  <input 
                    name="password"
                    type="password" 
                    placeholder="Password" 
                    required
                    className="w-full bg-zinc-800/50 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-nfl-blue"
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-white text-black font-black py-4 rounded-2xl uppercase tracking-tight hover:bg-zinc-200 transition-all mt-4"
                >
                  {isSignUp ? "Create Portfolio" : "Authorize Connection"}
                </button>
              </form>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="h-px flex-1 bg-white/5" />
                <span className="text-[10px] font-bold text-zinc-600 uppercase">OR</span>
                <div className="h-px flex-1 bg-white/5" />
              </div>

              <button 
                onClick={handleGoogleSignIn}
                className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-3 transition-all"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" />
                One-Tap Google Access
              </button>

              <div className="mt-8 pt-8 border-t border-white/5 text-center">
                <p className="text-xs text-zinc-500">
                  {isSignUp ? "Already identified?" : "New to the exchange?"}{" "}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-white font-bold cursor-pointer hover:underline"
                  >
                    {isSignUp ? "Sign In" : "Register Now"}
                  </button>
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Wallet Modal */}
      <AnimatePresence>
        {showWallet && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-2xl glass-card rounded-3xl p-8 shadow-2xl overflow-hidden relative"
            >
              <button 
                onClick={() => setShowWallet(false)}
                className="absolute top-4 right-4 text-zinc-500 hover:text-white"
              >
                &times;
              </button>

              <h2 className="text-3xl font-black mb-8 flex items-center gap-3">
                <Wallet className="w-8 h-8 text-nfl-blue" />
                Financial Hub
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Crypto Deposits</h3>
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
                      <p className="text-[10px] text-zinc-500 mb-1 font-bold">BITCOIN (BTC)</p>
                      <div className="flex gap-2">
                        <code className="text-[10px] break-all text-emerald-400 bg-black/50 p-2 rounded block flex-1">bc1qddj8shfsfhgj2rrk24v3gflp234znsxw7d4xtt</code>
                        <button className="text-[10px] font-bold uppercase bg-white/10 px-2 rounded hover:bg-white/20 transition-colors">Copy</button>
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
                      <p className="text-[10px] text-zinc-500 mb-1 font-bold">USDT (ERC-20)</p>
                      <div className="flex gap-2">
                        <code className="text-[10px] break-all text-emerald-400 bg-black/50 p-2 rounded block flex-1">0xBD40A14Dd94403107DD1F81DB5f2b4E80D34A222</code>
                        <button className="text-[10px] font-bold uppercase bg-white/10 px-2 rounded hover:bg-white/20 transition-colors">Copy</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4">Legacy Banking</h3>
                  <div className="space-y-4">
                    <button className="w-full p-4 rounded-2xl bg-white text-black font-bold text-sm flex items-center justify-between group">
                      ACH / Wire Transfer
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <div className="p-6 rounded-2xl bg-nfl-blue/10 border border-nfl-blue/20">
                      <p className="text-xs text-nfl-blue font-bold mb-2 uppercase">Pro Benefit</p>
                      <p className="text-sm font-medium leading-relaxed">Instant deposits are enabled for your account. Funds will be available immediately after confirmation.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-12 bg-zinc-950 p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Available Liquidity</p>
                  <p className="text-3xl font-mono font-bold">{formatCurrency(balance)}</p>
                </div>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-8 py-3 rounded-xl transition-all border border-white/5">WITHDRAW</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
}
