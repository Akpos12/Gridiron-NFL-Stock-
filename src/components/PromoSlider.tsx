import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, Ticket, Users, Shield, Compass, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";
import { getNFLImage } from "../utils/nflImages";

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
    id: "promo-1",
    title: "EXCLUSIVE NFL LEGENDS MEET & GREET",
    subtitle: "ON-FIELD VIP ACCESS",
    description: "Get face-to-face with franchise legends, secure authenticated autographs, and experience exclusive backstage Q&A sessions.",
    imageUrl: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200",
    badge: "LEGENDS GUESTPASS",
    linkText: "BOOK VIP EXPERIENCE",
    accentColor: "from-amber-500 to-yellow-600"
  },
  {
    id: "promo-2",
    title: "BEHIND-THE-SCENES STADIUM RUN",
    subtitle: "LOCKER ROOM & TUNNEL TOUR",
    description: "Walk the hallowed turf, inspect the head coach's war room, and feel the ultimate stadium adrenaline rush with all-access VIP tours.",
    imageUrl: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200",
    badge: "GRIDIRON ACCESS",
    linkText: "EXPLORE STADIUMS",
    accentColor: "from-blue-600 to-indigo-600"
  },
  {
    id: "promo-3",
    title: "PRIVATE TRAINING FACILITIES",
    subtitle: "ELITE PACKAGES",
    description: "Tailor luxury experiences for your team, client meetings, or premium family gatherings at prime NFL training bases.",
    imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200",
    badge: "PREMIUM PLATINUM",
    linkText: "INQUIRE PRIVATELY",
    accentColor: "from-purple-600 to-pink-600"
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
