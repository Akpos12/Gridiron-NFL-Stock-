import React, { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Calendar, MapPin, ShieldCheck, Ticket, X } from "lucide-react";

interface CeeDeePublicMeetGreetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSecureSlot: () => void;
}

export const CeeDeePublicMeetGreetPopup: React.FC<CeeDeePublicMeetGreetPopupProps> = ({
  isOpen,
  onClose,
  onSecureSlot,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[180] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ceedee-public-popup-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#02050D]/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-3xl rounded-3xl overflow-hidden border border-[#B0B7BC]/30 bg-[#040B1A] shadow-[0_32px_90px_-12px_rgba(0,53,148,0.65)] my-auto"
          >
            {/* Stadium Floodlight Accent Glow */}
            <div
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none blur-[110px]"
              style={{ background: "rgba(0, 53, 148, 0.45)" }}
            />
            <div
              className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none blur-[110px]"
              style={{ background: "rgba(176, 183, 188, 0.16)" }}
            />

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close announcement"
              className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 z-30 w-10 h-10 rounded-full bg-[#030712]/85 hover:bg-[#003594] border border-white/20 text-zinc-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-12">
              {/* Left Portrait Column */}
              <div className="md:col-span-5 relative min-h-[250px] sm:min-h-[300px] md:min-h-[440px] bg-[#020612] overflow-hidden border-b md:border-b-0 md:border-r border-white/10">
                <img
                  src="/assets/aistudio/IMG_1832_f33e4b9e.jpeg"
                  alt="CeeDee Lamb #88 Dallas Cowboys"
                  className="w-full h-full object-cover object-[center_15%]"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040B1A] via-[#040B1A]/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#040B1A]/40 hidden md:block" />

                {/* Subtle Athlete Caption Over Scrim */}
                <div className="absolute bottom-4 left-4 right-4 z-10 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#B0B7BC]">
                      Dallas Cowboys · WR #88
                    </p>
                    <p className="font-display text-xl sm:text-2xl font-extrabold uppercase tracking-tight text-white leading-none mt-0.5">
                      CeeDee Lamb
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono text-lg font-black text-white block leading-none">
                      $100
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#B0B7BC]">
                      Per Ticket
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Content Column */}
              <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-gradient-to-br from-[#040B1A] via-[#061430] to-[#030712]">
                <div className="space-y-4">
                  {/* Top Editorial Eyebrow */}
                  <div className="flex items-center gap-2 pr-8 text-xs font-bold uppercase tracking-[0.2em] text-[#B0B7BC]">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8]" />
                    <span>Featured Fan Event · Official Announcement</span>
                  </div>

                  {/* Main Heading */}
                  <h2
                    id="ceedee-public-popup-title"
                    className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-extrabold uppercase tracking-tight leading-[1.02] text-white"
                  >
                    CEEDÉE LAMB{" "}
                    <span className="bg-gradient-to-r from-white via-[#E2E8F0] to-[#93C5FD] bg-clip-text text-transparent">
                      PUBLIC MEET &amp; GREET
                    </span>
                  </h2>

                  {/* Opening Description */}
                  <p className="text-sm sm:text-[15px] text-zinc-200 leading-relaxed font-medium">
                    Get ready for an unforgettable fan experience! Join us on December 26th for an exclusive opportunity to meet CeeDee Lamb in person.
                  </p>

                  {/* Structured Event Specifications List */}
                  <div className="rounded-2xl bg-[#030712]/80 border border-[#B0B7BC]/20 divide-y divide-white/[0.08]">
                    <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 text-[#B0B7BC] font-semibold">
                        <Ticket className="w-4 h-4 text-[#60A5FA] shrink-0" />
                        Event
                      </span>
                      <span className="font-bold text-white text-right">
                        Public Meet &amp; Greet
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 text-[#B0B7BC] font-semibold">
                        <Calendar className="w-4 h-4 text-[#60A5FA] shrink-0" />
                        Date
                      </span>
                      <span className="font-bold text-white text-right">
                        December 26th
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 text-[#B0B7BC] font-semibold">
                        <MapPin className="w-4 h-4 text-[#60A5FA] shrink-0" />
                        Venue
                      </span>
                      <span className="font-bold text-white text-right">
                        AT&amp;T Stadium · Arlington, Texas
                      </span>
                    </div>

                    <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="inline-flex items-center gap-2 text-[#B0B7BC] font-semibold">
                        <ShieldCheck className="w-4 h-4 text-[#60A5FA] shrink-0" />
                        Admission
                      </span>
                      <span className="font-mono text-base font-black text-white text-right">
                        $100
                      </span>
                    </div>
                  </div>

                  {/* Urgency Copy */}
                  <p className="text-xs sm:text-sm font-semibold text-[#E2E8F0] leading-snug">
                    Slots are limited. Secure your spot today before registration closes!
                  </p>
                </div>

                {/* Primary CTA & Dismiss Row */}
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={onSecureSlot}
                    className="w-full min-h-[52px] px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#003594] via-[#1D4ED8] to-[#003594] hover:brightness-115 text-white border border-[#B0B7BC]/35 font-extrabold text-sm sm:text-base uppercase tracking-wider shadow-[0_14px_34px_-6px_rgba(0,53,148,0.65)] transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer inline-flex items-center justify-center gap-2.5"
                  >
                    <span>SECURE YOUR SLOT</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <div className="flex items-center justify-between gap-3 text-[11px] text-[#94A3B8]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#60A5FA] shrink-0" />
                      <span>AT&amp;T Stadium, Arlington TX · $100 Admission</span>
                    </span>
                    <button
                      type="button"
                      onClick={onClose}
                      className="font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
