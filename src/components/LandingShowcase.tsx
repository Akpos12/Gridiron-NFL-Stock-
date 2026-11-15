import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Headphones,
  Heart,
  MapPin,
  ShieldCheck,
  ShoppingBag,
  Star,
  Ticket,
  Trophy,
  UserCheck,
} from "lucide-react";
import stadiumHeroImg from "../assets/images/nfl_stadium_hero_1794712782399.jpg";
import { NFLImage } from "../utils/nflImages";
import { getLogoUrl } from "../constants";

interface LandingShowcaseProps {
  nflLogoUrl: string;
  shopItems: Array<{ id: string; name: string; price: number; description: string; image: string }>;
  testimonials: Array<{ name: string; text: string; rating: number }>;
  onExploreExperiences: () => void;
  onDiscoverGameDay: () => void;
  onSelectExperience: (targetId: string) => void;
  onOpenPlayerInquiry: () => void;
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
    actionLabel: "View Experience",
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
    actionLabel: "View Experience",
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
    actionLabel: "View Experience",
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
    actionLabel: "View Experience",
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
    actionLabel: "Shop Vault",
    actionType: "shop",
  },
];

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({
  nflLogoUrl,
  shopItems,
  testimonials,
  onExploreExperiences,
  onDiscoverGameDay,
  onSelectExperience,
  onOpenPlayerInquiry,
  onOpenCustomerCare,
  onOpenTicketCheck,
  onOpenSignIn,
}) => {
  const [showcaseFilter, setShowcaseFilter] = useState<"all" | "meet_greet" | "stadium_tour" | "memorabilia">("all");

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

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-[#050508] text-zinc-100">
      {/* 1. FULL-SCREEN CINEMATIC STADIUM HERO */}
      <section className="relative min-h-[calc(100vh-5rem)] flex flex-col justify-center overflow-hidden border-b border-white/10">
        {/* Background Stadium Photograph */}
        <motion.div
          initial={{ scale: 1.06, opacity: 0.7 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <img
            src={stadiumHeroImg}
            alt="Packed NFL stadium under floodlights on game night"
            className="w-full h-full object-cover object-center"
          />
          {/* Cinematic contrast scrims & electric blue/purple stadium glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/85 via-[#050508]/60 to-[#050508]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050508]/90 via-[#050508]/45 to-transparent" />
          <div className="absolute -top-32 left-1/4 w-[36rem] h-[24rem] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[32rem] h-[22rem] bg-purple-600/20 blur-[140px] rounded-full pointer-events-none" />
        </motion.div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 py-16 sm:py-24">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Brand Crest & Domain Kicker */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-11 h-14 sm:w-12 sm:h-16 bg-zinc-950/85 backdrop-blur-md rounded-xl p-1.5 border border-white/15 shadow-2xl flex items-center justify-center shrink-0">
                <img src={nflLogoUrl} alt="NFL Shield" className="w-full h-full object-contain" />
              </div>
              <div className="text-xs sm:text-sm font-semibold tracking-wide text-blue-300">
                <span>All 32 Franchises</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span>VIP Player Access</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span className="text-purple-300">Official Game Day Store</span>
              </div>
            </div>

            {/* Required Hero Headline */}
            <h1
              className="font-display font-extrabold italic uppercase tracking-tight leading-[0.94] text-white mb-6"
              style={{ fontSize: "clamp(2.85rem, 6.2vw, 5.75rem)" }}
            >
              YOUR FAVORITE NFL STARS.
              <br />
              <span className="bg-gradient-to-r from-sky-400 via-blue-500 to-purple-400 bg-clip-text text-transparent">
                CLOSER THAN EVER.
              </span>
            </h1>

            {/* Required Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-2xl font-medium leading-relaxed mb-9">
              Go beyond watching the game. Experience unforgettable opportunities to meet your favourite NFL players, take pictures, collect autographs, and create memories that last a lifetime.
            </p>

            {/* Primary & Secondary Gradient CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <button
                type="button"
                onClick={onExploreExperiences}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold text-sm sm:text-base tracking-wide shadow-[0_14px_40px_-10px_rgba(79,70,229,0.65)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <span>EXPLORE PLAYER EXPERIENCES</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onDiscoverGameDay}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-zinc-950/75 hover:bg-zinc-900/90 border border-indigo-400/40 hover:border-purple-400/70 backdrop-blur-md text-white font-bold text-sm sm:text-base tracking-wide shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <Ticket className="w-4 h-4 text-sky-400" />
                <span>DISCOVER GAME DAY ACCESS</span>
              </button>
            </div>

            {/* Clean Unboxed Key Assurances */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-zinc-300 font-medium">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                Instant Guest Booking
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                Digital QR Credentials &amp; COA Memorabilia
              </span>
              <button
                type="button"
                onClick={onOpenPlayerInquiry}
                className="inline-flex items-center gap-2 text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Custom Player Inquiry ($100 goes 100% to charity)</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PLAYER EXPERIENCE SHOWCASE: "MEET THE STARS. LIVE THE EXPERIENCE." */}
      <section className="relative py-20 sm:py-28 px-5 sm:px-8 max-w-7xl mx-auto">
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
            <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
              Reserve confirmed stadium tours and signed gear immediately, or request exclusive meet-and-greets, sideline photo ops, and private player encounters.
            </p>
          </div>

          {/* Interactive Filter Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-zinc-900/90 border border-white/10 rounded-2xl self-start">
            {[
              { id: "all", label: "Featured Stars" },
              { id: "meet_greet", label: "Meet & Greets" },
              { id: "stadium_tour", label: "Stadium Access" },
              { id: "memorabilia", label: "Autographed Gear" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setShowcaseFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
              className="group relative bg-zinc-950/90 border border-white/10 hover:border-indigo-500/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-2xl"
            >
              {/* Photo Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
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
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

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
                  <span className="text-zinc-400 shrink-0 ml-2 flex items-center gap-1">
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
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium">
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
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-blue-950/60 via-indigo-950/60 to-purple-950/60 border border-indigo-500/30 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300">
              <Heart className="w-4 h-4 text-emerald-400 fill-emerald-400/20" />
              <span>Special Arrangement · 100% Charity Commitment</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-extrabold italic uppercase tracking-tight text-white">
              Looking for another NFL star? Request any active player.
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Choose any of the 32 NFL franchises and your preferred contact channel (WhatsApp, Zangi, or Telegram).{" "}
              <strong className="text-emerald-300">100% of the $100 inquiry fee goes directly to charity.</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenPlayerInquiry}
            className="px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>Inquire About A Player</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 3. GAME DAY ACCESS & SIGNED ARENA SHOP SHOWCASE */}
      <section className="py-16 sm:py-24 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-[2.25rem] bg-zinc-950 border border-white/10 p-7 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-purple-400">
                Arena Shop · Match Tickets &amp; Signed Memorabilia
              </p>
              <h2
                className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.98]"
                style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
              >
                LOCK IN GAME DAY SEATS &amp; AUTHENTIC GEAR.
              </h2>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                From lower-bowl sideline seats and full-season VIP hospitality passes to COA-certified signed helmets and Nike Vapor Elite jerseys—browse everything seamlessly with no account barriers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-sm text-zinc-200 font-semibold">
                <div className="flex items-center gap-3">
                  <Ticket className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Lower-Bowl &amp; Suite Match Tickets</span>
                </div>
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>Season &amp; Sideline Hospitality Passes</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Certified Signed Helmets &amp; Balls</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-purple-400 shrink-0" />
                  <span>Instant Digital Pass Verification</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onDiscoverGameDay}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/25 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>ENTER ARENA SHOP</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onExploreExperiences}
                  className="px-8 py-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap"
                >
                  EXPLORE VIP PACKAGES
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

      {/* 4. TRUST & CREDIBILITY SECTION */}
      <section className="py-16 sm:py-24 bg-zinc-950/60 border-y border-white/5 px-5 sm:px-8">
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
            <p className="text-sm sm:text-base text-zinc-400 mt-3 leading-relaxed">
              Every listing states upfront whether dates are pre-scheduled or coordinated around active NFL player calendars.
            </p>
          </div>

          {/* 4 Credibility Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Confirmed Scheduled Events</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Stadium tours, Seahawks practice sessions, match tickets, and signed vault items have fixed dates or ready inventory for immediate confirmation.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <Clock className="w-6 h-6 text-purple-400" />
              <h3 className="text-base font-bold text-white">Player-Coordinated Encounters</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                1-on-1 VIP player meetups and private sessions depend on player availability and team schedules—confirmed directly with our liaison team.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <h3 className="text-base font-bold text-white">Transparent Pricing &amp; Passes</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Upfront USD totals, installment options on eligible VIP packages, and scannable digital QR &amp; PDF credentials upon approval.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/10 space-y-3">
              <Headphones className="w-6 h-6 text-blue-400" />
              <h3 className="text-base font-bold text-white">Dedicated Fan Concierge</h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Track inquiries in real time, verify any digital pass in the portal, or reach Customer Care directly before or after booking.
              </p>
            </div>
          </div>

          {/* Real Fan Stories */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="p-7 rounded-3xl bg-zinc-900/40 border border-white/5 flex flex-col justify-between gap-6"
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
                <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/10 flex items-center justify-center font-bold text-sky-300 text-sm">
                    {t.name[0]}
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{t.name}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Direct Verification Actions */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-xs font-bold">
            <button
              type="button"
              onClick={onOpenTicketCheck}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-emerald-400" />
              Verify or Download Existing Pass
            </button>
            <button
              type="button"
              onClick={onOpenCustomerCare}
              className="px-5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-200 transition-colors cursor-pointer inline-flex items-center gap-2"
            >
              <Headphones className="w-4 h-4 text-sky-400" />
              Contact Fan Concierge
            </button>
          </div>
        </div>
      </section>

      {/* 5. FINAL CONVERSION FOOTER CTA */}
      <section className="relative py-24 sm:py-32 px-5 sm:px-8 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/25 via-transparent to-transparent pointer-events-none" />
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
            Explore upcoming VIP stadium tours, player meet-and-greets, certified autographed collectibles, and game-day passes across all 32 teams.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={onExploreExperiences}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-sm tracking-wide shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
            >
              EXPLORE PLAYER EXPERIENCES
            </button>
            <button
              type="button"
              onClick={onDiscoverGameDay}
              className="w-full sm:w-auto px-9 py-4 rounded-2xl bg-white hover:bg-zinc-200 text-zinc-950 font-bold text-sm tracking-wide transition-all cursor-pointer"
            >
              DISCOVER GAME DAY ACCESS
            </button>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onOpenSignIn}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer"
            >
              Already have an account? Sign In
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
