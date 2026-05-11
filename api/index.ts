import express from "express";
import { createServer as createViteServer } from "vite";
import http from "http";
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
    const volatility = 0.002;
    const change = (Math.random() - 0.49) * (marketPrices[symbol] * volatility);
    marketPrices[symbol] = Math.max(1, marketPrices[symbol] + change);
  });
}

// In serverless environments, background intervals won't run continuously.
// We update at least once per request to simulate movement.
setInterval(updateMarketPrices, 5000);

const app = express();
app.use(express.json());

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/prices", (req, res) => {
  updateMarketPrices(); // Force update for serverless
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

// Vite middleware logic
if (process.env.NODE_ENV !== "production" && process.env.VERCEL !== "1") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));
}

// Export for Vercel
export default app;

// Listen only if running directly (not via Vercel)
if (process.env.VERCEL !== "1") {
  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
