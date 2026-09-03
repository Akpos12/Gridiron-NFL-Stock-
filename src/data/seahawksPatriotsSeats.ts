export interface SeatListing {
  id: string;
  section: string;
  row: string;
  offerType: "Standing Room Only Offer" | "Verified Resale Ticket" | "Standard-under 3 Free on Lap";
  viewBadge: string;
  originalPrice: number;
  price: number; // Adjusted to start from $1,000.00
  isStandingRoom?: boolean;
}

export const SEAHAWKS_PATRIOTS_IMAGES = {
  primary: "https://i.postimg.cc/J0DZvg87/IMG-0463.jpg",
  minimap: "https://i.postimg.cc/d0sdwDF2/IMG-0464.jpg"
};

// Base offset so prices start from $1,000.00
// Minimum original price is $277.15 -> becomes $1,000.00
const calcPrice = (orig: number) => {
  return Number((1000 + (orig - 277.15)).toFixed(2));
};

export const SEAHAWKS_PATRIOTS_SEATS: SeatListing[] = [
  {
    id: "seat-1",
    section: "Sec 333SR",
    row: "Row SR",
    offerType: "Standing Room Only Offer",
    viewBadge: "Minimap of the venue, highlighting 333SR",
    originalPrice: 277.15,
    price: calcPrice(277.15),
    isStandingRoom: true
  },
  {
    id: "seat-2",
    section: "Sec 331SR",
    row: "Row SR",
    offerType: "Standing Room Only Offer",
    viewBadge: "Minimap of the venue, highlighting 331SR",
    originalPrice: 277.15,
    price: calcPrice(277.15),
    isStandingRoom: true
  },
  {
    id: "seat-3",
    section: "Sec 339SR",
    row: "Row SR",
    offerType: "Standing Room Only Offer",
    viewBadge: "Minimap of the venue, highlighting 339SR",
    originalPrice: 277.15,
    price: calcPrice(277.15),
    isStandingRoom: true
  },
  {
    id: "seat-4",
    section: "Sec 305SR",
    row: "Row SR",
    offerType: "Standing Room Only Offer",
    viewBadge: "Minimap of the venue, highlighting 305SR",
    originalPrice: 277.15,
    price: calcPrice(277.15),
    isStandingRoom: true
  },
  {
    id: "seat-5",
    section: "Sec 315SR",
    row: "Row SR",
    offerType: "Standing Room Only Offer",
    viewBadge: "Minimap of the venue, highlighting 315SR",
    originalPrice: 277.15,
    price: calcPrice(277.15),
    isStandingRoom: true
  },
  {
    id: "seat-6",
    section: "Sec 340",
    row: "Row X",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 280.80,
    price: calcPrice(280.80)
  },
  {
    id: "seat-7",
    section: "Sec 304",
    row: "Row AA",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 291.33,
    price: calcPrice(291.33)
  },
  {
    id: "seat-8",
    section: "Sec 332",
    row: "Row KK",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-9",
    section: "Sec 307",
    row: "Row MM",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-10",
    section: "Sec 341",
    row: "Row T",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-11",
    section: "Sec 341",
    row: "Row V",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-12",
    section: "Sec 315",
    row: "Row V",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-13",
    section: "Sec 304",
    row: "Row GG",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 292.50,
    price: calcPrice(292.50)
  },
  {
    id: "seat-14",
    section: "Sec 332",
    row: "Row HH",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 298.35,
    price: calcPrice(298.35)
  },
  {
    id: "seat-15",
    section: "Sec 340",
    row: "Row II",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 299.52,
    price: calcPrice(299.52)
  },
  {
    id: "seat-16",
    section: "Sec 305",
    row: "Row LL",
    offerType: "Standard-under 3 Free on Lap",
    viewBadge: "View From Seat",
    originalPrice: 301.25,
    price: calcPrice(301.25)
  },
  {
    id: "seat-17",
    section: "Sec 305",
    row: "Row MM",
    offerType: "Standard-under 3 Free on Lap",
    viewBadge: "View From Seat",
    originalPrice: 301.25,
    price: calcPrice(301.25)
  },
  {
    id: "seat-18",
    section: "Sec 305",
    row: "Row NN",
    offerType: "Standard-under 3 Free on Lap",
    viewBadge: "View From Seat",
    originalPrice: 301.25,
    price: calcPrice(301.25)
  },
  {
    id: "seat-19",
    section: "Sec 313",
    row: "Row MM",
    offerType: "Standard-under 3 Free on Lap",
    viewBadge: "View From Seat",
    originalPrice: 301.25,
    price: calcPrice(301.25)
  },
  {
    id: "seat-20",
    section: "Sec 313",
    row: "Row NN",
    offerType: "Standard-under 3 Free on Lap",
    viewBadge: "View From Seat",
    originalPrice: 301.25,
    price: calcPrice(301.25)
  },
  {
    id: "seat-21",
    section: "Sec 304",
    row: "Row GG",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 301.86,
    price: calcPrice(301.86)
  },
  {
    id: "seat-22",
    section: "Sec 331",
    row: "Row FF",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 303.03,
    price: calcPrice(303.03)
  },
  {
    id: "seat-23",
    section: "Sec 316",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 303.03,
    price: calcPrice(303.03)
  },
  {
    id: "seat-24",
    section: "Sec 340",
    row: "Row S",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-25",
    section: "Sec 340",
    row: "Row CC",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-26",
    section: "Sec 341",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-27",
    section: "Sec 340",
    row: "Row GG",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-28",
    section: "Sec 340",
    row: "Row GG",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-29",
    section: "Sec 320",
    row: "Row W",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-30",
    section: "Sec 316",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 304.20,
    price: calcPrice(304.20)
  },
  {
    id: "seat-31",
    section: "Sec 340",
    row: "Row X",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 308.88,
    price: calcPrice(308.88)
  },
  {
    id: "seat-32",
    section: "Sec 306",
    row: "Row Y",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 310.05,
    price: calcPrice(310.05)
  },
  {
    id: "seat-33",
    section: "Sec 305",
    row: "Row V",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 310.05,
    price: calcPrice(310.05)
  },
  {
    id: "seat-34",
    section: "Sec 339",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 310.05,
    price: calcPrice(310.05)
  },
  {
    id: "seat-35",
    section: "Sec 339",
    row: "Row FF",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 310.05,
    price: calcPrice(310.05)
  },
  {
    id: "seat-36",
    section: "Sec 309",
    row: "Row KK",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 310.05,
    price: calcPrice(310.05)
  },
  {
    id: "seat-37",
    section: "Sec 327",
    row: "Row Q",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 311.22,
    price: calcPrice(311.22)
  },
  {
    id: "seat-38",
    section: "Sec 312",
    row: "Row FF",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 314.73,
    price: calcPrice(314.73)
  },
  {
    id: "seat-39",
    section: "Sec 342",
    row: "Row N",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 314.73,
    price: calcPrice(314.73)
  },
  {
    id: "seat-40",
    section: "Sec 310",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-41",
    section: "Sec 332",
    row: "Row T",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-42",
    section: "Sec 312",
    row: "Row BB",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-43",
    section: "Sec 312",
    row: "Row BB",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-44",
    section: "Sec 315",
    row: "Row V",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-45",
    section: "Sec 318",
    row: "Row H",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-46",
    section: "Sec 318",
    row: "Row I",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 315.90,
    price: calcPrice(315.90)
  },
  {
    id: "seat-47",
    section: "Sec 316",
    row: "Row J",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 318.24,
    price: calcPrice(318.24)
  },
  {
    id: "seat-48",
    section: "Sec 310",
    row: "Row LL",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 320.58,
    price: calcPrice(320.58)
  },
  {
    id: "seat-49",
    section: "Sec 314",
    row: "Row BB",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 320.58,
    price: calcPrice(320.58)
  },
  {
    id: "seat-50",
    section: "Sec 340",
    row: "Row K",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-51",
    section: "Sec 310",
    row: "Row AA",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-52",
    section: "Sec 332",
    row: "Row NN",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-53",
    section: "Sec 312",
    row: "Row W",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-54",
    section: "Sec 313",
    row: "Row BB",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-55",
    section: "Sec 336",
    row: "Row KK",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-56",
    section: "Sec 311",
    row: "Row MM",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-57",
    section: "Sec 307",
    row: "Row NN",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-58",
    section: "Sec 312",
    row: "Row JJ",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-59",
    section: "Sec 340",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-60",
    section: "Sec 314",
    row: "Row U",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-61",
    section: "Sec 314",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-62",
    section: "Sec 331",
    row: "Row JJ",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-63",
    section: "Sec 314",
    row: "Row DD",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-64",
    section: "Sec 329",
    row: "Row R",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-65",
    section: "Sec 329",
    row: "Row S",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-66",
    section: "Sec 341",
    row: "Row M",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-67",
    section: "Sec 303",
    row: "Row P",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-68",
    section: "Sec 303",
    row: "Row Q",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-69",
    section: "Sec 328",
    row: "Row W",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-70",
    section: "Sec 327",
    row: "Row P",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-71",
    section: "Sec 317",
    row: "Row R",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-72",
    section: "Sec 317",
    row: "Row V",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-73",
    section: "Sec 327",
    row: "Row Z",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-74",
    section: "Sec 340",
    row: "Row II",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 321.75,
    price: calcPrice(321.75)
  },
  {
    id: "seat-75",
    section: "Sec 337",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 322.92,
    price: calcPrice(322.92)
  },
  {
    id: "seat-76",
    section: "Sec 306",
    row: "Row AA",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 322.92,
    price: calcPrice(322.92)
  },
  {
    id: "seat-77",
    section: "Sec 340",
    row: "Row Y",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 325.26,
    price: calcPrice(325.26)
  },
  {
    id: "seat-78",
    section: "Sec 325",
    row: "Row H",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 325.26,
    price: calcPrice(325.26)
  },
  {
    id: "seat-79",
    section: "Sec 333",
    row: "Row NN",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 326.43,
    price: calcPrice(326.43)
  },
  {
    id: "seat-80",
    section: "Sec 331",
    row: "Row LL",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 326.43,
    price: calcPrice(326.43)
  },
  {
    id: "seat-81",
    section: "Sec 338",
    row: "Row NN",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-82",
    section: "Sec 313",
    row: "Row S",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-83",
    section: "Sec 305",
    row: "Row X",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-84",
    section: "Sec 308",
    row: "Row QQ",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-85",
    section: "Sec 311",
    row: "Row JJ",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-86",
    section: "Sec 339",
    row: "Row Q",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-87",
    section: "Sec 339",
    row: "Row HH",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-88",
    section: "Sec 303",
    row: "Row M",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 327.60,
    price: calcPrice(327.60)
  },
  {
    id: "seat-89",
    section: "Sec 338",
    row: "Row II",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 328.77,
    price: calcPrice(328.77)
  },
  {
    id: "seat-90",
    section: "Sec 309",
    row: "Row JJ",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 329.94,
    price: calcPrice(329.94)
  },
  {
    id: "seat-91",
    section: "Sec 335",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 333.45,
    price: calcPrice(333.45)
  },
  {
    id: "seat-92",
    section: "Sec 307",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 333.45,
    price: calcPrice(333.45)
  },
  {
    id: "seat-93",
    section: "Sec 306",
    row: "Row X",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 333.45,
    price: calcPrice(333.45)
  },
  {
    id: "seat-94",
    section: "Sec 330",
    row: "Row R",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 333.45,
    price: calcPrice(333.45)
  },
  {
    id: "seat-95",
    section: "Sec 307",
    row: "Row EE",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 335.79,
    price: calcPrice(335.79)
  },
  {
    id: "seat-96",
    section: "Sec 300",
    row: "Row I",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 335.79,
    price: calcPrice(335.79)
  },
  {
    id: "seat-97",
    section: "Sec 306",
    row: "Row HH",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 336.96,
    price: calcPrice(336.96)
  },
  {
    id: "seat-98",
    section: "Sec 339",
    row: "Row LL",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 336.96,
    price: calcPrice(336.96)
  },
  {
    id: "seat-99",
    section: "Sec 331",
    row: "Row BB",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 336.96,
    price: calcPrice(336.96)
  },
  {
    id: "seat-100",
    section: "Sec 343",
    row: "Row CC",
    offerType: "Verified Resale Ticket",
    viewBadge: "View From Seat",
    originalPrice: 336.96,
    price: calcPrice(336.96)
  }
];
