import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: NextRequest,
  ctx: RouteContext<"/api/bookings/[id]/cancel">,
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
  if (booking.status !== "PENDING") {
    return NextResponse.json(
      { error: "ยกเลิกได้เฉพาะรายการที่ยังไม่ได้ชำระเงิน" },
      { status: 400 },
    );
  }
  await prisma.$transaction([
    prisma.bookedSeat.deleteMany({ where: { bookingId: id } }),
    prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    }),
  ]);
  return NextResponse.json({ ok: true });
}
