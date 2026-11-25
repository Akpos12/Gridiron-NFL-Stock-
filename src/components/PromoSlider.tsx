import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Ticket, Users, Shield, Compass, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { getNFLImage } from "../utils/nflImages";

import stadiumVipImg from "../assets/images/stadium_vip_hospitality_1794821884684.jpg";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  imageUrl: string;
  badge: string;
  linkText: string;
  accentColor: string;
  v?: number;
  updatedAt?: any;
}

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    id: "promo-ceedee-dec26",
    title: "CEEDÉE LAMB PUBLIC MEET & GREET · DECEMBER 26TH · $100",
    subtitle: "AT&T STADIUM · ARLINGTON, TX · FEATURED PUBLIC EVENT",
    description: "Get ready for an unforgettable fan experience! Join us on December 26th at AT&T Stadium in Arlington, TX for an exclusive opportunity to meet CeeDee Lamb in person. Admission: $100 per ticket.",
    imageUrl: "/assets/aistudio/IMG_1832_f33e4b9e.jpeg",
    badge: "DEC 26 · AT&T STADIUM · $100",
    linkText: "SECURE YOUR SLOT ($100)",
    accentColor: "from-[#002244] via-[#003594] to-[#64748B]"
  },
  {
    id: "promo-player-inquiry",
    title: "GET AN INVITATION TO YOUR FAVORITE PLAYER'S MEET & GREET FOR JUST $100",
    subtitle: "VIP HOSPITALITY INVITATION",
    description: "Choose your favorite player and let our concierge team guide you through the invitation process. Subject to player availability and confirmed events.",
    imageUrl: stadiumVipImg,
    badge: "MEET & GREET INVITE",
    linkText: "GET YOUR INVITATION – $100",
    accentColor: "from-[#013369] via-[#1D4ED8] to-[#D50A0A]"
  },
  {
    id: "promo-1",
    title: "EXCLUSIVE PLAYER MEET & GREET ACCESS",
    subtitle: "HOSPITALITY INVITATION",
    description: "Submit a request for an opportunity to attend private player appearances, autographs, and club-level Q&A sessions.",
    imageUrl: "/postimages/IMG-0463.jpg",
    badge: "FAN HOSPITALITY",
    linkText: "EXPLORE EXPERIENCES",
    accentColor: "from-blue-600 to-red-600"
  },
  {
    id: "promo-2",
    title: "BEHIND-THE-SCENES STADIUM RUN",
    subtitle: "LOCKER ROOM & TUNNEL TOUR",
    description: "Walk the hallowed turf, inspect stadium clubs, and book confirmed access tours across premier venues.",
    imageUrl: stadiumVipImg,
    badge: "GRIDIRON ACCESS",
    linkText: "EXPLORE STADIUMS",
    accentColor: "from-blue-600 to-indigo-600"
  },
  {
    id: "promo-3",
    title: "PRIVATE TRAINING FACILITIES",
    subtitle: "ELITE PACKAGES",
    description: "Tailor luxury hospitality experiences for groups, corporate outings, and game-day weekends.",
    imageUrl: "/postimages/341007003061882166.jpg",
    badge: "PREMIUM PLATINUM",
    linkText: "EXPLORE PACKAGES",
    accentColor: "from-purple-600 to-pink-600"
  },
  {
    id: "promo-podcast-bo-nix",
    title: "PODCAST RESERVATIONS: BO NIX & NFL STARS",
    subtitle: "EXCLUSIVE STUDIO & GUEST APPEARANCE",
    description: "Host Denver Broncos standout quarterback Bo Nix on your podcast, studio broadcast, or YouTube show. Coordinate recording dates directly with Customer Care.",
    imageUrl: "https://i.postimg.cc/90bgpRVV/IMG-0622.jpg",
    badge: "PODCAST CONCIERGE",
    linkText: "RESERVE PODCAST SESSION",
    accentColor: "from-purple-600 via-indigo-600 to-blue-600"
  },
  {
    id: "promo-brock-purdy",
    title: "BROCK PURDY PRIVATE EXPERIENCE",
    subtitle: "SAN FRANCISCO 49ERS VIP ENCOUNTER",
    description: "Meet starting quarterback Brock Purdy 1-on-1 at Levi's Stadium. Includes exclusive sideline passes, signed memorabilia, and private photo session.",
    imageUrl: "https://i.postimg.cc/CM24tWsF/download-(4).jpg",
    badge: "PLATINUM VIP",
    linkText: "BOOK BROCK PURDY",
    accentColor: "from-red-600 via-amber-600 to-yellow-600"
  }
];

interface PromoSliderProps {
  customBanners?: PromoBanner[];
  onActionClick: (banner: PromoBanner) => void;
}

export const PromoSlider: React.FC<PromoSliderProps> = ({ customBanners, onActionClick }) => {
  const banners = customBanners && customBanners.length > 0 ? customBanners : DEFAULT_BANNERS;
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const activeBanner = banners[currentIdx];

  return (
    <div className="relative w-full h-[320px] md:h-[420px] rounded-[2.5rem] overflow-hidden border border-white/5 bg-zinc-950 shadow-2xl group/slider">
      {/* Background Image with Ambient Overlay */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeBanner.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 0.6, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${getNFLImage(activeBanner)})` }}
        />
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/40 to-transparent" />

      {/* Slide Content */}
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end z-10 max-w-4xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeBanner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="space-y-3 md:space-y-4"
          >
            {/* Tag Badge */}
            <span className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r rounded-full text-[9px] md:text-[10px] font-black tracking-widest text-white shadow-xl",
              activeBanner.accentColor
            )}>
              <Sparkles className="w-3 h-3 text-white animate-pulse" />
              {activeBanner.badge}
            </span>

            {/* Header Titles */}
            <div className="space-y-1">
              <h4 className="text-[10px] md:text-xs font-black tracking-widest text-zinc-400 uppercase">
                {activeBanner.subtitle}
              </h4>
              <h2 className="text-2xl md:text-4xl font-black italic tracking-tighter text-white uppercase leading-none max-w-2xl">
                {activeBanner.title}
              </h2>
            </div>

            {/* Description Text */}
            <p className="text-[10px] md:text-sm text-zinc-400 font-bold max-w-xl leading-relaxed">
              {activeBanner.description}
            </p>

            {/* Action CTA Button */}
            <div className="pt-2">
              <button
                onClick={() => onActionClick(activeBanner)}
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-white text-zinc-950 hover:bg-zinc-200 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-md transform hover:-translate-y-0.5"
              >
                <Ticket className="w-4 h-4 text-zinc-950" />
                {activeBanner.linkText}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover/slider:opacity-100 z-20"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover/slider:opacity-100 z-20"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Carousel Indicator Dots */}
      <div className="absolute right-12 bottom-8 flex gap-2 z-20">
        {banners.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIdx(idx)}
            className={cn(
              "h-1.5 transition-all rounded-full",
              idx === currentIdx ? "w-6 bg-white" : "w-1.5 bg-white/20 hover:bg-white/40"
            )}
          />
        ))}
      </div>
    </div>
  );
};
