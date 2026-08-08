import React, { useRef, useState } from "react";
import { Shield, Share2, Download, Check, Sparkles, User, MapPin, Award, Eye } from "lucide-react";
import { FanProfile } from "../../types/giveaway";
import { NFL_TEAMS } from "../../constants";
import { cn } from "../../lib/utils";

interface VirtualFanCardProps {
  fan: FanProfile;
  onViewClick?: () => void;
  className?: string;
  isCompact?: boolean;
}

export const VirtualFanCard: React.FC<VirtualFanCardProps> = ({
  fan,
  onViewClick,
  className = "",
  isCompact = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const team = NFL_TEAMS.find(t => t.id === fan.favoriteTeam) || {
    id: fan.favoriteTeam || "MIN",
    name: "Vikings",
    city: "Minnesota"
  };

  const handleShare = async () => {
    const shareText = `Check out my Official NFL Gridiron Fan Card! Fan Code: ${fan.fanCode} | Team: ${team.city} ${team.name}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "NFL Gridiron Fan Card",
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        // User cancelled share
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    setIsDownloading(true);
    try {
      const cardElement = cardRef.current;
      if (!cardElement) return;

      // Draw onto canvas for download
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 600;
      canvas.height = 360;

      if (ctx) {
        // Background gradient
        const grad = ctx.createLinearGradient(0, 0, 600, 360);
        grad.addColorStop(0, "#013369");
        grad.addColorStop(1, "#0A1A2F");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 600, 360);

        // Red Accent stripe
        ctx.fillStyle = "#D50A0A";
        ctx.fillRect(0, 0, 16, 360);

        // Outer Border
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 4;
        ctx.strokeRect(8, 8, 584, 344);

        // Header text
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "italic 900 24px sans-serif";
        ctx.fillText("NFL GRIDIRON EXCHANGE", 36, 45);

        ctx.fillStyle = "#D50A0A";
        ctx.font = "900 12px sans-serif";
        ctx.fillText("OFFICIAL REGISTERED FAN CARD", 36, 68);

        // Fan Name
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 28px sans-serif";
        ctx.fillText(fan.fullName.toUpperCase(), 36, 130);

        // Details
        ctx.fillStyle = "#9CA3AF";
        ctx.font = "700 12px sans-serif";
        ctx.fillText("CITY OF RESIDENCE", 36, 170);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "900 16px sans-serif";
        ctx.fillText(fan.city.toUpperCase(), 36, 190);

        ctx.fillStyle = "#9CA3AF";
        ctx.font = "700 12px sans-serif";
        ctx.fillText("FAVORITE FRANCHISE", 36, 230);
        ctx.fillStyle = "#60A5FA";
        ctx.font = "900 16px sans-serif";
        ctx.fillText(`${team.city.toUpperCase()} ${team.name.toUpperCase()} (${team.id})`, 36, 250);

        // Fan Code Banner
        ctx.fillStyle = "#020B14";
        ctx.fillRect(36, 280, 320, 48);
        ctx.fillStyle = "#38BDF8";
        ctx.font = "bold 20px monospace";
        ctx.fillText(fan.fanCode, 52, 312);

        // Download link execution
        const dataUrl = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `NFL-FanCard-${fan.fanCode}.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error("Download card error:", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Fan Card Canvas Container */}
      <div
        ref={cardRef}
        className={cn(
          "relative overflow-hidden rounded-[2rem] border border-white/15 shadow-2xl transition-all duration-300 text-left",
          "bg-gradient-to-br from-[#013369] via-[#0A1A2F] to-[#020B14] text-white p-6 md:p-8"
        )}
      >
        {/* Holographic NFL Pattern Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(213,10,10,0.18),transparent_50%)] pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center font-black italic text-lg text-white shadow-lg shadow-red-600/30 border border-white/20">
              NFL
            </div>
            <div>
              <h3 className="text-sm md:text-base font-black italic uppercase tracking-wider text-white">
                NFL GRIDIRON
              </h3>
              <p className="text-[9px] font-black uppercase tracking-widest text-red-400">
                OFFICIAL REGISTERED FAN CARD
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest">
            <Sparkles className="w-3 h-3" />
            <span>VERIFIED FAN</span>
          </div>
        </div>

        {/* Customer Care Winner Banner */}
        {(fan.isWinner || fan.winningPrize) && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border-2 border-amber-500/50 relative z-10 space-y-2 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-black text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-300" />
                <span>🏆 CUSTOMER CARE WINNER NOTIFICATION</span>
              </div>
              {fan.claimCode && (
                <span className="px-2.5 py-0.5 bg-black/60 text-cyan-300 rounded font-mono text-[9px] font-black uppercase">
                  CODE: {fan.claimCode}
                </span>
              )}
            </div>
            <p className="text-xs font-black text-white italic">
              PRIZE: {fan.winningPrize || "Official NFL Player Giveaway Winner!"}
            </p>
            {fan.winningMessage && (
              <p className="text-[10px] text-zinc-300 font-medium leading-relaxed bg-black/40 p-2.5 rounded-xl border border-amber-500/20">
                "{fan.winningMessage}"
              </p>
            )}
          </div>
        )}

        {/* Body Info Grid */}
        <div className="grid grid-cols-12 gap-6 items-center relative z-10">
          {/* Profile Photo */}
          <div className="col-span-4 sm:col-span-3">
            <div className="aspect-square rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-900 shadow-xl relative group">
              {fan.profilePhotoUrl ? (
                <img
                  src={fan.profilePhotoUrl}
                  alt={fan.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600">
                  <User className="w-8 h-8" />
                  <span className="text-[8px] font-bold uppercase mt-1">NO PHOTO</span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 text-center">
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest">
                  VIP PASS
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="col-span-8 sm:col-span-9 space-y-3">
            <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400">
                CARDHOLDER NAME
              </span>
              <h2 className="text-xl md:text-2xl font-black italic uppercase tracking-tight text-white leading-tight">
                {fan.fullName}
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5 text-zinc-400" /> CITY
                </span>
                <p className="text-xs font-black uppercase text-zinc-200 truncate">
                  {fan.city}
                </p>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-blue-400" /> FRANCHISE
                </span>
                <p className="text-xs font-black uppercase text-blue-400 truncate">
                  {team.city} {team.name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Fan Code Bar */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <div className="w-full sm:w-auto bg-black/50 border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between sm:justify-start gap-4">
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">
              FAN CODE
            </span>
            <span className="text-sm font-mono font-black text-cyan-400 tracking-wider">
              {fan.fanCode}
            </span>
          </div>

          <div className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">
            <span>ISSUED BY NFL GRIDIRON GIVEAWAY SYSTEM</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Toolbar */}
      {!isCompact && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {onViewClick && (
            <button
              onClick={onViewClick}
              className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2 transition-all cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>VIEW FAN CARD</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={handleShare}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/20"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>COPIED CODE</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span>SHARE</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span>{isDownloading ? "EXPORTING..." : "SAVE CARD"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
