import QRCode from "qrcode";

export type JayneVipExportMode = "ticket" | "invitation" | "suite";

export interface GeneratedFileResult {
  blobUrl: string;
  dataUrl: string;
  filename: string;
}

const FEATURED_EXPERIENCES = [
  "Exclusive Private Meet & Greet Experience.",
  "Minnesota Vikings Investment & Networking Party.",
  "VIP hospitality and private guest reception.",
  "Exclusive photography opportunities.",
  "Premium networking and entertainment."
];

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawCornerOrnament(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number
) {
  ctx.save();
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y + dy * 38);
  ctx.lineTo(x, y);
  ctx.lineTo(x + dx * 38, y);
  ctx.stroke();

  ctx.strokeStyle = "rgba(243, 217, 125, 0.55)";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(x + dx * 10, y + dy * 28);
  ctx.lineTo(x + dx * 10, y + dy * 10);
  ctx.lineTo(x + dx * 28, y + dy * 10);
  ctx.stroke();

  ctx.fillStyle = "#F3D97D";
  ctx.beginPath();
  ctx.arc(x + dx * 10, y + dy * 10, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  align: CanvasTextAlign = "left"
): number {
  ctx.textAlign = align;
  const words = text.split(/\s+/);
  let line = "";
  let curY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line ? `${line} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = words[i];
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, curY);
    curY += lineHeight;
  }
  return curY;
}

function drawLuxuryTicketBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  passCode: string,
  qrImg: HTMLImageElement | null
) {
  // Card background gradient (Vikings purple -> deep plum -> obsidian)
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.clip();

  const bgGrad = ctx.createRadialGradient(x + w * 0.42, y + h * 0.2, 40, x + w * 0.45, y + h * 0.45, w * 0.72);
  bgGrad.addColorStop(0, "#4F2683");
  bgGrad.addColorStop(0.55, "#1E0B38");
  bgGrad.addColorStop(1, "#07050A");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(x, y, w, h);

  // Subtle architectural Minneapolis stadium skyline silhouette
  ctx.strokeStyle = "rgba(212, 175, 55, 0.32)";
  ctx.lineWidth = 2;
  const sMid = x + w * 0.37;
  ctx.beginPath();
  ctx.moveTo(x + 80, y + 360);
  ctx.lineTo(x + 250, y + 230);
  ctx.lineTo(x + 480, y + 160);
  ctx.lineTo(sMid, y + 95);
  ctx.lineTo(sMid + 260, y + 165);
  ctx.lineTo(sMid + 490, y + 230);
  ctx.lineTo(sMid + 650, y + 360);
  ctx.stroke();

  ctx.strokeStyle = "rgba(212, 175, 55, 0.18)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(x + 250, y + 230);
  ctx.lineTo(sMid, y + 148);
  ctx.lineTo(sMid + 490, y + 230);
  ctx.moveTo(x + 170, y + 340);
  ctx.quadraticCurveTo(sMid, y + 290, sMid + 570, y + 340);
  ctx.stroke();

  // Stub background
  const stubX = x + w * 0.73;
  const stubGrad = ctx.createLinearGradient(stubX, y, stubX, y + h);
  stubGrad.addColorStop(0, "rgba(16, 7, 29, 0.94)");
  stubGrad.addColorStop(1, "rgba(7, 5, 10, 0.98)");
  ctx.fillStyle = stubGrad;
  ctx.fillRect(stubX, y, x + w - stubX, h);
  ctx.restore();

  // Outer gold frame
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 3;
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.stroke();

  // Inner inset frame
  const inset = 22;
  ctx.strokeStyle = "rgba(212, 175, 55, 0.48)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 20);
  ctx.stroke();

  drawCornerOrnament(ctx, x + inset + 12, y + inset + 12, 1, 1);
  drawCornerOrnament(ctx, x + w - inset - 12, y + inset + 12, -1, 1);
  drawCornerOrnament(ctx, x + inset + 12, y + h - inset - 12, 1, -1);
  drawCornerOrnament(ctx, x + w - inset - 12, y + h - inset - 12, -1, -1);

  // Dashed perforation line + circular notches between body & stub
  ctx.save();
  ctx.setLineDash([10, 10]);
  ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(stubX, y + inset + 14);
  ctx.lineTo(stubX, y + h - inset - 14);
  ctx.stroke();
  ctx.restore();

  // Perforation semi-circle cutouts
  for (const notchY of [y + inset, y + h - inset]) {
    ctx.fillStyle = "#07050A";
    ctx.strokeStyle = "rgba(212, 175, 55, 0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(stubX, notchY, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Main Ticket Content Area
  const bodyCenter = x + (stubX - x) / 2;

  // Top Header
  ctx.textAlign = "center";
  ctx.fillStyle = "#F3D97D";
  ctx.font = "600 18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("THE ULTIMATE VIP EXPERIENCE  ·  ONE MONTH AFTER SUPER BOWL LXI", bodyCenter, y + 92);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 44px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("MINNESOTA VIKINGS VIP EXPERIENCE", bodyCenter, y + 146);

  // Divider line
  const divGrad = ctx.createLinearGradient(x + 120, 0, stubX - 90, 0);
  divGrad.addColorStop(0, "rgba(212, 175, 55, 0)");
  divGrad.addColorStop(0.5, "rgba(212, 175, 55, 0.75)");
  divGrad.addColorStop(1, "rgba(212, 175, 55, 0)");
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 90, y + 174);
  ctx.lineTo(stubX - 70, y + 174);
  ctx.stroke();

  // Football Lace Crest
  ctx.save();
  ctx.translate(bodyCenter, y + 225);
  ctx.fillStyle = "#1A0830";
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 56, 26, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#F3D97D";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-24, 0);
  ctx.lineTo(24, 0);
  for (let lx = -16; lx <= 16; lx += 8) {
    ctx.moveTo(lx, -8);
    ctx.lineTo(lx, 8);
  }
  ctx.stroke();
  ctx.restore();

  // Center Prominent Display
  ctx.fillStyle = "rgba(212, 175, 55, 0.92)";
  ctx.font = "600 17px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("DISTINGUISHED VIP GUEST OF HONOR", bodyCenter, y + 292);

  const nameGrad = ctx.createLinearGradient(bodyCenter - 260, 0, bodyCenter + 260, 0);
  nameGrad.addColorStop(0, "#FFF3B0");
  nameGrad.addColorStop(0.5, "#F6E27A");
  nameGrad.addColorStop(1, "#D4AF37");
  ctx.fillStyle = nameGrad;
  ctx.font = "700 84px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("JAYNE WELAGE", bodyCenter, y + 372);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 28px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("PRIVATE MEET & GREET", bodyCenter, y + 432);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "italic 600 34px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("+", bodyCenter, y + 472);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 28px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("INVESTMENT & NETWORKING PARTY", bodyCenter, y + 516);

  // Bottom Details Strip
  ctx.strokeStyle = "rgba(212, 175, 55, 0.45)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 70, y + 594);
  ctx.lineTo(stubX - 50, y + 594);
  ctx.stroke();

  const cols = [
    { label: "EVENT DATE", val: "MARCH 14, 2027", x: x + 76, color: "#FFFFFF" },
    { label: "EVENT TIME", val: "5:30 PM", x: x + 325, color: "#FFFFFF" },
    { label: "ATTIRE", val: "DRESS CODE: BLACK TIE ELEGANCE", x: x + 490, color: "#FFFFFF" },
    { label: "CLEARANCE", val: "ADMISSION: EXCLUSIVE VIP GUEST", x: x + 76, yOffset: 62, color: "#F6E27A" }
  ];

  ctx.textAlign = "left";
  cols.forEach((col) => {
    const baseY = y + 634 + (col.yOffset || 0);
    ctx.fillStyle = "#D4AF37";
    ctx.font = "700 14px 'Plus Jakarta Sans', Arial, sans-serif";
    ctx.fillText(col.label, col.x, baseY);

    ctx.fillStyle = col.color;
    ctx.font = "700 22px 'Plus Jakarta Sans', Arial, sans-serif";
    ctx.fillText(col.val, col.x, baseY + 29);
  });

  // Right QR Stub
  const stubCenter = stubX + (x + w - inset - stubX) / 2;
  ctx.textAlign = "center";

  // Top Seal Circle
  ctx.fillStyle = "rgba(79, 38, 131, 0.6)";
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(stubCenter, y + 105, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 20px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("VIP", stubCenter, y + 112);

  ctx.fillStyle = "#D4AF37";
  ctx.font = "700 15px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("OFFICIAL CREDENTIAL", stubCenter, y + 168);

  // Gold-framed QR Card
  const qrFrameSize = 266;
  const qrFrameX = stubCenter - qrFrameSize / 2;
  const qrFrameY = y + 206;
  ctx.fillStyle = "#F7F4EC";
  ctx.strokeStyle = "#D4AF37";
  ctx.lineWidth = 4;
  drawRoundedRect(ctx, qrFrameX, qrFrameY, qrFrameSize, qrFrameSize + 54, 18);
  ctx.fill();
  ctx.stroke();

  if (qrImg) {
    ctx.drawImage(qrImg, qrFrameX + 22, qrFrameY + 20, qrFrameSize - 44, qrFrameSize - 44);
  }

  ctx.strokeStyle = "rgba(26, 8, 48, 0.2)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(qrFrameX + 20, qrFrameY + qrFrameSize - 8);
  ctx.lineTo(qrFrameX + qrFrameSize - 20, qrFrameY + qrFrameSize - 8);
  ctx.stroke();

  ctx.fillStyle = "#1A0830";
  ctx.font = "800 18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("VIP EVENT ACCESS", stubCenter, qrFrameY + qrFrameSize + 27);

  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 14px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("INVITATION SERIAL", stubCenter, y + 585);

  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 22px 'JetBrains Mono', monospace";
  ctx.fillText(passCode, stubCenter, y + 618);

  ctx.fillStyle = "#A1A1AA";
  ctx.font = "600 14px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("MINNEAPOLIS · PRIVATE SUITE", stubCenter, y + 662);
}

function drawInvitationDossierBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number
) {
  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.clip();

  const bg = ctx.createRadialGradient(x + w * 0.5, y + 40, 20, x + w * 0.5, y + h * 0.5, w * 0.7);
  bg.addColorStop(0, "rgba(79, 38, 131, 0.45)");
  bg.addColorStop(0.55, "#110820");
  bg.addColorStop(1, "#07050A");
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.strokeStyle = "rgba(212, 175, 55, 0.65)";
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, x, y, w, h, 28);
  ctx.stroke();

  const inset = 22;
  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.lineWidth = 1.4;
  drawRoundedRect(ctx, x + inset, y + inset, w - inset * 2, h - inset * 2, 20);
  ctx.stroke();

  drawCornerOrnament(ctx, x + inset + 12, y + inset + 12, 1, 1);
  drawCornerOrnament(ctx, x + w - inset - 12, y + inset + 12, -1, 1);
  drawCornerOrnament(ctx, x + inset + 12, y + h - inset - 12, 1, -1);
  drawCornerOrnament(ctx, x + w - inset - 12, y + h - inset - 12, -1, -1);

  const centerX = x + w / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = "#D4AF37";
  ctx.font = "700 17px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("PRIVATE INVITATION DOSSIER  ·  BY PERSONAL APPOINTMENT", centerX, y + 88);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 50px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("THE ULTIMATE VIP EXPERIENCE", centerX, y + 148);

  ctx.fillStyle = "#E4E4E7";
  ctx.font = "400 22px 'Plus Jakarta Sans', Arial, sans-serif";
  drawWrappedText(
    ctx,
    "In honor of distinguished guest JAYNE WELAGE, you are cordially invited to an exclusive private evening combining a Private Meet & Greet Experience with the Minnesota Vikings Investment Party, hosted one month following Super Bowl LXI.",
    centerX,
    y + 196,
    w - 220,
    33,
    "center"
  );

  // Horizontal divider
  ctx.strokeStyle = "rgba(212, 175, 55, 0.35)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 80, y + 292);
  ctx.lineTo(x + w - 80, y + 292);
  ctx.stroke();

  // Left Column: Featured Experiences
  const col1X = x + 84;
  ctx.textAlign = "left";
  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 28px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("FEATURED EXPERIENCES", col1X, y + 350);

  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.beginPath();
  ctx.moveTo(col1X, y + 368);
  ctx.lineTo(x + w / 2 - 48, y + 368);
  ctx.stroke();

  let expY = y + 414;
  ctx.font = "500 22px 'Plus Jakarta Sans', Arial, sans-serif";
  FEATURED_EXPERIENCES.forEach((exp) => {
    ctx.save();
    ctx.translate(col1X + 8, expY - 7);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = "#D4AF37";
    ctx.fillRect(-5, -5, 10, 10);
    ctx.restore();

    ctx.fillStyle = "#F4F4F5";
    ctx.fillText(exp, col1X + 34, expY);
    expY += 48;
  });

  // Bottom date & time summary in col1
  ctx.strokeStyle = "rgba(212, 175, 55, 0.28)";
  ctx.beginPath();
  ctx.moveTo(col1X, y + 668);
  ctx.lineTo(x + w / 2 - 48, y + 668);
  ctx.stroke();

  ctx.fillStyle = "#D4AF37";
  ctx.font = "700 15px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("DATE", col1X, y + 704);
  ctx.fillText("TIME", col1X + 270, y + 704);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 24px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("March 14, 2027", col1X, y + 738);
  ctx.fillText("5:30 PM", col1X + 270, y + 738);

  // Vertical column separator
  ctx.strokeStyle = "rgba(212, 175, 55, 0.25)";
  ctx.beginPath();
  ctx.moveTo(x + w / 2, y + 322);
  ctx.lineTo(x + w / 2, y + h - 55);
  ctx.stroke();

  // Right Column: Dress Code & Guest Access
  const col2X = x + w / 2 + 48;
  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 28px 'Cormorant Garamond', Georgia, serif";
  ctx.fillText("DRESS CODE", col2X, y + 350);

  ctx.strokeStyle = "rgba(212, 175, 55, 0.4)";
  ctx.beginPath();
  ctx.moveTo(col2X, y + 368);
  ctx.lineTo(x + w - 84, y + 368);
  ctx.stroke();

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 22px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("Black Tie Elegance – Formal luxury attire.", col2X, y + 414);

  // Attire sub-card
  ctx.fillStyle = "rgba(0, 0, 0, 0.48)";
  ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
  ctx.lineWidth = 1.5;
  drawRoundedRect(ctx, col2X, y + 440, w / 2 - 132, 200, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("LADIES:", col2X + 24, y + 482);
  ctx.fillStyle = "#E4E4E7";
  ctx.font = "400 20px 'Plus Jakarta Sans', Arial, sans-serif";
  drawWrappedText(
    ctx,
    "Elegant evening gowns, sophisticated cocktail dresses, or luxurious formal outfits.",
    col2X + 114,
    y + 482,
    w / 2 - 268,
    30,
    "left"
  );

  ctx.fillStyle = "#F6E27A";
  ctx.font = "700 18px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("GENTLEMEN:", col2X + 24, y + 566);
  ctx.fillStyle = "#E4E4E7";
  ctx.font = "400 20px 'Plus Jakarta Sans', Arial, sans-serif";
  drawWrappedText(
    ctx,
    "Tailored black suits or tuxedos, crisp white shirts, polished dress shoes, and elegant accessories.",
    col2X + 160,
    y + 566,
    w / 2 - 314,
    30,
    "left"
  );

  ctx.fillStyle = "#D4AF37";
  ctx.font = "700 16px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("GUEST ACCESS", col2X, y + 704);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 24px 'Plus Jakarta Sans', Arial, sans-serif";
  ctx.fillText("Exclusive VIP Admission.", col2X, y + 738);
}

export async function renderJayneWelagePng(
  mode: JayneVipExportMode,
  passCode: string,
  qrValue: string
): Promise<GeneratedFileResult> {
  // Ensure fonts have had a chance to load before drawing onto canvas
  try {
    if (typeof document !== "undefined" && document.fonts?.ready) {
      await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 800))]);
    }
  } catch {}

  const width = 1800;
  const padding = 56;
  const ticketH = 740;
  const invH = 800;
  const gap = 48;

  const height =
    mode === "ticket"
      ? padding * 2 + ticketH
      : mode === "invitation"
      ? padding * 2 + invH
      : padding * 2 + ticketH + gap + invH;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not initialize high-resolution canvas context.");
  }

  // Deep Obsidian outer canvas
  ctx.fillStyle = "#07050A";
  ctx.fillRect(0, 0, width, height);

  // Load crisp QR image
  let qrImg: HTMLImageElement | null = null;
  try {
    const qrUrl = await QRCode.toDataURL(qrValue, {
      margin: 1,
      width: 520,
      errorCorrectionLevel: "H",
      color: {
        dark: "#1A0830",
        light: "#F7F4EC"
      }
    });
    qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrUrl;
    });
  } catch (err) {
    console.warn("QR canvas fallback skipped:", err);
  }

  let curY = padding;
  if (mode === "ticket" || mode === "suite") {
    drawLuxuryTicketBlock(ctx, padding, curY, width - padding * 2, ticketH, passCode, qrImg);
    curY += ticketH + gap;
  }
  if (mode === "invitation" || mode === "suite") {
    drawInvitationDossierBlock(ctx, padding, curY, width - padding * 2, invH);
  }

  const filename =
    mode === "ticket"
      ? "Minnesota-Vikings-VIP-Ticket-Jayne-Welage.png"
      : mode === "invitation"
      ? "Minnesota-Vikings-VIP-Invitation-Jayne-Welage.png"
      : "Minnesota-Vikings-Ultimate-VIP-Experience-Jayne-Welage.png";

  const blob: Blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => {
        if (b) resolve(b);
        else reject(new Error("Canvas PNG encoding failed."));
      },
      "image/png",
      1.0
    );
  });

  const blobUrl = URL.createObjectURL(blob);
  const dataUrl = canvas.toDataURL("image/png", 1.0);

  triggerBlobDownload(blobUrl, filename);

  return { blobUrl, dataUrl, filename };
}

export function triggerBlobDownload(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener noreferrer";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 500);
}
