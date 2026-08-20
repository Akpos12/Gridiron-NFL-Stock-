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
  ZoomIn
} from "lucide-react";
import { doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { formatCurrency, cn } from "../../lib/utils";

export interface BookingAuditItem {
  id: string;
  userId?: string;
  userEmail?: string;
  senderName?: string;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  experienceId?: string;
  experienceTitle?: string;
  gameName?: string;
  date?: string;
  timeSlot?: string;
  time?: string;
  tier?: string;
  guestsCount?: number;
  quantity?: number;
  totalPrice?: number;
  totalAmount?: number;
  dueToday?: number;
  paymentMethod?: string;
  paymentRef?: string;
  paymentReference?: string;
  receiptImage?: string;
  receiptImageUrl?: string;
  status?: string;
  createdAt?: string;
  qrCode?: string;
  managementNotes?: string;
}

interface ReceiptReviewModalProps {
  booking: BookingAuditItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdated?: () => void;
  onApprove?: (bookingId: string) => Promise<void> | void;
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !booking) return null;

  const attendeeName = booking.senderName || booking.buyerName || booking.userEmail || "Attendee";
  const attendeeEmail = booking.buyerEmail || booking.userEmail || "Not Provided";
  const attendeePhone = booking.buyerPhone || "None";
  const eventTitle = booking.experienceTitle || booking.gameName || "NFL Match / Event Pass";
  const sessionDate = booking.date || "Scheduled Slot";
  const sessionTime = booking.timeSlot || booking.time || "General Admission";
  const passTier = (booking.tier || "Standard").toUpperCase();
  const ticketCount = booking.guestsCount || booking.quantity || 1;
  const grandTotal = booking.totalPrice || booking.totalAmount || 0;
  const paymentChannel = booking.paymentMethod || "Direct Transfer";
  const referenceCode = booking.paymentRef || booking.paymentReference || "N/A";
  const receiptImg = booking.receiptImage || booking.receiptImageUrl || "";

  const handleApprovePayment = async () => {
    setIsUpdating(true);
    try {
      if (onApprove) {
        await onApprove(booking.id);
        if (onStatusUpdated) onStatusUpdated();
        onClose();
        return;
      }

      const generatedQr = booking.qrCode || `NFL-PASS-${booking.id}-${Date.now().toString(36).toUpperCase()}`;
      
      // Update bookings collection
      await updateDoc(doc(db, "bookings", booking.id), {
        status: "approved",
        qrCode: generatedQr,
        approvedAt: new Date().toISOString(),
        reviewedBy: "Management"
      }).catch(async () => {
        // Fallback setDoc with merge if doc wasn't created with matching ID
        await setDoc(doc(db, "bookings", booking.id), {
          status: "approved",
          qrCode: generatedQr,
          approvedAt: new Date().toISOString(),
          reviewedBy: "Management"
        }, { merge: true });
      });

      // Also update ticket_orders if exists
      await updateDoc(doc(db, "ticket_orders", booking.id), {
        status: "confirmed",
        isApproved: true,
        approvedAt: new Date().toISOString()
      }).catch(() => {});

      alert(`✅ Payment confirmed for ${attendeeName}! Official pass activated and ticket issued.`);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err: any) {
      console.error("Approval error:", err);
      alert("Error updating status: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim()) {
      alert("Please specify a reason for rejecting or requesting receipt re-submission.");
      return;
    }

    setIsUpdating(true);
    try {
      if (onReject) {
        await onReject(booking.id, rejectReason.trim());
        if (onStatusUpdated) onStatusUpdated();
        onClose();
        return;
      }

      await updateDoc(doc(db, "bookings", booking.id), {
        status: "rejected",
        rejectReason: rejectReason.trim(),
        rejectedAt: new Date().toISOString(),
        reviewedBy: "Management"
      }).catch(async () => {
        await setDoc(doc(db, "bookings", booking.id), {
          status: "rejected",
          rejectReason: rejectReason.trim(),
          rejectedAt: new Date().toISOString(),
          reviewedBy: "Management"
        }, { merge: true });
      });

      await updateDoc(doc(db, "ticket_orders", booking.id), {
        status: "rejected",
        rejectReason: rejectReason.trim()
      }).catch(() => {});

      alert(`Status updated to Rejected with note: "${rejectReason.trim()}".`);
      if (onStatusUpdated) onStatusUpdated();
      onClose();
    } catch (err: any) {
      console.error("Reject error:", err);
      alert("Error: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] max-w-4xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative text-left overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[9px] font-black uppercase tracking-widest">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              MANAGEMENT AUDIT & TICKET ISSUANCE DESK
            </span>
            <h3 className="text-2xl font-black italic uppercase tracking-tight text-white">
              REVIEW PAYMENT RECEIPT
            </h3>
            <p className="text-xs text-zinc-400 font-medium">
              Verify customer receipt / screenshot, reconcile transaction reference, and issue official RFID passes.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Column Split: Left = Receipt Preview, Right = Attendee & Order Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Receipt Screenshot Viewer */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                Customer Uploaded Receipt
              </h4>
              {receiptImg && (
                <button
                  type="button"
                  onClick={() => setIsZoomed(!isZoomed)}
                  className="text-[9px] font-black uppercase text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                >
                  <ZoomIn className="w-3 h-3" /> {isZoomed ? "Reset Zoom" : "Click to Enlarge"}
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
                  Buyer provided reference code: <strong className="text-blue-400 font-mono">{referenceCode}</strong>
                </p>
              </div>
            )}

            <div className="p-3 bg-zinc-950/80 rounded-xl border border-white/5 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase font-black text-[9px]">Payment Channel</span>
                <span className="text-white font-black uppercase font-mono">{paymentChannel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 uppercase font-black text-[9px]">Transaction Ref / Tag</span>
                <span className="text-emerald-400 font-black uppercase font-mono select-all">{referenceCode}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Details & Actions */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-zinc-950/90 rounded-2xl border border-white/10 p-5 space-y-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-2 flex items-center justify-between">
                <span>Pass & Attendee Details</span>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase",
                  booking.status === "approved" 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : booking.status === "rejected"
                    ? "bg-rose-500/20 text-rose-400"
                    : "bg-amber-500/20 text-amber-300 animate-pulse"
                )}>
                  Status: {booking.status || "Pending Approval"}
                </span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-zinc-400">Name:</span>
                  <span className="font-black text-white">{attendeeName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="text-zinc-400">Email:</span>
                  <span className="font-mono text-zinc-200">{attendeeEmail}</span>
                </div>

                {attendeePhone !== "None" && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="text-zinc-400">Phone:</span>
                    <span className="font-mono text-zinc-200">{attendeePhone}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <Ticket className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-400">Event:</span>
                  <span className="font-black text-white uppercase truncate">{eventTitle}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-400">Session:</span>
                  <span className="font-mono font-bold text-zinc-300">{sessionDate} @ {sessionTime}</span>
                </div>

                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-zinc-400">Tier / Qty:</span>
                  <span className="font-bold text-blue-400 uppercase">{passTier} ({ticketCount} PASSES)</span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-white/5">
                  <span className="text-zinc-400 font-black uppercase text-[10px]">Grand Total:</span>
                  <span className="font-mono text-xl font-black text-emerald-400">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Reject Box Option */}
            {showRejectBox && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2 text-left">
                <label className="text-[9px] font-black uppercase text-rose-300 block">
                  State Reason for Rejection / Re-upload Request:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Receipt illegible / Transfer did not clear in BMO"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-zinc-950 border border-rose-500/40 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleRejectPayment}
                    className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRejectBox(false)}
                    className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-[9px] font-black uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
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
                    CONFIRM PAYMENT & ISSUE OFFICIAL TICKET
                  </>
                )}
              </button>

              {!showRejectBox && (
                <button
                  type="button"
                  onClick={() => setShowRejectBox(true)}
                  className="w-full py-2.5 bg-zinc-950 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/30 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                >
                  ⚠️ Reject / Request New Screenshot
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
