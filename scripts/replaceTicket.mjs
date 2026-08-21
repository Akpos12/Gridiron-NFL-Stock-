import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, getDoc, query, where } from "firebase/firestore";
import fs from "fs";

const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf8"));
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function resetAndReplaceTickets() {
  const targetEmail = "claudiakay_halsey@comcast.net";
  const targetEmailUpper = "CLAUDIAKAY_HALSEY@COMCAST.NET";
  
  console.log("1. Finding all existing documents associated with", targetEmail);

  // Collections to scan
  const collectionsToClean = ["bookings", "ticket_orders"];
  
  for (const collName of collectionsToClean) {
    const collRef = collection(db, collName);
    const snap = await getDocs(collRef);
    let deletedCount = 0;
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const emailMatch = 
        (data.userEmail && data.userEmail.toLowerCase() === targetEmail.toLowerCase()) ||
        (data.buyerEmail && data.buyerEmail.toLowerCase() === targetEmail.toLowerCase()) ||
        (data.email && data.email.toLowerCase() === targetEmail.toLowerCase()) ||
        (data.userName && data.userName.toLowerCase().includes("claudia")) ||
        (data.buyerName && data.buyerName.toLowerCase().includes("claudia")) ||
        docSnap.id.includes("WJVSM") ||
        docSnap.id.includes("claudiakay");

      if (emailMatch) {
        console.log(`Deleting ${collName}/${docSnap.id}`);
        await deleteDoc(doc(db, collName, docSnap.id));
        deletedCount++;
      }
    }
    console.log(`Deleted ${deletedCount} docs from ${collName}`);
  }

  // 2. Insert the fresh new ticket order based on IMG-0281.jpg
  const orderId = "ORD-1787269876358-WJVSM";
  const shortId = "58-WJVSM";
  const passCode = "RFID-SEA-ORD-1787269876358-WJVSM";
  const receiptNo = "REC-58-WJVSM";
  const passImageUrl = "https://i.postimg.cc/Vvj0gK9x/IMG-0281.jpg";

  const newTicketData = {
    id: orderId,
    orderId: orderId,
    bookingId: orderId,
    shortId: shortId,
    orderAuditNumber: "#ORD-1787269876358-WJVSM",
    userId: "user_claudiakay_halsey",
    userEmail: targetEmail,
    buyerEmail: targetEmail,
    email: targetEmail,
    userName: "Claudia K Halsey",
    buyerName: "Claudia K Halsey",
    senderName: "Claudia K Halsey",
    billedTo: "Claudia K Halsey",
    passholderName: "Claudia K Halsey",
    leadAttendeeName: "Claudia K Halsey",
    
    // Event Details
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
    venue: "Virginia Mason Athletic Center (VMAC)",
    city: "Renton",
    state: "WA",
    
    // Date & Schedule
    date: "2026-08-21",
    timeSlot: "1:30 PM",
    time: "1:30 PM",
    kickoffTime: "1:30 PM",
    admissionTime: "1:30 PM",
    
    // Tier, Attendees & Pricing
    tier: "standard",
    guestsCount: 4,
    quantity: 4,
    admitGuests: 4,
    price: 575,
    unitPrice: 575,
    totalPrice: 2300,
    totalAmount: 2300,
    dueToday: 2300,
    currency: "USD",
    
    // Passcodes & Security
    qrCode: passCode,
    ticketCode: passCode,
    passCode: passCode,
    accessPasscode: passCode,
    barcodeText: passCode,
    barcode: passCode,
    receiptInvoiceNo: receiptNo,
    receiptNo: receiptNo,
    invoiceNo: receiptNo,
    securitySignature: "SHA-256 ENCRYPTED NFC / RFID COMPLIANT",
    gateBadge: "GATE READY (VERIFIED RFID ENTRY)",
    
    // Status & Approval
    status: "approved",
    isApproved: true,
    approvalStatus: "AUTHORIZED & CONFIRMED",
    orderStatus: "AUTHORIZED & CONFIRMED",
    gateStatus: "GATE READY",
    approvedAt: "2026-08-21T13:30:00.000Z",
    approvedBy: "NFL Gridiron Executive Treasury & Box Office Management",
    managementNotes: "Official Verified Digital Admission Pass. Authorized & Confirmed by NFL Gridiron Executive Treasury & Box Office Management. 4 Guests Admit.",
    verificationNotice: "AUDITED & CONFIRMED BY NFL GRIDIRON EXECUTIVE TREASURY",
    gateInstructions: "Present this digital or printed pass at the VIP Turnstile / RFID reader for priority entry.",
    
    // Pass Images
    imageUrl: passImageUrl,
    ticketImageUrl: passImageUrl,
    receiptImage: passImageUrl,
    receiptImageUrl: passImageUrl,
    receiptImages: [passImageUrl],
    passbookImage: passImageUrl,
    
    features: [
      "Fieldside spectator seating",
      "Guest pass & lanyard (4 Attendees)",
      "Player autographs & meet opportunity",
      "Complimentary VIP hospitality & refreshment pavilion"
    ],
    
    createdAt: "2026-08-21T13:30:00.000Z",
    updatedAt: "2026-08-21T15:50:00.000Z"
  };

  console.log("3. Writing new ticket records...");

  // Primary order doc
  await setDoc(doc(db, "bookings", orderId), newTicketData);
  console.log("Saved bookings/" + orderId);

  // Short ID doc
  await setDoc(doc(db, "bookings", shortId), newTicketData);
  console.log("Saved bookings/" + shortId);

  // Barcode / passcode doc
  await setDoc(doc(db, "bookings", passCode), newTicketData);
  console.log("Saved bookings/" + passCode);

  // In ticket_orders
  await setDoc(doc(db, "ticket_orders", orderId), newTicketData);
  await setDoc(doc(db, "ticket_orders", shortId), newTicketData);
  console.log("Saved ticket_orders");

  // User Profile
  await setDoc(doc(db, "users", "user_claudiakay_halsey"), {
    uid: "user_claudiakay_halsey",
    email: targetEmail,
    displayName: "Claudia K Halsey",
    balance: 5000,
    updatedAt: "2026-08-21T15:50:00.000Z"
  }, { merge: true });
  console.log("Updated user profile");

  console.log("TICKET_REPLACEMENT_SUCCESS");
  process.exit(0);
}

resetAndReplaceTickets().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
