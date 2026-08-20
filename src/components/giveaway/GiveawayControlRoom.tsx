import React, { useState, useEffect } from "react";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  Award, 
  Users, 
  CheckCircle, 
  Save, 
  Sparkles, 
  UserPlus, 
  Eye, 
  Search, 
  Gift, 
  Calendar, 
  FileText, 
  X,
  Palette,
  Clock,
  Ticket,
  Building2,
  Smartphone,
  QrCode,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Filter
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { NFL_TEAMS } from "../../constants";
import { ImageUploader } from "../common/ImageUploader";
import { Player, Prize, Giveaway, GiveawayStatus, FanProfile, GiveawayEntry, GiveawayWinner, TeamConfig } from "../../types/giveaway";
import { PRESET_NFL_STARS } from "./PlayerManagerModal";
import { cn, formatCurrency } from "../../lib/utils";
import { ExperienceAdmin } from "../ExperienceAdmin";

export const GiveawayControlRoom: React.FC = () => {
  const [subTab, setSubTab] = useState<"giveaways" | "create_giveaway" | "players" | "bookings" | "experiences" | "entries" | "winners" | "team_config">(() => {
    const saved = localStorage.getItem("giveaway_admin_subtab");
    if (saved && ["giveaways", "create_giveaway", "players", "bookings", "experiences", "entries", "winners", "team_config"].includes(saved)) {
      return saved as any;
    }
    return "giveaways";
  });

  useEffect(() => {
    if (subTab) {
      localStorage.setItem("giveaway_admin_subtab", subTab);
    }
  }, [subTab]);

  // State data from Firestore
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [registeredFans, setRegisteredFans] = useState<FanProfile[]>([]);
  const [entries, setEntries] = useState<GiveawayEntry[]>([]);
  const [winners, setWinners] = useState<GiveawayWinner[]>([]);
  const [teamsConfig, setTeamsConfig] = useState<Record<string, TeamConfig>>({});
  const [bookings, setBookings] = useState<any[]>([]);

  // Giveaway creation/editing form
  const [editingGiveawayId, setEditingGiveawayId] = useState<string | null>(null);
  const [gwTitle, setGwTitle] = useState("");
  const [gwDescription, setGwDescription] = useState("");
  const [gwPlayerId, setGwPlayerId] = useState("");
  const [isCustomPlayerMode, setIsCustomPlayerMode] = useState(false);
  const [customPlayerName, setCustomPlayerName] = useState("");
  const [customPlayerTeam, setCustomPlayerTeam] = useState("SEA");
  const [customPlayerPos, setCustomPlayerPos] = useState("WR");
  const [customPlayerJersey, setCustomPlayerJersey] = useState("11");
  const [customPlayerPhoto, setCustomPlayerPhoto] = useState("");
  const [gwHeroImage, setGwHeroImage] = useState("");
  const [gwStartDate, setGwStartDate] = useState("");
  const [gwEndDate, setGwEndDate] = useState("");
  const [gwEligibility, setGwEligibility] = useState("Open to all registered fans aged 18+");
  const [gwEntryRequirements, setGwEntryRequirements] = useState("Must hold a valid registered Fan Code.");
  const [gwNumWinners, setGwNumWinners] = useState(1);
  const [gwRules, setGwRules] = useState("Official giveaway rules apply. Winner selected fairly and notified via email.");
  const [gwStatus, setGwStatus] = useState<GiveawayStatus>("ACTIVE");
  const [gwPrizes, setGwPrizes] = useState<Prize[]>([]);

  // Prize form field inside giveaway creator
  const [prizeName, setPrizeName] = useState("");
  const [prizeDesc, setPrizeDesc] = useState("");
  const [prizeQty, setPrizeQty] = useState(1);
  const [prizeImage, setPrizeImage] = useState("");

  // Player creation/editing form
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState("");
  const [playerTeamId, setPlayerTeamId] = useState("MIN");
  const [playerPosition, setPlayerPosition] = useState("WR");
  const [playerJerseyNumber, setPlayerJerseyNumber] = useState("18");
  const [playerDesc, setPlayerDesc] = useState("");
  const [playerPhoto, setPlayerPhoto] = useState("");

  // Winner selection form
  const [selectedGiveawayForWinner, setSelectedGiveawayForWinner] = useState<string>("");
  const [selectedEntryForWinner, setSelectedEntryForWinner] = useState<string>("");
  const [winnerPrizeName, setWinnerPrizeName] = useState("");

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Customer Care Representative Notification State
  const [careModalOpen, setCareModalOpen] = useState(false);
  const [selectedFanForCare, setSelectedFanForCare] = useState<{
    id: string;
    fullName: string;
    email: string;
    fanCode: string;
    city: string;
    favoriteTeam?: string;
    giveawayId?: string;
    giveawayTitle?: string;
    userId?: string;
    entryId?: string;
    isWinner?: boolean;
    winningPrize?: string;
    winningMessage?: string;
    claimCode?: string;
  } | null>(null);

  const [carePrizeName, setCarePrizeName] = useState("Official Autographed NFL Player Jersey");
  const [careMessage, setCareMessage] = useState("");
  const [careClaimCode, setCareClaimCode] = useState("");
  const [careRepName, setCareRepName] = useState("Representative #402 (Customer Care)");
  const [careGiveawayId, setCareGiveawayId] = useState("");
  const [isDispatchingCare, setIsDispatchingCare] = useState(false);

  const handleOpenCareModal = (fan: {
    id: string;
    fullName: string;
    email: string;
    fanCode: string;
    city: string;
    favoriteTeam?: string;
    giveawayId?: string;
    giveawayTitle?: string;
    userId?: string;
    entryId?: string;
    isWinner?: boolean;
    winningPrize?: string;
    winningMessage?: string;
    claimCode?: string;
  }) => {
    setSelectedFanForCare(fan);
    setCarePrizeName(fan.winningPrize || "Official Autographed NFL Player Jersey + 1,000 Gridiron Credits");
    setCareClaimCode(fan.claimCode || `CARE-${Math.floor(100000 + Math.random() * 900000)}`);
    setCareGiveawayId(fan.giveawayId || "");
    setCareMessage(fan.winningMessage || `Congratulations ${fan.fullName}! On behalf of NFL Gridiron Exchange Customer Care, you've been selected as an official winner for your fan registration! Present this claim code to redeem your prize.`);
    setCareModalOpen(true);
  };

  const handleDispatchCareNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFanForCare) return;

    setIsDispatchingCare(true);
    try {
      const targetGw = giveaways.find(g => g.id === careGiveawayId);
      const gwTitle = targetGw ? targetGw.title : (selectedFanForCare.giveawayTitle || "Fan Registration Winner Special Award");
      const playerId = targetGw ? targetGw.playerId : "care-special";
      const playerName = targetGw ? targetGw.playerName : "NFL Customer Care";

      // 1. Update registered_fans document if it exists (or add by fanCode/id)
      const fanDocId = selectedFanForCare.id;
      if (fanDocId) {
        await setDoc(doc(db, "registered_fans", fanDocId), {
          id: fanDocId,
          fullName: selectedFanForCare.fullName,
          email: selectedFanForCare.email,
          fanCode: selectedFanForCare.fanCode,
          city: selectedFanForCare.city,
          favoriteTeam: selectedFanForCare.favoriteTeam || "MIN",
          userId: selectedFanForCare.userId || "guest",
          isWinner: true,
          winningPrize: carePrizeName.trim(),
          winningMessage: careMessage.trim(),
          claimCode: careClaimCode.trim(),
          claimStatus: "PENDING_CLAIM",
          updatedAt: Date.now()
        }, { merge: true });
      }

      // 2. If associated with a giveaway entry, update entry status to WINNER
      if (selectedFanForCare.entryId) {
        await updateDoc(doc(db, "giveaway_entries", selectedFanForCare.entryId), {
          status: "WINNER",
          claimCode: careClaimCode.trim(),
          careRepresentativeNote: `Notified by ${careRepName}`
        });
      }

      // 3. Record in official giveaway_winners collection
      const winnerId = `winner-care-${Date.now()}`;
      await setDoc(doc(db, "giveaway_winners", winnerId), {
        id: winnerId,
        giveawayId: careGiveawayId || "fan-card-special",
        giveawayTitle: gwTitle,
        playerId: playerId,
        playerName: playerName,
        prizeName: carePrizeName.trim(),
        winnerUserId: selectedFanForCare.userId || "guest",
        winnerFanCode: selectedFanForCare.fanCode,
        winnerName: selectedFanForCare.fullName,
        winnerEmail: selectedFanForCare.email,
        selectionDate: Date.now(),
        status: "CONFIRMED",
        careMessage: careMessage.trim(),
        claimCode: careClaimCode.trim()
      });

      // 4. Log in customer_inquiries dispatch audit
      const inquiryId = `notice-${Date.now()}`;
      await setDoc(doc(db, "customer_inquiries", inquiryId), {
        id: inquiryId,
        type: "CUSTOMER_CARE_WINNER_NOTICE",
        userName: selectedFanForCare.fullName,
        userEmail: selectedFanForCare.email,
        fanCode: selectedFanForCare.fanCode,
        prize: carePrizeName.trim(),
        message: careMessage.trim(),
        claimCode: careClaimCode.trim(),
        repName: careRepName.trim(),
        timestamp: Date.now(),
        status: "DISPATCHED"
      });

      alert(`🎉 Customer Care Winner Notification successfully dispatched to ${selectedFanForCare.fullName} (${selectedFanForCare.fanCode})!\nClaim Code: ${careClaimCode}`);
      setCareModalOpen(false);
      setSelectedFanForCare(null);
    } catch (err: any) {
      console.error(err);
      alert("Error dispatching care notification: " + err.message);
    } finally {
      setIsDispatchingCare(false);
    }
  };

  // Load Firestore subscriptions
  useEffect(() => {
    const unsubGw = onSnapshot(collection(db, "giveaways"), (snap) => {
      const docs: Giveaway[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() } as Giveaway));
      setGiveaways(docs);
    });

    const unsubPl = onSnapshot(collection(db, "players"), (snap) => {
      const docs: Player[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() } as Player));
      setPlayers(docs);
    });

    const unsubFans = onSnapshot(collection(db, "registered_fans"), (snap) => {
      const docs: FanProfile[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() } as FanProfile));
      setRegisteredFans(docs);
    });

    const unsubEntries = onSnapshot(collection(db, "giveaway_entries"), (snap) => {
      const docs: GiveawayEntry[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() } as GiveawayEntry));
      setEntries(docs);
    });

    const unsubWinners = onSnapshot(collection(db, "giveaway_winners"), (snap) => {
      const docs: GiveawayWinner[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() } as GiveawayWinner));
      setWinners(docs);
    });

    const unsubTeams = onSnapshot(collection(db, "teams_config"), (snap) => {
      const map: Record<string, TeamConfig> = {};
      snap.forEach(d => { map[d.id] = d.data() as TeamConfig; });
      setTeamsConfig(map);
    });

    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      const docs: any[] = [];
      snap.forEach(d => docs.push({ id: d.id, ...d.data() }));
      setBookings(docs);
    });

    return () => { unsubGw(); unsubPl(); unsubFans(); unsubEntries(); unsubWinners(); unsubTeams(); unsubBookings(); };
  }, []);

  const handleToggleBookingApproval = async (bookingId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "approved" ? "pending" : "approved";
      await updateDoc(doc(db, "bookings", bookingId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      try {
        await updateDoc(doc(db, "ticket_orders", bookingId), {
          status: newStatus === "approved" ? "confirmed" : "pending_approval"
        });
      } catch {}
      alert(`Booking ${bookingId} has been updated to ${newStatus.toUpperCase()}!`);
    } catch (err: any) {
      console.error("Error updating booking status:", err);
      alert("Error updating booking status: " + err.message);
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking record?")) return;
    try {
      await deleteDoc(doc(db, "bookings", bookingId));
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteFan = async (fanId: string, fanName: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete registered fan entry for "${fanName}"?`)) return;
    try {
      await deleteDoc(doc(db, "registered_fans", fanId));
      try {
        await deleteDoc(doc(db, "fans", fanId));
      } catch {}
      alert(`Fan entry for "${fanName}" has been deleted.`);
    } catch (err: any) {
      console.error("Error deleting fan:", err);
      alert("Error deleting fan entry: " + err.message);
    }
  };

  const handleDeleteEntry = async (entryId: string, fanCode: string, userName: string) => {
    if (!window.confirm(`Permanently remove campaign entry for ${userName} (${fanCode})?`)) return;
    try {
      await deleteDoc(doc(db, "giveaway_entries", entryId));
      alert(`Campaign entry for ${userName} (${fanCode}) has been removed.`);
    } catch (err: any) {
      console.error("Error deleting entry:", err);
      alert("Error deleting entry: " + err.message);
    }
  };

  const handleDeleteWinner = async (winnerId: string, winnerName: string) => {
    if (!window.confirm(`Permanently remove winner record for ${winnerName}?`)) return;
    try {
      await deleteDoc(doc(db, "giveaway_winners", winnerId));
      alert(`Winner record for ${winnerName} removed.`);
    } catch (err: any) {
      console.error("Error deleting winner:", err);
      alert("Error deleting winner record: " + err.message);
    }
  };

  // Unified players list merging Firestore records with all NFL Star presets
  const allAvailablePlayers: Player[] = React.useMemo(() => {
    const list: Player[] = [...players];
    PRESET_NFL_STARS.forEach((preset) => {
      const presetId = `player-${preset.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      const exists = list.some(
        (p) => p.name.toLowerCase() === preset.name.toLowerCase() || p.id === presetId
      );
      if (!exists) {
        list.push({
          id: presetId,
          name: preset.name,
          teamId: preset.teamId,
          position: preset.position,
          jerseyNumber: preset.jerseyNumber,
          description: preset.description,
          photoUrl: preset.photoUrl,
          createdAt: Date.now()
        });
      }
    });
    return list;
  }, [players]);

  // Set default player if available
  useEffect(() => {
    if (allAvailablePlayers.length > 0 && !gwPlayerId) {
      setGwPlayerId(allAvailablePlayers[0].id);
    }
  }, [allAvailablePlayers]);

  // Reset Giveaway Form
  const resetGiveawayForm = () => {
    setEditingGiveawayId(null);
    setGwTitle("");
    setGwDescription("");
    setGwPlayerId(allAvailablePlayers[0]?.id || "");
    setIsCustomPlayerMode(false);
    setCustomPlayerName("");
    setCustomPlayerTeam("SEA");
    setCustomPlayerPos("WR");
    setCustomPlayerJersey("11");
    setCustomPlayerPhoto("");
    setGwHeroImage("");
    setGwStartDate("");
    setGwEndDate("");
    setGwEligibility("Open to all registered fans aged 18+");
    setGwEntryRequirements("Must hold a valid registered Fan Code.");
    setGwNumWinners(1);
    setGwRules("Official giveaway rules apply. Winner selected fairly and notified via email.");
    setGwStatus("ACTIVE");
    setGwPrizes([]);
  };

  const handleAddPrize = () => {
    if (!prizeName.trim()) return;
    const newPrize: Prize = {
      id: `p-${Date.now()}`,
      name: prizeName.trim(),
      description: prizeDesc.trim(),
      quantity: Number(prizeQty) || 1,
      imageUrl: prizeImage || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400"
    };
    setGwPrizes([...gwPrizes, newPrize]);
    setPrizeName("");
    setPrizeDesc("");
    setPrizeQty(1);
    setPrizeImage("");
  };

  const handleRemovePrize = (id: string) => {
    setGwPrizes(gwPrizes.filter(p => p.id !== id));
  };

  const handleSaveGiveaway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwTitle.trim()) {
      alert("Please provide campaign title.");
      return;
    }

    let finalPlayerId = gwPlayerId;
    let pName = "Featured Player";
    let pTeam = "SEA";

    if (isCustomPlayerMode || gwPlayerId === "__CUSTOM__") {
      if (!customPlayerName.trim()) {
        alert("Please enter the custom player name.");
        return;
      }
      pName = customPlayerName.trim();
      pTeam = customPlayerTeam;
      finalPlayerId = `player-${pName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

      // Persist custom player in Firestore
      const newPlayerObj: Player = {
        id: finalPlayerId,
        name: pName,
        teamId: pTeam,
        position: customPlayerPos.trim().toUpperCase() || "ATH",
        jerseyNumber: customPlayerJersey.trim() || "00",
        description: `Official NFL player ${pName} for ${pTeam}.`,
        photoUrl: customPlayerPhoto.trim() || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=600",
        createdAt: Date.now()
      };
      await setDoc(doc(db, "players", finalPlayerId), newPlayerObj);
    } else {
      const selectedPlayer = allAvailablePlayers.find(p => p.id === gwPlayerId || p.name.toLowerCase() === gwPlayerId.toLowerCase());
      if (selectedPlayer) {
        finalPlayerId = selectedPlayer.id;
        pName = selectedPlayer.name;
        pTeam = selectedPlayer.teamId;

        // Auto-seed player into Firestore if not present yet
        const existingInDb = players.some(p => p.id === selectedPlayer.id || p.name.toLowerCase() === selectedPlayer.name.toLowerCase());
        if (!existingInDb) {
          await setDoc(doc(db, "players", selectedPlayer.id), selectedPlayer);
        }
      }
    }

    try {
      const gwId = editingGiveawayId || `gw-${Date.now()}`;
      const payload: Giveaway = {
        id: gwId,
        title: (gwTitle || "").trim(),
        description: (gwDescription || "").trim(),
        playerId: finalPlayerId || "",
        playerName: pName || "",
        teamId: pTeam || "",
        heroImageUrl: gwHeroImage || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
        startDate: gwStartDate || new Date().toISOString().split('T')[0],
        endDate: gwEndDate || "2026-12-31",
        eligibility: gwEligibility || "Open to all registered fans aged 18+",
        entryRequirements: gwEntryRequirements || "Must hold a valid registered Fan Code.",
        numWinners: Number(gwNumWinners) || 1,
        rules: gwRules || "Official giveaway rules apply. Winner selected fairly and notified via email.",
        status: gwStatus || "ACTIVE",
        entriesCount: editingGiveawayId ? (giveaways.find(g=>g.id===editingGiveawayId)?.entriesCount || 0) : 0,
        prizes: (gwPrizes || []).map(p => ({
          id: p.id || `p-${Date.now()}`,
          name: p.name || "",
          description: p.description || "",
          quantity: Number(p.quantity) || 1,
          imageUrl: p.imageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=400"
        })),
        updatedAt: Date.now(),
        createdAt: editingGiveawayId ? (giveaways.find(g=>g.id===editingGiveawayId)?.createdAt || Date.now()) : Date.now()
      };

      await setDoc(doc(db, "giveaways", gwId), payload);
      alert(editingGiveawayId ? "Giveaway campaign updated!" : "New Giveaway campaign published!");
      resetGiveawayForm();
      setSubTab("giveaways");
    } catch (err: any) {
      console.error(err);
      alert("Error saving giveaway: " + err.message);
    }
  };

  const handleStartEditGiveaway = (g: Giveaway) => {
    setEditingGiveawayId(g.id);
    setGwTitle(g.title || "");
    setGwDescription(g.description || "");

    const found = allAvailablePlayers.find(p => p.id === g.playerId || p.name.toLowerCase() === g.playerName?.toLowerCase());
    if (found) {
      setGwPlayerId(found.id);
      setIsCustomPlayerMode(false);
    } else {
      setGwPlayerId("__CUSTOM__");
      setIsCustomPlayerMode(true);
      setCustomPlayerName(g.playerName || "");
      setCustomPlayerTeam(g.teamId || "SEA");
    }

    setGwHeroImage(g.heroImageUrl || "");
    setGwStartDate(g.startDate || "");
    setGwEndDate(g.endDate || "");
    setGwEligibility(g.eligibility || "Open to all registered fans aged 18+");
    setGwEntryRequirements(g.entryRequirements || "Must hold a valid registered Fan Code.");
    setGwNumWinners(g.numWinners || 1);
    setGwRules(g.rules || "Official giveaway rules apply. Winner selected fairly and notified via email.");
    setGwStatus(g.status || "ACTIVE");
    setGwPrizes(g.prizes || []);
    setSubTab("create_giveaway");
  };

  const handleDeleteGiveaway = async (id: string) => {
    if (!window.confirm("Permanently remove this giveaway campaign?")) return;
    try {
      await deleteDoc(doc(db, "giveaways", id));
    } catch (err) {
      console.error(err);
    }
  };

  // Player CRUD
  const resetPlayerForm = () => {
    setEditingPlayerId(null);
    setPlayerName("");
    setPlayerTeamId("MIN");
    setPlayerPosition("WR");
    setPlayerJerseyNumber("18");
    setPlayerDesc("");
    setPlayerPhoto("");
  };

  const handleSavePlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    try {
      const pId = editingPlayerId || `player-${Date.now()}`;
      const payload: Player = {
        id: pId,
        name: playerName.trim(),
        teamId: playerTeamId,
        position: playerPosition.trim().toUpperCase(),
        jerseyNumber: playerJerseyNumber.trim(),
        description: playerDesc.trim(),
        photoUrl: playerPhoto || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=400",
        updatedAt: Date.now(),
        createdAt: editingPlayerId ? (players.find(p=>p.id===editingPlayerId)?.createdAt || Date.now()) : Date.now()
      };

      await setDoc(doc(db, "players", pId), payload);
      alert(editingPlayerId ? "Player record updated." : "New Player added to roster!");
      resetPlayerForm();
    } catch (err: any) {
      console.error(err);
      alert("Error saving player: " + err.message);
    }
  };

  const handleStartEditPlayer = (p: Player) => {
    setEditingPlayerId(p.id);
    setPlayerName(p.name);
    setPlayerTeamId(p.teamId);
    setPlayerPosition(p.position);
    setPlayerJerseyNumber(p.jerseyNumber);
    setPlayerDesc(p.description);
    setPlayerPhoto(p.photoUrl);
  };

  const handleDeletePlayer = async (id: string) => {
    if (!window.confirm("Remove this player record from system?")) return;
    try {
      await deleteDoc(doc(db, "players", id));
    } catch (err) {
      console.error(err);
    }
  };

  // Winner selection execution
  const handleRecordWinner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGiveawayForWinner || !selectedEntryForWinner) {
      alert("Please select both a giveaway and an eligible entry.");
      return;
    }

    const entryObj = entries.find(e => e.id === selectedEntryForWinner);
    const gwObj = giveaways.find(g => g.id === selectedGiveawayForWinner);

    if (!entryObj || !gwObj) return;

    try {
      const winnerId = `winner-${Date.now()}`;
      const payload: GiveawayWinner = {
        id: winnerId,
        giveawayId: gwObj.id,
        giveawayTitle: gwObj.title,
        playerId: gwObj.playerId,
        playerName: gwObj.playerName,
        prizeName: winnerPrizeName || gwObj.prizes[0]?.name || "Official Prize",
        winnerUserId: entryObj.userId,
        winnerFanCode: entryObj.fanCode,
        winnerName: entryObj.userName,
        winnerEmail: entryObj.userEmail,
        selectionDate: Date.now(),
        status: "CONFIRMED"
      };

      await setDoc(doc(db, "giveaway_winners", winnerId), payload);
      // Update entry status to WINNER
      await updateDoc(doc(db, "giveaway_entries", entryObj.id), { status: "WINNER" });

      alert(`Official Winner Record Published! Winner: ${entryObj.userName} (${entryObj.fanCode})`);
      setSelectedGiveawayForWinner("");
      setSelectedEntryForWinner("");
      setWinnerPrizeName("");
    } catch (err: any) {
      console.error(err);
      alert("Error recording winner: " + err.message);
    }
  };

  return (
    <div className="space-y-8 text-left p-6 bg-zinc-950/40 rounded-[2.5rem]">
      {/* Control Room Sub-Nav Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest text-red-400 bg-red-600/10 rounded-full mb-3 border border-red-500/20">
            <Shield className="w-3.5 h-3.5" />
            ADMIN CONTROL ROOM
          </span>
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
            PLAYER GIVEAWAYS MANAGER
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Manage player profiles, active giveaway campaigns, entries, registered fans, and official winner audits.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap bg-zinc-900/60 border border-white/5 p-1 rounded-2xl gap-1">
          {([
            { id: "giveaways", label: "Giveaways" },
            { id: "create_giveaway", label: editingGiveawayId ? "Edit Campaign" : "+ New Giveaway" },
            { id: "players", label: "Players Roster" },
            { id: "experiences", label: "Experience Pricing" },
            { id: "bookings", label: `Bookings & Approvals ${bookings.filter(b => b.status === "pending").length > 0 ? `(${bookings.filter(b => b.status === "pending").length} Pending)` : `(${bookings.length})`}` },
            { id: "entries", label: "Entries & Fans" },
            { id: "winners", label: "Winners Audit" }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              className={cn(
                "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap cursor-pointer",
                subTab === tab.id
                  ? "bg-red-600 text-white shadow-lg"
                  : tab.id === "bookings" && bookings.filter(b => b.status === "pending").length > 0
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:text-white"
                    : "text-zinc-400 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. GIVEAWAYS TAB */}
      {subTab === "giveaways" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              ALL CAMPAIGNS ({giveaways.length})
            </h4>
            <button
              onClick={() => { resetGiveawayForm(); setSubTab("create_giveaway"); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 cursor-pointer shadow-lg"
            >
              <Plus className="w-3.5 h-3.5" />
              CREATE GIVEAWAY
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {giveaways.map(g => (
              <div key={g.id} className="bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="aspect-[16/9] rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative">
                    <img src={g.heroImageUrl} alt={g.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/80 text-white text-[8px] font-black font-mono">
                      {g.teamId}
                    </span>
                    <span className={cn(
                      "absolute top-2 right-2 px-2.5 py-1 rounded-full text-[8px] font-black uppercase",
                      g.status === "ACTIVE" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                    )}>
                      {g.status}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">
                      PLAYER: {g.playerName}
                    </span>
                    <h4 className="text-sm font-black italic uppercase text-white line-clamp-1">{g.title}</h4>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-2 mt-1">{g.description}</p>
                  </div>

                  <div className="text-[10px] text-zinc-500 font-bold space-y-1 pt-2 border-t border-white/5 font-mono">
                    <p>Entries Logged: <strong className="text-white">{g.entriesCount || 0}</strong></p>
                    <p>Prizes Count: <strong className="text-amber-400">{g.prizes?.length || 0}</strong></p>
                    <p>Closing Date: <strong className="text-white">{g.endDate}</strong></p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleStartEditGiveaway(g)}
                    className="flex-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteGiveaway(g.id)}
                    className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. CREATE / EDIT GIVEAWAY TAB */}
      {subTab === "create_giveaway" && (
        <div className="bg-zinc-900/60 p-8 rounded-[2rem] border border-white/10 space-y-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Gift className="w-4 h-4 text-red-500" />
              {editingGiveawayId ? "EDIT GIVEAWAY CAMPAIGN" : "CREATE NEW PLAYER GIVEAWAY"}
            </h4>

            <button
              onClick={resetGiveawayForm}
              className="text-[9px] font-black uppercase text-zinc-500 hover:text-white"
            >
              Reset Form
            </button>
          </div>

          <form onSubmit={handleSaveGiveaway} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Campaign Title */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-400">Giveaway Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Justin Jefferson Autographed Vikings Game Jersey Giveaway"
                  value={gwTitle}
                  onChange={(e) => setGwTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>

              {/* Select Player */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Featured Player *</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomPlayerMode(!isCustomPlayerMode);
                      if (!isCustomPlayerMode) {
                        setGwPlayerId("__CUSTOM__");
                      } else {
                        setGwPlayerId(allAvailablePlayers[0]?.id || "");
                      }
                    }}
                    className="text-[9px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer"
                  >
                    {isCustomPlayerMode ? "← Select From Roster Presets" : "+ Enter Custom Player Details"}
                  </button>
                </div>

                {!isCustomPlayerMode ? (
                  <select
                    value={gwPlayerId}
                    onChange={(e) => {
                      if (e.target.value === "__CUSTOM__") {
                        setIsCustomPlayerMode(true);
                        setGwPlayerId("__CUSTOM__");
                      } else {
                        setGwPlayerId(e.target.value);
                      }
                    }}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold uppercase focus:outline-none"
                  >
                    <optgroup label="⭐ Top NFL Stars & Registered Roster">
                      {allAvailablePlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.teamId} - #{p.jerseyNumber || "00"} · {p.position || "ATH"})
                        </option>
                      ))}
                    </optgroup>
                    <option value="__CUSTOM__">➕ Enter / Register New Custom Player...</option>
                  </select>
                ) : (
                  <div className="p-3 bg-zinc-950/90 border border-red-500/30 rounded-xl space-y-3">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase text-zinc-400">Custom Player Full Name *</label>
                      <input
                        type="text"
                        required={isCustomPlayerMode}
                        placeholder="e.g. Jaxon Smith-Njigba"
                        value={customPlayerName}
                        onChange={(e) => setCustomPlayerName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400">Team</label>
                        <select
                          value={customPlayerTeam}
                          onChange={(e) => setCustomPlayerTeam(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-bold uppercase"
                        >
                          {NFL_TEAMS.map(t => <option key={t.id} value={t.id}>{t.id} - {t.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400">Position</label>
                        <input
                          type="text"
                          placeholder="WR"
                          value={customPlayerPos}
                          onChange={(e) => setCustomPlayerPos(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-bold uppercase text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[8px] font-black uppercase text-zinc-400">Jersey #</label>
                        <input
                          type="text"
                          placeholder="11"
                          value={customPlayerJersey}
                          onChange={(e) => setCustomPlayerJersey(e.target.value)}
                          className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white font-mono text-center"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick 1-Click NFL Stars Preset Chips */}
                <div className="pt-1">
                  <span className="text-[8px] font-mono text-zinc-500 uppercase font-black block mb-1.5">
                    ⚡ Quick 1-Click Star Presets:
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 no-scrollbar">
                    {PRESET_NFL_STARS.map((star) => {
                      const presetId = `player-${star.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                      const isSelected = !isCustomPlayerMode && gwPlayerId === presetId;
                      return (
                        <button
                          key={star.name}
                          type="button"
                          onClick={() => {
                            setIsCustomPlayerMode(false);
                            setGwPlayerId(presetId);
                            if (!gwTitle || gwTitle.includes("Giveaway")) {
                              setGwTitle(`Official ${star.name} (${star.teamId}) Fan Club Giveaway`);
                            }
                            if (gwPrizes.length === 0) {
                              setGwPrizes([{
                                id: `p-${Date.now()}`,
                                name: star.defaultPrizeName,
                                description: star.defaultPrizeDesc,
                                quantity: 1,
                                imageUrl: star.photoUrl
                              }]);
                            }
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer border",
                            isSelected
                              ? "bg-red-600 text-white border-red-500 shadow-sm"
                              : "bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white border-white/10"
                          )}
                        >
                          {star.name} (#{star.jerseyNumber} · {star.teamId})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-zinc-400">Campaign Description</label>
              <textarea
                rows={3}
                placeholder="Detailed narrative describing the player giveaway campaign and prize specifics..."
                value={gwDescription}
                onChange={(e) => setGwDescription(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl p-4 text-xs text-zinc-300 font-medium focus:outline-none"
              />
            </div>

            {/* Hero Image Upload */}
            <ImageUploader
              value={gwHeroImage}
              onChange={setGwHeroImage}
              label="Campaign Hero Image (Direct Device Upload)"
              placeholder="Select high-res campaign hero banner"
              aspectRatio="landscape"
            />

            {/* Dates & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-400">Start Date</label>
                <input
                  type="date"
                  value={gwStartDate}
                  onChange={(e) => setGwStartDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-400">Closing Date</label>
                <input
                  type="date"
                  value={gwEndDate}
                  onChange={(e) => setGwEndDate(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-400">Campaign Status</label>
                <select
                  value={gwStatus}
                  onChange={(e) => setGwStatus(e.target.value as GiveawayStatus)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-bold uppercase"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ENDED">ENDED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
              </div>
            </div>

            {/* Prizes Builder Section */}
            <div className="p-6 bg-zinc-950/80 border border-white/10 rounded-2xl space-y-4">
              <h5 className="text-xs font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                <Gift className="w-4 h-4" />
                BUILD CAMPAIGN PRIZES ({gwPrizes.length})
              </h5>

              {/* Added prizes list */}
              <div className="space-y-2">
                {gwPrizes.map((p, idx) => (
                  <div key={idx} className="p-3 bg-zinc-900 border border-white/5 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.name} className="w-10 h-10 rounded-lg object-cover border border-white/10" />
                      <div>
                        <p className="text-xs font-black text-white">{p.name} (Qty: {p.quantity})</p>
                        <p className="text-[10px] text-zinc-400">{p.description}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePrize(p.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-400"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add new prize subform */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <input
                  type="text"
                  placeholder="Prize Name (e.g. Stitched Nike Jersey)"
                  value={prizeName}
                  onChange={(e) => setPrizeName(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
                <input
                  type="text"
                  placeholder="Prize Description"
                  value={prizeDesc}
                  onChange={(e) => setPrizeDesc(e.target.value)}
                  className="bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={prizeQty}
                    onChange={(e) => setPrizeQty(Number(e.target.value))}
                    className="w-20 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrize}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-[10px] font-black uppercase rounded-xl transition-all"
                  >
                    + ADD PRIZE
                  </button>
                </div>
              </div>

              <ImageUploader
                value={prizeImage}
                onChange={setPrizeImage}
                label="Prize Image (Optional Direct Device Upload)"
                placeholder="Upload prize photo"
                aspectRatio="square"
              />
            </div>

            {/* Save Button */}
            <button
              type="submit"
              className="w-full py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-red-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {editingGiveawayId ? "UPDATE GIVEAWAY CAMPAIGN" : "PUBLISH GIVEAWAY CAMPAIGN"}
            </button>
          </form>
        </div>
      )}

      {/* 3. PLAYERS ROSTER TAB */}
      {subTab === "players" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Form */}
          <div className="lg:col-span-5 bg-zinc-900/60 p-6 rounded-[2rem] border border-white/10 space-y-4 h-fit">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3">
              {editingPlayerId ? "EDIT PLAYER PROFILE" : "REGISTER NEW PLAYER"}
            </h4>

            <form onSubmit={handleSavePlayer} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Player Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Justin Jefferson"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2 text-xs text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-400">Team</label>
                  <select
                    value={playerTeamId}
                    onChange={(e) => setPlayerTeamId(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-bold uppercase"
                  >
                    {NFL_TEAMS.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-400">Position</label>
                  <input
                    type="text"
                    placeholder="WR"
                    value={playerPosition}
                    onChange={(e) => setPlayerPosition(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-bold uppercase text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase text-zinc-400">Jersey #</label>
                  <input
                    type="text"
                    placeholder="18"
                    value={playerJerseyNumber}
                    onChange={(e) => setPlayerJerseyNumber(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-2 py-2 text-xs text-white font-mono text-center"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Bio Description</label>
                <textarea
                  rows={2}
                  placeholder="Star player bio overview..."
                  value={playerDesc}
                  onChange={(e) => setPlayerDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-300 font-medium"
                />
              </div>

              <ImageUploader
                value={playerPhoto}
                onChange={setPlayerPhoto}
                label="Player Photo (Direct Device Upload)"
                placeholder="Upload official player photo"
                aspectRatio="portrait"
              />

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg"
              >
                {editingPlayerId ? "UPDATE PLAYER RECORD" : "ADD PLAYER TO ROSTER"}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="lg:col-span-7 bg-zinc-900/60 p-6 rounded-[2rem] border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between border-b border-white/5 pb-3 gap-2">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">
                PLAYER ROSTER ({players.length})
              </h4>
              <button
                type="button"
                onClick={async () => {
                  if (!window.confirm("Seed/restore full roster of 12+ NFL Star Players and Active Giveaways?")) return;
                  try {
                    for (const star of PRESET_NFL_STARS) {
                      const playerId = `player-${star.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
                      await setDoc(doc(db, "players", playerId), {
                        id: playerId,
                        name: star.name,
                        teamId: star.teamId,
                        position: star.position,
                        jerseyNumber: star.jerseyNumber,
                        description: star.description,
                        photoUrl: star.photoUrl,
                        updatedAt: Date.now(),
                        createdAt: Date.now()
                      });

                      const gwId = `gw-${playerId}`;
                      await setDoc(doc(db, "giveaways", gwId), {
                        id: gwId,
                        title: `Official ${star.name} Fan Giveaway`,
                        description: `Win authentic memorabilia signed by ${star.name}. Open to all registered fan club members!`,
                        playerId: playerId,
                        playerName: star.name,
                        teamId: star.teamId,
                        heroImageUrl: star.heroImageUrl,
                        startDate: new Date().toISOString().split("T")[0],
                        endDate: "2026-12-31",
                        eligibility: "Open to all registered fans aged 18+",
                        entryRequirements: "Must hold a valid registered Fan Code.",
                        numWinners: 1,
                        rules: "Official giveaway rules apply. Winner selected fairly.",
                        status: "ACTIVE",
                        entriesCount: 15,
                        prizes: [{
                          id: `p-${Date.now()}`,
                          name: star.defaultPrizeName,
                          description: star.defaultPrizeDesc,
                          quantity: 1,
                          imageUrl: star.photoUrl
                        }],
                        updatedAt: Date.now(),
                        createdAt: Date.now()
                      });
                    }
                    alert("Successfully populated all 12+ NFL Stars Roster & Giveaways!");
                  } catch (err: any) {
                    alert("Error: " + err.message);
                  }
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-3 h-3" />
                Seed Full Stars Roster
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto pr-2 no-scrollbar">
              {players.map(p => (
                <div key={p.id} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl flex items-center gap-4">
                  <div className="w-16 h-20 rounded-xl overflow-hidden bg-zinc-900 shrink-0 border border-white/10">
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black text-blue-400 font-mono">
                      {p.teamId} · #{p.jerseyNumber} · {p.position}
                    </span>
                    <h5 className="text-xs font-black uppercase text-white truncate">{p.name}</h5>
                    <p className="text-[10px] text-zinc-400 line-clamp-1">{p.description}</p>

                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleStartEditPlayer(p)}
                        className="p-1.5 bg-zinc-900 text-zinc-300 hover:text-white rounded-lg text-[9px] font-black uppercase"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeletePlayer(p.id)}
                        className="p-1.5 bg-rose-500/10 text-rose-500 hover:text-rose-400 rounded-lg text-[9px]"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. ENTRIES & REGISTERED FANS TAB */}
      {subTab === "entries" && (
        <div className="space-y-8">
          {/* Search Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/80 p-4 rounded-2xl border border-white/10">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search registered fans by name, email, fan code, or city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white font-medium focus:outline-none"
              />
            </div>
            <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider bg-amber-500/10 px-3 py-2 rounded-xl border border-amber-500/20 whitespace-nowrap">
              🎧 Customer Care Portal Mode
            </span>
          </div>

          {/* Registered Fans List */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />
                REGISTERED FANS DIRECTORY ({registeredFans.length})
              </h4>
              <span className="text-[9px] text-zinc-400 font-bold uppercase">
                Click "Tell Them They Won" to issue winner notification
              </span>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[750px]">
                <thead className="bg-zinc-950 text-[9px] font-black uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="p-3">Fan Code</th>
                    <th className="p-3">Name & Photo</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">City</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Winner Status</th>
                    <th className="p-3 text-right">Customer Care Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {registeredFans
                    .filter(f => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        f.fullName.toLowerCase().includes(term) ||
                        f.email.toLowerCase().includes(term) ||
                        f.fanCode.toLowerCase().includes(term) ||
                        f.city.toLowerCase().includes(term)
                      );
                    })
                    .map(f => (
                      <tr key={f.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-black text-cyan-400">{f.fanCode}</td>
                        <td className="p-3 font-black text-white flex items-center gap-2">
                          <img src={f.profilePhotoUrl} alt={f.fullName} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                          <span>{f.fullName}</span>
                        </td>
                        <td className="p-3 text-zinc-400 font-mono">{f.email}</td>
                        <td className="p-3 text-zinc-300 font-bold">{f.city}</td>
                        <td className="p-3 text-blue-400 font-black">{f.favoriteTeam}</td>
                        <td className="p-3">
                          {f.isWinner ? (
                            <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[8px] font-black uppercase">
                              🏆 WINNER ({f.claimStatus || 'PENDING'})
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[8px] font-black uppercase">
                              REGISTERED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenCareModal({
                                id: f.id,
                                fullName: f.fullName,
                                email: f.email,
                                fanCode: f.fanCode,
                                city: f.city,
                                favoriteTeam: f.favoriteTeam,
                                userId: f.userId,
                                isWinner: f.isWinner,
                                winningPrize: f.winningPrize,
                                winningMessage: f.winningMessage,
                                claimCode: f.claimCode
                              })}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              {f.isWinner ? "Update Winner Notice" : "🏆 Tell Them They Won"}
                            </button>
                            <button
                              onClick={() => handleDeleteFan(f.id, f.fullName)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20"
                              title="Delete Fan Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Giveaway Entries Log */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-red-500" />
                CAMPAIGN ENTRY RECORDS ({entries.length})
              </h4>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[750px]">
                <thead className="bg-zinc-950 text-[9px] font-black uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="p-3">Fan Code</th>
                    <th className="p-3">User Name</th>
                    <th className="p-3">Giveaway Title</th>
                    <th className="p-3">Player</th>
                    <th className="p-3">Entry Status</th>
                    <th className="p-3 text-right">Customer Care Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {entries
                    .filter(e => {
                      if (!searchTerm.trim()) return true;
                      const term = searchTerm.toLowerCase();
                      return (
                        e.userName.toLowerCase().includes(term) ||
                        e.userEmail.toLowerCase().includes(term) ||
                        e.fanCode.toLowerCase().includes(term) ||
                        e.giveawayTitle.toLowerCase().includes(term)
                      );
                    })
                    .map(e => (
                      <tr key={e.id} className="hover:bg-white/[0.02]">
                        <td className="p-3 font-mono font-black text-cyan-400">{e.fanCode}</td>
                        <td className="p-3 font-black text-white">{e.userName} ({e.userEmail})</td>
                        <td className="p-3 text-zinc-300 font-bold">{e.giveawayTitle}</td>
                        <td className="p-3 text-blue-400 font-black">{e.playerName} ({e.teamId})</td>
                        <td className="p-3">
                          <span className={cn(
                            "px-2.5 py-1 rounded text-[8px] font-black uppercase",
                            e.status === "WINNER" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-emerald-500/20 text-emerald-400"
                          )}>
                            {e.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenCareModal({
                                id: registeredFans.find(f => f.fanCode === e.fanCode)?.id || `fan-${e.fanCode}`,
                                fullName: e.userName,
                                email: e.userEmail,
                                fanCode: e.fanCode,
                                city: e.city || "Minneapolis, MN",
                                favoriteTeam: e.teamId,
                                giveawayId: e.giveawayId,
                                giveawayTitle: e.giveawayTitle,
                                userId: e.userId,
                                entryId: e.id,
                                isWinner: e.status === "WINNER",
                                claimCode: e.claimCode
                              })}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1"
                            >
                              <Award className="w-3 h-3" />
                              {e.status === "WINNER" ? "Manage Winner Notice" : "🏆 Tell Them They Won"}
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(e.id, e.fanCode, e.userName)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20"
                              title="Delete Giveaway Entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. EXPERIENCES & LIVE PRICING TAB */}
      {subTab === "experiences" && (
        <div className="space-y-6">
          <ExperienceAdmin />
        </div>
      )}

      {/* 5. WINNERS AUDIT TAB */}
      {subTab === "winners" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Winner Picker Form */}
          <div className="lg:col-span-5 bg-zinc-900/60 p-6 rounded-[2rem] border border-white/10 space-y-4 h-fit">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              OFFICIAL WINNER SELECTION
            </h4>

            <form onSubmit={handleRecordWinner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Select Giveaway Campaign</label>
                <select
                  value={selectedGiveawayForWinner}
                  onChange={(e) => setSelectedGiveawayForWinner(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold uppercase"
                >
                  <option value="">-- Choose Campaign --</option>
                  {giveaways.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Select Eligible Entry</label>
                <select
                  value={selectedEntryForWinner}
                  onChange={(e) => setSelectedEntryForWinner(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold uppercase"
                >
                  <option value="">-- Choose Entry --</option>
                  {entries
                    .filter(e => !selectedGiveawayForWinner || e.giveawayId === selectedGiveawayForWinner)
                    .map(e => (
                      <option key={e.id} value={e.id}>
                        {e.userName} ({e.fanCode}) - {e.userEmail}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Prize Awarded</label>
                <input
                  type="text"
                  placeholder="e.g. Autographed Nike Vapor Jersey"
                  value={winnerPrizeName}
                  onChange={(e) => setWinnerPrizeName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg"
              >
                RECORD & PUBLISH WINNER
              </button>
            </form>
          </div>

          {/* Winners Log */}
          <div className="lg:col-span-7 bg-zinc-900/60 p-6 rounded-[2rem] border border-white/10 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-3">
              CONFIRMED WINNERS LOG ({winners.length})
            </h4>

            <div className="space-y-3">
              {winners.map(w => (
                <div key={w.id} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">
                      WINNER FAN CODE: {w.winnerFanCode}
                    </span>
                    <h5 className="text-xs font-black text-white">{w.winnerName} ({w.winnerEmail})</h5>
                    <p className="text-[10px] text-zinc-400">{w.giveawayTitle} — Prize: <strong className="text-white">{w.prizeName}</strong></p>
                    {w.careMessage && (
                      <p className="text-[9px] text-zinc-400 italic">"{w.careMessage}"</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-black uppercase">
                      {w.status}
                    </span>
                    <button
                      onClick={() => handleDeleteWinner(w.id, w.winnerName)}
                      className="p-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white rounded-xl transition-all border border-rose-500/20"
                      title="Delete Winner Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. BOOKINGS & PAYMENT APPROVALS TAB */}
      {subTab === "bookings" && (
        <div className="space-y-6">
          {/* Summary Stat Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-zinc-900/60 border border-white/5 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Total Bookings</span>
              <p className="text-2xl font-black font-mono text-white">{bookings.length}</p>
            </div>

            <div className="p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending Approval
              </span>
              <p className="text-2xl font-black font-mono text-amber-300">
                {bookings.filter(b => b.status === "pending").length}
              </p>
            </div>

            <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approved Passes
              </span>
              <p className="text-2xl font-black font-mono text-emerald-300">
                {bookings.filter(b => b.status === "approved").length}
              </p>
            </div>

            <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" /> Volume Total
              </span>
              <p className="text-2xl font-black font-mono text-blue-300">
                {formatCurrency(bookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0))}
              </p>
            </div>
          </div>

          {/* Search Filter Header */}
          <div className="bg-zinc-900/60 border border-white/10 rounded-[2rem] p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-blue-500" />
                  EXPERIENCE TICKET RESERVATIONS & PAYMENT VERIFICATION ({bookings.length})
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">
                  Review customer payments (BMO Bank, CashApp, Venmo, Zelle, Crypto) and manually approve passes.
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search attendee, email, ref, ticket..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Bookings List Table */}
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[900px]">
                <thead className="bg-zinc-950 text-[9px] font-black uppercase font-mono text-zinc-500">
                  <tr>
                    <th className="p-3">Attendee Details</th>
                    <th className="p-3">Experience & Session</th>
                    <th className="p-3">Payment Channel</th>
                    <th className="p-3">Sender / Proof Ref</th>
                    <th className="p-3 text-right">Invoice Sum</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Approve / Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                        No ticket booking records found.
                      </td>
                    </tr>
                  ) : (
                    bookings
                      .filter(b => {
                        if (!searchTerm.trim()) return true;
                        const term = searchTerm.toLowerCase();
                        return (
                          (b.userEmail && b.userEmail.toLowerCase().includes(term)) ||
                          (b.senderName && b.senderName.toLowerCase().includes(term)) ||
                          (b.buyerPhone && b.buyerPhone.toLowerCase().includes(term)) ||
                          (b.experienceTitle && b.experienceTitle.toLowerCase().includes(term)) ||
                          (b.paymentMethod && b.paymentMethod.toLowerCase().includes(term)) ||
                          (b.paymentRef && b.paymentRef.toLowerCase().includes(term)) ||
                          (b.id && b.id.toLowerCase().includes(term))
                        );
                      })
                      .map(b => (
                        <tr key={b.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <p className="font-black text-white">{b.senderName || b.userEmail || "Anonymous Guest"}</p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 lowercase">{b.userEmail}</p>
                            {b.buyerPhone && (
                              <p className="text-[9px] text-zinc-500 font-mono mt-0.5">{b.buyerPhone}</p>
                            )}
                            <span className="text-[8px] font-mono text-zinc-600 block mt-0.5 select-all">{b.id}</span>
                          </td>

                          <td className="p-3">
                            <p className="font-black text-white uppercase line-clamp-1">{b.experienceTitle}</p>
                            <p className="text-[10px] text-blue-400 font-mono mt-0.5 uppercase font-bold">
                              {b.tier?.toUpperCase()} · {b.guestsCount || 1} GUEST(S)
                            </p>
                            <p className="text-[9px] text-zinc-500 font-mono mt-0.5">
                              {b.date} @ {b.timeSlot}
                            </p>
                          </td>

                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-white/10 text-[10px] font-black uppercase text-zinc-300 inline-flex items-center gap-1">
                              {b.paymentMethod === "bank" ? <Building2 className="w-3 h-3 text-blue-400" /> :
                               b.paymentMethod === "crypto" ? <QrCode className="w-3 h-3 text-amber-400" /> :
                               <Smartphone className="w-3 h-3 text-emerald-400" />}
                              {b.paymentMethod === "bank" ? "BMO Bank Wire" :
                               b.paymentMethod === "cashapp" ? "Cash App" :
                               b.paymentMethod === "venmo" ? "Venmo" :
                               b.paymentMethod === "zelle" ? "Zelle" :
                               b.paymentMethod === "crypto" ? "Crypto (USDT/BTC/ETH)" :
                               (b.paymentMethod || "Verified Transfer")}
                            </span>
                          </td>

                          <td className="p-3">
                            <p className="font-mono text-xs font-bold text-white select-all">
                              {b.paymentRef || "PENDING_PROOF"}
                            </p>
                            <span className="text-[9px] text-zinc-500 font-bold block mt-0.5">
                              Sender: {b.senderName || "Unspecified"}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <span className="font-mono text-sm font-black text-emerald-400">
                              {formatCurrency(b.totalPrice || 0)}
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <span className={cn(
                              "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1",
                              b.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                            )}>
                              {b.status === "approved" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                              {b.status === "approved" ? "APPROVED" : "PENDING APPROVAL"}
                            </span>
                          </td>

                          <td className="p-3 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => handleToggleBookingApproval(b.id, b.status)}
                              className={cn(
                                "px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer shadow-md inline-flex items-center gap-1",
                                b.status === "approved"
                                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500 hover:text-black border border-amber-500/20"
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30"
                              )}
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              {b.status === "approved" ? "Mark Pending" : "✓ Approve Payment"}
                            </button>

                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                              title="Delete booking"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMER CARE WINNER NOTIFICATION MODAL */}
      {careModalOpen && selectedFanForCare && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-[2.5rem] max-w-xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative text-left overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setCareModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-2 border-b border-white/10 pb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                <Award className="w-3.5 h-3.5" />
                CUSTOMER CARE REPRESENTATIVE PORTAL
              </span>
              <h3 className="text-2xl font-black italic uppercase text-white">
                NOTIFY WINNER & DISPATCH PRIZE
              </h3>
              <p className="text-xs text-zinc-400 font-medium">
                Dispatch an official Customer Care winner announcement to this fan's Virtual Fan Card & Giveaway record.
              </p>
            </div>

            {/* Target Fan Summary Box */}
            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                <img
                  src={registeredFans.find(f => f.fanCode === selectedFanForCare.fanCode)?.profilePhotoUrl || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=400"}
                  alt={selectedFanForCare.fullName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-0.5">
                <span className="text-[9px] font-mono font-black text-cyan-400">
                  FAN CODE: {selectedFanForCare.fanCode}
                </span>
                <h4 className="text-sm font-black text-white">{selectedFanForCare.fullName}</h4>
                <p className="text-xs text-zinc-400">{selectedFanForCare.email} • {selectedFanForCare.city}</p>
              </div>
            </div>

            <form onSubmit={handleDispatchCareNotification} className="space-y-4">
              {/* Campaign / Event selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Giveaway / Event Campaign</label>
                <select
                  value={careGiveawayId}
                  onChange={(e) => setCareGiveawayId(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold uppercase focus:outline-none"
                >
                  <option value="">General Fan Card Registration Award</option>
                  {giveaways.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
              </div>

              {/* Prize Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Prize Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Official Autographed Player Jersey + 2,000 Gridiron Credits"
                  value={carePrizeName}
                  onChange={(e) => setCarePrizeName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold focus:outline-none"
                />
              </div>

              {/* Claim Code */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Official Claim Code *</label>
                  <input
                    type="text"
                    required
                    value={careClaimCode}
                    onChange={(e) => setCareClaimCode(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-mono font-black uppercase focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-400">Customer Care Rep Name/ID</label>
                  <input
                    type="text"
                    required
                    value={careRepName}
                    onChange={(e) => setCareRepName(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-zinc-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Winner Message */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400">Personal Care Winner Announcement Message</label>
                <textarea
                  rows={3}
                  required
                  value={careMessage}
                  onChange={(e) => setCareMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs text-zinc-200 font-medium leading-relaxed focus:outline-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isDispatchingCare}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black uppercase text-xs tracking-widest rounded-2xl transition-all cursor-pointer shadow-xl shadow-amber-500/20 disabled:opacity-50"
                >
                  {isDispatchingCare ? "DISPATCHING NOTIFICATION..." : "🎉 SEND WINNER NOTIFICATION TO FAN"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
