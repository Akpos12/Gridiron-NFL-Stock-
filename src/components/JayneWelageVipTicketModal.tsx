import React, { useRef, useState } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Award,
  Calendar,
  Clock,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";
import { renderJayneWelagePng, GeneratedFileResult } from "../utils/jayneVipExport";
import { cn } from "../lib/utils";

export const JAYNE_WELAGE_PASS_DATA = {
  id: "MV-VIP-2027-JW01",
  orderId: "MV-VIP-2027-JW01",
  refCode: "MV-VIP-2027-JW01",
  ticketCode: "MV-VIP-2027-JW01",
  qrCode: "MV-VIP-2027-JW01",
  passCode: "MV-VIP-2027-JW01",
  guestName: "JAYNE WELAGE",
  buyerName: "JAYNE WELAGE",
  senderName: "JAYNE WELAGE",
  buyerEmail: "jayne_welage@gridiron.exchange",
  userEmail: "jayne_welage@gridiron.exchange",
  eventTitle: "THE ULTIMATE VIP EXPERIENCE",
  experienceTitle: "THE ULTIMATE VIP EXPERIENCE · MINNESOTA VIKINGS VIP EXPERIENCE",
  gameName: "Private Meet & Greet + Investment & Networking Party",
  homeTeam: "Minnesota Vikings",
  stadium: "U.S. Bank Stadium Private Suites",
  city: "Minneapolis, Minnesota",
  date: "MARCH 14, 2027",
  time: "5:30 PM",
  timeSlot: "5:30 PM",
  tier: "EXCLUSIVE VIP GUEST",
  dressCode: "BLACK TIE ELEGANCE",
  admission: "EXCLUSIVE VIP GUEST",
  status: "approved",
  isApproved: true,
  isJayneWelageVip: true
};

const FEATURED_EXPERIENCES = [
  "Exclusive Private Meet & Greet Experience.",
  "Minnesota Vikings Investment & Networking Party.",
  "VIP hospitality and private guest reception.",
  "Exclusive photography opportunities.",
  "Premium networking and entertainment."
];

interface JayneWelageVipTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData?: any;
}

/** Refined U.S. Bank Stadium–inspired angular prow & architectural roof silhouette */
const StadiumArchitectureSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 900 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="stadiumGold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D4AF37" stopOpacity="0" />
        <stop offset="22%" stopColor="#F3D97D" stopOpacity="0.45" />
        <stop offset="50%" stopColor="#D4AF37" stopOpacity="0.65" />
        <stop offset="78%" stopColor="#F3D97D" stopOpacity="0.45" />
        <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="stadiumFill" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#4F2683" stopOpacity="0.28" />
        <stop offset="100%" stopColor="#07050A" stopOpacity="0" />
      </linearGradient>
    </defs>

    {/* Ambient stadium spotlight beams */}
    <path d="M180 205 L310 20 L380 20 L260 205 Z" fill="#D4AF37" fillOpacity="0.035" />
    <path d="M720 205 L590 20 L520 20 L640 205 Z" fill="#D4AF37" fillOpacity="0.035" />

    {/* Main sweeping angular prow & asymmetric translucent roof crest */}
    <path
      d="M35 190 L135 112 L290 68 L450 28 L615 72 L770 112 L865 190 L795 190 L705 142 L450 105 L195 142 L105 190 Z"
      fill="url(#stadiumFill)"
      stroke="url(#stadiumGold)"
      strokeWidth="1.25"
    />

    {/* Faceted structural trusses */}
    <path
      d="M195 142 L290 68 L370 120 L450 28 L530 120 L615 72 L705 142"
      stroke="url(#stadiumGold)"
      strokeWidth="0.9"
      strokeOpacity="0.7"
    />
    <path
      d="M135 112 L450 64 L770 112"
      stroke="url(#stadiumGold)"
      strokeWidth="0.75"
      strokeOpacity="0.45"
    />
    <line x1="450" y1="28" x2="450" y2="152" stroke="url(#stadiumGold)" strokeWidth="0.9" strokeOpacity="0.55" />

    {/* Bowl seating tiers silhouette */}
    <path
      d="M115 178 Q450 142 785 178"
      stroke="url(#stadiumGold)"
      strokeWidth="1"
      strokeOpacity="0.45"
    />
    <path
      d="M145 194 Q450 162 755 194"
      stroke="url(#stadiumGold)"
      strokeWidth="0.8"
      strokeOpacity="0.3"
    />
  </svg>
);

/** Subtle luxury engraved football crest with lace detailing */
const FootballCrestSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 120 72"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="fbGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFF3B0" />
        <stop offset="45%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#9A7418" />
      </linearGradient>
    </defs>
    {/* Almond / Gridiron ball silhouette */}
    <path
      d="M8 36 C26 10, 94 10, 112 36 C94 62, 26 62, 8 36 Z"
      fill="#1A0830"
      stroke="url(#fbGold)"
      strokeWidth="1.5"
    />
    <path
      d="M15 36 C31 15, 89 15, 105 36 C89 57, 31 57, 15 36 Z"
      stroke="url(#fbGold)"
      strokeWidth="0.6"
      strokeOpacity="0.55"
    />
    {/* End stripes */}
    <path d="M27 20 C24 30, 24 42, 27 52" stroke="url(#fbGold)" strokeWidth="1.2" strokeOpacity="0.7" />
    <path d="M93 20 C96 30, 96 42, 93 52" stroke="url(#fbGold)" strokeWidth="1.2" strokeOpacity="0.7" />
    {/* Center stitching & laces */}
    <line x1="38" y1="36" x2="82" y2="36" stroke="url(#fbGold)" strokeWidth="1.4" />
    <line x1="45" y1="30" x2="45" y2="42" stroke="url(#fbGold)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="52.5" y1="29" x2="52.5" y2="43" stroke="url(#fbGold)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="60" y1="28.5" x2="60" y2="43.5" stroke="url(#fbGold)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="67.5" y1="29" x2="67.5" y2="43" stroke="url(#fbGold)" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="75" y1="30" x2="75" y2="42" stroke="url(#fbGold)" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

/** Corner filigree frame ornament */
const CornerFiligree: React.FC<{ position: "tl" | "tr" | "bl" | "br" }> = ({ position }) => {
  const rotation =
    position === "tl"
      ? "rotate(0deg)"
      : position === "tr"
      ? "rotate(90deg)"
      : position === "br"
      ? "rotate(180deg)"
      : "rotate(270deg)";
  const posClass =
    position === "tl"
      ? "top-2.5 left-2.5"
      : position === "tr"
      ? "top-2.5 right-2.5"
      : position === "br"
      ? "bottom-2.5 right-2.5"
      : "bottom-2.5 left-2.5";

  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      className={cn("absolute w-7 h-7 pointer-events-none", posClass)}
      style={{ transform: rotation }}
      aria-hidden="true"
    >
      <path d="M2 34 L2 2 L34 2" stroke="#D4AF37" strokeWidth="1.4" strokeOpacity="0.85" />
      <path d="M7 26 L7 7 L26 7" stroke="#F3D97D" strokeWidth="0.7" strokeOpacity="0.55" />
      <circle cx="7" cy="7" r="1.8" fill="#F3D97D" />
    </svg>
  );
};

export const JayneWelageVipTicketModal: React.FC<JayneWelageVipTicketModalProps> = ({
  isOpen,
  onClose,
  ticketData
}) => {
  const [activeView, setActiveView] = useState<"ticket" | "invitation" | "suite">("suite");
  const [copied, setCopied] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [readyFile, setReadyFile] = useState<(GeneratedFileResult & { kind: "png" | "pdf" }) | { blobUrl: string; filename: string; kind: "pdf"; dataUrl?: string } | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const passCode = ticketData?.ticketCode || ticketData?.qrCode || JAYNE_WELAGE_PASS_DATA.ticketCode;
  const guestName = "JAYNE WELAGE";

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://www.nflgridiron.company";
  const qrValue = `${origin}/?vipInvite=jayne_welage&verifyTicket=${encodeURIComponent(passCode)}`;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(passCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloadingPng(true);
      setDownloadError(null);
      const result = await renderJayneWelagePng(activeView, passCode, qrValue);
      setReadyFile({ ...result, kind: "png" });
    } catch (err: any) {
      console.error("Failed to export VIP ticket PNG:", err);
      setDownloadError(err?.message || "Could not generate PNG image. Please try Print or PDF.");
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setDownloadError(null);
      const pdfResult = await generateTicketPDF({
        ...JAYNE_WELAGE_PASS_DATA,
        ...ticketData,
        ticketCode: passCode,
        qrCode: passCode,
        passCode,
        buyerName: guestName,
        isJayneWelageVip: true,
        status: "approved",
        isApproved: true
      });
      if (pdfResult) {
        setReadyFile({ ...pdfResult, kind: "pdf" });
      }
    } catch (err: any) {
      console.error("PDF generation failed:", err);
      setDownloadError(err?.message || "Could not generate PDF ticket. Please try PNG or Print.");
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    document.body.classList.add("vip-invite-printing");
    setActiveView("suite");
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove("vip-invite-printing");
      }, 300);
    }, 80);
  };

  /** Reusable Formal Luxury Ticket Component (Exact Required Layout) */
  const renderLuxuryTicketCard = () => (
    <div
      className="relative rounded-2xl overflow-hidden shadow-[0_28px_80px_rgba(79,38,131,0.45)] border border-[#D4AF37]/65"
      style={{
        background:
          "radial-gradient(ellipse at 50% 18%, rgba(79, 38, 131, 0.72) 0%, rgba(28, 10, 52, 0.94) 55%, #07050A 100%)"
      }}
    >
      {/* Subtle architectural stadium skyline behind center */}
      <StadiumArchitectureSvg className="absolute inset-x-0 top-10 w-full h-44 opacity-80 pointer-events-none" />

      {/* Double inner gold hairline border */}
      <div className="relative m-2.5 sm:m-3.5 rounded-xl border border-[#D4AF37]/45 overflow-hidden">
        <CornerFiligree position="tl" />
        <CornerFiligree position="tr" />
        <CornerFiligree position="bl" />
        <CornerFiligree position="br" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12">
          {/* LEFT / MAIN TICKET BODY (9 cols) */}
          <div className="lg:col-span-9 px-6 py-7 sm:px-10 sm:py-9 flex flex-col justify-between min-h-[380px] border-b lg:border-b-0 lg:border-r border-dashed border-[#D4AF37]/45 relative">
            {/* Circular Perforation Notches on Divider (Desktop) */}
            <div className="hidden lg:block absolute -right-3 -top-3 w-6 h-6 rounded-full bg-[#07050A] border border-[#D4AF37]/50 z-20" />
            <div className="hidden lg:block absolute -right-3 -bottom-3 w-6 h-6 rounded-full bg-[#07050A] border border-[#D4AF37]/50 z-20" />

            {/* TOP HEADER — Exact Required Copy */}
            <div className="text-center space-y-2 pb-5 border-b border-[#D4AF37]/25">
              <div className="flex items-center justify-center gap-3">
                <span className="h-[1px] w-8 sm:w-14 bg-gradient-to-r from-transparent to-[#D4AF37]" />
                <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.32em] text-[#F3D97D]">
                  THE ULTIMATE VIP EXPERIENCE · ONE MONTH AFTER SUPER BOWL LXI
                </span>
                <span className="h-[1px] w-8 sm:w-14 bg-gradient-to-l from-transparent to-[#D4AF37]" />
              </div>

              <h2 className="font-luxury text-2xl sm:text-3xl md:text-[2.1rem] font-bold uppercase tracking-[0.16em] text-white drop-shadow-[0_2px_10px_rgba(212,175,55,0.28)]">
                MINNESOTA VIKINGS VIP EXPERIENCE
              </h2>
            </div>

            {/* CENTRE PROMINENT DISPLAY — Exact Required Copy */}
            <div className="py-7 sm:py-8 text-center space-y-4">
              <div className="flex items-center justify-center">
                <FootballCrestSvg className="w-16 h-10 opacity-95" />
              </div>

              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#D4AF37]/90 mb-1.5">
                  DISTINGUISHED VIP GUEST OF HONOR
                </p>
                <h1 className="font-luxury text-4xl sm:text-5xl md:text-[3.6rem] font-bold uppercase tracking-[0.14em] text-[#F6E27A] leading-none drop-shadow-[0_4px_18px_rgba(212,175,55,0.3)]">
                  {guestName}
                </h1>
              </div>

              <div className="pt-2 space-y-1.5 max-w-xl mx-auto">
                <p className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.24em] text-white">
                  PRIVATE MEET &amp; GREET
                </p>
                <p className="font-luxury italic text-xl sm:text-2xl font-semibold text-[#D4AF37] leading-none">
                  +
                </p>
                <p className="text-sm sm:text-base md:text-lg font-bold uppercase tracking-[0.22em] text-white">
                  INVESTMENT &amp; NETWORKING PARTY
                </p>
              </div>
            </div>

            {/* BOTTOM DETAILS BAR — Exact Required Copy */}
            <div className="pt-5 border-t border-[#D4AF37]/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center sm:text-left">
              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  EVENT DATE
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-white tabular-nums">
                  MARCH 14, 2027
                </p>
              </div>

              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  EVENT TIME
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-[0.12em] text-white tabular-nums">
                  5:30 PM
                </p>
              </div>

              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  ATTIRE
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-white">
                  DRESS CODE: BLACK TIE ELEGANCE
                </p>
              </div>

              <div>
                <span className="block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
                  CLEARANCE
                </span>
                <p className="mt-1 text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-[#F6E27A]">
                  ADMISSION: EXCLUSIVE VIP GUEST
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT STUB — DECORATIVE & SCANNABLE QR PASS (3 cols) */}
          <div
            className="lg:col-span-3 px-6 py-7 flex flex-col items-center justify-between text-center gap-5"
            style={{
              background:
                "linear-gradient(180deg, rgba(16, 7, 29, 0.96) 0%, rgba(7, 5, 10, 0.98) 100%)"
            }}
          >
            <div className="space-y-1">
              <div className="w-11 h-11 mx-auto rounded-full border border-[#D4AF37]/70 bg-[#4F2683]/45 flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.22)]">
                <Award className="w-5 h-5 text-[#F6E27A]" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-[0.28em] text-[#D4AF37] pt-1">
                OFFICIAL CREDENTIAL
              </p>
            </div>

            {/* Gold-Framed QR Placeholder / Pass */}
            <div className="relative p-3 rounded-xl border-2 border-[#D4AF37] bg-[#F7F4EC] shadow-[0_12px_32px_rgba(0,0,0,0.65)]">
              <QRCodeSVG
                value={qrValue}
                size={128}
                level="H"
                fgColor="#1A0830"
                bgColor="#F7F4EC"
              />
              <div className="mt-2 pt-1.5 border-t border-[#1A0830]/20">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.22em] text-[#1A0830]">
                  VIP EVENT ACCESS
                </span>
              </div>
            </div>

            <div className="w-full space-y-2">
              <div className="border-t border-b border-[#D4AF37]/25 py-2">
                <span className="block text-[8px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
                  INVITATION SERIAL
                </span>
                <span className="font-mono text-xs font-bold tracking-[0.16em] text-[#F6E27A] select-all">
                  {passCode}
                </span>
              </div>
              <p className="text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                MINNEAPOLIS · PRIVATE SUITE
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  /** Reusable Formal Luxury Invitation Dossier (Featured Experiences + Dress Code) */
  const renderFormalInvitationSheet = () => (
    <div
      className="relative rounded-2xl overflow-hidden border border-[#D4AF37]/55 shadow-[0_24px_70px_rgba(0,0,0,0.75)]"
      style={{
        background:
          "radial-gradient(circle at top center, rgba(79, 38, 131, 0.42) 0%, #110820 50%, #07050A 100%)"
      }}
    >
      <div className="relative m-2.5 sm:m-3.5 rounded-xl border border-[#D4AF37]/40 px-6 py-8 sm:px-10 sm:py-10">
        <CornerFiligree position="tl" />
        <CornerFiligree position="tr" />
        <CornerFiligree position="bl" />
        <CornerFiligree position="br" />

        {/* Invitation Salutation Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 pb-7 border-b border-[#D4AF37]/25">
          <p className="text-[10px] font-bold uppercase tracking-[0.34em] text-[#D4AF37]">
            PRIVATE INVITATION DOSSIER · BY PERSONAL APPOINTMENT
          </p>
          <h2 className="font-luxury text-3xl sm:text-4xl font-bold uppercase tracking-[0.14em] text-white">
            THE ULTIMATE VIP EXPERIENCE
          </h2>
          <p className="text-sm sm:text-base text-zinc-200 leading-relaxed">
            In honor of distinguished guest{" "}
            <strong className="text-[#F6E27A] tracking-wide">JAYNE WELAGE</strong>, you are
            cordially invited to an exclusive private evening combining a Private Meet &amp; Greet
            Experience with the Minnesota Vikings Investment Party, hosted one month following Super
            Bowl LXI.
          </p>
        </div>

        {/* Two-Column Featured Experiences + Black Tie Dress Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-7">
          {/* Featured Experiences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 border-b border-[#D4AF37]/25 pb-2.5">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-luxury text-xl font-bold uppercase tracking-[0.14em] text-[#F6E27A]">
                FEATURED EXPERIENCES
              </h3>
            </div>
            <ul className="space-y-3">
              {FEATURED_EXPERIENCES.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-zinc-100 leading-relaxed">
                  <span className="mt-2 w-1.5 h-1.5 rotate-45 bg-[#D4AF37] shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-[#D4AF37]/20 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[9px] uppercase tracking-[0.22em] text-[#D4AF37] flex items-center gap-1.5 font-semibold">
                  <Calendar className="w-3 h-3" /> DATE
                </span>
                <p className="mt-1 font-bold text-white tracking-wide">March 14, 2027</p>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.22em] text-[#D4AF37] flex items-center gap-1.5 font-semibold">
                  <Clock className="w-3 h-3" /> TIME
                </span>
                <p className="mt-1 font-bold text-white tracking-wide">5:30 PM</p>
              </div>
            </div>
          </div>

          {/* Dress Code & Guest Access */}
          <div className="space-y-4 md:pl-6 md:border-l md:border-[#D4AF37]/20">
            <div className="flex items-center gap-2.5 border-b border-[#D4AF37]/25 pb-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-luxury text-xl font-bold uppercase tracking-[0.14em] text-[#F6E27A]">
                DRESS CODE
              </h3>
            </div>

            <div className="space-y-3 text-sm text-zinc-100 leading-relaxed">
              <p className="font-semibold text-white">
                Black Tie Elegance – Formal luxury attire.
              </p>
              <div className="p-3.5 rounded-xl bg-black/45 border border-[#D4AF37]/25 space-y-2.5">
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  <strong className="text-[#F6E27A] uppercase tracking-wider text-[11px] mr-1.5">
                    Ladies:
                  </strong>
                  Elegant evening gowns, sophisticated cocktail dresses, or luxurious formal outfits.
                </p>
                <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed">
                  <strong className="text-[#F6E27A] uppercase tracking-wider text-[11px] mr-1.5">
                    Gentlemen:
                  </strong>
                  Tailored black suits or tuxedos, crisp white shirts, polished dress shoes, and
                  elegant accessories.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-xs border-t border-[#D4AF37]/20">
                <span className="uppercase tracking-[0.18em] text-[#D4AF37] font-semibold">
                  GUEST ACCESS
                </span>
                <span className="font-bold text-white tracking-wide">
                  Exclusive VIP Admission.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="vip-invite-print-portal fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 md:p-8 bg-black/88 backdrop-blur-xl overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#07050A] border border-[#D4AF37]/45 rounded-3xl overflow-hidden shadow-[0_32px_100px_rgba(79,38,131,0.5)] flex flex-col max-h-[95vh]">
        {/* Vikings Purple -> Metallic Gold Top Trim */}
        <div
          className="h-1.5 w-full no-print"
          style={{
            background: "linear-gradient(90deg, #4F2683 0%, #D4AF37 50%, #4F2683 100%)"
          }}
        />

        {/* Modal Top Navigation & View Switcher */}
        <div className="no-print flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-[#D4AF37]/25 bg-[#0E0719]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F2683] border border-[#D4AF37]/60 flex items-center justify-center shadow-lg">
              <Award className="w-5 h-5 text-[#F6E27A]" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#D4AF37]">
                OFFICIAL VIP INVITATION &amp; ADMISSION CREDENTIAL
              </p>
              <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-white">
                JAYNE WELAGE · THE ULTIMATE VIP EXPERIENCE
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center p-1 bg-black/60 border border-[#D4AF37]/30 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveView("suite")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  activeView === "suite"
                    ? "bg-[#4F2683] text-[#F6E27A] border border-[#D4AF37]/60"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Complete Suite
              </button>
              <button
                type="button"
                onClick={() => setActiveView("ticket")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  activeView === "ticket"
                    ? "bg-[#4F2683] text-[#F6E27A] border border-[#D4AF37]/60"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                VIP Ticket
              </button>
              <button
                type="button"
                onClick={() => setActiveView("invitation")}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  activeView === "invitation"
                    ? "bg-[#4F2683] text-[#F6E27A] border border-[#D4AF37]/60"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Invitation Details
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-black/60 hover:bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close VIP Invitation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Luxury Showcase Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          {/* Mobile View Tabs */}
          <div className="no-print md:hidden flex items-center p-1 bg-black/60 border border-[#D4AF37]/30 rounded-xl">
            {(
              [
                { id: "suite", label: "Full Suite" },
                { id: "ticket", label: "VIP Ticket" },
                { id: "invitation", label: "Invitation" }
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={cn(
                  "flex-1 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer",
                  activeView === tab.id
                    ? "bg-[#4F2683] text-[#F6E27A] border border-[#D4AF37]/50"
                    : "text-zinc-400"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Capturable Print-Ready Luxury Artifact Container */}
          <div ref={captureRef} className="space-y-6 bg-[#07050A] p-1 sm:p-2 rounded-2xl">
            {(activeView === "ticket" || activeView === "suite") && renderLuxuryTicketCard()}
            {(activeView === "invitation" || activeView === "suite") && renderFormalInvitationSheet()}
          </div>

          {/* Export / Print Action Bar */}
          <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            <button
              type="button"
              onClick={handleDownloadPng}
              disabled={isDownloadingPng}
              className="min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#F3D97D] to-[#C59B27] hover:brightness-105 text-[#0E0719] font-extrabold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPng ? "Rendering PNG..." : "Download High-Res PNG"}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="min-h-[44px] py-3 px-4 rounded-xl bg-[#4F2683] hover:bg-[#5f309c] border border-[#D4AF37]/60 text-[#F6E27A] font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloadingPdf ? "Generating PDF..." : "Download Print PDF"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRef}
              className="min-h-[44px] py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#D4AF37]/30 text-zinc-200 hover:text-white font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#F6E27A]" /> : <Copy className="w-4 h-4 text-[#D4AF37]" />}
              <span>{copied ? "Reference Copied" : "Copy Pass Reference"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="min-h-[44px] py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/15 text-zinc-200 hover:text-white font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#D4AF37]" />
              <span>Print Invitation &amp; Ticket</span>
            </button>
          </div>

          {downloadError && (
            <div className="no-print p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
              <span>{downloadError}</span>
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                className="text-xs font-bold uppercase text-rose-300 hover:text-white cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {readyFile && (
            <div className="no-print p-4 rounded-2xl bg-[#1A0830]/90 border border-[#D4AF37]/50 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#F6E27A]">
                    {readyFile.kind === "png" ? "High-Res PNG Ticket Ready" : "Print-Ready PDF Ready"}
                  </p>
                  <p className="text-[11px] text-zinc-300">
                    File: <span className="font-mono text-white">{readyFile.filename}</span> — if your browser blocked auto-save inside the preview frame, use <strong className="text-white">Save File</strong> or open the inline image preview to long-press &amp; save.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <a
                    href={readyFile.blobUrl}
                    download={readyFile.filename}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#D4AF37] hover:bg-[#F3D97D] text-[#0E0719] font-extrabold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Save File
                  </a>
                  {readyFile.dataUrl && (
                    <button
                      type="button"
                      onClick={() => setShowInlinePreview((prev) => !prev)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-black/50 hover:bg-black/75 border border-[#D4AF37]/40 text-[#F6E27A] font-bold uppercase text-[11px] tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      {showInlinePreview ? "Hide Preview" : "Show Saveable Image"}
                    </button>
                  )}
                </div>
              </div>
              {showInlinePreview && readyFile.dataUrl && (
                <div className="pt-2 border-t border-[#D4AF37]/25">
                  <img
                    src={readyFile.dataUrl}
                    alt={readyFile.filename}
                    className="w-full max-w-2xl mx-auto rounded-xl border border-[#D4AF37]/40 shadow-2xl"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
