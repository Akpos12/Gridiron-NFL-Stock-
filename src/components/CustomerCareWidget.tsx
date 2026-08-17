import React, { useState, useEffect } from "react";
import { 
  Headphones, 
  Search, 
  MessageSquareText, 
  X, 
  Sparkles, 
  HelpCircle, 
  Send, 
  ChevronRight, 
  PackageCheck, 
  ShieldCheck, 
  RefreshCw,
  Clock,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

interface CustomerCareWidgetProps {
  onOpenCustomerCare: () => void;
  onOpenTrackInquiry: (initialTab?: "ticket" | "email") => void;
  user?: any;
}

export const CustomerCareWidget: React.FC<CustomerCareWidgetProps> = ({
  onOpenCustomerCare,
  onOpenTrackInquiry,
  user
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  return (
    <>
      {/* Floating Action Button (Bottom Right) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3 select-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="w-80 sm:w-96 bg-zinc-950/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-2xl relative overflow-hidden text-left"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-emerald-500" />
              
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black italic uppercase tracking-tight text-white flex items-center gap-1.5">
                      Customer Care
                      <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </h4>
                    <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      Concierge & Support Hub
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons */}
              <div className="py-4 space-y-2.5">
                {/* 1. Track Existing Inquiry */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenTrackInquiry();
                  }}
                  className="w-full p-3.5 bg-gradient-to-r from-blue-950/50 to-zinc-900/90 hover:from-blue-900/60 hover:to-zinc-800/90 border border-blue-500/30 hover:border-blue-400/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 group-hover:scale-105 transition-transform">
                      <Search className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white group-hover:text-blue-300 transition-colors block">
                        Track Existing Inquiry
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">
                        Search by Ticket ID or Email
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>

                {/* 2. Contact Customer Care */}
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenCustomerCare();
                  }}
                  className="w-full p-3.5 bg-gradient-to-r from-emerald-950/40 to-zinc-900/90 hover:from-emerald-900/50 hover:to-zinc-800/90 border border-emerald-500/30 hover:border-emerald-400/50 rounded-2xl transition-all flex items-center justify-between group cursor-pointer shadow-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 group-hover:scale-105 transition-transform">
                      <MessageSquareText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-black uppercase tracking-wider text-white group-hover:text-emerald-300 transition-colors block">
                        Contact Customer Care
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">
                        Submit New Request or Claim
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>

              {/* Status info footer */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest text-zinc-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  Official NFL Exchange Protocol
                </span>
                <span className="text-emerald-400">Average response: &lt; 5m</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Main Trigger Pill */}
        <div className="flex items-center gap-2">
          {/* Quick direct buttons on desktop */}
          <div className="hidden md:flex items-center gap-1.5 bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-2xl">
            <button
              onClick={() => onOpenTrackInquiry()}
              className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all border border-white/5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              Track Ticket
            </button>
            <button
              onClick={() => onOpenCustomerCare()}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
            >
              <Headphones className="w-3.5 h-3.5 text-white" />
              Customer Care
            </button>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "h-12 px-4 rounded-2xl flex items-center gap-2.5 font-black text-xs uppercase tracking-wider transition-all shadow-2xl cursor-pointer border",
              isOpen
                ? "bg-white text-black border-white"
                : "bg-zinc-900/95 hover:bg-zinc-850 text-white border-blue-500/40 hover:border-blue-400 shadow-blue-500/10"
            )}
          >
            <div className="relative">
              <Headphones className="w-4 h-4 text-blue-400" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="hidden xs:inline">Support</span>
          </button>
        </div>
      </div>
    </>
  );
};
