// Static fallback data so the site is fully browsable without a database.
// Mirrors prisma/seed.ts. Used by read pages when Prisma can't reach a DB
// (e.g. a frontend-only preview deploy with no DATABASE_URL configured).

export type MockZone = {
  id: string;
  name: string;
  price: number;
  rows: number;
  seatsPerRow: number;
};

export type MockConcert = {
  id: string;
  title: string;
  artist: string;
  venue: string;
  date: Date;
  description: string;
  imageUrl: string;
  zones: MockZone[];
};

export const mockConcerts: MockConcert[] = [
  {
    id: "demo-blackpink",
    title: "BLACKPINK World Tour",
    artist: "BLACKPINK",
    venue: "Rajamangala National Stadium",
    date: new Date("2026-08-15T19:00:00"),
    description:
      "ครั้งแรกในรอบ 3 ปี BLACKPINK กลับมาบุกประเทศไทย พร้อมโปรดักชั่นระดับโลก",
    imageUrl:
      "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
    zones: [
      { id: "demo-bp-vip", name: "VIP", price: 8500, rows: 5, seatsPerRow: 10 },
      { id: "demo-bp-a", name: "Standard A", price: 5500, rows: 8, seatsPerRow: 12 },
      { id: "demo-bp-b", name: "Standard B", price: 3500, rows: 10, seatsPerRow: 14 },
    ],
  },
  {
    id: "demo-bodyslam",
    title: "BODYSLAM 25th Anniversary",
    artist: "BODYSLAM",
    venue: "อิมแพ็ค อารีน่า เมืองทองธานี",
    date: new Date("2026-09-20T18:30:00"),
    description:
      "ฉลองครบรอบ 25 ปี กับโชว์สุดยิ่งใหญ่ตลอดทั้งคืน ห้ามพลาด",
    imageUrl:
      "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
    zones: [
      { id: "demo-bs-front", name: "Front Row", price: 6000, rows: 4, seatsPerRow: 12 },
      { id: "demo-bs-center", name: "Center", price: 4000, rows: 8, seatsPerRow: 14 },
      { id: "demo-bs-side", name: "Side", price: 2500, rows: 10, seatsPerRow: 14 },
    ],
  },
  {
    id: "demo-coldplay",
    title: "Coldplay Music of the Spheres",
    artist: "Coldplay",
    venue: "Rajamangala National Stadium",
    date: new Date("2026-11-05T19:30:00"),
    description:
      "Music of the Spheres World Tour กลับมาอีกครั้งในกรุงเทพฯ",
    imageUrl:
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200",
    zones: [
      { id: "demo-cp-diamond", name: "Diamond", price: 12000, rows: 5, seatsPerRow: 10 },
      { id: "demo-cp-gold", name: "Gold", price: 8000, rows: 8, seatsPerRow: 12 },
      { id: "demo-cp-silver", name: "Silver", price: 4500, rows: 12, seatsPerRow: 14 },
    ],
  },
];

export function getMockConcert(id: string): MockConcert | undefined {
  return mockConcerts.find((c) => c.id === id);
}
