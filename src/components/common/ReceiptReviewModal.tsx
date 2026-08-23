import React, { useState } from "react";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  FileCheck, 
  Eye, 
  ExternalLink, 
  Download, 
  Building2, 
  Smartphone, 
  QrCode, 
  ShieldCheck, 
  DollarSign, 
  Calendar, 
  Clock, 
  User, 
  Mail, 
  Phone, 
  Ticket,
  AlertTriangle,
  ZoomIn,
  Copy,
  Check,
  Printer,
  Sparkles,
  RefreshCw,
  Hash,
  Send
} from "lucide-react";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatCurrency, cn } from "../../lib/utils";
import { QRCodeSVG } from "qrcode.react";

export interface BookingAuditItem {
  id: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  senderName?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  experienceId?: string;
  experienceTitle?: string;
  itemName?: string;
  itemType?: string;
  teamId?: string;
  gameName?: string;
  date?: string;
  timeSlot?: string;
  time?: string;
  tier?: string;
  guestsCount?: number;
  quantity?: number;
  totalPrice?: number;
  price?: number;
  totalAmount?: number;
  dueToday?: number;
  paymentMethod?: string;
  paymentRef?: string;
  paymentReference?: string;
  receiptImage?: string;
  receiptImageUrl?: string;
  status?: string;
  createdAt?: string;
  timestamp?: any;
  qrCode?: string;
  ticketCode?: string;
  managementNotes?: string;
}

interface ReceiptReviewModalProps {
  booking: BookingAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
  onApprove?: (bookingId: string, issuedCode?: string) => Promise<void> | void;
  onReject?: (bookingId: string, reason: string) => Promise<void> | void;
}

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  booking,
  isOpen,
  onClose,
  onStatusUpdated,
  onApprove,
  onReject
}) => {
  const [activeTab, setActiveTab] = useState<"receipt" | "ticket" | "invoice">("receipt");
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [customTicketCode, setCustomTicketCode] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  if (!isOpen || !booking) return null;

  const attendeeName = booking.senderName || booking.buyerName || booking.userName || booking.userEmail?.split("@")[0] || "VIP Attendee";
  const attendeeEmail = booking.buyerEmail || booking.userEmail || "Not Provided";
  const attendeePhone = booking.buyerPhone || "Direct VIP Account";
  const eventTitle = booking.experienceTitle || booking.itemName || booking.gameName || "NFL Official Game / Event Pass";
  const sessionDate = booking.date || (booking.timestamp?.toDate ? booking.timestamp.toDate().toLocaleDateString() : "Matchday 2026");
  const sessionTime = booking.timeSlot || booking.time || "VIP Stadium Access (Gate Opens 3 hrs early)";
  const passTier = (booking.tier || "VIP ALL-ACCESS").toUpperCase();
  const ticketCount = booking.guestsCount || booking.quantity || 1;
  const grandTotal = booking.totalPrice || booking.price || booking.totalAmount || 0;
  const paymentChannel = booking.paymentMethod || "Direct Settlement";
  const referenceCode = booking.paymentRef || booking.paymentReference || "PENDING_VERIFICATION";
  const receiptImg = booking.receiptImage || booking.receiptImageUrl || "";
  
  // Deterministic or stored ticket code
  const currentTicketCode = customTicketCode || booking.ticketCode || booking.qrCode || `NFL-PASS-${booking.id.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const showFeedback = (text: string, type: "success" | "error" | "info" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showFeedback(`${label} copied to clipboard!`, "info");
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateNewCode = () => {
    const newCode = `NFL-PASS-${booking.id.slice(-4).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setCustomTicketCode(newCode);
    showFeedback(`Generated new pass code: ${newCode}`, "info");
  };

  const handleApprovePayment = async () => {
    setIsUpdating(true);
    try {
      const finalCode = currentTicketCode;
      
      if (onApprove) {
        await onApprove(booking.id, finalCode);
      } else {
        const payload = {
          status: "approved",
          isApproved: true,
          qrCode: finalCode,
          ticketCode: finalCode,
          approvedAt: new Date().toISOString(),
          reviewedBy: "Control Room Box Office Management"
        };

        // 1. Update store_orders
        await setDoc(doc(db, "store_orders", booking.id), payload, { merge: true }).catch(() => {});
        // 2. Update bookings
        await setDoc(doc(db, "bookings", booking.id), payload, { merge: true }).catch(() => {});
        // 3. Update ticket_orders
        await setDoc(doc(db, "ticket_orders", booking.id), { ...payload, status: "confirmed" }, { merge: true }).catch(() => {});
      }

      showFeedback(`✅ Payment confirmed! Pass issued with Code: ${finalCode}`, "success");
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Approval error:", err);
      showFeedback("Error updating status: " + err.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) {
      showFeedback("Please specify a reason for rejecting the receipt.", "error");
      return;
    }

    setIsUpdating(true);
    try {
      if (onReject) {
        await onReject(booking.id, rejectReason.trim());
      } else {
        const payload = {
          status: "rejected",
          isApproved: false,
          rejectReason: rejectReason.trim(),
          rejectedAt: new Date().toISOString(),
          reviewedBy: "Control Room Box Office Management"
        };

        await setDoc(doc(db, "store_orders", booking.id), payload, { merge: true }).catch(() => {});
        await setDoc(doc(db, "bookings", booking.id), payload, { merge: true }).catch(() => {});
        await setDoc(doc(db, "ticket_orders", booking.id), payload, { merge: true }).catch(() => {});
      }

      showFeedback(`Status updated to Rejected: "${rejectReason.trim()}".`, "info");
      if (onStatusUpdated) onStatusUpdated();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      console.error("Reject error:", err);
      showFeedback("Error: " + err.message, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative text-left overflow-y-auto max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                MANAGEMENT AUDIT & TICKET ISSUANCE DESK
              </span>
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                booking.status === "approved" || booking.status === "confirmed"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : booking.status === "rejected"
                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
              )}>
                {booking.status === "approved" || booking.status === "confirmed" ? "✓ APPROVED / TICKET ISSUED" : booking.status === "rejected" ? "REJECTED" : "PENDING AUDIT"}
              </span>
            </div>
            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white flex items-center gap-2">
              <span>ORDER & TICKET AUDIT</span>
              <span className="text-zinc-600 font-mono text-sm">#{booking.id.slice(-8)}</span>
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs Navigation */}
        <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-2xl border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("receipt")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "receipt" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <FileCheck className="w-4 h-4" />
            1. Receipt Audit & Approval
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ticket")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "ticket" ? "bg-amber-500 text-black shadow-lg shadow-amber-500/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Ticket className="w-4 h-4" />
            2. Digital Ticket & Pass Code
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("invoice")}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
              activeTab === "invoice" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30" : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Printer className="w-4 h-4" />
            3. Payment Receipt & Invoice
          </button>
        </div>

        {/* Tab 1: Receipt Audit & Approval */}
        {activeTab === "receipt" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-150">
            {/* Left Column: Receipt Screenshot Viewer */}
            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  Customer Payment Proof / Screenshot
                </h4>
                {receiptImg && (
                  <button
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3 h-3" /> {isZoomed ? "Reset Zoom" : "Enlarge Image"}
                  </button>
                )}
              </div>

              {receiptImg ? (
                <div 
                  className={cn(
                    "relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 p-2 flex items-center justify-center transition-all cursor-zoom-in group",
                    isZoomed ? "max-h-[70vh] overflow-auto" : "max-h-96"
                  )}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  <img
                    src={receiptImg}
                    alt="Payment Receipt Screenshot"
                    className={cn(
                      "rounded-xl object-contain shadow-md transition-transform",
                      isZoomed ? "scale-125 my-8" : "w-full max-h-88"
                    )}
                  />
                </div>
              ) : (
                <div className="p-10 rounded-2xl bg-zinc-950/80 border border-dashed border-white/10 text-center space-y-2">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-black uppercase text-white">No Image Screenshot Attached</p>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    Buyer supplied transaction reference: <strong className="text-blue-400 font-mono">{referenceCode}</strong>
                  </p>
                </div>
              )}

              <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 uppercase font-black text-[9px]">Payment Channel</span>
                  <span className="text-white font-black uppercase font-mono">{paymentChannel}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 uppercase font-black text-[9px]">Transaction Ref / Tag</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(referenceCode, "Reference Code")}
                    className="text-emerald-400 font-black uppercase font-mono select-all hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{referenceCode}</span>
                    <Copy className="w-3 h-3 text-emerald-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Order Details & Actions */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-zinc-950/90 rounded-2xl border border-white/10 p-5 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2">
                  Purchaser & Event Information
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400">Buyer Name:</span>
                    <span className="font-black text-white">{attendeeName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400">Email:</span>
                    <span className="font-mono text-zinc-200 select-all">{attendeeEmail}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400">Phone / Handle:</span>
                    <span className="font-mono text-zinc-200">{attendeePhone}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                    <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-zinc-400">Package:</span>
                    <span className="font-black text-white uppercase truncate">{eventTitle}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-zinc-400">Access:</span>
                    <span className="font-mono font-bold text-zinc-300">{sessionDate} — {sessionTime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-zinc-400">Tier / Qty:</span>
                    <span className="font-bold text-blue-400 uppercase">{passTier} ({ticketCount} PASS{ticketCount > 1 ? "ES" : ""})</span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-white/5">
                    <span className="text-zinc-400 font-black uppercase text-[10px]">Grand Total Paid:</span>
                    <span className="font-mono text-xl font-black text-emerald-400">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reject Reason Input */}
              {showRejectBox && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-left animate-in fade-in duration-100">
                  <label className="text-[9px] font-black uppercase text-rose-300 block">
                    State Reason for Rejection / Re-upload Request:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Reference not found in bank wire / Receipt illegible"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full bg-zinc-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                  />
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleRejectPayment}
                      className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(false)}
                      className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-black uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Main Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleApprovePayment}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-95"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ACTIVATING & ISSUING TICKET...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      APPROVE PAYMENT & ISSUE OFFICIAL PASS
                    </>
                  )}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ticket")}
                    className="py-2.5 bg-zinc-950 hover:bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:border-amber-500/40 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    View / Issue Ticket Code
                  </button>
                  {!showRejectBox && (
                    <button
                      type="button"
                      onClick={() => setShowRejectBox(true)}
                      className="py-2.5 bg-zinc-950 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Reject Transaction
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Digital Ticket & Pass Code Issuer */}
        {activeTab === "ticket" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* VIP Pass Mockup Card */}
            <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 border-2 border-amber-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest rounded-md">
                      OFFICIAL NFL PASS
                    </span>
                    <span className="text-zinc-400 text-xs font-mono">RFID ACCESS VERIFIED</span>
                  </div>
                  <h3 className="text-xl font-black italic uppercase text-white mt-1">
                    {eventTitle}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 font-mono uppercase block">Gate Access Tier</span>
                  <span className="text-sm font-black text-amber-400 uppercase">{passTier}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-b border-white/10 text-xs">
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Pass Holder</span>
                  <span className="font-black text-white uppercase">{attendeeName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Date & Session</span>
                  <span className="font-mono text-zinc-300 font-bold">{sessionDate}</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Pass Quantity</span>
                  <span className="font-black text-blue-400">{ticketCount} TICKET(S)</span>
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Stadium RFID Code</span>
                  <span className="font-mono font-black text-emerald-400 select-all">{currentTicketCode}</span>
                </div>
              </div>

              {/* Barcode / Scannable RFID Code Display */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-white p-1.5 rounded-xl shrink-0 flex items-center justify-center border border-emerald-500/30">
                    <QRCodeSVG
                      value={`${typeof window !== "undefined" ? window.location.origin : ""}/?verifyTicket=${encodeURIComponent(currentTicketCode)}`}
                      size={54}
                      level="M"
                      includeMargin={false}
                    />
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-zinc-400 block font-mono">SCANNABLE PASS VALIDATION</span>
                    <span className="text-sm font-black text-white font-mono tracking-widest select-all">{currentTicketCode}</span>
                    <p className="text-[9px] text-emerald-400 font-medium">Scannable by phone camera or executive VIP turnstiles</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopy(currentTicketCode, "Pass Code")}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    {copiedText === "Pass Code" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
                    Copy Code
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateNewCode}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw className="w-4 h-4 text-blue-400" />
                    Regenerate
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Code Input & Direct Issuance */}
            <div className="bg-zinc-950 p-5 rounded-2xl border border-white/10 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Custom Ticket Code Override & Immediate Issuance
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Enter or customize ticket pass code..."
                    value={customTicketCode}
                    onChange={(e) => setCustomTicketCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  disabled={isUpdating}
                  onClick={handleApprovePayment}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all shadow-lg shadow-amber-500/20"
                >
                  <Send className="w-4 h-4" />
                  Issue This Ticket Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Official Payment Receipt & Invoice */}
        {activeTab === "invoice" && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Printable Receipt Canvas */}
            <div className="bg-white text-zinc-900 rounded-3xl p-8 space-y-6 shadow-2xl border border-zinc-200">
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-zinc-900 rounded-sm inline-block" />
                    <h2 className="text-xl font-black italic tracking-tighter text-zinc-900 uppercase">
                      NFL GRIDIRON EXCHANGE
                    </h2>
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 font-bold uppercase mt-0.5">
                    OFFICIAL BOX OFFICE RECEIPT OF PAYMENT
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block">Receipt / Invoice No.</span>
                  <span className="font-mono text-xs font-black text-zinc-900">REC-{booking.id.slice(-8).toUpperCase()}</span>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">Date & Time</span>
                  <span className="font-bold text-zinc-900">{sessionDate}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">Billed To</span>
                  <span className="font-bold text-zinc-900 uppercase truncate block">{attendeeName}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">Payment Channel</span>
                  <span className="font-bold text-zinc-900 uppercase">{paymentChannel}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase block">Payment Reference</span>
                  <span className="font-bold text-zinc-900 truncate block">{referenceCode}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <table className="w-full text-left text-xs font-mono border-t border-b border-zinc-200 py-2">
                <thead>
                  <tr className="border-b border-zinc-300 text-[10px] text-zinc-500 uppercase">
                    <th className="py-2">Description / Experience Item</th>
                    <th className="py-2 text-center">Tier</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 font-bold text-zinc-900">
                      {eventTitle}
                      <span className="text-[9px] text-zinc-500 block">Pass Code: {currentTicketCode}</span>
                    </td>
                    <td className="py-3 text-center uppercase">{passTier}</td>
                    <td className="py-3 text-center">{ticketCount}</td>
                    <td className="py-3 text-right font-bold text-zinc-900">{formatCurrency(grandTotal)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="flex justify-end">
                <div className="w-64 space-y-1.5 text-xs font-mono">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(grandTotal)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-600">
                    <span>Processing & Platform Fees:</span>
                    <span>$0.00 (Waived)</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-zinc-900 border-t-2 border-zinc-900 pt-2">
                    <span>TOTAL SETTLED:</span>
                    <span className="text-emerald-700">{formatCurrency(grandTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Verification Footer */}
              <div className="border-t border-zinc-200 pt-4 flex flex-col sm:flex-row justify-between items-center text-[9px] text-zinc-500 font-mono gap-2">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>AUDITED & CONFIRMED BY NFL GRIDIRON EXECUTIVE TREASURY</span>
                </div>
                <span>STATUS: PAID & VALIDATED</span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  const receiptSummary = `=== NFL GRIDIRON EXCHANGE OFFICIAL RECEIPT ===\nReceipt No: REC-${booking.id.slice(-8).toUpperCase()}\nDate: ${sessionDate}\nAttendee: ${attendeeName} (${attendeeEmail})\nItem: ${eventTitle} [${passTier}]\nPass Code: ${currentTicketCode}\nPayment: ${paymentChannel} (Ref: ${referenceCode})\nTotal Paid: $${grandTotal.toLocaleString()}\nStatus: CONFIRMED & ISSUED`;
                  handleCopy(receiptSummary, "Official Receipt Text");
                }}
                className="px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
              >
                <Copy className="w-4 h-4 text-blue-400" />
                Copy Full Receipt Summary
              </button>
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-600/20"
              >
                <Printer className="w-4 h-4" />
                Print / Save Receipt
              </button>
            </div>
          </div>
        )}

        {/* Global Toast Feedback */}
        {statusMessage && (
          <div className="fixed bottom-6 right-6 z-[130] animate-in slide-in-from-bottom-4 duration-200">
            <div className={cn(
              "px-4 py-3 rounded-2xl shadow-2xl border text-xs font-black uppercase tracking-wider flex items-center gap-2.5",
              statusMessage.type === "success" && "bg-zinc-900 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10",
              statusMessage.type === "error" && "bg-zinc-900 border-rose-500/40 text-rose-300 shadow-rose-500/10",
              statusMessage.type === "info" && "bg-zinc-900 border-blue-500/40 text-blue-300 shadow-blue-500/10"
            )}>
              {statusMessage.type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              {statusMessage.type === "error" && <AlertCircle className="w-4 h-4 text-rose-400" />}
              {statusMessage.type === "info" && <Sparkles className="w-4 h-4 text-blue-400" />}
              <span>{statusMessage.text}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

