import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  await prisma.bookedSeat.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.concert.deleteMany();
  await prisma.user.deleteMany();

  const adminPwd = await bcrypt.hash("admin1234", 10);
  const userPwd = await bcrypt.hash("user1234", 10);

  await prisma.user.create({
    data: {
      email: "admin@demo.com",
      name: "Admin",
      password: adminPwd,
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      email: "user@demo.com",
      name: "Demo User",
      password: userPwd,
      role: "USER",
    },
  });

  await prisma.concert.create({
    data: {
      title: "BLACKPINK World Tour",
      artist: "BLACKPINK",
      venue: "Rajamangala National Stadium",
      date: new Date("2026-08-15T19:00:00"),
      description:
        "ครั้งแรกในรอบ 3 ปี BLACKPINK กลับมาบุกประเทศไทย พร้อมโปรดักชั่นระดับโลก",
      imageUrl:
        "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
      zones: {
        create: [
          { name: "VIP", price: 8500, rows: 5, seatsPerRow: 10 },
          { name: "Standard A", price: 5500, rows: 8, seatsPerRow: 12 },
          { name: "Standard B", price: 3500, rows: 10, seatsPerRow: 14 },
        ],
      },
    },
  });

  await prisma.concert.create({
    data: {
      title: "BODYSLAM 25th Anniversary",
      artist: "BODYSLAM",
      venue: "อิมแพ็ค อารีน่า เมืองทองธานี",
      date: new Date("2026-09-20T18:30:00"),
      description:
        "ฉลองครบรอบ 25 ปี กับโชว์สุดยิ่งใหญ่ตลอดทั้งคืน ห้ามพลาด",
      imageUrl:
        "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
      zones: {
        create: [
          { name: "Front Row", price: 6000, rows: 4, seatsPerRow: 12 },
          { name: "Center", price: 4000, rows: 8, seatsPerRow: 14 },
          { name: "Side", price: 2500, rows: 10, seatsPerRow: 14 },
        ],
      },
    },
  });

  await prisma.concert.create({
    data: {
      title: "Coldplay Music of the Spheres",
      artist: "Coldplay",
      venue: "Rajamangala National Stadium",
      date: new Date("2026-11-05T19:30:00"),
      description:
        "Music of the Spheres World Tour กลับมาอีกครั้งในกรุงเทพฯ",
      imageUrl:
        "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200",
      zones: {
        create: [
          { name: "Diamond", price: 12000, rows: 5, seatsPerRow: 10 },
          { name: "Gold", price: 8000, rows: 8, seatsPerRow: 12 },
          { name: "Silver", price: 4500, rows: 12, seatsPerRow: 14 },
        ],
      },
    },
  });

  console.log("Seed complete.");
  console.log("Admin: admin@demo.com / admin1234");
  console.log("User:  user@demo.com  / user1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
