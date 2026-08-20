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
  Ticket,
  Eye,
  Camera,
  FileCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db } from "../lib/firebase";
import { NFL_TEAMS } from "../constants";
import { formatCurrency, cn } from "../lib/utils";
import { Experience, Booking } from "./ExperiencesSection";
import { PromoBanner } from "./PromoSlider";
import { NFLImage } from "../utils/nflImages";
import { ReceiptReviewModal, BookingAuditItem } from "./common/ReceiptReviewModal";

export const ExperienceAdmin: React.FC = () => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [banners, setBanners] = useState<PromoBanner[]>([]);
  
  // Tab states
  const [adminTab, setAdminTab] = useState<"experiences" | "bookings" | "banners" | "analytics">("experiences");

  // Booking Receipt Review modal state
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<BookingAuditItem | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState<"all" | "pending" | "approved">("all");
  const [bookingSearch, setBookingSearch] = useState("");

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

  const handleQuickAdjustPrice = async (expId: string, tier: "price" | "vipPrice" | "premiumPrice", delta: number) => {
    try {
      const targetExp = experiences.find(e => e.id === expId);
      if (!targetExp) return;
      const currentVal = Number(targetExp[tier] ?? (tier === "vipPrice" ? targetExp.price * 2 : tier === "premiumPrice" ? targetExp.price * 4 : targetExp.price));
      const nextVal = Math.max(5, currentVal + delta);
      await updateDoc(doc(db, "experiences", expId), {
        [tier]: nextVal,
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to update price: " + err.message);
    }
  };

  const handleSetCustomPrice = async (expId: string, tier: "price" | "vipPrice" | "premiumPrice", val: number) => {
    if (isNaN(val) || val < 0) return;
    try {
      await updateDoc(doc(db, "experiences", expId), {
        [tier]: Math.max(0, val),
        updatedAt: Date.now()
      });
    } catch (err: any) {
      console.error(err);
      alert("Failed to update price: " + err.message);
    }
  };

  const handleSeedDefaultExperiences = async () => {
    try {
      const defaults = [
        {
          id: "exp-sea-training",
          title: "Seattle Seahawks Official Training Session Access",
          description: "Experience an exclusive behind-the-scenes look at the Seattle Seahawks practice and training facility at VMAC. Watch NFL drills, coaching walk-throughs, and player scrimmages up close.",
          type: "private_tour",
          category: "Training Session Ticket",
          price: 250,
          vipPrice: 450,
          premiumPrice: 750,
          teamId: "SEA",
          imageUrl: "https://i.postimg.cc/gJd9nqzg/341007003061882166.jpg",
          location: "Virginia Mason Athletic Center (VMAC), Renton, WA",
          dates: [
            "2026-08-18",
            "2026-08-19",
            "2026-08-20",
            "2026-08-22",
            "2026-08-25",
            "2026-08-29",
            "2026-09-02",
            "2026-09-05",
            "2026-09-09",
            "2026-09-16",
            "2026-09-18",
            "2026-09-23"
          ],
          timeSlots: ["09:30 AM", "01:30 PM", "05:00 PM"],
          features: ["Fieldside spectator seating", "Guest pass & lanyard", "Player autographs", "Complimentary hospitality"],
          rating: 5.0,
          reviewsCount: 88
        },
        {
          id: "exp-jefferson-meet",
          title: "Justin Jefferson VIP Private Meet & Greet",
          description: "Exclusive encounter with Minnesota Vikings superstar receiver Justin Jefferson.",
          type: "meet_greet",
          category: "Star Player Encounter",
          price: 350,
          vipPrice: 650,
          premiumPrice: 1200,
          teamId: "MIN",
          imageUrl: "https://i.postimg.cc/jdm6RKH4/1ef0abb32f5e7cb84b338bbb020c200cjetas.jpg",
          location: "Minneapolis, MN",
          dates: ["2026-08-24", "2026-08-31", "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28"],
          timeSlots: ["01:00 PM", "04:30 PM"],
          features: ["Personal photo op", "Autographed authentic jersey", "Q&A session"],
          rating: 5.0,
          reviewsCount: 145
        },
        {
          id: "exp-mahomes-meet",
          title: "Patrick Mahomes Championship Lounge Encounter",
          description: "Spend 45 minutes in the Arrowhead Champions suite with 3x Super Bowl MVP Patrick Mahomes.",
          type: "meet_greet",
          category: "Star Player Encounter",
          price: 500,
          vipPrice: 950,
          premiumPrice: 1800,
          teamId: "KC",
          imageUrl: "https://i.postimg.cc/HLfFMf1n/f2318507a5fadb58268812cf8e9a3510.jpg",
          location: "GEHA Field at Arrowhead Stadium, Kansas City, MO",
          dates: ["2026-08-28", "2026-09-04", "2026-09-11", "2026-09-18", "2026-09-25"],
          timeSlots: ["02:00 PM", "05:00 PM"],
          features: ["Exclusive photo", "Signed Wilson Duke football", "Lounge catering"],
          rating: 5.0,
          reviewsCount: 210
        },
        {
          id: "exp-dal-tour",
          title: "AT&T Stadium Ultimate Access Tour",
          description: "Go behind the scenes at the home of the Dallas Cowboys. Explore the locker rooms and walk onto the 50-yard line.",
          type: "stadium_tour",
          category: "VIP Stadium Tour",
          price: 45,
          vipPrice: 120,
          premiumPrice: 250,
          teamId: "DAL",
          imageUrl: "https://i.postimg.cc/90c8t280/a8367675b2fbcfe31970b081bfce176f.jpg",
          location: "Arlington, TX",
          dates: ["2026-08-22", "2026-08-25", "2026-08-29", "2026-09-05", "2026-09-12", "2026-09-19", "2026-09-26"],
          timeSlots: ["10:00 AM", "12:30 PM", "3:00 PM", "5:30 PM"],
          features: ["Cowboys locker room", "50-Yard Star photo", "Executive narration"],
          rating: 4.9,
          reviewsCount: 420
        },
        {
          id: "exp-min-tour",
          title: "U.S. Bank Stadium Architectural Journey",
          description: "Immerse yourself inside Minneapolis' legendary glass cathedral.",
          type: "stadium_tour",
          category: "Standard Stadium Tour",
          price: 35,
          vipPrice: 90,
          premiumPrice: 180,
          teamId: "MIN",
          imageUrl: "https://i.postimg.cc/sDYSCSgk/4545d9b7b90ee7c1f34fbb83344efb2cbank.jpg",
          location: "Minneapolis, MN",
          dates: ["2026-08-23", "2026-08-27", "2026-09-03", "2026-09-10", "2026-09-17", "2026-09-24"],
          timeSlots: ["11:00 AM", "01:30 PM", "04:00 PM"],
          features: ["Viking ship landmarks", "Locker room suites", "Interactive turf run"],
          rating: 4.8,
          reviewsCount: 180
        },
        {
          id: "exp-sb-premium",
          title: "Super Bowl LXI Field Access & Executive Hospitality",
          description: "The pinnacle experience of professional sports. Pre-game field passes and all-inclusive club access.",
          type: "private_tour",
          category: "Championship Package",
          price: 2500,
          vipPrice: 4800,
          premiumPrice: 8500,
          teamId: "LA",
          imageUrl: "https://i.postimg.cc/tC3PGPgT/1c6b339a1ec6b4da401e9584074a5073lxi.jpg",
          location: "SoFi Stadium, Inglewood, CA",
          dates: ["2026-08-25", "2026-09-01", "2026-09-08", "2026-09-15", "2026-09-22"],
          timeSlots: ["12:00 PM", "04:00 PM"],
          features: ["Pre-game field pass", "Executive club buffet", "Celebrity concierge"],
          rating: 5.0,
          reviewsCount: 16
        },
        {
          id: "exp-gb-facility",
          title: "Titans of Lambeau Training Facility Tour",
          description: "Trace the frozen tundra facility locker labs, Packers equipment bays, and Don Hutson Center.",
          type: "private_tour",
          category: "Team Training Facility Tour",
          price: 150,
          vipPrice: 350,
          premiumPrice: 750,
          teamId: "GB",
          imageUrl: "https://i.postimg.cc/mg9YDqVW/33923b662167a088aa30d29b4d062f9ate.jpg",
          location: "Lambeau Field complexes, Green Bay, WI",
          dates: ["2026-08-26", "2026-08-30", "2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27"],
          timeSlots: ["11:00 AM", "02:30 PM"],
          features: ["Training labs & equipment", "Hall of Fame galleries", "Dining Lounge lunch"],
          rating: 4.9,
          reviewsCount: 95
        }
      ];

      for (const item of defaults) {
        await setDoc(doc(db, "experiences", item.id), item, { merge: true });
      }
      alert("✅ All standard NFL experiences & training ticket records successfully seeded to database!");
    } catch (err: any) {
      console.error(err);
      alert("Error seeding experiences: " + err.message);
    }
  };

  const handleToggleBookingApproval = async (bId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === "pending" ? "approved" : "pending";
      await updateDoc(doc(db, "bookings", bId), { 
        status: nextStatus,
        reviewedAt: new Date().toISOString(),
        reviewedBy: "Management (Matthew Golom)"
      });
      // Also update ticket_orders if matching
      try {
        await updateDoc(doc(db, "ticket_orders", bId), {
          status: nextStatus === "approved" ? "confirmed" : "pending",
          isApproved: nextStatus === "approved"
        });
      } catch (e) {
        // non-fatal
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleOpenReceiptReview = (b: Booking) => {
    setSelectedBookingForReview({
      id: b.id,
      userEmail: b.userEmail,
      userId: b.userId,
      experienceTitle: b.experienceTitle,
      date: b.date,
      timeSlot: b.timeSlot,
      tier: b.tier,
      guestsCount: b.guestsCount,
      totalPrice: b.totalPrice,
      status: b.status,
      receiptImage: b.receiptImage || (b as any).receiptImageUrl,
      paymentMethod: b.paymentMethod,
      paymentRef: b.paymentRef,
      senderName: b.senderName,
      buyerPhone: b.buyerPhone,
      createdAt: b.createdAt
    });
    setReviewModalOpen(true);
  };

  const handleApproveBookingFromModal = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "approved",
        approvedAt: new Date().toISOString(),
        approvedBy: "Matthew Golom (Box Office Management)"
      });
      try {
        await updateDoc(doc(db, "ticket_orders", bookingId), {
          status: "confirmed",
          isApproved: true,
          approvedAt: new Date().toISOString()
        });
      } catch (e) {}
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
    } catch (err: any) {
      console.error(err);
      alert("Error approving pass: " + err.message);
    }
  };

  const handleRejectBookingFromModal = async (bookingId: string, reason: string) => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), {
        status: "pending",
        rejectionReason: reason,
        reviewNotes: "Receipt rejected by management: " + reason,
        reviewedAt: new Date().toISOString()
      });
      setReviewModalOpen(false);
      setSelectedBookingForReview(null);
    } catch (err: any) {
      console.error(err);
      alert("Error updating review: " + err.message);
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

              {/* Pricing breakdown with Stepper Controls */}
              <div className="space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Pricing Matrix Tier Parameters</span>
                  <span className="text-[8px] font-mono text-zinc-500">Auto-calculated</span>
                </div>

                {/* Standard Price Input & Steppers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                    <span>Standard Ticket Price</span>
                    <span className="font-mono text-blue-400">{formatCurrency(price)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrice(Math.max(5, price - 25))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$25
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice(Math.max(5, price - 10))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$10
                    </button>
                    <input
                      type="number"
                      required
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-center text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setPrice(price + 10)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$10
                    </button>
                    <button
                      type="button"
                      onClick={() => setPrice(price + 25)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$25
                    </button>
                  </div>
                </div>

                {/* VIP Price Input & Steppers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                    <span>VIP Upgrade Price</span>
                    <span className="font-mono text-amber-400">{formatCurrency(vipPrice)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setVipPrice(Math.max(5, vipPrice - 50))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$50
                    </button>
                    <button
                      type="button"
                      onClick={() => setVipPrice(Math.max(5, vipPrice - 25))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$25
                    </button>
                    <input
                      type="number"
                      required
                      value={vipPrice}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-center text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setVipPrice(vipPrice + 25)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$25
                    </button>
                    <button
                      type="button"
                      onClick={() => setVipPrice(vipPrice + 50)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$50
                    </button>
                  </div>
                </div>

                {/* Platinum Price Input & Steppers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                    <span>Platinum / Executive Price</span>
                    <span className="font-mono text-purple-400">{formatCurrency(premiumPrice)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPremiumPrice(Math.max(5, premiumPrice - 100))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$100
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumPrice(Math.max(5, premiumPrice - 50))}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      -$50
                    </button>
                    <input
                      type="number"
                      required
                      value={premiumPrice}
                      onChange={(e) => setPremiumPrice(Number(e.target.value))}
                      className="flex-1 bg-zinc-900 border border-white/10 rounded-lg p-2 text-xs font-mono text-center text-white font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => setPremiumPrice(premiumPrice + 50)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-purple-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$50
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumPrice(premiumPrice + 100)}
                      className="px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-purple-400 rounded-lg text-[9px] font-mono font-bold cursor-pointer"
                    >
                      +$100
                    </button>
                  </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-white">OFFICIAL STADIUM & LEGENDS ROSTER ({experiences.length})</h4>
                <p className="text-[9px] text-zinc-400 font-bold">Use 1-click price steppers to adjust live pricing instantly</p>
              </div>
              <button
                type="button"
                onClick={handleSeedDefaultExperiences}
                className="px-3.5 py-1.5 bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Seed / Reset Official Experiences
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto max-h-[70vh] no-scrollbar pr-1">
              {experiences.map(exp => (
                <div key={exp.id} className="p-4 bg-zinc-950/80 border border-white/5 rounded-2xl space-y-3 hover:border-white/10 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5">
                        <NFLImage item={exp} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">{exp.title}</h4>
                        <p className="text-[9px] font-black text-zinc-500 uppercase font-mono mt-0.5">{exp.category} · {exp.teamId} · {exp.location}</p>
                      </div>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => startEdit(exp)}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-white/5 hover:border-white/10 hover:text-white text-zinc-300 text-[9px] font-black uppercase flex items-center gap-1 transition-all cursor-pointer"
                        title="Edit Full Parameters"
                      >
                        <Edit className="w-3 h-3" />
                        <span className="hidden sm:inline">Edit Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExperience(exp.id)}
                        className="p-1.5 rounded-lg bg-zinc-900/10 border border-red-500/10 hover:bg-red-500/10 hover:text-red-400 text-rose-500 flex items-center justify-center transition-all cursor-pointer"
                        title="Delete Experience"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Price Adjustment Steppers Tray */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-white/5">
                    {/* Standard Price Stepper */}
                    <div className="p-2 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                        <span>Standard Price</span>
                        <span className="font-mono text-blue-400 font-bold">{formatCurrency(exp.price)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "price", -25)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $25"
                        >
                          -$25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "price", -10)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $10"
                        >
                          -$10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "price", 10)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $10"
                        >
                          +$10
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "price", 25)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $25"
                        >
                          +$25
                        </button>
                      </div>
                    </div>

                    {/* VIP Price Stepper */}
                    <div className="p-2 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                        <span>VIP Price</span>
                        <span className="font-mono text-amber-400 font-bold">{formatCurrency(exp.vipPrice || exp.price * 2)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "vipPrice", -50)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $50"
                        >
                          -$50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "vipPrice", -25)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $25"
                        >
                          -$25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "vipPrice", 25)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-amber-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $25"
                        >
                          +$25
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "vipPrice", 50)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-amber-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $50"
                        >
                          +$50
                        </button>
                      </div>
                    </div>

                    {/* Platinum Price Stepper */}
                    <div className="p-2 bg-zinc-900/60 rounded-xl border border-white/5 space-y-1">
                      <div className="flex items-center justify-between text-[8px] font-black uppercase text-zinc-400">
                        <span>Platinum Price</span>
                        <span className="font-mono text-purple-400 font-bold">{formatCurrency(exp.premiumPrice || exp.price * 4)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "premiumPrice", -100)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $100"
                        >
                          -$100
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "premiumPrice", -50)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Reduce by $50"
                        >
                          -$50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "premiumPrice", 50)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-purple-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $50"
                        >
                          +$50
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAdjustPrice(exp.id, "premiumPrice", 100)}
                          className="flex-1 py-1 bg-zinc-950 hover:bg-zinc-800 text-purple-400 rounded text-[8px] font-mono font-black border border-white/5 cursor-pointer"
                          title="Increase by $100"
                        >
                          +$100
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RENDER BOOKINGS AUDIT TAB */}
      {adminTab === "bookings" && (
        <div className="bg-zinc-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden space-y-4">
          <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                GLOBAL ORDER BOOK & PAYMENT RECEIPT AUDIT
              </h4>
              <p className="text-[10px] text-zinc-400 font-medium mt-1">
                Review payment screenshots & bank receipts dropped by attendees. Approve to issue digital passes.
              </p>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex bg-zinc-950 p-1 rounded-xl border border-white/5">
                {(["all", "pending", "approved"] as const).map(tab => {
                  const count = tab === "all" ? bookings.length : bookings.filter(b => b.status === tab).length;
                  return (
                    <button
                      key={tab}
                      onClick={() => setBookingFilter(tab)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                        bookingFilter === tab 
                          ? tab === "pending" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-blue-600 text-white" 
                          : "text-zinc-400 hover:text-white"
                      )}
                    >
                      {tab === "all" ? "All" : tab === "pending" ? "Pending Review" : "Approved"} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search buyer, ID..."
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  className="bg-zinc-950 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 w-40 sm:w-52"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[850px]">
              <thead className="bg-zinc-950/40 border-b border-white/5">
                <tr>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Reserve ID</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Attendee & Contact</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Pass Specifics</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest">Payment Proof</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-right">Invoice Sum</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-center">Audit Status</th>
                  <th className="p-4 sm:p-6 text-[9px] font-black uppercase font-mono text-zinc-500 tracking-widest text-center">Manager Review</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filtered = bookings.filter(b => {
                    const matchesFilter = bookingFilter === "all" || b.status === bookingFilter;
                    const searchLower = bookingSearch.toLowerCase();
                    const matchesSearch = !bookingSearch || 
                      b.id.toLowerCase().includes(searchLower) ||
                      b.userEmail.toLowerCase().includes(searchLower) ||
                      (b.senderName && b.senderName.toLowerCase().includes(searchLower)) ||
                      b.experienceTitle.toLowerCase().includes(searchLower);
                    return matchesFilter && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <tr>
                        <td colSpan={7} className="p-12 text-center text-zinc-600 font-bold uppercase tracking-widest text-xs">
                          No reservation receipts found matching the filter criteria.
                        </td>
                      </tr>
                    );
                  }

                  return filtered.map(b => {
                    const hasReceipt = Boolean(b.receiptImage || (b as any).receiptImageUrl);
                    const receiptUrl = b.receiptImage || (b as any).receiptImageUrl;

                    return (
                      <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                        <td className="p-4 sm:p-6 font-mono text-[9px] font-black text-zinc-400 select-all shrink-0">
                          {b.id}
                        </td>
                        <td className="p-4 sm:p-6">
                          <p className="text-xs font-black text-white">{b.senderName || b.userEmail}</p>
                          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{b.userEmail}</p>
                          {b.buyerPhone && (
                            <p className="text-[9px] font-mono text-zinc-500">{b.buyerPhone}</p>
                          )}
                        </td>
                        <td className="p-4 sm:p-6">
                          <h4 className="text-xs font-black text-white uppercase">{b.experienceTitle}</h4>
                          <p className="text-[9px] font-black text-zinc-500 uppercase mt-0.5 font-mono">
                            {b.tier.toUpperCase()} · {b.date} · {b.timeSlot} · {b.guestsCount} GUEST(S)
                          </p>
                        </td>
                        <td className="p-4 sm:p-6">
                          {hasReceipt ? (
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptReview(b)}
                              className="group flex items-center gap-2 p-1.5 bg-zinc-950 hover:bg-zinc-800 border border-emerald-500/30 rounded-xl transition-all cursor-pointer text-left"
                            >
                              <img
                                src={receiptUrl}
                                alt="Receipt"
                                className="w-9 h-9 object-cover rounded-lg border border-white/10 group-hover:scale-105 transition-transform"
                              />
                              <div className="text-[9px]">
                                <span className="font-black uppercase text-emerald-400 flex items-center gap-1">
                                  <Eye className="w-3 h-3" /> View Proof
                                </span>
                                <span className="font-mono text-zinc-500 block">Screenshot Attached</span>
                              </div>
                            </button>
                          ) : (
                            <div className="text-[9px] text-zinc-500 uppercase font-mono flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-zinc-700 inline-block" />
                              Ref: {b.paymentRef ? (b.paymentRef.length > 14 ? b.paymentRef.slice(0, 14) + '...' : b.paymentRef) : "Direct"}
                            </div>
                          )}
                        </td>
                        <td className="p-4 sm:p-6 text-right font-mono text-xs font-black text-blue-400">
                          {formatCurrency(b.totalPrice)}
                        </td>
                        <td className="p-4 sm:p-6 text-center">
                          <span className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest",
                            b.status === "approved" 
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" 
                              : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                          )}>
                            {b.status === "approved" ? "Approved / Pass Issued" : "Pending Review"}
                          </span>
                        </td>
                        <td className="p-4 sm:p-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenReceiptReview(b)}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Eye className="w-3 h-3 text-blue-400" />
                              Review
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleBookingApproval(b.id, b.status)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-transform cursor-pointer",
                                b.status === "approved" 
                                  ? "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5" 
                                  : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20"
                              )}
                            >
                              {b.status === "approved" ? "Revoke" : "Confirm"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
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

      {/* RECEIPT REVIEW & MANAGEMENT APPROVAL MODAL */}
      <ReceiptReviewModal
        isOpen={reviewModalOpen}
        onClose={() => {
          setReviewModalOpen(false);
          setSelectedBookingForReview(null);
        }}
        booking={selectedBookingForReview}
        onApprove={handleApproveBookingFromModal}
        onReject={handleRejectBookingFromModal}
      />

    </div>
  );
};
