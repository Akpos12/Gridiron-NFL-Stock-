import React, { useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Headphones,
  Heart,
  Mail,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  ShoppingBag,
  Star,
  Ticket,
  Trophy,
  User,
  UserCheck,
} from "lucide-react";
import stadiumHeroImg from "../assets/images/nfl_stadium_hero_1794712782399.jpg";
import { NFLImage } from "../utils/nflImages";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { SupportTrustSection } from "./SupportTrustSection";

export interface PlayerInquiryPrefill {
  playerName?: string;
  teamId?: string;
  objective?: string;
  fullName?: string;
  email?: string;
  messagingPlatform?: "whatsapp" | "zangi" | "telegram";
  messagingDetails?: string;
  skipToPayment?: boolean;
}

const CUSTOM_INQUIRY_QUICK_STARS: Array<{ name: string; teamId: string }> = [
  { name: "CeeDee Lamb", teamId: "DAL" },
  { name: "Justin Jefferson", teamId: "MIN" },
  { name: "Patrick Mahomes", teamId: "KC" },
  { name: "Josh Allen", teamId: "BUF" },
  { name: "Lamar Jackson", teamId: "BAL" },
  { name: "Ja'Marr Chase", teamId: "CIN" },
];

const CUSTOM_INQUIRY_OBJECTIVES = [
  "1-on-1 Private Encounter & Photo Op",
  "Autograph & Certified Memorabilia",
  "VIP Game Day Sideline & Tunnel Pass",
  "Custom Video Shoutout / Cameo",
  "Live Podcast or Studio Guest Appearance",
];

interface LandingShowcaseProps {
  nflLogoUrl: string;
  shopItems: Array<{ id: string; name: string; price: number; description: string; image: string }>;
  testimonials: Array<{ name: string; text: string; rating: number }>;
  onExploreExperiences: () => void;
  onDiscoverGameDay: () => void;
  onOpenTrackInquiry: () => void;
  onSelectExperience: (targetId: string) => void;
  onOpenPlayerInquiry: (prefill?: PlayerInquiryPrefill) => void;
  onOpenCustomerCare: () => void;
  onOpenTicketCheck: () => void;
  onOpenSignIn: () => void;
}

interface FeaturedExperienceCard {
  id: string;
  expId: string;
  filterKey: "meet_greet" | "stadium_tour" | "memorabilia";
  title: string;
  playerOrSubtitle: string;
  teamId: string;
  teamName: string;
  city: string;
  imageUrl: string;
  experienceHighlights: string[];
  availabilityLabel: string;
  isConfirmedSchedule: boolean;
  priceLabel: string;
  actionLabel: string;
  actionType: "experience" | "shop" | "inquiry";
}

const FEATURED_CARDS: FeaturedExperienceCard[] = [
  {
    id: "star-jefferson",
    expId: "exp-jefferson-meet",
    filterKey: "meet_greet",
    title: "Justin Jefferson",
    playerOrSubtitle: "VIP Meet & Greet · Autographed Football",
    teamId: "MIN",
    teamName: "Minnesota Vikings",
    city: "Minneapolis, MN",
    imageUrl: "/postimages/1ef0abb32f5e7cb84b338bbb020c200cjetas.jpg",
    experienceHighlights: ["1-on-1 Photo Op", "Signed Official Football", "Club Room Q&A"],
    availabilityLabel: "By Player Availability",
    isConfirmedSchedule: false,
    priceLabel: "$1,000",
    actionLabel: "Explore Experience",
    actionType: "experience",
  },
  {
    id: "star-mahomes",
    expId: "exp-mahomes-meet",
    filterKey: "meet_greet",
    title: "Patrick Mahomes",
    playerOrSubtitle: "QB Masterclass · VIP Meet & Greet",
    teamId: "KC",
    teamName: "Kansas City Chiefs",
    city: "Kansas City, MO",
    imageUrl: "/postimages/f2318507a5fadb58268812cf8e9a3510.jpg",
    experienceHighlights: ["1-on-1 Photo Op", "Signed Duke Football", "Backstage Access"],
    availabilityLabel: "By Player Availability",
    isConfirmedSchedule: false,
    priceLabel: "$1,000",
    actionLabel: "Explore Experience",
    actionType: "experience",
  },
  {
    id: "star-purdy",
    expId: "exp-brock-purdy-meet",
    filterKey: "meet_greet",
    title: "Brock Purdy",
    playerOrSubtitle: "Private Sideline & Signing Experience",
    teamId: "SF",
    teamName: "San Francisco 49ers",
    city: "Santa Clara, CA",
    imageUrl: "/postimages/download-(4).jpg",
    experienceHighlights: ["Sideline Credential", "Private Photo Op", "Signed Jersey or Ball"],
    availabilityLabel: "Special Arrangement",
    isConfirmedSchedule: false,
    priceLabel: "$2,000",
    actionLabel: "Request Access",
    actionType: "experience",
  },
  {
    id: "star-nix",
    expId: "exp-bo-nix-meet",
    filterKey: "meet_greet",
    title: "Bo Nix",
    playerOrSubtitle: "Private Encounter & Podcast Studio",
    teamId: "DEN",
    teamName: "Denver Broncos",
    city: "Denver, CO",
    imageUrl: "/postimages/IMG-0622.jpg",
    experienceHighlights: ["Private Meet & Photo Op", "Autographed Gear", "Live Podcast Option"],
    availabilityLabel: "Special Arrangement",
    isConfirmedSchedule: false,
    priceLabel: "$1,500+",
    actionLabel: "View Options",
    actionType: "experience",
  },
  {
    id: "star-pitre",
    expId: "exp-jalen-pitre-meet",
    filterKey: "meet_greet",
    title: "Jalen Pitre",
    playerOrSubtitle: "1-on-1 Texans Sideline Experience",
    teamId: "HOU",
    teamName: "Houston Texans",
    city: "Houston, TX",
    imageUrl: "/postimages/IMG-0781.webp",
    experienceHighlights: ["NRG Sideline Pass", "Signed Texans Gear", "Private Photo Session"],
    availabilityLabel: "Special Arrangement",
    isConfirmedSchedule: false,
    priceLabel: "$1,000",
    actionLabel: "Explore Experience",
    actionType: "experience",
  },
  {
    id: "star-maye",
    expId: "exp-drake-maye-meet",
    filterKey: "meet_greet",
    title: "Drake Maye",
    playerOrSubtitle: "Patriots QB Meet & Field Access",
    teamId: "NE",
    teamName: "New England Patriots",
    city: "Foxborough, MA",
    imageUrl: "/postimages/IMG-0363.jpg",
    experienceHighlights: ["Putnam Club & Sideline", "Signed Jersey or Ball", "Private Photo Op"],
    availabilityLabel: "By Player Availability",
    isConfirmedSchedule: false,
    priceLabel: "$1,000",
    actionLabel: "Explore Experience",
    actionType: "experience",
  },
  {
    id: "stadium-cowboys",
    expId: "exp-dal-tour",
    filterKey: "stadium_tour",
    title: "AT&T Stadium Access",
    playerOrSubtitle: "Locker Rooms · Player Tunnel · 50-Yard Line",
    teamId: "DAL",
    teamName: "Dallas Cowboys",
    city: "Arlington, TX",
    imageUrl: "/postimages/a8367675b2fbcfe31970b081bfce176f.jpg",
    experienceHighlights: ["Confirmed Tour Dates", "50-Yard Star Field Op", "Locker Room Tour"],
    availabilityLabel: "Confirmed Schedule",
    isConfirmedSchedule: true,
    priceLabel: "From $45",
    actionLabel: "Book Tour",
    actionType: "experience",
  },
  {
    id: "stadium-seahawks",
    expId: "exp-sea-training",
    filterKey: "stadium_tour",
    title: "Seahawks Practice Access",
    playerOrSubtitle: "VIP Fieldside Training Camp & Autographs",
    teamId: "SEA",
    teamName: "Seattle Seahawks",
    city: "Renton, WA",
    imageUrl: "/postimages/341007003061882166.jpg",
    experienceHighlights: ["Confirmed Camp Dates", "Fieldside Practice View", "Post-Practice Signs"],
    availabilityLabel: "Confirmed Schedule",
    isConfirmedSchedule: true,
    priceLabel: "From $250",
    actionLabel: "Reserve Pass",
    actionType: "experience",
  },
  {
    id: "merch-signed-vault",
    expId: "shop-vault",
    filterKey: "memorabilia",
    title: "Autographed Vault & Jerseys",
    playerOrSubtitle: "Certified Signed Footballs · Helmets · Jerseys",
    teamId: "SEA",
    teamName: "Official Arena Shop",
    city: "COA Verified",
    imageUrl: "/postimages/DK-Metcalf-Autographed-Seahawks-Football.jpg",
    experienceHighlights: ["Authenticated Holograms", "Nike Vapor Elite Gear", "Instant Dispatch"],
    availabilityLabel: "Confirmed In-Stock",
    isConfirmedSchedule: true,
    priceLabel: "From $32",
    actionLabel: "Visit Shop",
    actionType: "shop",
  },
];

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({
  nflLogoUrl,
  shopItems,
  testimonials,
  onExploreExperiences,
  onDiscoverGameDay,
  onOpenTrackInquiry,
  onSelectExperience,
  onOpenPlayerInquiry,
  onOpenCustomerCare,
  onOpenTicketCheck,
  onOpenSignIn,
}) => {
  const [showcaseFilter, setShowcaseFilter] = useState<"all" | "meet_greet" | "stadium_tour" | "memorabilia">("all");

  // Top-of-page Custom Player Inquiry Quick Form State
  const [inquiryPlayer, setInquiryPlayer] = useState("");
  const [inquiryTeamId, setInquiryTeamId] = useState("DAL");
  const [inquiryObjective, setInquiryObjective] = useState(CUSTOM_INQUIRY_OBJECTIVES[0]);
  const [inquiryName, setInquiryName] = useState(() => localStorage.getItem("nfl_guest_sender_name") || "");
  const [inquiryEmail, setInquiryEmail] = useState(() => localStorage.getItem("nfl_guest_buyer_email") || "");
  const [inquiryPlatform, setInquiryPlatform] = useState<"whatsapp" | "telegram" | "zangi">("whatsapp");
  const [inquiryHandle, setInquiryHandle] = useState("");
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  const visibleCards =
    showcaseFilter === "all"
      ? FEATURED_CARDS.slice(0, 6)
      : FEATURED_CARDS.filter((c) => c.filterKey === showcaseFilter);

  const handleCardClick = (card: FeaturedExperienceCard) => {
    if (card.actionType === "shop") {
      onDiscoverGameDay();
    } else if (card.actionType === "inquiry") {
      onOpenPlayerInquiry();
    } else {
      onSelectExperience(card.expId);
    }
  };

  const handleCustomInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquiryError(null);

    const trimmedPlayer = inquiryPlayer.trim();
    const trimmedName = inquiryName.trim();
    const trimmedEmail = inquiryEmail.trim();
    const trimmedHandle = inquiryHandle.trim();

    if (!trimmedPlayer) {
      setInquiryError("Please enter or tap your favorite NFL player name to continue.");
      return;
    }

    if (trimmedEmail && !trimmedEmail.includes("@")) {
      setInquiryError("Please enter a valid email address for booking confirmation.");
      return;
    }

    if (trimmedName) localStorage.setItem("nfl_guest_sender_name", trimmedName);
    if (trimmedEmail) localStorage.setItem("nfl_guest_buyer_email", trimmedEmail);

    const hasCompleteContact =
      trimmedName.length > 0 &&
      trimmedEmail.includes("@") &&
      trimmedHandle.length > 0;

    onOpenPlayerInquiry({
      playerName: trimmedPlayer,
      teamId: inquiryTeamId,
      objective: inquiryObjective,
      fullName: trimmedName || undefined,
      email: trimmedEmail || undefined,
      messagingPlatform: inquiryPlatform,
      messagingDetails: trimmedHandle || undefined,
      skipToPayment: hasCompleteContact,
    });
  };

  const selectedInquiryTeam = NFL_TEAMS.find((t) => t.id === inquiryTeamId) || NFL_TEAMS[0];

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-[#050508] text-zinc-100">
      {/* 0. TOP-OF-PAGE CUSTOM PLAYER INQUIRY HERO BANNER & QUICK FORM (TIKTOK MOBILE-FIRST CRO) */}
      <section
        id="custom-player-inquiry"
        className="relative overflow-hidden border-b border-white/10 bg-[#040714]"
      >
        {/* Atmospheric Stadium Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={stadiumHeroImg}
            alt="NFL stadium lights backdrop"
            className="w-full h-full object-cover object-center opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040714]/90 via-[#05091a]/88 to-[#050508]" />
          <div className="absolute -top-28 -left-24 w-[28rem] h-[24rem] bg-blue-600/20 blur-[120px] rounded-full" />
          <div className="absolute -bottom-28 -right-24 w-[28rem] h-[24rem] bg-emerald-500/15 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-14 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Copy & Instant Star Picker */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-5"
            >
              {/* Brand & Charity Metadata Strip */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-11 bg-[#0a1026]/90 rounded-lg p-1 border border-white/15 flex items-center justify-center shrink-0">
                  <img src={nflLogoUrl} alt="NFL Shield" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs sm:text-sm font-semibold text-zinc-300 leading-snug">
                  <span className="text-sky-300 font-bold">Custom Player Concierge</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                  <span>All 32 NFL Teams</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                  <span className="text-emerald-300 font-bold">$100 Charity Spot</span>
                </div>
              </div>

              {/* Required Bold Headline & Sub-headline */}
              <h1
                className="font-display font-extrabold italic uppercase tracking-tight leading-[0.95] text-white"
                style={{ fontSize: "clamp(2.15rem, 5vw, 3.85rem)" }}
              >
                Don&apos;t See Your Favorite Player?{" "}
                <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
                  Inquire Below!
                </span>
              </h1>

              <p className="text-sm sm:text-base lg:text-lg text-zinc-200 leading-relaxed max-w-xl font-medium">
                We arrange exclusive access, meetups, and fan experiences for any NFL star. Tell us who you want to connect with and secure your spot —{" "}
                <strong className="text-emerald-300 font-bold">100% of your $100 fee goes directly to charity.</strong>
              </p>

              {/* Key Conversion Value Points */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs sm:text-sm text-zinc-200 font-medium">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>VIP Meetups, Photo Ops &amp; Signed Gear</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <Heart className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>100% Charity Commitment ($100 Flat)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <MessageSquare className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>Direct WhatsApp, Telegram &amp; Zangi Updates</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Manual Verification &amp; Protected Booking</span>
                </div>
              </div>

              {/* 1-Tap Popular Star Prefill Bar (Great for TikTok Mobile Visitors) */}
              <div className="pt-2 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Popular Requests — Tap to Auto-Fill:
                </p>
                <div className="flex flex-wrap gap-2">
                  {CUSTOM_INQUIRY_QUICK_STARS.map((star) => {
                    const isSelected = inquiryPlayer.trim().toLowerCase() === star.name.toLowerCase();
                    return (
                      <button
                        key={star.name}
                        type="button"
                        onClick={() => {
                          setInquiryPlayer(star.name);
                          setInquiryTeamId(star.teamId);
                          setInquiryError(null);
                        }}
                        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30"
                            : "bg-[#0b1126] hover:bg-[#121c3d] border-white/15 text-zinc-200"
                        }`}
                      >
                        <span>{star.name}</span>
                        <span className="text-[11px] font-mono text-zinc-400">({star.teamId})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Anchor Links on Mobile/Desktop */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-semibold text-zinc-400">
                <a
                  href="#featured-experiences"
                  className="inline-flex items-center gap-1.5 text-sky-300 hover:text-sky-200 transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>See Featured Stars &amp; Stadium Tours</span>
                </a>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <button
                  type="button"
                  onClick={onDiscoverGameDay}
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
                  <span>Browse Arena Shop</span>
                </button>
              </div>
            </motion.div>

            {/* Right Interactive Custom Player Inquiry Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <form
                onSubmit={handleCustomInquirySubmit}
                className="bg-[#080d22]/95 backdrop-blur-xl border border-indigo-400/30 rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(15,23,60,0.85)] space-y-4"
              >
                {/* Form Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-white/15 p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={getLogoUrl(selectedInquiryTeam.id)}
                        alt={selectedInquiryTeam.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-white truncate">
                        Custom Player Inquiry Form
                      </h2>
                      <p className="text-xs text-zinc-400 truncate">
                        {selectedInquiryTeam.city} {selectedInquiryTeam.name} · Any Roster Star
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-base sm:text-lg font-extrabold text-emerald-400 leading-none">
                      $100
                    </p>
                    <p className="text-[11px] font-semibold text-emerald-300 mt-0.5">
                      100% Charity
                    </p>
                  </div>
                </div>

                {inquiryError && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{inquiryError}</span>
                  </div>
                )}

                {/* Player Input */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="hero-custom-player"
                    className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                  >
                    Who Do You Want to Meet? <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-sky-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      id="hero-custom-player"
                      type="text"
                      value={inquiryPlayer}
                      onChange={(e) => {
                        setInquiryPlayer(e.target.value);
                        if (inquiryError) setInquiryError(null);
                      }}
                      placeholder="Type any NFL player (e.g. CeeDee Lamb, Tyreek Hill)..."
                      className="w-full min-h-[48px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl pl-10 pr-4 py-3 text-[16px] sm:text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-sky-400"
                    />
                  </div>
                </div>

                {/* Team & Experience Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hero-custom-team"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      NFL Team
                    </label>
                    <select
                      id="hero-custom-team"
                      value={inquiryTeamId}
                      onChange={(e) => setInquiryTeamId(e.target.value)}
                      className="w-full min-h-[46px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      {NFL_TEAMS.map((team) => (
                        <option key={team.id} value={team.id} className="bg-zinc-900 text-white">
                          {team.city} {team.name} ({team.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="hero-custom-objective"
                      className="block text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      Experience Type
                    </label>
                    <select
                      id="hero-custom-objective"
                      value={inquiryObjective}
                      onChange={(e) => setInquiryObjective(e.target.value)}
                      className="w-full min-h-[46px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white focus:outline-none cursor-pointer"
                    >
                      {CUSTOM_INQUIRY_OBJECTIVES.map((obj) => (
                        <option key={obj} value={obj} className="bg-zinc-900 text-white">
                          {obj}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="hero-custom-name"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      <User className="w-3.5 h-3.5 text-zinc-400" />
                      Your Name
                    </label>
                    <input
                      id="hero-custom-name"
                      type="text"
                      value={inquiryName}
                      onChange={(e) => setInquiryName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full min-h-[46px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor="hero-custom-email"
                      className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-300"
                    >
                      <Mail className="w-3.5 h-3.5 text-zinc-400" />
                      Email Address
                    </label>
                    <input
                      id="hero-custom-email"
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => {
                        setInquiryEmail(e.target.value);
                        if (inquiryError) setInquiryError(null);
                      }}
                      placeholder="you@example.com"
                      className="w-full min-h-[46px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Messaging Platform Selector + Handle */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
                    Where Should Our Concierge Reach You?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "whatsapp", label: "WhatsApp" },
                      { id: "telegram", label: "Telegram" },
                      { id: "zangi", label: "Zangi" },
                    ].map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setInquiryPlatform(plat.id as "whatsapp" | "telegram" | "zangi")}
                        className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          inquiryPlatform === plat.id
                            ? "bg-indigo-600/25 border-sky-400 text-white"
                            : "bg-[#040714] border-white/10 text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {plat.label}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={inquiryHandle}
                    onChange={(e) => setInquiryHandle(e.target.value)}
                    placeholder={
                      inquiryPlatform === "whatsapp"
                        ? "WhatsApp Phone Number (e.g. +1 555-234-5678)"
                        : inquiryPlatform === "telegram"
                        ? "Telegram @username or Phone Number"
                        : "Zangi Private Number / ID"
                    }
                    className="w-full min-h-[46px] bg-[#040714] border border-white/15 focus:border-sky-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none"
                  />
                </div>

                {/* High-Converting Submit Button */}
                <button
                  type="submit"
                  className="w-full min-h-[54px] px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 hover:from-emerald-400 hover:via-teal-400 hover:to-sky-400 text-zinc-950 font-extrabold text-sm sm:text-base uppercase tracking-wide shadow-[0_14px_34px_-8px_rgba(16,185,129,0.55)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center justify-center gap-2.5"
                >
                  <span>Secure My Player Inquiry · $100 Charity</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                {/* Form Trust & Status Links Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Next: $100 Charity Contribution &amp; Receipt</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenTrackInquiry}
                    className="text-sky-300 hover:text-sky-200 font-semibold transition-colors cursor-pointer"
                  >
                    Track Existing Inquiry
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 1. FULL-SCREEN CINEMATIC STADIUM HERO */}
      <section className="relative min-h-[calc(85vh-4rem)] flex flex-col justify-center overflow-hidden border-b border-white/10">
        {/* Background Stadium Photograph */}
        <motion.div
          initial={{ scale: 1.05, opacity: 0.75 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={stadiumHeroImg}
            alt="Packed NFL stadium under floodlights on game night"
            className="w-full h-full object-cover object-center"
          />
          {/* Deep Black, Midnight Navy & Electric Blue/Purple Atmospheric Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#040717]/90 via-[#050819]/65 to-[#050508]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#040717]/95 via-[#060b22]/55 to-transparent" />
          <div className="absolute -top-32 left-1/4 w-[36rem] h-[24rem] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[32rem] h-[22rem] bg-purple-600/25 blur-[140px] rounded-full pointer-events-none" />
        </motion.div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 py-14 sm:py-24">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Brand Crest & League Identifier */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-14 sm:w-12 sm:h-16 bg-[#080d22]/90 backdrop-blur-md rounded-xl p-1.5 border border-indigo-400/25 shadow-2xl flex items-center justify-center shrink-0">
                <img src={nflLogoUrl} alt="NFL Shield" className="w-full h-full object-contain" />
              </div>
              <div className="text-xs sm:text-sm font-semibold tracking-wide text-sky-300">
                <span>NFL Gridiron Entertainment</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span>All 32 Franchises</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span className="text-purple-300">Verified Experiences &amp; Gear</span>
              </div>
            </div>

            {/* Stadium Showcase Headline */}
            <h2
              className="font-display font-extrabold italic uppercase tracking-tight leading-[0.93] text-white mb-6"
              style={{ fontSize: "clamp(2.75rem, 6.2vw, 5.75rem)" }}
            >
              GET CLOSER TO THE GAME.
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
                EXPERIENCE MORE.
              </span>
            </h2>

            {/* Required Supporting Copy */}
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-2xl font-medium leading-relaxed mb-9">
              Discover unforgettable football experiences, exclusive fan opportunities, authentic merchandise, and exciting ways to celebrate the game you love.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <button
                type="button"
                onClick={onExploreExperiences}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[52px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base tracking-wide shadow-[0_14px_40px_-10px_rgba(79,70,229,0.7)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <span>EXPLORE EXPERIENCES</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onDiscoverGameDay}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[52px] rounded-2xl bg-[#080d22]/85 hover:bg-[#0e1636] border border-indigo-400/40 hover:border-purple-400/75 backdrop-blur-md text-white font-bold text-sm sm:text-base tracking-wide shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>VISIT THE ARENA SHOP</span>
              </button>
            </div>

            {/* Direct Navigation Assurances */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                Instant Guest Booking
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                Digital QR Passes &amp; Verified COA Gear
              </span>
              <button
                type="button"
                onClick={() => onOpenPlayerInquiry()}
                className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Inquire About A Player ($100 goes 100% to charity)</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PLAYER EXPERIENCE SHOWCASE */}
      <section id="featured-experiences" className="relative py-18 sm:py-26 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400 mb-3">
              Curated Player Roster &amp; Stadium Lineup
            </p>
            <h2
              className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.98]"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.5rem)" }}
            >
              MEET THE STARS.{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                LIVE THE EXPERIENCE.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 mt-3 leading-relaxed">
              Reserve confirmed stadium tours and training camp credentials immediately, or coordinate exclusive meet-and-greets, autographs, sideline access, and photo opportunities.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-[#080d22] border border-white/10 rounded-2xl self-start">
            {[
              { id: "all", label: "Featured Stars" },
              { id: "meet_greet", label: "Meet & Greets" },
              { id: "stadium_tour", label: "Stadium Tours" },
              { id: "memorabilia", label: "Signed Vault" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShowcaseFilter(tab.id as any)}
                className={`px-4 py-2 min-h-[40px] rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  showcaseFilter === tab.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player & Experience Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {visibleCards.map((card, idx) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.45 }}
              onClick={() => handleCardClick(card)}
              className="group relative bg-[#080c1c] border border-white/10 hover:border-indigo-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-2xl"
            >
              {/* Photo Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                <NFLImage
                  item={{
                    id: card.expId,
                    title: card.title,
                    teamId: card.teamId,
                    imageUrl: card.imageUrl,
                  }}
                  alt={card.title}
                  className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080c1c] via-[#080c1c]/20 to-transparent" />

                {/* Top-Right Team Shield Crest */}
                <div className="absolute top-3.5 right-3.5 w-10 h-10 rounded-xl bg-zinc-950/85 backdrop-blur-md border border-white/15 p-1.5 flex items-center justify-center">
                  <img
                    src={getLogoUrl(card.teamId)}
                    alt={card.teamName}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Bottom Team & Location Metadata directly over scrim */}
                <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between text-xs font-semibold text-zinc-200">
                  <span className="truncate">{card.teamName}</span>
                  <span className="text-zinc-300 shrink-0 ml-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    {card.city}
                  </span>
                </div>
              </div>

              {/* Card Details Body */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        card.isConfirmedSchedule ? "text-emerald-400" : "text-purple-300"
                      }`}
                    >
                      {card.availabilityLabel}
                    </span>
                    <span className="font-mono font-bold text-white">{card.priceLabel}</span>
                  </div>

                  <h3 className="font-display text-2xl font-extrabold uppercase tracking-tight text-white group-hover:text-sky-300 transition-colors leading-none">
                    {card.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-300 font-medium">
                    {card.playerOrSubtitle}
                  </p>
                </div>

                <div className="space-y-4 pt-3 border-t border-white/10">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-300">
                    {card.experienceHighlights.map((hl, i) => (
                      <React.Fragment key={hl}>
                        <span>{hl}</span>
                        {i < card.experienceHighlights.length - 1 && (
                          <span aria-hidden="true" className="text-zinc-600">·</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-sky-400 group-hover:text-white transition-colors">
                    <span>{card.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Custom Player Charity Inquiry Bar */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-[#091235] via-[#0c102e] to-[#1a0d38] border border-indigo-500/35 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span>Special Arrangement · 100% Charity Commitment</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold italic uppercase tracking-tight text-white">
              Looking for another NFL star? Request any active player.
            </h3>
            <p className="text-sm text-zinc-200 leading-relaxed">
              Choose any of the 32 NFL franchises and your preferred contact channel (WhatsApp, Zangi, or Telegram).{" "}
              <strong className="text-emerald-300">100% of the $100 inquiry fee goes directly to charity.</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPlayerInquiry()}
            className="px-7 py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Inquire About A Player</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. ARENA SHOP & GAME DAY ACCESS SHOWCASE */}
      <section className="py-14 sm:py-20 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-[2.25rem] bg-[#080c1c] border border-white/10 p-7 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
                The Arena Shop · Authentic Gear &amp; Tickets
              </p>
              <h2
                className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.98]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                JERSEYS, SIGNED MEMORABILIA &amp; GAME-DAY SEATS.
              </h2>
              <p className="text-sm sm:text-base text-zinc-200 leading-relaxed max-w-xl">
                Explore authentic Nike jerseys, COA-certified helmets and autographed collectibles, lower-bowl match tickets, and season hospitality passes—all open to browse with seamless checkout.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-zinc-200 font-semibold">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Match Tickets &amp; Lower-Bowl Seats</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>Full-Season Hospitality Passes</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Jerseys, Helmets &amp; Collectibles</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>Beckett &amp; Hologram COA Verified</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onDiscoverGameDay}
                  className="px-8 py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/25 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>VISIT THE ARENA SHOP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onExploreExperiences}
                  className="px-8 py-4 min-h-[48px] rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                >
                  EXPLORE EXPERIENCES
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              {shopItems.slice(0, 2).map((item, i) => (
                <div
                  key={item.id}
                  onClick={onDiscoverGameDay}
                  className={`group relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 cursor-pointer ${
                    i === 1 ? "mt-6 sm:mt-10" : ""
                  }`}
                >
                  <NFLImage
                    item={item}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
                  <div className="absolute bottom-3.5 left-3.5 right-3.5">
                    <p className="text-xs font-bold text-white leading-tight line-clamp-2">{item.name}</p>
                    <p className="text-xs font-mono font-bold text-sky-400 mt-1">${item.price.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST, CREDIBILITY & CUSTOMER SUPPORT */}
      <section className="py-16 sm:py-22 bg-[#060916]/80 border-y border-white/5 px-5 sm:px-8 space-y-16">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400 mb-2">
              Verified Booking Standard
            </p>
            <h2
              className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.98]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.1rem)" }}
            >
              CLEAR PRICING. VERIFIED CREDENTIALS. REAL SUPPORT.
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 mt-3 leading-relaxed">
              Every experience clearly distinguishes confirmed stadium dates from bookings coordinated around active NFL player schedules.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            <div className="p-6 rounded-2xl bg-[#090e24] border border-white/10 space-y-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Confirmed Scheduled Events</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Stadium tours, Seahawks practice sessions, match tickets, and signed vault gear carry fixed dates or confirmed stock.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090e24] border border-white/10 space-y-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <h3 className="text-base font-bold text-white">Player-Coordinated Encounters</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                1-on-1 VIP player encounters depend on athlete availability and are finalized directly with our liaison team.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090e24] border border-white/10 space-y-3">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <h3 className="text-base font-bold text-white">Transparent Pricing &amp; Passes</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Upfront totals with no hidden fees, flexible payment options, and scannable PDF/QR passes upon approval.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#090e24] border border-white/10 space-y-3">
              <Headphones className="w-6 h-6 text-blue-400" />
              <h3 className="text-base font-bold text-white">Dedicated Fan Concierge</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Track inquiries in real time, verify any digital pass in the portal, or contact Customer Care anytime.
              </p>
            </div>
          </div>

          {/* Embedded Support, FAQs, Order Tracking & Business Identity */}
          <SupportTrustSection
            compact
            onOpenCustomerCare={onOpenCustomerCare}
            onOpenTrackInquiry={onOpenTrackInquiry}
            onOpenTicketCheck={onOpenTicketCheck}
          />

          {/* Real Fan Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-14">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-7 rounded-3xl bg-[#090e24]/80 border border-white/10 flex flex-col justify-between gap-6"
              >
                <div>
                  <div className="flex gap-1 mb-4">
                    {[...Array(t.rating)].map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-sky-400 text-sky-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-zinc-200 font-medium leading-relaxed">
                    &ldquo;{t.text}&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/10 flex items-center justify-center font-bold text-sky-300 text-sm">
                    {t.name[0]}
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{t.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FINAL CONVERSION FOOTER CTA */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/30 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-7">
          <h2
            className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(2.4rem, 5vw, 4.25rem)" }}
          >
            MAKE THIS SEASON{" "}
            <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
              UNFORGETTABLE.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Explore VIP stadium tours, player meet-and-greets, certified autographed memorabilia, game-day seats, and dedicated fan support across all 32 teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onExploreExperiences}
              className="w-full sm:w-auto px-9 py-4 min-h-[50px] rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              EXPLORE EXPERIENCES
            </button>
            <button
              type="button"
              onClick={onDiscoverGameDay}
              className="w-full sm:w-auto px-9 py-4 min-h-[50px] rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm tracking-wide transition-all cursor-pointer"
            >
              VISIT THE ARENA SHOP
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-zinc-400">
            <button
              type="button"
              onClick={onOpenTicketCheck}
              className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Check / Download Pass
            </button>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <button
              type="button"
              onClick={onOpenSignIn}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
