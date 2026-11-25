import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  AlertCircle,
  ArrowDown,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  FileText,
  Headphones,
  Heart,
  HeartHandshake,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Ticket,
  Trophy,
  User,
  UserCheck,
} from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../lib/firebase";
import stadiumHeroImg from "../assets/images/stadium_vip_hospitality_1794821884684.jpg";
import charityYouthImg from "../assets/images/charity_youth_mentorship_1794821885584.jpg";
import { NFLImage } from "../utils/nflImages";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { SupportTrustSection } from "./SupportTrustSection";
import { GridironBrandMark, CHARITY_ALLOCATION } from "./common/GridironBrandMark";
import type { LegalTabId } from "./LegalPoliciesModal";
import {
  findCustomerInquirySessions,
  getSavedGuestSessions,
  PaymentMethodType,
  PaymentSession,
  SAVED_SESSIONS_EVENT,
} from "../services/paymentControlService";

export interface PlayerInquiryPrefill {
  playerName?: string;
  teamId?: string;
  objective?: string;
  fullName?: string;
  email?: string;
  messagingPlatform?: "whatsapp" | "zangi" | "telegram";
  messagingDetails?: string;
  skipToPayment?: boolean;
  resumeSessionId?: string;
  resumePaymentMethod?: PaymentMethodType;
  initialMode?: "new" | "check_existing";
}

interface CharityRecordEntry {
  id: string;
  beneficiary: string;
  periodLabel: string;
  allocatedAmount: number;
  disbursedAmount?: number;
  status: "earmarked" | "scheduled" | "transferred" | "verified";
  transferMethod?: string;
  transferReference?: string;
  notes?: string;
  createdAt?: number;
  transferredAt?: number;
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
  "Public Meet & Greet — December 26th ($100)",
  "1-on-1 Private Encounter & Photo Op",
  "Autograph & Certified Memorabilia",
  "VIP Game Day Sideline & Tunnel Pass",
  "Custom Video Shoutout / Cameo",
  "Live Podcast or Studio Guest Appearance",
];

interface LandingShowcaseProps {
  shopItems: Array<{ id: string; name: string; price: number; description: string; image: string }>;
  onExploreExperiences: () => void;
  onDiscoverGameDay: () => void;
  onOpenTrackInquiry: () => void;
  onSelectExperience: (targetId: string) => void;
  onOpenPlayerInquiry: (prefill?: PlayerInquiryPrefill) => void;
  onOpenCustomerCare: () => void;
  onOpenTicketCheck: () => void;
  onOpenSignIn: () => void;
  onOpenLegalModal: (tab: LegalTabId) => void;
  onOpenCeeDeeExperience?: () => void;
  onOpenWaddleVipCard?: () => void;
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
  videoUrl?: string;
  experienceHighlights: string[];
  availabilityLabel: string;
  isConfirmedSchedule: boolean;
  priceLabel: string;
  actionLabel: string;
  actionType: "experience" | "shop" | "inquiry" | "ceedee" | "waddle";
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
    id: "star-jaylen-waddle",
    expId: "jaylen-waddle-vip-fan-card",
    filterKey: "meet_greet",
    title: "Jaylen Waddle (#17)",
    playerOrSubtitle: "Exclusive VIP Fan Card · Season 2026",
    teamId: "DEN",
    teamName: "Denver Broncos",
    city: "Denver, CO",
    imageUrl: "/assets/aistudio/IMG_1602_16c645b7.webp",
    experienceHighlights: ["VIP Fan Membership", "Flexible $1,000 Plan", "$350 Deposit Option"],
    availabilityLabel: "Season 2026 · VIP Access",
    isConfirmedSchedule: true,
    priceLabel: "$1,000",
    actionLabel: "View VIP Fan Card ($1,000)",
    actionType: "waddle",
  },
  {
    id: "star-ceedee-lamb",
    expId: "exp-ceedee-lamb-dec27",
    filterKey: "meet_greet",
    title: "CeeDee Lamb (Private VIP)",
    playerOrSubtitle: "Private Meet & Greet · Stadium Tour · Signed Merch",
    teamId: "DAL",
    teamName: "Dallas Cowboys",
    city: "Arlington, TX",
    imageUrl: "/assets/aistudio/IMG_1832_f33e4b9e.jpeg",
    videoUrl: "/assets/ceedee_lamb_meet_greet.mp4",
    experienceHighlights: ["December 27, 2026", "AT&T Stadium Tour", "$500 + $500 Option"],
    availabilityLabel: "December 27, 2026",
    isConfirmedSchedule: true,
    priceLabel: "$1,000",
    actionLabel: "Secure Experience ($1,000)",
    actionType: "ceedee",
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
    teamName: "Gridiron Arena Shop",
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
  shopItems,
  onExploreExperiences,
  onDiscoverGameDay,
  onOpenTrackInquiry,
  onSelectExperience,
  onOpenPlayerInquiry,
  onOpenCustomerCare,
  onOpenTicketCheck,
  onOpenSignIn,
  onOpenLegalModal,
  onOpenCeeDeeExperience,
  onOpenWaddleVipCard,
}) => {
  const [showcaseFilter, setShowcaseFilter] = useState<"all" | "meet_greet" | "stadium_tour" | "memorabilia">("all");
  const [charityRecords, setCharityRecords] = useState<CharityRecordEntry[]>([]);

  // Top-of-page Custom Player Inquiry Quick Form State
  const [cardMode, setCardMode] = useState<"new" | "check_existing">("new");
  const [inquiryPlayer, setInquiryPlayer] = useState("");
  const [inquiryTeamId, setInquiryTeamId] = useState("DAL");
  const [inquiryObjective, setInquiryObjective] = useState(CUSTOM_INQUIRY_OBJECTIVES[0]);
  const [inquiryName, setInquiryName] = useState(() => localStorage.getItem("nfl_guest_sender_name") || "");
  const [inquiryEmail, setInquiryEmail] = useState(() => localStorage.getItem("nfl_guest_buyer_email") || "");
  const [inquiryPlatform, setInquiryPlatform] = useState<"whatsapp" | "telegram" | "zangi">("whatsapp");
  const [inquiryHandle, setInquiryHandle] = useState("");
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  // Returning Inquiry Detection & Existing Inquiry Lookup State
  const [matchedSessions, setMatchedSessions] = useState<PaymentSession[]>([]);
  const [dismissedAutoResume, setDismissedAutoResume] = useState(false);
  const [lookupQuery, setLookupQuery] = useState(() => localStorage.getItem("nfl_guest_buyer_email") || localStorage.getItem("nfl_guest_sender_name") || "");
  const [lookupResults, setLookupResults] = useState<PaymentSession[]>([]);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [hasSearchedLookup, setHasSearchedLookup] = useState(false);
  const [savedSessions, setSavedSessions] = useState(() => getSavedGuestSessions());
  const [copiedSessionKey, setCopiedSessionKey] = useState<string | null>(null);

  useEffect(() => {
    const syncSaved = () => setSavedSessions(getSavedGuestSessions());
    window.addEventListener(SAVED_SESSIONS_EVENT, syncSaved);
    return () => window.removeEventListener(SAVED_SESSIONS_EVENT, syncSaved);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "charity_records"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: CharityRecordEntry[] = [];
        snap.forEach((docSnap) => {
          const d = docSnap.data() as Omit<CharityRecordEntry, "id">;
          items.push({ id: docSnap.id, ...d });
        });
        setCharityRecords(items);
      },
      () => {
        // silent fallback if rules or offline
      }
    );
    return () => unsub();
  }, []);

  // Automatically check if returning visitor already has an awaiting / responded inquiry
  useEffect(() => {
    const emailClean = inquiryEmail.trim();
    const nameClean = inquiryName.trim();
    if (!emailClean.includes("@") && nameClean.length < 2) {
      setMatchedSessions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const found = await findCustomerInquirySessions({
          email: emailClean,
          name: nameClean,
        });
        if (!cancelled) {
          setMatchedSessions(found.filter((s) => s.status !== "completed"));
        }
      } catch {
        // silent fallback
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [inquiryEmail, inquiryName]);

  const handleRunLookup = async (overrideQuery?: string) => {
    const q = (overrideQuery ?? lookupQuery).trim();
    if (!q) return;
    setIsLookingUp(true);
    setHasSearchedLookup(true);
    try {
      const results = await findCustomerInquirySessions({
        email: q.includes("@") ? q : undefined,
        name: !q.includes("@") && !q.toUpperCase().startsWith("INQ-") && !q.toUpperCase().startsWith("PAY-") ? q : undefined,
        sessionId: q.toUpperCase().startsWith("INQ-") || q.toUpperCase().startsWith("PAY-") ? q.toUpperCase() : undefined,
      });
      setLookupResults(results);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleResumeSession = (s: PaymentSession) => {
    const cleanedPlayer = (s.itemTitle || "")
      .replace(/^Player Inquiry:\s*/i, "")
      .replace(/\s*\([A-Z]{2,3}\)\s*$/i, "")
      .trim();
    onOpenPlayerInquiry({
      playerName: cleanedPlayer || inquiryPlayer.trim() || undefined,
      teamId: inquiryTeamId,
      fullName: s.customerName || inquiryName.trim() || undefined,
      email: s.customerEmail || inquiryEmail.trim() || undefined,
      messagingPlatform: inquiryPlatform,
      messagingDetails: s.customerPhone || inquiryHandle.trim() || undefined,
      skipToPayment: true,
      resumeSessionId: s.id,
      resumePaymentMethod: s.paymentMethod,
      initialMode: "new",
    });
  };

  const handleCopyValue = (val: string, key: string) => {
    navigator.clipboard.writeText(val);
    setCopiedSessionKey(key);
    setTimeout(() => setCopiedSessionKey(null), 1800);
  };

  const visibleCards =
    showcaseFilter === "all"
      ? FEATURED_CARDS.slice(0, 6)
      : FEATURED_CARDS.filter((c) => c.filterKey === showcaseFilter);

  const handleCardClick = (card: FeaturedExperienceCard) => {
    if (card.actionType === "ceedee" && onOpenCeeDeeExperience) {
      onOpenCeeDeeExperience();
    } else if (card.actionType === "waddle" && onOpenWaddleVipCard) {
      onOpenWaddleVipCard();
    } else if (card.actionType === "shop") {
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

    if (trimmedName) localStorage.setItem("nfl_guest_sender_name", trimmedName);
    if (trimmedEmail) localStorage.setItem("nfl_guest_buyer_email", trimmedEmail);

    // If an active existing inquiry exists for these details and user didn't dismiss auto-resume, open it instead of creating a duplicate
    if (!dismissedAutoResume && matchedSessions.length > 0) {
      const top = matchedSessions[0];
      if (top.status === "details_provided" || top.status === "awaiting_admin_details") {
        handleResumeSession(top);
        return;
      }
    }

    if (!trimmedPlayer) {
      setInquiryError("Please enter or tap your favorite NFL player name to continue.");
      return;
    }

    if (trimmedEmail && !trimmedEmail.includes("@")) {
      setInquiryError("Please enter a valid email address for booking confirmation.");
      return;
    }

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
    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar bg-[#040711] text-zinc-100">
      {/* 0A. DEDICATED TOP FEATURED SPOTLIGHT: CEEDEE LAMB PUBLIC MEET & GREET (DEC 10 · $100) */}
      <section
        id="ceedee-public-spotlight"
        className="relative overflow-hidden border-b border-[#B0B7BC]/20 bg-[#030712]"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 82% 20%, rgba(0, 53, 148, 0.38) 0%, rgba(3, 7, 18, 0.96) 58%, #030712 100%)",
          }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-8 sm:py-12 lg:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-3xl border border-[#B0B7BC]/25 bg-[#040B1A]/90 backdrop-blur-xl overflow-hidden shadow-[0_28px_70px_-15px_rgba(0,53,148,0.45)]"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
              {/* Left Copy & Slot Reservation */}
              <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold uppercase tracking-[0.2em] text-[#93C5FD]">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span>Featured Event · Dallas Cowboys #88</span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-[#E2E8F0]">December 26th</span>
                    <span aria-hidden="true" className="text-zinc-600">·</span>
                    <span className="text-[#E2E8F0]">AT&amp;T Stadium, Arlington, TX</span>
                  </div>

                  <h1
                    className="font-display font-extrabold uppercase tracking-tight leading-[0.98] text-white"
                    style={{ fontSize: "clamp(2rem, 4.2vw, 3.45rem)" }}
                  >
                    CEEDÉE LAMB{" "}
                    <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#93C5FD] bg-clip-text text-transparent">
                      PUBLIC MEET &amp; GREET
                    </span>
                  </h1>

                  <p className="text-sm sm:text-base lg:text-lg text-zinc-200 leading-relaxed max-w-2xl font-medium">
                    Get ready for an unforgettable fan experience! Join us on December 26th for an exclusive opportunity to meet CeeDee Lamb in person.
                  </p>

                  {/* Event Details Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                    <div className="p-3.5 rounded-2xl bg-[#030712]/85 border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                        Event
                      </span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">
                        Public Meet &amp; Greet
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#030712]/85 border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                        Date
                      </span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">
                        December 26th
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#030712]/85 border border-white/10">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block">
                        Venue
                      </span>
                      <span className="text-sm font-extrabold text-white mt-0.5 block">
                        AT&amp;T Stadium, Arlington, TX
                      </span>
                    </div>
                    <div className="p-3.5 rounded-2xl bg-[#030712]/85 border border-[#60A5FA]/35">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#93C5FD] block">
                        Admission
                      </span>
                      <span className="font-mono text-lg font-black text-white mt-0.5 block">
                        $100 Per Ticket
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPlayerInquiry({
                          playerName: "CeeDee Lamb",
                          teamId: "DAL",
                          objective: "Public Meet & Greet — December 26th ($100)",
                          fullName: inquiryName.trim() || undefined,
                          email: inquiryEmail.trim() || undefined,
                          messagingPlatform: inquiryPlatform,
                          messagingDetails: inquiryHandle.trim() || undefined,
                        })
                      }
                      className="min-h-[54px] px-7 py-4 rounded-xl bg-gradient-to-r from-[#003594] via-[#1D4ED8] to-[#003594] hover:brightness-115 text-white border border-[#B0B7BC]/35 font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-[0_14px_34px_-8px_rgba(29,78,216,0.55)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
                    >
                      <span>SECURE YOUR SLOT — $100</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    <a
                      href="#featured-experiences"
                      className="min-h-[54px] px-5 py-3.5 rounded-xl bg-[#030712]/85 hover:bg-[#08122B] border border-white/15 text-xs sm:text-sm font-bold text-[#E2E8F0] hover:text-white inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    >
                      <ArrowDown className="w-4 h-4 text-[#60A5FA] shrink-0" />
                      <span>Explore Other Players &amp; VIP Events</span>
                    </a>
                  </div>

                  <p className="text-xs text-[#B0B7BC] font-medium">
                    Slots are limited. Secure your spot today before registration closes!
                  </p>
                </div>
              </div>

              {/* Right Image Carrier */}
              <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[340px] lg:min-h-full bg-[#02050D] border-t lg:border-t-0 lg:border-l border-white/10 overflow-hidden">
                <img
                  src="/assets/aistudio/IMG_1832_f33e4b9e.jpeg"
                  alt="CeeDee Lamb Public Meet and Greet December 26th"
                  className="w-full h-full object-cover object-[center_18%]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040B1A] via-[#040B1A]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-[#040B1A]/35 hidden lg:block" />
                <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B0B7BC] block">
                      Dallas Cowboys · #88
                    </span>
                    <span className="font-display text-2xl font-extrabold uppercase text-white">
                      CeeDee Lamb
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-2xl font-black text-white block leading-none">
                      $100
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#93C5FD]">
                      Dec 26 · AT&amp;T Stadium
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 0. CONCIERGE OFFER: $100 MEET-AND-GREET INVITATION */}
      <section
        id="custom-player-inquiry"
        className="relative overflow-hidden border-b border-white/[0.08] bg-[#040711]"
      >
        {/* Atmospheric Deep Navy & Obsidian Backdrop */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={stadiumHeroImg}
            alt="Luxury hospitality stadium lounge overlooking illuminated field"
            className="w-full h-full object-cover object-center opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040711]/92 via-[#040711]/88 to-[#040711]" />
          <div className="absolute -top-28 -left-24 w-[28rem] h-[24rem] bg-[#D50A0A]/10 blur-[130px] rounded-full" />
          <div className="absolute -bottom-28 -right-24 w-[28rem] h-[24rem] bg-[#2563EB]/18 blur-[130px] rounded-full" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Copy & Instant Player Picker */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6 space-y-5"
            >
              {/* Brand Crest & Platform Identifier */}
              <div className="flex items-center gap-3">
                <GridironBrandMark size="md" />
                <div className="text-xs sm:text-sm font-semibold text-zinc-300 leading-snug">
                  <span className="text-sky-400 font-bold">NFL Gridiron Experience</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                  <span>{CHARITY_ALLOCATION.websiteDomain}</span>
                  <span aria-hidden="true" className="mx-2 text-zinc-600">·</span>
                  <span className="text-white font-semibold">VIP Hospitality Concierge</span>
                </div>
              </div>

              {/* Primary Offer Headline */}
              <h1
                className="font-display font-extrabold uppercase tracking-tight leading-[0.98] text-white"
                style={{ fontSize: "clamp(1.95rem, 4.1vw, 3.35rem)" }}
              >
                GET AN INVITATION TO YOUR FAVORITE PLAYER&apos;S MEET &amp; GREET FOR JUST{" "}
                <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
                  $100
                </span>
              </h1>

              {/* Required Supporting Copy */}
              <p className="text-sm sm:text-base lg:text-lg text-zinc-200 leading-relaxed max-w-xl font-medium">
                Your favorite player could be closer than you think! Submit your request for an opportunity to attend an exclusive meet-and-greet experience with the player you admire. Choose your favorite player and let our team guide you through the invitation process.
              </p>

              {/* Prominent $100 Invitation CTA + Availability Disclosure */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const el = document.getElementById("hero-custom-player");
                      if (el) {
                        el.focus();
                      }
                      onOpenPlayerInquiry({
                        playerName: inquiryPlayer.trim() || undefined,
                        teamId: inquiryTeamId,
                        objective: inquiryObjective,
                        fullName: inquiryName.trim() || undefined,
                        email: inquiryEmail.trim() || undefined,
                        messagingPlatform: inquiryPlatform,
                        messagingDetails: inquiryHandle.trim() || undefined,
                      });
                    }}
                    className="min-h-[54px] px-7 py-4 rounded-xl bg-[#D50A0A] hover:bg-[#B91C1C] text-white border border-white/15 font-extrabold text-sm sm:text-base uppercase tracking-wide shadow-[0_14px_34px_-8px_rgba(213,10,10,0.45)] transition-all duration-200 hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2.5 whitespace-nowrap"
                  >
                    <span>GET YOUR INVITATION – $100</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <a
                    href="#charitable-initiative"
                    className="min-h-[54px] px-5 py-3.5 rounded-xl bg-[#080F22]/90 hover:bg-[#013369] border border-white/[0.1] text-xs sm:text-sm font-bold text-sky-200 hover:text-white inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                  >
                    <HeartHandshake className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>Includes $25 Youth Charity Allocation</span>
                  </a>
                </div>

                {/* Mandatory Availability & Fee-Split Transparency Note */}
                <div className="p-3.5 rounded-xl bg-[#080F22]/75 border border-white/[0.08] text-xs text-zinc-300 leading-relaxed space-y-1.5">
                  <p>
                    <strong className="text-sky-400">Invitation Availability Notice:</strong> Invitations are subject to player availability, confirmed events, and authorized arrangements. Once reviewed, a direct message will be sent to you with details for the next available invite.
                  </p>
                  <p className="text-zinc-400">
                    Transparent $100 Breakdown: <strong className="text-white">${CHARITY_ALLOCATION.coordinationFeeUsd}</strong> Hospitality Coordination Fee +{" "}
                    <strong className="text-emerald-400">${CHARITY_ALLOCATION.charitableContributionUsd}</strong> Earmarked Contribution toward{" "}
                    <strong className="text-zinc-200">{CHARITY_ALLOCATION.beneficiary}</strong>.
                  </p>
                </div>
              </div>

              {/* 1-Tap Popular Star Prefill Bar */}
              <div className="pt-1 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Popular Player Requests — Tap to Auto-Fill:
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
                            ? "bg-[#2563EB] border-blue-400 text-white shadow-lg shadow-blue-900/35"
                            : "bg-[#080F22]/85 hover:bg-[#013369]/60 border-white/[0.08] text-zinc-200"
                        }`}
                      >
                        <span>{star.name}</span>
                        <span className={`text-[11px] font-mono ${isSelected ? "text-sky-200" : "text-zinc-400"}`}>
                          ({star.teamId})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Navigation Anchors */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs font-semibold text-zinc-400">
                <a
                  href="#featured-experiences"
                  className="inline-flex items-center gap-1.5 text-sky-400 hover:text-white transition-colors"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                  <span>Explore Roster &amp; Stadium Tours</span>
                </a>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <button
                  type="button"
                  onClick={onDiscoverGameDay}
                  className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                  <span>Browse Arena Shop</span>
                </button>
              </div>
            </motion.div>

            {/* Right Interactive Meet & Greet Invitation Request Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-6"
            >
              <div className="bg-[#080F22]/95 backdrop-blur-xl border border-white/[0.1] rounded-3xl p-5 sm:p-7 shadow-[0_24px_60px_-15px_rgba(3,5,12,0.9)] space-y-4">
                {/* Form Header */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#03050C] border border-white/15 p-1.5 flex items-center justify-center shrink-0">
                      <img
                        src={getLogoUrl(selectedInquiryTeam.id)}
                        alt={selectedInquiryTeam.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-extrabold uppercase tracking-tight text-white truncate">
                        Meet &amp; Greet Invitation Request
                      </h2>
                      <p className="text-xs text-zinc-400 truncate">
                        {selectedInquiryTeam.city} {selectedInquiryTeam.name} · Concierge Managed
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xl sm:text-2xl font-black text-white leading-none">
                      $100
                    </p>
                    <p className="text-[11px] font-semibold text-sky-300 mt-0.5">
                      $75 Fee · $25 BGCA
                    </p>
                  </div>
                </div>

                {/* Mode Tabs: New Inquiry vs Already Started? Check Vendor Response */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCardMode("new")}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      cardMode === "new"
                        ? "bg-blue-600 border-blue-400 text-white shadow-md"
                        : "bg-[#040714] border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 shrink-0" />
                    <span>New Player Inquiry</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCardMode("check_existing");
                      const preQ = (inquiryEmail || inquiryName || "").trim();
                      if (preQ && !hasSearchedLookup) {
                        setLookupQuery(preQ);
                        handleRunLookup(preQ);
                      }
                    }}
                    className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wide border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      cardMode === "check_existing"
                        ? "bg-emerald-500 border-emerald-400 text-zinc-950 shadow-md"
                        : "bg-[#040714] border-emerald-500/35 text-emerald-300 hover:text-white"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Already Started? Check Details
                      {matchedSessions.length > 0 ? ` (${matchedSessions.length})` : ""}
                    </span>
                  </button>
                </div>

                {cardMode === "check_existing" ? (
                  <div className="space-y-4">
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Already submitted your info and awaiting vendor details? Enter the <strong className="text-white">Email Address, Full Name, or Reference ID</strong> you used earlier to check if vendors have responded—without starting a new inquiry.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={lookupQuery}
                        onChange={(e) => setLookupQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleRunLookup();
                          }
                        }}
                        placeholder="Email, Name, or Ref ID (e.g. INQ-...)"
                        className="flex-1 min-h-[46px] bg-[#040714] border border-white/15 focus:border-emerald-400 rounded-2xl px-3.5 py-2.5 text-[16px] sm:text-sm font-semibold text-white placeholder-zinc-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRunLookup()}
                        disabled={isLookingUp || !lookupQuery.trim()}
                        className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                      >
                        {isLookingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                        <span>{isLookingUp ? "Checking..." : "Check Response"}</span>
                      </button>
                    </div>

                    {savedSessions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[11px] font-bold text-zinc-400">Saved on this device:</span>
                        {savedSessions.slice(0, 3).map((ss) => (
                          <button
                            key={ss.id}
                            type="button"
                            onClick={() => {
                              setLookupQuery(ss.customerEmail || ss.id);
                              handleRunLookup(ss.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-[#040714] hover:bg-zinc-900 border border-white/15 text-[11px] font-mono text-sky-300 cursor-pointer inline-flex items-center gap-1"
                          >
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{ss.id}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {isLookingUp ? (
                      <div className="py-8 text-center space-y-2">
                        <RefreshCw className="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
                        <p className="text-xs font-bold uppercase text-zinc-400">Checking live vendor dispatch queue...</p>
                      </div>
                    ) : hasSearchedLookup && lookupResults.length === 0 ? (
                      <div className="p-4 rounded-2xl bg-[#040714] border border-white/10 text-center space-y-2">
                        <p className="text-xs font-bold text-white">No inquiry found matching &ldquo;{lookupQuery}&rdquo;.</p>
                        <p className="text-[11px] text-zinc-400">Check your spelling or switch back to New Player Inquiry.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                        {lookupResults.map((s) => {
                          const hasVendorDetails = Boolean(
                            s.adminPaymentDetails &&
                              (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)
                          );
                          const isSubmitted = s.status === "payment_submitted" || s.status === "completed";
                          const elapsedMins = s.createdAt ? Math.max(0, Math.floor((Date.now() - s.createdAt) / 60000)) : 0;
                          const handleVal =
                            s.adminPaymentDetails?.identifier ||
                            s.adminPaymentDetails?.accountNumber ||
                            s.adminPaymentDetails?.bankName ||
                            "";

                          return (
                            <div
                              key={s.id}
                              className={`p-4 rounded-2xl border space-y-2.5 ${
                                hasVendorDetails && !isSubmitted
                                  ? "bg-emerald-500/10 border-emerald-500/40"
                                  : isSubmitted
                                  ? "bg-amber-500/10 border-amber-500/30"
                                  : "bg-[#040714] border-sky-500/30"
                              }`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                                    hasVendorDetails && !isSubmitted
                                      ? "bg-emerald-500 text-zinc-950"
                                      : isSubmitted
                                      ? "bg-amber-500/20 text-amber-300"
                                      : "bg-sky-500/20 text-sky-300"
                                  }`}
                                >
                                  {hasVendorDetails && !isSubmitted
                                    ? "VENDOR RESPONDED · DETAILS READY"
                                    : isSubmitted
                                    ? "PAYMENT PROOF SUBMITTED"
                                    : `AWAITING VENDOR (${elapsedMins}m)`}
                                </span>
                                <span className="text-[11px] font-mono text-zinc-400">{s.id}</span>
                              </div>

                              <div>
                                <p className="text-xs font-extrabold uppercase text-white">{s.itemTitle || "Custom Player Inquiry"}</p>
                                <p className="text-[11px] text-zinc-300">
                                  {s.customerName} · <span className="uppercase font-bold">{s.paymentMethod}</span> · ${Number(s.amount || 100).toLocaleString()}
                                </p>
                              </div>

                              {hasVendorDetails && handleVal && !isSubmitted && (
                                <div className="p-2.5 rounded-xl bg-zinc-950 border border-emerald-500/30 flex items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <span className="text-[9px] font-black uppercase text-zinc-400 block">Vendor Payment Destination</span>
                                    <span className="text-xs font-mono font-black text-emerald-400 break-all">{handleVal}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyValue(handleVal, s.id)}
                                    className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold text-white shrink-0 cursor-pointer inline-flex items-center gap-1"
                                  >
                                    {copiedSessionKey === s.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                    <span>{copiedSessionKey === s.id ? "Copied" : "Copy"}</span>
                                  </button>
                                </div>
                              )}

                              {Array.isArray(s.messages) && s.messages.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-zinc-950 border border-sky-500/25 text-[11px]">
                                  <span className="text-[9px] font-black uppercase text-sky-300 block">
                                    Concierge Note ({s.messages.length})
                                  </span>
                                  <p className="text-zinc-200 line-clamp-2 mt-0.5">{s.messages[s.messages.length - 1].body}</p>
                                </div>
                              )}

                              <div className="flex flex-wrap items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleResumeSession(s)}
                                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <span>
                                    {hasVendorDetails && !isSubmitted
                                      ? "Open Vendor Details & Upload Receipt"
                                      : "Resume Awaiting Screen & Messages"}
                                  </span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={onOpenTicketCheck}
                                  className="px-3 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-300 text-[11px] font-bold uppercase inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <ExternalLink className="w-3 h-3" /> Full Portal
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleCustomInquirySubmit} className="space-y-4">
                    {/* Auto-Detected Returning Inquiry Banner */}
                    {matchedSessions.length > 0 && !dismissedAutoResume && (() => {
                      const top = matchedSessions[0];
                      const hasVendorDetails = Boolean(
                        top.adminPaymentDetails &&
                          (top.adminPaymentDetails.identifier || top.adminPaymentDetails.accountNumber || top.adminPaymentDetails.bankName)
                      );
                      return (
                        <div
                          className={`p-3.5 rounded-2xl border space-y-2 ${
                            hasVendorDetails
                              ? "bg-emerald-500/15 border-emerald-400/50"
                              : "bg-sky-500/15 border-sky-400/40"
                          }`}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider ${
                                hasVendorDetails ? "text-emerald-300" : "text-sky-300"
                              }`}
                            >
                              {hasVendorDetails
                                ? "Existing Inquiry Found · Vendor Responded!"
                                : "Existing Inquiry Found · Awaiting Vendor Details"}
                            </span>
                            <span className="text-[11px] font-mono text-zinc-300">{top.id}</span>
                          </div>
                          <p className="text-xs text-zinc-200 leading-snug">
                            We found your existing inquiry for{" "}
                            <strong className="text-white">{top.itemTitle || "Custom Player Inquiry"}</strong> ({top.customerEmail}).{" "}
                            {hasVendorDetails
                              ? "Vendor payment details are ready to view now."
                              : "Your session is active—check live vendor status and messages instead of starting over."}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleResumeSession(top)}
                              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{hasVendorDetails ? "Open & View Vendor Response" : "Resume Awaiting Details"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDismissedAutoResume(true)}
                              className="text-[11px] font-bold text-zinc-300 hover:text-white underline cursor-pointer px-2 py-1"
                            >
                              Start Separate New Inquiry
                            </button>
                          </div>
                        </div>
                      );
                    })()}

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

                    {/* Primary Meet & Greet CTA Button */}
                    <button
                      type="submit"
                      className="w-full min-h-[54px] px-6 py-4 rounded-xl bg-[#D50A0A] hover:bg-[#B91C1C] text-white border border-white/15 font-extrabold text-sm sm:text-base uppercase tracking-wide shadow-[0_14px_34px_-8px_rgba(213,10,10,0.45)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center justify-center gap-2.5"
                    >
                      <span>GET YOUR INVITATION – $100</span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>

                    {/* Form Trust & Status Links Footer */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
                      <span className="inline-flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span>Secure Checkout · Direct Invite Messaging</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setCardMode("check_existing");
                            const preQ = (inquiryEmail || inquiryName || "").trim();
                            if (preQ) {
                              setLookupQuery(preQ);
                              handleRunLookup(preQ);
                            }
                          }}
                          className="text-emerald-300 hover:text-emerald-200 font-semibold transition-colors cursor-pointer"
                        >
                          Already Started? Check Vendor Details
                        </button>
                        <button
                          type="button"
                          onClick={onOpenTrackInquiry}
                          className="text-sky-400 hover:text-white font-semibold transition-colors cursor-pointer"
                        >
                          Track Request
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
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
          {/* Deep Black, Midnight Navy & Formal NFL Blue/Crimson Atmospheric Overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#03050C]/90 via-[#050816]/65 to-[#03050C]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#03050C]/95 via-[#050816]/60 to-transparent" />
          <div className="absolute -top-32 left-1/4 w-[36rem] h-[24rem] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[32rem] h-[22rem] bg-[#D50A0A]/15 blur-[140px] rounded-full pointer-events-none" />
        </motion.div>

        {/* Hero Foreground Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-5 sm:px-8 lg:px-12 py-14 sm:py-24">
          <motion.div
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl"
          >
            {/* Brand Crest & Platform Identifier */}
            <div className="flex items-center gap-4 mb-6">
              <GridironBrandMark size="lg" />
              <div className="text-xs sm:text-sm font-semibold tracking-wide text-sky-400">
                <span>Gridiron Hospitality Platform</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span className="text-zinc-200">All 32 Teams</span>
                <span aria-hidden="true" className="mx-2 text-zinc-500">·</span>
                <span className="text-zinc-300">Verified Experiences &amp; Memorabilia</span>
              </div>
            </div>

            {/* Stadium Showcase Headline */}
            <h2
              className="font-display font-extrabold uppercase tracking-tight leading-[0.94] text-white mb-6"
              style={{ fontSize: "clamp(2.5rem, 5.8vw, 5.25rem)" }}
            >
              GET CLOSER TO THE GAME.
              <br />
              <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
                EXPERIENCE MORE.
              </span>
            </h2>

            {/* Supporting Copy */}
            <p className="text-base sm:text-lg md:text-xl text-zinc-200 max-w-2xl font-medium leading-relaxed mb-9">
              Discover unforgettable football hospitality experiences, invitation opportunities to meet-and-greet events, authentic memorabilia, and stadium access passes.
            </p>

            {/* Primary & Secondary CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-10">
              <button
                type="button"
                onClick={onExploreExperiences}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[52px] rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white border border-blue-400/25 font-extrabold text-sm sm:text-base tracking-wide shadow-[0_14px_40px_-10px_rgba(37,99,235,0.45)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <span>EXPLORE EXPERIENCES</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>

              <button
                type="button"
                onClick={onDiscoverGameDay}
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 min-h-[52px] rounded-xl bg-[#080F22]/90 hover:bg-[#013369] border border-white/[0.1] hover:border-blue-400/50 backdrop-blur-md text-white font-bold text-sm sm:text-base tracking-wide shadow-xl transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer whitespace-nowrap"
              >
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>VISIT THE ARENA SHOP</span>
              </button>
            </div>

            {/* Direct Navigation Assurances */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-xs sm:text-sm text-zinc-300 font-medium">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />
                Encrypted Hosted Checkout
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                Digital QR Passes &amp; COA Gear
              </span>
              <button
                type="button"
                onClick={() => onOpenPlayerInquiry()}
                className="inline-flex items-center gap-2 text-sky-300 hover:text-white transition-colors cursor-pointer"
              >
                <Heart className="w-4 h-4 text-[#D50A0A] shrink-0" />
                <span>GET YOUR INVITATION – $100</span>
              </button>
              {onOpenCeeDeeExperience && (
                <button
                  type="button"
                  onClick={onOpenCeeDeeExperience}
                  className="inline-flex items-center gap-2 text-[#F3D97D] hover:text-white transition-colors cursor-pointer"
                >
                  <Trophy className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>CEEDÉE LAMB DEC 27 EXPERIENCE</span>
                </button>
              )}
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
              className="font-display font-extrabold uppercase tracking-tight text-white leading-[0.98]"
              style={{ fontSize: "clamp(2rem, 4.4vw, 3.5rem)" }}
            >
              MEET THE STARS.{" "}
              <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
                LIVE THE EXPERIENCE.
              </span>
            </h2>
            <p className="text-sm sm:text-base text-zinc-300 mt-3 leading-relaxed">
              Reserve confirmed stadium tours and training camp credentials immediately, or coordinate exclusive meet-and-greets, autographs, sideline access, and photo opportunities.
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="inline-flex flex-wrap items-center gap-1.5 p-1.5 bg-[#080F22] border border-white/[0.08] rounded-2xl self-start">
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
                    ? "bg-[#2563EB] text-white shadow-md shadow-blue-600/25"
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
              className="group relative bg-[#080F22] border border-white/[0.08] hover:border-blue-400/50 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 cursor-pointer shadow-2xl"
            >
              {/* Photo / Video Container */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                {card.videoUrl ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster={card.imageUrl}
                    preload="metadata"
                    className="w-full h-full object-cover object-[center_20%] transition-transform duration-500 group-hover:scale-105"
                  >
                    <source src={card.videoUrl} type="video/mp4" />
                    <source src="/assets/aistudio/8da36c2f93d942ae940bac3b1a95872d_bf09d367.mov" type="video/quicktime" />
                  </video>
                ) : (
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
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080F22] via-[#080F22]/20 to-transparent" />

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
                        card.isConfirmedSchedule ? "text-emerald-400" : "text-sky-300"
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

        {/* Meet & Greet $100 Invitation Banner */}
        <div className="mt-10 rounded-3xl bg-gradient-to-r from-[#08112B] via-[#050816] to-[#013369]/40 border border-[#013369]/70 p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-wider">
              <Award className="w-4 h-4 text-sky-400" />
              <span>$100 Meet &amp; Greet Invitation · Direct Notification</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white">
              GET AN INVITATION TO YOUR FAVORITE PLAYER&apos;S MEET &amp; GREET FOR JUST $100
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Invitations are subject to player availability, confirmed events, and authorized arrangements. Once reviewed, we send you a direct message for the next available invite. Includes a{" "}
              <strong className="text-white">${CHARITY_ALLOCATION.coordinationFeeUsd} coordination fee</strong> and a{" "}
              <strong className="text-emerald-400">${CHARITY_ALLOCATION.charitableContributionUsd} earmarked contribution to Boys &amp; Girls Clubs of America</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenPlayerInquiry()}
            className="px-7 py-4 min-h-[50px] rounded-xl bg-[#D50A0A] hover:bg-[#B91C1C] text-white border border-white/15 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-red-900/35 shrink-0 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>GET YOUR INVITATION – $100</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 2B. DEDICATED CHARITABLE INITIATIVE: BOYS & GIRLS CLUBS OF AMERICA */}
      <section
        id="charitable-initiative"
        className="py-16 sm:py-22 px-5 sm:px-8 bg-[#050816] border-y border-[#013369]/60"
      >
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Editorial Visual */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-[#013369]/70 bg-[#03050C] shadow-2xl">
                <img
                  src={charityYouthImg}
                  alt="Youth mentorship and community education workshop"
                  className="w-full aspect-[16/10] lg:aspect-[4/3] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#03050C] via-[#03050C]/30 to-transparent" />
                <div className="p-5 sm:p-6 relative -mt-12 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-sky-400">
                    Beneficiary Organization
                  </p>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {CHARITY_ALLOCATION.beneficiary}
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Supports young people nationwide through education, mentorship, leadership development, and safe community programs.
                  </p>
                </div>
              </div>
            </div>

            {/* Initiative Mission & Financial Transparency */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
                  Community &amp; Youth Development Initiative
                </p>
                <h2
                  className="font-display font-extrabold italic uppercase tracking-tight text-white leading-[0.98]"
                  style={{ fontSize: "clamp(2rem, 4.2vw, 3.25rem)" }}
                >
                  MAKE YOUR FAN EXPERIENCE COUNT
                </h2>
                <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
                  Be part of something bigger than the game. Through our charitable initiative, we aim to support young people by contributing towards education, mentorship and community development.
                </p>
              </div>

              {/* Transparent Split Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-[#03050C] border border-white/10 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    Total Invitation Fee
                  </span>
                  <p className="font-mono text-2xl font-black text-white">
                    ${CHARITY_ALLOCATION.invitationTotalUsd}.00
                  </p>
                  <p className="text-[11px] text-zinc-400">Paid per concierge invitation</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#03050C] border border-[#013369]/60 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-300">
                    Platform Event Fee
                  </span>
                  <p className="font-mono text-2xl font-black text-sky-400">
                    ${CHARITY_ALLOCATION.coordinationFeeUsd}.00
                  </p>
                  <p className="text-[11px] text-zinc-400">Coordination &amp; verification operations</p>
                </div>

                <div className="p-4 rounded-2xl bg-[#03050C] border border-emerald-500/35 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Allocated to Charity
                  </span>
                  <p className="font-mono text-2xl font-black text-emerald-400">
                    ${CHARITY_ALLOCATION.charitableContributionUsd}.00
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    {CHARITY_ALLOCATION.charitablePercent}% to Boys &amp; Girls Clubs of America
                  </p>
                </div>
              </div>

              {/* How Transfers Work & Legal Honesty Notice */}
              <div className="p-5 rounded-2xl bg-[#03050C]/90 border border-white/10 space-y-3 text-xs sm:text-sm text-zinc-300 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <HeartHandshake className="w-4 h-4 text-sky-400" />
                      How Contributions Are Transferred
                    </p>
                    <p className="text-xs text-zinc-300">
                      Each verified paid invitation automatically records a ${CHARITY_ALLOCATION.charitableContributionUsd}.00 allocation in our ledger. Contributions are pooled and transferred monthly via consolidated organizational disbursement to Boys &amp; Girls Clubs of America.
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-sky-400" />
                      Independence &amp; Disclosure
                    </p>
                    <p className="text-xs text-zinc-300">
                      {CHARITY_ALLOCATION.operatorLegalName} operates this initiative independently and does not claim an official partnership or endorsement agreement with Boys &amp; Girls Clubs of America. Because $75 covers concierge event fees, the full $100 is not represented as a 100% pass-through donation.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">
                    Full donation accounting rules &amp; disbursement documentation available anytime.
                  </span>
                  <button
                    type="button"
                    onClick={() => onOpenLegalModal("charity")}
                    className="text-xs font-bold text-sky-400 hover:text-white inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Read Full Charitable Initiative Policy</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Available Public Donation & Disbursement Ledger */}
          <div className="rounded-2xl bg-[#03050C] border border-white/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Available Charitable Donation &amp; Disbursement Records
                </h3>
                <p className="text-xs text-zinc-400">
                  Live ledger summarizing verified allocations and monthly organizational transfers to {CHARITY_ALLOCATION.beneficiary}.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-sky-400">
                {charityRecords.length} Recorded Batch{charityRecords.length === 1 ? "" : "es"}
              </span>
            </div>

            {charityRecords.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-400">
                Disbursement batches appear here automatically as administrators reconcile verified monthly transfers to Boys &amp; Girls Clubs of America.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#08112B]/80 text-zinc-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 font-bold">Period / Batch</th>
                      <th className="px-5 py-3 font-bold">Beneficiary</th>
                      <th className="px-5 py-3 font-bold">Allocated</th>
                      <th className="px-5 py-3 font-bold">Disbursed</th>
                      <th className="px-5 py-3 font-bold">Transfer Method / Ref</th>
                      <th className="px-5 py-3 font-bold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-zinc-200">
                    {charityRecords.slice(0, 6).map((rec) => (
                      <tr key={rec.id} className="hover:bg-white/[0.02]">
                        <td className="px-5 py-3.5 font-semibold text-white">{rec.periodLabel}</td>
                        <td className="px-5 py-3.5">{rec.beneficiary}</td>
                        <td className="px-5 py-3.5 font-mono text-zinc-300">
                          ${Number(rec.allocatedAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                          ${Number(rec.disbursedAmount ?? rec.allocatedAmount ?? 0).toFixed(2)}
                        </td>
                        <td className="px-5 py-3.5 text-zinc-400">
                          {rec.transferMethod || "ACH / Direct"}
                          {rec.transferReference ? ` · ${rec.transferReference}` : ""}
                        </td>
                        <td className="px-5 py-3.5 uppercase font-bold text-[11px] text-sky-400">
                          {rec.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 3. ARENA SHOP & GAME DAY ACCESS SHOWCASE */}
      <section className="py-14 sm:py-20 px-5 sm:px-8 max-w-7xl mx-auto">
        <div className="rounded-[2.25rem] bg-[#080F22] border border-white/[0.08] p-7 sm:p-12 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/12 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-[#013369]/25 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-400">
                The Arena Shop · Authentic Gear &amp; Tickets
              </p>
              <h2
                className="font-display font-extrabold uppercase tracking-tight text-white leading-[0.98]"
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
                  <Trophy className="w-5 h-5 text-[#D4AF37] shrink-0" />
                  <span>Full-Season Hospitality Passes</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-sky-400 shrink-0" />
                  <span>Jerseys, Helmets &amp; Collectibles</span>
                </div>
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>Beckett &amp; Hologram COA Verified</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onDiscoverGameDay}
                  className="px-8 py-4 min-h-[48px] rounded-2xl bg-[#2563EB] hover:bg-blue-500 text-white font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-xl shadow-blue-600/25 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
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
            <div className="p-6 rounded-2xl bg-[#080F22] border border-white/[0.08] space-y-3">
              <Calendar className="w-6 h-6 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Confirmed Scheduled Events</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Stadium tours, Seahawks practice sessions, match tickets, and signed vault gear carry fixed dates or confirmed stock.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#080F22] border border-white/[0.08] space-y-3">
              <Clock className="w-6 h-6 text-sky-400" />
              <h3 className="text-base font-bold text-white">Player-Coordinated Encounters</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                1-on-1 VIP player encounters depend on athlete availability and are finalized directly with our liaison team.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#080F22] border border-white/[0.08] space-y-3">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <h3 className="text-base font-bold text-white">Transparent Pricing &amp; Passes</h3>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Upfront totals with no hidden fees, flexible payment options, and scannable PDF/QR passes upon approval.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-[#080F22] border border-white/[0.08] space-y-3">
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
            onOpenLegalModal={onOpenLegalModal}
          />
        </div>
      </section>

      {/* 6. FINAL CONVERSION FOOTER CTA */}
      <section className="relative py-16 sm:py-24 px-5 sm:px-8 text-center overflow-hidden bg-[#03050B]">
        <div className="absolute inset-0 bg-gradient-to-t from-[#080F22]/55 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          <h2
            className="font-display font-extrabold uppercase tracking-tight text-white leading-[0.95]"
            style={{ fontSize: "clamp(2.2rem, 4.8vw, 4rem)" }}
          >
            MAKE THIS SEASON{" "}
            <span className="bg-gradient-to-r from-white via-sky-200 to-blue-400 bg-clip-text text-transparent">
              UNFORGETTABLE.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Explore VIP stadium tours, player meet-and-greet invitations, certified autographed memorabilia, game-day seats, and dedicated fan hospitality support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              type="button"
              onClick={() => onOpenPlayerInquiry()}
              className="w-full sm:w-auto px-8 py-4 min-h-[50px] rounded-xl bg-[#D50A0A] hover:bg-[#B91C1C] text-white border border-white/15 font-extrabold text-sm tracking-wide shadow-xl shadow-red-900/35 transition-all cursor-pointer"
            >
              GET YOUR INVITATION – $100
            </button>
            <button
              type="button"
              onClick={onExploreExperiences}
              className="w-full sm:w-auto px-8 py-4 min-h-[50px] rounded-xl bg-[#08112B] hover:bg-[#013369] border border-[#013369]/70 text-white font-bold text-sm tracking-wide transition-all cursor-pointer"
            >
              EXPLORE EXPERIENCES
            </button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2 text-xs text-zinc-400">
            <button
              type="button"
              onClick={onOpenTicketCheck}
              className="hover:text-white transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-400" />
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

      {/* 7. CORPORATE GOVERNANCE, LEGAL TRANSPARENCY & POLICY FOOTER */}
      <footer className="bg-[#03050C] border-t border-[#013369]/50 px-5 sm:px-8 py-10">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <GridironBrandMark size="md" />
              <div>
                <p className="text-sm font-bold text-white">
                  {CHARITY_ALLOCATION.operatorLegalName}
                </p>
                <p className="text-xs text-zinc-400">
                  {CHARITY_ALLOCATION.websiteDomain} · {CHARITY_ALLOCATION.supportEmail}
                </p>
              </div>
            </div>

            <nav aria-label="Governance and Policy Links" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-zinc-300">
              <button type="button" onClick={() => onOpenLegalModal("about")} className="hover:text-sky-400 transition-colors cursor-pointer">
                About Us
              </button>
              <button type="button" onClick={() => onOpenLegalModal("contact")} className="hover:text-sky-400 transition-colors cursor-pointer">
                Contact Information
              </button>
              <button type="button" onClick={() => onOpenLegalModal("charity")} className="hover:text-sky-400 transition-colors cursor-pointer">
                Charitable Initiative
              </button>
              <button type="button" onClick={() => onOpenLegalModal("privacy")} className="hover:text-sky-400 transition-colors cursor-pointer">
                Privacy Policy
              </button>
              <button type="button" onClick={() => onOpenLegalModal("terms")} className="hover:text-sky-400 transition-colors cursor-pointer">
                Terms &amp; Conditions
              </button>
              <button type="button" onClick={() => onOpenLegalModal("refund")} className="hover:text-sky-400 transition-colors cursor-pointer">
                Refund &amp; Cancellation Policy
              </button>
            </nav>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[11px] text-zinc-500 leading-relaxed">
            <p className="max-w-3xl">
              <Building2 className="w-3.5 h-3.5 inline mr-1.5 text-zinc-400 -mt-0.5" />
              Operated by {CHARITY_ALLOCATION.operatorLegalName} ({CHARITY_ALLOCATION.websiteDomain}). Card payments are processed exclusively through encrypted third-party tokenization; full card numbers and CVVs are never stored on our servers.
            </p>
            <p className="shrink-0 font-mono text-zinc-400">
              © {new Date().getFullYear()} {CHARITY_ALLOCATION.operatorLegalName}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
