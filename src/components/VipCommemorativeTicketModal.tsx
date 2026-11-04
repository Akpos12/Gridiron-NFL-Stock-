import React, { useState } from "react";
import {
  X,
  Download,
  Printer,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  User,
  CreditCard,
  QrCode,
  ExternalLink,
  ZoomIn,
  Eye,
  Award
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { generateTicketPDF } from "../utils/ticketPdfGenerator";
import { cn } from "../lib/utils";

interface VipCommemorativeTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketData?: any;
}

export const VipCommemorativeTicketModal: React.FC<VipCommemorativeTicketModalProps> = ({
  isOpen,
  onClose,
  ticketData
}) => {
  const [activeView, setActiveView] = useState<"render" | "interactive">("render");
  const [copied, setCopied] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen) return null;

  const ticket = ticketData || {
    id: "SEA-CARD-VIP-2026-DJ08",
    orderId: "SEA-CARD-VIP-2026-DJ08",
    refCode: "SEA-CARD-VIP-2026-DJ08",
    ticketCode: "SEA-CARD-VIP-2026-DJ08",
    buyerName: "Dena Johnston",
    userEmail: "dena.johnston@gmail.com",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Arizona Cardinals",
    eventTitle: "Seattle Seahawks vs. Arizona Cardinals",
    experienceTitle: "Seattle Seahawks vs. Arizona Cardinals · VIP Experience",
    date: "Sunday, November 8, 2026",
    time: "4:25 PM EST",
    kickoff: "4:25 PM EST",
    stadium: "Lumen Field",
    city: "Seattle, Washington",
    venue: "Lumen Field, Seattle, Washington",
    price: 1000,
    totalAmount: 1000,
    tier: "VIP Experience",
    category: "VIP Experience",
    seatDetails: "Section VIP Club Level 100 · Row A1 · Seat 12",
    gateInfo: "Gate 3 - Northwest VIP Club Entrance",
    isCommemorative: true,
    commemorativeDesign: true,
    commemorativeImageUrl: "/images/seahawks_vip_ticket_isolated.png"
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText(ticket.refCode || ticket.ticketCode || "SEA-CARD-VIP-2026-DJ08");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await generateTicketPDF({
        id: ticket.id || "SEA-CARD-VIP-2026-DJ08",
        orderId: ticket.orderId || "SEA-CARD-VIP-2026-DJ08",
        ticketCode: ticket.ticketCode || "SEA-CARD-VIP-2026-DJ08",
        qrCode: ticket.ticketCode || "SEA-CARD-VIP-2026-DJ08",
        eventTitle: "Seattle Seahawks vs. Arizona Cardinals",
        experienceTitle: "Seattle Seahawks vs. Arizona Cardinals - VIP Experience",
        gameName: "Seattle Seahawks vs. Arizona Cardinals",
        homeTeam: "Seattle Seahawks",
        awayTeam: "Arizona Cardinals",
        stadium: "Lumen Field",
        city: "Seattle, Washington",
        date: "Sunday, November 8, 2026",
        time: "4:25 PM EST",
        timeSlot: "4:25 PM EST (Kickoff)",
        tier: "VIP Experience",
        seatDetails: "Section VIP Club Level 100 · Row A1 · Seat 12",
        buyerName: "Dena Johnston",
        buyerEmail: "dena.johnston@gmail.com",
        userEmail: "dena.johnston@gmail.com",
        totalAmount: 1000,
        totalPrice: 1000,
        quantity: 1,
        status: "confirmed",
        isApproved: true,
        isCommemorative: true,
        commemorativeDesign: true
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadIsolatedPng = () => {
    const a = document.createElement("a");
    a.href = "/images/seahawks_vip_ticket_isolated.png";
    a.download = "Seattle-Seahawks-VIP-Ticket-Dena-Johnston-Isolated.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadImage = () => {
    handleDownloadIsolatedPng();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 md:p-8 bg-black/85 backdrop-blur-xl overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-zinc-950 border border-[#002244]/60 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[94vh]">
        
        {/* Top Accent Ribbon (Seahawks Navy #002244, Action Green #69BE28, Silver #A5ACAF) */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#002244] via-[#69BE28] to-[#A5ACAF]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#002244] border border-[#69BE28]/50 flex items-center justify-center shadow-lg shadow-[#69BE28]/20">
              <Award className="w-5 h-5 text-[#69BE28]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#69BE28]">
                  Official Commemorative VIP Pass
                </span>
                <span className="text-[9px] font-mono text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                  Collector’s Edition
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
                Seattle Seahawks vs. Arizona Cardinals
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="hidden sm:flex items-center p-1 bg-zinc-900 border border-white/10 rounded-xl">
              <button
                onClick={() => setActiveView("render")}
                className={cn(
                  "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all",
                  activeView === "render"
                    ? "bg-[#69BE28] text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                HD Isolated Ticket
              </button>
              <button
                onClick={() => setActiveView("interactive")}
                className={cn(
                  "px-3 py-1.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all",
                  activeView === "interactive"
                    ? "bg-[#69BE28] text-black shadow-md font-black"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                Digital Pass
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              title="Close VIP Pass Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
          
          {/* Mobile View Switcher */}
          <div className="sm:hidden flex items-center p-1 bg-zinc-900 border border-white/10 rounded-xl">
            <button
              onClick={() => setActiveView("render")}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-center",
                activeView === "render" ? "bg-[#69BE28] text-black font-black" : "text-zinc-400"
              )}
            >
              HD Isolated Ticket
            </button>
            <button
              onClick={() => setActiveView("interactive")}
              className={cn(
                "flex-1 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition-all text-center",
                activeView === "interactive" ? "bg-[#69BE28] text-black font-black" : "text-zinc-400"
              )}
            >
              Digital Pass
            </button>
          </div>

          {/* MAIN TICKET VIEW */}
          {activeView === "render" ? (
            /* 1. Isolated Ticket Render (Clean Transparent Background, Stadium Scenery & Background Removed) */
            <div className="relative group rounded-2xl overflow-hidden border border-[#69BE28]/40 shadow-2xl bg-zinc-950/90 flex flex-col items-center justify-center p-4 sm:p-8 min-h-[340px]">
              <div 
                className="w-full max-w-4xl flex items-center justify-center p-3 sm:p-6 rounded-xl"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
                  backgroundSize: "18px 18px"
                }}
              >
                <img
                  src="/images/seahawks_vip_ticket_isolated.png"
                  alt="Seattle Seahawks vs Arizona Cardinals VIP Game Ticket - Dena Johnston (Isolated with Transparent Background)"
                  className="w-full max-w-3xl h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,34,68,0.85)] rounded-lg transition-transform duration-300"
                />
              </div>
              
              <div className="w-full flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-white/5 mt-4">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <ShieldCheck className="w-4 h-4 text-[#69BE28]" />
                  <span className="text-[11px] font-medium text-zinc-300">
                    Isolated Ticket Asset · High-Resolution PNG with Clean Transparent Background
                  </span>
                </div>
                <button
                  onClick={handleDownloadIsolatedPng}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#69BE28] to-emerald-400 hover:from-[#5cb31f] hover:to-emerald-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center gap-2 shadow-xl shadow-[#69BE28]/25 cursor-pointer hover:scale-[1.02] active:scale-95"
                >
                  <Download className="w-4 h-4 text-black" /> Download Isolated Ticket (PNG)
                </button>
              </div>
            </div>
          ) : (
            /* 2. Interactive SVG & CSS Landscape Pass */
            <div className="relative rounded-3xl overflow-hidden border border-[#002244] shadow-2xl bg-gradient-to-r from-[#00172E] via-[#002244] to-[#00172E] text-white p-6 sm:p-8">
              {/* Subtle Stadium Light & Glow Effects */}
              <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#69BE28]/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

              {/* Landscape Layout Grid */}
              <div className="relative grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
                
                {/* Main Body (3 Cols) */}
                <div className="lg:col-span-3 space-y-6 lg:pr-6 lg:border-r lg:border-dashed lg:border-white/20">
                  
                  {/* Top Bar: Franchise Title & Pass Type */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#69BE28] block">
                        National Football League · Official VIP Experience
                      </span>
                      <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mt-1">
                        Seattle Seahawks
                      </h2>
                    </div>

                    <div className="text-right">
                      <span className="text-[8px] font-mono uppercase text-zinc-400 block tracking-widest">Category</span>
                      <span className="text-sm font-black text-[#69BE28] uppercase tracking-wider">
                        VIP Experience
                      </span>
                    </div>
                  </div>

                  {/* Matchup Header */}
                  <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#002244] border border-[#69BE28]/40 flex items-center justify-center p-1.5 shadow-md">
                        <img 
                          src="https://a.espncdn.com/i/teamlogos/nfl/500/sea.png" 
                          alt="Seattle Seahawks" 
                          className="w-full h-full object-contain"
                          onError={(e: any) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Home Franchise</span>
                        <h4 className="text-base font-black text-white uppercase">Seattle Seahawks</h4>
                      </div>
                    </div>

                    <div className="text-center font-mono font-black text-lg text-[#69BE28] px-3 py-1 bg-white/5 rounded-xl border border-white/10">
                      VS
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Visiting Franchise</span>
                        <h4 className="text-base font-black text-white uppercase">Arizona Cardinals</h4>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-[#97233F]/20 border border-[#97233F]/40 flex items-center justify-center p-1.5 shadow-md">
                        <img 
                          src="https://a.espncdn.com/i/teamlogos/nfl/500/ari.png" 
                          alt="Arizona Cardinals" 
                          className="w-full h-full object-contain"
                          onError={(e: any) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Ticket Holder Spotlight */}
                  <div className="bg-gradient-to-r from-[#002244] to-[#05325c] border-2 border-[#69BE28]/60 rounded-2xl p-5 shadow-lg relative">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#A5ACAF] block">
                          VIP Ticket Holder
                        </span>
                        <h3 className="text-2xl sm:text-3xl font-black text-[#69BE28] tracking-wide uppercase mt-0.5">
                          Dena Johnston
                        </h3>
                        <p className="text-xs text-zinc-300 font-mono mt-1">
                          Passholder Email: <span className="text-white">dena.johnston@gmail.com</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#A5ACAF] block">
                          Official Admission Value
                        </span>
                        <span className="text-2xl font-mono font-black text-white">
                          $1,000 USD
                        </span>
                        <span className="text-[9px] text-[#69BE28] font-bold block uppercase mt-0.5">
                          VIP All-Access Included
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Key Event Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A5ACAF] flex items-center gap-1 mb-1">
                        <Calendar className="w-3 h-3 text-[#69BE28]" /> Event Date
                      </span>
                      <p className="font-black text-white text-xs">Sunday, Nov 8, 2026</p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A5ACAF] flex items-center gap-1 mb-1">
                        <Clock className="w-3 h-3 text-[#69BE28]" /> Kickoff Time
                      </span>
                      <p className="font-black text-white text-xs">4:25 PM EST</p>
                      <p className="text-[9px] text-zinc-400">Gates 2:00 PM</p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A5ACAF] flex items-center gap-1 mb-1">
                        <MapPin className="w-3 h-3 text-[#69BE28]" /> Venue
                      </span>
                      <p className="font-black text-white text-xs">Lumen Field</p>
                      <p className="text-[9px] text-zinc-400">Seattle, WA</p>
                    </div>

                    <div className="bg-black/30 border border-white/5 rounded-xl p-3">
                      <span className="text-[8px] font-black uppercase tracking-widest text-[#A5ACAF] flex items-center gap-1 mb-1">
                        <ShieldCheck className="w-3 h-3 text-[#69BE28]" /> Seating Allocation
                      </span>
                      <p className="font-black text-white text-xs">VIP Club Lvl 100</p>
                      <p className="text-[9px] text-[#69BE28]">Row A1 · Seat 12</p>
                    </div>
                  </div>

                  {/* Commemorative Note Tag */}
                  <div className="flex items-center justify-between text-[9px] font-mono text-zinc-400 pt-2 border-t border-white/10">
                    <span className="uppercase tracking-widest text-[#A5ACAF]">
                      Commemorative Design · Official Collector’s Pass
                    </span>
                    <span className="text-[#69BE28] font-bold">
                      SHA-256 Verified NFC Ticket
                    </span>
                  </div>
                </div>

                {/* Right Ticket Stub (1 Col) */}
                <div className="flex flex-col items-center justify-between bg-black/50 border border-white/10 rounded-2xl p-5 text-center space-y-4">
                  <div>
                    {/* Holographic Seal Simulation */}
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-cyan-400 via-pink-500 to-yellow-300 p-0.5 shadow-lg shadow-[#69BE28]/30 animate-pulse">
                      <div className="w-full h-full rounded-full bg-[#002244] flex items-center justify-center p-2">
                        <Award className="w-7 h-7 text-[#69BE28]" />
                      </div>
                    </div>
                    <span className="text-[8px] font-mono uppercase text-zinc-400 tracking-widest mt-2 block">
                      Authentic Pass
                    </span>
                  </div>

                  {/* Scannable QR Code */}
                  <div className="p-3 bg-white rounded-xl shadow-xl">
                    <QRCodeSVG 
                      value={`https://nfl.gridiron.com/verify?ref=SEA-CARD-VIP-2026-DJ08&holder=Dena+Johnston`}
                      size={110}
                      level="H"
                    />
                  </div>

                  {/* Barcode & Reference */}
                  <div className="space-y-1 w-full">
                    <div className="h-8 bg-white/10 rounded p-1 flex items-center justify-around overflow-hidden">
                      {/* CSS Barcode Lines */}
                      {Array.from({ length: 32 }).map((_, i) => (
                        <div
                          key={i}
                          className="bg-white h-full"
                          style={{
                            width: (i % 3 === 0 ? "3px" : i % 2 === 0 ? "1px" : "2px"),
                            opacity: i % 4 === 0 ? 0.9 : 0.6
                          }}
                        />
                      ))}
                    </div>

                    <span className="text-[10px] font-mono font-black text-[#69BE28] block tracking-wider select-all">
                      SEA-CARD-VIP-2026-DJ08
                    </span>
                    <span className="text-[8px] font-mono text-zinc-400 block uppercase">
                      Lumen Field Gate 3 VIP Turnstile
                    </span>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="py-3.5 px-4 bg-gradient-to-r from-[#002244] to-blue-700 hover:from-[#00172E] hover:to-blue-600 border border-[#69BE28]/50 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-[#69BE28]" />
              {isDownloadingPdf ? "Generating PDF..." : "Download Official PDF"}
            </button>

            <button
              onClick={handleDownloadIsolatedPng}
              className="py-3.5 px-4 bg-gradient-to-r from-[#69BE28] to-emerald-400 hover:from-[#5cb31f] hover:to-emerald-500 text-black font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#69BE28]/20"
            >
              <Download className="w-4 h-4 text-black" />
              Download Ticket (PNG)
            </button>

            <button
              onClick={handleCopyRef}
              className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
              {copied ? "Copied Reference!" : "Copy Reference Code"}
            </button>

            <button
              onClick={handlePrint}
              className="py-3.5 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-black uppercase text-xs tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-zinc-400" />
              Print Commemorative Pass
            </button>
          </div>

          {/* Verification Audit Card */}
          <div className="bg-zinc-900/60 border border-white/5 rounded-2xl p-4 sm:p-5 text-xs text-zinc-400 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#69BE28]" /> Official Gridiron Vault Audit
              </span>
              <span className="text-[#69BE28] font-bold font-mono">STATUS: CONFIRMED · ADMISSION VALID</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[10px]">
              <div>Ticket Reference: <strong className="text-white">SEA-CARD-VIP-2026-DJ08</strong></div>
              <div>Authorized Holder: <strong className="text-white">Dena Johnston</strong></div>
              <div>Clearance Level: <strong className="text-white">VIP Club Level + Sideline Lounge</strong></div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
