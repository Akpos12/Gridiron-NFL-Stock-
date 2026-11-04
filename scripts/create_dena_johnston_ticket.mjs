import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function populateDenaTicket() {
  const email = "dena.johnston@gmail.com";
  const name = "Dena Johnston";
  const refCode = "SEA-CARD-VIP-2026-DJ08";
  const orderId = "ORD-1794289382101-DJ";

  const ticketData = {
    id: refCode,
    orderId: refCode,
    bookingId: refCode,
    shortId: refCode,
    refCode: refCode,
    ticketCode: refCode,
    passCode: refCode,
    qrCode: refCode,
    orderAuditNumber: `#${refCode}`,

    // User & Attendee Credentials
    userId: "user_dena_johnston",
    userEmail: email,
    buyerEmail: email,
    email: email,
    userName: name,
    buyerName: name,
    senderName: name,
    billedTo: "DENA JOHNSTON",
    passholderName: name,
    leadAttendeeName: name,

    // Event Details
    experienceId: "exp-sea-card-vip-2026",
    experienceTitle: "Seattle Seahawks vs. Arizona Cardinals · VIP Experience",
    eventTitle: "Seattle Seahawks vs. Arizona Cardinals",
    itemName: "Seattle Seahawks vs. Arizona Cardinals · VIP Experience",
    gameName: "Seattle Seahawks vs. Arizona Cardinals",
    experienceType: "vip_game_pass",
    category: "VIP Experience",
    tier: "VIP Experience",
    teamId: "SEA",
    homeTeam: "Seattle Seahawks",
    awayTeam: "Arizona Cardinals",
    venue: "Lumen Field, Seattle, Washington",
    stadium: "Lumen Field",
    city: "Seattle, Washington",
    state: "WA",

    // Schedule
    date: "Sunday, November 8, 2026",
    timeSlot: "4:25 PM EST (Kickoff)",
    time: "4:25 PM EST",
    kickoffTime: "4:25 PM EST",
    kickoff: "4:25 PM EST",
    admissionTime: "Gates Open 2:00 PM EST (VIP Club Entry)",

    // Pricing & Access
    price: 1000,
    totalPrice: 1000,
    totalAmount: 1000,
    currency: "USD",
    quantity: 1,
    guestsCount: 1,

    // Commemorative Design & Aesthetics
    isCommemorative: true,
    commemorativeDesign: true,
    commemorativeTitle: "Seattle Seahawks Official Commemorative VIP Pass",
    commemorativeRef: refCode,
    commemorativeImageUrl: "/images/seahawks_vip_ticket_dena_johnston.jpg",
    colors: {
      primary: "#002244",    // Seahawks College Navy
      action: "#69BE28",     // Seahawks Action Green
      silver: "#A5ACAF"      // Seahawks Wolf Grey / Silver
    },

    // VIP Seating & Logistics
    seatDetails: "Section VIP Club Level 100 · Row A1 · Seat 12",
    seatInfo: "VIP Club Level 100, Row A1, Seat 12",
    sectionInfo: "VIP Club Level 100",
    gateInfo: "Gate 3 - Northwest VIP Club Entrance",

    // Amenities
    amenities: [
      "Access to exclusive Delta Sky360° Club Lounge at Lumen Field",
      "Pre-game sideline field pass credentials",
      "All-inclusive gourmet chef stations & premium open bar",
      "Commemorative physical NFC metal cardstock keepsake",
      "Dedicated VIP concierge check-in and fast-track lane"
    ],

    // Approval & Security
    status: "confirmed",
    isApproved: true,
    approvedAt: "2026-11-04T07:55:00.000Z",
    approvedBy: "NFL Official VIP Concierge Desk",
    paymentStatus: "paid",
    paymentMethod: "Direct VIP Settlement ($1,000 USD)",
    paymentRef: "TXN-SEA-VIP-DENA-JOHNSTON-1000",
    paymentReference: "TXN-SEA-VIP-DENA-JOHNSTON-1000",
    paymentChannel: "Official NFL VIP Experience Desk",
    createdAt: "2026-11-04T07:55:00.000Z"
  };

  console.log("Seeding Dena Johnston's VIP ticket into Firestore...");

  // Write under refCode in bookings
  await setDoc(doc(db, "bookings", refCode), ticketData, { merge: true });
  // Write under orderId alias in bookings
  await setDoc(doc(db, "bookings", orderId), { ...ticketData, id: orderId }, { merge: true });
  // Write under ticket_orders
  await setDoc(doc(db, "ticket_orders", refCode), ticketData, { merge: true });
  await setDoc(doc(db, "ticket_orders", orderId), { ...ticketData, id: orderId }, { merge: true });
  // Write under store_orders
  await setDoc(doc(db, "store_orders", refCode), ticketData, { merge: true });

  console.log("SUCCESS: Dena Johnston VIP ticket seeded into Firestore!");
  process.exit(0);
}

populateDenaTicket().catch(err => {
  console.error("Error seeding ticket:", err);
  process.exit(1);
});
