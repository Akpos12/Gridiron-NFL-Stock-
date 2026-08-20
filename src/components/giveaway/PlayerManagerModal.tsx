import React, { useState } from "react";
import { 
  X, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Sparkles, 
  Shield, 
  Plus, 
  Check, 
  Upload, 
  Gift, 
  Calendar, 
  Star,
  RefreshCw
} from "lucide-react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { Player, Giveaway, Prize } from "../../types/giveaway";
import { NFL_TEAMS } from "../../constants";
import { ImageUploader } from "../common/ImageUploader";
import { cn } from "../../lib/utils";

// Comprehensive NFL Star Player Presets for quick 1-click addition
export const PRESET_NFL_STARS: Array<Omit<Player, "id"> & { id?: string; defaultPrizeName: string; defaultPrizeDesc: string; heroImageUrl: string }> = [
  {
    name: "Jaxon Smith-Njigba",
    teamId: "SEA",
    position: "WR",
    jerseyNumber: "11",
    description: "Explosive dynamic wide receiver and playmaking star for the Seattle Seahawks.",
    photoUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed JSN #11 Seahawks Action-Green Jersey + Signed Mini Helmet",
    defaultPrizeDesc: "Authentic Seattle Seahawks Nike jersey hand-signed by Jaxon Smith-Njigba with official NFL hologram & Beckett COA."
  },
  {
    name: "Alvin Kamara",
    teamId: "NO",
    position: "RB",
    jerseyNumber: "41",
    description: "5-time Pro Bowl elite dual-threat running back and superstar for the New Orleans Saints.",
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Alvin Kamara Saints Black & Gold Jersey",
    defaultPrizeDesc: "Signed official Nike game jersey certified with tamper-proof NFL hologram."
  },
  {
    name: "Justin Jefferson",
    teamId: "MIN",
    position: "WR",
    jerseyNumber: "18",
    description: "All-Pro NFL offensive superstar and record-breaking wide receiver for the Minnesota Vikings.",
    photoUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Official Autographed Nike Game Jersey (Purple & Gold Edition)",
    defaultPrizeDesc: "Authentic signed Nike On-Field jersey certified with tamper-proof NFL hologram & Beckett COA."
  },
  {
    name: "Jordyn Tyson",
    teamId: "ARI",
    position: "WR",
    jerseyNumber: "4",
    description: "High-flying wide receiver and deep-threat collegiate and professional playmaker.",
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Custom Player Jersey & Autographed Game Football",
    defaultPrizeDesc: "Autographed collector jersey certified with tamper-evident hologram."
  },
  {
    name: "DK Metcalf",
    teamId: "SEA",
    position: "WR",
    jerseyNumber: "14",
    description: "Physical marvel and Seattle Seahawks explosive wide receiver powerhouse.",
    photoUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Seahawks Action-Green Jersey + VIP Training Camp Pass",
    defaultPrizeDesc: "Signed official Seahawks jersey paired with 2 VIP sideline passes to Seattle training camp."
  },
  {
    name: "Saquon Barkley",
    teamId: "PHI",
    position: "RB",
    jerseyNumber: "26",
    description: "Superstar All-Pro running back and explosive offensive force for the Philadelphia Eagles.",
    photoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Philadelphia Eagles Kelly Green Nike Jersey",
    defaultPrizeDesc: "Hand-signed authentic Kelly Green jersey certified by Fanatics & Beckett."
  },
  {
    name: "Patrick Mahomes",
    teamId: "KC",
    position: "QB",
    jerseyNumber: "15",
    description: "3-time Super Bowl Champion and NFL MVP quarterback leading the Kansas City Chiefs dynasty.",
    photoUrl: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Official Wilson 'The Duke' Game Football + Super Bowl Inscribed",
    defaultPrizeDesc: "Official NFL leather game ball autographed in silver sharpie with Super Bowl MVP inscription."
  },
  {
    name: "Lamar Jackson",
    teamId: "BAL",
    position: "QB",
    jerseyNumber: "8",
    description: "2-time NFL MVP dynamic dual-threat quarterback electrifying the Baltimore Ravens.",
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Ravens Speed Replica Full-Size Helmet",
    defaultPrizeDesc: "Full-size Riddell Speed helmet signed in gold metallic ink with Fanatics authentication."
  },
  {
    name: "Christian McCaffrey",
    teamId: "SF",
    position: "RB",
    jerseyNumber: "23",
    description: "NFL Offensive Player of the Year running back and versatile weapon for the San Francisco 49ers.",
    photoUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed 49ers Red Game Jersey & Custom Framed Photo Collage",
    defaultPrizeDesc: "Custom framed shadowbox containing autographed 49ers jersey with official certificate."
  },
  {
    name: "Tyreek Hill",
    teamId: "MIA",
    position: "WR",
    jerseyNumber: "10",
    description: "'Cheetah' - NFL's fastest deep-threat wide receiver for the Miami Dolphins.",
    photoUrl: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Custom 'Cheetah' Speed Visor & Dolphins Gloves",
    defaultPrizeDesc: "Official NFL game-spec tinted visor signed by Tyreek Hill with custom laser inscription."
  },
  {
    name: "Josh Allen",
    teamId: "BUF",
    position: "QB",
    jerseyNumber: "17",
    description: "Powerhouse Pro Bowl quarterback for the Buffalo Bills known for unstoppable arm talent and grit.",
    photoUrl: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Buffalo Bills Royal Blue Vapor Limited Jersey",
    defaultPrizeDesc: "Authentic Nike Vapor jersey hand-signed by Josh Allen with JSA authentication seal."
  },
  {
    name: "Amon-Ra St. Brown",
    teamId: "DET",
    position: "WR",
    jerseyNumber: "14",
    description: "'Sun God' - First-Team All-Pro elite route-running wide receiver for the Detroit Lions.",
    photoUrl: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Honolulu Blue Lions Jersey",
    defaultPrizeDesc: "Hand-signed authentic Nike jersey with Beckett authentication."
  },
  {
    name: "Joe Burrow",
    teamId: "CIN",
    position: "QB",
    jerseyNumber: "9",
    description: "'Joe Cool' - Pro Bowl franchise quarterback for the Cincinnati Bengals.",
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Bengals White Bengal Helmet",
    defaultPrizeDesc: "Official Riddell alternate white mini helmet hand-signed by Joe Burrow."
  },
  {
    name: "CeeDee Lamb",
    teamId: "DAL",
    position: "WR",
    jerseyNumber: "88",
    description: "All-Pro wide receiver and record-setting reception leader for the Dallas Cowboys.",
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Cowboys Navy Blue Star Jersey",
    defaultPrizeDesc: "Authentic Dallas Cowboys jersey autographed by CeeDee Lamb with Beckett authentication."
  },
  {
    name: "Travis Kelce",
    teamId: "KC",
    position: "TE",
    jerseyNumber: "87",
    description: "Future Hall of Fame tight end and 3-time Super Bowl Champion for the Kansas City Chiefs.",
    photoUrl: "https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Official NFL Game Ball + Red Chiefs Jersey",
    defaultPrizeDesc: "Bundle containing hand-signed football and Nike jersey with PSA/DNA certificate of authenticity."
  },
  {
    name: "Sauce Gardner",
    teamId: "NYJ",
    position: "CB",
    jerseyNumber: "1",
    description: "Lockdown cornerback and consecutive First-Team All-Pro for the New York Jets.",
    photoUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Gotham Green Mini Helmet + Action Photo",
    defaultPrizeDesc: "Autographed Riddell mini helmet with custom inscription certified by Beckett Authentication."
  },
  {
    name: "TJ Watt",
    teamId: "PIT",
    position: "LB",
    jerseyNumber: "90",
    description: "Defensive Player of the Year and sack-record holder for the Pittsburgh Steelers.",
    photoUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Signed Pittsburgh Steelers Full-Size Eclipse Blackout Helmet",
    defaultPrizeDesc: "Limited Eclipse edition full-size helmet signed in bright yellow with DPOY inscription."
  },
  {
    name: "Jalen Hurts",
    teamId: "PHI",
    position: "QB",
    jerseyNumber: "1",
    description: "Pro Bowl franchise quarterback and dynamic playmaker for the Philadelphia Eagles.",
    photoUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=600",
    heroImageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    defaultPrizeName: "Autographed Eagles Midnight Green Game Jersey",
    defaultPrizeDesc: "Authentic Nike Midnight Green jersey hand-signed by Jalen Hurts with official hologram."
  }
];

interface PlayerManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  giveaways: Giveaway[];
  onPlayerSaved?: () => void;
  initialEditingPlayer?: Player | null;
}

export const PlayerManagerModal: React.FC<PlayerManagerModalProps> = ({
  isOpen,
  onClose,
  players,
  giveaways,
  onPlayerSaved,
  initialEditingPlayer
}) => {
  const [activeTab, setActiveTab] = useState<"add_player" | "manage_players" | "create_giveaway" | "presets">("add_player");
  
  // Player state
  const [editingId, setEditingId] = useState<string | null>(initialEditingPlayer?.id || null);
  const [playerName, setPlayerName] = useState(initialEditingPlayer?.name || "");
  const [playerTeamId, setPlayerTeamId] = useState(initialEditingPlayer?.teamId || "KC");
  const [playerPosition, setPlayerPosition] = useState(initialEditingPlayer?.position || "WR");
  const [playerJerseyNumber, setPlayerJerseyNumber] = useState(initialEditingPlayer?.jerseyNumber || "15");
  const [playerDesc, setPlayerDesc] = useState(initialEditingPlayer?.description || "");
  const [playerPhoto, setPlayerPhoto] = useState(initialEditingPlayer?.photoUrl || "");

  // Optional auto-create giveaway with new player
  const [autoCreateGiveaway, setAutoCreateGiveaway] = useState(true);
  const [giveawayPrizeName, setGiveawayPrizeName] = useState("Official Autographed NFL Game Jersey");
  const [giveawayEndDate, setGiveawayEndDate] = useState("2026-12-31");
  const [giveawayHeroImg, setGiveawayHeroImg] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingId(null);
    setPlayerName("");
    setPlayerTeamId("KC");
    setPlayerPosition("WR");
    setPlayerJerseyNumber("15");
    setPlayerDesc("");
    setPlayerPhoto("");
    setGiveawayPrizeName("Official Autographed NFL Game Jersey");
    setStatusMsg(null);
  };

  const handleSelectPreset = (preset: typeof PRESET_NFL_STARS[0]) => {
    setPlayerName(preset.name);
    setPlayerTeamId(preset.teamId);
    setPlayerPosition(preset.position);
    setPlayerJerseyNumber(preset.jerseyNumber);
    setPlayerDesc(preset.description);
    setPlayerPhoto(preset.photoUrl);
    setGiveawayPrizeName(preset.defaultPrizeName);
    setGiveawayHeroImg(preset.heroImageUrl);
    setActiveTab("add_player");
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setStatusMsg({ type: "error", text: "Please enter a player name." });
      return;
    }

    setIsSaving(true);
    setStatusMsg(null);

    try {
      const playerId = editingId || `player-${playerName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now()}`;
      const finalPhoto = playerPhoto.trim() || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600";

      const playerPayload: Player = {
        id: playerId,
        name: playerName.trim(),
        teamId: playerTeamId,
        position: playerPosition.trim().toUpperCase() || "ATH",
        jerseyNumber: playerJerseyNumber.trim() || "00",
        description: playerDesc.trim() || `Featured NFL star player for the ${playerTeamId}.`,
        photoUrl: finalPhoto,
        updatedAt: Date.now(),
        createdAt: editingId ? (players.find(p => p.id === editingId)?.createdAt || Date.now()) : Date.now()
      };

      // 1. Save Player Record
      await setDoc(doc(db, "players", playerId), playerPayload);

      // 2. Optionally create or update an active giveaway campaign for this player
      if (autoCreateGiveaway && !editingId) {
        const gwId = `gw-${playerId}`;
        const teamObj = NFL_TEAMS.find(t => t.id === playerTeamId);
        const teamName = teamObj ? `${teamObj.city} ${teamObj.name}` : playerTeamId;

        const giveawayPayload: Giveaway = {
          id: gwId,
          title: `Official ${playerName.trim()} Fan Giveaway`,
          description: `Win exclusive authentic memorabilia signed by ${playerName.trim()} (${teamName}). Open to all registered fan club members!`,
          playerId: playerId,
          playerName: playerName.trim(),
          teamId: playerTeamId,
          heroImageUrl: giveawayHeroImg.trim() || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
          startDate: new Date().toISOString().split("T")[0],
          endDate: giveawayEndDate || "2026-12-31",
          eligibility: "Open to all verified registered fans aged 18+ with active Fan Code.",
          entryRequirements: "Must register for an official Fan Code and submit entry before the closing countdown.",
          numWinners: 1,
          rules: "Official NFL Gridiron Exchange rules apply. Winners drawn fairly and verified with tamper-proof certificate of authenticity.",
          status: "ACTIVE",
          entriesCount: 0,
          prizes: [
            {
              id: `prize-${Date.now()}`,
              name: giveawayPrizeName.trim() || `Autographed ${playerName.trim()} Game Jersey`,
              description: `Authentic on-field memorabilia certified by Beckett / Fanatics hologram.`,
              quantity: 1,
              imageUrl: finalPhoto
            }
          ],
          updatedAt: Date.now(),
          createdAt: Date.now()
        };

        await setDoc(doc(db, "giveaways", gwId), giveawayPayload);
      }

      setStatusMsg({ 
        type: "success", 
        text: editingId ? `Successfully updated ${playerName}!` : `Successfully added ${playerName} and published giveaway campaign!` 
      });

      if (onPlayerSaved) onPlayerSaved();
      resetForm();
    } catch (err: any) {
      console.error("Error saving player:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to save player to database." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlayer = async (p: Player) => {
    try {
      await deleteDoc(doc(db, "players", p.id));
      // Also delete corresponding giveaway if present
      const associatedGws = giveaways.filter(g => g.playerId === p.id);
      for (const gw of associatedGws) {
        await deleteDoc(doc(db, "giveaways", gw.id));
      }
      setStatusMsg({ type: "success", text: `Removed ${p.name} and associated campaigns.` });
      if (onPlayerSaved) onPlayerSaved();
    } catch (err: any) {
      console.error(err);
      setStatusMsg({ type: "error", text: err.message || "Failed to delete player." });
    }
  };

  const handleSeedAllPresets = async () => {
    setIsSeeding(true);
    setStatusMsg(null);

    try {
      for (const star of PRESET_NFL_STARS) {
        const playerId = `player-${star.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
        const playerDoc: Player = {
          id: playerId,
          name: star.name,
          teamId: star.teamId,
          position: star.position,
          jerseyNumber: star.jerseyNumber,
          description: star.description,
          photoUrl: star.photoUrl,
          updatedAt: Date.now(),
          createdAt: Date.now()
        };

        await setDoc(doc(db, "players", playerId), playerDoc);

        const gwId = `gw-${playerId}`;
        const teamObj = NFL_TEAMS.find(t => t.id === star.teamId);
        const teamName = teamObj ? `${teamObj.city} ${teamObj.name}` : star.teamId;

        const giveawayDoc: Giveaway = {
          id: gwId,
          title: `Official ${star.name} Fan Giveaway`,
          description: `Win authentic memorabilia hand-signed by ${star.name} of the ${teamName}. Verified with tamper-proof certificate of authenticity.`,
          playerId: playerId,
          playerName: star.name,
          teamId: star.teamId,
          heroImageUrl: star.heroImageUrl,
          startDate: new Date().toISOString().split("T")[0],
          endDate: "2026-12-31",
          eligibility: "Open to all verified registered fans aged 18+ with active Fan Code.",
          entryRequirements: "Must hold an active Fan Code. Winner notified immediately upon draw.",
          numWinners: 1,
          rules: "Official NFL Gridiron Exchange rules apply. 100% authentic certificate included.",
          status: "ACTIVE",
          entriesCount: Math.floor(Math.random() * 40) + 12,
          prizes: [
            {
              id: `prize-${star.teamId}-${Date.now()}`,
              name: star.defaultPrizeName,
              description: star.defaultPrizeDesc,
              quantity: 1,
              imageUrl: star.photoUrl
            }
          ],
          updatedAt: Date.now(),
          createdAt: Date.now()
        };

        await setDoc(doc(db, "giveaways", gwId), giveawayDoc);
      }

      setStatusMsg({ type: "success", text: "Successfully populated full NFL Stars Roster & Giveaways!" });
      if (onPlayerSaved) onPlayerSaved();
    } catch (err: any) {
      console.error("Error seeding star roster:", err);
      setStatusMsg({ type: "error", text: err.message || "Failed to seed star roster." });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/15 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl text-white space-y-6 max-h-[90vh] flex flex-col justify-between overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
                FEATURED PLAYERS & GIVEAWAYS MANAGER
              </h3>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                Add new players, change roster listings, or choose from official NFL star presets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-2 shrink-0 border-b border-white/5 pb-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { resetForm(); setActiveTab("add_player"); }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "add_player" ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              {editingId ? "Edit Player" : "+ Add New Player"}
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "presets" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              <Star className="w-3.5 h-3.5 text-amber-300" />
              NFL Star Presets ({PRESET_NFL_STARS.length})
            </button>

            <button
              onClick={() => setActiveTab("manage_players")}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer",
                activeTab === "manage_players" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Current Roster ({players.length})
            </button>
          </div>

          <button
            onClick={handleSeedAllPresets}
            disabled={isSeeding}
            className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/30 text-amber-400 hover:text-amber-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSeeding && "animate-spin")} />
            Seed All 12+ Stars
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={cn(
            "p-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2",
            statusMsg.type === "success" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          )}>
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1 no-scrollbar">

          {/* 1. ADD / EDIT PLAYER TAB */}
          {activeTab === "add_player" && (
            <form onSubmit={handleSavePlayer} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left Column: Player Info */}
                <div className="space-y-4 bg-zinc-900/60 p-5 rounded-2xl border border-white/5">
                  <h4 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                    <UserPlus className="w-4 h-4" />
                    Player Information
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Player Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Patrick Mahomes, Lamar Jackson, Tyreek Hill..."
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold placeholder-zinc-600 focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400">NFL Team *</label>
                      <select
                        value={playerTeamId}
                        onChange={(e) => setPlayerTeamId(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold uppercase focus:outline-none focus:border-red-500"
                      >
                        {NFL_TEAMS.map((t) => (
                          <option key={t.id} value={t.id} className="bg-zinc-950 text-white">
                            {t.id} - {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Position *</label>
                      <input
                        type="text"
                        placeholder="QB, WR, RB, DE..."
                        value={playerPosition}
                        onChange={(e) => setPlayerPosition(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-bold uppercase text-center focus:outline-none focus:border-red-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-zinc-400">Jersey #</label>
                      <input
                        type="text"
                        placeholder="15, 18, 8..."
                        value={playerJerseyNumber}
                        onChange={(e) => setPlayerJerseyNumber(e.target.value)}
                        className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white font-mono text-center focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Player Bio / Highlights</label>
                    <textarea
                      rows={3}
                      placeholder="Enter star accolades, Super Bowl MVP honors, or standout records..."
                      value={playerDesc}
                      onChange={(e) => setPlayerDesc(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-zinc-600 font-medium focus:outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-zinc-400">Player Photo URL (or Upload)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/... or upload below"
                      value={playerPhoto}
                      onChange={(e) => setPlayerPhoto(e.target.value)}
                      className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-600 font-mono text-[11px] focus:outline-none focus:border-red-500"
                    />
                    <ImageUploader
                      value={playerPhoto}
                      onChange={setPlayerPhoto}
                      label="Upload Custom Player Headshot"
                      placeholder="Upload PNG/JPG player photo"
                      aspectRatio="portrait"
                    />
                  </div>
                </div>

                {/* Right Column: Giveaway Campaign Settings */}
                <div className="space-y-4 bg-zinc-900/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <h4 className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                        <Gift className="w-4 h-4" />
                        Attached Giveaway Campaign
                      </h4>
                      {!editingId && (
                        <label className="flex items-center gap-2 cursor-pointer text-[10px] font-black uppercase text-zinc-300">
                          <input
                            type="checkbox"
                            checked={autoCreateGiveaway}
                            onChange={(e) => setAutoCreateGiveaway(e.target.checked)}
                            className="rounded bg-zinc-950 border-white/20 text-red-600 focus:ring-0"
                          />
                          Publish Active Giveaway
                        </label>
                      )}
                    </div>

                    {autoCreateGiveaway && (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-zinc-400">Featured Prize Title</label>
                          <input
                            type="text"
                            value={giveawayPrizeName}
                            onChange={(e) => setGiveawayPrizeName(e.target.value)}
                            placeholder="e.g. Official Autographed Game Jersey"
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-zinc-400">Giveaway Closing Date</label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                            <input
                              type="date"
                              value={giveawayEndDate}
                              onChange={(e) => setGiveawayEndDate(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black uppercase text-zinc-400">Campaign Banner Image URL</label>
                          <input
                            type="url"
                            value={giveawayHeroImg}
                            onChange={(e) => setGiveawayHeroImg(e.target.value)}
                            placeholder="Optional stadium or action banner URL"
                            className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Live Player Preview Card */}
                        <div className="p-4 bg-zinc-950 rounded-xl border border-white/10 flex items-center gap-4">
                          <div className="w-14 h-16 rounded-lg overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                            <img
                              src={playerPhoto || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=300"}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-blue-400 font-mono">
                              {playerTeamId} · #{playerJerseyNumber || "00"} · {playerPosition || "ATH"}
                            </span>
                            <h5 className="text-xs font-black uppercase text-white truncate">
                              {playerName || "Player Name Preview"}
                            </h5>
                            <p className="text-[10px] text-amber-400 font-bold truncate">
                              Prize: {giveawayPrizeName}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
                  >
                    <Check className="w-4 h-4" />
                    {isSaving ? "Saving to Database..." : editingId ? "Update Player Roster Profile" : "Save & Add Player to Giveaways"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. NFL STAR PRESETS TAB */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                    <Star className="w-4 h-4 text-amber-400" />
                    1-Click Star Player Templates
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Click any star to pre-populate and publish their official profile and giveaway campaign:
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {PRESET_NFL_STARS.map((star) => (
                  <div
                    key={star.name}
                    className="p-4 bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 hover:border-amber-500/50 rounded-2xl transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-16 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10">
                        <img src={star.photoUrl} alt={star.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[9px] font-black text-amber-400 font-mono">
                          {star.teamId} · #{star.jerseyNumber} · {star.position}
                        </span>
                        <h5 className="text-xs font-black uppercase text-white truncate">{star.name}</h5>
                        <p className="text-[10px] text-zinc-400 line-clamp-1">{star.description}</p>
                      </div>
                    </div>

                    <div className="text-[9px] text-cyan-300 font-bold bg-zinc-950 p-2 rounded-lg border border-white/5 truncate">
                      🎁 {star.defaultPrizeName}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectPreset(star)}
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <Plus className="w-3 h-3" />
                      Use This Player
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. MANAGE CURRENT ROSTER TAB */}
          {activeTab === "manage_players" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h4 className="text-xs font-black uppercase tracking-widest text-white">
                  Active Players Roster ({players.length})
                </h4>
                <button
                  onClick={() => { resetForm(); setActiveTab("add_player"); }}
                  className="text-xs text-red-400 hover:text-red-300 font-black uppercase flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Player
                </button>
              </div>

              {players.length === 0 ? (
                <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-white/5 space-y-3">
                  <UserPlus className="w-8 h-8 text-zinc-500 mx-auto" />
                  <p className="text-xs text-zinc-400 font-bold uppercase">No players registered in database yet</p>
                  <button
                    onClick={handleSeedAllPresets}
                    className="px-4 py-2 bg-amber-500 text-black rounded-xl text-xs font-black uppercase"
                  >
                    Seed Full NFL Stars Roster
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {players.map((p) => {
                    const playerGws = giveaways.filter(g => g.playerId === p.id);
                    return (
                      <div
                        key={p.id}
                        className="p-4 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-12 h-14 rounded-xl overflow-hidden bg-zinc-950 shrink-0 border border-white/10">
                            <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[9px] font-black text-blue-400 font-mono">
                              {p.teamId} · #{p.jerseyNumber} · {p.position}
                            </span>
                            <h5 className="text-xs font-black uppercase text-white truncate">{p.name}</h5>
                            <p className="text-[10px] text-zinc-500">
                              {playerGws.length} Active Giveaway Campaign(s)
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(p.id);
                              setPlayerName(p.name);
                              setPlayerTeamId(p.teamId);
                              setPlayerPosition(p.position);
                              setPlayerJerseyNumber(p.jerseyNumber);
                              setPlayerDesc(p.description);
                              setPlayerPhoto(p.photoUrl);
                              setActiveTab("add_player");
                            }}
                            className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs cursor-pointer transition-all"
                            title="Edit Player"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlayer(p)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl text-xs cursor-pointer transition-all"
                            title="Delete Player"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4 shrink-0">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
            Changes synchronize to Firestore in real time across the entire platform
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
