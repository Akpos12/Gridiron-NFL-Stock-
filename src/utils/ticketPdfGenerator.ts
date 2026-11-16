import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { triggerBlobDownload } from "./jayneVipExport";

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
  seatDetails?: string;
  quantity?: number;
  guestsCount?: number;
  sidelinePassCount?: number;
  sidelinePassTotal?: number;
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
  installmentPlan?: string;
  installmentTerms?: string;
  installmentDueToday?: number | string;
  isCommemorative?: boolean;
  commemorativeDesign?: boolean;
  isJayneWelageVip?: boolean;
}

export interface GeneratedPdfResult {
  blobUrl: string;
  filename: string;
}

export async function generateTicketPDF(ticket: TicketPassInfo): Promise<GeneratedPdfResult> {
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

  const isJayneWelageVip =
    ticket.isJayneWelageVip === true ||
    (ticket.ticketCode && ticket.ticketCode.toUpperCase() === "MV-VIP-2027-JW01") ||
    (ticket.buyerEmail && ticket.buyerEmail.toLowerCase().includes("jayne_welage")) ||
    (ticket.buyerName && ticket.buyerName.toLowerCase().includes("welage"));

  if (isJayneWelageVip) {
    const purple: [number, number, number] = [79, 38, 131]; // #4F2683 Deep Minnesota Vikings Purple
    const deepPlum: [number, number, number] = [26, 8, 48]; // #1A0830
    const obsidian: [number, number, number] = [7, 5, 10]; // #07050A
    const gold: [number, number, number] = [212, 175, 55]; // #D4AF37
    const brightGold: [number, number, number] = [246, 226, 122]; // #F6E27A
    const warmWhite: [number, number, number] = [247, 244, 236];

    const vipCode = ticket.ticketCode || ticket.qrCode || "MV-VIP-2027-JW01";

    // Page background
    doc.setFillColor(...obsidian);
    doc.rect(0, 0, 210, 297, "F");

    // Top & Bottom Vikings Purple + Gold ribbons
    doc.setFillColor(...purple);
    doc.rect(0, 0, 210, 5, "F");
    doc.setFillColor(...gold);
    doc.rect(0, 5, 210, 0.8, "F");

    // === UPPER SECTION: LUXURY VIP EVENT TICKET ===
    const tY = 14;
    const tH = 128;
    doc.setFillColor(...deepPlum);
    doc.roundedRect(margin, tY, contentWidth, tH, 4, 4, "F");
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.7);
    doc.roundedRect(margin, tY, contentWidth, tH, 4, 4, "S");
    doc.setLineWidth(0.25);
    doc.roundedRect(margin + 2.5, tY + 2.5, contentWidth - 5, tH - 5, 3, 3, "S");

    // Subtle stadium architectural wireframe silhouette behind header
    doc.setDrawColor(145, 115, 45);
    doc.setLineWidth(0.25);
    doc.line(margin + 18, tY + 46, pageWidth / 2, tY + 24);
    doc.line(pageWidth / 2, tY + 24, pageWidth - margin - 18, tY + 46);
    doc.line(margin + 32, tY + 48, pageWidth / 2, tY + 34);
    doc.line(pageWidth / 2, tY + 34, pageWidth - margin - 32, tY + 48);

    // Top Header
    doc.setTextColor(...brightGold);
    doc.setFont("times", "bold");
    doc.setFontSize(8);
    doc.text("THE ULTIMATE VIP EXPERIENCE  ·  ONE MONTH AFTER SUPER BOWL LXI", pageWidth / 2, tY + 13, {
      align: "center",
    });

    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(17);
    doc.text("MINNESOTA VIKINGS VIP EXPERIENCE", pageWidth / 2, tY + 22, { align: "center" });

    doc.setDrawColor(...gold);
    doc.setLineWidth(0.35);
    doc.line(margin + 22, tY + 26.5, pageWidth - margin - 22, tY + 26.5);

    // Left / Center Guest Focus + Right QR Stub
    const leftCenterX = margin + 62;

    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("DISTINGUISHED VIP GUEST OF HONOR", leftCenterX, tY + 41, { align: "center" });

    doc.setTextColor(...brightGold);
    doc.setFont("times", "bold");
    doc.setFontSize(26);
    doc.text("JAYNE WELAGE", leftCenterX, tY + 54, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("PRIVATE MEET & GREET", leftCenterX, tY + 66, { align: "center" });

    doc.setTextColor(...gold);
    doc.setFont("times", "italic");
    doc.setFontSize(13);
    doc.text("+", leftCenterX, tY + 72.5, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    doc.text("INVESTMENT & NETWORKING PARTY", leftCenterX, tY + 79, { align: "center" });

    // Subtle football crest motif
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.45);
    doc.ellipse(leftCenterX, tY + 90, 9, 4.5, "S");
    doc.line(leftCenterX - 4, tY + 90, leftCenterX + 4, tY + 90);
    doc.line(leftCenterX - 2, tY + 88.3, leftCenterX - 2, tY + 91.7);
    doc.line(leftCenterX, tY + 88.3, leftCenterX, tY + 91.7);
    doc.line(leftCenterX + 2, tY + 88.3, leftCenterX + 2, tY + 91.7);

    // Vertical Perforation Divider before QR Stub
    const stubX = pageWidth - margin - 52;
    doc.setDrawColor(...gold);
    doc.setLineDashPattern([1.6, 1.6], 0);
    doc.line(stubX, tY + 30, stubX, tY + tH - 6);
    doc.setLineDashPattern([], 0);

    // Right QR Code Stub
    const origin =
      typeof window !== "undefined" && window.location.origin
        ? window.location.origin
        : "https://www.nflgridiron.company";
    const vipQrUrl = `${origin}/?vipInvite=jayne_welage&verifyTicket=${encodeURIComponent(vipCode)}`;
    const qrBoxSize = 33;
    const qrX = stubX + 9.5;
    const qrY = tY + 41;

    try {
      const qrDataUrl = await QRCode.toDataURL(vipQrUrl, {
        margin: 1,
        width: 450,
        errorCorrectionLevel: "H",
        color: {
          dark: "#1A0830",
          light: "#F7F4EC",
        },
      });
      doc.setFillColor(...warmWhite);
      doc.setDrawColor(...gold);
      doc.setLineWidth(0.75);
      doc.roundedRect(qrX - 3, qrY - 3, qrBoxSize + 6, qrBoxSize + 13, 2, 2, "FD");
      doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrBoxSize, qrBoxSize);

      doc.setTextColor(26, 8, 48);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.text("VIP EVENT ACCESS", qrX + qrBoxSize / 2, qrY + qrBoxSize + 6.5, { align: "center" });
    } catch (err) {
      console.error("VIP QR error:", err);
    }

    doc.setTextColor(...brightGold);
    doc.setFont("courier", "bold");
    doc.setFontSize(7.5);
    doc.text(vipCode, stubX + 26, tY + 96, { align: "center" });

    // Bottom Strip inside Ticket
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.3);
    doc.line(margin + 8, tY + 102, stubX - 5, tY + 102);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...gold);
    doc.text("DATE & TIME", margin + 10, tY + 109);
    doc.text("DRESS CODE", margin + 56, tY + 109);
    doc.text("ADMISSION", margin + 10, tY + 119);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8.5);
    doc.text("MARCH 14, 2027  ·  5:30 PM", margin + 10, tY + 113.5);
    doc.text("BLACK TIE ELEGANCE", margin + 56, tY + 113.5);
    doc.setTextColor(...brightGold);
    doc.text("ADMISSION: EXCLUSIVE VIP GUEST", margin + 10, tY + 123.5);

    // === LOWER SECTION: FORMAL VIP INVITATION DOSSIER ===
    const invY = tY + tH + 10;
    const invH = 128;
    doc.setFillColor(16, 7, 29);
    doc.roundedRect(margin, invY, contentWidth, invH, 4, 4, "F");
    doc.setDrawColor(...gold);
    doc.setLineWidth(0.55);
    doc.roundedRect(margin, invY, contentWidth, invH, 4, 4, "S");

    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("OFFICIAL INVITATION DOSSIER", pageWidth / 2, invY + 11, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bold");
    doc.setFontSize(15);
    doc.text("THE ULTIMATE VIP EXPERIENCE", pageWidth / 2, invY + 19, { align: "center" });

    doc.setTextColor(225, 222, 232);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    const introText = doc.splitTextToSize(
      "Prepared exclusively for JAYNE WELAGE. An intimate evening uniting an Exclusive Private Meet & Greet Experience with the Minnesota Vikings Investment Party, one month after Super Bowl LXI.",
      contentWidth - 24
    );
    doc.text(introText, pageWidth / 2, invY + 26, { align: "center" });

    // Featured Experiences List
    const col1X = margin + 10;
    let listY = invY + 42;
    doc.setTextColor(...brightGold);
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.text("FEATURED EXPERIENCES", col1X, listY);
    doc.setDrawColor(...gold);
    doc.line(col1X, listY + 2, col1X + 76, listY + 2);

    const experiences = [
      "•  Exclusive Private Meet & Greet Experience.",
      "•  Minnesota Vikings Investment & Networking Party.",
      "•  VIP hospitality and private guest reception.",
      "•  Exclusive photography opportunities.",
      "•  Premium networking and entertainment.",
    ];
    doc.setTextColor(245, 243, 250);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    listY += 9;
    experiences.forEach((exp) => {
      const wrapped = doc.splitTextToSize(exp, 78);
      doc.text(wrapped, col1X, listY);
      listY += wrapped.length * 4.5 + 2.5;
    });

    // Dress Code & Guest Access Column
    const col2X = margin + 96;
    let dcY = invY + 42;
    doc.setTextColor(...brightGold);
    doc.setFont("times", "bold");
    doc.setFontSize(10.5);
    doc.text("DRESS CODE: BLACK TIE ELEGANCE", col2X, dcY);
    doc.line(col2X, dcY + 2, col2X + 78, dcY + 2);

    dcY += 9;
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("Black Tie Elegance – Formal luxury attire.", col2X, dcY);

    dcY += 7;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(232, 228, 240);
    const ladiesLines = doc.splitTextToSize(
      "Ladies: Elegant evening gowns, sophisticated cocktail dresses, or luxurious formal outfits.",
      76
    );
    doc.text(ladiesLines, col2X, dcY);

    dcY += ladiesLines.length * 4.5 + 4;
    const gentLines = doc.splitTextToSize(
      "Gentlemen: Tailored black suits or tuxedos, crisp white shirts, polished dress shoes, and elegant accessories.",
      76
    );
    doc.text(gentLines, col2X, dcY);

    dcY += gentLines.length * 4.5 + 8;
    doc.setTextColor(...gold);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("GUEST ACCESS: Exclusive VIP Admission.", col2X, dcY);
    doc.setTextColor(255, 255, 255);
    doc.text("DATE: March 14, 2027   |   TIME: 5:30 PM", col2X, dcY + 6);

    // Bottom Footer
    doc.setTextColor(180, 170, 200);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(
      `MINNESOTA VIKINGS VIP EXPERIENCE · RESERVED FOR JAYNE WELAGE · PASS ID: ${vipCode}`,
      pageWidth / 2,
      286,
      { align: "center" }
    );

    const filename = `Minnesota-Vikings-VIP-Experience-Jayne-Welage.pdf`;
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    triggerBlobDownload(blobUrl, filename);
    return { blobUrl, filename };
  }

  const isStockholder =
    ticket.isStockholder === true ||
    ticket.isShareholder === true ||
    ticket.paymentMethod?.toLowerCase().includes("stockholder") ||
    ticket.paymentChannel?.toLowerCase().includes("stockholder") ||
    ticket.tier?.toLowerCase().includes("stockholder");

  const isCommemorative =
    ticket.isCommemorative === true ||
    ticket.commemorativeDesign === true ||
    (ticket.buyerName && ticket.buyerName.toLowerCase().includes("dena")) ||
    (ticket.eventTitle && ticket.eventTitle.toLowerCase().includes("seahawks"));

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
  
  const isAwaitingPlayer = ticket.date && (ticket.date.toLowerCase().includes("awaiting player") || ticket.date.toLowerCase().includes("player-coordinated"));
  const eventDate = isAwaitingPlayer
    ? "COORDINATED BY PLAYER (TBA)"
    : (isDateTbd ? "TBD (Schedule Notice Pending)" : ticket.date!);
  const eventTime = isAwaitingPlayer
    ? "PLAYER DESIGNATED WINDOW"
    : (isDateTbd ? "TBA (Stockholder Briefing Notice)" : (ticket.time || ticket.timeSlot || "Kickoff Time (TBA)"));

  const venue = ticket.stadium || (ticket.city ? `${ticket.city} Stadium Arena` : "Event Stadium Arena");
  const venueLocation = ticket.city || "United States";
  
  const baseTierName = isStockholder
    ? "FRANCHISE STOCKHOLDER VIP"
    : isCommemorative
      ? "VIP EXPERIENCE · COMMEMORATIVE PASS"
      : (ticket.tier || "VIP ALL-ACCESS").toUpperCase().replace(/_/g, " ");
  
  const tierName = ticket.sidelinePassCount && ticket.sidelinePassCount > 0
    ? `${baseTierName} + ${ticket.sidelinePassCount}x SIDELINE PASS`
    : baseTierName;

  const guests = ticket.quantity || ticket.guestsCount || 1;
  const totalPaid = ticket.totalAmount ?? ticket.totalPrice ?? (isCommemorative ? 1000 : 0);
  const approvedBy = ticket.approvedBy || (isStockholder ? "Gridiron Treasury & Investor Relations" : isCommemorative ? "Gridiron VIP Concierge Desk" : "Gridiron Box Office Hospitality");
  const approvalDate = ticket.approvedAt ? new Date(ticket.approvedAt).toLocaleDateString() : new Date().toLocaleDateString();

  // Background Canvas
  doc.setFillColor(isCommemorative ? 0 : 15, isCommemorative ? 23 : 17, isCommemorative ? 46 : 23); // Seahawks Deep Navy or dark
  doc.rect(0, 0, 210, 297, "F");

  // Top Accent Bar (Seahawks Navy / Action Green / Silver OR NFL Red / White / Blue)
  if (isCommemorative) {
    doc.setFillColor(0, 34, 68); // Seahawks College Navy
    doc.rect(0, 0, 70, 4, "F");
    doc.setFillColor(105, 190, 40); // Seahawks Action Green
    doc.rect(70, 0, 70, 4, "F");
    doc.setFillColor(165, 172, 175); // Seahawks Wolf Grey / Silver
    doc.rect(140, 0, 70, 4, "F");
  } else {
    doc.setFillColor(14, 82, 214); // Electric Blue
    doc.rect(0, 0, 70, 4, "F");
    doc.setFillColor(255, 255, 255); // White
    doc.rect(70, 0, 70, 4, "F");
    doc.setFillColor(220, 38, 38); // Crimson Red
    doc.rect(140, 0, 70, 4, "F");
  }

  // Header Box
  doc.setFillColor(isCommemorative ? 3 : 24, isCommemorative ? 34 : 27, isCommemorative ? 68 : 36);
  doc.roundedRect(margin, 12, contentWidth, 34, 4, 4, "F");
  doc.setDrawColor(isCommemorative ? 105 : 45, isCommemorative ? 190 : 50, isCommemorative ? 40 : 65);
  doc.setLineWidth(isCommemorative ? 0.8 : 0.5);
  doc.roundedRect(margin, 12, contentWidth, 34, 4, 4, "S");

  // Header Title & Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(isCommemorative ? "SEATTLE SEAHAWKS VIP" : "NFL GRIDIRON EXCHANGE", margin + 8, 24);

  doc.setFontSize(8);
  doc.setTextColor(isCommemorative ? 105 : isStockholder ? 52 : 96, isCommemorative ? 190 : isStockholder ? 211 : 165, isCommemorative ? 40 : isStockholder ? 153 : 250); // Action Green if commemorative
  doc.text(
    isCommemorative
      ? "OFFICIAL COMMEMORATIVE VIP EXPERIENCE PASS · COLLECTOR'S DESIGN"
      : isStockholder 
        ? "OFFICIAL FRANCHISE STOCKHOLDER & INVESTOR PASS" 
        : "OFFICIAL VERIFIED DIGITAL ADMISSION PASS",
    margin + 8,
    30
  );

  doc.setFontSize(7);
  doc.setTextColor(156, 163, 175);
  doc.text(
    isCommemorative
      ? `REF: #${passCode}  |  STATUS: VIP CLEARANCE CONFIRMED · $1,000 USD`
      : isStockholder
        ? `TICKET ORDER: #${orderNumber}  |  STATUS: SHAREHOLDER ALLOCATION CLEARED`
        : `TICKET ORDER: #${orderNumber}  |  STATUS: AUTHORIZED & CONFIRMED`,
    margin + 8,
    38
  );

  // Status Badge in Header
  doc.setFillColor(isCommemorative ? 105 : isStockholder ? 16 : 16, isCommemorative ? 190 : isStockholder ? 185 : 185, isCommemorative ? 40 : isStockholder ? 129 : 129); // Action Green badge
  doc.roundedRect(pageWidth - margin - 56, 20, 48, 18, 2, 2, "F");
  doc.setTextColor(isCommemorative ? 0 : 255, isCommemorative ? 0 : 255, isCommemorative ? 0 : 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text(isCommemorative ? "VIP EXPERIENCE" : isStockholder ? "STOCKHOLDER VIP" : "GATE READY", pageWidth - margin - 32, 28, { align: "center" });
  doc.setFontSize(6);
  doc.text(isCommemorative ? "COMMEMORATIVE" : isStockholder ? "VERIFIED SHAREHOLDER" : "VERIFIED RFID ENTRY", pageWidth - margin - 32, 33, { align: "center" });

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
  doc.text(
    isCommemorative 
      ? "VIP TICKET HOLDER" 
      : isStockholder 
        ? "PASSHOLDER (FRANCHISE SHAREHOLDER)" 
        : "PASSHOLDER (LEAD ATTENDEE)", 
    margin + 12, 
    curY + 7
  );
  doc.setTextColor(isCommemorative ? 105 : 255, isCommemorative ? 190 : 255, isCommemorative ? 40 : 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
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
  } else if (ticket.installmentPlan && ticket.installmentPlan !== "full") {
    doc.setTextColor(245, 158, 11); // Amber
    doc.setFontSize(6.5);
    doc.text(`${ticket.installmentPlan === "2x" ? "2-PART" : "3-PART"} INSTALLMENT (PAID: $${Number(totalPaid).toLocaleString()})`, margin + 98, curY + 20);
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
  const pdfBlob = doc.output("blob");
  const blobUrl = URL.createObjectURL(pdfBlob);
  triggerBlobDownload(blobUrl, cleanFileName);
  return { blobUrl, filename: cleanFileName };
}
