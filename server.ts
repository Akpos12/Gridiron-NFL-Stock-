import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Example API for NFL news (could be powered by Gemini)
  app.get("/api/news", (req, res) => {
    const news = [
      { id: 1, title: "Vikings Secure Top Seed in NFC North", summary: "The Minnesota Vikings have officially clinched the NFC North title after a dominant performance.", timestamp: new Date().toISOString() },
      { id: 2, title: "Draft Prospect J.J. McCarthy Rising Boards", summary: "Scouts are calling J.J. McCarthy the most 'pro-ready' quarterback in this year's draft.", timestamp: new Date().toISOString() },
      { id: 3, title: "Market Alert: Chiefs Stock Surges 15%", summary: "Following a key trade, Kansas City stock has reached all-time highs.", timestamp: new Date().toISOString() }
    ];
    res.json(news);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gridiron NFL Stock market Server running on http://localhost:${PORT}`);
  });
}

startServer();
