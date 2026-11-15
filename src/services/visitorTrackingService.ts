import {
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  writeBatch,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType, safeSetDoc } from "../lib/firebase";

export interface SiteVisitRecord {
  sessionId: string;
  visitorId: string;
  visitNumber: number;
  firstSeenAt: number;
  lastSeenAt: number;
  dateKey: string;
  currentTab: string;
  tabsViewed: string[];
  entryPath: string;
  lastPath: string;
  referrer: string;
  deviceType: "Mobile" | "Tablet" | "Desktop";
  browser: string;
  os: string;
  screenSize: string;
  timezone: string;
  language: string;
  isAuthenticated: boolean;
  userEmail: string;
  isAdmin: boolean;
}

const VISITOR_ID_KEY = "nfl_visitor_id";
const VISIT_COUNT_KEY = "nfl_visit_count";
const SESSION_ID_KEY = "nfl_visit_session_id";
const SESSION_VISIT_NUM_KEY = "nfl_visit_session_number";
const ADMIN_BROWSER_KEY = "nfl_is_admin_browser";
const ADMIN_EMAIL = "alexwtchmn@gmail.com";

function clip(val: unknown, maxLen: number): string {
  const s = typeof val === "string" ? val : String(val ?? "");
  return s.trim().slice(0, maxLen);
}

function makeRandomId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 14)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`.slice(0, 48);
}

function getDateKey(ts: number = Date.now()): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function detectDeviceMetadata() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {
      deviceType: "Desktop" as const,
      browser: "Unknown",
      os: "Unknown",
      screenSize: "0x0",
      timezone: "UTC",
      language: "en",
      referrer: "Direct",
    };
  }

  const ua = navigator.userAgent || "";
  const isTablet = /iPad|Tablet|PlayBook|Silk/i.test(ua) || (/Android/i.test(ua) && !/Mobile/i.test(ua));
  const isMobile = !isTablet && /Mobi|Android|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
  const deviceType: "Mobile" | "Tablet" | "Desktop" = isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop";

  let browser = "Browser";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/CriOS|Chrome\//i.test(ua)) browser = "Chrome";
  else if (/FxiOS|Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";

  let os = "Unknown OS";
  if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Windows/i.test(ua)) os = "Windows";
  else if (/Linux/i.test(ua)) os = "Linux";

  const screenSize = `${window.innerWidth || window.screen?.width || 0}x${window.innerHeight || window.screen?.height || 0}`;
  let timezone = "Unknown";
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Unknown";
  } catch {
    timezone = "Unknown";
  }

  let referrer = "Direct";
  try {
    if (document.referrer) {
      const refUrl = new URL(document.referrer);
      if (refUrl.host && refUrl.host !== window.location.host) {
        referrer = clip(refUrl.host, 120);
      } else {
        referrer = "Internal / Direct";
      }
    }
  } catch {
    referrer = clip(document.referrer || "Direct", 120) || "Direct";
  }

  return {
    deviceType,
    browser,
    os,
    screenSize: clip(screenSize, 24),
    timezone: clip(timezone, 64),
    language: clip(navigator.language || "en", 24),
    referrer,
  };
}

function getOrCreateVisitorIdentity() {
  let visitorId = "";
  let visitNumber = 1;
  let sessionId = "";
  let isNewSession = false;

  try {
    visitorId = localStorage.getItem(VISITOR_ID_KEY) || "";
    if (!visitorId) {
      visitorId = makeRandomId("vis");
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }

    sessionId = sessionStorage.getItem(SESSION_ID_KEY) || "";
    if (!sessionId) {
      isNewSession = true;
      sessionId = makeRandomId("ses");
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);

      const prevCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10) || 0;
      visitNumber = prevCount + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(visitNumber));
      sessionStorage.setItem(SESSION_VISIT_NUM_KEY, String(visitNumber));
    } else {
      visitNumber =
        parseInt(sessionStorage.getItem(SESSION_VISIT_NUM_KEY) || localStorage.getItem(VISIT_COUNT_KEY) || "1", 10) || 1;
    }
  } catch {
    // Fallback if storage is restricted in strict private mode
    if (!visitorId) visitorId = makeRandomId("vis");
    if (!sessionId) {
      sessionId = makeRandomId("ses");
      isNewSession = true;
    }
  }

  return { visitorId, visitNumber, sessionId, isNewSession };
}

function isAdminUserOrBrowser(user?: { email?: string | null } | null): boolean {
  const email = (user?.email || "").trim().toLowerCase();
  if (email === ADMIN_EMAIL) {
    try {
      localStorage.setItem(ADMIN_BROWSER_KEY, "1");
    } catch {
      // ignore storage errors
    }
    return true;
  }
  try {
    return localStorage.getItem(ADMIN_BROWSER_KEY) === "1";
  } catch {
    return false;
  }
}

let inMemoryTabs: string[] = [];
let cachedFirstSeenAt: number | null = null;
let cachedEntryPath: string | null = null;

export async function recordOrSyncVisit(params: {
  tab: string;
  user?: { uid?: string; email?: string | null } | null;
}): Promise<void> {
  if (typeof window === "undefined") return;

  const { visitorId, visitNumber, sessionId } = getOrCreateVisitorIdentity();
  const now = Date.now();
  if (!cachedFirstSeenAt) cachedFirstSeenAt = now;

  const currentPath = clip(`${window.location.pathname || "/"}${window.location.search || ""}`, 180) || "/";
  if (!cachedEntryPath) cachedEntryPath = currentPath;

  const cleanTab = clip(params.tab || "experiences", 40) || "experiences";
  if (!inMemoryTabs.includes(cleanTab)) {
    inMemoryTabs = [...inMemoryTabs, cleanTab].slice(-15);
  }

  const meta = detectDeviceMetadata();
  const isAuthenticated = Boolean(params.user?.uid);
  const userEmail = isAuthenticated
    ? clip(params.user?.email || "Signed-in User", 120)
    : "Anonymous Guest";
  const isAdmin = isAdminUserOrBrowser(params.user);

  const payload: SiteVisitRecord = {
    sessionId: clip(sessionId, 48),
    visitorId: clip(visitorId, 48),
    visitNumber: Math.max(1, Math.min(999999, visitNumber)),
    firstSeenAt: cachedFirstSeenAt,
    lastSeenAt: now,
    dateKey: getDateKey(now),
    currentTab: cleanTab,
    tabsViewed: inMemoryTabs,
    entryPath: cachedEntryPath,
    lastPath: currentPath,
    referrer: meta.referrer,
    deviceType: meta.deviceType,
    browser: clip(meta.browser, 40),
    os: clip(meta.os, 40),
    screenSize: meta.screenSize,
    timezone: meta.timezone,
    language: meta.language,
    isAuthenticated,
    userEmail,
    isAdmin,
  };

  try {
    await safeSetDoc(doc(db, "site_visits", payload.sessionId), payload, { merge: true });
  } catch {
    // Never interrupt guest browsing if analytics write fails or offline
  }
}

export function subscribeToSiteVisits(
  onData: (visits: SiteVisitRecord[]) => void,
  onError?: (err: unknown) => void
) {
  const q = query(
    collection(db, "site_visits"),
    orderBy("lastSeenAt", "desc"),
    limit(250)
  );
  return onSnapshot(
    q,
    (snap) => {
      const list: SiteVisitRecord[] = [];
      snap.forEach((d) => {
        const data = d.data() as Partial<SiteVisitRecord>;
        list.push({
          sessionId: data.sessionId || d.id,
          visitorId: data.visitorId || d.id,
          visitNumber: Number(data.visitNumber) || 1,
          firstSeenAt: Number(data.firstSeenAt) || Number(data.lastSeenAt) || Date.now(),
          lastSeenAt: Number(data.lastSeenAt) || Number(data.firstSeenAt) || Date.now(),
          dateKey: data.dateKey || getDateKey(Number(data.lastSeenAt) || Date.now()),
          currentTab: data.currentTab || "experiences",
          tabsViewed: Array.isArray(data.tabsViewed) ? data.tabsViewed : [data.currentTab || "experiences"],
          entryPath: data.entryPath || "/",
          lastPath: data.lastPath || "/",
          referrer: data.referrer || "Direct",
          deviceType: (data.deviceType as SiteVisitRecord["deviceType"]) || "Desktop",
          browser: data.browser || "Unknown",
          os: data.os || "Unknown",
          screenSize: data.screenSize || "—",
          timezone: data.timezone || "Unknown",
          language: data.language || "en",
          isAuthenticated: Boolean(data.isAuthenticated),
          userEmail: data.userEmail || "Anonymous Guest",
          isAdmin: Boolean(data.isAdmin),
        });
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function deleteSiteVisit(sessionId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "site_visits", sessionId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `site_visits/${sessionId}`);
  }
}

export async function clearSiteVisits(sessionIds: string[]): Promise<void> {
  if (sessionIds.length === 0) return;
  try {
    // Firestore batches support up to 500 ops
    const chunk = sessionIds.slice(0, 450);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, "site_visits", id));
    }
    await batch.commit();
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "site_visits");
  }
}
