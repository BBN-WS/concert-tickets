import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
try {
  const concerts = await prisma.concert.count();
  const users = await prisma.user.count();
  console.log(`OK concerts=${concerts} users=${users}`);
} catch (e) {
  console.error("ERR", e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
