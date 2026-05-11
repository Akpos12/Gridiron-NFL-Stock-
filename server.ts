import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Market Engine ---
const TICKER_SYMBOLS = [
  "ARI", "ATL", "BAL", "BUF", "CAR", "CHI", "CIN", "CLE",
  "DAL", "DEN", "DET", "GB", "HOU", "IND", "JAX", "KC",
  "LV", "LAC", "LAR", "MIA", "MIN", "NE", "NO", "NYG",
  "NYJ", "PHI", "PIT", "SF", "SEA", "TB", "TEN", "WAS"
];

let marketPrices: Record<string, number> = {};
TICKER_SYMBOLS.forEach(symbol => {
  marketPrices[symbol] = 50 + Math.random() * 200;
});

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

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
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

  // Serve static files in production
  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    const distPath = path.resolve(process.cwd(), "dist");
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      const indexPath = path.join(distPath, "index.html");
      res.sendFile(indexPath, (err) => {
        if (err) {
          console.error(`Error sending index.html from ${indexPath}:`, err);
          res.status(404).send("Application not ready or build missing.");
        }
      });
    });
  } else {
    // Vite middleware for development
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`NFL Exchange Gridiron Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
