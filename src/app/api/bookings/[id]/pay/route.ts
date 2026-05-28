import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]/pay">,
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking || booking.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.status === "PAID") {
    return NextResponse.json({ booking });
  }
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "การจองนี้ถูกยกเลิกแล้ว" }, { status: 400 });
  }
  const updated = await prisma.booking.update({
    where: { id },
    data: { status: "PAID", paidAt: new Date() },
  });
  return NextResponse.json({ booking: updated });
}
