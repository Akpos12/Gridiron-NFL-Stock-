import React, { useState, useEffect } from "react";
import { motion } from "motion/react";

/**
 * NFL Premium Image Asset Mapping Utility
 * Maps dynamically based on title, category, teams, and item IDs to realistic, high-quality NFL-themed imagery.
 */
export const NFL_IMAGES = {
  stadiums: {
    DAL: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200", // AT&T Stadium (Dallas Cowboys)
    MIN: "https://images.unsplash.com/photo-1551244072-5d12893278ab?auto=format&fit=crop&q=80&w=1200", // U.S. Bank Stadium (Vikings)
    KC: "https://images.unsplash.com/photo-1569437061241-a848be43cc82?auto=format&fit=crop&q=80&w=1200",  // Arrowhead Stadium (Chiefs)
    PHI: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200", // Lincoln Financial Field (Eagles)
    GB: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&q=80&w=1200",  // Lambeau Facility (Packers)
    SF: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",  // Super Bowl/VIP West Coast Stadium
    GENERIC: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=1200", // Premium crowd/stadium
  },

  meetAndGreet: {
    autograph: "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200", // Autograph on football stadium turf
    backstage: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200", // VIP Event, sideline huddles and interactions
    playerTrophy: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?auto=format&fit=crop&q=80&w=1200", // Stadium lights beaming on turf
  },

  merchandise: {
    jerseyGreen: "https://i.postimg.cc/LX9QjR0f/339feabb3b77fc4fd27637e3e0791cc9jersey.jpg", // Replica Nike style jerseys
    apparelFlatlay: "https://i.postimg.cc/dtfMv7SK/4bbf77eabd2406831269772d206b3186.jpg", // Training gear, sneakers, and sports wear
    hoodie: "https://i.postimg.cc/wxb4RC5N/5252ceda2d79871dfbdb18431d89a468hoodie.jpg", // Official fan hoodie product
    helmet: "https://i.postimg.cc/bY6WHDPJ/535f637d8a827845da41c33e6f994795helmet.jpg", // Authentic helmets and equipment
    football: "https://i.postimg.cc/0Qn34rJ3/d970707799e1f952db7ea1ea6ddf218bmemo.jpg", // Real leather game ball "The Duke"
    jacket: "https://i.postimg.cc/dtfMv7SK/4bbf77eabd2406831269772d206b3186.jpg", // Sideline coaches varsity jacket
  },

  matchDay: {
    crowd: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&q=80&w=1200", // Super Bowl crowd screaming
    action: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=1200", // Match in-play field view
  },

  experiences: {
    tailgate: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&q=80&w=1200", // Vibrant game day crowds celebrating
    vipLounge: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=1200" // Elevated suite lounge looking onto the stadium field
  }
};

/**
 * Normalizes input identifiers to resolve the perfect NFL-themed sports visual
 */
export function getNFLImage(item: {
  id?: string;
  name?: string;
  title?: string;
  experienceTitle?: string;
  description?: string;
  category?: string;
  badge?: string;
  type?: string;
  teamId?: string;
  imageUrl?: string;
  image?: string;
  v?: number;
  updatedAt?: any;
}): string {
  if (!item) return "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800";

  let baseSrc = "";

  // PRIORITIZE THE EXPLICIT IMAGE FIELD FROM DATABASE OR ADMIN SEEDS (Remove any hardcoding inside components)
  if (item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.trim() !== "") {
    baseSrc = item.imageUrl.trim();
  } else if (item.image && typeof item.image === "string" && item.image.trim() !== "") {
    baseSrc = item.image.trim();
  }

  // SANITIZE ANY DEPRECATED/BROKEN UNSPLASH IDS (Trigger fallback resolution)
  const BROKEN_UNSPLASH_PATTERNS = [
    "photo-1519766304817",
    "photo-1508098682722",
    "photo-1522158673370",
    "photo-1595180017120",
    "photo-1431324155629",
    "photo-1566577739023",
    "photo-1570458436416"
  ];
  if (baseSrc) {
    for (const pat of BROKEN_UNSPLASH_PATTERNS) {
      if (baseSrc.includes(pat)) {
        baseSrc = "";
        break;
      }
    }
  }

  // IF NO EXPLICIT URL, MAP TO THE PREMIUM DYNAMIC ASSETS ACCORDING TO METADATA
  if (!baseSrc) {
    const normId = (item.id || "").toUpperCase();
    const normTitle = (item.title || item.name || item.experienceTitle || "").toLowerCase();
    const normCategory = (item.category || item.badge || "").toLowerCase();
    const normType = (item.type || "").toLowerCase();
    
    // 1. EXTRACT TEAM
    let teamId = (item.teamId || "").toUpperCase();
    if (!teamId) {
      const fullText = `${normId} ${normTitle} ${normCategory} ${normType} ${(item.description || "").toLowerCase()}`.toUpperCase();
      if (fullText.includes("DAL") || fullText.includes("COWBOYS") || fullText.includes("DALLAS") || fullText.includes("ARLINGTON")) {
        teamId = "DAL";
      } else if (fullText.includes("MIN") || fullText.includes("VIKINGS") || fullText.includes("MINNESOTA") || fullText.includes("MINNEAPOLIS")) {
        teamId = "MIN";
      } else if (fullText.includes("KC") || fullText.includes("CHIEFS") || fullText.includes("KANSAS")) {
        teamId = "KC";
      } else if (fullText.includes("PHI") || fullText.includes("EAGLES") || fullText.includes("PHILADELPHIA")) {
        teamId = "PHI";
      } else if (fullText.includes("GB") || fullText.includes("PACKERS") || fullText.includes("GREEN BAY") || fullText.includes("LAMBEAU")) {
        teamId = "GB";
      } else if (fullText.includes("SF") || fullText.includes("49ERS") || fullText.includes("SAN FRANCISCO")) {
        teamId = "SF";
      }
    }

    // 2. DETECT THE EXACT CATEGORY
    const isJersey = normCategory.includes("jersey") || normTitle.includes("jersey") || normId.includes("jersey") || normId.startsWith("J");
    const isHoodieOrJacket = normCategory.includes("hoodie") || normTitle.includes("hoodie") || normTitle.includes("jacket") || normCategory.includes("limited") || normId.includes("hoodie") || normId.includes("limited") || normTitle.includes("fleece");
    const isHelmet = normCategory.includes("helmet") || normTitle.includes("helmet") || normId.includes("helmet");
    const isCap = normCategory.includes("hat") || normCategory.includes("cap") || normTitle.includes("hat") || normTitle.includes("cap") || normId.includes("hat");
    const isMemorabilia = normCategory.includes("memorabilia") || normTitle.includes("autograph") || normTitle.includes("signed") || normTitle.includes("ball") || normTitle.includes("football") || normId.includes("memorabilia");
    
    const isStadiumTour = normType === "stadium_tour" || normType === "private_tour" || normCategory.includes("tour") || normCategory.includes("facility") || normTitle.includes("stadium tour") || normTitle.includes("facility tour") || normTitle.includes("access tour");
    const isMeetGreet = normType === "meet_greet" || normCategory.includes("meet") || normTitle.includes("meet & greet") || normTitle.includes("session") || normTitle.includes("masterclass") || normCategory.includes("greet");
    const isTicket = normCategory.includes("ticket") || normCategory.includes("match") || normId.startsWith("T") || normTitle.includes("suite") || normTitle.includes("sideline") || normTitle.includes("endzone") || normCategory.includes("pass") || normTitle.includes("vs");
    const isFanCard = normTitle.includes("governance") || normTitle.includes("pass") || normTitle.includes("card") || normId.startsWith("FC") || normCategory.includes("fancard");

    // 3. MAP TEAM-SPECIFIC HIGH VALUE TARGETS
    if (isJersey) {
      baseSrc = "https://i.postimg.cc/LX9QjR0f/339feabb3b77fc4fd27637e3e0791cc9jersey.jpg";
    } else if (isHoodieOrJacket) {
      if (normCategory.includes("limited") || normId.includes("limited") || normTitle.includes("heritage") || normTitle.includes("jacket") || normTitle.includes("varsity")) {
        baseSrc = "https://i.postimg.cc/dtfMv7SK/4bbf77eabd2406831269772d206b3186.jpg";
      } else {
        baseSrc = "https://i.postimg.cc/wxb4RC5N/5252ceda2d79871dfbdb18431d89a468hoodie.jpg";
      }
    } else if (isHelmet) {
      baseSrc = "https://i.postimg.cc/bY6WHDPJ/535f637d8a827845da41c33e6f994795helmet.jpg";
    } else if (isCap) {
      baseSrc = "https://i.postimg.cc/g2h7WgZ2/1528e7dd107557d7b35d48f4a8564c99cap.jpg";
    } else if (isMemorabilia) {
      baseSrc = "https://i.postimg.cc/0Qn34rJ3/d970707799e1f952db7ea1ea6ddf218bmemo.jpg";
    } else if (isStadiumTour) {
      if (teamId === "DAL") baseSrc = NFL_IMAGES.stadiums.DAL;
      else if (teamId === "MIN") baseSrc = NFL_IMAGES.stadiums.MIN;
      else if (teamId === "KC") baseSrc = NFL_IMAGES.stadiums.KC;
      else if (teamId === "GB") baseSrc = NFL_IMAGES.stadiums.GB;
      else if (teamId === "SF") baseSrc = NFL_IMAGES.stadiums.SF;
      else baseSrc = NFL_IMAGES.stadiums.GENERIC;
    } else if (isMeetGreet) {
      baseSrc = NFL_IMAGES.meetAndGreet.backstage;
    } else if (isTicket) {
      if (normTitle.includes("suite") || normTitle.includes("season access")) {
        baseSrc = NFL_IMAGES.experiences.vipLounge;
      } else {
        if (teamId === "DAL") baseSrc = NFL_IMAGES.stadiums.DAL;
        else if (teamId === "KC" || teamId === "SF") baseSrc = NFL_IMAGES.stadiums.KC;
        else if (teamId === "MIN") baseSrc = NFL_IMAGES.stadiums.MIN;
        else baseSrc = NFL_IMAGES.matchDay.crowd;
      }
    } else if (isFanCard) {
      if (normTitle.includes("gold")) {
        baseSrc = NFL_IMAGES.meetAndGreet.playerTrophy;
      } else {
        baseSrc = NFL_IMAGES.stadiums.GENERIC;
      }
    } else {
      baseSrc = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800";
    }
  }

  // 4. ADD CACHE-BUSTING TIMESTAMP OR VERSION TO FORCE IMAGE REFRESH
  const version = item.v || item.updatedAt || Date.now();
  let finalUrl = baseSrc;
  if (finalUrl && !finalUrl.startsWith("data:")) {
    const separator = finalUrl.includes("?") ? "&" : "?";
    finalUrl = `${finalUrl}${separator}cb=${version}`;
  }

  // 5. DEBUGGING & LOGGING COMPLIANCE
  const itemName = item.id || item.title || item.name || item.experienceTitle || "Unknown Asset";
  if (!finalUrl || finalUrl.trim() === "" || !finalUrl.startsWith("http")) {
    console.warn(`[NFLImage Debug] Warning: Image URL for item "${itemName}" is missing or invalid:`, finalUrl);
  } else {
    console.log(`[NFLImage Debug] Rendering card "${itemName}" using URL: ${finalUrl}`);
  }

  return finalUrl;
}

interface NFLImageProps {
  item: {
    id?: string;
    name?: string;
    title?: string;
    experienceTitle?: string;
    description?: string;
    category?: string;
    badge?: string;
    type?: string;
    teamId?: string;
    imageUrl?: string;
    image?: string;
    v?: number;
    updatedAt?: any;
  };
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
}

/**
 * Premium NFL Image Component with dynamic loading state, smooth Framer Motion fade-ins,
 * optimized referrer control, lazy-loading, and instant smart fallback capability if failures occur.
 */
export const NFLImage: React.FC<NFLImageProps> = ({ item, className, style, alt }) => {
  const [currentSrc, setCurrentSrc] = useState<string>("");
  const [loaded, setLoaded] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync state if item changes
  useEffect(() => {
    const updatedSrc = getNFLImage(item);
    setCurrentSrc(updatedSrc);
    setLoaded(false);
    setHasError(false);
  }, [
    item?.id, 
    item?.imageUrl, 
    item?.image, 
    item?.v, 
    item?.updatedAt, 
    item?.title, 
    item?.name, 
    item?.experienceTitle
  ]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fallbackUrl = "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&q=80&w=800";
      console.log(`[NFLImage Fallback] Image failed to load for "${item?.id || item?.title || item?.name}". Fallback URL: ${fallbackUrl}`);
      setCurrentSrc(`${fallbackUrl}?cb=fallback-${Date.now()}`);
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950/40">
      {/* Dynamic Placeholder Loading Shimmer */}
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900" />
      )}
      
      {currentSrc && (
        <motion.img
          src={currentSrc}
          alt={alt || item?.title || item?.name || item?.experienceTitle || "NFL Experience"}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setLoaded(true)}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: loaded ? 1 : 0 }}
          transition={{ duration: 0.4 }}
          className={className}
          style={style}
        />
      )}
    </div>
  );
};
