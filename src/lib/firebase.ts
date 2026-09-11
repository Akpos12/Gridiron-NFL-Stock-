import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { 
  initializeFirestore,
  setLogLevel, 
  setDoc, 
  DocumentReference, 
  SetOptions 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore with robust long-polling transport for container & iframe proxy environments.
// experimentalForceLongPolling prevents streaming WebChannel buffering delays and the 10-second backend timeout warning.
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);

// Initialize persistence safely at boot and suppress known internal Firebase SDK popup assertion noise
if (typeof window !== "undefined") {
  setPersistence(auth, browserLocalPersistence).catch(() => {
    // Ignored in restricted contexts
  });

  // Catch and prevent internal Firebase Auth SDK assertion errors (e.g. "Pending promise was never set")
  // from leaking as unhandled rejections or window errors when popups are blocked in sandboxed environments
  window.addEventListener("unhandledrejection", (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || "");
    if (
      reasonMsg.includes("Pending promise was never set") ||
      reasonMsg.includes("auth/popup-blocked") ||
      reasonMsg.includes("popup-closed-by-user")
    ) {
      event.preventDefault();
    }
  });

  window.addEventListener("error", (event) => {
    const errorMsg = event.message || event.error?.message || "";
    if (
      typeof errorMsg === "string" &&
      (errorMsg.includes("Pending promise was never set") ||
       errorMsg.includes("auth/popup-blocked"))
    ) {
      event.preventDefault();
    }
  });

  // Filter internal Firebase Auth assert error in console
  const rawConsoleError = console.error;
  console.error = (...args: any[]) => {
    const firstMsg = typeof args[0] === "string" ? args[0] : (args[0]?.message || "");
    if (
      typeof firstMsg === "string" &&
      (firstMsg.includes("Pending promise was never set") ||
       (firstMsg.includes("@firebase/auth") && firstMsg.includes("INTERNAL ASSERTION FAILED")))
    ) {
      return;
    }
    rawConsoleError.apply(console, args);
  };
}

// Suppress verbose SDK connection warnings
setLogLevel("error");

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Safely writes a document to Firestore, strictly guarding against the 1,048,576 bytes document size limit.
 * Automatically de-duplicates identical receipt image fields and trims oversize base64 media payloads if necessary.
 */
export async function safeSetDoc<T extends Record<string, any>>(
  reference: DocumentReference,
  data: T,
  options?: SetOptions
) {
  // 1. Shallow clone payload
  const cleanData: any = { ...data };

  // 2. Eliminate redundant duplicate image fields if receiptImage already exists
  if (cleanData.receiptImageUrl && cleanData.receiptImage && cleanData.receiptImageUrl === cleanData.receiptImage) {
    delete cleanData.receiptImageUrl;
  }

  // 3. Measure approximate document size in characters / bytes
  let jsonStr = "";
  try {
    jsonStr = JSON.stringify(cleanData);
  } catch {
    return options ? setDoc(reference, cleanData, options) : setDoc(reference, cleanData);
  }

  // Firestore hard limit is 1,048,576 bytes. We enforce a defensive ceiling of 650,000 bytes.
  if (jsonStr.length > 650_000) {
    console.warn(`[safeSetDoc] Payload size (${jsonStr.length} chars) is approaching Firestore 1MB limit. Optimizing media fields...`);

    // If receiptImages array exists, cap it to the first 2 images
    if (Array.isArray(cleanData.receiptImages) && cleanData.receiptImages.length > 2) {
      cleanData.receiptImages = cleanData.receiptImages.slice(0, 2);
    }

    // Recalculate
    jsonStr = JSON.stringify(cleanData);
    if (jsonStr.length > 750_000) {
      if (Array.isArray(cleanData.receiptImages) && cleanData.receiptImages.length > 1) {
        cleanData.receiptImages = [cleanData.receiptImages[0]];
      }
    }
  }

  try {
    return options ? await setDoc(reference, cleanData, options) : await setDoc(reference, cleanData);
  } catch (err: any) {
    const errorMsg = String(err?.message || err);
    // If Firestore complains about document size exceeding 1,048,576 bytes
    if (errorMsg.includes("exceeds the maximum allowed size") || errorMsg.includes("1,048,576") || errorMsg.includes("size")) {
      console.error("[safeSetDoc] Caught document size limit error from Firestore. Applying emergency compression...", err);
      // Emergency reduction: strip large base64 arrays so the order/booking document is guaranteed to be saved
      const emergencyData = { ...cleanData };
      if (Array.isArray(emergencyData.receiptImages) && emergencyData.receiptImages.length > 1) {
        emergencyData.receiptImages = [emergencyData.receiptImages[0]];
      }
      delete emergencyData.receiptImageUrl;
      emergencyData._attachmentNotice = "Media optimized to satisfy Firestore document storage limits";

      try {
        return options ? await setDoc(reference, emergencyData, options) : await setDoc(reference, emergencyData);
      } catch (retryErr: any) {
        const retryMsg = String(retryErr?.message || retryErr);
        if (retryMsg.includes("exceeds the maximum allowed size") || retryMsg.includes("1,048,576")) {
          // Absolute minimal fallback: remove image strings entirely so order metadata is never lost
          delete emergencyData.receiptImage;
          delete emergencyData.receiptImages;
          emergencyData.hasProofAttached = true;
          return options ? await setDoc(reference, emergencyData, options) : await setDoc(reference, emergencyData);
        }
        throw retryErr;
      }
    }
    throw err;
  }
}
