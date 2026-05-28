import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatTHB, formatThaiDate } from "@/lib/format";
import { CancelButton } from "@/components/CancelButton";

export const dynamic = "force-dynamic";

export default async function MyTicketsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/tickets");
  }
  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id, status: { in: ["PENDING", "PAID"] } },
    orderBy: { createdAt: "desc" },
    include: {
      concert: true,
      seats: { include: { zone: true } },
    },
  });

  const qrByBooking: Record<string, string> = {};
  for (const b of bookings) {
    if (b.status === "PAID") {
      const payload = JSON.stringify({
        bookingId: b.id,
        concert: b.concert.title,
        seats: b.seats.map((s) => `${s.zone.name}/R${s.row}/N${s.number}`),
      });
      qrByBooking[b.id] = await QRCode.toDataURL(payload, {
        margin: 1,
        scale: 6,
      });
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">บัตรของฉัน</h1>
      {bookings.length === 0 && (
        <p className="text-neutral-500">
          ยังไม่มีการจองในระบบ ลองดู
          คอนเสิร์ตที่หน้าแรกได้เลย
        </p>
      )}
      <div className="space-y-5">
        {bookings.map((b) => (
          <article
            key={b.id}
            id={`booking-${b.id}`}
            className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden"
          >
            <div className="grid md:grid-cols-[1fr_220px]">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-fuchsia-400 text-sm">
                      {b.concert.artist}
                    </p>
                    <h3 className="font-bold text-lg">{b.concert.title}</h3>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      b.status === "PAID"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-amber-500/20 text-amber-300"
                    }`}
                  >
                    {b.status === "PAID" ? "ชำระแล้ว" : "รอชำระเงิน"}
                  </span>
                </div>
                <div className="text-sm text-neutral-400 mb-1">
                  {formatThaiDate(b.concert.date)}
                </div>
                <div className="text-sm text-neutral-400 mb-3">
                  {b.concert.venue}
                </div>
                <ul className="space-y-1 text-sm mb-3">
                  {b.seats.map((s) => (
                    <li key={s.id}>
                      <span className="text-fuchsia-400">{s.zone.name}</span> ·
                      แถว {s.row} ที่ {s.number} ·{" "}
                      <span className="text-neutral-400">
                        {formatTHB(s.zone.price)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="text-sm">
                  รวม:{" "}
                  <span className="font-bold text-fuchsia-400">
                    {formatTHB(b.totalAmount)}
                  </span>
                </div>
                {b.status === "PENDING" && (
                  <div className="flex gap-2 mt-3">
                    <a
                      href={`/checkout/${b.id}`}
                      className="px-3 py-1.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-sm font-medium"
                    >
                      ชำระเงิน
                    </a>
                    <CancelButton bookingId={b.id} />
                  </div>
                )}
              </div>
              <div className="bg-neutral-950 border-t md:border-t-0 md:border-l border-dashed border-neutral-700 p-5 flex flex-col items-center justify-center">
                {b.status === "PAID" && qrByBooking[b.id] ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrByBooking[b.id]}
                      alt="QR ticket"
                      className="w-40 h-40 rounded bg-white p-2"
                    />
                    <p className="text-xs text-neutral-500 mt-2">
                      แสดง QR ที่หน้างาน
                    </p>
                  </>
                ) : (
                  <div className="w-40 h-40 rounded border border-dashed border-neutral-700 flex items-center justify-center text-xs text-neutral-500 text-center px-3">
                    QR จะปรากฏหลังชำระเงิน
                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
