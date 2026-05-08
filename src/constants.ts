export interface Team {
  id: string;
  name: string;
  city: string;
  color: string;
  secondaryColor?: string;
}

export const NFL_TEAMS: Team[] = [
  { id: "ARI", name: "Cardinals", city: "Arizona", color: "#97233F" },
  { id: "ATL", name: "Falcons", city: "Atlanta", color: "#A71930" },
  { id: "BAL", name: "Ravens", city: "Baltimore", color: "#241773" },
  { id: "BUF", name: "Bills", city: "Buffalo", color: "#00338D" },
  { id: "CAR", name: "Panthers", city: "Carolina", color: "#0085CA" },
  { id: "CHI", name: "Bears", city: "Chicago", color: "#0B162A" },
  { id: "CIN", name: "Bengals", city: "Cincinnati", color: "#FB4F14" },
  { id: "CLE", name: "Browns", city: "Cleveland", color: "#311D00" },
  { id: "DAL", name: "Cowboys", city: "Dallas", color: "#003594" },
  { id: "DEN", name: "Broncos", city: "Denver", color: "#FB4F14" },
  { id: "DET", name: "Lions", city: "Detroit", color: "#0076B6" },
  { id: "GB", name: "Packers", city: "Green Bay", color: "#203731" },
  { id: "HOU", name: "Texans", city: "Houston", color: "#03202F" },
  { id: "IND", name: "Colts", city: "Indianapolis", color: "#002C5F" },
  { id: "JAX", name: "Jaguars", city: "Jacksonville", color: "#006778" },
  { id: "KC", name: "Chiefs", city: "Kansas City", color: "#E31837" },
  { id: "LV", name: "Raiders", city: "Las Vegas", color: "#000000" },
  { id: "LAC", name: "Chargers", city: "Los Angeles", color: "#0080C6" },
  { id: "LAR", name: "Rams", city: "Los Angeles", color: "#003594" },
  { id: "MIA", name: "Dolphins", city: "Miami", color: "#008E97" },
  { id: "MIN", name: "Vikings", city: "Minnesota", color: "#4F2683" },
  { id: "NE", name: "Patriots", city: "New England", color: "#002244" },
  { id: "NO", name: "Saints", city: "New Orleans", color: "#D3BC8D" },
  { id: "NYG", name: "Giants", city: "New York", color: "#0B2265" },
  { id: "NYJ", name: "Jets", city: "New York", color: "#125740" },
  { id: "PHI", name: "Eagles", city: "Philadelphia", color: "#004C54" },
  { id: "PIT", name: "Steelers", city: "Pittsburgh", color: "#FFB612" },
  { id: "SF", name: "49ers", city: "San Francisco", color: "#AA0000" },
  { id: "SEA", name: "Seahawks", city: "Seattle", color: "#002244" },
  { id: "TB", name: "Buccaneers", city: "Tampa Bay", color: "#D50A0A" },
  { id: "TEN", name: "Titans", city: "Tennessee", color: "#0C2340" },
  { id: "WAS", name: "Commanders", city: "Washington", color: "#773141" },
];

export const getLogoUrl = (teamId: string) => `https://a.espncdn.com/i/teamlogos/nfl/500/${teamId.toLowerCase()}.png`;
