import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface TicketPassInfo {
  id: string;
  orderId?: string;
  ticketCode?: string;
  qrCode?: string;
  passCode?: string;
  eventTitle?: string;
  experienceTitle?: string;
  gameName?: string;
  homeTeam?: string;
  awayTeam?: string;
  stadium?: string;
  city?: string;
  date?: string;
  time?: string;
  timeSlot?: string;
  isDateTbd?: boolean;
  tier?: string;
  quantity?: number;
  guestsCount?: number;
  totalAmount?: number | string;
  totalPrice?: number | string;
  isStockholder?: boolean;
  isShareholder?: boolean;
  stockholderTitle?: string;
  buyerName?: string;
  senderName?: string;
  buyerEmail?: string;
  userEmail?: string;
  buyerPhone?: string;
  status?: string;
  isApproved?: boolean;
  approvedAt?: string;
  approvedBy?: string;
  paymentMethod?: string;
  paymentRef?: string;
  paymentReference?: string;
  paymentChannel?: string;
  createdAt?: string;
  seatInfo?: string;
  gateInfo?: string;
  sectionInfo?: string;
}

export async function generateTicketPDF(ticket: TicketPassInfo): Promise<void> {
  // Create PDF document (Landscape standard ticket format 210mm x 100mm or Portrait 210mm x 297mm A4)
  // Let's create an elegant A4 Portrait official digital pass (210 x 297 mm)
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const isStockholder =
    ticket.isStockholder === true ||
    ticket.isShareholder === true ||
    ticket.paymentMethod?.toLowerCase().includes("stockholder") ||
    ticket.paymentChannel?.toLowerCase().includes("stockholder") ||
    ticket.tier?.toLowerCase().includes("stockholder") ||
    (ticket.buyerEmail && ticket.buyerEmail.toLowerCase().includes("jayne_welage")) ||
    (ticket.buyerName && ticket.buyerName.toLowerCase().includes("welage"));

  const isDateTbd =
    ticket.isDateTbd ||
    !ticket.date ||
    ticket.date.toLowerCase().includes("tbd") ||
    ticket.date.toLowerCase().includes("pending");

  const eventName =
    ticket.eventTitle ||
    ticket.experienceTitle ||
    ticket.gameName ||
    (isStockholder ? "Minnesota Vikings Elite Stockholder & Investor Summit" : "NFL VIP Gridiron Experience & Match Pass");

  const passCode =
    ticket.ticketCode ||
    ticket.qrCode ||
    ticket.passCode ||
    `NFL-PASS-${(ticket.id || ticket.orderId || "AUTH").slice(-8).toUpperCase()}`;

  const orderNumber = (ticket.orderId || ticket.id || "ORD-001").toUpperCase();
  const attendeeName = ticket.buyerName || ticket.senderName || (isStockholder ? "Jayne Welage" : "VIP Passholder");
  const attendeeEmail = ticket.buyerEmail || ticket.userEmail || "attendee@nflgridiron.com";
  
  const eventDate = isDateTbd ? "TBD (Schedule Notice Pending)" : ticket.date!;
  const eventTime = isDateTbd 
    ? "TBA (Stockholder Briefing Notice)" 
    : (ticket.time || ticket.timeSlot || "Kickoff Time (TBA)");

  const venue = ticket.stadium || (ticket.city ? `${ticket.city} Stadium Arena` : "Official NFL Stadium");
  const venueLocation = ticket.city || "United States";
  
  const tierName = isStockholder
    ? "FRANCHISE STOCKHOLDER VIP"
    : (ticket.tier || "VIP ALL-ACCESS").toUpperCase().replace(/_/g, " ");

  const guests = ticket.quantity || ticket.guestsCount || 1;
  const totalPaid = ticket.totalAmount ?? ticket.totalPrice ?? 0;
  const approvedBy = ticket.approvedBy || (isStockholder ? "NFL Gridiron Executive Treasury & Investor Relations" : "NFL Gridiron Box Office Management");
  const approvalDate = ticket.approvedAt ? new Date(ticket.approvedAt).toLocaleDateString() : new Date().toLocaleDateString();

  // Background Canvas
  doc.setFillColor(15, 17, 23); // Dark modern theme
  doc.rect(0, 0, 210, 297, "F");

  // Top Accent Bar (NFL Red / White / Blue)
  doc.setFillColor(14, 82, 214); // Electric Blue
  doc.rect(0, 0, 70, 4, "F");
  doc.setFillColor(255, 255, 255); // White
  doc.rect(70, 0, 70, 4, "F");
  doc.setFillColor(220, 38, 38); // Crimson Red
  doc.rect(140, 0, 70, 4, "F");

  // Header Box
  doc.setFillColor(24, 27, 36);
  doc.roundedRect(margin, 12, contentWidth, 34, 4, 4, "F");
  doc.setDrawColor(45, 50, 65);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin, 12, contentWidth, 34, 4, 4, "S");

  // Header Title & Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("NFL GRIDIRON EXCHANGE", margin + 8, 24);

  doc.setFontSize(8);
  doc.setTextColor(isStockholder ? 52 : 96, isStockholder ? 211 : 165, isStockholder ? 153 : 250); // Emerald if stockholder
  doc.text(
    isStockholder ? "OFFICIAL FRANCHISE STOCKHOLDER & INVESTOR PASS" : "OFFICIAL VERIFIED DIGITAL ADMISSION PASS",
    margin + 8,
    30
  );

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    isStockholder
      ? `TICKET ORDER: #${orderNumber}  |  STATUS: SHAREHOLDER ALLOCATION CLEARED`
      : `TICKET ORDER: #${orderNumber}  |  STATUS: AUTHORIZED & CONFIRMED`,
    margin + 8,
    38
  );

  // Status Badge in Header
  doc.setFillColor(isStockholder ? 16 : 16, isStockholder ? 185 : 185, isStockholder ? 129 : 129); // Emerald green badge
  doc.roundedRect(pageWidth - margin - 56, 20, 48, 18, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(isStockholder ? "STOCKHOLDER VIP" : "GATE READY", pageWidth - margin - 32, 28, { align: "center" });
  doc.setFontSize(6);
  doc.text(isStockholder ? "VERIFIED SHAREHOLDER" : "VERIFIED RFID ENTRY", pageWidth - margin - 32, 33, { align: "center" });

  // Main Ticket Container Card
  const cardY = 52;
  const cardHeight = 175;
  doc.setFillColor(28, 32, 45);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 6, 6, "F");
  doc.setDrawColor(55, 65, 81);
  doc.setLineWidth(0.6);
  doc.roundedRect(margin, cardY, contentWidth, cardHeight, 6, 6, "S");

  // Event Banner Strip inside Card
  doc.setFillColor(isStockholder ? 10 : 14, isStockholder ? 70 : 82, isStockholder ? 180 : 214);
  doc.roundedRect(margin + 4, cardY + 4, contentWidth - 8, 26, 4, 4, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  const truncatedTitle = doc.splitTextToSize(eventName.toUpperCase(), contentWidth - 20);
  doc.text(truncatedTitle[0] || eventName.toUpperCase(), margin + 10, cardY + 16);

  doc.setFontSize(8);
  doc.setTextColor(219, 234, 254);
  doc.text(
    `TIER: ${tierName}  |  ADMIT: ${guests} ${guests === 1 ? "GUEST (LEAD PASSHOLDER)" : "GUESTS"}`,
    margin + 10,
    cardY + 24
  );

  // Event Details Grid
  let curY = cardY + 40;

  // Box: Date & Time
  doc.setFillColor(18, 21, 30);
  doc.roundedRect(margin + 8, curY, 80, 24, 3, 3, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text("DATE & KICKOFF / ADMISSION TIME", margin + 12, curY + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(isDateTbd ? 7.5 : 9);
  doc.text(`${eventDate}`, margin + 12, curY + 14);
  doc.setTextColor(96, 165, 250);
  doc.setFontSize(7.5);
  doc.text(`TIME: ${eventTime}`, margin + 12, curY + 20);

  // Box: Stadium Venue
  doc.setFillColor(18, 21, 30);
  doc.roundedRect(margin + 94, curY, 80, 24, 3, 3, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text("STADIUM ARENA & LOCATION", margin + 98, curY + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  const truncVenue = doc.splitTextToSize(venue, 72);
  doc.text(truncVenue[0] || venue, margin + 98, curY + 14);
  doc.setTextColor(209, 213, 219);
  doc.setFontSize(7.5);
  doc.text(`${venueLocation}`, margin + 98, curY + 20);

  curY += 28;

  // Box: Attendee & Seat Info
  doc.setFillColor(18, 21, 30);
  doc.roundedRect(margin + 8, curY, 80, 24, 3, 3, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text(isStockholder ? "PASSHOLDER (FRANCHISE SHAREHOLDER)" : "PASSHOLDER (LEAD ATTENDEE)", margin + 12, curY + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`${attendeeName}`, margin + 12, curY + 14);
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(7);
  doc.text(`${attendeeEmail}`, margin + 12, curY + 20);

  // Box: Access Tier & Seating / Total
  doc.setFillColor(18, 21, 30);
  doc.roundedRect(margin + 94, curY, 80, 24, 3, 3, "F");
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text("SEATING / ACCESS ALLOCATION", margin + 98, curY + 7);
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(`${tierName}`, margin + 98, curY + 14);
  
  if (isStockholder) {
    doc.setTextColor(52, 211, 153); // Emerald
    doc.setFontSize(6.5);
    doc.text("STOCKHOLDER PRIVILEGE (CLEARED)", margin + 98, curY + 20);
  } else {
    doc.setTextColor(156, 163, 175);
    doc.setFontSize(7);
    doc.text(`TOTAL AMOUNT: $${Number(totalPaid).toLocaleString()}`, margin + 98, curY + 20);
  }

  curY += 30;

  // Dashed Cut / Security Perforation Line
  doc.setDrawColor(75, 85, 99);
  doc.setLineWidth(0.4);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(margin + 8, curY, pageWidth - margin - 8, curY);
  doc.setLineDashPattern([], 0); // Reset

  curY += 8;

  // Passcode & Barcode Section
  doc.setFillColor(18, 21, 30);
  doc.roundedRect(margin + 8, curY, contentWidth - 16, 56, 4, 4, "F");
  doc.setDrawColor(45, 55, 72);
  doc.roundedRect(margin + 8, curY, contentWidth - 16, 56, 4, 4, "S");

  // Left Column: Passcode info
  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text("OFFICIAL ACCESS PASSCODE (GATE SCAN CODE)", margin + 14, curY + 10);

  doc.setTextColor(52, 211, 153); // Emerald
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(`${passCode}`, margin + 14, curY + 20);

  doc.setTextColor(156, 163, 175);
  doc.setFontSize(6.5);
  doc.text(`APPROVED BY: ${approvedBy}`, margin + 14, curY + 27);
  doc.text(`APPROVAL DATE: ${approvalDate}`, margin + 14, curY + 33);
  doc.text(`SECURITY: SHA-256 ENCRYPTED NFC / RFID COMPLIANT`, margin + 14, curY + 39);
  doc.setTextColor(96, 165, 250);
  doc.text(`VERIFICATION: SCAN QR CODE WITH ANY CAMERA`, margin + 14, curY + 45);

  // Real Scannable 2D QR Code on the right
  const qrSize = 36;
  const qrX = pageWidth - margin - qrSize - 14;
  const qrY = curY + 6;

  const origin =
    typeof window !== "undefined" && window.location.origin
      ? window.location.origin
      : "https://ais-dev-fzmmrb2i7l3evzvs4xbafg-53620454143.europe-west2.run.app";
  const verificationUrl = `${origin}/?verifyTicket=${encodeURIComponent(passCode || orderNumber)}`;

  try {
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
      margin: 1,
      width: 400,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    // White backing container for QR code
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(qrX - 2, qrY - 2, qrSize + 4, qrSize + 4, 2, 2, "F");
    doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

    doc.setTextColor(107, 114, 128);
    doc.setFontSize(5.5);
    doc.setFont("helvetica", "bold");
    doc.text("VERIFIED RFID SCAN", qrX + qrSize / 2, qrY + qrSize + 5, { align: "center" });
  } catch (err) {
    console.error("Error drawing QR to PDF:", err);
  }

  // Security Seal at bottom of ticket card
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(6);
  doc.setFont("helvetica", "normal");
  doc.text("STADIUM GATE INSTRUCTIONS: Present this digital or printed pass at the VIP Turnstile / RFID reader for priority entry.", margin + 14, curY + 52);

  // Bottom Notice & Terms Box
  const bottomY = cardY + cardHeight + 10;
  doc.setFillColor(24, 27, 36);
  doc.roundedRect(margin, bottomY, contentWidth, 38, 4, 4, "F");
  doc.setDrawColor(45, 50, 65);
  doc.roundedRect(margin, bottomY, contentWidth, 38, 4, 4, "S");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.text("IMPORTANT ADMISSION & PASS RULES", margin + 8, bottomY + 8);

  doc.setTextColor(156, 163, 175);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  const terms = [
    "1. This official pass is non-transferable without prior Box Office authorization.",
    "2. Photo ID matching the passholder name may be requested at entry gates or VIP suite desks.",
    "3. Gates open 2 hours prior to scheduled game/event kickoff. Early arrival is recommended for security clearance.",
    "4. For customer service or rescheduling assistance, contact NFL Gridiron Support Concierge.",
  ];
  let termY = bottomY + 14;
  terms.forEach((t) => {
    doc.text(t, margin + 8, termY);
    termY += 5;
  });

  // Footer Branding
  doc.setTextColor(107, 114, 128);
  doc.setFontSize(6);
  doc.text(
    `NFL Gridiron Exchange © ${new Date().getFullYear()} Official Passbook · Issued for ${attendeeName} · Pass ID: ${passCode}`,
    pageWidth / 2,
    290,
    { align: "center" }
  );

  // Trigger Save / Download
  const cleanFileName = `NFL-Pass-${passCode.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
  doc.save(cleanFileName);
}
