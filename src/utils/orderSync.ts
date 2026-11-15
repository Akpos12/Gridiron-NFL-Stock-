import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db, safeSetDoc } from "../lib/firebase";

export interface MatchedDocRef {
  col: "bookings" | "store_orders" | "ticket_orders" | "customer_inquiries";
  docId: string;
}

const TARGET_COLLECTIONS: Array<MatchedDocRef["col"]> = [
  "bookings",
  "store_orders",
  "ticket_orders",
  "customer_inquiries",
];

/**
 * Finds all Firestore documents linked to an order/booking/inquiry across
 * bookings, store_orders, ticket_orders, and customer_inquiries.
 */
export async function findLinkedOrderDocs(item: any): Promise<MatchedDocRef[]> {
  const map = new Map<string, MatchedDocRef>();
  const addRef = (col: MatchedDocRef["col"], docId?: string) => {
    const clean = String(docId || "").trim();
    if (!clean) return;
    map.set(`${col}::${clean}`, { col, docId: clean });
  };

  if (Array.isArray(item?._sourceDocs)) {
    for (const src of item._sourceDocs) {
      if (src?.col && src?.docId && TARGET_COLLECTIONS.includes(src.col)) {
        addRef(src.col, src.docId);
      }
    }
  }

  const rawIds = [item?.id, item?._docId, item?.orderId, item?.bookingId]
    .map((v) => String(v || "").trim())
    .filter(Boolean);

  const baseIds = new Set<string>();
  for (const r of rawIds) {
    baseIds.add(r);
    if (r.startsWith("order-")) {
      baseIds.add(r.slice("order-".length));
    } else {
      addRef("store_orders", `order-${r}`);
    }
  }

  for (const baseId of baseIds) {
    for (const col of TARGET_COLLECTIONS) {
      addRef(col, baseId);
    }
    addRef("store_orders", `order-${baseId}`);
  }

  // Also query store_orders, ticket_orders, customer_inquiries where orderId == baseId
  // (ExperiencesSection uses separate random doc IDs with `orderId` field pointing to `bookings.id`)
  for (const baseId of baseIds) {
    for (const col of ["store_orders", "ticket_orders", "customer_inquiries"] as const) {
      try {
        const snap = await getDocs(query(collection(db, col), where("orderId", "==", baseId)));
        snap.forEach((d) => addRef(col, d.id));
      } catch {
        // Ignore query error and rely on deterministic IDs
      }
    }
  }

  return Array.from(map.values());
}

async function updateExistingOrKnownDocs(
  refs: MatchedDocRef[],
  buildPayload: (col: MatchedDocRef["col"]) => Record<string, any>
) {
  // Always update primary bookings / ticket_orders / customer_inquiries if they exist or match primary id,
  // and merge into any discovered _sourceDocs or queried docs without creating orphan ghost records.
  await Promise.all(
    refs.map(async ({ col, docId }) => {
      try {
        const snap = await getDocs(query(collection(db, col), where("__name__", "==", docId)));
        if (!snap.empty) {
          await safeSetDoc(doc(db, col, docId), buildPayload(col), { merge: true });
        }
      } catch {
        // Fallback: try direct merge write for known primary collections when __name__ check isn't needed
        try {
          await setDoc(doc(db, col, docId), buildPayload(col), { merge: true });
        } catch {
          // Ignore non-existent or restricted docs
        }
      }
    })
  );
}

export async function syncApproveOrder(params: {
  item: any;
  issuedCode?: string;
  reviewedBy?: string;
  approvalNote?: string;
}) {
  const { item, issuedCode, reviewedBy = "NFL Gridiron Box Office Admin", approvalNote } = params;
  const baseId = String(item?.orderId || item?.id || "PASS").trim();
  const finalCode =
    issuedCode ||
    item?.ticketCode ||
    item?.qrCode ||
    `NFL-PASS-${baseId.slice(-6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const nowIso = new Date().toISOString();

  const attendee = item?.senderName || item?.buyerName || item?.userName || item?.customerName || "Valued Fan";
  const subject = item?.favoritePlayer
    ? `${item.favoritePlayer} Experience Inquiry`
    : item?.experienceTitle || item?.itemName || item?.gameName || "NFL Gridiron Experience";
  const defaultApprovalMessage =
    approvalNote ||
    `Hi ${attendee}, your $100 payment receipt for your ${subject} has been reviewed and APPROVED by NFL Gridiron Box Office. Your verification passcode is ${finalCode}. You may now proceed with your experience coordination!`;

  const refs = await findLinkedOrderDocs(item);

  await updateExistingOrKnownDocs(refs, (col) => ({
    status: col === "ticket_orders" ? "confirmed" : "approved",
    orderStatus: "APPROVED · READY TO PROCEED",
    approvalStatus: "RECEIPT VERIFIED & APPROVED",
    isApproved: true,
    requiresReceiptReupload: false,
    rejectReason: "",
    rejectionReason: "",
    ticketCode: finalCode,
    qrCode: finalCode,
    approvedAt: nowIso,
    reviewedAt: nowIso,
    reviewedBy,
    approvedBy: reviewedBy,
    notificationStatus: item?.notificationStatus === "sent" ? "sent" : "ready_to_notify",
    approvalNotificationMessage: defaultApprovalMessage,
    updatedAt: nowIso,
  }));

  return { finalCode, approvedAt: nowIso, approvalNotificationMessage: defaultApprovalMessage };
}

export async function syncRejectOrder(params: {
  item: any;
  reason: string;
  reviewedBy?: string;
}) {
  const { item, reason, reviewedBy = "NFL Gridiron Box Office Admin" } = params;
  const nowIso = new Date().toISOString();
  const cleanReason = reason.trim() || "Proof of payment was unclear or invalid. Please upload a corrected receipt.";

  const refs = await findLinkedOrderDocs(item);

  await updateExistingOrKnownDocs(refs, () => ({
    status: "rejected",
    orderStatus: "RECEIPT REJECTED · RE-UPLOAD REQUIRED",
    approvalStatus: "PROOF OF PAYMENT REJECTED",
    isApproved: false,
    requiresReceiptReupload: true,
    rejectReason: cleanReason,
    rejectionReason: cleanReason,
    reviewNotes: `Receipt rejected: ${cleanReason}`,
    rejectedAt: nowIso,
    reviewedAt: nowIso,
    reviewedBy,
    notificationStatus: "rejection_logged",
    updatedAt: nowIso,
  }));

  return { rejectedAt: nowIso, reason: cleanReason };
}

export async function syncMarkNotificationSent(params: {
  item: any;
  channel: string;
  message: string;
}) {
  const { item, channel, message } = params;
  const nowIso = new Date().toISOString();
  const refs = await findLinkedOrderDocs(item);

  await updateExistingOrKnownDocs(refs, () => ({
    notificationStatus: "sent",
    notifiedAt: nowIso,
    notifiedChannel: channel,
    approvalNotificationMessage: message,
    updatedAt: nowIso,
  }));

  return { notifiedAt: nowIso, channel };
}

export async function syncResubmitReceipt(params: {
  item: any;
  receiptImages: string[];
  paymentRef?: string;
}) {
  const { item, receiptImages, paymentRef } = params;
  const cleanImages = receiptImages.filter((u) => typeof u === "string" && u.trim().length > 0);
  if (cleanImages.length === 0) {
    throw new Error("Please attach at least one corrected receipt image.");
  }

  const nowIso = new Date().toISOString();
  const refs = await findLinkedOrderDocs(item);
  const previousReason = item?.rejectReason || item?.rejectionReason || "";

  await updateExistingOrKnownDocs(refs, (col) => ({
    status:
      col === "store_orders"
        ? "pending_approval"
        : col === "customer_inquiries"
        ? "awaiting_verification"
        : "pending",
    orderStatus: "CORRECTED RECEIPT SUBMITTED · AWAITING VERIFICATION",
    approvalStatus: "CORRECTED RECEIPT AWAITING VERIFICATION",
    isApproved: false,
    requiresReceiptReupload: false,
    rejectReason: "",
    rejectionReason: "",
    previousRejectReason: previousReason,
    receiptImage: cleanImages[0],
    receiptImageUrl: cleanImages[0],
    receiptImages: cleanImages,
    ...(paymentRef && paymentRef.trim() ? { paymentRef: paymentRef.trim(), paymentReference: paymentRef.trim() } : {}),
    receiptResubmittedAt: nowIso,
    updatedAt: nowIso,
  }));

  return { resubmittedAt: nowIso, receiptImages: cleanImages };
}

export function buildMessagingDispatchLinks(params: {
  platform?: string;
  handle?: string;
  phone?: string;
  customerName?: string;
  itemTitle?: string;
  favoritePlayer?: string;
  ticketCode?: string;
  status: "approved" | "rejected";
  rejectReason?: string;
}) {
  const rawPlatform = (params.platform || "").trim();
  const normalizedPlatform = rawPlatform.toLowerCase();
  const handle = (params.handle || params.phone || "").trim();
  const attendee = params.customerName || "Valued Fan";
  const subject = params.favoritePlayer
    ? `${params.favoritePlayer} NFL Experience Inquiry`
    : params.itemTitle || "NFL Gridiron Experience";
  const code = params.ticketCode || "CONFIRMED";

  const message =
    params.status === "approved"
      ? `Hi ${attendee}! Great news from NFL Gridiron Box Office — your $100 payment receipt for your ${subject} has been verified and APPROVED. Your official passcode is ${code}. You can now proceed! Reply here if you need assistance with next steps.`
      : `Hi ${attendee}, regarding your ${subject} on NFL Gridiron: we could not verify your uploaded payment receipt (${params.rejectReason || "image was unclear or incomplete"}). Please upload a corrected proof of payment in the Ticket & Inquiry Check Portal using reference ${code} so we can verify and approve your submission.`;

  const encodedText = encodeURIComponent(message);
  let href = "";
  let actionLabel = "Copy Message";

  if (normalizedPlatform.includes("whatsapp")) {
    const digits = handle.replace(/[^\d]/g, "");
    href = digits
      ? `https://wa.me/${digits}?text=${encodedText}`
      : `https://wa.me/?text=${encodedText}`;
    actionLabel = "Send via WhatsApp";
  } else if (normalizedPlatform.includes("telegram")) {
    const cleanHandle = handle.replace(/^@+/, "").trim();
    if (cleanHandle && !/^\+?\d+$/.test(cleanHandle)) {
      href = `https://t.me/${encodeURIComponent(cleanHandle)}`;
      actionLabel = "Open Telegram Chat";
    } else {
      href = `https://t.me/share/url?url=${encodeURIComponent(typeof window !== "undefined" ? window.location.origin : "https://nflgridiron.app")}&text=${encodedText}`;
      actionLabel = "Send via Telegram";
    }
  } else if (normalizedPlatform.includes("zangi")) {
    actionLabel = "Copy Message for Zangi";
  }

  return {
    platform: rawPlatform || "Messaging App",
    handle,
    message,
    href,
    actionLabel,
  };
}
