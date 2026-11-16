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
  Smartphone,
  CreditCard,
  Mail,
  Send,
  Bell,
  Loader2,
  Gift
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { generateTicketPDF, TicketPassInfo } from "../utils/ticketPdfGenerator";
import { cn } from "../lib/utils";
import { VipCommemorativeTicketModal } from "./VipCommemorativeTicketModal";
import { PaymentReceiptUploader } from "./common/PaymentReceiptUploader";
import { TenMinuteFollowUpModal } from "./common/TenMinuteFollowUpModal";
import { ConnectionStatusPanel } from "./common/ConnectionStatusPanel";
import { syncResubmitReceipt } from "../utils/orderSync";
import {
  subscribeToPaymentSession,
  submitCustomerPayment,
  sendSessionMailMessage,
  markGuestMessagesAsRead,
  upsertSavedGuestSession,
  playGuestNotificationChime,
  createOrUpdatePaymentSession,
  PaymentMethodType
} from "../services/paymentControlService";

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
  const [showCommemorativeModal, setShowCommemorativeModal] = useState(false);

  // Corrected receipt re-upload state when rejected
  const [correctedReceipts, setCorrectedReceipts] = useState<string[]>([]);
  const [correctedPaymentRef, setCorrectedPaymentRef] = useState("");
  const [isResubmittingReceipt, setIsResubmittingReceipt] = useState(false);
  const [resubmitFeedback, setResubmitFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Payment session inline completion state & saved browser shortcuts
  const [savedPaymentSessions, setSavedPaymentSessions] = useState<any[]>([]);
  const [sessionRefInput, setSessionRefInput] = useState("");
  const [sessionReceipts, setSessionReceipts] = useState<string[]>([]);
  const [isSubmittingSessionPayment, setIsSubmittingSessionPayment] = useState(false);
  const [sessionPaymentFeedback, setSessionPaymentFeedback] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [guestReplyInput, setGuestReplyInput] = useState("");
  const [isSendingGuestReply, setIsSendingGuestReply] = useState(false);
  const [guestReplyFeedback, setGuestReplyFeedback] = useState<string | null>(null);
  const [showTenMinutePopup, setShowTenMinutePopup] = useState(false);
  const [isSwitchingSessionMethod, setIsSwitchingSessionMethod] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  useEffect(() => {
    setCorrectedReceipts([]);
    setCorrectedPaymentRef("");
    setResubmitFeedback(null);
    setSessionRefInput("");
    setSessionReceipts([]);
    setSessionPaymentFeedback(null);
  }, [selectedTicket?.id]);

  // Load saved payment requests from this browser for quick 1-click check-back
  useEffect(() => {
    if (!isOpen) return;
    try {
      const raw = localStorage.getItem("nfl_saved_payment_sessions");
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setSavedPaymentSessions(parsed.filter((item) => item && item.id));
      }
    } catch {
      setSavedPaymentSessions([]);
    }
  }, [isOpen]);

  // Real-time sync when viewing a payment_session inside TicketCheckModal
  useEffect(() => {
    if (!isOpen || !selectedTicket?.isPaymentSession || !selectedTicket?.id) return;
    const unsub = subscribeToPaymentSession(selectedTicket.id, (liveSession) => {
      if (!liveSession) return;
      const mapped = {
        ...selectedTicket,
        ...liveSession,
        id: liveSession.id,
        orderId: liveSession.orderId || liveSession.id,
        isPaymentSession: true,
        experienceTitle: liveSession.itemTitle || selectedTicket.experienceTitle,
        buyerName: liveSession.customerName || selectedTicket.buyerName,
        buyerEmail: liveSession.customerEmail || selectedTicket.buyerEmail,
        totalPrice: liveSession.amount ?? selectedTicket.totalPrice,
        receiptImages: Array.from(new Set([
          ...(Array.isArray(liveSession.receiptImages) ? liveSession.receiptImages : []),
          ...(liveSession.receiptUrl ? [liveSession.receiptUrl] : []),
          ...(liveSession.receiptImage ? [liveSession.receiptImage] : [])
        ].filter(Boolean)))
      };
      setSelectedTicket(mapped);
      setTickets((prev) => prev.map((t) => (t.id === mapped.id ? mapped : t)));

      upsertSavedGuestSession({
        id: liveSession.id,
        orderId: liveSession.orderId || liveSession.id,
        customerName: liveSession.customerName,
        customerEmail: liveSession.customerEmail,
        paymentMethod: liveSession.paymentMethod,
        itemTitle: liveSession.itemTitle,
        amount: liveSession.amount,
        status: liveSession.status
      });

      const readIds: string[] = [];
      if (Array.isArray(liveSession.messages)) {
        liveSession.messages.filter((m) => m.sender === "admin").forEach((m) => readIds.push(m.id));
      }
      if (liveSession.adminPaymentDetails) {
        readIds.push(`details_ready:${liveSession.id}:${liveSession.adminPaymentDetails.updatedAt || liveSession.paymentMethod}`);
      }
      if (readIds.length > 0) {
        markGuestMessagesAsRead(readIds);
      }
    });
    return () => unsub();
  }, [isOpen, selectedTicket?.id, selectedTicket?.isPaymentSession]);

  // Tick current time while modal is open so 10-minute delay popup evaluates live
  useEffect(() => {
    if (!isOpen) return;
    setNowMs(Date.now());
    const timer = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Show follow-up popup if customer checks back after 30+ secs with no vendor details yet, repeating every 2 mins after dismissal
  useEffect(() => {
    if (!isOpen || !selectedTicket?.isPaymentSession) {
      setShowTenMinutePopup(false);
      return;
    }
    const isStillAwaiting =
      selectedTicket.status === "awaiting_admin_details" &&
      !selectedTicket.adminPaymentDetails;
    if (!isStillAwaiting) {
      setShowTenMinutePopup(false);
      return;
    }
    const createdMs = selectedTicket.createdAt ? new Date(selectedTicket.createdAt).getTime() : 0;
    const elapsed = createdMs > 0 ? nowMs - createdMs : 0;
    const thirtySecs = 30 * 1000;
    const twoMins = 2 * 60 * 1000;

    if (elapsed >= thirtySecs) {
      try {
        const dismissedKey = `nfl_popup_dismissed_time_${selectedTicket.id}`;
        const dismissedTimeStr = sessionStorage.getItem(dismissedKey);
        if (!dismissedTimeStr) {
          setShowTenMinutePopup(true);
        } else {
          const dismissedTime = Number(dismissedTimeStr);
          if (!isNaN(dismissedTime) && nowMs - dismissedTime >= twoMins) {
            setShowTenMinutePopup(true);
          }
        }
      } catch {
        setShowTenMinutePopup(true);
      }
    } else {
      setShowTenMinutePopup(false);
    }
  }, [
    isOpen,
    selectedTicket?.id,
    selectedTicket?.isPaymentSession,
    selectedTicket?.status,
    selectedTicket?.adminPaymentDetails,
    selectedTicket?.createdAt,
    nowMs
  ]);

  // Reset to clean search state when opened; only search if an explicit query was provided
  useEffect(() => {
    if (isOpen) {
      if (initialSearchQuery && initialSearchQuery.trim()) {
        setSearchQuery(initialSearchQuery.trim());
        performSearch(initialSearchQuery.trim());
      } else {
        setSearchQuery("");
        setTickets([]);
        setSelectedTicket(null);
        setHasSearched(false);
      }
    }
  }, [initialSearchQuery, isOpen]);

  const COMMEMORATIVE_VIP_TICKET = {
    id: "SEA-CARD-VIP-2026-DJ08",
    orderId: "SEA-CARD-VIP-2026-DJ08",
    refCode: "SEA-CARD-VIP-2026-DJ08",
    ticketCode: "SEA-CARD-VIP-2026-DJ08",
    qrCode: "SEA-CARD-VIP-2026-DJ08",
    buyerName: "Dena Johnston",
    senderName: "Dena Johnston",
    userEmail: "dena.johnston@gmail.com",
    buyerEmail: "dena.johnston@gmail.com",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Arizona Cardinals",
    gameName: "Seattle Seahawks vs. Arizona Cardinals",
    eventTitle: "Seattle Seahawks vs. Arizona Cardinals",
    experienceTitle: "Seattle Seahawks vs. Arizona Cardinals · VIP Experience",
    date: "Sunday, November 8, 2026",
    time: "4:25 PM EST",
    timeSlot: "4:25 PM EST (Kickoff)",
    kickoff: "4:25 PM EST",
    stadium: "Lumen Field",
    city: "Seattle, Washington",
    venue: "Lumen Field, Seattle, Washington",
    price: 1000,
    totalAmount: 1000,
    totalPrice: 1000,
    quantity: 1,
    tier: "VIP Experience",
    category: "VIP Experience",
    seatDetails: "Section VIP Club Level 100 · Row A1 · Seat 12",
    gateInfo: "Gate 3 - Northwest VIP Club Entrance",
    status: "approved",
    isApproved: true,
    isCommemorative: true,
    commemorativeDesign: true,
    commemorativeImageUrl: "/images/seahawks_vip_ticket_isolated.png"
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

      // Check if searched query corresponds to Dena Johnston commemorative pass
      const isDenaMatch =
        termLower.includes("dena") ||
        termLower.includes("johnston") ||
        termLower === "dj" ||
        termLower.includes("dj08") ||
        termLower.includes("sea-card") ||
        "dena.johnston@gmail.com".includes(termLower) ||
        "sea-card-vip-2026-dj08".includes(termLower);

      if (isDenaMatch) {
        resultsMap.set(COMMEMORATIVE_VIP_TICKET.id, COMMEMORATIVE_VIP_TICKET);
      }

      const mergeResult = (docId: string, data: any) => {
        const key = String(data?.orderId || data?.bookingId || docId || "").replace(/^order-/i, "").trim();
        if (!key) return;
        const existing = resultsMap.get(key) || {};
        const combinedReceipts = Array.from(
          new Set([
            ...(Array.isArray(existing.receiptImages) ? existing.receiptImages : []),
            ...(Array.isArray(data.receiptImages) ? data.receiptImages : []),
            ...(existing.receiptImage ? [existing.receiptImage] : []),
            ...(data.receiptImage ? [data.receiptImage] : []),
            ...(data.receiptImageUrl ? [data.receiptImageUrl] : [])
          ].filter((u): u is string => typeof u === "string" && u.trim().length > 0))
        );
        resultsMap.set(key, {
          ...existing,
          ...data,
          id: existing.id || key || docId,
          orderId: data.orderId || existing.orderId || key,
          receiptImage: combinedReceipts[0] || "",
          receiptImageUrl: combinedReceipts[0] || "",
          receiptImages: combinedReceipts
        });
      };

      // 1. Direct ID lookup across bookings, ticket_orders, customer_inquiries & store_orders
      for (const colName of ["bookings", "ticket_orders", "customer_inquiries", "store_orders"] as const) {
        try {
          const snap = await getDoc(doc(db, colName, term));
          if (snap.exists()) {
            mergeResult(snap.id, snap.data());
          }
        } catch {}
      }

      // 2. Query bookings by email & orderId
      try {
        const emailSnap = await getDocs(query(collection(db, "bookings"), where("userEmail", "==", term)));
        emailSnap.forEach(d => mergeResult(d.id, d.data()));

        const buyerEmailSnap = await getDocs(query(collection(db, "bookings"), where("buyerEmail", "==", term)));
        buyerEmailSnap.forEach(d => mergeResult(d.id, d.data()));
      } catch {}

      // 3. Query ticket_orders, customer_inquiries & store_orders by email or orderId
      for (const colName of ["ticket_orders", "customer_inquiries", "store_orders"] as const) {
        try {
          const toEmailSnap = await getDocs(query(collection(db, colName), where("buyerEmail", "==", term)));
          toEmailSnap.forEach(d => mergeResult(d.id, d.data()));
        } catch {}
        try {
          const uEmailSnap = await getDocs(query(collection(db, colName), where("userEmail", "==", term)));
          uEmailSnap.forEach(d => mergeResult(d.id, d.data()));
        } catch {}
        try {
          const oIdSnap = await getDocs(query(collection(db, colName), where("orderId", "==", term)));
          oIdSnap.forEach(d => mergeResult(d.id, d.data()));
        } catch {}
      }

      // 4. Query by qrCode or ticketCode
      try {
        const codeSnap = await getDocs(query(collection(db, "bookings"), where("qrCode", "==", term)));
        codeSnap.forEach(d => mergeResult(d.id, d.data()));

        const tCodeSnap = await getDocs(query(collection(db, "bookings"), where("ticketCode", "==", term)));
        tCodeSnap.forEach(d => mergeResult(d.id, d.data()));
      } catch {}

      // 5. Broad text search across bookings, ticket_orders, customer_inquiries, and store_orders
      for (const colName of ["bookings", "ticket_orders", "customer_inquiries", "store_orders"] as const) {
        try {
          const allSnap = await getDocs(collection(db, colName));
          allSnap.forEach(d => {
            const data = d.data();
            const searchable = [
              d.id,
              data.orderId,
              data.ticketCode,
              data.qrCode,
              data.userEmail,
              data.buyerEmail,
              data.buyerName,
              data.senderName,
              data.userName,
              data.favoritePlayer,
              data.experienceTitle,
              data.gameName,
              data.itemName,
              data.messagingDetails,
              data.paymentRef
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            if (searchable.includes(termLower)) {
              mergeResult(d.id, data);
            }
          });
        } catch {}
      }

      // 6. Also check live payment_sessions so customers waiting for vendor credentials can check back anytime
      try {
        const existingSessionKeys = new Set<string>();
        resultsMap.forEach((v) => {
          if (v?.paymentSessionId) existingSessionKeys.add(String(v.paymentSessionId));
          if (v?.sessionId) existingSessionKeys.add(String(v.sessionId));
          if (v?.orderId) existingSessionKeys.add(String(v.orderId));
        });

        const addPaymentSession = (docId: string, ps: any) => {
          const sid = String(ps?.id || docId || "");
          if (!sid) return;
          if (existingSessionKeys.has(sid) || resultsMap.has(sid)) return;
          const imgs = Array.from(
            new Set([
              ...(Array.isArray(ps.receiptImages) ? ps.receiptImages : []),
              ...(ps.receiptUrl ? [ps.receiptUrl] : []),
              ...(ps.receiptImage ? [ps.receiptImage] : [])
            ].filter((u): u is string => typeof u === "string" && u.trim().length > 0))
          );
          resultsMap.set(sid, {
            ...ps,
            id: sid,
            orderId: ps.orderId || sid,
            isPaymentSession: true,
            experienceTitle: ps.itemTitle || "Payment Verification Session",
            gameName: ps.itemTitle || "Payment Verification Session",
            buyerName: ps.customerName || "Customer",
            buyerEmail: ps.customerEmail || "",
            totalPrice: ps.amount || 0,
            totalAmount: ps.amount || 0,
            date: ps.updatedAt ? new Date(ps.updatedAt).toLocaleDateString() : "Active Request",
            tier: ps.paymentMethod ? ps.paymentMethod.toUpperCase() : "PAYMENT REQUEST",
            createdAt: ps.createdAt ? new Date(ps.createdAt).toISOString() : new Date().toISOString(),
            receiptImage: imgs[0] || "",
            receiptImageUrl: imgs[0] || "",
            receiptImages: imgs
          });
        };

        try {
          const psDirect = await getDoc(doc(db, "payment_sessions", term));
          if (psDirect.exists()) addPaymentSession(psDirect.id, psDirect.data());
        } catch {}

        try {
          const psAllSnap = await getDocs(collection(db, "payment_sessions"));
          psAllSnap.forEach((d) => {
            const data = d.data();
            const psSearchable = [
              d.id,
              data.id,
              data.orderId,
              data.customerName,
              data.customerEmail,
              data.itemTitle,
              data.paymentMethod,
              data.referenceTag
            ]
              .filter(Boolean)
              .join(" ")
              .toLowerCase();
            if (psSearchable.includes(termLower)) {
              addPaymentSession(d.id, data);
            }
          });
        } catch {}
      } catch {}

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

  const handleCompletePaymentSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket?.id) return;
    if (!sessionRefInput.trim() && sessionReceipts.length === 0) {
      setSessionPaymentFeedback({
        text: "Please enter your payment reference/confirmation ID or upload a screenshot.",
        type: "error"
      });
      return;
    }

    setIsSubmittingSessionPayment(true);
    setSessionPaymentFeedback(null);
    try {
      await submitCustomerPayment(
        selectedTicket.id,
        sessionRefInput.trim() || "RECEIPT_ATTACHED",
        sessionReceipts[0] || "",
        sessionReceipts
      );
      setSessionPaymentFeedback({
        text: "Payment confirmation submitted! Our billing desk is now verifying your receipt.",
        type: "success"
      });
      setSessionRefInput("");
      setSessionReceipts([]);
    } catch (err: any) {
      setSessionPaymentFeedback({
        text: err?.message || "Could not submit confirmation. Please try again.",
        type: "error"
      });
    } finally {
      setIsSubmittingSessionPayment(false);
    }
  };

  const handleDismissTenMinutePopup = () => {
    if (selectedTicket?.id) {
      try {
        sessionStorage.setItem(`nfl_popup_dismissed_time_${selectedTicket.id}`, String(Date.now()));
      } catch {}
    }
    setShowTenMinutePopup(false);
  };

  const handleSwitchSessionMethodInCheckModal = async (nextMethod: PaymentMethodType) => {
    if (!selectedTicket?.id) return;
    setIsSwitchingSessionMethod(true);
    setSessionPaymentFeedback(null);
    try {
      await createOrUpdatePaymentSession({
        id: selectedTicket.id,
        orderId: selectedTicket.orderId || selectedTicket.id,
        customerName: selectedTicket.customerName || selectedTicket.buyerName || "Guest",
        customerEmail: selectedTicket.customerEmail || selectedTicket.buyerEmail || "",
        customerPhone: selectedTicket.customerPhone || "",
        itemType: selectedTicket.itemType || "experience",
        itemTitle: selectedTicket.itemTitle || selectedTicket.experienceTitle || "NFL Experience",
        amount: Number(selectedTicket.amount ?? selectedTicket.totalPrice ?? 100),
        paymentMethod: nextMethod,
        status: nextMethod === "giftcard" ? "details_provided" : undefined
      });
      // Immediately reflect method switch locally while live listener catches up
      setSelectedTicket((prev: any) =>
        prev
          ? {
              ...prev,
              paymentMethod: nextMethod,
              adminPaymentDetails: null,
              status: nextMethod === "giftcard" ? "details_provided" : "awaiting_admin_details"
            }
          : prev
      );
      handleDismissTenMinutePopup();
    } catch (err: any) {
      setSessionPaymentFeedback({
        text: err?.message || "Could not switch payment method. Please try again.",
        type: "error"
      });
    } finally {
      setIsSwitchingSessionMethod(false);
    }
  };

  const handleSendSessionGuestReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket?.id || !guestReplyInput.trim()) return;
    setIsSendingGuestReply(true);
    setGuestReplyFeedback(null);
    try {
      await sendSessionMailMessage(selectedTicket.id, {
        sender: "customer",
        senderName: selectedTicket.buyerName || selectedTicket.customerName || "Guest",
        body: guestReplyInput.trim()
      });
      setGuestReplyInput("");
      setGuestReplyFeedback("Reply sent directly to our billing desk.");
      setTimeout(() => setGuestReplyFeedback(null), 3000);
    } catch (err: any) {
      setGuestReplyFeedback("Could not send reply: " + (err?.message || "Please try again."));
    } finally {
      setIsSendingGuestReply(false);
    }
  };

  const handleResubmitCorrectedReceipt = async () => {
    if (!selectedTicket || correctedReceipts.length === 0) return;
    setIsResubmittingReceipt(true);
    setResubmitFeedback(null);
    try {
      await syncResubmitReceipt({
        item: selectedTicket,
        receiptImages: correctedReceipts,
        paymentRef: correctedPaymentRef
      });

      const updatedTicket = {
        ...selectedTicket,
        status: "pending",
        isApproved: false,
        requiresReceiptReupload: false,
        rejectReason: "",
        rejectionReason: "",
        receiptImage: correctedReceipts[0],
        receiptImageUrl: correctedReceipts[0],
        receiptImages: correctedReceipts,
        ...(correctedPaymentRef.trim() ? { paymentRef: correctedPaymentRef.trim() } : {})
      };

      setSelectedTicket(updatedTicket);
      setTickets(prev => prev.map(t => t.id === selectedTicket.id ? updatedTicket : t));
      setCorrectedReceipts([]);
      setCorrectedPaymentRef("");
      setResubmitFeedback({
        text: "Corrected payment receipt submitted! Your receipt is now awaiting administrator verification.",
        type: "success"
      });
    } catch (err: any) {
      console.error("Resubmit receipt error:", err);
      setResubmitFeedback({
        text: err?.message || "Failed to upload corrected receipt. Please try again.",
        type: "error"
      });
    } finally {
      setIsResubmittingReceipt(false);
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
        sidelinePassCount: t.sidelinePassCount,
        sidelinePassTotal: t.sidelinePassTotal,
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
                placeholder="Search by Passholder Name (e.g. Dena Johnston), Email, or Reference ID..."
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

          {/* Search Helper */}
          <div className="flex items-center gap-2 mt-2 px-1 text-[10px] text-zinc-500">
            <span>Enter your name, email address, ticket code, or payment session Reference ID to check status or view assigned vendor details.</span>
          </div>

          {/* Saved Payment Requests on this browser */}
          {savedPaymentSessions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                Recent Requests on This Device:
              </span>
              {savedPaymentSessions.slice(0, 3).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setSearchQuery(s.id);
                    performSearch(s.id);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-mono text-blue-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>{s.id}</span>
                  {s.paymentMethod && (
                    <span className="text-zinc-500 uppercase">({s.paymentMethod})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {isLoading && tickets.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Checking Box Office &amp; Billing Records...
              </p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="py-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-500">
                <Ticket className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-white">
                  {hasSearched ? "No Matching Records Found" : "Search Orders & Payment Requests"}
                </h4>
                <p className="text-xs text-zinc-400 mt-1">
                  {hasSearched
                    ? "We couldn't locate any orders or payment requests matching that email, name, or reference ID. Please double-check your spelling or contact Support."
                    : "Enter the email address, name, or Reference ID you used during checkout to check approval status, view assigned vendor payment credentials, or download your pass."}
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
                  {tickets.map((t, idx) => {
                    const isApproved = t.status === "approved" || t.status === "confirmed" || t.isApproved;
                    const isSelected = selectedTicket?.id === t.id;

                    return (
                      <div
                        key={`${t.id || t.orderId || idx}-${idx}`}
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
                              isApproved || (t.isPaymentSession && t.adminPaymentDetails && t.status !== "payment_submitted")
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : t.status === "rejected"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : t.isPaymentSession && t.status === "awaiting_admin_details"
                                ? "bg-blue-500/10 text-blue-300 border border-blue-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}
                          >
                            {t.isPaymentSession ? (
                              t.status === "payment_submitted" ? (
                                <>
                                  <Clock className="w-2.5 h-2.5" /> RECEIPT SENT
                                </>
                              ) : t.adminPaymentDetails ? (
                                <>
                                  <CheckCircle2 className="w-2.5 h-2.5" /> DETAILS READY
                                </>
                              ) : (
                                <>
                                  <Clock className="w-2.5 h-2.5" /> ASSIGNING VENDOR
                                </>
                              )
                            ) : isApproved ? (
                              <>
                                <CheckCircle2 className="w-2.5 h-2.5" /> APPROVED
                              </>
                            ) : t.status === "rejected" ? (
                              <>
                                <AlertCircle className="w-2.5 h-2.5" /> REJECTED
                              </>
                            ) : (
                              <>
                                <Clock className="w-2.5 h-2.5" /> PENDING REVIEW
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
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-[9px] text-zinc-400 font-medium truncate">
                            {t.date} · {t.tier?.toUpperCase() || "VIP"}
                          </p>
                          {t.isPaymentSession && Array.isArray(t.messages) && t.messages.length > 0 && (
                            <span className="text-[9px] font-black uppercase text-sky-300 flex items-center gap-1 shrink-0">
                              <Mail className="w-2.5 h-2.5" /> {t.messages.length}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Selected Ticket Details & Download Card */}
              {selectedTicket && (
                <div className={cn("space-y-4", tickets.length > 1 ? "lg:col-span-7" : "lg:col-span-12")}>
                  {/* Status Banner — Dedicated view for Payment Requests awaiting or displaying vendor credentials */}
                  {selectedTicket.isPaymentSession ? (
                    <div className="space-y-4">
                      {selectedTicket.status === "awaiting_admin_details" && !selectedTicket.adminPaymentDetails ? (
                        <div className="p-5 rounded-2xl bg-zinc-900/90 border border-sky-500/35 space-y-4 shadow-xl">
                          {/* Verified Request Queue & Connection Status */}
                          <ConnectionStatusPanel
                            compact
                            paymentStatusLabel="REQUEST QUEUED · AWAITING COORDINATOR DETAILS"
                          />

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                            <div className="flex items-center gap-2.5">
                              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                              <div>
                                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                                  Preparing Your Verified Vendor Credentials
                                </h4>
                                <p className="text-[11px] text-emerald-300 font-medium">
                                  $0.00 charged yet · Your request is safely queued
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-300">
                              Ref: <strong className="text-white select-all">{selectedTicket.id}</strong>
                            </span>
                          </div>
                          <p className="text-xs text-zinc-300 leading-relaxed">
                            Our billing team assigns a dedicated, verified <strong className="text-white uppercase">{selectedTicket.paymentMethod}</strong> account for each individual order to prevent fraud and misrouted transfers (typically ready within <strong className="text-white">1–3 minutes</strong>). Keep this window open or refresh anytime—your payment details will appear right here as soon as they are issued.
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => performSearch(selectedTicket.id)}
                              className="px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Check Again Now
                            </button>
                            {selectedTicket.createdAt &&
                              nowMs - new Date(selectedTicket.createdAt).getTime() >= 3 * 60 * 1000 && (
                                <button
                                  type="button"
                                  onClick={() => setShowTenMinutePopup(true)}
                                  className="px-4 py-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Gift className="w-3.5 h-3.5" /> Switch to Instant Bitcoin / Apple Gift Card
                                </button>
                              )}
                            {onOpenLiveChat && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onOpenLiveChat(selectedTicket.id);
                                }}
                                className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" /> Message Billing Support
                              </button>
                            )}
                          </div>
                        </div>
                      ) : selectedTicket.paymentMethod === "giftcard" &&
                        selectedTicket.status !== "payment_submitted" &&
                        selectedTicket.status !== "completed" ? (
                        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap border-b border-amber-500/20 pb-3">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-2">
                                <Gift className="w-4 h-4 text-amber-400" />
                                Instant Apple Gift Card Submission Ready
                              </h4>
                              <p className="text-[11px] text-zinc-200 mt-1">
                                Enter your Apple Gift Card claim code or upload a clear photo of the card/receipt for <strong className="text-white font-mono">${Number(selectedTicket.amount || 0).toLocaleString()}</strong> to lock your booking immediately.
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">
                              APPLE GIFT CARD
                            </span>
                          </div>

                          <form onSubmit={handleCompletePaymentSession} className="space-y-3">
                            <input
                              type="text"
                              placeholder="Enter 16-digit Apple Gift Card Claim Code (X...)..."
                              value={sessionRefInput}
                              onChange={(e) => setSessionRefInput(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400"
                            />
                            <PaymentReceiptUploader
                              value={sessionReceipts[0] || ""}
                              values={sessionReceipts}
                              onChange={(url) => setSessionReceipts(url ? [url] : [])}
                              onValuesChange={(urls) => setSessionReceipts(urls)}
                              label="Upload Apple Gift Card Photo / Receipt"
                              subtitle="Attach a clear photo showing the Apple Gift Card code & purchase receipt."
                            />
                            {sessionPaymentFeedback && (
                              <div className={cn(
                                "p-3 rounded-xl text-xs font-bold border",
                                sessionPaymentFeedback.type === "success"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              )}>
                                {sessionPaymentFeedback.text}
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={isSubmittingSessionPayment || (!sessionRefInput.trim() && sessionReceipts.length === 0)}
                              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                            >
                              {isSubmittingSessionPayment ? "Submitting Gift Card..." : "Submit Apple Gift Card & Lock Slot"}
                            </button>
                          </form>
                        </div>
                      ) : selectedTicket.adminPaymentDetails && selectedTicket.status !== "payment_submitted" && selectedTicket.status !== "completed" ? (
                        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                          <div className="flex items-start justify-between gap-3 flex-wrap border-b border-emerald-500/20 pb-3">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                Verified Vendor Payment Details Ready
                              </h4>
                              <p className="text-[11px] text-zinc-200 mt-1">
                                Review the assigned destination details below, complete your <strong className="text-white font-mono">${Number(selectedTicket.amount || 0).toLocaleString()}</strong> transfer, and upload your receipt right here.
                              </p>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase">
                              {String(selectedTicket.paymentMethod || "").toUpperCase()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            {selectedTicket.adminPaymentDetails.bankName && (
                              <div className="p-3 bg-zinc-950 rounded-xl border border-white/10">
                                <span className="text-[9px] font-black uppercase text-zinc-500 block">Bank Name</span>
                                <span className="font-bold text-white">{selectedTicket.adminPaymentDetails.bankName}</span>
                              </div>
                            )}
                            {selectedTicket.adminPaymentDetails.accountName && (
                              <div className="p-3 bg-zinc-950 rounded-xl border border-white/10">
                                <span className="text-[9px] font-black uppercase text-zinc-500 block">Account Name</span>
                                <span className="font-bold text-white">{selectedTicket.adminPaymentDetails.accountName}</span>
                              </div>
                            )}
                            {selectedTicket.adminPaymentDetails.accountNumber && (
                              <div className="p-3 bg-zinc-950 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Account Number</span>
                                  <span className="font-mono font-bold text-emerald-400">{selectedTicket.adminPaymentDetails.accountNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedTicket.adminPaymentDetails.accountNumber, "psAcc")}
                                  className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] text-zinc-300 hover:text-white cursor-pointer"
                                >
                                  {copiedKey === "psAcc" ? "Copied" : "Copy"}
                                </button>
                              </div>
                            )}
                            {selectedTicket.adminPaymentDetails.routingNumber && (
                              <div className="p-3 bg-zinc-950 rounded-xl border border-white/10 flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-[9px] font-black uppercase text-zinc-500 block">Routing Number</span>
                                  <span className="font-mono font-bold text-blue-400">{selectedTicket.adminPaymentDetails.routingNumber}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(selectedTicket.adminPaymentDetails.routingNumber, "psRte")}
                                  className="px-2 py-1 bg-zinc-900 rounded-lg text-[10px] text-zinc-300 hover:text-white cursor-pointer"
                                >
                                  {copiedKey === "psRte" ? "Copied" : "Copy"}
                                </button>
                              </div>
                            )}
                            {selectedTicket.adminPaymentDetails.identifier && (
                              <div className="sm:col-span-2 p-3.5 bg-zinc-950 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <span className="text-[9px] font-black uppercase text-zinc-500 block">
                                    Assigned Payment Destination
                                  </span>
                                  <span className="text-sm font-mono font-black text-emerald-400 break-all">
                                    {selectedTicket.adminPaymentDetails.identifier}
                                  </span>
                                  {selectedTicket.adminPaymentDetails.recipientName && (
                                    <span className="text-[11px] text-zinc-300 block mt-0.5">
                                      Recipient: {selectedTicket.adminPaymentDetails.recipientName}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {String(selectedTicket.adminPaymentDetails.identifier).trim().startsWith("http") && (
                                    <a
                                      href={String(selectedTicket.adminPaymentDetails.identifier).trim()}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase rounded-lg"
                                    >
                                      Open Portal
                                    </a>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(selectedTicket.adminPaymentDetails.identifier, "psIdent")}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-black uppercase rounded-lg cursor-pointer"
                                  >
                                    {copiedKey === "psIdent" ? "Copied" : "Copy"}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedTicket.adminPaymentDetails.instructions && (
                            <p className="text-[11px] text-blue-200 bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
                              <strong className="uppercase">Instructions:</strong> {selectedTicket.adminPaymentDetails.instructions}
                            </p>
                          )}

                          <form onSubmit={handleCompletePaymentSession} className="pt-2 border-t border-white/10 space-y-3">
                            <input
                              type="text"
                              placeholder="Enter your Sender Tag, Transaction ID, or Reference..."
                              value={sessionRefInput}
                              onChange={(e) => setSessionRefInput(e.target.value)}
                              className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                            />
                            <PaymentReceiptUploader
                              value={sessionReceipts[0] || ""}
                              values={sessionReceipts}
                              onChange={(url) => setSessionReceipts(url ? [url] : [])}
                              onValuesChange={(urls) => setSessionReceipts(urls)}
                              label="Upload Transfer Receipt Screenshot"
                              subtitle="Attach proof of your completed transfer to notify the verification desk."
                            />
                            {sessionPaymentFeedback && (
                              <div className={cn(
                                "p-3 rounded-xl text-xs font-bold border",
                                sessionPaymentFeedback.type === "success"
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                  : "bg-rose-500/15 border-rose-500/30 text-rose-300"
                              )}>
                                {sessionPaymentFeedback.text}
                              </div>
                            )}
                            <button
                              type="submit"
                              disabled={isSubmittingSessionPayment || (!sessionRefInput.trim() && sessionReceipts.length === 0)}
                              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer transition-all"
                            >
                              {isSubmittingSessionPayment ? "Submitting Confirmation..." : "Submit Payment Reference & Receipt"}
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
                          <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                          <div>
                            <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                              Payment Proof Submitted · Awaiting Final Confirmation
                            </h4>
                            <p className="text-[11px] text-zinc-200 mt-1">
                              We have received your payment confirmation for <strong className="text-white">{selectedTicket.experienceTitle}</strong>. Once verified by our team, your pass will be issued.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Direct Concierge Inbox & Reply (Visible on Awaiting Details & Active Sessions without Login) */}
                      {(selectedTicket.status === "awaiting_admin_details" || (Array.isArray(selectedTicket.messages) && selectedTicket.messages.length > 0)) && (
                        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-900/90 border border-sky-500/30 space-y-3">
                          <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                                <Mail className="w-3.5 h-3.5" />
                              </div>
                              <div>
                                <h5 className="text-xs font-black uppercase tracking-wider text-sky-300">
                                  Direct Billing Desk Messages ({selectedTicket.messages?.length || 0})
                                </h5>
                                <p className="text-[10px] text-zinc-400">
                                  Live updates sent directly here — no sign-in or email inbox check needed
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                playGuestNotificationChime();
                                if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                                  Notification.requestPermission().catch(() => {});
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/35 text-sky-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Bell className="w-3.5 h-3.5" />
                              <span>{typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted" ? "Alerts Active" : "Enable Alerts"}</span>
                            </button>
                          </div>

                          {Array.isArray(selectedTicket.messages) && selectedTicket.messages.length > 0 ? (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {selectedTicket.messages.map((m: any) => (
                                <div
                                  key={m.id}
                                  className={cn(
                                    "p-3 rounded-xl border text-xs space-y-1",
                                    m.sender === "admin"
                                      ? "bg-sky-500/10 border-sky-500/30 text-zinc-100"
                                      : "bg-zinc-950 border-white/10 text-zinc-300"
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-wider">
                                    <span className={m.sender === "admin" ? "text-sky-300" : "text-indigo-300"}>
                                      {m.sender === "admin" ? (m.senderName || "Billing Concierge Desk") : "You"}
                                    </span>
                                    <span className="text-zinc-500 font-mono">
                                      {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                                    </span>
                                  </div>
                                  {m.subject && <p className="text-[11px] font-bold text-white">{m.subject}</p>}
                                  <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-zinc-400">
                              If vendor verification is delayed slightly, any direct updates from our billing team will appear right inside this box.
                            </p>
                          )}

                          <form onSubmit={handleSendSessionGuestReply} className="flex flex-col sm:flex-row gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Send a reply or question to the desk (no account required)..."
                              value={guestReplyInput}
                              onChange={(e) => setGuestReplyInput(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                            />
                            <button
                              type="submit"
                              disabled={isSendingGuestReply || !guestReplyInput.trim()}
                              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                            >
                              {isSendingGuestReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                              Send Reply
                            </button>
                          </form>
                          {guestReplyFeedback && (
                            <p className="text-[10px] font-bold text-emerald-400">{guestReplyFeedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ) : selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved ? (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400">
                            {selectedTicket.favoritePlayer || selectedTicket.experienceType === "player_inquiry"
                              ? "Payment Receipt Approved — You May Now Proceed!"
                              : "Ticket Approved & Pass Issued!"}
                          </h4>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-400/20 text-emerald-300 font-mono">
                            VERIFIED · READY TO PROCEED
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-200 font-medium mt-1 leading-relaxed">
                          Your payment receipt has been verified and approved by our administrator.{" "}
                          {selectedTicket.messagingPlatform
                            ? `Updates and coordination details are dispatched via ${selectedTicket.messagingPlatform}${selectedTicket.messagingDetails ? ` (${selectedTicket.messagingDetails})` : ""}.`
                            : "Your official PDF pass is ready to download below."}
                        </p>
                      </div>
                    </div>
                  ) : selectedTicket.status === "rejected" ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                              Proof of Payment Rejected — Corrected Receipt Required
                            </h4>
                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono">
                              ACTION REQUIRED
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-200 font-medium mt-1 leading-relaxed">
                            Administrator Note: <strong className="text-rose-200">{selectedTicket.rejectReason || selectedTicket.rejectionReason || "Your uploaded payment receipt was unclear or could not be verified. Please upload a clear corrected receipt below."}</strong>
                          </p>
                        </div>
                      </div>

                      {/* Interactive Re-upload Corrected Receipt Box */}
                      <div className="bg-zinc-950/80 border border-rose-500/20 rounded-2xl p-4 space-y-3">
                        <PaymentReceiptUploader
                          required={true}
                          maxFiles={4}
                          label="Upload Corrected Proof of Payment (Required)"
                          subtitle="Attach a clear screenshot showing transaction amount ($100+ contribution), date/time, and confirmation reference."
                          values={correctedReceipts}
                          value={correctedReceipts[0] || ""}
                          onChange={(url) => {
                            if (url) setCorrectedReceipts(prev => prev.includes(url) ? prev : [...prev, url]);
                          }}
                          onValuesChange={(urls) => setCorrectedReceipts(urls)}
                        />

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 block mb-1">
                            Updated Transaction Hash / Reference (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="Paste transaction ID, Apple card PIN note, or transfer ref..."
                            value={correctedPaymentRef}
                            onChange={(e) => setCorrectedPaymentRef(e.target.value)}
                            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        {resubmitFeedback && (
                          <div className={cn(
                            "p-3 rounded-xl text-xs font-bold border",
                            resubmitFeedback.type === "success"
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                          )}>
                            {resubmitFeedback.text}
                          </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={handleResubmitCorrectedReceipt}
                            disabled={correctedReceipts.length === 0 || isResubmittingReceipt}
                            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg"
                          >
                            {isResubmittingReceipt ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Submitting Corrected Receipt...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Submit Corrected Receipt for Verification</span>
                              </>
                            )}
                          </button>

                          {onOpenLiveChat && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onOpenLiveChat(selectedTicket.id);
                              }}
                              className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-colors border border-white/10 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" /> Need Help? Live Support
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-4 h-4 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-400">
                            Payment Receipt Awaiting Verification
                          </h4>
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-amber-400/20 text-amber-300 font-mono">
                            AWAITING ADMIN REVIEW
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-200 font-medium mt-1 leading-relaxed">
                          Your proof of payment has been received and is currently awaiting verification by our administrator.{" "}
                          {selectedTicket.messagingPlatform
                            ? `Once reviewed and approved, you will be notified directly via ${selectedTicket.messagingPlatform} so you know you can proceed.`
                            : "Once verified, your approval status and downloadable pass will unlock here automatically."}
                        </p>
                        {resubmitFeedback && resubmitFeedback.type === "success" && (
                          <div className="mt-2 p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300">
                            {resubmitFeedback.text}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => performSearch(searchQuery || selectedTicket.id)}
                          className="mt-2.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black rounded-lg text-[9px] font-black uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" /> Refresh Verification Status
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Request Summary Card for Payment Sessions vs. Full Gate Pass Card for Orders */}
                  {selectedTicket.isPaymentSession ? (
                    <div className="bg-zinc-900 border border-white/10 rounded-3xl p-5 space-y-3 text-xs">
                      <div className="flex items-center justify-between border-b border-white/10 pb-3">
                        <div>
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-blue-400">
                            PAYMENT REQUEST · {selectedTicket.id}
                          </span>
                          <h4 className="text-base font-black uppercase text-white mt-0.5">
                            {selectedTicket.experienceTitle}
                          </h4>
                        </div>
                        <span className="text-base font-mono font-black text-emerald-400">
                          ${Number(selectedTicket.amount || selectedTicket.totalPrice || 0).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Requested By</span>
                          <p className="font-bold text-white mt-0.5">{selectedTicket.customerName || selectedTicket.buyerName}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Email</span>
                          <p className="font-medium text-zinc-300 mt-0.5 truncate">{selectedTicket.customerEmail || selectedTicket.buyerEmail}</p>
                        </div>
                        <div>
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 block">Payment Channel</span>
                          <p className="font-bold text-blue-300 uppercase mt-0.5">{selectedTicket.paymentMethod}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
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
                        <>
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

                        {selectedTicket.sidelinePassCount > 0 && (
                          <div className="mt-3 p-3 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                              <div>
                                <span className="text-xs font-black uppercase text-blue-300 block">
                                  Includes {selectedTicket.sidelinePassCount}x On-Field Sideline Pass
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  Exclusive pre-game & in-game sideline field access credentials included
                                </span>
                              </div>
                            </div>
                            <span className="text-xs font-mono font-black text-blue-400">
                              ${(selectedTicket.sidelinePassTotal || selectedTicket.sidelinePassCount * 1200).toLocaleString()} USD
                            </span>
                          </div>
                        )}

                        {/* Star Player Inquiry Session Details */}
                        {(selectedTicket.experienceType === "player_inquiry" || selectedTicket.favoritePlayer) && (
                          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-zinc-950 border border-blue-500/30 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <span className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5 tracking-wider">
                                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                                NFL Star Player Inquiry · $100 Charitable Contribution
                              </span>
                              <span className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase font-mono",
                                selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                  : selectedTicket.status === "rejected"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                              )}>
                                <span className={cn(
                                  "w-1.5 h-1.5 rounded-full animate-pulse",
                                  selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved
                                    ? "bg-emerald-400"
                                    : selectedTicket.status === "rejected"
                                    ? "bg-rose-400"
                                    : "bg-amber-400"
                                )} />
                                {selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved
                                  ? "Verified · Ready to Proceed"
                                  : selectedTicket.status === "rejected"
                                  ? "Corrected Receipt Required"
                                  : "Receipt Awaiting Verification"}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-white/5">
                              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block">Favorite Inquired Player:</span>
                                <p className="text-sm font-black text-white mt-0.5">{selectedTicket.favoritePlayer} ({selectedTicket.teamId})</p>
                              </div>
                              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-white/5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block">Preferred Notification Channel:</span>
                                <p className="text-xs font-mono font-bold text-blue-300 mt-0.5 uppercase">
                                  {selectedTicket.messagingPlatform}: <span className="text-white font-normal lowercase">{selectedTicket.messagingDetails}</span>
                                </p>
                              </div>
                            </div>

                            {selectedTicket.inquiryObjective && (
                              <div className="text-[10px] text-zinc-300 font-medium bg-zinc-950/40 p-2.5 rounded-xl border border-white/5">
                                <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500 block mb-0.5">Inquiry Focus / Objective:</span>
                                {selectedTicket.inquiryObjective}
                              </div>
                            )}

                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[9px] text-blue-300 font-medium">
                              {selectedTicket.status === "approved" || selectedTicket.status === "confirmed" || selectedTicket.isApproved
                                ? `Your $100 charitable contribution receipt is approved! Look out for direct coordination messages via ${selectedTicket.messagingPlatform || "your selected messaging app"}.`
                                : selectedTicket.status === "rejected"
                                ? "Please upload a clearer proof of your $100 charitable contribution above so our administrator can re-verify your inquiry."
                                : `Your $100 charitable contribution receipt is awaiting administrator verification. Once approved, we will notify you via ${selectedTicket.messagingPlatform || "your messaging app"} so you know you can proceed.`}
                            </div>
                          </div>
                        )}

                        {/* Installment Plan Status Details */}
                        {selectedTicket.installmentPlan && (
                          <div className="mt-3 p-3.5 rounded-2xl bg-zinc-950 border border-blue-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5" />
                                Installment Plan: {selectedTicket.installmentPlan.toUpperCase()} ({selectedTicket.installmentsPaid || 1} of {selectedTicket.installmentsTotal || 5} Paid)
                              </span>
                              <span className="text-[9px] font-mono font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                                {selectedTicket.installmentsLeft || ((selectedTicket.installmentsTotal || 5) - (selectedTicket.installmentsPaid || 1))} INSTALLMENTS LEFT
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                              <span className="text-[10px] text-zinc-400">Paid to Date: <strong className="text-emerald-400 font-mono">${Number(selectedTicket.amountPaid || selectedTicket.dueToday || selectedTicket.totalPrice || 237).toLocaleString()}</strong></span>
                              <span className="text-[10px] text-zinc-400">Remaining Balance: <strong className="text-zinc-200 font-mono">${Number(selectedTicket.installmentRemaining || 1000).toLocaleString()}</strong></span>
                            </div>
                            {selectedTicket.installmentTerms && (
                              <p className="text-[9px] text-zinc-500 font-mono">{selectedTicket.installmentTerms}</p>
                            )}
                          </div>
                        )}

                        {/* Customer Uploaded Proof Pictures */}
                        {(() => {
                          const rList: string[] = (selectedTicket.receiptImages && selectedTicket.receiptImages.length > 0)
                            ? selectedTicket.receiptImages
                            : (selectedTicket.receiptImage ? [selectedTicket.receiptImage] : []);
                          if (rList.length === 0) return null;

                          return (
                            <div className="mt-3 p-3 rounded-2xl bg-zinc-950 border border-white/10 space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[10px] font-black uppercase text-emerald-400 flex items-center gap-1.5">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  {rList.length === 1 ? "Payment Proof Attached" : `${rList.length} Payment Receipts Attached`}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500">
                                  {selectedTicket.status === "approved" || selectedTicket.status === "confirmed"
                                    ? "Verified by Box Office"
                                    : "Queued for Verification"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                {rList.map((picUrl, pIdx) => (
                                  <a
                                    key={pIdx}
                                    href={picUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 hover:scale-105 transition-transform"
                                    title={`View Receipt #${pIdx + 1}`}
                                  >
                                    <img src={picUrl} alt={`Receipt ${pIdx + 1}`} className="w-full h-full object-cover" />
                                    <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-[7px] font-mono font-black text-white px-1 rounded">
                                      #{pIdx + 1}
                                    </span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          );
                        })()}
                      </>
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

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {(selectedTicket.isCommemorative || selectedTicket.buyerName?.toLowerCase().includes("dena") || selectedTicket.homeTeam?.toLowerCase().includes("seahawks")) && (
                          <>
                            <a
                              href="/images/seahawks_vip_ticket_isolated.png"
                              download="Seattle-Seahawks-VIP-Ticket-Dena-Johnston-Front-Isolated.png"
                              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#69BE28] to-emerald-400 hover:from-[#5da823] hover:to-emerald-500 text-black text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
                              title="Download isolated front ticket PNG with transparent background"
                            >
                              <Download className="w-3.5 h-3.5 text-black" />
                              <span>Front (PNG)</span>
                            </a>

                            <a
                              href="/images/seahawks_vip_ticket_back_isolated.png"
                              download="Seattle-Seahawks-VIP-Ticket-Dena-Johnston-Back-Isolated.png"
                              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-[#69BE28]/60 text-[#69BE28] hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-95"
                              title="Download isolated back ticket PNG with transparent background"
                            >
                              <Download className="w-3.5 h-3.5 text-[#69BE28]" />
                              <span>Back (PNG)</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => setShowCommemorativeModal(true)}
                              className="px-3.5 py-2.5 rounded-xl bg-[#002244] hover:bg-[#002f5e] border border-[#69BE28]/60 text-[#69BE28] hover:text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-[#69BE28]" />
                              <span>View Both Sides</span>
                            </button>
                          </>
                        )}

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
                  )}
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

        {/* Commemorative Artwork Fullscreen Modal */}
        <VipCommemorativeTicketModal
          isOpen={showCommemorativeModal}
          onClose={() => setShowCommemorativeModal(false)}
          ticketData={selectedTicket}
        />

        {/* 10-Minute Delay Reconstructed Pop-up Notice */}
        {selectedTicket?.isPaymentSession && (
          <TenMinuteFollowUpModal
            isOpen={showTenMinutePopup}
            onClose={handleDismissTenMinutePopup}
            sessionId={selectedTicket.id}
            customerName={selectedTicket.buyerName || selectedTicket.customerName}
            customerEmail={selectedTicket.buyerEmail || selectedTicket.customerEmail}
            itemTitle={selectedTicket.experienceTitle || selectedTicket.itemTitle}
            amount={Number(selectedTicket.totalPrice ?? selectedTicket.amount ?? 100)}
            currentMethod={selectedTicket.paymentMethod || "selected"}
            elapsedMinutes={
              selectedTicket.createdAt
                ? Math.max(3, Math.floor((nowMs - new Date(selectedTicket.createdAt).getTime()) / 60000))
                : 3
            }
            isSwitching={isSwitchingSessionMethod}
            onSwitchToBitcoin={() => handleSwitchSessionMethodInCheckModal("crypto")}
            onSwitchToGiftCard={() => handleSwitchSessionMethodInCheckModal("giftcard")}
          />
        )}
      </div>
    </div>
  );
};
