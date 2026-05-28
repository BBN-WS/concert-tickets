"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ZoneInput = { name: string; price: number; rows: number; seatsPerRow: number };

export function NewConcertForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [venue, setVenue] = useState("");
  const [date, setDate] = useState("");
  const [imageUrl, setImageUrl] = useState(
    "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=1200",
  );
  const [description, setDescription] = useState("");
  const [zones, setZones] = useState<ZoneInput[]>([
    { name: "VIP", price: 5000, rows: 5, seatsPerRow: 10 },
    { name: "Standard", price: 2500, rows: 10, seatsPerRow: 12 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function updateZone(idx: number, patch: Partial<ZoneInput>) {
    setZones((prev) => prev.map((z, i) => (i === idx ? { ...z, ...patch } : z)));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/concerts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        artist,
        venue,
        date: new Date(date).toISOString(),
        imageUrl,
        description,
        zones,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "บันทึกล้มเหลว");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-xl bg-neutral-900 border border-neutral-800 p-6"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">ชื่อคอนเสิร์ต</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">ศิลปิน</label>
          <input
            required
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">สถานที่</label>
          <input
            required
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">วันที่และเวลา</label>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm mb-1">URL รูปปก</label>
        <input
          required
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-sm mb-1">รายละเอียด</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">โซนที่นั่ง</label>
          <button
            type="button"
            onClick={() =>
              setZones((p) => [
                ...p,
                { name: "", price: 1000, rows: 5, seatsPerRow: 10 },
              ])
            }
            className="text-xs px-2 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
          >
            + เพิ่มโซน
          </button>
        </div>
        <div className="space-y-2">
          {zones.map((z, i) => (
            <div
              key={i}
              className="grid grid-cols-[1fr_100px_80px_80px_auto] gap-2 items-center"
            >
              <input
                placeholder="ชื่อโซน"
                value={z.name}
                onChange={(e) => updateZone(i, { name: e.target.value })}
                className="px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-sm"
              />
              <input
                type="number"
                placeholder="ราคา"
                value={z.price}
                onChange={(e) => updateZone(i, { price: +e.target.value })}
                className="px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-sm"
              />
              <input
                type="number"
                placeholder="แถว"
                value={z.rows}
                onChange={(e) => updateZone(i, { rows: +e.target.value })}
                className="px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-sm"
              />
              <input
                type="number"
                placeholder="ที่/แถว"
                value={z.seatsPerRow}
                onChange={(e) =>
                  updateZone(i, { seatsPerRow: +e.target.value })
                }
                className="px-3 py-2 rounded bg-neutral-950 border border-neutral-700 text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setZones((p) => p.filter((_, idx) => idx !== i))
                }
                disabled={zones.length === 1}
                className="text-xs px-2 py-1 rounded bg-red-600/20 text-red-300 hover:bg-red-600/40 disabled:opacity-40"
              >
                ลบ
              </button>
            </div>
          ))}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          ราคา (บาท), แถว, ที่นั่ง/แถว
        </p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 font-medium"
      >
        {loading ? "กำลังบันทึก..." : "บันทึกคอนเสิร์ต"}
      </button>
    </form>
  );
}
