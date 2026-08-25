import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function populateJayneTicket() {
  const email = "jayne_welage@msn.com";
  const name = "Jayne Welage";
  const rawId = "JW-MIN-ELITE";
  const orderId = "ORD-1789234857211-JW";
  const passCode = "RFID-MIN-INV-1789234857211-JW";
  const receiptNo = "REC-JW-MIN-88392";
  const paymentRef = "OFFICIAL_INVESTMENT_WIRE_CLEARANCE";
  const coverImage = "https://i.postimg.cc/sDYSCSgk/4545d9b7b90ee7c1f34fbb83344efb2cbank.jpg";

  const ticketData = {
    id: orderId,
    orderId: orderId,
    bookingId: orderId,
    shortId: rawId,
    orderAuditNumber: `#${orderId}`,
    
    // User & Attendee Credentials
    userId: "user_jayne_welage",
    userEmail: email,
    buyerEmail: email,
    email: email,
    userName: name,
    buyerName: name,
    senderName: name,
    billedTo: "JAYNE WELAGE",
    passholderName: name,
    leadAttendeeName: name,
    
    // Event Details
    experienceId: "exp-min-elite-investor",
    experienceTitle: "Minnesota Vikings Elite Meet & Greet & Investment Allocation Summit",
    eventTitle: "Minnesota Vikings Elite Meet & Greet & Investment Allocation Summit",
    itemName: "Minnesota Vikings Elite Meet & Greet & Investment Allocation Summit",
    gameName: "Minnesota Vikings Elite Institutional Meet & Greet & Investment Allocation Gala",
    experienceType: "meet_greet",
    category: "Elite Institutional Meet & Greet",
    teamId: "MIN",
    homeTeam: "Minnesota Vikings",
    awayTeam: "Institutional Investor Circle",
    stadium: "U.S. Bank Stadium - Medtronic Club & Executive Boardroom",
    location: "U.S. Bank Stadium - Medtronic Club & Executive Boardroom, Minneapolis, MN",
    venue: "U.S. Bank Stadium (Medtronic Club & Executive Boardroom)",
    city: "Minneapolis, MN",
    state: "MN",
    
    // Schedule (Date not made available yet - TBD)
    date: "TBD (Schedule Announcement Pending)",
    timeSlot: "TBA (Prior to Private Boardroom Session)",
    time: "TBA",
    kickoffTime: "TBA",
    admissionTime: "Schedule Pending / Stockholder Notification",
    isDateTbd: true,
    
    // Tier, Capacity & Financial Allocation
    tier: "stockholder_vip",
    tierName: "Franchise Stockholder & VIP Equity Pass",
    isStockholder: true,
    isShareholder: true,
    stockholderTitle: "Franchise Shareholder & Team Stock Investor",
    guestsCount: 1,
    quantity: 1,
    admitGuests: 1,
    price: 0,
    unitPrice: 0,
    totalPrice: 0,
    totalAmount: 0,
    dueToday: 0,
    currency: "USD",
    
    // Gate Pass & Security Codes
    qrCode: passCode,
    ticketCode: passCode,
    passCode: passCode,
    receiptInvoiceNo: receiptNo,
    receiptNo: receiptNo,
    invoiceNo: receiptNo,
    seatInfo: "Medtronic Executive VIP Suite - Private Boardroom Seat (Stockholder Allocation)",
    gateInfo: "Gate VIP-A (Skyway East Turnstile)",
    sectionInfo: "Executive Boardroom & Private Suite Corridor",
    
    // Payment & Audit
    paymentMethod: "stockholder_equity",
    paymentChannel: "FRANCHISE STOCKHOLDER PRIVILEGE / EQUITY ALLOCATION",
    paymentRef: paymentRef,
    paymentReference: paymentRef,
    receiptImage: coverImage,
    receiptImageUrl: coverImage,
    
    // Approval & Gate Status
    status: "approved",
    isApproved: true,
    approvalStatus: "AUTHORIZED & CONFIRMED / GATE READY",
    gateStatus: "GATE READY",
    approvedAt: "2026-08-25T14:00:00.000Z",
    approvedBy: "NFL Gridiron Executive Treasury & Institutional Investor Relations",
    managementNotes: "Official Team Stockholder & Franchise Equity Investor. VIP Executive Boardroom & Sideline Credentials Cleared (No Admission Fee Required).",
    verificationNotice: "VERIFIED FRANCHISE SHAREHOLDER · OFFICIAL EQUITY PASS",
    
    // Experience Highlights
    imageUrl: coverImage,
    features: [
      "Official presentation of franchise investment cheques & institutional equity certificates",
      "Executive Medtronic Club VIP suite & boardroom admission",
      "Private meet & greet + 1-on-1 photo session with Vikings leadership & players",
      "Signed official Wilson 'The Duke' football with commemorative hologram",
      "Five-star gourmet banquet, premium champagne bar & concierge service",
      "Priority VIP turnstile and RFID fast-track access credentials"
    ],
    
    createdAt: "2026-08-25T14:00:00.000Z",
    updatedAt: "2026-08-25T14:05:00.000Z"
  };

  console.log(`Setting document in 'bookings' for ${orderId}...`);
  await setDoc(doc(db, "bookings", orderId), ticketData, { merge: true });

  console.log(`Setting document in 'ticket_orders' for ${orderId}...`);
  await setDoc(doc(db, "ticket_orders", orderId), ticketData, { merge: true });

  // Also create a short-code document alias for instant lookup
  console.log(`Setting short alias in 'bookings' for ${rawId}...`);
  await setDoc(doc(db, "bookings", rawId), ticketData, { merge: true });

  // Update experience in 'experiences' collection if exists
  try {
    await setDoc(doc(db, "experiences", "exp-min-elite-investor"), {
      id: "exp-min-elite-investor",
      title: "Minnesota Vikings Elite Meet & Greet & Investment Allocation Summit",
      description: "An exclusive high-tier institutional symposium and player meet & greet for elite investors. Includes direct executive board access, presentation of official franchise investment cheques & equity allocation certificates, private VIP suite hospitality, and close-quarters photo & signing session with Minnesota Vikings leadership.",
      type: "meet_greet",
      category: "Elite Institutional Meet & Greet",
      price: 2500,
      vipPrice: 10000,
      premiumPrice: 25000,
      teamId: "MIN",
      imageUrl: coverImage,
      player: "Justin Jefferson & Franchise Executives",
      location: "U.S. Bank Stadium - Medtronic Club & Executive Boardroom, Minneapolis, MN",
      dates: ["2026-09-12", "2026-09-19", "2026-09-26", "2026-10-03", "2026-10-10", "2026-10-17", "2026-10-24"],
      timeSlots: ["01:00 PM", "02:00 PM", "05:30 PM"],
      rating: 5.0,
      reviewsCount: 42
    }, { merge: true });
  } catch (e) {
    console.error("Error setting experience:", e);
  }

  console.log("Successfully created Elite Meet & Greet and Investment Ticket for Jayne Welage!");
  process.exit(0);
}

populateJayneTicket().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
