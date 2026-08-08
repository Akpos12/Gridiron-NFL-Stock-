export interface Player {
  id: string;
  name: string;
  teamId: string;
  position: string;
  jerseyNumber: string;
  description: string;
  photoUrl: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface Prize {
  id: string;
  name: string;
  description: string;
  quantity: number;
  imageUrl: string;
}

export type GiveawayStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'ARCHIVED';

export interface Giveaway {
  id: string;
  title: string;
  description: string;
  playerId: string;
  playerName: string;
  teamId: string;
  heroImageUrl: string;
  startDate: string;
  endDate: string;
  eligibility: string;
  entryRequirements: string;
  numWinners: number;
  rules: string;
  status: GiveawayStatus;
  entriesCount: number;
  prizes: Prize[];
  createdAt?: number;
  updatedAt?: number;
}

export interface FanProfile {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  city: string;
  favoriteTeam: string;
  profilePhotoUrl: string;
  fanCode: string;
  createdAt: number;
  isWinner?: boolean;
  winningMessage?: string;
  winningPrize?: string;
  claimCode?: string;
  claimStatus?: 'PENDING_CLAIM' | 'CLAIMED' | 'DISPATCHED';
}

export interface GiveawayEntry {
  id: string;
  giveawayId: string;
  giveawayTitle: string;
  playerId: string;
  playerName: string;
  teamId: string;
  userId: string;
  userEmail: string;
  userName: string;
  fanCode: string;
  city: string;
  profilePhotoUrl: string;
  status: 'ENTERED' | 'ELIGIBLE' | 'WINNER' | 'RUNNER_UP';
  entryDate: number;
  careRepresentativeNote?: string;
  claimCode?: string;
}

export interface GiveawayWinner {
  id: string;
  giveawayId: string;
  giveawayTitle: string;
  playerId: string;
  playerName: string;
  prizeName: string;
  winnerUserId: string;
  winnerFanCode: string;
  winnerName: string;
  winnerEmail: string;
  selectionDate: number;
  status: string;
  careMessage?: string;
  claimCode?: string;
  shippingAddress?: string;
  claimedAt?: number;
}

export interface TeamConfig {
  teamId: string;
  teamName: string;
  teamLogoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  fanCardTemplateStyle: string;
}
