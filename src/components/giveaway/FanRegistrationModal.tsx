import React, { useState, useEffect } from "react";
import { X, Shield, Sparkles, CheckCircle2, UserCheck, Heart, MapPin, Mail, User } from "lucide-react";
import { collection, setDoc, doc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { NFL_TEAMS } from "../../constants";
import { ImageUploader } from "../common/ImageUploader";
import { VirtualFanCard } from "./VirtualFanCard";
import { FanProfile } from "../../types/giveaway";
import { cn } from "../../lib/utils";

interface FanRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onRegistered?: (fan: FanProfile) => void;
}

export const FanRegistrationModal: React.FC<FanRegistrationModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onRegistered
}) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [city, setCity] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("MIN");
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredFan, setRegisteredFan] = useState<FanProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Do not auto-prefill personal emails or names to avoid unwanted exposure
  useEffect(() => {
    // Keep form fields clean for manual entry or custom privacy
  }, [currentUser]);

  if (!isOpen) return null;

  const generateFanCode = () => {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `NFG-${part1}-${part2}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !city.trim() || !favoriteTeam) {
      setError("Please complete all required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const fanId = currentUser?.uid ? `fan-${currentUser.uid}` : `fan-${Date.now()}`;
      const fanCode = generateFanCode();

      const newFan: FanProfile = {
        id: fanId,
        userId: currentUser?.uid || "guest",
        fullName: (fullName || "").trim(),
        email: (email || "").trim().toLowerCase(),
        city: (city || "").trim(),
        favoriteTeam: favoriteTeam || "MIN",
        profilePhotoUrl: profilePhotoUrl || "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=400",
        fanCode: fanCode || "",
        createdAt: Date.now()
      };

      await setDoc(doc(db, "registered_fans", fanId), newFan);
      try {
        localStorage.setItem("nfg_fan_profile", JSON.stringify(newFan));
      } catch (storageErr) {
        console.warn("Could not save fan to localStorage:", storageErr);
      }
      setRegisteredFan(newFan);
      if (onRegistered) onRegistered(newFan);
    } catch (err: any) {
      console.error("Fan registration error:", err);
      setError("Failed to complete fan registration: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden my-8 text-left">
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-[#013369] via-[#0A1A2F] to-zinc-950 border-b border-white/10 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-red-400 bg-red-600/20 border border-red-500/30 mb-2">
              <Shield className="w-3 h-3 text-red-500" />
              OFFICIAL REGISTRATION
            </span>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tight text-white">
              {registeredFan ? "FAN CARD ISSUED ✓" : "BECOME AN OFFICIAL FAN"}
            </h2>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider mt-1">
              {registeredFan
                ? "Your unique Fan Code and Virtual Fan Card are now active."
                : "Register once to receive your Fan Code and enter all Player Giveaways."}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all border border-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8">
          {registeredFan ? (
            <div className="space-y-6">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-3 text-emerald-400">
                <CheckCircle2 className="w-6 h-6 shrink-0" />
                <div>
                  <p className="text-xs font-black uppercase tracking-wider">
                    Registration Complete!
                  </p>
                  <p className="text-[10px] text-zinc-300 font-medium mt-0.5">
                    Your Fan Code <strong className="text-white font-mono">{registeredFan.fanCode}</strong> has been linked to your profile.
                  </p>
                </div>
              </div>

              {/* Render generated card */}
              <VirtualFanCard fan={registeredFan} />

              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg cursor-pointer"
                >
                  DONE & CONTINUE
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-xs font-bold uppercase tracking-wider">
                  {error}
                </div>
              )}

              {/* Grid Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jon Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. example@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* City of Residence */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-400" />
                    City of Residence *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Minneapolis, MN"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  />
                </div>

                {/* Favorite Team */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 text-red-500" />
                    Favorite NFL Franchise *
                  </label>
                  <select
                    value={favoriteTeam}
                    onChange={(e) => setFavoriteTeam(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-600 uppercase"
                  >
                    {NFL_TEAMS.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.city} {team.name} ({team.id})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Direct Profile Photo Upload */}
              <div className="pt-2">
                <ImageUploader
                  value={profilePhotoUrl}
                  onChange={setProfilePhotoUrl}
                  label="Fan Profile Photo (Direct Device Upload)"
                  placeholder="Select photo from device"
                  aspectRatio="square"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-4">
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                  * By registering, you agree to official giveaway terms and rules.
                </p>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "GENERATING FAN CARD..." : "REGISTER & ISSUE CARD"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
