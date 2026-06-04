import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatTHB, formatThaiDate } from "@/lib/format";
import { SeatPicker } from "@/components/SeatPicker";
import { getMockConcert } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

type ZoneForClient = {
  id: string;
  name: string;
  price: number;
  rows: number;
  seatsPerRow: number;
  booked: { row: number; number: number }[];
};

type ConcertView = {
  id: string;
  title: string;
  artist: string;
  venue: string;
  date: Date;
  description: string;
  imageUrl: string;
  zones: ZoneForClient[];
};

async function loadConcert(id: string): Promise<ConcertView | null> {
  try {
    const concert = await prisma.concert.findUnique({
      where: { id },
      include: {
        zones: {
          include: {
            bookedSeats: {
              where: { booking: { status: { in: ["PENDING", "PAID"] } } },
              select: { row: true, number: true, zoneId: true },
            },
          },
        },
      },
    });
    if (!concert) return null;
    return {
      ...concert,
      zones: concert.zones.map((z) => ({
        id: z.id,
        name: z.name,
        price: z.price,
        rows: z.rows,
        seatsPerRow: z.seatsPerRow,
        booked: z.bookedSeats.map((s) => ({ row: s.row, number: s.number })),
      })),
    };
  } catch (err) {
    // No database — serve static demo data so the page is browsable.
    console.error("Falling back to mock concert:", err);
    const mock = getMockConcert(id);
    if (!mock) return null;
    return {
      ...mock,
      zones: mock.zones.map((z) => ({ ...z, booked: [] })),
    };
  }
}

export default async function ConcertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const concert = await loadConcert(id);
  if (!concert) notFound();

  const zonesForClient = concert.zones;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_2fr] gap-8 mb-8">
        <div className="rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={concert.imageUrl}
            alt={concert.title}
            className="w-full aspect-[16/9] object-cover"
          />
        </div>
        <div>
          <p className="text-fuchsia-400 mb-1">{concert.artist}</p>
          <h1 className="text-3xl font-bold mb-3">{concert.title}</h1>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm text-neutral-300 mb-4">
            <span className="text-neutral-500">วันที่</span>
            <span>{formatThaiDate(concert.date)}</span>
            <span className="text-neutral-500">สถานที่</span>
            <span>{concert.venue}</span>
            <span className="text-neutral-500">ราคา</span>
            <span>
              {formatTHB(Math.min(...concert.zones.map((z) => z.price)))} —{" "}
              {formatTHB(Math.max(...concert.zones.map((z) => z.price)))}
            </span>
          </div>
          <p className="text-neutral-300 leading-relaxed">
            {concert.description}
          </p>
        </div>
      </div>

      <SeatPicker concertId={concert.id} zones={zonesForClient} />
    </div>
  );
}
