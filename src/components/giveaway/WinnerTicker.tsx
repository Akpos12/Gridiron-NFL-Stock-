import React, { useState, useEffect, useRef } from "react";
import { Gift, Sparkles, CheckCircle2, Zap, Trophy, PackageCheck } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { GiveawayWinner } from "../../types/giveaway";
import { cn } from "../../lib/utils";

export interface WinnerEvent {
  id: string;
  name: string;
  city: string;
  teamId: string;
  prizeOrAction: string;
  type: "RECEIVED_GIFT" | "PARTICIPATED" | "DISPATCHED" | "CLAIMED";
  badgeText: string;
  timeAgo: string;
  isRealDb?: boolean;
}

// 180+ unique realistic winner names who received gifts
const FIRST_NAMES = [
  "Marcus", "Sarah", "Devon", "Elena", "Tyler", "Jordan", "Brandon", "Chloe", "Anthony", "David",
  "Rachel", "Trevor", "Jasmine", "Kyle", "Samantha", "Liam", "Maya", "Carlos", "Ashley", "Austin",
  "Emily", "Justin", "Jessica", "Nicholas", "Hannah", "Dylan", "Megan", "Noah", "Brianna", "Luke",
  "Kayla", "Ethan", "Olivia", "Zachary", "Haley", "Caleb", "Lauren", "Mason", "Alyssa", "Gabriel",
  "Victoria", "Nathaniel", "Sydney", "Christian", "Taylor", "Morgan", "Logan", "Kaitlyn", "Hunter", "Savannah",
  "Austin", "Paige", "Cameron", "Makayla", "Dominic", "Brooke", "Tristan", "Destiny", "Trevor", "Abigail",
  "Gavin", "Jenna", "Chase", "Kylie", "Garrett", "Amber", "Seth", "Courtney", "Jared", "Bailey",
  "Brett", "Sierra", "Mitchell", "Kennedy", "Spencer", "Macy", "Collin", "Danielle", "Grant", "Cheyenne",
  "Dustin", "Hayden", "Kelsey", "Tanner", "Reagan", "Clayton", "Skylar", "Dalton", "Cassidy", "Devan",
  "Miranda", "Preston", "Jocelyn", "Brady", "Lexi", "Cody", "Adrianna", "Tyson", "Brittany", "Colton",
  "Katelyn", "Trey", "Jillian", "Zane", "Kendall", "Bryson", "Carla", "Keaton", "Ariana", "Darius",
  "Holly", "Jaxson", "Giselle", "Ronan", "Kiera", "Jett", "Selena", "Tatum", "Damian", "Vanessa",
  "Elijah", "Julian", "Amira", "Kendrick", "Camila", "Declan", "Penelope", "Bryce", "Zoe", "Landon",
  "Nadia", "Roman", "Tessa", "Kai", "Alina", "Mateo", "Gia", "Hudson", "Elise", "Xander",
  "Callie", "Tobias", "Farrah", "Colby", "Sienna", "Beckett", "Freya", "Dante", "Emery", "Koa",
  "Leona", "Nico", "Wren", "Soren", "Gwen", "Rory", "Veda", "Gideon", "Quinn", "Asher",
  "Silas", "Rowan", "Piper", "Everett", "Jasper", "Stella", "Jonah", "Sawyer", "Milo", "Genevieve"
];

const LAST_NAMES = [
  "Turner", "Jenkins", "Washington", "Rodriguez", "Kowalski", "Reed", "Kelly", "Miller", "Brooks", "Peterson",
  "Adams", "Vance", "Taylor", "Henderson", "Hayes", "O'Connor", "Patel", "Morales", "Bennett", "Wright",
  "Carter", "Coleman", "Morris", "Diaz", "Scott", "Ross", "Phillips", "Campbell", "Mitchell", "Ramirez",
  "Foster", "Simmons", "Howard", "Cox", "Richardson", "Ward", "Watson", "Price", "Hughes", "Flores",
  "Butler", "Long", "Gray", "Barnes", "Powell", "Rivera", "Cooper", "Murphy", "Bailey", "Evans",
  "Collins", "Stewart", "Sanchez", "Rogers", "Morgan", "Wood", "Patterson", "Griffin", "Russell", "Bryant",
  "Alexander", "Torres", "Bell", "Perry", "Sanders", "Thorne", "Stone", "Cole", "Ortiz", "Shaw",
  "Grant", "Montgomery", "Fletcher", "Pierce", "Sullivan", "Mercer", "Higgins", "Sterling", "Cross", "Silva",
  "Navarro", "Frost", "Hartman", "Young", "Rhodes", "Quinn", "Ruiz", "Holt", "Vaughn", "Larson",
  "Holloway", "Callahan", "Ramsey", "Drake", "Bynum", "Conner", "Witherspoon", "Waddle", "Smith", "Johnson"
];

const CITIES = [
  "Seattle, WA", "Dallas, TX", "Chicago, IL", "Miami, FL", "Green Bay, WI", "Philadelphia, PA",
  "Minneapolis, MN", "San Francisco, CA", "Denver, CO", "Boston, MA", "Detroit, MI", "Atlanta, GA",
  "Baltimore, MD", "Kansas City, MO", "Pittsburgh, PA", "Houston, TX", "Los Angeles, CA", "Cincinnati, OH",
  "Jacksonville, FL", "Nashville, TN", "Buffalo, NY", "Las Vegas, NV", "Phoenix, AZ", "Charlotte, NC",
  "Indianapolis, IN", "New Orleans, LA", "Tampa, FL", "Cleveland, OH", "Austin, TX", "Orlando, FL",
  "San Antonio, TX", "Columbus, OH", "San Diego, CA", "Portland, OR", "Louisville, KY", "Memphis, TN"
];

const PRIZES = [
  "Signed Player Jersey + 1,000 Gridiron",
  "Autographed Speed Pro Helmet",
  "Official Game-Worn Signed Cleats",
  "VIP Sideline & Tunnel Pass",
  "Signed Limited NFL Football",
  "Official Custom Framed Jersey",
  "Club Suite Hospitality Passes",
  "Autographed Rookie Card & Mini-Helmet",
  "50-Yard Line Game Day Tickets",
  "Official Autographed Game Ball",
  "Hall of Fame VIP Tour + Jersey",
  "Field-Level 4x Lower Bowl Passes"
];

const BADGE_STATUSES = [
  "Received Gift · FedEx Signed",
  "Received Gift · UPS Express",
  "Received Gift · Delivered",
  "Received Gift · Priority Tracked",
  "Received Gift · DHL Express",
  "Received Gift · Verified & Claimed"
];

const TEAMS = [
  "KC", "PHI", "DET", "BAL", "BUF", "SF", "DAL", "MIA", "CIN", "GB",
  "MIN", "SEA", "HOU", "PIT", "CHI", "DEN", "TB", "ATL", "LV", "LAC",
  "JAX", "IND", "NO", "CLE", "WAS", "ARI", "NE", "NYG", "TEN", "CAR"
];

// Generate 180 initial diverse winners who won and received gifts
const generateInitialWinners = (): WinnerEvent[] => {
  const list: WinnerEvent[] = [];
  for (let i = 0; i < 180; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const city = CITIES[(i * 2 + 3) % CITIES.length];
    const prize = PRIZES[(i * 5 + 1) % PRIZES.length];
    const badge = BADGE_STATUSES[(i * 7 + 2) % BADGE_STATUSES.length];
    const team = TEAMS[(i * 4 + 1) % TEAMS.length];
    const mins = Math.max(1, (i * 4) % 180);
    const timeAgo = mins < 60 ? `${mins}m ago` : `${Math.floor(mins / 60)}h ago`;

    list.push({
      id: `gen-w-${i}`,
      name: `${fn} ${ln[0]}.`,
      city: city,
      teamId: team,
      prizeOrAction: prize,
      type: "RECEIVED_GIFT",
      badgeText: badge,
      timeAgo: timeAgo,
      isRealDb: false
    });
  }
  return list;
};

const isBlockedName = (str?: string): boolean => {
  if (!str) return false;
  const lower = str.toLowerCase();
  return lower.includes("ovwigho");
};

// Shuffle helper
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface WinnerTickerProps {
  onCheckWinnerClick?: () => void;
  onTrackInquiryClick?: () => void;
  onCustomerCareClick?: () => void;
}

export const WinnerTicker: React.FC<WinnerTickerProps> = ({ 
  onCheckWinnerClick,
  onTrackInquiryClick,
  onCustomerCareClick 
}) => {
  const [events, setEvents] = useState<WinnerEvent[]>(() => shuffleArray(generateInitialWinners()));
  const [isPaused, setIsPaused] = useState(false);
  const realWinnersRef = useRef<WinnerEvent[]>([]);

  // 1. Listen for real database winners and seamlessly interleave them
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "giveaway_winners"), (snap) => {
      const realList: WinnerEvent[] = [];
      snap.forEach((d) => {
        const w = d.data() as GiveawayWinner;
        if (
          w.winnerName &&
          !isBlockedName(w.winnerName) &&
          !isBlockedName(w.winnerEmail) &&
          !isBlockedName(w.prizeName)
        ) {
          const initials = w.winnerName.trim().split(" ");
          const displayName = initials.length > 1 ? `${initials[0]} ${initials[1][0]}.` : w.winnerName;
          realList.push({
            id: `real-${d.id}`,
            name: displayName,
            city: "Verified Fan",
            teamId: "NFL",
            prizeOrAction: w.prizeName || w.giveawayTitle || "Official Autographed NFL Player Jersey + 1,000 Gridiron",
            type: "RECEIVED_GIFT",
            badgeText: "Received Gift · Delivered",
            timeAgo: "Just now",
            isRealDb: true
          });
        }
      });

      realWinnersRef.current = realList;

      // Combine real winners once across the 180 generated list
      setEvents((prev) => {
        const base = prev.filter(e => !e.isRealDb);
        const combined = [...base];
        realList.forEach((rw, idx) => {
          const insertIdx = Math.min(combined.length, (idx + 1) * 20);
          combined.splice(insertIdx, 0, rw);
        });
        return combined;
      });
    });

    return () => unsub();
  }, []);

  // 2. Continuous dynamic live winner generation every 4 seconds to keep the marquee constantly refreshing
  useEffect(() => {
    const interval = setInterval(() => {
      const randomFn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const randomLn = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const randomCity = CITIES[Math.floor(Math.random() * CITIES.length)];
      const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
      const randomBadge = BADGE_STATUSES[Math.floor(Math.random() * BADGE_STATUSES.length)];
      const randomTeam = TEAMS[Math.floor(Math.random() * TEAMS.length)];

      const newWinner: WinnerEvent = {
        id: `live-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: `${randomFn} ${randomLn[0]}.`,
        city: randomCity,
        teamId: randomTeam,
        prizeOrAction: randomPrize,
        type: "RECEIVED_GIFT",
        badgeText: randomBadge,
        timeAgo: "Just now",
        isRealDb: false
      };

      setEvents((prev) => {
        // Keep list bounded around 180-200 items, pushing new live recipients to the stream
        const updated = [newWinner, ...prev.slice(0, 199)];
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-zinc-950 border-y border-white/10 overflow-hidden relative group select-none">
      {/* Background ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-600/5 via-blue-600/5 to-amber-600/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center">
        {/* Live Badge Left Header */}
        <div className="shrink-0 px-4 py-2 bg-zinc-900/95 border-r border-white/10 flex items-center justify-between md:justify-start gap-3 z-20 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap">
                LIVE DISPATCH ({events.length}+ WINNERS)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {onTrackInquiryClick && (
              <button
                onClick={onTrackInquiryClick}
                className="md:hidden px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[8px] font-black uppercase tracking-wider rounded-lg border border-white/10"
              >
                Track Ticket
              </button>
            )}
            {onCheckWinnerClick && (
              <button
                onClick={onCheckWinnerClick}
                className="md:hidden px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-black rounded-lg text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
              >
                Check Mine
              </button>
            )}
          </div>
        </div>

        {/* Scrolling Continuous Marquee Area */}
        <div
          className="flex-1 overflow-hidden relative py-2 cursor-default"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Fading side edges */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none hidden md:block" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none hidden md:block" />

          <div
            className={cn(
              "flex items-center gap-4 whitespace-nowrap will-change-transform ticker-fast-runner",
              isPaused && "ticker-paused"
            )}
          >
            {/* Duplicated list for infinite seamless loop with 360+ items */}
            {[...events, ...events].map((w, idx) => (
              <div
                key={`${w.id}-${idx}`}
                className={cn(
                  "inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all shrink-0 shadow-sm border",
                  w.isRealDb
                    ? "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-200"
                    : "bg-emerald-950/20 hover:bg-emerald-950/40 border-emerald-500/25 hover:border-emerald-500/40"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center font-black text-[10px] border shrink-0",
                  w.isRealDb
                    ? "bg-amber-500/30 text-amber-300 border-amber-400"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                )}>
                  {w.isRealDb ? "⭐" : "🎁"}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "text-xs font-black",
                    w.isRealDb ? "text-amber-300 underline decoration-amber-500/50 underline-offset-2" : "text-white"
                  )}>
                    {w.name}
                  </span>
                  <span className="text-[10px] font-medium text-zinc-400">
                    ({w.city})
                  </span>
                  <span className="text-zinc-600 font-bold">·</span>
                  <span className={cn(
                    "text-xs font-bold",
                    w.isRealDb ? "text-amber-200" : "text-emerald-300"
                  )}>
                    {w.prizeOrAction}
                  </span>
                </div>

                <span
                  className={cn(
                    "text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border whitespace-nowrap",
                    w.isRealDb
                      ? "bg-amber-500/25 text-amber-300 border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                  )}
                >
                  <PackageCheck className="w-2.5 h-2.5" />
                  {w.badgeText}
                </span>

                <span className="text-[9px] font-mono text-zinc-500">
                  {w.timeAgo}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Check & Support Actions Right Header */}
        <div className="hidden md:flex shrink-0 px-4 py-2 border-l border-white/10 bg-zinc-900/90 items-center gap-2.5 z-20">
          {onTrackInquiryClick && (
            <button
              onClick={onTrackInquiryClick}
              className="px-3 py-1 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border border-white/10 flex items-center gap-1 cursor-pointer"
            >
              <Zap className="w-2.5 h-2.5 text-blue-400" />
              Track Ticket
            </button>
          )}
          {onCheckWinnerClick && (
            <button
              onClick={onCheckWinnerClick}
              className="px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-black font-black text-[9px] uppercase tracking-wider shadow-md shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-black" />
              Check If I Won
            </button>
          )}
        </div>
      </div>

      {/* Global CSS for seamless continuous fast marquee */}
      <style>{`
        @keyframes tickerScrollContinuous {
          0% {
            -webkit-transform: translate3d(0, 0, 0);
            transform: translate3d(0, 0, 0);
          }
          100% {
            -webkit-transform: translate3d(-50%, 0, 0);
            transform: translate3d(-50%, 0, 0);
          }
        }
        .ticker-fast-runner {
          -webkit-animation: tickerScrollContinuous 40s linear infinite;
          animation: tickerScrollContinuous 40s linear infinite;
        }
        .ticker-paused {
          -webkit-animation-play-state: paused !important;
          animation-play-state: paused !important;
        }
        .ticker-fast-runner:hover {
          -webkit-animation-play-state: paused;
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
};
