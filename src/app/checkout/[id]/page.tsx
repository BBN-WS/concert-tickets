import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatTHB, formatThaiDate } from "@/lib/format";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session) {
    redirect(`/login?callbackUrl=/checkout/${id}`);
  }
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      concert: true,
      seats: { include: { zone: true } },
    },
  });
  if (!booking || booking.userId !== session.user.id) notFound();

  if (booking.status === "PAID") {
    redirect(`/tickets#booking-${booking.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">ชำระเงิน</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-5">
          <h2 className="font-bold mb-3">สรุปคำสั่งซื้อ</h2>
          <p className="text-fuchsia-400">{booking.concert.artist}</p>
          <p className="font-medium mb-1">{booking.concert.title}</p>
          <p className="text-sm text-neutral-400 mb-1">
            {formatThaiDate(booking.concert.date)}
          </p>
          <p className="text-sm text-neutral-400 mb-4">
            {booking.concert.venue}
          </p>
          <ul className="space-y-1 text-sm border-t border-neutral-800 pt-3">
            {booking.seats.map((s) => (
              <li key={s.id} className="flex justify-between">
                <span>
                  <span className="text-fuchsia-400">{s.zone.name}</span> · แถว{" "}
                  {s.row} ที่ {s.number}
                </span>
                <span>{formatTHB(s.zone.price)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between mt-3 pt-3 border-t border-neutral-800 font-bold">
            <span>รวมทั้งหมด</span>
            <span className="text-fuchsia-400">
              {formatTHB(booking.totalAmount)}
            </span>
          </div>
        </div>
        <CheckoutForm
          bookingId={booking.id}
          amount={booking.totalAmount}
        />
      </div>
    </div>
  );
}
