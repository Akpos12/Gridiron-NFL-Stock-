import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Send, 
  Clock, 
  Check, 
  Copy, 
  Save, 
  Edit3, 
  User, 
  CreditCard, 
  Smartphone, 
  Building2, 
  QrCode, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2,
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { 
  PaymentSession, 
  ControlRoomPaymentPresets,
  AdminPaymentDetails,
  subscribeToAwaitingPaymentSessions,
  subscribeToControlRoomPaymentPresets,
  dispatchPaymentDetailsToSession,
  saveControlRoomPaymentPresets,
  deletePaymentSession,
  deletePaymentSessions
} from "../../services/paymentControlService";

export const ControlRoomPaymentDispatcher: React.FC = () => {
  const [sessions, setSessions] = useState<PaymentSession[]>([]);
  const [presets, setPresets] = useState<ControlRoomPaymentPresets | null>(null);
  const [selectedSession, setSelectedSession] = useState<PaymentSession | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<PaymentSession | null>(null);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [presetsModalOpen, setPresetsModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSavingPresets, setIsSavingPresets] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "awaiting" | "unresponsive" | "submitted">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Dispatch Form State
  const [method, setMethod] = useState<string>("cashapp");
  const [identifier, setIdentifier] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [mode, setMode] = useState("Direct / F&F");
  const [instructions, setInstructions] = useState("");

  // Presets Form State
  const [presetForm, setPresetForm] = useState<Partial<ControlRoomPaymentPresets>>({
    cashappTag: "",
    cashappName: "",
    zelleName: "",
    zelleEmail: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankRoutingNumber: "",
    paypalEmail: "",
    paypalName: "",
    paypalMode: "FRIENDS AND FAMILY",
    venmoHandle: "",
    venmoName: "",
    btcAddress: "",
    ethAddress: "",
    usdtAddress: "",
    defaultInstructions: ""
  });

  // Listen to active sessions
  useEffect(() => {
    const unsub = subscribeToAwaitingPaymentSessions((list) => {
      setSessions(list);
    });
    return () => unsub();
  }, []);

  // Listen to saved presets
  useEffect(() => {
    const unsub = subscribeToControlRoomPaymentPresets((data) => {
      if (data) {
        setPresets(data);
        setPresetForm(data);
      }
    });
    return () => unsub();
  }, []);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Open dispatch modal for a specific customer session
  const handleOpenDispatch = (s: PaymentSession) => {
    setSelectedSession(s);
    setMethod(s.paymentMethod || "cashapp");

    // Pre-fill from existing details or presets
    if (s.adminPaymentDetails) {
      const d = s.adminPaymentDetails;
      setIdentifier(d.identifier || "");
      setRecipientName(d.recipientName || "");
      setBankName(d.bankName || "");
      setAccountName(d.accountName || "");
      setAccountNumber(d.accountNumber || "");
      setRoutingNumber(d.routingNumber || "");
      setMode(d.mode || "");
      setInstructions(d.instructions || "");
    } else if (presets) {
      applyPresetsForMethod(s.paymentMethod, presets);
    } else {
      setIdentifier("");
      setRecipientName("");
      setBankName("");
      setAccountName("");
      setAccountNumber("");
      setRoutingNumber("");
      setMode("");
      setInstructions("");
    }

    setDispatchModalOpen(true);
  };

  const applyPresetsForMethod = (m: string, p: ControlRoomPaymentPresets) => {
    if (m === "cashapp") {
      setIdentifier(p.cashappTag || "");
      setRecipientName(p.cashappName || "");
      setInstructions(p.defaultInstructions || "Please include your order reference in the Cash App note.");
    } else if (m === "zelle") {
      setIdentifier(p.zelleEmail || "");
      setRecipientName(p.zelleName || "");
      setInstructions(p.defaultInstructions || "Send via Zelle banking app. Zero fees.");
    } else if (m === "bank") {
      setBankName(p.bankName || "");
      setAccountName(p.bankAccountName || "");
      setAccountNumber(p.bankAccountNumber || "");
      setRoutingNumber(p.bankRoutingNumber || "");
      setInstructions(p.defaultInstructions || "Domestic ACH or Wire Transfer.");
    } else if (m === "paypal") {
      setIdentifier(p.paypalEmail || "");
      setRecipientName(p.paypalName || "");
      setMode(p.paypalMode || "FRIENDS AND FAMILY");
      setInstructions(p.defaultInstructions || "Send via PayPal Friends & Family for instant clearance.");
    } else if (m === "venmo") {
      setIdentifier(p.venmoHandle || "");
      setRecipientName(p.venmoName || "");
      setInstructions(p.defaultInstructions || "Send via Venmo app.");
    } else if (m === "crypto") {
      setIdentifier(p.btcAddress || p.usdtAddress || "");
      setMode("Bitcoin / USDT");
      setInstructions("Send exact equivalent to the verified deposit address.");
    }
  };

  // Submit dispatch to Firestore
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    setIsDispatching(true);
    try {
      const details: AdminPaymentDetails = {
        method,
        identifier: identifier.trim(),
        recipientName: recipientName.trim(),
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber.trim(),
        mode: mode.trim(),
        instructions: instructions.trim()
      };

      await dispatchPaymentDetailsToSession(selectedSession.id, details);
      showNotification(`Payment details dispatched to ${selectedSession.customerName || "Customer"}!`);
      setDispatchModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Error dispatching payment details: " + err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  // Save Operator Presets
  const handleSavePresets = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPresets(true);
    try {
      await saveControlRoomPaymentPresets(presetForm);
      showNotification("Control room payment presets updated!");
      setPresetsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Error saving presets: " + err.message);
    } finally {
      setIsSavingPresets(false);
    }
  };

  // Delete a single customer order/session
  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await deletePaymentSession(sessionToDelete.id);
      showNotification(`Deleted order for ${sessionToDelete.customerName || "Customer"} (${sessionToDelete.id})`);
      setSessionToDelete(null);
    } catch (err: any) {
      console.error("Delete session error:", err);
      alert("Error deleting customer order: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk delete all orders where customer has not responded
  const handleConfirmBulkDeleteUnresponsive = async () => {
    if (unresponsiveSessions.length === 0) return;
    setIsDeleting(true);
    try {
      const ids = unresponsiveSessions.map(s => s.id);
      await deletePaymentSessions(ids);
      showNotification(`Deleted ${ids.length} unresponsive customer orders.`);
      setBulkDeleteModalOpen(false);
    } catch (err: any) {
      console.error("Bulk delete error:", err);
      alert("Error deleting unresponsive orders: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTimeAgo = (ts?: number) => {
    if (!ts) return "Recently";
    const diffMinutes = Math.floor((Date.now() - ts) / 60000);
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes === 1) return "1 min ago";
    if (diffMinutes < 60) return `${diffMinutes} mins ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return "1 hr ago";
    if (diffHours < 24) return `${diffHours} hrs ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  // Helper groupings
  const awaitingCount = sessions.filter(s => s.status === "awaiting_admin_details").length;
  const unresponsiveSessions = sessions.filter(
    s => s.status === "details_provided" && !s.referenceTag && !s.receiptUrl
  );
  const unresponsiveCount = unresponsiveSessions.length;
  const submittedCount = sessions.filter(
    s => s.status === "payment_submitted" || Boolean(s.referenceTag || s.receiptUrl)
  ).length;

  // Filtered session list
  const filteredSessions = sessions.filter((s) => {
    // Tab filter
    if (activeFilter === "awaiting" && s.status !== "awaiting_admin_details") return false;
    if (activeFilter === "unresponsive") {
      const isUnresponsive = s.status === "details_provided" && !s.referenceTag && !s.receiptUrl;
      if (!isUnresponsive) return false;
    }
    if (activeFilter === "submitted") {
      const isSubmitted = s.status === "payment_submitted" || Boolean(s.referenceTag || s.receiptUrl);
      if (!isSubmitted) return false;
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = s.customerName?.toLowerCase().includes(q);
      const matchEmail = s.customerEmail?.toLowerCase().includes(q);
      const matchId = s.id?.toLowerCase().includes(q);
      const matchItem = s.itemTitle?.toLowerCase().includes(q);
      const matchMethod = s.paymentMethod?.toLowerCase().includes(q);
      const matchRef = s.referenceTag?.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchId && !matchItem && !matchMethod && !matchRef) {
        return false;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-5 right-5 z-[1000] p-4 bg-emerald-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl shadow-2xl flex items-center gap-2 border border-black/10">
          <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header with Preset Settings and Actions */}
      <div className="p-6 bg-zinc-950 border border-white/10 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-black uppercase text-white tracking-wider">
              Control Room Live Payment Dispatcher
            </h3>
            {awaitingCount > 0 && (
              <span className="animate-pulse px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-black uppercase">
                {awaitingCount} Awaiting Details
              </span>
            )}
            {unresponsiveCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-800 border border-white/10 text-zinc-300 font-mono text-[10px] font-black uppercase">
                {unresponsiveCount} No Response
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Input verified payment destination details (Cashtag, Zelle, Bank, Wire, PayPal) directly to customers currently on the checkout screen in real-time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {unresponsiveCount > 0 && (
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(true)}
              className="px-3.5 py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              Clear Non-Responding ({unresponsiveCount})
            </button>
          )}

          <button
            type="button"
            onClick={() => setPresetsModalOpen(true)}
            className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-black text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            Configure Saved Presets
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setActiveFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === "all"
                ? "bg-white text-black shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            All Orders ({sessions.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("awaiting")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === "awaiting"
                ? "bg-amber-500 text-black shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            Awaiting Details ({awaitingCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("unresponsive")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === "unresponsive"
                ? "bg-red-500 text-white shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            Haven't Responded ({unresponsiveCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter("submitted")}
            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
              activeFilter === "submitted"
                ? "bg-emerald-500 text-black shadow"
                : "bg-zinc-900 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            Payment Submitted ({submittedCount})
          </button>
        </div>

        <div className="relative min-w-[200px] max-w-xs w-full">
          <input
            type="text"
            placeholder="Search by customer, order #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Real-time Customer Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-400">
            {activeFilter === "unresponsive" ? "Customer Orders That Haven't Responded" : "Active Customer Checkout Sessions"} ({filteredSessions.length})
          </h4>
          <span className="text-[10px] text-zinc-500 font-mono">Real-time Firestore sync</span>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-10 bg-zinc-950 border border-white/5 rounded-2xl text-center space-y-2">
            <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wide">
              {sessions.length === 0
                ? "No Customers Currently in Payment Queue"
                : activeFilter === "unresponsive"
                ? "No Unresponsive Orders Found"
                : "No Matching Orders for This Filter"}
            </p>
            <p className="text-[10px] text-zinc-600 max-w-md mx-auto">
              {activeFilter === "unresponsive"
                ? "Customers who were given payment details but have not yet submitted payment or responded will appear here."
                : "When a customer selects a payment method during checkout, their session appears here instantly for you to input destination details."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredSessions.map((s) => {
              const isAwaiting = s.status === "awaiting_admin_details";
              const isSubmitted = s.status === "payment_submitted";
              const isProvided = s.status === "details_provided";
              const isUnresponsive = isProvided && !s.referenceTag && !s.receiptUrl;

              return (
                <div
                  key={s.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isAwaiting
                      ? "bg-amber-500/5 border-amber-500/30 shadow-lg shadow-amber-500/5"
                      : isSubmitted
                      ? "bg-emerald-500/5 border-emerald-500/30"
                      : isUnresponsive
                      ? "bg-zinc-950 border-amber-500/20"
                      : "bg-zinc-950 border-white/5"
                  }`}
                >
                  {/* Left Column: Customer & Item Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[9px] font-bold text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                        {s.id}
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isAwaiting
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse"
                          : isSubmitted
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isUnresponsive
                          ? "bg-red-500/20 text-red-300 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                      }`}>
                        {isAwaiting 
                          ? "Awaiting Payment Details" 
                          : isSubmitted 
                          ? "Customer Submitted Payment" 
                          : isUnresponsive 
                          ? "No Customer Response Yet" 
                          : "Details Dispatched"}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">
                        Method: <strong className="text-white">{s.paymentMethod}</strong>
                      </span>
                      {s.createdAt && (
                        <span className="text-[9px] text-zinc-500 font-mono">
                          Created {getTimeAgo(s.createdAt)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline gap-2">
                      <h5 className="text-sm font-black uppercase text-white truncate">
                        {s.itemTitle}
                      </h5>
                      <span className="text-base font-black font-mono text-emerald-400">
                        ${s.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-[11px] text-zinc-400 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1 font-semibold text-white">
                        <User className="w-3.5 h-3.5 text-zinc-500" />
                        {s.customerName || "Customer"}
                      </span>
                      {s.customerEmail && (
                        <span className="text-zinc-500 font-mono">
                          {s.customerEmail}
                        </span>
                      )}
                      {s.customerPhone && (
                        <span className="text-zinc-500 font-mono">
                          {s.customerPhone}
                        </span>
                      )}
                    </div>

                    {/* If details already provided, display preview */}
                    {s.adminPaymentDetails && (
                      <div className="text-[10px] text-zinc-400 bg-zinc-900/80 p-2 rounded-xl border border-white/5 flex items-center gap-3 mt-2 flex-wrap">
                        <span className="text-zinc-500 font-bold uppercase">Dispatched Destination:</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName}
                        </span>
                        {s.adminPaymentDetails.recipientName && (
                          <span className="text-zinc-400 font-semibold">({s.adminPaymentDetails.recipientName})</span>
                        )}
                        {s.adminPaymentDetails.updatedAt && (
                          <span className="text-zinc-500 text-[9px] font-mono ml-auto">
                            Sent {getTimeAgo(s.adminPaymentDetails.updatedAt)}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Unresponsive Alert Callout */}
                    {isUnresponsive && (
                      <div className="text-[10px] text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/20 flex items-center gap-2 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                        <span>Payment details were dispatched {getTimeAgo(s.updatedAt || s.createdAt)}, but customer has not responded or submitted proof.</span>
                      </div>
                    )}

                    {/* If customer submitted payment receipt */}
                    {s.referenceTag && (
                      <div className="text-[10px] text-emerald-400 bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 flex items-center gap-3 mt-1">
                        <span className="font-bold uppercase">Customer Ref / Tag:</span>
                        <span className="font-mono font-black">{s.referenceTag}</span>
                        {s.receiptUrl && (
                          <a
                            href={s.receiptUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline flex items-center gap-1 ml-auto font-bold"
                          >
                            <ExternalLink className="w-3 h-3" /> View Receipt
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Actions (Dispatch / Update + Delete) */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenDispatch(s)}
                      className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md ${
                        isAwaiting
                          ? "bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20 animate-bounce"
                          : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                      }`}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      {isAwaiting ? "Input & Dispatch Details" : "Update Details"}
                    </button>

                    {/* Delete Customer Order Button */}
                    <button
                      type="button"
                      onClick={() => setSessionToDelete(s)}
                      title="Delete customer order"
                      className="px-3 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-red-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SINGLE SESSION DELETE CONFIRMATION MODAL */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  Delete Customer Order?
                </h3>
                <p className="text-xs text-zinc-400">
                  Permanently remove this order from the dispatch queue.
                </p>
              </div>
            </div>

            <div className="p-4 bg-zinc-950 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Customer:</span>
                <span className="font-bold text-white">{sessionToDelete.customerName || "Customer"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Item / Experience:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{sessionToDelete.itemTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Amount:</span>
                <span className="font-mono font-black text-emerald-400">${sessionToDelete.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Method:</span>
                <span className="font-bold text-blue-400 uppercase">{sessionToDelete.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold uppercase text-[10px]">Order / Session ID:</span>
                <span className="font-mono text-zinc-400">{sessionToDelete.id}</span>
              </div>
              {sessionToDelete.status === "details_provided" && !sessionToDelete.referenceTag && (
                <div className="pt-2 border-t border-white/5 text-[11px] text-amber-400">
                  ⚠️ This customer was given payment details but has not responded.
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400">
              Are you sure you want to delete this customer's order? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSession}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete Order
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK DELETE UNRESPONSIVE CONFIRMATION MODAL */}
      {bulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-900 border border-red-500/30 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-white tracking-wide">
                  Delete All Non-Responding Orders?
                </h3>
                <p className="text-xs text-zinc-400">
                  Clear {unresponsiveCount} customer orders that have not responded.
                </p>
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-zinc-950 rounded-2xl border border-white/5">
              {unresponsiveSessions.map(s => (
                <div key={s.id} className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0">
                  <div className="truncate pr-2">
                    <span className="font-bold text-white block">{s.customerName || "Customer"}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{s.paymentMethod.toUpperCase()} · {s.id}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 shrink-0">${s.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-zinc-400">
              This will remove all {unresponsiveCount} customer checkout orders where payment details were dispatched but no customer reply or proof was submitted.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold uppercase transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteUnresponsive}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-red-600/30"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting All...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete {unresponsiveCount} Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISPATCH INPUT MODAL */}
      {dispatchModalOpen && selectedSession && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">
                    Input Payment Details for Customer
                  </h3>
                  <p className="text-[10px] text-zinc-400 font-bold truncate max-w-xs">
                    {selectedSession.customerName} · ${selectedSession.amount.toLocaleString()} ({selectedSession.paymentMethod.toUpperCase()})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDispatchModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="p-6 space-y-4 overflow-y-auto">
              {/* Preset 1-Click Fill button if available */}
              {presets && (
                <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">
                    Have saved presets for {selectedSession.paymentMethod}?
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPresetsForMethod(selectedSession.paymentMethod, presets)}
                    className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 font-black text-[9px] uppercase tracking-wider rounded-lg transition-all"
                  >
                    1-Click Fill from Presets
                  </button>
                </div>
              )}

              {/* Dynamic Inputs depending on payment method */}
              {(method === "cashapp" || method === "zelle" || method === "paypal" || method === "venmo" || method === "crypto") && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-400 block">
                    {method === "cashapp" && "Official Cashtag * (e.g. $YourCashtag)"}
                    {method === "zelle" && "Zelle Recipient Email or Phone Number *"}
                    {method === "paypal" && "PayPal Recipient Email *"}
                    {method === "venmo" && "Venmo Handle * (e.g. @YourHandle)"}
                    {method === "crypto" && "Cryptocurrency Deposit Address *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      method === "cashapp" ? "$MickoTag" :
                      method === "zelle" ? "pay@example.com / (555) 000-0000" :
                      method === "paypal" ? "paypal@domain.com" :
                      method === "venmo" ? "@Username" : "0x... / bc1..."
                    }
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-emerald-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              {/* Recipient Full Name */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400 block">
                  Recipient / Beneficiary Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Matthew Golom / Account Holder Name"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Bank Details (if method is bank or wire) */}
              {(method === "bank" || bankName || accountNumber) && (
                <div className="space-y-3 p-3 bg-zinc-950 rounded-xl border border-white/5">
                  <span className="text-[9px] font-black uppercase text-blue-400 block">Bank Wire / ACH Specifications</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-zinc-500">Bank Name</label>
                      <input
                        type="text"
                        placeholder="e.g. BMO Bank / Chase"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-zinc-500">Account Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Matthew Golom"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-zinc-500">Account Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 4859176529"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-emerald-400"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-bold uppercase text-zinc-500">Routing Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 021000021"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-blue-400"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode / Type e.g. Friends & Family */}
              {method === "paypal" && (
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-zinc-400 block">
                    PayPal Transfer Mode
                  </label>
                  <input
                    type="text"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    placeholder="FRIENDS AND FAMILY"
                    className="w-full bg-zinc-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-amber-400"
                  />
                </div>
              )}

              {/* Custom Operator Instructions */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400 block">
                  Special Instructions for Customer
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Please put Order Ref # in memo. Do not write tickets or NFL in payment note."
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-xs font-medium text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit & Dispatch Button */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold uppercase"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isDispatching}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/30"
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Dispatch to Customer Screen
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SAVED PRESETS CONFIGURATION MODAL */}
      {presetsModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-white/5 flex items-center justify-between bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-white tracking-wide">
                    Configure Control Room Presets
                  </h3>
                  <p className="text-[10px] text-zinc-400">
                    Save your standard payment accounts for rapid 1-click dispatch to customers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPresetsModalOpen(false)}
                className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePresets} className="p-6 space-y-4 overflow-y-auto text-xs">
              {/* Cash App Preset */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-emerald-400 block">Cash App Preset</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Cashtag (e.g. $YourTag)"
                    value={presetForm.cashappTag || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, cashappTag: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={presetForm.cashappName || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, cashappName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Zelle Preset */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-purple-400 block">Zelle Preset</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Zelle Email or Phone"
                    value={presetForm.zelleEmail || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, zelleEmail: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Recipient Name"
                    value={presetForm.zelleName || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, zelleName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Bank Preset */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-blue-400 block">Bank Wire / ACH Preset</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Bank Name (e.g. BMO Bank)"
                    value={presetForm.bankName || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, bankName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Name"
                    value={presetForm.bankAccountName || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, bankAccountName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Account Number"
                    value={presetForm.bankAccountNumber || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, bankAccountNumber: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Routing Number"
                    value={presetForm.bankRoutingNumber || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, bankRoutingNumber: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* PayPal Preset */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-sky-400 block">PayPal Preset</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="PayPal Email"
                    value={presetForm.paypalEmail || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, paypalEmail: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                  <input
                    type="text"
                    placeholder="PayPal Recipient Name"
                    value={presetForm.paypalName || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, paypalName: e.target.value })}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
                  />
                </div>
              </div>

              {/* Crypto Preset */}
              <div className="p-3 bg-zinc-950 rounded-xl border border-white/5 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 block">Cryptocurrency Presets</span>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Bitcoin (BTC) Address"
                    value={presetForm.btcAddress || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, btcAddress: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[10px]"
                  />
                  <input
                    type="text"
                    placeholder="Ethereum / USDT Address"
                    value={presetForm.ethAddress || ""}
                    onChange={(e) => setPresetForm({ ...presetForm, ethAddress: e.target.value })}
                    className="w-full bg-zinc-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-white font-mono text-[10px]"
                  />
                </div>
              </div>

              {/* Default Special Instructions */}
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-zinc-400 block">
                  Default Special Instructions Template
                </label>
                <textarea
                  rows={2}
                  placeholder="Standard instructions sent to customers..."
                  value={presetForm.defaultInstructions || ""}
                  onChange={(e) => setPresetForm({ ...presetForm, defaultInstructions: e.target.value })}
                  className="w-full bg-zinc-950 border border-white/10 rounded-xl p-3 text-white focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPresetsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-400 text-xs font-bold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPresets}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2"
                >
                  {isSavingPresets ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Presets to Control Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
