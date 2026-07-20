import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";
import nodemailer from "nodemailer";

dotenv.config();

// Load firebase-applet-config.json safely and initialize Firebase Admin SDK
let db: any = null;
let adminApp: any = null;
try {
  const firebaseConfig = JSON.parse(fs.readFileSync("./firebase-applet-config.json", "utf-8"));
  adminApp = initializeApp({
    projectId: firebaseConfig.projectId,
  });
  db = getFirestore(adminApp, firebaseConfig.firestoreDatabaseId || "(default)");
  console.log("Firebase Admin SDK initialized successfully on server.ts");
} catch (err) {
  console.error("Failed to initialize Firebase Admin SDK on server.ts:", err);
}

// Send Webhook/Notification function
async function sendNotification(inquiry: any) {
  try {
    let settings: any = null;
    
    // Check local server configuration disk first
    if (fs.existsSync("./notifications-config.json")) {
      try {
        settings = JSON.parse(fs.readFileSync("./notifications-config.json", "utf-8"));
      } catch (err) {
        console.error("Failed to parse notifications-config.json:", err);
      }
    }

    // Secondary backup query to Firestore, wrapped in a safe catch
    if (!settings && db) {
      try {
        const docRef = db.collection("admin_settings").doc("notifications");
        const docSnap = await docRef.get();
        if (docSnap.exists) {
          settings = docSnap.data();
        }
      } catch (dbErr) {
        console.warn("Could not load notifications from Firestore (expected in GCP Run container environment):", dbErr);
      }
    }

    if (!settings) {
      console.warn("No notifications configuration available to process this request.");
      return;
    }
    
    const { discord, telegram, slack, email } = settings;
    const title = inquiry.isTest ? "🚨 TEST: Concierge Inquiry Notification" : "🚨 New Concierge Inquiry Received!";
    const details = `
Ticket ID: **${inquiry.requestId}**
Name: **${inquiry.name}**
Email: **${inquiry.email || 'N/A'}**
Contact: **${inquiry.contact || 'N/A'}**
Message: "${inquiry.message}"
`;

    // 1. Send Discord Webhook
    if (discord?.enabled && discord.url) {
      try {
        await fetch(discord.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: `**${title}**\n${details}`
          })
        });
        console.log("Discord notification sent successfully");
      } catch (err) {
        console.error("Error sending Discord notification:", err);
      }
    }

    // 2. Send Slack Webhook
    if (slack?.enabled && slack.url) {
      try {
        await fetch(slack.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: `*${title}*\n${details}`
          })
        });
        console.log("Slack notification sent successfully");
      } catch (err) {
        console.error("Error sending Slack notification:", err);
      }
    }

    // 3. Send Telegram Message
    if (telegram?.enabled && telegram.botToken && telegram.chatId) {
      try {
        await fetch(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: telegram.chatId,
            text: `*${title}*\n${details}`,
            parse_mode: "Markdown"
          })
        });
        console.log("Telegram notification sent successfully");
      } catch (err) {
        console.error("Error sending Telegram notification:", err);
      }
    }

    // 4. Send Email via SMTP (Zoho, Gmail, etc.)
    if (email?.enabled && email.smtpHost && email.smtpUser && email.smtpPass && email.toEmail) {
      try {
        const cleanedHost = String(email.smtpHost).trim();
        const cleanedPortStr = String(email.smtpPort).trim();
        const cleanedUser = String(email.smtpUser).trim();
        const cleanedPass = String(email.smtpPass).trim();
        const cleanedTo = String(email.toEmail).trim();
        const cleanedFrom = email.fromEmail ? String(email.fromEmail).trim() : `\"Gridiron Exchange Admin\" <${cleanedUser}>`;

        const transporter = nodemailer.createTransport({
          host: cleanedHost,
          port: parseInt(cleanedPortStr) || 587,
          secure: email.smtpSecure || false, // true for port 465, false for 587
          auth: {
            user: cleanedUser,
            pass: cleanedPass,
          },
        });

        const subject = inquiry.isTest ? "[TEST] Gridiron Exchange Notification Alert" : `New Concierge Ticket Received: ${inquiry.name}`;
        
        const textContent = `
${title}

Ticket ID: ${inquiry.requestId}
Name: ${inquiry.name}
Email Address: ${inquiry.email || 'N/A'}
Preferred Contact: ${inquiry.contact || 'N/A'}

Inquiry Details:
"${inquiry.message}"

Please review this in the control desk:
https://ais-pre-fzmmrb2i7l3evzvs4xbafg-53620454143.europe-west2.run.app
        `;

        const htmlContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; border: 1px solid rgba(255,255,255,0.08); border-radius: 24px; background-color: #0c0a09; color: #f4f4f5; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 10px; font-weight: 900; letter-spacing: 0.15em; color: #2563eb; text-transform: uppercase;">Gridiron Exchange Concierge</span>
              <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 8px 0 0 0; text-transform: uppercase; font-style: italic; letter-spacing: -0.025em;">${title}</h2>
            </div>
            
            <div style="background-color: #1c1917; border: 1px solid rgba(255,255,255,0.05); border-radius: 16px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 6px 0; font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase; width: 35%;">Ticket ID</td>
                  <td style="padding: 6px 0; font-size: 13px; font-family: monospace; color: #3b82f6;">${inquiry.requestId}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase;">Client Name</td>
                  <td style="padding: 6px 0; font-size: 13px; font-weight: 700; color: #ffffff;">${inquiry.name}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase;">Email</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #f4f4f5;">${inquiry.email || 'N/A'}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 11px; font-weight: 800; color: #a1a1aa; text-transform: uppercase;">Contact Method</td>
                  <td style="padding: 6px 0; font-size: 13px; color: #60a5fa; text-decoration: underline;">${inquiry.contact || 'N/A'}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #09090b; border: 1px solid rgba(255,255,255,0.03); border-radius: 16px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #2563eb;">
              <span style="font-size: 10px; font-weight: 900; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; display: block; margin-bottom: 8px;">Original Message</span>
              <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #d4d4d8; white-space: pre-wrap;">${inquiry.message}</p>
            </div>

            <div style="text-align: center; margin-top: 32px; border-t: 1px solid rgba(255,255,255,0.05); padding-top: 24px;">
              <a href="https://ais-pre-fzmmrb2i7l3evzvs4xbafg-53620454143.europe-west2.run.app" style="display: inline-block; background-color: #ffffff; color: #000000; font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; padding: 12px 32px; border-radius: 12px; text-decoration: none; transition: background 0.2s;">Open Control Desk</a>
              <p style="font-size: 10px; color: #52525b; margin: 16px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em;">NFL Gridiron Exchange Automations</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: cleanedFrom,
          to: cleanedTo,
          subject: subject,
          text: textContent,
          html: htmlContent,
        });

        console.log("SMTP Email notification dispatched successfully!");
      } catch (err) {
        console.error("Error sending SMTP Email notification:", err);
      }
    }
  } catch (error) {
    console.error("Error processing sendNotification:", error);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Market Engine ---
const INITIAL_PRICES: Record<string, number> = {
  DAL: 130.00,
  LAR: 105.00,
  NYG: 101.00,
  NE: 90.00,
  SF: 86.00,
  PHI: 83.00,
  CHI: 82.00,
  NYJ: 81.00,
  LV: 77.00,
  WAS: 76.00,
  MIA: 75.00,
  HOU: 74.00,
  DEN: 68.00,
  SEA: 67.00,
  GB: 66.50,
  TB: 66.00,
  PIT: 65.00,
  CLE: 64.00,
  ATL: 63.50,
  TEN: 63.00,
  MIN: 62.50,
  KC: 62.00,
  BAL: 61.00,
  LAC: 60.00,
  BUF: 59.50,
  IND: 59.00,
  CAR: 57.00,
  JAX: 56.00,
  ARI: 55.00,
  DET: 54.00,
  NO: 53.00,
  CIN: 52.50,
};

const TICKER_SYMBOLS = Object.keys(INITIAL_PRICES);

let marketPrices: Record<string, number> = { ...INITIAL_PRICES };

function updateMarketPrices() {
  TICKER_SYMBOLS.forEach(symbol => {
    const volatility = 0.002; // 0.2% max move per tick
    const change = (Math.random() - 0.49) * (marketPrices[symbol] * volatility);
    marketPrices[symbol] = Math.max(1, marketPrices[symbol] + change);
  });
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  const PORT = 3000;

  app.use(express.json());

  // Custom CORS middleware for API endpoints inside sandboxed environments and previews
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    next();
  });

// API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/notify-inquiry", async (req, res) => {
    try {
      const { requestId, name, email, contact, message, isTest } = req.body;
      await sendNotification({ requestId, name, email, contact, message, isTest });
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error sending notification from route:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/save-settings", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid authorization header." });
      }
      
      const idToken = authHeader.split("Bearer ")[1];
      if (!adminApp) {
        return res.status(500).json({ error: "Firebase Admin SDK is not initialized." });
      }

      // Verify the ID token securely using Firebase Admin SDK
      const decodedToken = await getAuth(adminApp).verifyIdToken(idToken);
      if (decodedToken.email !== "alexwtchmn@gmail.com") {
        return res.status(403).json({ error: "Access denied. Only the administrator can modify settings." });
      }

      // Securely write settings payload to the server's disk
      const settings = req.body;
      fs.writeFileSync("./notifications-config.json", JSON.stringify(settings, null, 2), "utf-8");
      
      console.log("Admin notification settings updated successfully on server disk.");
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error saving notification settings:", err);
      res.status(500).json({ error: err.message });
    }
  });

  const TEAM_NAMES: Record<string, string> = {
    ARI: "Cardinals", ATL: "Falcons", BAL: "Ravens", BUF: "Bills",
    CAR: "Panthers", CHI: "Bears", CIN: "Bengals", CLE: "Browns",
    DAL: "Cowboys", DEN: "Broncos", DET: "Lions", GB: "Packers",
    HOU: "Texans", IND: "Colts", JAX: "Jaguars", KC: "Chiefs",
    LV: "Raiders", LAC: "Chargers", LAR: "Rams", MIA: "Dolphins",
    MIN: "Vikings", NE: "Patriots", NO: "Saints", NYG: "Giants",
    NYJ: "Jets", PHI: "Eagles", PIT: "Steelers", SF: "49ers",
    SEA: "Seahawks", TB: "Buccaneers", TEN: "Titans", WAS: "Commanders"
  };

  const TEAM_CITIES: Record<string, string> = {
    ARI: "Arizona", ATL: "Atlanta", BAL: "Baltimore", BUF: "Buffalo",
    CAR: "Carolina", CHI: "Chicago", CIN: "Cincinnati", CLE: "Cleveland",
    DAL: "Dallas", DEN: "Denver", DET: "Detroit", GB: "Green Bay",
    HOU: "Houston", IND: "Indianapolis", JAX: "Jacksonville", KC: "Kansas City",
    LV: "Las Vegas", LAC: "Los Angeles", LAR: "Los Angeles", MIA: "Miami",
    MIN: "Minnesota", NE: "New England", NO: "New Orleans", NYG: "New York",
    NYJ: "New York", PHI: "Philadelphia", PIT: "Pittsburgh", SF: "San Francisco",
    SEA: "Seattle", TB: "Tampa Bay", TEN: "Tennessee", WAS: "Washington"
  };

  const TEAM_STARS: Record<string, { player: string; number: string; jerseyName: string }> = {
    ARI: { player: "Kyler Murray", number: "1", jerseyName: "Kyler Murray Vapor Fuse Jersey" },
    ATL: { player: "Kirk Cousins", number: "18", jerseyName: "Kirk Cousins Alternate Jersey" },
    BAL: { player: "Lamar Jackson", number: "8", jerseyName: "Lamar Jackson Elite Jersey" },
    BUF: { player: "Josh Allen", number: "17", jerseyName: "Josh Allen Custom Vapor Jersey" },
    CAR: { player: "Bryce Young", number: "9", jerseyName: "Bryce Young Game Jersey" },
    CHI: { player: "Caleb Williams", number: "18", jerseyName: "Caleb Williams Limited Jersey" },
    CIN: { player: "Joe Burrow", number: "9", jerseyName: "Joe Burrow On-Field Jersey" },
    CLE: { player: "Myles Garrett", number: "95", jerseyName: "Myles Garrett Elite Jersey" },
    DAL: { player: "CeeDee Lamb", number: "88", jerseyName: "CeeDee Lamb Vapor Elite Jersey" },
    DEN: { player: "Bo Nix", number: "10", jerseyName: "Bo Nix Prime Edition Jersey" },
    DET: { player: "Amon-Ra St. Brown", number: "14", jerseyName: "Amon-Ra St. Brown Limited Jersey" },
    GB: { player: "Jordan Love", number: "10", jerseyName: "Jordan Love Custom Game Jersey" },
    HOU: { player: "C.J. Stroud", number: "7", jerseyName: "C.J. Stroud Color Rush Jersey" },
    IND: { player: "Anthony Richardson", number: "5", jerseyName: "Anthony Richardson Elite Jersey" },
    JAX: { player: "Trevor Lawrence", number: "16", jerseyName: "Trevor Lawrence Vapor Jersey" },
    KC: { player: "Patrick Mahomes", number: "15", jerseyName: "Patrick Mahomes Legend Jersey" },
    LV: { player: "Davante Adams", number: "17", jerseyName: "Davante Adams Limited Jersey" },
    LAC: { player: "Justin Herbert", number: "10", jerseyName: "Justin Herbert Powder Blue Jersey" },
    LAR: { player: "Puka Nacua", number: "17", jerseyName: "Puka Nacua Alternate Jersey" },
    MIA: { player: "Tyreek Hill", number: "10", jerseyName: "Tyreek Hill Aqua Edition Jersey" },
    MIN: { player: "Justin Jefferson", number: "18", jerseyName: "Justin Jefferson Game Jersey" },
    NE: { player: "Drake Maye", number: "10", jerseyName: "Drake Maye Classic Jersey" },
    NO: { player: "Chris Olave", number: "12", jerseyName: "Chris Olave Vapor Jersey" },
    NYG: { player: "Daniel Jones", number: "8", jerseyName: "Daniel Jones Royal Blue Jersey" },
    NYJ: { player: "Aaron Rodgers", number: "8", jerseyName: "Aaron Rodgers Spotlight Jersey" },
    PHI: { player: "Jalen Hurts", number: "1", jerseyName: "Jalen Hurts Midnight Green Jersey" },
    PIT: { player: "T.J. Watt", number: "90", jerseyName: "T.J. Watt Black & Gold Jersey" },
    SF: { player: "Christian McCaffrey", number: "23", jerseyName: "Christian McCaffrey Game Jersey" },
    SEA: { player: "DK Metcalf", number: "14", jerseyName: "DK Metcalf Action Green Jersey" },
    TB: { player: "Baker Mayfield", number: "6", jerseyName: "Baker Mayfield Pewter Jersey" },
    TEN: { player: "Will Levis", number: "8", jerseyName: "Will Levis Light Blue Jersey" },
    WAS: { player: "Jayden Daniels", number: "5", jerseyName: "Jayden Daniels Burgundy Jersey" }
  };

  app.get("/api/merchandise", (req, res) => {
    try {
      const teamId = (req.query.team as string) || "MIN";
      const search = (req.query.search as string) || "";
      const category = (req.query.category as string) || "all";

      const team = TEAM_NAMES[teamId] 
        ? { id: teamId, name: TEAM_NAMES[teamId], city: TEAM_CITIES[teamId] } 
        : { id: "MIN", name: "Vikings", city: "Minnesota" };
      
      const star = TEAM_STARS[team.id] || { player: "Justin Jefferson", number: "18", jerseyName: "Justin Jefferson Game Jersey" };

      const baseProducts = [
        {
          id: `m-${team.id}-jersey`,
          name: `${team.city} ${team.name} ${star.jerseyName}`,
          description: `Authentic Nike Vapor Elite jersey featuring premium stitched graphics for franchise star ${star.player} (#${star.number}). On-field specifications.`,
          basePrice: 175,
          category: "jerseys",
          discount: 10,
          image: "https://i.postimg.cc/LX9QjR0f/339feabb3b77fc4fd27637e3e0791cc9jersey.jpg",
          inStock: true,
          trending: true,
          rating: 4.9,
          reviewsCount: 142
        },
        {
          id: `m-${team.id}-hoodie`,
          name: `${team.city} ${team.name} Tech Fleece Sideline Hoodie`,
          description: `Official NFL Sideline technical performance wear. Engineered with Therma-FIT double-brushed premium comfort fabric.`,
          basePrice: 85,
          category: "hoodies",
          discount: 15,
          image: "https://i.postimg.cc/wxb4RC5N/5252ceda2d79871dfbdb18431d89a468hoodie.jpg",
          inStock: true,
          trending: false,
          rating: 4.7,
          reviewsCount: 88
        },
        {
          id: `m-${team.id}-helmet`,
          name: `${team.city} ${team.name} Authentic Riddell Speed Replica Helmet`,
          description: `Full-size Riddell replica helmet. Detailed internal padding, 4-point chinstrap, authentic team shell paint and decals. Great for office display.`,
          basePrice: 350,
          category: "helmets",
          discount: 0,
          image: "https://i.postimg.cc/bY6WHDPJ/535f637d8a827845da41c33e6f994795helmet.jpg",
          inStock: true,
          trending: false,
          rating: 4.8,
          reviewsCount: 31
        },
        {
          id: `m-${team.id}-hat`,
          name: `${team.city} ${team.name} Nike Sideline Club Adjustable Cap`,
          description: `Relaxed fit adjustable hat with premium raised embroidery of the official ${team.name} logo. High breathability mesh cells.`,
          basePrice: 35,
          category: "hats",
          discount: 5,
          image: "https://i.postimg.cc/g2h7WgZ2/1528e7dd107557d7b35d48f4a8564c99cap.jpg",
          inStock: true,
          trending: true,
          rating: 4.5,
          reviewsCount: 215
        },
        {
          id: `m-${team.id}-memorabilia`,
          name: `${star.player} Autographed Duke Official NFL Wilson Football`,
          description: `Certified authentic autographed official leather Wilson football signed personally by star athlete ${star.player}. Includes certificate.`,
          basePrice: 599,
          category: "memorabilia",
          discount: 0,
          image: "https://i.postimg.cc/0Qn34rJ3/d970707799e1f952db7ea1ea6ddf218bmemo.jpg",
          inStock: true,
          trending: true,
          rating: 5.0,
          reviewsCount: 12
        },
        {
          id: `m-${team.id}-limited`,
          name: `${team.city} ${team.name} Varsity Wool & Leather Heritage Jacket`,
          description: `Extremely limited historical release. Full grain premium leather sleeves, heavy melton wool, direct satin stitching design.`,
          basePrice: 450,
          category: "limited",
          discount: 20,
          image: "https://i.postimg.cc/dtfMv7SK/4bbf77eabd2406831269772d206b3186.jpg",
          inStock: true,
          trending: false,
          rating: 4.9,
          reviewsCount: 19
        }
      ];

      const currentPrice = marketPrices[team.id] || 100;
      const ratio = currentPrice / 100;

      const resolvedProducts = baseProducts.map(p => {
        const livePrice = Number((p.basePrice * ratio).toFixed(2));
        const finalPrice = p.discount > 0 ? Number((livePrice * (1 - p.discount / 100)).toFixed(2)) : livePrice;
        const searchStr = encodeURIComponent(`${team.city} ${team.name} ${p.category}`);
        const purchaseUrl = `https://www.nflshop.com/?query=${searchStr}`;

        return {
          ...p,
          price: finalPrice,
          originalPrice: livePrice,
          purchaseUrl
        };
      });

      let filtered = resolvedProducts;
      if (category && category !== "all") {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
      }

      res.json({ products: filtered });
    } catch (err: any) {
      console.error("API error in /api/merchandise:", err);
      res.status(500).json({ error: err.message, products: [] });
    }
  });

  app.get("/api/tickets", async (req, res) => {
    const apiKey = process.env.TICKETMASTER_API_KEY;
    const teamFilter = req.query.team as string;
    const stadiumFilter = req.query.stadium as string;
    const priceMin = req.query.priceMin ? parseFloat(req.query.priceMin as string) : 0;
    const priceMax = req.query.priceMax ? parseFloat(req.query.priceMax as string) : 10000;

    const fallbackGames = [
      {
        id: "tm-7",
        name: "Minnesota Vikings vs Green Bay Packers",
        homeTeam: "Vikings",
        awayTeam: "Packers",
        stadium: "U.S. Bank Stadium",
        city: "Minneapolis, MN",
        date: "2026-10-04",
        time: "13:00",
        cheapestPrice: 115,
        vipPrice: 800,
        url: "https://www.ticketmaster.com/minnesota-vikings-tickets/artist/805967",
        image: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=800",
        isResale: false
      },
      {
        id: "tm-1",
        name: "Dallas Cowboys vs Philadelphia Eagles",
        homeTeam: "Cowboys",
        awayTeam: "Eagles",
        stadium: "AT&T Stadium",
        city: "Arlington, TX",
        date: "2026-09-13",
        time: "16:25",
        cheapestPrice: 125,
        vipPrice: 850,
        url: "https://www.ticketmaster.com/dallas-cowboys-tickets/artist/805934",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
        isResale: false
      },
      {
        id: "tm-2",
        name: "Kansas City Chiefs vs Baltimore Ravens",
        homeTeam: "Chiefs",
        awayTeam: "Ravens",
        stadium: "GEHA Field at Arrowhead Stadium",
        city: "Kansas City, MO",
        date: "2026-09-10",
        time: "20:20",
        cheapestPrice: 165,
        vipPrice: 1200,
        url: "https://www.ticketmaster.com/kansas-city-chiefs-tickets/artist/805961",
        image: "https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=800",
        isResale: true
      },
      {
        id: "tm-3",
        name: "San Francisco 49ers vs Los Angeles Rams",
        homeTeam: "49ers",
        awayTeam: "Rams",
        stadium: "Levi's Stadium",
        city: "Santa Clara, CA",
        date: "2026-09-14",
        time: "17:15",
        cheapestPrice: 110,
        vipPrice: 750,
        url: "https://www.ticketmaster.com/san-francisco-49ers-tickets/artist/806018",
        image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=800",
        isResale: false
      },
      {
        id: "tm-4",
        name: "Green Bay Packers vs Chicago Bears",
        homeTeam: "Packers",
        awayTeam: "Bears",
        stadium: "Lambeau Field",
        city: "Green Bay, WI",
        date: "2026-09-20",
        time: "13:00",
        cheapestPrice: 95,
        vipPrice: 650,
        url: "https://www.ticketmaster.com/green-bay-packers-tickets/artist/805947",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
        isResale: false
      },
      {
        id: "tm-5",
        name: "Miami Dolphins vs Buffalo Bills",
        homeTeam: "Dolphins",
        awayTeam: "Bills",
        stadium: "Hard Rock Stadium",
        city: "Miami Gardens, FL",
        date: "2026-09-20",
        time: "13:00",
        cheapestPrice: 85,
        vipPrice: 580,
        url: "https://www.ticketmaster.com/miami-dolphins-tickets/artist/805969",
        image: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=800",
        isResale: true
      },
      {
        id: "tm-6",
        name: "New York Jets vs New England Patriots",
        homeTeam: "Jets",
        awayTeam: "Patriots",
        stadium: "MetLife Stadium",
        city: "East Rutherford, NJ",
        date: "2026-09-24",
        time: "20:15",
        cheapestPrice: 75,
        vipPrice: 500,
        url: "https://www.ticketmaster.com/new-york-jets-tickets/artist/805987",
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
        isResale: false
      }
    ];

    const generateFallback = () => {
      const activeTickets = fallbackGames.map(game => {
        const homeTicker = Object.keys(TEAM_NAMES).find(key => TEAM_NAMES[key].toLowerCase() === game.homeTeam.toLowerCase()) || "MIN";
        const marketPrice = marketPrices[homeTicker] || 100;
        
        const realCheapest = Math.round(game.cheapestPrice * (marketPrice / 100));
        const realVip = Math.round(game.vipPrice * (marketPrice / 100));
        
        return {
          ...game,
          cheapestPrice: realCheapest,
          vipPrice: realVip
        };
      });

      let filtered = activeTickets;
      if (teamFilter) {
        filtered = filtered.filter(g => 
          g.name.toLowerCase().includes(teamFilter.toLowerCase()) || 
          g.homeTeam.toLowerCase().includes(teamFilter.toLowerCase()) ||
          g.awayTeam.toLowerCase().includes(teamFilter.toLowerCase())
        );
      }
      if (stadiumFilter) {
        filtered = filtered.filter(g => g.stadium.toLowerCase().includes(stadiumFilter.toLowerCase()));
      }
      filtered = filtered.filter(g => g.cheapestPrice >= priceMin && g.cheapestPrice <= priceMax);
      return filtered;
    };

    const hasValidKey = apiKey && apiKey.trim() !== "" && !apiKey.toUpperCase().includes("YOUR") && !apiKey.toLowerCase().includes("placeholder");

    if (!hasValidKey) {
      return res.json({ events: generateFallback(), source: "simulated-live" });
    }

    try {
      const tmUrl = `https://app.ticketmaster.com/discovery/v2/events.json?apikey=${apiKey}&keyword=NFL&classificationName=Sports&size=40&sort=date,asc`;
      const response = await fetch(tmUrl);
      if (!response.ok) {
        console.log(`[Ticketmaster Notice] Status returned ${response.status}. Initiating gameday simulated exchange fallback.`);
        return res.json({ events: generateFallback(), source: "live-fallback", error: `Status ${response.status}` });
      }
      const data = await response.json();
      const eventsRaw = data._embedded?.events || [];
      
      const formattedEvents = eventsRaw.map((e: any) => {
        const cheapestPrice = e.priceRanges?.[0]?.min || 75;
        const vipPrice = e.priceRanges?.[0]?.max || (cheapestPrice * 6);
        const city = e._embedded?.venues?.[0]?.city?.name || "USA";
        const state = e._embedded?.venues?.[0]?.state?.stateCode || "";
        const stadium = e._embedded?.venues?.[0]?.name || "Stadium";
        
        return {
          id: e.id,
          name: e.name,
          homeTeam: e.name.split(" vs ")?.[0] || e.name,
          awayTeam: e.name.split(" vs ")?.[1] || "",
          stadium,
          city: `${city}, ${state}`,
          date: e.dates?.start?.localDate || "TBA",
          time: e.dates?.start?.localTime?.substring(0, 5) || "TBA",
          cheapestPrice,
          vipPrice,
          url: e.url || "https://www.ticketmaster.com",
          image: e.images?.[0]?.url || "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800",
          isResale: e.priceRanges?.[0]?.type === "resale"
        };
      });

      let filtered = formattedEvents;
      if (teamFilter) {
        filtered = filtered.filter((g: any) => g.name.toLowerCase().includes(teamFilter.toLowerCase()));
      }
      if (stadiumFilter) {
        filtered = filtered.filter((g: any) => g.stadium.toLowerCase().includes(stadiumFilter.toLowerCase()));
      }
      filtered = filtered.filter((g: any) => g.cheapestPrice >= priceMin && g.cheapestPrice <= priceMax);

      return res.json({ events: filtered, source: "live-ticketmaster" });
    } catch (err: any) {
      console.log(`[Ticketmaster Handled Catch] Query failed with: ${err.message}. Initiating fallback.`);
      return res.json({ events: generateFallback(), source: "error-fallback", error: err.message });
    }
  });

  app.get("/api/prices", (req, res) => {
    res.json(marketPrices);
  });

  app.get("/api/news", (req, res) => {
    const news = [
      { id: 1, title: "Vikings Secure Top Seed in NFC North", summary: "The Minnesota Vikings have officially clinched the NFC North title after a dominant performance.", timestamp: new Date().toISOString() },
      { id: 2, title: "Draft Prospect J.J. McCarthy Rising Boards", summary: "Scouts are calling J.J. McCarthy the most 'pro-ready' quarterback in this year's draft.", timestamp: new Date().toISOString() },
      { id: 3, title: "Market Alert: Chiefs Stock Surges 15%", summary: "Following a key trade, Kansas City stock has reached all-time highs.", timestamp: new Date().toISOString() }
    ];
    res.json(news);
  });

  // WebSocket logic
  wss.on("connection", (ws) => {
    console.log("Client connected to market stream");
    
    // Send initial prices
    ws.send(JSON.stringify({ type: "PRICES_INIT", data: marketPrices }));

    const priceInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "PRICES_UPDATE", data: marketPrices }));
      }
    }, 2000);

    ws.on("close", () => {
      clearInterval(priceInterval);
    });
  });

  // Market update loop
  setInterval(updateMarketPrices, 2000);

  // Determine if we should serve static files from dist or use Vite middleware
  const distPath = path.resolve(process.cwd(), "dist");
  const isProduction = process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
  
  // Checking for dist folder existence is a better indicator for production-like serving
  import("fs").then(fs => {
    const hasDist = fs.existsSync(distPath);

    if (isProduction || hasDist) {
      console.log(`Serving static files from: ${distPath}`);
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        // Prioritize API routes
        if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
        
        const indexPath = path.join(distPath, "index.html");
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error(`Error sending index.html:`, err);
            res.status(500).send("Build artifacts missing or server misconfiguration.");
          }
        });
      });
    } else {
      // Vite middleware for development
      console.log("Starting Vite development middleware...");
      import("vite").then(({ createServer: createViteServer }) => {
        createViteServer({
          server: { middlewareMode: true },
          appType: "spa",
        }).then(vite => {
          app.use(vite.middlewares);
        });
      }).catch(e => {
        console.error("Vite failed to load:", e);
        app.get("*", (req, res) => res.status(500).send("Development server loading Error."));
      });
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`NFL Exchange Gridiron Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
