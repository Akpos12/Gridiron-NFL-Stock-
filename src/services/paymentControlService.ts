import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
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
    status: session.status || (session.paymentMethod === "giftcard" ? "payment_submitted" : "awaiting_admin_details"),
    adminPaymentDetails: session.adminPaymentDetails || null,
    receiptUrl: session.receiptUrl || "",
    referenceTag: session.referenceTag || "",
    createdAt: session.createdAt || now,
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
