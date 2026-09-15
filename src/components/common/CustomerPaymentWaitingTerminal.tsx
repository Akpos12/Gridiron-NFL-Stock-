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
  Lock
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { 
  PaymentMethodType, 
  AdminPaymentDetails, 
  PaymentSession,
  createOrUpdatePaymentSession, 
  subscribeToPaymentSession,
  submitCustomerPayment,
  findRecentDispatchedSessionForCustomer,
  subscribeToCustomerDispatchedSession
} from "../../services/paymentControlService";
import { PaymentReceiptUploader } from "./PaymentReceiptUploader";

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
  onSwitchToGiftCard?: () => void;
  onPaymentSubmitted?: (referenceTag: string, receiptUrl: string) => void;
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
  onSwitchToGiftCard,
  onPaymentSubmitted
}) => {
  const [session, setSession] = useState<PaymentSession | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string>(sessionId);
  const [recoveredFromPrevious, setRecoveredFromPrevious] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [referenceTag, setReferenceTag] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Sync activeSessionId if sessionId prop changes
  useEffect(() => {
    if (sessionId) {
      setActiveSessionId(sessionId);
    }
  }, [sessionId]);

  // Check for previous dispatched reply when customer name and payment method are selected
  useEffect(() => {
    let isMounted = true;
    const normName = customerName?.trim().toLowerCase() || "";
    const isGeneric = !normName || normName === "customer" || normName === "vip guest" || normName === "ticket guest" || normName === "guest";
    const cacheKey = `nfl_dispatched_${selectedMethod}_${normName}`;

    // 1. Instant cache check
    if (!isGeneric && normName.length >= 2) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && (parsed.identifier || parsed.accountNumber || parsed.bankName)) {
            setSession({
              id: activeSessionId || sessionId,
              orderId: orderReference || sessionId,
              customerName: customerName || "Customer",
              customerEmail: customerEmail || "",
              customerPhone: customerPhone || "",
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
          }
        }
      } catch (e) {
        // ignore cache parse error
      }
    }

    // 2. Query Firestore for previously dispatched session
    async function checkPreviousDispatchedSession() {
      if (!normName || isGeneric || normName.length < 2) return;
      try {
        const previousSession = await findRecentDispatchedSessionForCustomer(
          customerName!,
          selectedMethod,
          customerEmail
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
              customerName: customerName || "Customer",
              customerEmail: customerEmail || "",
              customerPhone: customerPhone || "",
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
      customerName || "",
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
      customerEmail
    );

    return () => {
      isMounted = false;
      unsubCustomer();
    };
  }, [customerName, selectedMethod, customerEmail, sessionId, activeSessionId, amount, itemTitle, itemType, orderReference]);

  // Real-time listener for activeSessionId
  useEffect(() => {
    const targetSessionId = activeSessionId || sessionId;
    if (!targetSessionId) return;

    createOrUpdatePaymentSession({
      id: targetSessionId,
      orderId: orderReference || targetSessionId,
      customerName: customerName || "Customer",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      itemType,
      itemTitle,
      amount,
      paymentMethod: selectedMethod
    }).catch(err => console.warn("Init payment session failed:", err));

    const unsubscribe = subscribeToPaymentSession(targetSessionId, (updatedSession) => {
      if (updatedSession) {
        setSession(updatedSession);
        if (updatedSession.adminPaymentDetails && customerName) {
          const normName = customerName.trim().toLowerCase();
          const cacheKey = `nfl_dispatched_${selectedMethod}_${normName}`;
          localStorage.setItem(cacheKey, JSON.stringify(updatedSession.adminPaymentDetails));
        }
      }
    });

    return () => unsubscribe();
  }, [activeSessionId, sessionId, selectedMethod, amount, customerName, customerEmail, customerPhone, itemTitle, itemType, orderReference]);

  // Elapsed timer for waiting experience
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleConfirmAndProceed = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!referenceTag.trim() && !receiptUrl) {
      alert("Please provide your payment reference/tag or upload a transfer receipt.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetSessionId = activeSessionId || sessionId;
      await submitCustomerPayment(targetSessionId, referenceTag.trim(), receiptUrl);
      if (onPaymentSubmitted) {
        onPaymentSubmitted(referenceTag.trim(), receiptUrl);
      }
    } catch (err: any) {
      console.error(err);
      alert("Error confirming payment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details: AdminPaymentDetails | undefined | null = session?.adminPaymentDetails;
  const isDetailsAvailable = Boolean(details && (details.identifier || details.accountNumber || details.bankName));

  return (
    <div className="space-y-4">
      {/* Real-time State Card */}
      <AnimatePresence mode="wait">
        {!isDetailsAvailable ? (
          /* STATE 1: AWAITING PAYMENT DETAILS FROM CONTROL ROOM */
          <motion.div
            key="awaiting"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-5 bg-zinc-950 border border-amber-500/30 rounded-2xl space-y-4 relative overflow-hidden"
          >
            {/* Top Amber Glowing Radar Bar */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                  Control Room Dispatch Terminal
                </span>
              </div>
              <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                Session Ref: {sessionId}
              </span>
            </div>

            {/* Waiting Notice */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-white">
                    Awaiting Payment Details from Control Room
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Please stay on this screen. Our Control Room operator is currently inputting verified destination payment details for your <strong className="text-amber-400 uppercase font-mono">${amount.toLocaleString()}</strong> order via <strong className="text-white uppercase">{selectedMethod}</strong>.
                  </p>
                </div>
              </div>

              {/* Status pill & timer */}
              <div className="p-3 bg-zinc-900/90 rounded-xl border border-white/5 flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-2 text-zinc-400 font-bold">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>Live Operator Channel Active ({elapsedSeconds}s)</span>
                </div>
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                  Auto-Updates When Dispatched
                </span>
              </div>
            </div>

            {/* Switch to Gift Card Instant Option */}
            {onSwitchToGiftCard && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-3">
                <span className="text-[10px] text-zinc-400 font-semibold">
                  Don't want to wait for manual dispatch?
                </span>
                <button
                  type="button"
                  onClick={onSwitchToGiftCard}
                  className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-400 hover:text-amber-300 font-black text-[9px] uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Gift className="w-3.5 h-3.5" />
                  Pay With Gift Card (Instant)
                </button>
              </div>
            )}
          </motion.div>
        ) : (
          /* STATE 2: PAYMENT DETAILS RECEIVED - PROCEED NOW */
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
                      ? `Welcome back ${customerName || ""}! We restored the official ${selectedMethod.toUpperCase()} payment details previously provided by the operator for your request.`
                      : "Send exact payment using the details below, then enter your confirmation reference."}
                  </p>
                </div>
              </div>
              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase ${
                recoveredFromPrevious 
                  ? "text-blue-400 bg-blue-500/20 border border-blue-500/30" 
                  : "text-emerald-400 bg-emerald-500/20"
              }`}>
                {recoveredFromPrevious ? "Saved Reply Restored" : "Verified Ready"}
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

              {/* Cashtag / Handle / Email / Address */}
              {details.identifier ? (
                <div className="p-3.5 bg-zinc-900 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-[8px] font-black uppercase text-zinc-500 block">
                      {selectedMethod === "cashapp" && "Official Cashtag"}
                      {selectedMethod === "zelle" && "Zelle Recipient"}
                      {selectedMethod === "venmo" && "Venmo Handle"}
                      {selectedMethod === "paypal" && "PayPal Email / Recipient"}
                      {selectedMethod === "crypto" && "Crypto Deposit Address"}
                      {!["cashapp", "zelle", "venmo", "paypal", "crypto"].includes(selectedMethod) && "Payment Destination"}
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

                  <button
                    type="button"
                    onClick={() => handleCopy(details.identifier!, "identifier")}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-1.5 transition-all self-start sm:self-auto cursor-pointer shadow-md"
                  >
                    {copiedKey === "identifier" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedKey === "identifier" ? "Copied" : "Copy"}
                  </button>
                </div>
              ) : null}

              {/* Crypto QR code if applicable */}
              {selectedMethod === "crypto" && details.identifier && (
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 flex items-center gap-4">
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCodeSVG value={details.identifier} size={64} level="M" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase text-zinc-400">Scan Wallet QR Code</p>
                    <p className="text-[9px] text-zinc-500">Scan using your crypto exchange or wallet app to transmit payment.</p>
                  </div>
                </div>
              )}

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
                  Your Sender Cashtag / Bank Ref / Transaction ID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. $MyTag, Wire Ref #12849, or confirmation code"
                  value={referenceTag}
                  onChange={(e) => setReferenceTag(e.target.value)}
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
                  onChange={(url) => setReceiptUrl(url)}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !referenceTag.trim()}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
