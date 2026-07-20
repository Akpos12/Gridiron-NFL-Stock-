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
