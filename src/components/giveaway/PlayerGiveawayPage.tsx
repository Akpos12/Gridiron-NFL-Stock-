import React, { useState, useEffect } from "react";
import { 
  Shield, 
  ArrowLeft, 
  Calendar, 
  Award, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  User, 
  ChevronDown, 
  ChevronUp, 
  Gift, 
  FileText, 
  Share2 
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Giveaway, FanProfile, GiveawayEntry } from "../../types/giveaway";
import { NFL_TEAMS } from "../../constants";
import { VirtualFanCard } from "./VirtualFanCard";
import { FanRegistrationModal } from "./FanRegistrationModal";
import { cn } from "../../lib/utils";

interface PlayerGiveawayPageProps {
  giveawayId: string;
  onBack: () => void;
  currentUser?: any;
}

export const PlayerGiveawayPage: React.FC<PlayerGiveawayPageProps> = ({
  giveawayId,
  onBack,
  currentUser
}) => {
  const [giveaway, setGiveaway] = useState<Giveaway | null>(null);
  const [loading, setLoading] = useState(true);
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null);
  const [entry, setEntry] = useState<GiveawayEntry | null>(null);
  const [showRegModal, setShowRegModal] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Fetch Giveaway campaign details
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(doc(db, "giveaways", giveawayId), (snap) => {
      if (snap.exists()) {
        setGiveaway({ id: snap.id, ...snap.data() } as Giveaway);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [giveawayId]);

  // 2. Check for registered fan profile
  useEffect(() => {
    const fetchFan = async () => {
      if (currentUser?.uid) {
        const fanDoc = await getDoc(doc(db, "registered_fans", `fan-${currentUser.uid}`));
        if (fanDoc.exists()) {
          setFanProfile(fanDoc.data() as FanProfile);
        }
      } else {
        // Check localStorage as fallback
        const savedFan = localStorage.getItem("nfg_fan_profile");
        if (savedFan) {
          try {
            setFanProfile(JSON.parse(savedFan));
          } catch (e) {}
        }
      }
    };
    fetchFan();
  }, [currentUser]);

  // 3. Check for existing giveaway entry
  useEffect(() => {
    const checkEntry = async () => {
      if (!fanProfile || !giveawayId) return;
      try {
        const q = query(
          collection(db, "giveaway_entries"),
          where("giveawayId", "==", giveawayId),
          where("fanCode", "==", fanProfile.fanCode)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const docData = snap.docs[0].data() as GiveawayEntry;
          setEntry({ id: snap.docs[0].id, ...docData });
        }
      } catch (err) {
        console.error("Error checking entry:", err);
      }
    };
    checkEntry();
  }, [fanProfile, giveawayId]);

  const handleEnterGiveaway = async () => {
    if (!fanProfile) {
      setShowRegModal(true);
      return;
    }

    if (!giveaway) return;

    setIsEntering(true);
    setError(null);

    try {
      const entryId = `entry-${giveaway.id}-${fanProfile.fanCode}`;
      const newEntry: GiveawayEntry = {
        id: entryId,
        giveawayId: giveaway.id,
        giveawayTitle: giveaway.title || "",
        playerId: giveaway.playerId || "",
        playerName: giveaway.playerName || "",
        teamId: giveaway.teamId || "",
        userId: fanProfile.userId || "guest",
        userEmail: fanProfile.email || "",
        userName: fanProfile.fullName || "",
        fanCode: fanProfile.fanCode || "",
        city: fanProfile.city || "",
        profilePhotoUrl: fanProfile.profilePhotoUrl || "",
        status: "ENTERED",
        entryDate: Date.now()
      };

      await setDoc(doc(db, "giveaway_entries", entryId), newEntry);
      setEntry(newEntry);

      // Increment entries count on giveaway
      const currentCount = giveaway.entriesCount || 0;
      await setDoc(doc(db, "giveaways", giveaway.id), { entriesCount: currentCount + 1 }, { merge: true });
    } catch (err: any) {
      console.error("Entry submission error:", err);
      setError("Failed to process giveaway entry: " + err.message);
    } finally {
      setIsEntering(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-white">
        <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-zinc-400">Loading Giveaway Campaign...</p>
      </div>
    );
  }

  if (!giveaway) {
    return (
      <div className="p-12 text-center text-white space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-xl font-black italic uppercase">Giveaway Not Found</h3>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-zinc-800 text-white rounded-xl text-xs font-black uppercase tracking-widest"
        >
          Back to Giveaways
        </button>
      </div>
    );
  }

  const team = NFL_TEAMS.find(t => t.id === giveaway.teamId) || { id: giveaway.teamId, name: giveaway.teamId, city: "" };

  return (
    <div className="max-w-6xl mx-auto space-y-8 text-left p-4 md:p-8">
      {/* Top Back Navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Giveaways
      </button>

      {/* Main Campaign Hero Header */}
      <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-[#013369] via-[#0A1A2F] to-[#020B14] shadow-2xl p-6 md:p-12 text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Campaign Info */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3.5 py-1.5 rounded-full bg-red-600/20 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                OFFICIAL PLAYER GIVEAWAY
              </span>

              <span className={cn(
                "px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                giveaway.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
              )}>
                {giveaway.status}
              </span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-tight">
              {giveaway.title}
            </h1>

            <div className="flex items-center gap-4 text-xs font-bold text-zinc-300">
              <span className="text-blue-400 font-black uppercase">{team.city} {team.name} ({team.id})</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-zinc-400 font-mono">
                <Calendar className="w-3.5 h-3.5 text-red-500" />
                Ends: {giveaway.endDate || "TBA"}
              </span>
            </div>

            <p className="text-sm text-zinc-300 font-medium leading-relaxed max-w-2xl pt-2">
              {giveaway.description}
            </p>
          </div>

          {/* Featured Hero Banner Image */}
          <div className="lg:col-span-4">
            <div className="aspect-[4/3] rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900 shadow-2xl relative">
              <img
                src={giveaway.heroImageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800"}
                alt={giveaway.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                  FEATURED PLAYER EDITION
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Entry Action Card Banner */}
      <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div>
            <h3 className="text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-red-500" />
              GIVEAWAY ENTRY PORTAL
            </h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">
              {entry
                ? "You are officially entered into this giveaway!"
                : fanProfile
                ? `Welcome back, ${fanProfile.fullName}. Your Fan Code (${fanProfile.fanCode}) is ready for entry.`
                : "Become an official registered fan to receive your Fan Code and enter."}
            </p>
          </div>

          <div>
            {entry ? (
              <div className="px-6 py-3 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">ENTRY CONFIRMED ✓</span>
              </div>
            ) : fanProfile ? (
              <button
                onClick={handleEnterGiveaway}
                disabled={isEntering}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                {isEntering ? "SUBMITTING ENTRY..." : "CONFIRM ENTRY"}
              </button>
            ) : (
              <button
                onClick={() => setShowRegModal(true)}
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all cursor-pointer"
              >
                BECOME A FAN TO ENTER
              </button>
            )}
          </div>
        </div>

        {/* Render Fan Card preview if user is registered */}
        {fanProfile && (
          <div className="pt-2">
            <VirtualFanCard fan={fanProfile} isCompact />
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-wider">
            {error}
          </div>
        )}
      </div>

      {/* Prizes & Campaign Particulars */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Prizes List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <Gift className="w-5 h-5 text-amber-400" />
              AVAILABLE CAMPAIGN PRIZES ({giveaway.prizes?.length || 0})
            </h3>

            <div className="space-y-4">
              {giveaway.prizes?.map((prize, idx) => (
                <div key={idx} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                    <img
                      src={prize.imageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400"}
                      alt={prize.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-amber-400 tracking-widest">
                      QUANTITY AVAILABLE: {prize.quantity}
                    </span>
                    <h4 className="text-sm font-black uppercase text-white">{prize.name}</h4>
                    <p className="text-xs text-zinc-400 font-medium leading-normal">{prize.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Requirements & Eligibility */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] p-6 md:p-8 space-y-4">
            <h3 className="text-lg font-black italic uppercase text-white flex items-center gap-2 border-b border-white/10 pb-4">
              <Shield className="w-5 h-5 text-blue-400" />
              ELIGIBILITY & ENTRY CRITERIA
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-black uppercase text-zinc-400 text-[10px] tracking-widest block mb-1">ELIGIBILITY</span>
                <p className="text-zinc-200 font-medium">{giveaway.eligibility || "Open to all verified registered fans aged 18+."}</p>
              </div>

              <div>
                <span className="font-black uppercase text-zinc-400 text-[10px] tracking-widest block mb-1">REQUIREMENTS</span>
                <p className="text-zinc-200 font-medium">{giveaway.entryRequirements || "Valid Fan Code, registered profile photo, and single entry per fan."}</p>
              </div>

              <div>
                <span className="font-black uppercase text-zinc-400 text-[10px] tracking-widest block mb-1">TOTAL WINNERS</span>
                <p className="text-zinc-200 font-medium">{giveaway.numWinners || 1} Official Winner(s) selected according to rules.</p>
              </div>
            </div>
          </div>

          {/* Collapsible Official Rules Accordion */}
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden">
            <button
              onClick={() => setShowRules(!showRules)}
              className="w-full p-6 text-left flex items-center justify-between text-white hover:bg-white/[0.02] transition-colors cursor-pointer"
            >
              <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-4 h-4 text-zinc-400" />
                OFFICIAL GIVEAWAY RULES
              </span>
              {showRules ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showRules && (
              <div className="p-6 border-t border-white/10 bg-zinc-950 text-xs text-zinc-400 space-y-3 font-mono">
                <p>{giveaway.rules || "No purchase necessary. Void where prohibited. Winners selected fairly and notified via email."}</p>
                <p className="text-[10px] text-zinc-500 italic">
                  Note: Entry does not guarantee winning. Winners will be selected randomly or according to published campaign terms.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      <FanRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        currentUser={currentUser}
        onRegistered={(newFan) => {
          setFanProfile(newFan);
          setShowRegModal(false);
          // Save to localStorage
          localStorage.setItem("nfg_fan_profile", JSON.stringify(newFan));
        }}
      />
    </div>
  );
};
