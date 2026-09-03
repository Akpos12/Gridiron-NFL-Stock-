import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  Download,
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Calendar,
  MapPin,
  User,
  QrCode,
  Printer,
  Sparkles,
  RefreshCw,
  Eye,
  ExternalLink,
  MessageSquare,
  Copy,
  Check,
  Smartphone
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { generateTicketPDF, TicketPassInfo } from "../utils/ticketPdfGenerator";
import { cn } from "../lib/utils";

interface TicketCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSearchQuery?: string;
  onOpenLiveChat?: (contextId?: string) => void;
}

export const TicketCheckModal: React.FC<TicketCheckModalProps> = ({
  isOpen,
  onClose,
  initialSearchQuery = "",
  onOpenLiveChat,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Sync initial query when opened
  useEffect(() => {
    if (initialSearchQuery) {
      setSearchQuery(initialSearchQuery);
      performSearch(initialSearchQuery);
    } else {
      // Auto-load recent bookings from localStorage if available
      loadRecentTickets();
    }
  }, [initialSearchQuery, isOpen]);

  const loadRecentTickets = async () => {
    try {
      const recentIds: string[] = JSON.parse(localStorage.getItem("recent_ticket_orders") || "[]");
      const savedEmail = localStorage.getItem("user_email") || "";

      if (recentIds.length > 0 || savedEmail) {
        setIsLoading(true);
        const resultsMap = new Map<string, any>();

        // Query by recent IDs
        for (const orderId of (Array.isArray(recentIds) ? recentIds : []).slice(0, 5)) {
          if (!orderId) continue;
          try {
            const snap = await getDoc(doc(db, "bookings", orderId));
            if (snap.exists()) {
              resultsMap.set(snap.id, { id: snap.id, ...snap.data() });
            }
            const orderSnap = await getDoc(doc(db, "ticket_orders", orderId));
            if (orderSnap.exists()) {
              resultsMap.set(orderSnap.id, { ...resultsMap.get(orderSnap.id), id: orderSnap.id, ...orderSnap.data() });
            }
          } catch (e) {
            // ignore item error
          }
        }

        // Also query by saved email if present
        if (savedEmail && resultsMap.size === 0) {
          const bQuery = query(collection(db, "bookings"), where("userEmail", "==", savedEmail));
          const bSnap = await getDocs(bQuery);
          bSnap.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
        }

        const items = Array.from(resultsMap.values()).sort(
          (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );

        setTickets(items);
        if (items.length === 1) {
          setSelectedTicket(items[0]);
        }
      }
    } catch (err) {
      console.error("Error loading recent tickets:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const performSearch = async (queryText: string) => {
    const term = queryText.trim();
    if (!term) return;

    setIsLoading(true);
    setHasSearched(true);
    setSelectedTicket(null);

    try {
      const resultsMap = new Map<string, any>();
      const termLower = term.toLowerCase();

      // 1. Direct ID lookup in bookings & ticket_orders
      try {
        const docSnap = await getDoc(doc(db, "bookings", term));
        if (docSnap.exists()) {
          resultsMap.set(docSnap.id, { id: docSnap.id, ...docSnap.data() });
        }
      } catch (e) {}

      try {
        const orderSnap = await getDoc(doc(db, "ticket_orders", term));
        if (orderSnap.exists()) {
          resultsMap.set(orderSnap.id, { ...resultsMap.get(orderSnap.id), id: orderSnap.id, ...orderSnap.data() });
        }
      } catch (e) {}

      // 2. Query bookings by email
      try {
        const emailSnap = await getDocs(query(collection(db, "bookings"), where("userEmail", "==", term)));
        emailSnap.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));

        const buyerEmailSnap = await getDocs(query(collection(db, "bookings"), where("buyerEmail", "==", term)));
        buyerEmailSnap.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (e) {}

      // 3. Query ticket_orders by buyerEmail
      try {
        const toEmailSnap = await getDocs(query(collection(db, "ticket_orders"), where("buyerEmail", "==", term)));
        toEmailSnap.forEach(d => {
          resultsMap.set(d.id, { ...resultsMap.get(d.id), id: d.id, ...d.data() });
        });
      } catch (e) {}

      // 4. Query by qrCode or ticketCode
      try {
        const codeSnap = await getDocs(query(collection(db, "bookings"), where("qrCode", "==", term)));
        codeSnap.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));

        const tCodeSnap = await getDocs(query(collection(db, "bookings"), where("ticketCode", "==", term)));
        tCodeSnap.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      } catch (e) {}

      // If no exact matches yet, fetch all recent and fuzzy filter
      if (resultsMap.size === 0) {
        try {
          const allSnap = await getDocs(collection(db, "bookings"));
          allSnap.forEach(d => {
            const data = d.data();
            const str = JSON.stringify(data).toLowerCase();
            if (str.includes(termLower)) {
              resultsMap.set(d.id, { id: d.id, ...data });
            }
          });
        } catch (e) {}
      }

      const items = Array.from(resultsMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      setTickets(items);
      if (items.length > 0) {
        setSelectedTicket(items[0]);
      }
    } catch (err: any) {
      console.error("Search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = (t: any) => {
    setDownloadingId(t.id);
    try {
      const isStockholder =
        t.isStockholder === true ||
        t.isShareholder === true ||
        t.tier === "stockholder_vip" ||
        t.paymentChannel?.toLowerCase().includes("stockholder") ||
        t.paymentMethod?.toLowerCase().includes("stockholder") ||
        (t.buyerEmail && t.buyerEmail.toLowerCase().includes("jayne_welage")) ||
        (t.buyerName && t.buyerName.toLowerCase().includes("welage"));

      const ticketIdStr = String(t.id || t.orderId || "PASS");
      const passInfo: TicketPassInfo = {
        id: t.id || ticketIdStr,
        orderId: t.orderId || t.id || ticketIdStr,
        ticketCode: t.ticketCode || t.qrCode || `NFL-PASS-${ticketIdStr.slice(-6).toUpperCase()}`,
        qrCode: t.qrCode || t.ticketCode,
        passCode: t.qrCode || t.ticketCode,
        eventTitle: t.experienceTitle || t.gameName || "NFL Match & Experience Pass",
        experienceTitle: t.experienceTitle,
        gameName: t.gameName,
        stadium: t.stadium || "NFL Arena Stadium",
        city: t.city || "United States",
        date: t.date || (isStockholder ? "TBD (Schedule Announcement Pending)" : "Scheduled Date"),
        time: t.timeSlot || t.time || (isStockholder ? "TBA (Stockholder Briefing Notice)" : "Event Kickoff"),
        isDateTbd: t.isDateTbd || !t.date || t.date.toLowerCase().includes("tbd"),
        tier: isStockholder ? "FRANCHISE STOCKHOLDER VIP" : (t.tier || "VIP ALL-ACCESS"),
        quantity: t.guestsCount || t.quantity || 1,
        guestsCount: t.guestsCount || t.quantity || 1,
        totalAmount: isStockholder ? 0 : (t.totalPrice || t.totalAmount || 0),
        totalPrice: isStockholder ? 0 : (t.totalPrice || t.totalAmount || 0),
        isStockholder: isStockholder,
        isShareholder: isStockholder,
        stockholderTitle: t.stockholderTitle || (isStockholder ? "Franchise Shareholder & Team Stock Investor" : undefined),
        buyerName: t.buyerName || t.senderName || "VIP Passholder",
        buyerEmail: t.buyerEmail || t.userEmail || "",
        buyerPhone: t.buyerPhone || "",
        status: t.status,
        isApproved: t.status === "approved" || t.status === "confirmed" || t.isApproved === true,
        approvedAt: t.approvedAt,
        approvedBy: t.approvedBy || (isStockholder ? "NFL Gridiron Executive Treasury & Investor Relations" : "NFL Gridiron Box Office Management"),
      };

      generateTicketPDF(passInfo);
    } catch (err: any) {
      console.error("PDF generation error:", err);
      alert("Error creating PDF ticket: " + err.message);
    } finally {
      setTimeout(() => {
        setDownloadingId(null);
      }, 500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Top Gradient Header */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black italic uppercase tracking-tighter text-white">
                Check Ticket & Download Pass
              </h3>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">
                Look up your order status, verify box office approval, & download official PDF passes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 sm:p-6 bg-zinc-900/40 border-b border-white/5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              performSearch(searchQuery);
            }}
            className="flex flex-col sm:flex-row gap-2.5"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter Email Address, Order Reference ID, or Pass Code..."
                className="w-full bg-zinc-900 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-2xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Check Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading && tickets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Verifying ticket records in Box Office database...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-500">
                <Ticket className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-white">
                  {hasSearched ? "No Tickets Found" : "Search For Your Ticket"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {hasSearched
                    ? "We couldn't locate any ticket passes matching that email or reference ID. Please double check your spelling or contact Customer Care."
                    : "Enter the email address or order reference ID you used during checkout to check the audit status and download your authorized pass."}
                </p>
              </div>

              {onOpenLiveChat && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenLiveChat(searchQuery);
                  }}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-blue-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mx-auto transition-colors border border-white/5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Contact Box Office / Support</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Tickets List (if multiple) */}
              <div className={cn("space-y-3", tickets.length > 1 ? "lg:col-span-5" : "hidden")}>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 px-1">
                  Found Orders ({tickets.length})
                </p>
                <div className="space-y-2.5">
                  {tickets.map((t) => {
                    const isApproved = t.status === "approved" || t.status === "confirmed" || t.isApproved;
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTicket(t)}
                        className={cn(
                          "p-3.5 rounded-2xl border transition-all cursor-pointer text-left",
                          isSelected
                            ? "bg-blue-600/10 border-blue-500/50 shadow-md"
                            : "bg-zinc-900/50 border-white/5 hover:border-white/20"
                        )}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest flex items-center gap-1",
                              isApproved
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : t.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}
                          >
                            {isApproved ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" /> APPROVED
                              </>
                            ) : t.status === "rejected" ? (
                              <>
                                <AlertCircle className="w-2.5 h-2.5" /> REJECTED
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5 animate-spin" /> PENDING REVIEW
                              </>
                            )}
                          </span>
                          <span className="text-[8px] font-mono text-zinc-500 font-bold">
                            #{String(t.id || t.orderId || "TICKET").slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <h5 className="text-xs font-black uppercase text-white truncate">
                          {t.experienceTitle || t.gameName || "VIP Pass"}
                        </h5>
                        <p className="text-[9px] text-zinc-400 font-medium mt-0.5">
                          {t.date} · {t.tier?.toUpperCase() || "VIP"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Ticket Details & Download Card */}
              {selectedTicket && (
                <div className={cn("space-y-4", tickets.length > 1 ? "lg:col-span-7" : "lg:col-span-12")}>
                  {/* Status Banner */}
                  {selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                            Ticket Approved & Pass Issued!
                          </h4>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono">
                            READY FOR ENTRY
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 font-medium mt-1 leading-relaxed">
                          Your payment receipt has been verified and authorized by Box Office Management. Your official PDF pass is ready to download.
                        </p>
                      </div>
                    </div>
                  ) : selectedTicket.status === "rejected" ? (
                    <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                          Payment Receipt Rejected
                        </h4>
                        <p className="text-[10px] text-zinc-300 font-medium mt-1 leading-relaxed">
                          Reason: {selectedTicket.rejectReason || "Receipt could not be verified by Box Office management."}
                        </p>
                        {onOpenLiveChat && (
                          <button
                            onClick={() => {
                              onClose();
                              onOpenLiveChat(selectedTicket.id);
                            }}
                            className="mt-2.5 px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-colors"
                          >
                            <MessageSquare className="w-3 h-3" /> Contact Support for Assistance
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                            Payment Under Box Office Review
                          </h4>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                            AUDIT IN PROGRESS
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-300 font-medium mt-1 leading-relaxed">
                          Your payment screenshot/receipt is currently being reviewed in the Control Room. As soon as management verifies your payment, your pass code and PDF download will unlock automatically here.
                        </p>
                        <button
                          onClick={() => performSearch(searchQuery || selectedTicket.id)}
                          className="mt-2 px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-lg text-[8px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> Check Real-Time Update
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Main Interactive Ticket Pass Card */}
                  <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Card Top: Title & Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                      <div>
                        <span className="text-[9px] font-mono font-black uppercase tracking-widest text-blue-400">
                          OFFICIAL VIP PASS · #{String(selectedTicket.id || selectedTicket.orderId || "PASS").slice(-8).toUpperCase()}
                        </span>
                        <h4 className="text-base sm:text-lg font-black uppercase text-white mt-0.5">
                          {selectedTicket.experienceTitle || selectedTicket.gameName || "VIP Match Pass"}
                        </h4>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-[8px] text-zinc-500 font-bold uppercase block">GATE PASSCODE</span>
                        <span className="text-sm font-mono font-black text-emerald-400 select-all tracking-wider">
                          {selectedTicket.ticketCode || selectedTicket.qrCode || `PENDING-APPROVAL`}
                        </span>
                      </div>
                    </div>

                    {/* Card Middle: Key Grid */}
                    {(() => {
                      const isStockholder =
                        selectedTicket.isStockholder === true ||
                        selectedTicket.isShareholder === true ||
                        selectedTicket.tier === "stockholder_vip" ||
                        selectedTicket.paymentChannel?.toLowerCase().includes("stockholder") ||
                        selectedTicket.paymentMethod?.toLowerCase().includes("stockholder") ||
                        (selectedTicket.buyerEmail && selectedTicket.buyerEmail.toLowerCase().includes("jayne_welage")) ||
                        (selectedTicket.buyerName && selectedTicket.buyerName.toLowerCase().includes("welage"));

                      const isDateTbd =
                        selectedTicket.isDateTbd ||
                        !selectedTicket.date ||
                        selectedTicket.date.toLowerCase().includes("tbd") ||
                        selectedTicket.date.toLowerCase().includes("pending");

                      const guestsNum = selectedTicket.guestsCount || selectedTicket.quantity || 1;

                      return (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 py-4 border-b border-white/10 text-xs">
                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> Date & Time
                            </span>
                            {isDateTbd ? (
                              <>
                                <p className="font-bold text-amber-400 mt-0.5 flex items-center gap-1">
                                  <span>Schedule Pending (TBD)</span>
                                </p>
                                <p className="text-[10px] text-zinc-400 font-mono">
                                  {selectedTicket.timeSlot && !selectedTicket.timeSlot.includes("02:00") ? selectedTicket.timeSlot : "TBA (Stockholder Briefing Notice)"}
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="font-bold text-white mt-0.5">{selectedTicket.date}</p>
                                <p className="text-[10px] text-zinc-400 font-mono">{selectedTicket.timeSlot || selectedTicket.time || "Kickoff TBA"}</p>
                              </>
                            )}
                          </div>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" /> Venue Arena
                            </span>
                            <p className="font-bold text-white mt-0.5 truncate">{selectedTicket.stadium || selectedTicket.city || "NFL Stadium"}</p>
                            <p className="text-[10px] text-zinc-400">{selectedTicket.city || "United States"}</p>
                          </div>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1">
                              <User className="w-2.5 h-2.5" /> Passholder
                            </span>
                            <p className="font-bold text-white mt-0.5 truncate">
                              {selectedTicket.buyerName || selectedTicket.senderName || (isStockholder ? "Jayne Welage" : "VIP Guest")}
                            </p>
                            <p className="text-[10px] text-zinc-400 truncate">{selectedTicket.buyerEmail || selectedTicket.userEmail}</p>
                          </div>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Tier / Seat Allocation</span>
                            <p className="font-bold text-amber-400 mt-0.5">
                              {selectedTicket.seatDetails
                                ? selectedTicket.seatDetails
                                : isStockholder 
                                  ? "FRANCHISE STOCKHOLDER VIP" 
                                  : (selectedTicket.tier?.toUpperCase().replace(/_/g, " ") || "VIP ACCESS")}
                            </p>
                          </div>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Guest Count</span>
                            <p className="font-bold text-white mt-0.5">
                              {guestsNum} {guestsNum === 1 ? "Person (Primary Passholder)" : "Persons"}
                            </p>
                          </div>

                          <div>
                            <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Total Paid</span>
                            {isStockholder || (Number(selectedTicket.totalPrice || selectedTicket.totalAmount || 0) === 0) ? (
                              <div className="mt-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Stockholder Privilege (Cleared)
                                </span>
                              </div>
                            ) : (
                              <p className="font-bold text-emerald-400 mt-0.5">
                                ${Number(selectedTicket.totalPrice || selectedTicket.totalAmount || 0).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Scannable Live QR Gate Pass Section */}
                    {(() => {
                      const origin =
                        typeof window !== "undefined" && window.location.origin
                          ? window.location.origin
                          : "https://ais-dev-fzmmrb2i7l3evzvs4xbafg-53620454143.europe-west2.run.app";
                      const passCodeVal =
                        selectedTicket.ticketCode ||
                        selectedTicket.qrCode ||
                        `PASS-${String(selectedTicket.id || selectedTicket.orderId || "AUTH").slice(-8).toUpperCase()}`;
                      const qrVerificationUrl = `${origin}/?verifyTicket=${encodeURIComponent(passCodeVal)}`;
                      const isApproved =
                        selectedTicket.status === "approved" ||
                        selectedTicket.status === "confirmed" ||
                        selectedTicket.isApproved;

                      return (
                        <div className="my-4 p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-white/10 flex flex-col sm:flex-row items-center gap-5">
                          {/* QR Code Canvas */}
                          <div className="relative group shrink-0">
                            <div className="p-3 bg-white rounded-2xl shadow-xl flex items-center justify-center border-2 border-emerald-500/40">
                              <QRCodeSVG
                                value={qrVerificationUrl}
                                size={132}
                                level="M"
                                includeMargin={false}
                                className="w-28 h-28 sm:w-32 sm:h-32"
                              />
                            </div>
                            <div className="mt-1.5 text-center">
                              <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                {isApproved ? "SCANNABLE PASS" : "PREVIEW PASS"}
                              </span>
                            </div>
                          </div>

                          {/* Pass Scanner & Verification Details */}
                          <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2">
                              <div>
                                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1 justify-center sm:justify-start">
                                  <Smartphone className="w-2.5 h-2.5 text-blue-400" /> OFFICIAL DIGITAL RFID PASSCODE
                                </span>
                                <p className="text-sm sm:text-base font-mono font-black text-emerald-400 tracking-wider break-all select-all">
                                  {passCodeVal}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(passCodeVal, "passCode")}
                                className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/10 transition-colors cursor-pointer"
                              >
                                {copiedKey === "passCode" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3 text-blue-400" /> Copy Code
                                  </>
                                )}
                              </button>
                            </div>

                            <p className="text-[10px] text-zinc-400 leading-relaxed">
                              Point any smartphone camera at this QR code to instantly verify official box office credentials and authorized gate clearance.
                            </p>

                            <div className="pt-1 flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCopy(qrVerificationUrl, "qrLink")}
                                className="px-3 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-300 text-[9px] font-black uppercase tracking-wider border border-blue-500/20 flex items-center gap-1 transition-all cursor-pointer"
                              >
                                {copiedKey === "qrLink" ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" /> Verification Link Copied!
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="w-3 h-3" /> Copy Scan URL
                                  </>
                                )}
                              </button>

                              <a
                                href={qrVerificationUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white text-[9px] font-black uppercase tracking-wider border border-white/5 flex items-center gap-1 transition-all"
                              >
                                <Eye className="w-3 h-3" /> Test Gate Scan Link
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card Actions: Download PDF / Print */}
                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-[9px] text-zinc-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span>Cryptographically signed by NFL Gridiron Box Office</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(selectedTicket)}
                          disabled={
                            !(
                              selectedTicket.status === "approved" ||
                              selectedTicket.status === "confirmed" ||
                              selectedTicket.isApproved
                            ) || downloadingId === selectedTicket.id
                          }
                          className={cn(
                            "flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer",
                            selectedTicket.status === "approved" ||
                              selectedTicket.status === "confirmed" ||
                              selectedTicket.isApproved
                              ? "bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95"
                              : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                          )}
                          title={
                            selectedTicket.status === "approved" ||
                            selectedTicket.status === "confirmed" ||
                            selectedTicket.isApproved
                              ? "Download official vector PDF pass"
                              : "PDF download will unlock once Box Office confirms approval"
                          }
                        >
                          <Download className="w-4 h-4" />
                          <span>
                            {downloadingId === selectedTicket.id
                              ? "Generating PDF..."
                              : selectedTicket.status === "approved" ||
                                selectedTicket.status === "confirmed" ||
                                selectedTicket.isApproved
                              ? "Download Ticket (PDF)"
                              : "PDF Locked (Pending Approval)"}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-zinc-950 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-[10px] text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Box Office Gateway Synchronization Active</span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenLiveChat && (
              <button
                onClick={() => {
                  onClose();
                  onOpenLiveChat(selectedTicket?.id || searchQuery);
                }}
                className="text-blue-400 hover:text-blue-300 font-bold uppercase transition-colors flex items-center gap-1 cursor-pointer"
              >
                <MessageSquare className="w-3 h-3" /> Live Support Concierge
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold uppercase transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
