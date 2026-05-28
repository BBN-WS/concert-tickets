import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const concerts = await prisma.concert.findMany({
    orderBy: { date: "asc" },
    include: { zones: true },
  });
  return NextResponse.json({ concerts });
}

const createSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  venue: z.string().min(1),
  date: z.string(),
  description: z.string().default(""),
  imageUrl: z.string().url(),
  zones: z
    .array(
      z.object({
        name: z.string().min(1),
        price: z.number().int().min(0),
        rows: z.number().int().min(1).max(40),
        seatsPerRow: z.number().int().min(1).max(40),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "ข้อมูลไม่ถูกต้อง", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const { zones, date, ...rest } = parsed.data;
  const concert = await prisma.concert.create({
    data: {
      ...rest,
      date: new Date(date),
      zones: { create: zones },
    },
    include: { zones: true },
  });
  return NextResponse.json({ concert });
}
