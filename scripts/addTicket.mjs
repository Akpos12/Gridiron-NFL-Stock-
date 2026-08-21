import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function populateTicket() {
  const email = "claudiakay_halsey@comcast.net";
  const name = "Claudia K Halsey";
  const rawId = "58-WJVSM";
  const orderId = "ORD-1787269876358-WJVSM";
  const passCode = "RFID-SEA-ORD-1787269876358-WJVSM";
  const receiptNo = "REC-58-WJVSM";
  const paymentRef = "SUBMITTED_FOR_APPROVAL";
  const receiptImg1 = "https://i.postimg.cc/zv6bq5MH/photo-2026-08-21-13-55-34.jpg";
  const receiptImg2 = "https://i.postimg.cc/d3pkJvXy/photo-2026-08-21-13-55-40.jpg";

  const bookingData = {
    id: orderId,
    orderId: orderId,
    bookingId: orderId,
    shortId: rawId,
    orderAuditNumber: "#58-WJVSM",
    userId: "user_claudiakay_halsey",
    userEmail: email,
    buyerEmail: email,
    userName: name,
    buyerName: name,
    senderName: name,
    billedTo: "CLAUDIA K HALSEY",
    
    // Experience details
    experienceId: "exp-sea-training",
    experienceTitle: "Seattle Seahawks Official Training Session Access",
    itemName: "Seattle Seahawks Official Training Session Access",
    experienceType: "private_tour",
    category: "Training Session Ticket",
    teamId: "SEA",
    homeTeam: "Seattle Seahawks",
    awayTeam: "NFL Practice Squad",
    stadium: "Virginia Mason Athletic Center (VMAC)",
    location: "Virginia Mason Athletic Center (VMAC), Renton, WA",
    city: "Renton, WA",
    
    // Event schedule
    date: "2026-08-21",
    timeSlot: "09:30 AM",
    time: "09:30 AM",
    
    // Tier & Quantities
    tier: "standard",
    guestsCount: 4,
    quantity: 4,
    price: 500,
    unitPrice: 500,
    totalPrice: 2000,
    totalAmount: 2000,
    dueToday: 2000,
    currency: "USD",
    
    // Codes & IDs
    qrCode: passCode,
    ticketCode: passCode,
    passCode: passCode,
    receiptInvoiceNo: receiptNo,
    receiptNo: receiptNo,
    invoiceNo: receiptNo,
    
    // Payment & Audit
    paymentMethod: "crypto",
    paymentChannel: "CRYPTO",
    paymentRef: paymentRef,
    paymentReference: paymentRef,
    receiptImage: receiptImg1,
    receiptImageUrl: receiptImg1,
    receiptImages: [receiptImg1, receiptImg2],
    
    // Status & Approval
    status: "approved",
    isApproved: true,
    approvalStatus: "APPROVED / TICKET ISSUED",
    approvedAt: "2026-08-21T13:55:34.000Z",
    approvedBy: "NFL Gridiron Executive Treasury & Box Office Management",
    managementNotes: "Audited & Confirmed by NFL Gridiron Executive Treasury. Status: PAID & VALIDATED.",
    verificationNotice: "AUDITED & CONFIRMED BY NFL GRIDIRON EXECUTIVE TREASURY",
    
    // Visual / Cover Image
    imageUrl: "https://i.postimg.cc/gJd9nqzg/341007003061882166.jpg",
    features: [
      "Fieldside spectator seating",
      "Guest pass & lanyard (4 Attendees)",
      "Player autographs & meet opportunity",
      "Complimentary VIP hospitality & refreshment pavilion"
    ],
    
    createdAt: "2026-08-21T13:55:34.000Z",
    updatedAt: "2026-08-21T13:58:00.000Z"
  };

  console.log("Saving booking records into Firestore...");

  // 1. Primary record under orderId in bookings
  await setDoc(doc(db, "bookings", orderId), bookingData);
  console.log("Saved bookings/", orderId);

  // 2. Short ID alias so searching #58-WJVSM or 58-WJVSM works immediately
  await setDoc(doc(db, "bookings", rawId), bookingData);
  console.log("Saved bookings/", rawId);

  // 3. Receipt No alias
  await setDoc(doc(db, "bookings", receiptNo), bookingData);
  console.log("Saved bookings/", receiptNo);

  // 4. Pass code alias
  await setDoc(doc(db, "bookings", passCode), bookingData);
  console.log("Saved bookings/", passCode);

  // 5. Also save in ticket_orders collection
  await setDoc(doc(db, "ticket_orders", orderId), bookingData);
  await setDoc(doc(db, "ticket_orders", rawId), bookingData);
  console.log("Saved ticket_orders collection records");

  // 6. Save User Profile for Claudia K Halsey
  const userRef = doc(db, "users", "user_claudiakay_halsey");
  await setDoc(userRef, {
    uid: "user_claudiakay_halsey",
    email: email,
    displayName: name,
    balance: 5000,
    createdAt: "2026-08-21T13:55:34.000Z",
    updatedAt: "2026-08-21T13:58:00.000Z"
  }, { merge: true });
  console.log("Saved users/user_claudiakay_halsey");

  // 7. Save experience in experiences collection if not present
  const expRef = doc(db, "experiences", "exp-sea-training");
  const expSnap = await getDoc(expRef);
  if (!expSnap.exists()) {
    await setDoc(expRef, {
      id: "exp-sea-training",
      title: "Seattle Seahawks Official Training Session Access",
      description: "Experience an exclusive behind-the-scenes look at the Seattle Seahawks practice and training facility at VMAC. Watch NFL drills, coaching walk-throughs, and player scrimmages up close.",
      type: "private_tour",
      category: "Training Session Ticket",
      price: 250,
      vipPrice: 450,
      premiumPrice: 750,
      teamId: "SEA",
      imageUrl: "https://i.postimg.cc/gJd9nqzg/341007003061882166.jpg",
      location: "Virginia Mason Athletic Center (VMAC), Renton, WA",
      dates: [
        "2026-08-18",
        "2026-08-19",
        "2026-08-20",
        "2026-08-21",
        "2026-08-22",
        "2026-08-25",
        "2026-08-29",
        "2026-09-02",
        "2026-09-05",
        "2026-09-09"
      ],
      timeSlots: ["09:30 AM", "01:30 PM", "05:00 PM"],
      features: [
        "Fieldside spectator seating",
        "Guest pass & lanyard",
        "Player autographs",
        "Complimentary hospitality"
      ],
      rating: 5.0,
      reviewsCount: 88,
      v: Date.now(),
      updatedAt: Date.now()
    });
    console.log("Saved experiences/exp-sea-training");
  }

  console.log("SUCCESSFULLY_INSERTED_ALL_TICKETS");
  process.exit(0);
}

populateTicket().catch(err => {
  console.error("POPULATE_ERROR:", err);
  process.exit(1);
});
