import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  concertId: z.string().min(1),
  seats: z
    .array(
      z.object({
        zoneId: z.string().min(1),
        row: z.number().int().min(1),
        number: z.number().int().min(1),
      }),
    )
    .min(1)
    .max(6),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  }
  const { concertId, seats } = parsed.data;

  const concert = await prisma.concert.findUnique({
    where: { id: concertId },
    include: { zones: true },
  });
  if (!concert) {
    return NextResponse.json({ error: "ไม่พบคอนเสิร์ต" }, { status: 404 });
  }

  // validate seats are inside their zone
  for (const s of seats) {
    const z = concert.zones.find((z) => z.id === s.zoneId);
    if (!z) {
      return NextResponse.json(
        { error: "พบโซนที่ไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    if (s.row < 1 || s.row > z.rows || s.number < 1 || s.number > z.seatsPerRow) {
      return NextResponse.json(
        { error: "ที่นั่งอยู่นอกผังของโซน" },
        { status: 400 },
      );
    }
  }

  const totalAmount = seats.reduce((sum, s) => {
    const z = concert.zones.find((z) => z.id === s.zoneId)!;
    return sum + z.price;
  }, 0);

  try {
    const booking = await prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          userId: session.user.id,
          concertId,
          totalAmount,
        },
      });
      for (const s of seats) {
        await tx.bookedSeat.create({
          data: {
            bookingId: created.id,
            zoneId: s.zoneId,
            row: s.row,
            number: s.number,
          },
        });
      }
      return created;
    });
    return NextResponse.json({ booking });
  } catch (e: unknown) {
    const code = (e as { code?: string }).code;
    if (code === "P2002") {
      return NextResponse.json(
        { error: "ที่นั่งบางตัวถูกจองไปแล้ว กรุณาเลือกใหม่" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
