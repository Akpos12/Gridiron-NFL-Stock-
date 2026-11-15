import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  deleteDoc,
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  updateDoc 
} from "firebase/firestore";
import { db, safeSetDoc } from "../lib/firebase";

export type PaymentMethodType = 
  | "cashapp" 
  | "zelle" 
  | "venmo" 
  | "bank" 
  | "card"
  | "paypal" 
  | "crypto" 
  | "giftcard";

export interface AdminPaymentDetails {
  method: string;
  title?: string;
  recipientName?: string;
  identifier?: string; // e.g. Cashtag, Zelle email/phone, PayPal email, Venmo handle, Crypto address
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  accountName?: string;
  network?: string; // For crypto
  mode?: string; // e.g. "Friends & Family", "Domestic Wire"
  instructions?: string;
  memo?: string;
  updatedAt?: number;
}

export interface SessionMailMessage {
  id: string;
  sender: "admin" | "customer";
  senderName?: string;
  subject?: string;
  body: string;
  createdAt: number;
}

export interface PaymentSession {
  id: string; // e.g. "PAY-XXXXXX"
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemType: "ticket" | "experience" | "merchandise" | "deposit";
  itemTitle: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  status: "awaiting_admin_details" | "details_provided" | "payment_submitted" | "completed" | "cancelled";
  adminPaymentDetails?: AdminPaymentDetails | null;
  receiptUrl?: string;
  receiptImage?: string;
  receiptImages?: string[];
  referenceTag?: string;
  messages?: SessionMailMessage[];
  lastAdminMessageAt?: number;
  lastCustomerReplyAt?: number;
  createdAt: number;
  updatedAt: number;
}

export interface ControlRoomPaymentPresets {
  id: string;
  cashappTag?: string;
  cashappName?: string;
  zelleName?: string;
  zelleEmail?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  paypalEmail?: string;
  paypalName?: string;
  paypalMode?: string;
  venmoHandle?: string;
  venmoName?: string;
  btcAddress?: string;
  ethAddress?: string;
  usdtAddress?: string;
  cardPaymentLink?: string;
  cardLabel?: string;
  defaultInstructions?: string;
  autoDispatchEnabled?: boolean;
  updatedAt?: number;
}

const CONTROL_ROOM_SETTINGS_DOC = "master_payment_channels";

export async function getControlRoomPaymentPresets(): Promise<ControlRoomPaymentPresets | null> {
  try {
    const ref = doc(db, "control_room_payment_settings", CONTROL_ROOM_SETTINGS_DOC);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as ControlRoomPaymentPresets) : null;
  } catch (err) {
    console.warn("Could not load control room payment presets:", err);
    return null;
  }
}

export function buildAdminDetailsFromPresets(
  method: string,
  presets: ControlRoomPaymentPresets | null | undefined
): AdminPaymentDetails | null {
  if (!presets) return null;
  const now = Date.now();
  const defaultNote = presets.defaultInstructions?.trim();

  if (method === "crypto") {
    const address = (presets.btcAddress || presets.usdtAddress || presets.ethAddress || "").trim();
    if (!address) return null;
    const altParts: string[] = [];
    if (presets.btcAddress?.trim() && presets.ethAddress?.trim() && presets.ethAddress.trim() !== address) {
      altParts.push(`ETH / USDT: ${presets.ethAddress.trim()}`);
    }
    if (presets.btcAddress?.trim() && presets.usdtAddress?.trim() && presets.usdtAddress.trim() !== address) {
      altParts.push(`USDT: ${presets.usdtAddress.trim()}`);
    }
    const baseInstr = defaultNote || "Send exact BTC equivalent to the verified deposit address below.";
    return {
      method: "crypto",
      identifier: address,
      mode: presets.btcAddress?.trim() ? "Bitcoin (BTC)" : "Crypto / USDT",
      instructions: altParts.length > 0 ? `${baseInstr} (${altParts.join(" · ")})` : baseInstr,
      updatedAt: now
    };
  }

  if (method === "cashapp" && presets.cashappTag?.trim()) {
    return {
      method: "cashapp",
      identifier: presets.cashappTag.trim(),
      recipientName: presets.cashappName?.trim() || "",
      instructions: defaultNote || "Please include your order reference in the Cash App note.",
      updatedAt: now
    };
  }

  if (method === "zelle" && presets.zelleEmail?.trim()) {
    return {
      method: "zelle",
      identifier: presets.zelleEmail.trim(),
      recipientName: presets.zelleName?.trim() || "",
      instructions: defaultNote || "Send via Zelle banking app. Zero fees.",
      updatedAt: now
    };
  }

  if (method === "bank" && (presets.bankAccountNumber?.trim() || presets.bankName?.trim())) {
    return {
      method: "bank",
      bankName: presets.bankName?.trim() || "",
      accountName: presets.bankAccountName?.trim() || "",
      accountNumber: presets.bankAccountNumber?.trim() || "",
      routingNumber: presets.bankRoutingNumber?.trim() || "",
      recipientName: presets.bankAccountName?.trim() || "",
      instructions: defaultNote || "Domestic ACH or Wire Transfer.",
      updatedAt: now
    };
  }

  if (method === "paypal" && presets.paypalEmail?.trim()) {
    return {
      method: "paypal",
      identifier: presets.paypalEmail.trim(),
      recipientName: presets.paypalName?.trim() || "",
      mode: presets.paypalMode?.trim() || "FRIENDS AND FAMILY",
      instructions: defaultNote || "Send via PayPal Friends & Family for instant clearance.",
      updatedAt: now
    };
  }

  if (method === "venmo" && presets.venmoHandle?.trim()) {
    return {
      method: "venmo",
      identifier: presets.venmoHandle.trim(),
      recipientName: presets.venmoName?.trim() || "",
      instructions: defaultNote || "Send via Venmo app.",
      updatedAt: now
    };
  }

  if (method === "card" && presets.cardPaymentLink?.trim()) {
    return {
      method: "card",
      identifier: presets.cardPaymentLink.trim(),
      mode: presets.cardLabel?.trim() || "Secure Credit / Debit Card Portal",
      instructions: defaultNote || "Complete payment via the verified Credit / Debit Card portal link below and upload your confirmation receipt.",
      updatedAt: now
    };
  }

  return null;
}

/**
 * Creates or updates a customer payment session in Firestore
 */
export async function createOrUpdatePaymentSession(session: Partial<PaymentSession> & { id: string; amount: number; paymentMethod: PaymentMethodType }): Promise<string> {
  const sessionRef = doc(db, "payment_sessions", session.id);
  const now = Date.now();

  let existingAdminDetails: AdminPaymentDetails | null = null;
  let existingStatus: string | null = null;
  let existingPaymentMethod: string | null = null;
  let existingCreatedAt = now;
  let existingReceiptUrl = "";
  let existingReceiptImages: string[] = [];
  let existingReferenceTag = "";
  let existingMessages: SessionMailMessage[] = [];
  let existingLastAdminMessageAt: number | undefined = undefined;
  let existingLastCustomerReplyAt: number | undefined = undefined;

  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data() as PaymentSession;
      existingPaymentMethod = data.paymentMethod || null;
      existingAdminDetails = data.adminPaymentDetails || null;
      existingStatus = data.status || null;
      if (data.createdAt) existingCreatedAt = data.createdAt;
      existingReceiptUrl = data.receiptUrl || data.receiptImage || "";
      if (Array.isArray(data.receiptImages)) {
        existingReceiptImages = data.receiptImages.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
      }
      if (data.referenceTag) existingReferenceTag = data.referenceTag;
      if (Array.isArray(data.messages)) {
        existingMessages = data.messages;
      }
      if (data.lastAdminMessageAt) existingLastAdminMessageAt = data.lastAdminMessageAt;
      if (data.lastCustomerReplyAt) existingLastCustomerReplyAt = data.lastCustomerReplyAt;
    }
  } catch (err) {
    console.warn("Could not check existing payment session:", err);
  }

  // Only carry over existing adminPaymentDetails/status if they belong to the SAME payment method.
  // If the customer switched payment methods (e.g. Cash App -> PayPal), clear the previous channel's details.
  const isSamePaymentMethod =
    (!existingPaymentMethod || existingPaymentMethod === session.paymentMethod) &&
    (!existingAdminDetails?.method || existingAdminDetails.method === session.paymentMethod);

  if (!isSamePaymentMethod) {
    existingAdminDetails = null;
    if (existingStatus !== "payment_submitted") {
      existingStatus = null;
      existingReferenceTag = "";
    }
  }
  
  // Preserve admin payment details if already given by the operator for this method
  let resolvedAdminDetails = session.adminPaymentDetails || existingAdminDetails || null;

  // Auto-dispatch from Control Room saved presets if no details exist yet for this session/method
  const hasExistingDetails = Boolean(
    resolvedAdminDetails &&
      (!resolvedAdminDetails.method || resolvedAdminDetails.method === session.paymentMethod) &&
      (resolvedAdminDetails.identifier || resolvedAdminDetails.accountNumber || resolvedAdminDetails.bankName)
  );
  if (!hasExistingDetails && session.paymentMethod !== "giftcard" && existingStatus !== "payment_submitted") {
    const presets = await getControlRoomPaymentPresets();
    if (presets && presets.autoDispatchEnabled !== false) {
      const presetDetails = buildAdminDetailsFromPresets(session.paymentMethod, presets);
      if (presetDetails) {
        resolvedAdminDetails = presetDetails;
      }
    }
  }

  const hasResolvedDetails = Boolean(
    resolvedAdminDetails &&
      (!resolvedAdminDetails.method || resolvedAdminDetails.method === session.paymentMethod) &&
      (resolvedAdminDetails.identifier || resolvedAdminDetails.accountNumber || resolvedAdminDetails.bankName)
  );

  // Resolve status: do not downgrade "details_provided" or "payment_submitted" back to awaiting if details already exist for this method
  let resolvedStatus = session.status;
  if (!resolvedStatus) {
    if (session.paymentMethod === "giftcard") {
      resolvedStatus = "payment_submitted";
    } else if (hasResolvedDetails) {
      resolvedStatus = (existingStatus === "payment_submitted") ? "payment_submitted" : "details_provided";
    } else {
      resolvedStatus = (existingStatus && existingStatus !== "awaiting_admin_details" && existingStatus !== "details_provided")
        ? existingStatus as any
        : "awaiting_admin_details";
    }
  } else if (resolvedStatus === "awaiting_admin_details" && hasResolvedDetails) {
    resolvedStatus = (existingStatus === "payment_submitted") ? "payment_submitted" : "details_provided";
  }

  const mergedImages = Array.from(new Set([
    ...(Array.isArray(session.receiptImages) ? session.receiptImages : []),
    ...(session.receiptUrl ? [session.receiptUrl] : []),
    ...(session.receiptImage ? [session.receiptImage] : []),
    ...existingReceiptImages,
    ...(existingReceiptUrl ? [existingReceiptUrl] : [])
  ].filter((u): u is string => typeof u === "string" && u.trim().length > 0)));

  const primaryReceipt = session.receiptUrl || session.receiptImage || mergedImages[0] || "";

  const payload: PaymentSession = {
    id: session.id,
    orderId: session.orderId || session.id,
    customerName: session.customerName || "Customer",
    customerEmail: session.customerEmail || "",
    customerPhone: session.customerPhone || "",
    itemType: session.itemType || "ticket",
    itemTitle: session.itemTitle || "NFL Experience / Tickets",
    amount: session.amount,
    paymentMethod: session.paymentMethod,
    status: resolvedStatus,
    adminPaymentDetails: resolvedAdminDetails,
    receiptUrl: primaryReceipt,
    receiptImage: primaryReceipt,
    receiptImages: mergedImages,
    referenceTag: session.referenceTag || existingReferenceTag || "",
    messages: Array.isArray(session.messages) && session.messages.length > 0 ? session.messages : existingMessages,
    ...(existingLastAdminMessageAt ? { lastAdminMessageAt: existingLastAdminMessageAt } : {}),
    ...(existingLastCustomerReplyAt ? { lastCustomerReplyAt: existingLastCustomerReplyAt } : {}),
    createdAt: session.createdAt || existingCreatedAt,
    updatedAt: now
  };

  await safeSetDoc(sessionRef, payload, { merge: true });
  return session.id;
}

/**
 * Real-time listener for a single customer's payment session
 */
export function subscribeToPaymentSession(
  sessionId: string, 
  onUpdate: (session: PaymentSession | null) => void
): () => void {
  if (!sessionId) {
    onUpdate(null);
    return () => {};
  }
  const sessionRef = doc(db, "payment_sessions", sessionId);
  return onSnapshot(
    sessionRef, 
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as PaymentSession);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn("Payment session listener error:", err);
    }
  );
}

/**
 * Control Room: Dispatch custom payment details directly to a waiting customer session
 */
export async function dispatchPaymentDetailsToSession(
  sessionId: string,
  details: AdminPaymentDetails
): Promise<void> {
  const sessionRef = doc(db, "payment_sessions", sessionId);
  await safeSetDoc(sessionRef, {
    adminPaymentDetails: {
      ...details,
      updatedAt: Date.now()
    },
    status: "details_provided",
    updatedAt: Date.now()
  }, { merge: true });
}

/**
 * Customer submits payment reference / receipt after receiving payment details
 */
export async function submitCustomerPayment(
  sessionId: string,
  referenceTag: string,
  receiptUrl?: string,
  receiptUrls?: string[]
): Promise<void> {
  const sessionRef = doc(db, "payment_sessions", sessionId);
  const allImages = Array.from(new Set([
    ...(Array.isArray(receiptUrls) ? receiptUrls : []),
    ...(receiptUrl ? [receiptUrl] : [])
  ].filter((u): u is string => typeof u === "string" && u.trim().length > 0)));
  const primary = allImages[0] || receiptUrl || "";

  await safeSetDoc(sessionRef, {
    referenceTag,
    receiptUrl: primary,
    receiptImage: primary,
    receiptImages: allImages,
    status: "payment_submitted",
    updatedAt: Date.now()
  }, { merge: true });
}

/**
 * Sync attached receipt images immediately to payment_sessions even before final submit
 */
export async function syncSessionReceipts(
  sessionId: string,
  receiptUrls: string[]
): Promise<void> {
  if (!sessionId) return;
  const sessionRef = doc(db, "payment_sessions", sessionId);
  const cleanUrls = receiptUrls.filter((u): u is string => typeof u === "string" && u.trim().length > 0);
  const primary = cleanUrls[0] || "";
  await safeSetDoc(sessionRef, {
    receiptUrl: primary,
    receiptImage: primary,
    receiptImages: cleanUrls,
    updatedAt: Date.now()
  }, { merge: true });
}

/**
 * Control Room: Real-time listener for active sessions awaiting admin payment details
 */
export function subscribeToAwaitingPaymentSessions(
  onUpdate: (sessions: PaymentSession[]) => void
): () => void {
  const q = collection(db, "payment_sessions");
  return onSnapshot(
    q,
    (snap) => {
      const list: PaymentSession[] = [];
      snap.forEach((d) => {
        const item = d.data() as PaymentSession;
        list.push(item);
      });
      // Sort newest first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      onUpdate(list);
    },
    (err) => {
      console.warn("Awaiting sessions listener error:", err);
    }
  );
}

/**
 * Control Room: Subscribe to saved payment channel presets
 */
export function subscribeToControlRoomPaymentPresets(
  onUpdate: (presets: ControlRoomPaymentPresets | null) => void
): () => void {
  const ref = doc(db, "control_room_payment_settings", CONTROL_ROOM_SETTINGS_DOC);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        onUpdate(snap.data() as ControlRoomPaymentPresets);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn("Presets listener error:", err);
    }
  );
}

/**
 * Control Room: Save or update operator presets
 */
export async function saveControlRoomPaymentPresets(
  presets: Partial<ControlRoomPaymentPresets>
): Promise<void> {
  const ref = doc(db, "control_room_payment_settings", CONTROL_ROOM_SETTINGS_DOC);
  await safeSetDoc(ref, {
    ...presets,
    id: CONTROL_ROOM_SETTINGS_DOC,
    updatedAt: Date.now()
  }, { merge: true });
}

/**
 * Control Room: Permanently delete a customer payment session/order
 */
export async function deletePaymentSession(sessionId: string): Promise<void> {
  if (!sessionId) return;
  const sessionRef = doc(db, "payment_sessions", sessionId);
  await deleteDoc(sessionRef);
}

/**
 * Control Room: Permanently delete multiple customer payment sessions/orders (bulk delete)
 */
export async function deletePaymentSessions(sessionIds: string[]): Promise<void> {
  const validIds = sessionIds.filter(Boolean);
  if (validIds.length === 0) return;
  const promises = validIds.map(id => deleteDoc(doc(db, "payment_sessions", id)));
  await Promise.all(promises);
}

/**
 * Customer / Terminal: Look up previous reply details given by admin for this customer
 * when they enter their name and choose the same payment method again.
 */
export async function findRecentDispatchedSessionForCustomer(
  customerName: string,
  paymentMethod: string,
  customerEmail?: string
): Promise<PaymentSession | null> {
  const normName = customerName?.trim().toLowerCase() || "";
  const normEmail = customerEmail?.trim().toLowerCase() || "";

  // Need at least a recognizable name or email (skip empty/generic placeholders)
  const isGeneric = !normName || normName === "customer" || normName === "vip guest" || normName === "ticket guest" || normName === "guest";
  const hasSpecificName = !isGeneric && normName.length >= 2;
  const hasEmail = normEmail.includes("@");

  if (!hasSpecificName && !hasEmail) {
    return null;
  }

  try {
    const q = query(
      collection(db, "payment_sessions"),
      where("paymentMethod", "==", paymentMethod)
    );
    const snap = await getDocs(q);
    const matches: PaymentSession[] = [];

    snap.forEach((d) => {
      const s = d.data() as PaymentSession;
      const sName = s.customerName?.trim().toLowerCase() || "";
      const sEmail = s.customerEmail?.trim().toLowerCase() || "";

      const nameMatches = Boolean(
        hasSpecificName && sName && (sName === normName || sName.includes(normName) || normName.includes(sName))
      );
      const emailMatches = Boolean(hasEmail && sEmail && sEmail === normEmail);

      if (nameMatches || emailMatches) {
        // Must have verified admin payment details dispatched FOR THIS SAME METHOD
        if (
          s.adminPaymentDetails &&
          (!s.adminPaymentDetails.method || s.adminPaymentDetails.method === paymentMethod) &&
          (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)
        ) {
          matches.push(s);
        }
      }
    });

    if (matches.length === 0) return null;

    // Return the newest dispatched session
    matches.sort((a, b) => {
      const bTime = b.adminPaymentDetails?.updatedAt || b.updatedAt || b.createdAt || 0;
      const aTime = a.adminPaymentDetails?.updatedAt || a.updatedAt || a.createdAt || 0;
      return bTime - aTime;
    });

    return matches[0];
  } catch (err) {
    console.warn("Failed to find recent dispatched session for customer:", err);
    return null;
  }
}

/**
 * Customer / Terminal: Real-time listener for any matching session for this customer and payment method
 * that receives dispatched payment details from the operator.
 */
export function subscribeToCustomerDispatchedSession(
  customerName: string,
  paymentMethod: string,
  onUpdate: (session: PaymentSession | null) => void,
  customerEmail?: string
): () => void {
  const normName = customerName?.trim().toLowerCase() || "";
  const normEmail = customerEmail?.trim().toLowerCase() || "";
  const isGeneric = !normName || normName === "customer" || normName === "vip guest" || normName === "ticket guest" || normName === "guest";
  const hasSpecificName = !isGeneric && normName.length >= 2;
  const hasEmail = normEmail.includes("@");

  if (!hasSpecificName && !hasEmail) {
    return () => {};
  }

  const q = query(
    collection(db, "payment_sessions"),
    where("paymentMethod", "==", paymentMethod)
  );

  return onSnapshot(
    q,
    (snap) => {
      const matches: PaymentSession[] = [];
      snap.forEach((d) => {
        const s = d.data() as PaymentSession;
        const sName = s.customerName?.trim().toLowerCase() || "";
        const sEmail = s.customerEmail?.trim().toLowerCase() || "";

        const nameMatches = Boolean(
          hasSpecificName && sName && (sName === normName || sName.includes(normName) || normName.includes(sName))
        );
        const emailMatches = Boolean(hasEmail && sEmail && sEmail === normEmail);

        if (nameMatches || emailMatches) {
          if (
            s.adminPaymentDetails &&
            (!s.adminPaymentDetails.method || s.adminPaymentDetails.method === paymentMethod) &&
            (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)
          ) {
            matches.push(s);
          }
        }
      });

      if (matches.length > 0) {
        matches.sort((a, b) => {
          const bTime = b.adminPaymentDetails?.updatedAt || b.updatedAt || b.createdAt || 0;
          const aTime = a.adminPaymentDetails?.updatedAt || a.updatedAt || a.createdAt || 0;
          return bTime - aTime;
        });
        onUpdate(matches[0]);
      }
    },
    (err) => {
      console.warn("Customer dispatched session subscription error:", err);
    }
  );
}

/**
 * Customer / Inquiry Recovery: Look up ALL active/responded sessions for a customer
 * across ALL payment methods (whether vendor already responded, is still assigning, or customer submitted receipt).
 */
export async function findCustomerInquirySessions(params: {
  email?: string;
  name?: string;
  sessionId?: string;
}): Promise<PaymentSession[]> {
  const normEmail = params.email?.trim().toLowerCase() || "";
  const normName = params.name?.trim().toLowerCase() || "";
  const rawId = params.sessionId?.trim() || "";
  const normId = rawId.toLowerCase();

  const isGeneric = (val: string) =>
    !val || ["customer", "vip guest", "ticket guest", "guest", "vip member", "patriots collector"].includes(val);
  const hasSpecificName = !isGeneric(normName) && normName.length >= 2;
  const hasEmail = normEmail.includes("@");
  const hasId = rawId.length >= 3;

  if (!hasSpecificName && !hasEmail && !hasId) {
    return [];
  }

  const resultsMap = new Map<string, PaymentSession>();

  try {
    if (hasId) {
      try {
        const directSnap = await getDoc(doc(db, "payment_sessions", rawId));
        if (directSnap.exists()) {
          const data = directSnap.data() as PaymentSession;
          if (data.status !== "cancelled") {
            resultsMap.set(directSnap.id, data);
          }
        }
      } catch {
        // ignore missing direct doc
      }
    }

    const allSnap = await getDocs(collection(db, "payment_sessions"));
    allSnap.forEach((d) => {
      const s = d.data() as PaymentSession;
      if (!s || s.status === "cancelled") return;

      const sId = (s.id || d.id || "").toLowerCase();
      const sOrderId = (s.orderId || "").toLowerCase();
      const sName = (s.customerName || "").trim().toLowerCase();
      const sEmail = (s.customerEmail || "").trim().toLowerCase();

      const emailMatch = Boolean(hasEmail && sEmail && sEmail === normEmail);
      const nameMatch = Boolean(
        hasSpecificName && sName && (sName === normName || sName.includes(normName) || normName.includes(sName))
      );
      const idMatch = Boolean(hasId && (sId === normId || sOrderId === normId || sId.includes(normId)));

      if (emailMatch || nameMatch || idMatch) {
        resultsMap.set(s.id || d.id, s);
      }
    });

    const priorityRank = (s: PaymentSession): number => {
      const hasDetails = Boolean(
        s.adminPaymentDetails &&
          (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)
      );
      if (hasDetails && s.status !== "payment_submitted" && s.status !== "completed") return 1;
      if (s.status === "awaiting_admin_details") return 2;
      if (s.status === "payment_submitted") return 3;
      return 4;
    };

    return Array.from(resultsMap.values()).sort((a, b) => {
      const rankDiff = priorityRank(a) - priorityRank(b);
      if (rankDiff !== 0) return rankDiff;
      return (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0);
    });
  } catch (err) {
    console.warn("Failed to find customer inquiry sessions:", err);
    return Array.from(resultsMap.values());
  }
}

/**
 * Direct In-Website Messaging (No Login or External Email Needed):
 * Sends an admin update or customer reply directly onto the payment session document.
 */
export async function sendSessionMailMessage(
  sessionId: string,
  message: {
    sender: "admin" | "customer";
    senderName?: string;
    subject?: string;
    body: string;
  }
): Promise<SessionMailMessage> {
  if (!sessionId || !message.body.trim()) {
    throw new Error("Session ID and message body are required.");
  }

  const sessionRef = doc(db, "payment_sessions", sessionId);
  let existingMessages: SessionMailMessage[] = [];
  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data() as PaymentSession;
      if (Array.isArray(data.messages)) {
        existingMessages = data.messages;
      }
    }
  } catch (err) {
    console.warn("Could not fetch existing session messages:", err);
  }

  const now = Date.now();
  const newMsg: SessionMailMessage = {
    id: `MSG-${now}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    sender: message.sender,
    senderName: message.senderName?.trim() || (message.sender === "admin" ? "Billing Concierge" : "Guest"),
    ...(message.subject?.trim() ? { subject: message.subject.trim() } : {}),
    body: message.body.trim(),
    createdAt: now
  };

  const nextMessages = [...existingMessages, newMsg].slice(-40);

  await safeSetDoc(
    sessionRef,
    {
      messages: nextMessages,
      ...(message.sender === "admin" ? { lastAdminMessageAt: now } : { lastCustomerReplyAt: now }),
      updatedAt: now
    },
    { merge: true }
  );

  return newMsg;
}

export const SAVED_PAYMENT_SESSIONS_KEY = "nfl_saved_payment_sessions";
export const GUEST_MAIL_READ_KEY = "nfl_read_guest_mail_ids";
export const SAVED_SESSIONS_EVENT = "nfl_saved_sessions_updated";
export const READ_MAIL_EVENT = "nfl_guest_mail_read_updated";

export interface SavedGuestSessionBookmark {
  id: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  paymentMethod?: string;
  itemTitle?: string;
  amount?: number;
  status?: string;
  updatedAt?: number;
}

export function getSavedGuestSessions(): SavedGuestSessionBookmark[] {
  try {
    const raw = localStorage.getItem(SAVED_PAYMENT_SESSIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => x && x.id) : [];
  } catch {
    return [];
  }
}

export function upsertSavedGuestSession(entry: SavedGuestSessionBookmark): void {
  if (!entry?.id) return;
  try {
    const existing = getSavedGuestSessions();
    const filtered = existing.filter((x) => x.id !== entry.id);
    const next = [{ ...entry, updatedAt: entry.updatedAt || Date.now() }, ...filtered].slice(0, 6);
    localStorage.setItem(SAVED_PAYMENT_SESSIONS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(SAVED_SESSIONS_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function getReadGuestMailIds(): string[] {
  try {
    const raw = localStorage.getItem(GUEST_MAIL_READ_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function markGuestMessagesAsRead(ids: string[]): void {
  const valid = ids.filter((id) => typeof id === "string" && id.length > 0);
  if (valid.length === 0) return;
  try {
    const existing = getReadGuestMailIds();
    const merged = Array.from(new Set([...valid, ...existing])).slice(0, 250);
    localStorage.setItem(GUEST_MAIL_READ_KEY, JSON.stringify(merged));
    window.dispatchEvent(new Event(READ_MAIL_EVENT));
  } catch {
    // ignore storage errors
  }
}

export function playGuestNotificationChime(): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now); // E5
    osc1.frequency.setValueAtTime(880, now + 0.11); // A5
    gain1.gain.setValueAtTime(0.001, now);
    gain1.gain.exponentialRampToValueAtTime(0.09, now + 0.03);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.36);
  } catch {
    // Ignore autoplay restriction errors
  }
}

