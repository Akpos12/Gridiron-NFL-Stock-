import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  Users, 
  Award, 
  Compass, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Sparkles,
  Save,
  Image as ImageIcon,
  Tag,
  Clock,
  MapPin,
  TrendingUp,
  Ticket
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { NFL_TEAMS } from "../constants";
import { formatCurrency, cn } from "../lib/utils";
import { Experience, Booking } from "./ExperiencesSection";
import { PromoBanner } from "./PromoSlider";
import { NFLImage } from "../utils/nflImages";

export const ExperienceAdmin: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  
  // Tab states
  const [adminTab, setAdminTab] = useState<"experiences" | "bookings" | "banners" | "analytics">("experiences");

  // Experience addition states
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form fields for Experience creation
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"stadium_tour" | "meet_greet" | "private_tour">("stadium_tour");
  const [category, setCategory] = useState("Standard Stadium Tour");
  const [price, setPrice] = useState(45);
  const [vipPrice, setVipPrice] = useState(120);
  const [premiumPrice, setPremiumPrice] = useState(250);
  const [teamId, setTeamId] = useState("ARI");
  const [location, setLocation] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [player, setPlayer] = useState("");
  const [featuresInput, setFeaturesInput] = useState("");
  const [datesInput, setDatesInput] = useState("");
  const [timeSlotsInput, setTimeSlotsInput] = useState("");

  // Banner creator forms
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerDesc, setBannerDesc] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerBadge, setBannerBadge] = useState("");
  const [bannerLink, setBannerLink] = useState("");

  useEffect(() => {
    // 1. Listen to experiences
    const unsubExp = onSnapshot(collection(db, "experiences"), (snap) => {
      const docs: Experience[] = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() } as Experience);
      });
      setExperiences(docs);
    });

    // 2. Listen to experience bookings
    const unsubBookings = onSnapshot(collection(db, "bookings"), (snap) => {
      const docs: Booking[] = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() } as Booking);
      });
      setBookings(docs);
    });

    // 3. Listen to promo banners
    const unsubBanners = onSnapshot(collection(db, "promo_banners"), (snap) => {
      const docs: PromoBanner[] = [];
      snap.forEach(d => {
        docs.push({ id: d.id, ...d.data() } as PromoBanner);
      });
      setBanners(docs);
    });

    return () => { unsubExp(); unsubBookings(); unsubBanners(); };
  }, []);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setType("stadium_tour");
    setCategory("Standard Stadium Tour");
    setPrice(45);
    setVipPrice(120);
    setPremiumPrice(250);
    setTeamId("ARI");
    setLocation("");
    setImageUrl("");
    setPlayer("");
    setFeaturesInput("Access to stadium museum, Field tour");
    setDatesInput("2026-06-15, 2026-06-16");
    setTimeSlotsInput("10:00 AM, 1:30 PM");
    setIsEditing(false);
    setEditingId(null);
  };

  const startEdit = (exp: Experience) => {
    setTitle(exp.title);
    setDescription(exp.description);
    setType(exp.type);
    setCategory(exp.category);
    setPrice(exp.price);
    setVipPrice(exp.vipPrice || exp.price * 2);
    setPremiumPrice(exp.premiumPrice || exp.price * 4);
    setTeamId(exp.teamId);
    setLocation(exp.location);
    setImageUrl(exp.imageUrl);
    setPlayer(exp.player || "");
    setFeaturesInput(exp.features.join(", "));
    setDatesInput(exp.dates.join(", "));
    setTimeSlotsInput(exp.timeSlots.join(", "));
    setIsEditing(true);
    setEditingId(exp.id);
  };

  const handleCreateOrUpdateExperience = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const expId = editingId || `exp-${Date.now()}`;
      const payload: any = {
        title,
        description,
        type,
        category,
        price: Number(price),
        vipPrice: Number(vipPrice),
        premiumPrice: Number(premiumPrice),
        teamId,
        location,
        imageUrl: imageUrl || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
        dates: datesInput.split(",").map(s => s.trim()).filter(Boolean),
        timeSlots: timeSlotsInput.split(",").map(s => s.trim()).filter(Boolean),
        features: featuresInput.split(",").map(s => s.trim()).filter(Boolean),
        rating: 4.8,
        reviewsCount: 12,
        v: Date.now(),
        updatedAt: Date.now()
      };

      if (player && player.trim()) {
        payload.player = player.trim();
      }

      await setDoc(doc(db, "experiences", expId), payload);
      alert(editingId ? "Experience modified successfully." : "New Experience added to roster!");
      resetForm();
    } catch (err: any) {
      console.error(err);
      alert("Database transmission failed: " + err.message);
    }
  };

  const handleDeleteExperience = async (expId: string) => {
    if (!window.confirm("Permanently remove this Experience? This will de-authorize new purchases.")) return;
    try {
      await deleteDoc(doc(db, "experiences", expId));
      alert("Experience removed.");
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleToggleBookingApproval = async (bId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "pending" ? "approved" : "pending";
      await updateDoc(doc(db, "bookings", bId), { status: nextStatus });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleCreatePromoBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bId = `ban-${Date.now()}`;
      const payload: Omit<PromoBanner, "id"> = {
        title: bannerTitle,
        subtitle: bannerSubtitle,
        description: bannerDesc,
        imageUrl: bannerImage || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
        badge: bannerBadge || "PROMOTION",
        linkText: bannerLink || "BOOK NOW",
        accentColor: "from-blue-600 to-indigo-600 animate-pulse",
        v: Date.now(),
        updatedAt: Date.now()
      };
      await setDoc(doc(db, "promo_banners", bId), payload);
      alert("Promotional campaign added to slider.");
      setBannerTitle("");
      setBannerSubtitle("");
      setBannerDesc("");
      setBannerImage("");
      setBannerBadge("");
      setBannerLink("");
    } catch(err: any) {
      console.error(err);
      alert("Failed to write advertisement: " + err.message);
    }
  };

  const handleDeletePromoBanner = async (bId: string) => {
    try {
      await deleteDoc(doc(db, "promo_banners", bId));
    } catch (err) {
      console.error(err);
    }
  };

  // Metrics computation
  const totalBookingsValue = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);
  const ticketCount = bookings.reduce((acc, b) => acc + (b.guestsCount || 0), 0);
  const meetGreetBookingsCount = bookings.filter(b => b.experienceType === "meet_greet").length;
  const stadiumTourBookingsCount = bookings.filter(b => b.experienceType === "stadium_tour").length;

  return (
    <div className="space-y-8 text-left p-6 bg-zinc-950/20 max-w-7xl mx-auto rounded-[2.5rem]">
      {/* Admin Experience Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-black uppercase tracking-widest text-amber-500 bg-amber-500/10 rounded-full mb-3 border border-amber-500/10">
            <Shield className="w-3.5 h-3.5" />
            Core Staff Oversight
          </span>
          <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter text-white">
            Experience Manager
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-1">
            Bespoke bookings dashboard, live promotional campaign tools and revenue telemetry auditing.
          </p>
        </div>

        {/* Tab triggers */}
        <div className="flex bg-zinc-900/40 border border-white/5 p-1 rounded-2xl">
          {([
            { id: "experiences", label: "Experiences" },
            { id: "bookings", label: "Audits" },
            { id: "banners", label: "Promo Sliders" },
            { id: "analytics", label: "Analytics" }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setAdminTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                adminTab === tab.id 
                  ? "bg-blue-600 text-white shadow-lg" 
                  : "text-zinc-500 hover:text-white"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER ANALYTICS TAB */}
      {adminTab === "analytics" && (
        <div className="space-y-8">
          {/* Card stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">AGGREGATE REVENUE</p>
              <h4 className="text-3xl font-mono font-black text-white">{formatCurrency(totalBookingsValue)}</h4>
              <p className="text-[9px] text-green-400 font-bold mt-2 font-mono">↑ 100% SECURE TRANSACTIONS</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">TICKETS DISPATCHED</p>
              <h4 className="text-3xl font-mono font-black text-white">{ticketCount}</h4>
              <p className="text-[9px] text-zinc-500 font-bold mt-2">Active VIP and Locker access passes</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">MEET & GREETS SOLD</p>
              <h4 className="text-3xl font-mono font-black text-white">{meetGreetBookingsCount}</h4>
              <p className="text-[9px] text-zinc-500 font-bold mt-2">Player Encounter bookings</p>
            </div>
            <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">STADIUM RUNS SOLD</p>
              <h4 className="text-3xl font-mono font-black text-white">{stadiumTourBookingsCount}</h4>
              <p className="text-[9px] text-zinc-500 font-bold mt-2">Standard & Corporate groups</p>
            </div>
          </div>

          {/* Breakdown Graphic List */}
          <div className="bg-zinc-900/40 border border-white/5 p-8 rounded-[2rem] space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-white">SALES REVENUE DISTRIBUTION BY NFL FRANCHISE</h4>
              <Ticket className="w-4 h-4 text-blue-500" />
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              {NFL_TEAMS.map(team => {
                const teamBookings = bookings.filter(b => {
                  const matchingExp = experiences.find(e => e.id === b.experienceId);
                  return matchingExp?.teamId === team.id;
                });
                const salesValue = teamBookings.reduce((sum, b) => sum + b.totalPrice, 0);
                if (salesValue === 0) return null;
                const percent = Math.min(100, Math.max(5, (salesValue / (totalBookingsValue || 1)) * 100));

                return (
                  <div key={team.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold uppercase">
                      <span className="text-white">{team.city} {team.name} ({team.id})</span>
                      <span className="text-blue-400 font-mono font-black">{formatCurrency(salesValue)}</span>
                    </div>
                    {/* Visual Bar */}
                    <div className="h-2 bg-zinc-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}

      {/* RENDER EXPERIENCES LIST & EDITOR */}
      {adminTab === "experiences" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Creator/Editor Form */}
          <div className="lg:col-span-5 bg-zinc-900/40 p-8 rounded-[2rem] border border-white/5 h-fit">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-500" />
                {isEditing ? `Edit Experience Parameters` : `Create Experience File`}
              </h4>
              <button 
                type="button" 
                onClick={resetForm}
                className="text-[9px] font-black uppercase text-zinc-500 hover:text-white"
              >
                Clear Form
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateExperience} className="space-y-5">
              {/* Type Category selection */}
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "stadium_tour", label: "Tour" },
                  { id: "meet_greet", label: "Encounter" },
                  { id: "private_tour", label: "Private" }
                ] as const).map(pType => (
                  <button
                    key={pType.id}
                    type="button"
                    onClick={() => setType(pType.id)}
                    className={cn(
                      "py-2 px-1 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all",
                      type === pType.id 
                        ? "bg-blue-600/10 border-blue-500 text-blue-400" 
                        : "bg-zinc-900/50 border-white/5 text-zinc-500"
                    )}
                  >
                    {pType.label}
                  </button>
                ))}
              </div>

              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Service Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lambeau Field Frozen Tundra Run"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Description Overview</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Full scope of what makes this VIP encounter breathtaking..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-600 h-16 font-semibold"
                />
              </div>

              {/* Double Column Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Franchise (TeamID)</label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-3 py-2 text-xs uppercase font-bold text-white focus:outline-none focus:ring-1"
                  >
                    {NFL_TEAMS.map(team => (
                      <option key={team.id} value={team.id}>{team.id} ({team.name})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Sub-Category Pill</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VIP Locker Room Access"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-1 font-bold"
                  />
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-zinc-500">Standard ($)</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 text-xs font-mono text-center text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-zinc-500">VIP Upgrade ($)</label>
                  <input
                    type="number"
                    required
                    value={vipPrice}
                    onChange={(e) => setVipPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 text-xs font-mono text-center text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[8px] font-black uppercase text-zinc-500">Platinum ($)</label>
                  <input
                    type="number"
                    required
                    value={premiumPrice}
                    onChange={(e) => setPremiumPrice(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl p-2 text-xs font-mono text-center text-white"
                  />
                </div>
              </div>

              {/* Location and image url */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Location Details</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Green Bay, WI"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Experience Unsplash Photo URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              {/* Lists separated by commas */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Dates Calendar (Separated by commas)</label>
                <input
                  type="text"
                  placeholder="2026-06-15, 2026-06-16"
                  value={datesInput}
                  onChange={(e) => setDatesInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Time Slots (Separated by commas)</label>
                  <input
                    type="text"
                    placeholder="10:00 AM, 1:30 PM"
                    value={timeSlotsInput}
                    onChange={(e) => setTimeSlotsInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Legends Star Player name</label>
                  <input
                    type="text"
                    placeholder="Justin Jefferson"
                    value={player}
                    onChange={(e) => setPlayer(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Bullet Features (Separated by commas)</label>
                <input
                  type="text"
                  placeholder="Official museum, Locker access, Commemorative lanyard"
                  value={featuresInput}
                  onChange={(e) => setFeaturesInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold"
                />
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 transform active:scale-95 duration-100 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                {isEditing ? `UPDATE EXPERIENCE RECORD` : `COMMIT NEW EXPERIENCE`}
              </button>
            </form>
          </div>

          {/* Roster list */}
          <div className="lg:col-span-7 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">OFFICIAL STADIUM & LEGENDS ROSTER ({experiences.length})</h4>
            <div className="space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar">
              {experiences.map(exp => (
                <div key={exp.id} className="p-4 bg-zinc-950/60 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-white/5">
                      <NFLImage item={exp} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">{exp.title}</h4>
                      <p className="text-[9px] font-black text-zinc-500 uppercase font-mono mt-0.5">{exp.category} · {exp.teamId}</p>
                      <p className="text-[10px] font-mono font-black text-blue-400 mt-1">{formatCurrency(exp.price)} — VIP: {formatCurrency(exp.vipPrice || exp.price*2)}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => startEdit(exp)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 hover:text-white text-zinc-400 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Edit className="w-4 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteExperience(exp.id)}
                      className="w-8 h-8 rounded-lg bg-zinc-900/10 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 text-rose-500 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER BOOKINGS AUDIT TAB */}
      {adminTab === "bookings" && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">GLOBAL ORDER BOOK RESERVATIONS AUDIT CHANNEL</h4>
            <span className="text-[9px] font-bold text-zinc-500 uppercase">TELEMETRY SYNCED</span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-zinc-950/40 border-b border-white/5">
                <tr>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Reserve ID</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Attendee</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Pass Specifics</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-right">Invoice Sum</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-center">Audit Status</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-center">Authorize Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">No experience transaction receipts located in audit blocks.</td>
                  </tr>
                ) : (
                  bookings.map(b => (
                    <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                      <td className="p-4 sm:p-6 font-mono text-[9px] font-black text-zinc-400 select-all shrink-0">
                        {b.id}
                      </td>
                      <td className="p-4 sm:p-6">
                        <p className="text-xs font-black text-white">{b.userEmail}</p>
                        <p className="text-[10px] font-mono text-zinc-600 uppercase mt-0.5">{b.userId.slice(0, 8)}...</p>
                      </td>
                      <td className="p-4 sm:p-6">
                        <h4 className="text-xs font-black text-white uppercase">{b.experienceTitle}</h4>
                        <p className="text-[9px] font-black text-zinc-500 uppercase mt-0.5 font-mono">{b.tier.toUpperCase()} · {b.date} · {b.timeSlot} · {b.guestsCount} GUEST(S)</p>
                      </td>
                      <td className="p-4 sm:p-6 text-right font-mono text-xs font-black text-blue-400">
                        {formatCurrency(b.totalPrice)}
                      </td>
                      <td className="p-4 sm:p-6 text-center">
                        <span className={cn(
                          "inline-flex px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          b.status === "approved" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="p-4 sm:p-6 text-center">
                        <button
                          onClick={() => handleToggleBookingApproval(b.id, b.status)}
                          className={cn(
                            "px-4 py-2 hover:scale-[1.03] transition-transform rounded-xl text-[8px] font-black uppercase tracking-widest",
                            b.status === "approved" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-emerald-600 text-white"
                          )}
                        >
                          {b.status === "approved" ? "Revoke Approval" : "Approve Pass"}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RENDER PROMO BANNERS TAB */}
      {adminTab === "banners" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Create Banner Form */}
          <div className="md:col-span-5 bg-zinc-900/40 p-8 rounded-[2rem] border border-white/5 h-fit">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-4 mb-6">PUBLISH AD PROMO CAMPAIGN</h4>
            <form onSubmit={handleCreatePromoBanner} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Banner Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LOMBARDI TROPHY PRIVATE SUPPER"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Subtitle / Tagline</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. ON-FIELD DINING EXPERIENCES"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Ad copy narration description</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Dine inside the legendary gridiron zone with executive franchise legends on matchday night..."
                  value={bannerDesc}
                  onChange={(e) => setBannerDesc(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-zinc-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Badge Label Text</label>
                  <input
                    type="text"
                    placeholder="CHAMPION VIP"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">CTA Button Label</label>
                  <input
                    type="text"
                    placeholder="RESERVE PRIVATE TAB"
                    value={bannerLink}
                    onChange={(e) => setBannerLink(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Widescreen Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-100" />
                DOCK ACTIVE SLIDER ADVERT
              </button>
            </form>
          </div>

          {/* Active Banners Roster */}
          <div className="md:col-span-7 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white border-b border-white/5 pb-4">ACTIVE ADVERTISING SLIDERS ({banners.length})</h4>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
              {banners.length === 0 ? (
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs py-10 text-center">No customized campaigns active. Sliding defaults on home screen.</p>
              ) : (
                banners.map(b => (
                  <div key={b.id} className="p-4 bg-zinc-950 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5">
                        <NFLImage item={b} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase text-white tracking-tight line-clamp-1">{b.title}</h5>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase font-mono mt-0.5">{b.badge} · {b.subtitle}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePromoBanner(b.id)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 hover:text-red-400 text-zinc-600 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
