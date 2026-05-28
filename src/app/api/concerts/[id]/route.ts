import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/concerts/[id]">,
) {
  const { id } = await ctx.params;
  const concert = await prisma.concert.findUnique({
    where: { id },
    include: {
      zones: {
        include: {
          bookedSeats: {
            where: {
              booking: { status: { in: ["PENDING", "PAID"] } },
            },
            select: { row: true, number: true, zoneId: true },
          },
        },
      },
    },
  });
  if (!concert) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ concert });
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/concerts/[id]">,
) {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  await prisma.concert.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
