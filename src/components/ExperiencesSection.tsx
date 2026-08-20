import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Star, 
  Ticket, 
  Sparkles, 
  ChevronRight, 
  CreditCard, 
  CheckCircle2, 
  ShieldAlert, 
  QrCode, 
  ArrowRight, 
  Lock, 
  Info,
  SlidersHorizontal,
  Plus,
  Minus,
  Building2,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  DollarSign,
  Wallet
} from "lucide-react";
import { collection, onSnapshot, getDocs, setDoc, doc, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../lib/firebase";
import { NFL_TEAMS, getLogoUrl } from "../constants";
import { cn, formatCurrency } from "../lib/utils";
import { NFLImage } from "../utils/nflImages";
import { OFFICIAL_PAYMENT_CHANNELS } from "./TicketCheckoutModal";

export interface Experience {
  id: string;
  title: string;
  description: string;
  type: "stadium_tour" | "meet_greet" | "private_tour";
  category: string;
  price: number;
  vipPrice?: number;
  premiumPrice?: number;
  teamId: string;
  imageUrl: string;
  player?: string;
  location: string;
  dates: string[];
  timeSlots: string[];
  features: string[];
  rating: number;
  reviewsCount: number;
  spotsLeft?: Record<string, number>; // date_slot -> spots
  v?: number;
  updatedAt?: any;
}

export interface Booking {
  id: string;
  userId: string;
  userEmail: string;
  experienceId: string;
  experienceTitle: string;
  experienceType: string;
  date: string;
  timeSlot: string;
  guestsCount: number;
  totalPrice: number;
  tier: "standard" | "vip" | "premium";
  status: "pending" | "approved";
  qrCode: string;
  createdAt: any;
  imageUrl: string;
  paymentMethod?: string;
  paymentRef?: string;
  senderName?: string;
  buyerPhone?: string;
}

const TODAY_ISO = "2026-08-18";

const SEED_EXPERIENCES: Experience[] = [
  {
    id: "exp-dal-tour",
    title: "AT&T Stadium Ultimate Access Tour",
    description: "Go behind the scenes at the home of the Dallas Cowboys. Explore the press box, VIP suites, private locker rooms, and walk directly through the player tunnel onto the 50-yard line stars.",
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
    features: [
      "Access to Cowboys locker room",
      "Field access with photo op at the 50-Yard Star",
      "Executive Coach guide narration",
      "Standard commemorative lanyard"
    ],
    rating: 4.9,
    reviewsCount: 420
  },
  {
    id: "exp-min-tour",
    title: "U.S. Bank Stadium Architectural Journey",
    description: "Immerse yourself inside Minneapolis' legendary glass cathedral. Track the historic Viking ship landmarks, walk the skyward locker room suites, and feel the game day roar.",
    type: "stadium_tour",
    category: "Standard Stadium Tour",
    price: 35,
    vipPrice: 90,
    premiumPrice: 180,
    teamId: "MIN",
    imageUrl: "https://i.postimg.cc/sDYSCSgk/4545d9b7b90ee7c1f34fbb83344efb2cbank.jpg",
    location: "Minneapolis, MN",
    dates: ["2026-08-24", "2026-08-28", "2026-09-02", "2026-09-09", "2026-09-16", "2026-09-23", "2026-09-30"],
    timeSlots: ["09:30 AM", "11:00 AM", "1:30 PM", "4:00 PM"],
    features: [
      "Viking Legacy Gallery showcase entrance",
      "Interviews Area & Press Conference podium",
      "Field turf access",
      "High-contrast digital souvenir card"
    ],
    rating: 4.8,
    reviewsCount: 310
  },
  {
    id: "exp-jefferson-meet",
    title: "Justin Jefferson High-Fidelity Football Session",
    description: "An extraordinary fan dream. Secure the ultimate face-to-face meet & greet, exclusive live autograph authentication, photos, and an intimate tactical Q&A with NFL superstar Justin Jefferson.",
    type: "meet_greet",
    category: "VIP Meet & Greet",
    price: 299,
    vipPrice: 750,
    premiumPrice: 1499,
    teamId: "MIN",
    imageUrl: "https://i.postimg.cc/jdm6RKH4/1ef0abb32f5e7cb84b338bbb020c200cjetas.jpg",
    player: "Justin Jefferson",
    location: "U.S. Bank Stadium Club Room",
    dates: ["2026-09-12", "2026-09-19", "2026-10-03", "2026-10-17", "2026-11-07"],
    timeSlots: ["2:00 PM", "6:00 PM"],
    features: [
      "1x Professionally processed high-res digital photo with Justin Jefferson",
      "Includes 1 signed official NFL football with holograph label",
      "Private catering menu by U.S. Bank Club chef",
      "Open microphone audience Q&A session"
    ],
    rating: 5.0,
    reviewsCount: 125
  },
  {
    id: "exp-mahomes-meet",
    title: "Patrick Mahomes Masterclass Live",
    description: "Join the 3x Super Bowl MVP and modern legend Patrick Mahomes. A ultra-Premium backstage package featuring close-range football clinics, game theory discussion, and a signed Duke leather ball.",
    type: "meet_greet",
    category: "Premium Backstage Package",
    price: 499,
    vipPrice: 1199,
    premiumPrice: 2499,
    teamId: "KC",
    imageUrl: "https://i.postimg.cc/HLfFMf1n/f2318507a5fadb58268812cf8e9a3510.jpg",
    player: "Patrick Mahomes",
    location: "Arrowhead Elite Pavilion",
    dates: ["2026-09-15", "2026-09-22", "2026-10-06", "2026-10-20", "2026-11-10"],
    timeSlots: ["1:00 PM", "5:00 PM"],
    features: [
      "Signed official Wilson 'The Duke' ball",
      "Preloaded dynamic visual digital assets",
      "1-on-1 photo op",
      "Exclusive Chiefs VIP Club lounge access"
    ],
    rating: 4.9,
    reviewsCount: 188
  },
  {
    id: "exp-sb-premium",
    title: "Super Bowl LXI Platinum All-Access Elite",
    description: "Indulge in absolute luxury. A private, bespoke Super Bowl LXI host package with 5-star travel, elite stadium suite booking, certified championship pre-game field passes, and exclusive cocktail receptions.",
    type: "private_tour",
    category: "Super Bowl Premium Package",
    price: 2500,
    vipPrice: 4999,
    premiumPrice: 9999,
    teamId: "SF",
    imageUrl: "https://i.postimg.cc/tC3PGPgT/1c6b339a1ec6b4da401e9584074a5073lxi.jpg",
    location: "Host Stadium VIP Suite",
    dates: ["2027-02-11", "2027-02-12", "2027-02-13", "2027-02-14"],
    timeSlots: ["12:00 PM", "4:00 PM"],
    features: [
      "Pre-Game field pass credentials",
      "Bespoke transportation and 5-Star Hotel bookings",
      "Private chef service during the experience matchday",
      "Post-game championship field confetti access"
    ],
    rating: 5.0,
    reviewsCount: 16
  },
  {
    id: "exp-gb-facility",
    title: "Titans of Lambeau Training Facility Tour",
    description: "The ultimate pilgrimage for historical purists. Trace the frozen tundra facility locker labs, Packers equipment bays, player weight complexes, and the prestigious Don Hutson Center indoor field.",
    type: "private_tour",
    category: "Team Training Facility Tour",
    price: 150,
    vipPrice: 350,
    premiumPrice: 750,
    teamId: "GB",
    imageUrl: "https://i.postimg.cc/mg9YDqVW/33923b662167a088aa30d29b4d062f9ate.jpg",
    location: "Lambeau Field complexes",
    dates: ["2026-08-26", "2026-08-30", "2026-09-06", "2026-09-13", "2026-09-20", "2026-09-27"],
    timeSlots: ["11:00 AM", "2:30 PM"],
    features: [
      "Access to training labs and equipment areas",
      "Private tour of Packer Hall of Fame curated galleries",
      "Lunch at Packers Hall Dining Lounge",
      "Curator-guided historic Packers run"
    ],
    rating: 4.9,
    reviewsCount: 95
  },
  {
    id: "exp-sea-training",
    title: "Seattle Seahawks Official Training Session Access",
    description: "Experience an exclusive behind-the-scenes look at the Seattle Seahawks practice and training facility at the Virginia Mason Athletic Center (VMAC). Watch NFL drills, coaching walk-throughs, and player scrimmages up close from the premium VIP spectator zone.",
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
    features: [
      "Fieldside spectator seating for official Seahawks practice drills",
      "Exclusive Seahawks training camp guest pass & lanyard",
      "Post-practice player autograph and photo opportunities",
      "Complimentary training facility beverage & snack hospitality"
    ],
    rating: 5.0,
    reviewsCount: 88
  }
];

interface ExperiencesSectionProps {
  onNotifyCheckout?: () => void;
  onRequestLoginModal?: () => void;
  initialTargetExperience?: any;
}

export const ExperiencesSection: React.FC<ExperiencesSectionProps> = ({ 
  onNotifyCheckout, 
  onRequestLoginModal,
  initialTargetExperience
}) => {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<"all" | "stadium_tour" | "meet_greet" | "private_tour">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);

  // Booking details
  const [bookingDate, setBookingDate] = useState("");
  const [bookingSlot, setBookingSlot] = useState("");
  const [customTimeSlotInput, setCustomTimeSlotInput] = useState("");
  const [isCustomDateMode, setIsCustomDateMode] = useState(false);
  const [guestsCount, setGuestsCount] = useState(1);
  const [tierSelection, setTierSelection] = useState<"standard" | "vip" | "premium">("standard");

  // Booking Flow State
  const [bookingStep, setBookingStep] = useState<"details" | "checkout" | "success">("details");
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Official Payment Form State
  const [paymentTab, setPaymentTab] = useState<"bank" | "cashapp" | "venmo" | "zelle" | "crypto">("bank");
  const [selectedCrypto, setSelectedCrypto] = useState<"btc" | "eth" | "usdt">("usdt");
  const [senderName, setSenderName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Helper to format clean display dates
  const formatFriendlyDate = (dateStr: string) => {
    if (!dateStr) return "Select Date";
    try {
      if (dateStr === "2026-08-18") return "Today (Tue, Aug 18, 2026)";
      if (dateStr === "2026-08-19") return "Tomorrow (Wed, Aug 19, 2026)";
      const [year, month, day] = dateStr.split("-").map(Number);
      if (year && month && day) {
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  // Seed / Sync Experiences
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, "experiences"), async (snap) => {
      if (snap.empty) {
        console.log("Seeding initial experiences to Firestore databases...");
        try {
          // No experiences, let's write them
          for (const exp of SEED_EXPERIENCES) {
            await setDoc(doc(db, "experiences", exp.id), exp);
          }
        } catch (err) {
          console.error("Failed to seed initial experiences database:", err);
        }
      } else {
        const loaded: Experience[] = [];
        snap.forEach(d => {
          const item = { id: d.id, ...d.data() } as Experience;
          const seedMatch = SEED_EXPERIENCES.find(s => s.id === item.id);

          // If the Firestore document has outdated dates, refresh them with current upcoming dates
          const hasPastDates = item.dates && item.dates.some(dt => dt < TODAY_ISO);
          if (hasPastDates && seedMatch) {
            item.dates = seedMatch.dates;
            setDoc(doc(db, "experiences", item.id), { ...item, dates: seedMatch.dates }, { merge: true }).catch(console.error);
          } else if (!item.dates || item.dates.length === 0) {
            if (seedMatch) item.dates = seedMatch.dates;
          }

          // Standardize image URLs & pricing to high-quality corresponding NFL graphics
          if (item.id === "exp-dal-tour" && (!item.imageUrl || item.imageUrl.includes("photo-1540747913346") || item.imageUrl.includes("postimg.cc") || item.imageUrl.includes("unsplash"))) {
            item.imageUrl = "https://i.postimg.cc/90c8t280/a8367675b2fbcfe31970b081bfce176f.jpg";
          } else if (item.id === "exp-min-tour" && (!item.imageUrl || item.imageUrl.includes("photo-1508098682722") || item.imageUrl.includes("photo-1551244072") || item.imageUrl.includes("postimg.cc") || item.imageUrl.includes("unsplash"))) {
            item.imageUrl = "https://i.postimg.cc/sDYSCSgk/4545d9b7b90ee7c1f34fbb83344efb2cbank.jpg";
          } else if (item.id === "exp-jefferson-meet" && (!item.imageUrl || item.imageUrl.includes("photo-1510076857177") || item.imageUrl.includes("photo-1511512578047") || item.imageUrl.includes("postimg.cc") || item.imageUrl.includes("unsplash"))) {
            item.imageUrl = "https://i.postimg.cc/jdm6RKH4/1ef0abb32f5e7cb84b338bbb020c200cjetas.jpg";
          } else if (item.id === "exp-mahomes-meet" && (!item.imageUrl || item.imageUrl.includes("photo-1519766304817") || item.imageUrl.includes("photo-1517649763962") || item.imageUrl.includes("postimg.cc"))) {
            item.imageUrl = "https://i.postimg.cc/HLfFMf1n/f2318507a5fadb58268812cf8e9a3510.jpg";
          } else if (item.id === "exp-sb-premium" && (!item.imageUrl || item.imageUrl.includes("photo-1522158673370") || item.imageUrl.includes("photo-1629235483163") || item.imageUrl.includes("photo-1574629810360") || item.imageUrl.includes("postimg.cc") || item.imageUrl.includes("unsplash"))) {
            item.imageUrl = "https://i.postimg.cc/tC3PGPgT/1c6b339a1ec6b4da401e9584074a5073lxi.jpg";
          } else if (item.id === "exp-gb-facility" && (!item.imageUrl || item.imageUrl.includes("photo-1588850561407") || item.imageUrl.includes("photo-1581009146145") || item.imageUrl.includes("postimg.cc") || item.imageUrl.includes("unsplash"))) {
            item.imageUrl = "https://i.postimg.cc/mg9YDqVW/33923b662167a088aa30d29b4d062f9ate.jpg";
          } else if (item.id === "exp-sea-training") {
            item.imageUrl = "https://i.postimg.cc/gJd9nqzg/341007003061882166.jpg";
            item.price = (typeof item.price === "number" && !isNaN(item.price)) ? item.price : 250;
            if (seedMatch) {
              item.dates = seedMatch.dates;
              // If Firestore document doesn't include the complete scheduled dates, update it
              const currentDocDates = d.data().dates || [];
              if (JSON.stringify(currentDocDates) !== JSON.stringify(seedMatch.dates)) {
                setDoc(doc(db, "experiences", item.id), { dates: seedMatch.dates }, { merge: true }).catch(console.error);
              }
            }
          }
          loaded.push(item);
        });

        // Ensure all seed experiences exist in database
        const existingIds = new Set(loaded.map(x => x.id));
        for (const exp of SEED_EXPERIENCES) {
          if (!existingIds.has(exp.id)) {
            setDoc(doc(db, "experiences", exp.id), exp).catch(console.error);
            loaded.push(exp);
          }
        }

        setExperiences(loaded);
      }
      setLoading(false);
    }, (err) => {
      console.error("Listen experiences database error, using client fallback:", err);
      setExperiences(SEED_EXPERIENCES);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // Listen to deep link clicks from PromoSlider
  useEffect(() => {
    if (initialTargetExperience) {
      // Decode target link or filter
      const targetId = initialTargetExperience.targetId;
      if (targetId) {
        const matched = experiences.find(e => e.id === targetId);
        if (matched) {
          openBookingModal(matched);
        }
      } else if (initialTargetExperience.id === "promo-1") {
        setActiveType("meet_greet");
      } else if (initialTargetExperience.id === "promo-2") {
        setActiveType("stadium_tour");
      } else if (initialTargetExperience.id === "promo-3") {
        setActiveType("private_tour");
      }
    }
  }, [initialTargetExperience, experiences]);

  const openBookingModal = (exp: Experience) => {
    setSelectedExp(exp);
    const validFutureDate = exp.dates.find(d => d >= TODAY_ISO) || exp.dates[0] || TODAY_ISO;
    setBookingDate(validFutureDate);
    setBookingSlot(exp.timeSlots[0] || "09:30 AM");
    setCustomTimeSlotInput("");
    setIsCustomDateMode(false);
    setGuestsCount(1);
    setTierSelection("standard");
    setBookingStep("details");
    setBookingError("");
    setPaymentTab("bank");
    if (auth.currentUser) {
      setSenderName(auth.currentUser.displayName || "");
      setBuyerEmail(auth.currentUser.email || "");
    }
  };

  const handleBookingDetailsConfirm = () => {
    // No account creation required - direct guest or registered checkout!
    setBookingStep("checkout");
  };

  const handleExecutePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExp) return;

    if (!senderName.trim()) {
      setBookingError("Please provide your Sender / Account Holder Name.");
      return;
    }

    if (!buyerEmail.trim()) {
      setBookingError("Please provide your Email Address for pass delivery and status updates.");
      return;
    }

    setIsSubmittingBooking(true);
    setBookingError("");

    try {
      const priceForTier = 
        tierSelection === "premium" && selectedExp.premiumPrice ? selectedExp.premiumPrice :
        tierSelection === "vip" && selectedExp.vipPrice ? selectedExp.vipPrice : 
        selectedExp.price;

      const guestsNum = Math.max(1, guestsCount);
      const totalAmount = priceForTier * guestsNum;
      
      const newBookingId = `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      const bookingData: Booking = {
        id: newBookingId,
        userId: auth.currentUser?.uid || "guest",
        userEmail: buyerEmail.trim(),
        experienceId: selectedExp.id,
        experienceTitle: selectedExp.title,
        experienceType: selectedExp.type,
        date: bookingDate,
        timeSlot: bookingSlot,
        guestsCount: guestsNum,
        totalPrice: totalAmount,
        tier: tierSelection,
        status: "pending", // Awaiting admin approval from the Control Room
        qrCode: `GRIDIRON-${newBookingId}-${selectedExp.teamId}`,
        createdAt: new Date().toISOString(),
        imageUrl: selectedExp.imageUrl,
        paymentMethod: paymentTab,
        paymentRef: paymentRef || "PENDING_CONTROL_ROOM_VERIFICATION",
        senderName: senderName.trim(),
        buyerPhone: buyerPhone.trim()
      };

      // Add to Firestore database
      await setDoc(doc(db, "bookings", newBookingId), bookingData);

      // Create a store order transaction automatically to catalog revenue in audit channels!
      const storeOrderId = `order-${Date.now()}`;
      await setDoc(doc(db, "store_orders", storeOrderId), {
        userId: auth.currentUser?.uid || "guest",
        userEmail: buyerEmail.trim(),
        itemType: "ticket",
        itemName: `Experience: ${selectedExp.title} (${tierSelection.toUpperCase()})`,
        price: totalAmount,
        teamId: selectedExp.teamId,
        paymentMethod: paymentTab,
        paymentRef: paymentRef || "PENDING_CONTROL_ROOM_VERIFICATION",
        senderName: senderName.trim(),
        buyerPhone: buyerPhone.trim(),
        status: "pending_approval",
        timestamp: new Date().toISOString()
      });

      // Also record in ticket_orders so the admin control room and user passes sync identically
      try {
        const ticketOrderId = `ord-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        await setDoc(doc(db, "ticket_orders", ticketOrderId), {
          id: ticketOrderId,
          userId: auth.currentUser?.uid || "guest",
          userEmail: buyerEmail.trim(),
          buyerPhone: buyerPhone.trim(),
          gameId: selectedExp.id,
          gameName: selectedExp.title,
          stadium: selectedExp.location,
          city: "Seattle, WA",
          tier: tierSelection,
          quantity: guestsNum,
          totalAmount: totalAmount,
          paymentMethod: paymentTab,
          senderName: senderName.trim(),
          paymentRef: paymentRef || "SUBMITTED_FOR_APPROVAL",
          status: "pending_approval",
          qrCode: `RFID-SEA-${ticketOrderId.toUpperCase()}`,
          timestamp: serverTimestamp()
        });
      } catch (e) {
        console.warn("ticket_orders write error (non-fatal):", e);
      }

      // Also create a transaction so user balance is updated or modeled
      try {
        const txId = `tx-exp-${Date.now()}`;
        await setDoc(doc(db, "global_transactions", txId), {
          userId: auth.currentUser?.uid || "guest",
          type: "withdraw",
          assetId: selectedExp.teamId,
          amount: totalAmount,
          shares: 0,
          price: totalAmount,
          status: "pending",
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.warn("Global tracking fail (ignoring critical flow):", err);
      }

      setCompletedBooking(bookingData);
      setBookingStep("success");
      
      if (onNotifyCheckout) {
        onNotifyCheckout();
      }
    } catch (err: any) {
      console.error("Booking write error:", err);
      setBookingError("Reservation transaction declined. Contact box office operations.");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Filters
  const filteredExps = experiences.filter(exp => {
    const typeMatch = activeType === "all" || exp.type === activeType;
    const team = NFL_TEAMS.find(t => t.id === exp.teamId);
    const searchStr = `${exp.title} ${exp.category} ${exp.description} ${exp.player || ""} ${team?.name || ""} ${team?.city || ""}`.toLowerCase();
    const searchMatch = searchStr.includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-10">
      {/* Experience Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/10 text-[9px] font-black uppercase tracking-widest text-blue-400 mb-4 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Arena Experiences
          </span>
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
            NFL EXPERIENCES
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mt-2 max-w-xl">
            Go past the ticket gate with premium stadium walkaways, elite player meet and greets, and bespoke luxury hosting packages.
          </p>
        </div>

        {/* Categories Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          {([
            { id: "all", label: "All Events" },
            { id: "stadium_tour", label: "Stadium Tours" },
            { id: "meet_greet", label: "Meet & Greets" },
            { id: "private_tour", label: "Private Tours" }
          ] as const).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveType(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                activeType === tab.id 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" 
                  : "bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative max-w-lg">
        <SlidersHorizontal className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
        <input
          type="text"
          placeholder="Filter tours, elite stadiums, or player rosters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/50 border border-white/5 rounded-2xl pl-12 pr-6 py-3.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-600 font-bold placeholder-zinc-600"
        />
      </div>

      {/* Experiences Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-12 h-12 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Constructing experience lists...</p>
        </div>
      ) : filteredExps.length === 0 ? (
        <div className="py-24 text-center border border-dashed border-white/5 rounded-[2rem] bg-zinc-900/10">
          <Compass className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-sm font-black uppercase text-white tracking-widest">No Premium Encounters Match Your Filter</p>
          <p className="text-[10px] text-zinc-500 font-bold uppercase mt-1">Try resetting the search parameter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredExps.map((exp) => {
            const team = NFL_TEAMS.find(t => t.id === exp.teamId);
            return (
              <motion.div
                key={exp.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex flex-col bg-zinc-900/40 rounded-[2rem] border overflow-hidden hover:shadow-2xl transition-all group duration-300",
                  exp.type === "private_tour" ? "border-amber-500/20 shadow-amber-950/5" : "border-white/5"
                )}
              >
                {/* Image & Logo Overlay */}
                <div className="relative aspect-video overflow-hidden bg-zinc-950">
                  <NFLImage 
                    item={exp}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80"
                  />
                  {exp.type === "private_tour" && (
                    <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-zinc-950 text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      <Sparkles className="w-3 h-3" />
                      LUXURY ELITE
                    </div>
                  )}

                  {team && (
                    <div className="absolute top-4 right-4 w-10 h-10 bg-zinc-950/80 backdrop-blur-md rounded-xl p-2 border border-white/10 flex items-center justify-center">
                      <img src={getLogoUrl(team.id)} alt={team.id} className="w-full h-full object-contain" />
                    </div>
                  )}

                  <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-red-500" />
                    {exp.location}
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                        {exp.category}
                      </span>
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-[10px] font-bold font-mono">{exp.rating}</span>
                        <span className="text-[8px] text-zinc-600 font-mono">({exp.reviewsCount})</span>
                      </div>
                    </div>

                    <h3 className="text-md font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {exp.title}
                    </h3>
                    <p className="text-[11px] font-bold text-zinc-500 leading-normal line-clamp-3">
                      {exp.description}
                    </p>
                  </div>

                  {/* Highlights Bullet List */}
                  <div className="bg-zinc-950/30 rounded-xl p-3 border border-white/[0.02] space-y-1.5">
                    {exp.features.slice(0, 2).map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
                        <span className="w-1 h-1 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                    <div className="flex items-center gap-1.5 text-[8px] font-mono text-emerald-400/90 pt-1 border-t border-white/[0.03]">
                      <Building2 className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">BMO Bank · Cash App · Venmo · Zelle · Crypto</span>
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                    <div>
                      <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest leading-none">Starting from</p>
                      <p className={cn(
                        "text-lg font-mono font-black mt-1",
                        exp.type === "private_tour" ? "text-amber-400" : "text-white"
                      )}>
                        {formatCurrency(exp.price)}
                      </p>
                    </div>

                    <button
                      onClick={() => openBookingModal(exp)}
                      className={cn(
                        "px-4.5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-1.5 transform active:scale-95 duration-150",
                        exp.type === "private_tour" 
                          ? "bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold" 
                          : "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      Book Ticket
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Dynamic Booking Dialog / Panel Flow modal */}
      <AnimatePresence>
        {selectedExp && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={cn(
                "relative bg-zinc-950 border rounded-[2.5rem] w-full max-w-2xl overflow-hidden shadow-2xl my-8",
                selectedExp.type === "private_tour" ? "border-amber-500/20" : "border-white/5"
              )}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedExp(null)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all z-30 cursor-pointer"
              >
                <span className="text-lg">×</span>
              </button>

              {/* Header Image Info */}
              <div className="relative h-48 bg-zinc-950 overflow-hidden">
                <NFLImage 
                  item={selectedExp}
                  className="w-full h-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
                <div className="absolute bottom-6 left-8 right-8">
                  <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest bg-blue-900/20 px-2.5 py-0.5 rounded border border-blue-500/10">
                    {selectedExp.category}
                  </span>
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-white mt-2 leading-tight">
                    {selectedExp.title}
                  </h3>
                </div>
              </div>

              {/* Main Dialog Scrolling Body */}
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                
                {/* Step indicators */}
                <div className="flex items-center justify-center gap-4 border-b border-white/5 pb-4">
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", bookingStep === "details" ? "text-blue-400" : "text-zinc-600")}>01 Reserve details</span>
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", bookingStep === "checkout" ? "text-blue-400" : "text-zinc-600")}>02 Secure Checkout</span>
                  <ChevronRight className="w-3 h-3 text-zinc-700" />
                  <span className={cn("text-[9px] font-black uppercase tracking-widest", bookingStep === "success" ? "text-green-400 animate-pulse" : "text-zinc-600")}>03 VIP Ticket</span>
                </div>

                {bookingError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-[10px] uppercase font-black tracking-wider text-red-400">{bookingError}</p>
                  </div>
                )}

                {/* STEP 1: Details Reservation */}
                {bookingStep === "details" && (
                  <div className="space-y-6 text-left">
                    {/* Descriptions */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">About Experience</h4>
                      <p className="text-xs text-zinc-500 font-bold leading-relaxed">{selectedExp.description}</p>
                    </div>

                    {/* Booking parameters: Interactive Custom Date & Time Selection */}
                    <div className="space-y-5 pt-2 border-t border-white/5">
                      {/* Date Selection Box */}
                      <div className="space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-500" />
                            1. Select Attendance Date
                          </label>
                          <div className="flex items-center gap-1.5 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => setIsCustomDateMode(false)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all",
                                !isCustomDateMode 
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" 
                                  : "bg-zinc-900 text-zinc-400 hover:text-white"
                              )}
                            >
                              ⚡ Scheduled Sessions
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsCustomDateMode(true)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1",
                                isCustomDateMode 
                                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20" 
                                  : "bg-zinc-900 text-zinc-400 hover:text-white"
                              )}
                            >
                              📅 Pick Any Custom Date
                            </button>
                          </div>
                        </div>

                        {/* Direct HTML5 Date Picker */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-zinc-400">
                              {isCustomDateMode ? "Choose any specific date on your calendar:" : "Select or enter your preferred attendance date:"}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-emerald-400">
                              Live NFL Calendar Active
                            </span>
                          </div>

                          <div className="relative">
                            <input
                              type="date"
                              min={TODAY_ISO}
                              value={bookingDate}
                              onChange={(e) => {
                                setBookingDate(e.target.value);
                                setIsCustomDateMode(true);
                              }}
                              className="w-full bg-zinc-900 border border-blue-500/40 rounded-xl px-4 py-3 text-xs text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 cursor-pointer shadow-inner"
                            />
                          </div>
                        </div>

                        {/* Scheduled / Quick Preset Date Chips */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider block">
                            Quick Selection & Scheduled Slots:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {selectedExp.dates.map(d => {
                              const isSelected = bookingDate === d;
                              return (
                                <button
                                  key={d}
                                  type="button"
                                  onClick={() => {
                                    setBookingDate(d);
                                    setIsCustomDateMode(false);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                    isSelected
                                      ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30"
                                      : "bg-zinc-900/90 border-white/5 text-zinc-400 hover:text-white hover:border-white/20"
                                  )}
                                >
                                  {formatFriendlyDate(d)}
                                </button>
                              );
                            })}

                            {/* Additional convenient presets if not already in list */}
                            {[
                              { label: "Today", value: "2026-08-18" },
                              { label: "Tomorrow", value: "2026-08-19" },
                              { label: "This Weekend", value: "2026-08-22" },
                              { label: "Next Week", value: "2026-08-25" }
                            ].filter(preset => !selectedExp.dates.includes(preset.value)).map(preset => {
                              const isSelected = bookingDate === preset.value;
                              return (
                                <button
                                  key={preset.value}
                                  type="button"
                                  onClick={() => {
                                    setBookingDate(preset.value);
                                    setIsCustomDateMode(true);
                                  }}
                                  className={cn(
                                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border",
                                    isSelected
                                      ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/30"
                                      : "bg-zinc-900/50 border-dashed border-white/10 text-zinc-400 hover:text-white hover:border-white/30"
                                  )}
                                >
                                  {preset.label} ({formatFriendlyDate(preset.value)})
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Selected Date Confirmation Banner */}
                        <div className="p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <span className="text-[9px] text-zinc-400 uppercase font-black block">Selected Session Date</span>
                              <span className="text-xs font-black text-white">{formatFriendlyDate(bookingDate)}</span>
                            </div>
                          </div>
                          <span className="text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full w-fit">
                            ✓ Open For Reservation
                          </span>
                        </div>
                      </div>

                      {/* Time Session Selection Box */}
                      <div className="space-y-3 p-4 bg-zinc-950/80 rounded-2xl border border-white/10">
                        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                          <label className="text-[11px] font-black uppercase tracking-widest text-white flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            2. Select Time Session / Arrival Slot
                          </label>
                          <span className="text-[9px] text-blue-400 font-black tracking-widest uppercase flex items-center gap-1">
                            <Info className="w-3 h-3" /> 8 Live Positions Left
                          </span>
                        </div>

                        {/* Time Slot Quick Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {selectedExp.timeSlots.map(slot => {
                            const isSelected = bookingSlot === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => {
                                  setBookingSlot(slot);
                                  setCustomTimeSlotInput("");
                                }}
                                className={cn(
                                  "p-3 rounded-xl border text-left transition-all",
                                  isSelected
                                    ? "bg-blue-600 border-blue-400 text-white shadow-md shadow-blue-600/20"
                                    : "bg-zinc-900 border-white/5 text-zinc-400 hover:text-white hover:border-white/10"
                                )}
                              >
                                <span className="text-xs font-mono font-black block text-white">{slot}</span>
                                <span className="text-[9px] uppercase font-bold text-zinc-300">
                                  {slot.includes("09:") || slot.includes("10:") || slot.includes("11:") ? "Morning Session" :
                                   slot.includes("12:") || slot.includes("01:") || slot.includes("02:") || slot.includes("03:") ? "Afternoon Scrimmage" :
                                   "Evening Walkthrough"}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Custom Time Entry (Optional) */}
                        <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row sm:items-center gap-2">
                          <span className="text-[9px] font-black uppercase text-zinc-400 shrink-0">
                            Or Custom Arrival Time:
                          </span>
                          <input
                            type="text"
                            placeholder="e.g. 11:30 AM / Twilight Session"
                            value={customTimeSlotInput}
                            onChange={(e) => {
                              setCustomTimeSlotInput(e.target.value);
                              if (e.target.value.trim()) {
                                setBookingSlot(e.target.value.trim());
                              }
                            }}
                            className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pricing Tiers Selection */}
                    <div className="space-y-3 pt-4 border-t border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Upgrade Priority Tier</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Standard */}
                        <button
                          type="button"
                          onClick={() => setTierSelection("standard")}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all",
                            tierSelection === "standard" 
                              ? "bg-zinc-900 border-blue-500 shadow-lg shadow-blue-500/10"
                              : "bg-zinc-900/30 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-white tracking-wider">Standard</span>
                            <span className="text-[11px] font-mono font-black text-blue-400">{formatCurrency(selectedExp.price)}</span>
                          </div>
                          <p className="text-[8px] text-zinc-500 font-bold leading-normal uppercase">Standard admission itinerary guidelines.</p>
                        </button>

                        {/* VIP (Check if VIP exists) */}
                        <button
                          type="button"
                          onClick={() => setTierSelection("vip")}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all",
                            tierSelection === "vip" 
                              ? "bg-zinc-900 border-blue-500 shadow-lg shadow-blue-500/10"
                              : "bg-zinc-900/30 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-1">
                              VIP
                              <Sparkles className="w-3 h-3 text-amber-400" />
                            </span>
                            <span className="text-[11px] font-mono font-black text-amber-400">{formatCurrency(selectedExp.vipPrice || selectedExp.price * 2)}</span>
                          </div>
                          <p className="text-[8px] text-zinc-500 font-bold leading-normal uppercase">Stitched memorabilia, premium buffet catering pass.</p>
                        </button>

                        {/* Backstage Premium */}
                        <button
                          type="button"
                          onClick={() => setTierSelection("premium")}
                          className={cn(
                            "p-4 rounded-2xl border text-left transition-all",
                            tierSelection === "premium" 
                              ? "bg-zinc-900 border-ambient border-blue-500 shadow-lg"
                              : "bg-zinc-900/30 border-white/5 hover:border-white/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black uppercase text-white tracking-wider">PLATINUM</span>
                            <span className="text-[11px] font-mono font-black text-amber-500">{formatCurrency(selectedExp.premiumPrice || selectedExp.price * 4)}</span>
                          </div>
                          <p className="text-[8px] text-zinc-500 font-bold leading-normal uppercase">Elite signed locker item & personal 1-on-1 meet.</p>
                        </button>
                      </div>
                    </div>

                    {/* Guests selection */}
                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <div>
                        <h4 className="text-[11px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-blue-500" />
                          Reserve Pass Guests COUNT
                        </h4>
                        <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Check out limit of 10 attendees per transaction.</p>
                      </div>
                      <div className="flex items-center gap-4 bg-zinc-900 p-2.5 rounded-xl border border-white/5">
                        <button
                          type="button"
                          disabled={guestsCount <= 1}
                          onClick={() => setGuestsCount(g => Math.max(1, g - 1))}
                          className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono text-sm font-black text-white w-6 text-center">{guestsCount}</span>
                        <button
                          type="button"
                          disabled={guestsCount >= 10}
                          onClick={() => setGuestsCount(g => Math.min(10, g + 1))}
                          className="w-7 h-7 rounded-lg bg-zinc-950 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Checkout Details Summary */}
                    <div className="pt-6 border-t border-white/5 flex items-center justify-between bg-zinc-950/60 p-6 rounded-[2rem]">
                      <div>
                        <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest leading-none">Checkout Aggregate</p>
                        <h4 className="text-2xl font-mono font-black text-white mt-1.5 leading-none">
                          {formatCurrency((
                            tierSelection === "premium" ? (selectedExp.premiumPrice || selectedExp.price * 4) :
                            tierSelection === "vip" ? (selectedExp.vipPrice || selectedExp.price * 2) :
                            selectedExp.price
                          ) * guestsCount)}
                        </h4>
                      </div>
                      <button
                        onClick={handleBookingDetailsConfirm}
                        className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-2 transform active:scale-95 duration-100 cursor-pointer"
                      >
                        Proceed to Checkout
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                )}

                {/* STEP 2: Checkout Form */}
                {bookingStep === "checkout" && (
                  <form onSubmit={handleExecutePayment} className="space-y-6 text-left">
                    <div className="bg-zinc-900/60 p-6 rounded-[2rem] border border-white/5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2">Invoice Summary</h4>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>Event Ticket</span>
                        <span className="text-white truncate max-w-[200px]">{selectedExp.title}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>Priority Tier</span>
                        <span className="text-white text-right">{tierSelection.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>Date & Slot</span>
                        <span className="text-white text-right font-mono">{bookingDate} @ {bookingSlot}</span>
                      </div>
                      <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-zinc-500">
                        <span>Total Attendance</span>
                        <span className="text-white text-right font-mono">{guestsCount} GUEST(S)</span>
                      </div>
                      <div className="flex justify-between text-sm font-black border-t border-white/5 pt-2.5">
                        <span className="text-zinc-400 uppercase tracking-widest">Total Invoice</span>
                        <span className="text-blue-400 font-mono text-lg font-black">
                          {formatCurrency((
                            tierSelection === "premium" ? (selectedExp.premiumPrice || selectedExp.price * 4) :
                            tierSelection === "vip" ? (selectedExp.vipPrice || selectedExp.price * 2) :
                            selectedExp.price
                          ) * Math.max(1, guestsCount))}
                        </span>
                      </div>
                    </div>

                    {/* Official Payment Channels */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-blue-500" />
                          Official Payment Channel
                        </h4>
                        <span className="text-[9px] font-black uppercase text-emerald-400 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Concierge Verified
                        </span>
                      </div>

                      {/* Payment Method Selector Tabs */}
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "bank", label: "BMO Bank (Wire/ACH)", icon: Building2 },
                          { id: "cashapp", label: "Cash App", icon: Smartphone },
                          { id: "venmo", label: "Venmo", icon: Smartphone },
                          { id: "zelle", label: "Zelle", icon: Smartphone },
                          { id: "crypto", label: "Crypto (BTC/ETH/USDT)", icon: QrCode }
                        ].map(method => {
                          const isSelected = paymentTab === method.id;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setPaymentTab(method.id as any)}
                              className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                                isSelected
                                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-blue-400"
                                  : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
                              }`}
                            >
                              <method.icon className="w-3.5 h-3.5" />
                              {method.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Payment Channel Details Box */}
                      <div className="p-4 bg-zinc-950 rounded-2xl border border-white/10 space-y-3">
                        {paymentTab === "bank" && (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black uppercase text-blue-400">Domestic Wire / ACH Settlement</span>
                              <span className="text-[9px] font-mono uppercase bg-blue-500/10 text-blue-300 px-2 py-0.5 rounded">Fast Clearing</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5">
                                <span className="text-[9px] text-zinc-500 uppercase font-black block">Bank Institution</span>
                                <span className="font-mono font-bold text-white uppercase">{OFFICIAL_PAYMENT_CHANNELS.bank.bankName}</span>
                              </div>
                              <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5">
                                <span className="text-[9px] text-zinc-500 uppercase font-black block">Account Beneficiary</span>
                                <span className="font-mono font-bold text-white uppercase">{OFFICIAL_PAYMENT_CHANNELS.bank.accountName}</span>
                              </div>
                              <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Account Number</span>
                                  <span className="font-mono font-bold text-emerald-400">{OFFICIAL_PAYMENT_CHANNELS.bank.accountNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.bank.accountNumber, "acc")}
                                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                                >
                                  {copiedKey === "acc" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <div className="p-2.5 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                                <div>
                                  <span className="text-[9px] text-zinc-500 uppercase font-black block">Routing Number</span>
                                  <span className="font-mono font-bold text-blue-400">{OFFICIAL_PAYMENT_CHANNELS.bank.routingNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.bank.routingNumber, "rout")}
                                  className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white"
                                >
                                  {copiedKey === "rout" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {paymentTab === "cashapp" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black uppercase text-emerald-400">Direct Cash App Transfer</span>
                              <span className="text-[9px] font-mono text-zinc-400">Instant Access</span>
                            </div>
                            <div className="p-3 bg-zinc-900 rounded-xl border border-emerald-500/20 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-zinc-500 uppercase font-black block">Official Cashtag</span>
                                <span className="text-base font-mono font-black text-emerald-400">{OFFICIAL_PAYMENT_CHANNELS.cashapp.tag}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.cashapp.tag, "cashapp")}
                                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1"
                              >
                                {copiedKey === "cashapp" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey === "cashapp" ? "Copied" : "Copy Tag"}
                              </button>
                            </div>
                          </div>
                        )}

                        {paymentTab === "venmo" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black uppercase text-blue-400">Venmo Peer Transfer</span>
                              <span className="text-[9px] font-mono text-zinc-400">Instant Access</span>
                            </div>
                            <div className="p-3 bg-zinc-900 rounded-xl border border-blue-500/20 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-zinc-500 uppercase font-black block">Venmo Handle</span>
                                <span className="text-base font-mono font-black text-blue-400">{OFFICIAL_PAYMENT_CHANNELS.venmo.handle}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.venmo.handle, "venmo")}
                                className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1"
                              >
                                {copiedKey === "venmo" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey === "venmo" ? "Copied" : "Copy Handle"}
                              </button>
                            </div>
                          </div>
                        )}

                        {paymentTab === "zelle" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black uppercase text-purple-400">Zelle Direct Banking</span>
                              <span className="text-[9px] font-mono text-zinc-400">Zero Fees</span>
                            </div>
                            <div className="p-3 bg-zinc-900 rounded-xl border border-purple-500/20 flex items-center justify-between">
                              <div>
                                <span className="text-[9px] text-zinc-500 uppercase font-black block">Recipient Name & Email</span>
                                <span className="text-sm font-mono font-black text-white">{OFFICIAL_PAYMENT_CHANNELS.zelle.name}</span>
                                <span className="text-xs font-mono text-purple-300 block">{OFFICIAL_PAYMENT_CHANNELS.zelle.email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.zelle.email, "zelle")}
                                className="px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-wider rounded-lg flex items-center gap-1"
                              >
                                {copiedKey === "zelle" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                {copiedKey === "zelle" ? "Copied" : "Copy Email"}
                              </button>
                            </div>
                          </div>
                        )}

                        {paymentTab === "crypto" && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="text-[10px] font-black uppercase text-amber-400">Blockchain Asset Settlement</span>
                              <div className="flex gap-1">
                                {(["usdt", "eth", "btc"] as const).map(c => (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setSelectedCrypto(c)}
                                    className={`px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded ${
                                      selectedCrypto === c ? "bg-amber-400 text-black font-black" : "bg-zinc-800 text-zinc-400"
                                    }`}
                                  >
                                    {c}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="p-3 bg-zinc-900 rounded-xl border border-amber-500/20 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[9px] text-zinc-500 uppercase font-black">
                                  {OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].name} ({OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].network})
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].address, "crypto")}
                                  className="px-2.5 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1"
                                >
                                  {copiedKey === "crypto" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                  {copiedKey === "crypto" ? "Copied" : "Copy Address"}
                                </button>
                              </div>
                              <div className="font-mono text-xs text-amber-300 break-all select-all bg-black/40 p-2 rounded-lg border border-white/5">
                                {OFFICIAL_PAYMENT_CHANNELS.crypto[selectedCrypto].address}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Sender & Contact Details (No Account Required) */}
                      <div className="space-y-3 pt-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                              Full Name / Sender Name <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Matthew Smith"
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wide"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                              Email Address (For Pass & Approval) <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              placeholder="name@example.com"
                              value={buyerEmail}
                              onChange={(e) => setBuyerEmail(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-wide lowercase"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              Phone Number (Optional for SMS Alerts)
                            </label>
                            <input
                              type="tel"
                              placeholder="+1 (555) 000-0000"
                              value={buyerPhone}
                              onChange={(e) => setBuyerPhone(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 tracking-wide"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                              Payment Ref / Transaction ID / Cashtag
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Wire Ref #93821 / $Mickobabe32"
                              value={paymentRef}
                              onChange={(e) => setPaymentRef(e.target.value)}
                              className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase tracking-wide"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-[11px] flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                          <span>No account needed to reserve. Payment will be verified and approved from the box office Control Room.</span>
                        </div>
                      </div>

                      {bookingError && (
                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-medium">
                          {bookingError}
                        </div>
                      )}
                    </div>

                    {/* Booking payment CTA */}
                    <div className="pt-4 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setBookingStep("details")}
                        className="px-6 py-4 bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white rounded-2xl text-[10px] uppercase font-black tracking-widest"
                      >
                        Adjust Details
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmittingBooking}
                        className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 rounded-2xl text-[10px] font-black uppercase tracking-widest inline-flex items-center justify-center gap-2 transform active:scale-95 duration-100"
                      >
                        {isSubmittingBooking ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            RECORDING PAYMENT...
                          </>
                        ) : (
                          <>
                            <Lock className="w-4 h-4 text-emerald-100" />
                            CONFIRM PAYMENT & SUBMIT FOR APPROVAL
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Booking Success Ticket QR */}
                {bookingStep === "success" && completedBooking && (
                  <div className="space-y-6 text-center py-6">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto border border-amber-500/20">
                      <Clock className="w-10 h-10 text-amber-400" />
                    </div>

                    <div>
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-full">
                        PAYMENT TRANSMITTED · PENDING CONTROL ROOM APPROVAL
                      </span>
                      <h4 className="text-xl font-black italic uppercase tracking-tighter text-white mt-2">RESERVATION LOGGED FOR REVIEW</h4>
                      <p className="text-xs text-zinc-400 font-medium max-w-md mx-auto mt-1">
                        Your payment receipt has been registered. The box office manager (<strong className="text-white">Matthew Golom</strong>) will verify and approve your payment in the Control Room to activate your pass.
                      </p>
                    </div>

                    {/* Virtual Box Office Ticket */}
                    <div className="max-w-md mx-auto bg-zinc-900 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                      {/* Ticket Header */}
                      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-left flex items-center justify-between">
                        <div>
                          <p className="text-[8px] font-black text-blue-200 uppercase tracking-widest">Official Pass Invoice</p>
                          <h5 className="text-sm font-black uppercase tracking-tight text-white mt-1">SEATTLE SEAHAWKS / NFL ARENA PASS</h5>
                        </div>
                        <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-400 text-black">
                          Pending Approval
                        </span>
                      </div>

                      {/* Ticket Body */}
                      <div className="p-6 space-y-4 text-left">
                        <div>
                          <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Experience Ticket</p>
                          <h6 className="text-xs font-black text-white uppercase mt-0.5">{completedBooking.experienceTitle}</h6>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-wider text-zinc-500 border-t border-b border-white/5 py-3">
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Attendee Name</p>
                            <span className="text-white font-mono">{completedBooking.senderName || completedBooking.userEmail}</span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Notification Email</p>
                            <span className="text-white font-mono text-[11px] truncate block">{completedBooking.userEmail}</span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Attending Date</p>
                            <span className="text-white font-mono">{completedBooking.date}</span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Time Slot</p>
                            <span className="text-white font-mono">{completedBooking.timeSlot}</span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Pass Tier</p>
                            <span className="text-blue-400 font-black">{completedBooking.tier.toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Guests Count</p>
                            <span className="text-white font-mono">{completedBooking.guestsCount} ATTENDEE(S)</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-white/5">
                          <span className="text-[9px] font-black text-zinc-400 uppercase">Payment Channel</span>
                          <span className="text-xs font-mono font-bold text-white uppercase">{completedBooking.paymentMethod}</span>
                        </div>

                        {/* Ticket Footer / QR Code scanner mock */}
                        <div className="bg-zinc-950 p-5 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
                          <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                            <Clock className="w-3 h-3" /> PASS ACTIVATES UPON CONTROL ROOM APPROVAL
                          </p>
                          <div className="w-32 h-32 bg-white/90 rounded-2xl p-3 shadow-xl flex items-center justify-center opacity-80">
                            <QrCode className="w-full h-full text-zinc-950" />
                          </div>
                          <p className="text-[9px] font-mono text-zinc-500 uppercase font-black select-all">{completedBooking.qrCode}</p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedExp(null)}
                      className="px-10 py-4 bg-zinc-900 hover:bg-zinc-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/5 cursor-pointer"
                    >
                      Return to Arena Exchange
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
