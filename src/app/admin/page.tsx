import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatTHB, formatThaiDate } from "@/lib/format";
import { DeleteConcertButton } from "@/components/DeleteConcertButton";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">ไม่อนุญาต</h1>
        <p className="text-neutral-400">หน้านี้เฉพาะผู้ดูแลระบบ</p>
      </div>
    );
  }

  const concerts = await prisma.concert.findMany({
    orderBy: { date: "asc" },
    include: {
      zones: true,
      _count: { select: { bookings: true } },
    },
  });

  const totalRevenueAgg = await prisma.booking.aggregate({
    where: { status: "PAID" },
    _sum: { totalAmount: true },
  });
  const paidCount = await prisma.booking.count({ where: { status: "PAID" } });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link
          href="/admin/concerts/new"
          className="px-4 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-500 text-sm font-medium"
        >
          + เพิ่มคอนเสิร์ต
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">คอนเสิร์ตทั้งหมด</p>
          <p className="text-2xl font-bold">{concerts.length}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">บัตรที่ขายได้</p>
          <p className="text-2xl font-bold">{paidCount}</p>
        </div>
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-5">
          <p className="text-sm text-neutral-400 mb-1">รายได้รวม</p>
          <p className="text-2xl font-bold text-fuchsia-400">
            {formatTHB(totalRevenueAgg._sum.totalAmount ?? 0)}
          </p>
        </div>
      </div>

      <h2 className="text-lg font-bold mb-3">คอนเสิร์ตทั้งหมด</h2>
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-neutral-950 text-neutral-400">
            <tr>
              <th className="text-left p-3">คอนเสิร์ต</th>
              <th className="text-left p-3">วันที่</th>
              <th className="text-left p-3">โซน</th>
              <th className="text-right p-3">การจอง</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {concerts.map((c) => (
              <tr key={c.id} className="border-t border-neutral-800">
                <td className="p-3">
                  <p className="font-medium">{c.title}</p>
                  <p className="text-xs text-neutral-500">{c.artist}</p>
                </td>
                <td className="p-3 text-neutral-300">
                  {formatThaiDate(c.date)}
                </td>
                <td className="p-3 text-neutral-300">
                  {c.zones.length} โซน
                </td>
                <td className="p-3 text-right">{c._count.bookings}</td>
                <td className="p-3 text-right">
                  <DeleteConcertButton id={c.id} title={c.title} />
                </td>
              </tr>
            ))}
            {concerts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500">
                  ยังไม่มีคอนเสิร์ตในระบบ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
