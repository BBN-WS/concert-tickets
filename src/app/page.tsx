import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatTHB, formatThaiDate } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Home() {
  const concerts = await prisma.concert.findMany({
    orderBy: { date: "asc" },
    include: { zones: true },
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <section className="mb-10">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
          จองบัตร<span className="text-fuchsia-400">คอนเสิร์ต</span>โปรดของคุณ
        </h1>
        <p className="text-neutral-400">
          เลือกคอนเสิร์ต เลือกที่นั่ง ชำระเงิน รับ QR e-ticket ทันที
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold mb-4">คอนเสิร์ตที่กำลังจะมาถึง</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {concerts.map((c) => {
            const minPrice = Math.min(...c.zones.map((z) => z.price));
            return (
              <Link
                key={c.id}
                href={`/concerts/${c.id}`}
                className="group rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-fuchsia-500 transition"
              >
                <div className="aspect-[16/9] bg-neutral-800 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition"
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-fuchsia-400 mb-1">{c.artist}</p>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    {c.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-1">
                    {formatThaiDate(c.date)}
                  </p>
                  <p className="text-sm text-neutral-400 mb-3">{c.venue}</p>
                  <p className="text-sm">
                    เริ่มต้น{" "}
                    <span className="text-fuchsia-400 font-semibold">
                      {formatTHB(minPrice)}
                    </span>
                  </p>
                </div>
              </Link>
            );
          })}
          {concerts.length === 0 && (
            <p className="text-neutral-500">ยังไม่มีคอนเสิร์ตในระบบ</p>
          )}
        </div>
      </section>
    </div>
  );
}
