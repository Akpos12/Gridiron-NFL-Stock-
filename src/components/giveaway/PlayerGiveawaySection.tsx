import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Search, 
  Gift, 
  Sparkles, 
  Calendar, 
  Award, 
  User, 
  CheckCircle2, 
  ChevronRight, 
  Users, 
  Plus,
  Trophy,
  Mail,
  Check
} from "lucide-react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Giveaway, FanProfile } from "../../types/giveaway";
import { NFL_TEAMS } from "../../constants";
import { FanRegistrationModal } from "./FanRegistrationModal";
import { VirtualFanCard } from "./VirtualFanCard";
import { PlayerGiveawayPage } from "./PlayerGiveawayPage";
import { WinnerTicker } from "./WinnerTicker";
import { WinnerCheckModal } from "./WinnerCheckModal";
import { cn } from "../../lib/utils";

interface PlayerGiveawaySectionProps {
  onSelectGiveaway?: (giveawayId: string) => void;
  user?: any;
  currentUser?: any;
  onSignInClick?: () => void;
  onOpenCustomerCare?: () => void;
  onOpenTrackInquiry?: (ticketIdOrEmail?: string) => void;
  onNavigateHome?: () => void;
}

export const PlayerGiveawaySection: React.FC<PlayerGiveawaySectionProps> = ({
  onSelectGiveaway,
  user,
  currentUser,
  onSignInClick,
  onOpenCustomerCare,
  onOpenTrackInquiry,
  onNavigateHome
}) => {
  const activeUser = user || currentUser;
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("ALL");
  const [showRegModal, setShowRegModal] = useState(false);
  const [showWinnerCheckModal, setShowWinnerCheckModal] = useState(false);
  const [quickCheckEmail, setQuickCheckEmail] = useState("");
  const [fanProfile, setFanProfile] = useState<FanProfile | null>(null);
  const [selectedGiveawayId, setSelectedGiveawayId] = useState<string | null>(null);
  const [selectedFanForCardView, setSelectedFanForCardView] = useState<FanProfile | null>(null);

  const handleCardClick = (id: string) => {
    if (onSelectGiveaway) onSelectGiveaway(id);
    setSelectedGiveawayId(id);
  };

  // Sync giveaways from Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "giveaways"), (snap) => {
      const docs: Giveaway[] = [];
      snap.forEach((d) => {
        const data = d.data() as Giveaway;
        if (data.status !== "DRAFT" && data.status !== "ARCHIVED") {
          docs.push({ id: d.id, ...data });
        }
      });
      setGiveaways(docs);
    });
    return () => unsub();
  }, []);

  // Sync registered fan profile if available
  useEffect(() => {
    const saved = localStorage.getItem("nfg_fan_profile");
    if (saved) {
      try {
        setFanProfile(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  if (selectedGiveawayId) {
    return (
      <PlayerGiveawayPage
        giveawayId={selectedGiveawayId}
        onBack={() => setSelectedGiveawayId(null)}
        currentUser={activeUser}
      />
    );
  }

  const filteredGiveaways = giveaways.filter((g) => {
    const matchesSearch =
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.teamId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = selectedTeam === "ALL" || g.teamId === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="space-y-8 text-left pb-16">
      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-10">
        {/* Top Breadcrumb / Return to Arena Navigation */}
        {onNavigateHome && (
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={onNavigateHome}
              className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border border-white/10"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Back to Main Arena
            </button>

            {onOpenTrackInquiry && (
              <button
                type="button"
                onClick={() => onOpenTrackInquiry()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                Track Live Inquiry
              </button>
            )}
          </div>
        )}

        {/* Section Hero Banner */}
        <div className="relative rounded-[2.5rem] overflow-hidden border border-white/10 bg-gradient-to-br from-[#013369] via-[#0A1A2F] to-[#020B14] p-8 md:p-12 text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-red-400 bg-red-600/20 border border-red-500/30">
                  <Shield className="w-3.5 h-3.5 text-red-500" />
                  EXCLUSIVE FAN REWARDS
                </span>

                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 border border-amber-500/30">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  INSTANT WINNER LOOKUP
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tight text-white leading-tight">
                PLAYER GIVEAWAYS
              </h1>

              <p className="text-xs md:text-sm text-zinc-300 font-medium leading-relaxed">
                Win authentic autographed jerseys, game-worn memorabilia, and exclusive VIP experiences featuring top star players across every NFL franchise.
              </p>

              {/* Instant Winner Email Verification Box */}
              <div className="pt-2">
                <div className="p-4 md:p-5 rounded-2xl bg-zinc-950/90 border border-amber-500/40 shadow-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                      Did You Win? Check With Your Email:
                    </span>
                    {activeUser?.email && (
                      <button
                        type="button"
                        onClick={() => {
                          setQuickCheckEmail(activeUser.email);
                          setShowWinnerCheckModal(true);
                        }}
                        className="text-[10px] font-bold text-cyan-400 hover:underline cursor-pointer hidden sm:inline-block"
                      >
                        Use {activeUser.email}
                      </button>
                    )}
                  </div>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setShowWinnerCheckModal(true);
                    }}
                    className="flex flex-col sm:flex-row gap-2"
                  >
                    <div className="relative flex-1">
                      <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="email"
                        placeholder="Enter your registered email (e.g. fan@gmail.com)"
                        value={quickCheckEmail || (activeUser?.email || "")}
                        onChange={(e) => setQuickCheckEmail(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/15 pl-10 pr-3 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-[11px] uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Check If I Won
                    </button>
                  </form>
                </div>
              </div>

              {/* Fan Code / Registration Actions */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                {fanProfile ? (
                  <div className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                      ✓
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-zinc-400">REGISTERED FAN</p>
                      <p className="text-xs font-mono font-black text-cyan-400">{fanProfile.fanCode}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowRegModal(true)}
                    className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/20 transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    BECOME A FAN TO RECEIVE FAN CODE
                  </button>
                )}

                {onOpenCustomerCare && (
                  <button
                    onClick={onOpenCustomerCare}
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    Customer Care
                  </button>
                )}

                {onOpenTrackInquiry && (
                  <button
                    type="button"
                    onClick={() => onOpenTrackInquiry()}
                    className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Search className="w-3.5 h-3.5 text-emerald-400" />
                    Track Inquiry
                  </button>
                )}
              </div>
            </div>

            {/* Sample Card Graphic */}
            <div className="w-full lg:w-96 shrink-0">
              {fanProfile ? (
                <VirtualFanCard fan={fanProfile} isCompact />
              ) : (
                <div className="p-6 bg-zinc-950/80 border border-white/10 rounded-[2rem] text-center space-y-3">
                  <Gift className="w-10 h-10 text-amber-400 mx-auto" />
                  <h4 className="text-sm font-black italic uppercase text-white">GET YOUR FAN CARD</h4>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Register with your favorite team and photo to generate your unique Fan Code.
                  </p>
                  <button
                    onClick={() => setShowRegModal(true)}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    REGISTER NOW
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search players or giveaways..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-white/10 pl-11 pr-4 py-2.5 rounded-xl text-xs text-white placeholder-zinc-500 font-bold focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowWinnerCheckModal(true)}
              className="px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/40 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              Check Winner Status
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 whitespace-nowrap hidden sm:inline">
                Team:
              </span>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="bg-zinc-950 border border-white/10 text-white text-xs font-bold uppercase rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-blue-600 w-full sm:w-auto"
              >
                <option value="ALL">ALL NFL TEAMS</option>
                {NFL_TEAMS.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} - {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Giveaways Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-red-500" />
              FEATURED PLAYER CAMPAIGNS ({filteredGiveaways.length})
            </h3>
          </div>

          {filteredGiveaways.length === 0 ? (
            <div className="p-12 text-center bg-zinc-900/30 border border-white/5 rounded-3xl space-y-3">
              <Award className="w-10 h-10 text-zinc-600 mx-auto" />
              <h4 className="text-sm font-black uppercase text-zinc-400">NO GIVEAWAYS MATCH CRITERIA</h4>
              <p className="text-xs text-zinc-500">Check back soon for new player giveaway drops.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGiveaways.map((g) => {
                const team = NFL_TEAMS.find((t) => t.id === g.teamId) || { id: g.teamId, name: g.teamId, city: "" };

                return (
                  <div
                    key={g.id}
                    onClick={() => handleCardClick(g.id)}
                    className="group bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-blue-500/50 rounded-[2rem] overflow-hidden transition-all duration-300 shadow-xl cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Image Banner */}
                      <div className="aspect-[16/9] bg-zinc-950 overflow-hidden relative border-b border-white/5">
                        <img
                          src={g.heroImageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800"}
                          alt={g.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />

                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[9px] font-black uppercase font-mono border border-white/10">
                            {g.teamId}
                          </span>

                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md",
                            g.status === "ACTIVE" ? "bg-emerald-500/80 text-white" : "bg-amber-500/80 text-white"
                          )}>
                            {g.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-6 space-y-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest block">
                            PLAYER: {g.playerName}
                          </span>
                          <h4 className="text-base font-black italic uppercase text-white line-clamp-1 group-hover:text-blue-400 transition-colors mt-0.5">
                            {g.title}
                          </h4>
                        </div>

                        <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                          {g.description}
                        </p>

                        <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-zinc-400">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-red-500" />
                            Ends: {g.endDate || "TBA"}
                          </span>
                          <span className="text-amber-400 font-black">
                            {g.prizes?.length || 0} PRIZE(S)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Footer CTA */}
                    <div className="px-6 pb-6 pt-2">
                      <button
                        type="button"
                        className="w-full py-3 bg-red-600 group-hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>ENTER GIVEAWAY</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Instant Winner Verification Modal */}
      <WinnerCheckModal
        isOpen={showWinnerCheckModal}
        onClose={() => setShowWinnerCheckModal(false)}
        currentUser={activeUser}
        savedFanProfile={fanProfile}
        onOpenRegisterModal={() => setShowRegModal(true)}
        onViewFanCard={(fan) => setSelectedFanForCardView(fan)}
        onOpenLiveChat={(ticketIdOrEmail) => {
          if (onOpenTrackInquiry) {
            onOpenTrackInquiry(ticketIdOrEmail);
          } else if (onOpenCustomerCare) {
            onOpenCustomerCare();
          }
        }}
        onOpenCustomerCareForm={() => {
          if (onOpenCustomerCare) onOpenCustomerCare();
        }}
      />

      {/* Fan Registration Modal */}
      <FanRegistrationModal
        isOpen={showRegModal}
        onClose={() => setShowRegModal(false)}
        currentUser={activeUser}
        onRegistered={(newFan) => {
          setFanProfile(newFan);
          localStorage.setItem("nfg_fan_profile", JSON.stringify(newFan));
        }}
      />

      {/* Fan Card Modal Viewer */}
      {selectedFanForCardView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Winner Fan Card
              </h3>
              <button
                onClick={() => setSelectedFanForCardView(null)}
                className="text-xs text-zinc-400 hover:text-white uppercase font-bold"
              >
                Close
              </button>
            </div>
            <VirtualFanCard fan={selectedFanForCardView} />
          </div>
        </div>
      )}
    </div>
  );
};

