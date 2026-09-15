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
  referenceTag?: string;
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
  defaultInstructions?: string;
  updatedAt?: number;
}

const CONTROL_ROOM_SETTINGS_DOC = "master_payment_channels";

/**
 * Creates or updates a customer payment session in Firestore
 */
export async function createOrUpdatePaymentSession(session: Partial<PaymentSession> & { id: string; amount: number; paymentMethod: PaymentMethodType }): Promise<string> {
  const sessionRef = doc(db, "payment_sessions", session.id);
  const now = Date.now();

  let existingAdminDetails: AdminPaymentDetails | null = null;
  let existingStatus: string | null = null;
  let existingCreatedAt = now;

  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      const data = snap.data() as PaymentSession;
      existingAdminDetails = data.adminPaymentDetails || null;
      existingStatus = data.status || null;
      if (data.createdAt) existingCreatedAt = data.createdAt;
    }
  } catch (err) {
    console.warn("Could not check existing payment session:", err);
  }
  
  // Preserve admin payment details if already given by the operator
  const resolvedAdminDetails = session.adminPaymentDetails || existingAdminDetails || null;
  
  // Resolve status: do not downgrade "details_provided" or "payment_submitted" back to awaiting if details already exist
  let resolvedStatus = session.status;
  if (!resolvedStatus) {
    if (session.paymentMethod === "giftcard") {
      resolvedStatus = "payment_submitted";
    } else if (resolvedAdminDetails && (resolvedAdminDetails.identifier || resolvedAdminDetails.accountNumber || resolvedAdminDetails.bankName)) {
      resolvedStatus = (existingStatus === "payment_submitted") ? "payment_submitted" : "details_provided";
    } else {
      resolvedStatus = (existingStatus && existingStatus !== "awaiting_admin_details") ? existingStatus as any : "awaiting_admin_details";
    }
  } else if (resolvedStatus === "awaiting_admin_details" && resolvedAdminDetails && (resolvedAdminDetails.identifier || resolvedAdminDetails.accountNumber || resolvedAdminDetails.bankName)) {
    resolvedStatus = (existingStatus === "payment_submitted") ? "payment_submitted" : "details_provided";
  }

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
    receiptUrl: session.receiptUrl || "",
    referenceTag: session.referenceTag || "",
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
  receiptUrl?: string
): Promise<void> {
  const sessionRef = doc(db, "payment_sessions", sessionId);
  await safeSetDoc(sessionRef, {
    referenceTag,
    receiptUrl: receiptUrl || "",
    status: "payment_submitted",
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
        // Must have verified admin payment details dispatched
        if (s.adminPaymentDetails && (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)) {
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
          if (s.adminPaymentDetails && (s.adminPaymentDetails.identifier || s.adminPaymentDetails.accountNumber || s.adminPaymentDetails.bankName)) {
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
