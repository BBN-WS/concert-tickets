"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { formatTHB } from "@/lib/format";

type ZoneClient = {
  id: string;
  name: string;
  price: number;
  rows: number;
  seatsPerRow: number;
  booked: { row: number; number: number }[];
};

type Selected = { zoneId: string; row: number; number: number };

export function SeatPicker({
  concertId,
  zones,
}: {
  concertId: string;
  zones: ZoneClient[];
}) {
  const router = useRouter();
  const { status } = useSession();
  const [activeZoneId, setActiveZoneId] = useState(zones[0]?.id);
  const [selected, setSelected] = useState<Selected[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeZone = zones.find((z) => z.id === activeZoneId);

  const bookedSet = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const z of zones) {
      map.set(z.id, new Set(z.booked.map((s) => `${s.row}-${s.number}`)));
    }
    return map;
  }, [zones]);

  const selectedSet = useMemo(
    () => new Set(selected.map((s) => `${s.zoneId}-${s.row}-${s.number}`)),
    [selected],
  );

  const total = selected.reduce((sum, s) => {
    const z = zones.find((z) => z.id === s.zoneId);
    return sum + (z?.price ?? 0);
  }, 0);

  function toggleSeat(zoneId: string, row: number, number: number) {
    const key = `${zoneId}-${row}-${number}`;
    setSelected((prev) => {
      if (prev.some((s) => `${s.zoneId}-${s.row}-${s.number}` === key)) {
        return prev.filter((s) => `${s.zoneId}-${s.row}-${s.number}` !== key);
      }
      if (prev.length >= 6) return prev;
      return [...prev, { zoneId, row, number }];
    });
  }

  async function onCheckout() {
    if (selected.length === 0) return;
    setError(null);
    if (status !== "authenticated") {
      router.push(`/login?callbackUrl=/concerts/${concertId}`);
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ concertId, seats: selected }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "จองที่นั่งล้มเหลว");
      return;
    }
    const { booking } = await res.json();
    router.push(`/checkout/${booking.id}`);
  }

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {zones.map((z) => (
            <button
              key={z.id}
              onClick={() => setActiveZoneId(z.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition ${
                z.id === activeZoneId
                  ? "bg-fuchsia-600 border-fuchsia-500"
                  : "bg-neutral-950 border-neutral-700 hover:border-fuchsia-500"
              }`}
            >
              {z.name} · {formatTHB(z.price)}
            </button>
          ))}
        </div>

        <div className="rounded-lg bg-gradient-to-b from-fuchsia-500/10 to-transparent border border-fuchsia-500/30 text-center py-2 mb-6 text-sm text-fuchsia-300 font-medium">
          STAGE / เวที
        </div>

        {activeZone && (
          <div className="space-y-2 overflow-x-auto">
            {Array.from({ length: activeZone.rows }, (_, ri) => {
              const row = ri + 1;
              return (
                <div key={row} className="flex items-center gap-2">
                  <span className="w-6 text-xs text-neutral-500 text-right">
                    {row}
                  </span>
                  <div className="flex gap-1.5">
                    {Array.from({ length: activeZone.seatsPerRow }, (_, ni) => {
                      const number = ni + 1;
                      const seatKey = `${row}-${number}`;
                      const selKey = `${activeZone.id}-${row}-${number}`;
                      const isBooked = bookedSet
                        .get(activeZone.id)
                        ?.has(seatKey);
                      const isSelected = selectedSet.has(selKey);
                      return (
                        <button
                          key={number}
                          disabled={isBooked}
                          onClick={() =>
                            toggleSeat(activeZone.id, row, number)
                          }
                          title={`แถว ${row} ที่นั่ง ${number}`}
                          className={`w-7 h-7 rounded text-[10px] font-medium transition ${
                            isBooked
                              ? "bg-neutral-800 text-neutral-600 cursor-not-allowed"
                              : isSelected
                                ? "bg-fuchsia-500 text-white"
                                : "bg-neutral-700 hover:bg-fuchsia-600 text-neutral-200"
                          }`}
                        >
                          {number}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex gap-4 mt-6 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-neutral-700" /> ว่าง
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-fuchsia-500" /> เลือก
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-neutral-800" /> ถูกจองแล้ว
          </div>
        </div>
      </div>

      <aside className="rounded-xl bg-neutral-900 border border-neutral-800 p-5 h-fit lg:sticky lg:top-20">
        <h3 className="font-bold mb-3">ที่นั่งที่เลือก ({selected.length})</h3>
        {selected.length === 0 ? (
          <p className="text-sm text-neutral-500">
            ยังไม่มีที่นั่งที่เลือก (สูงสุด 6 ที่นั่ง)
          </p>
        ) : (
          <ul className="space-y-2 text-sm mb-4">
            {selected.map((s) => {
              const z = zones.find((z) => z.id === s.zoneId);
              return (
                <li
                  key={`${s.zoneId}-${s.row}-${s.number}`}
                  className="flex justify-between items-center"
                >
                  <span>
                    <span className="text-fuchsia-400">{z?.name}</span> · แถว{" "}
                    {s.row} ที่ {s.number}
                  </span>
                  <span className="text-neutral-400">
                    {formatTHB(z?.price ?? 0)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <div className="border-t border-neutral-800 pt-3 flex justify-between font-bold mb-4">
          <span>รวม</span>
          <span className="text-fuchsia-400">{formatTHB(total)}</span>
        </div>
        {error && (
          <p className="text-red-400 text-sm mb-3">{error}</p>
        )}
        <button
          disabled={selected.length === 0 || submitting}
          onClick={onCheckout}
          className="w-full py-2.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {submitting ? "กำลังจอง..." : "ดำเนินการชำระเงิน"}
        </button>
      </aside>
    </div>
  );
}
