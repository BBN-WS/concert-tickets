"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatTHB } from "@/lib/format";

export function CheckoutForm({
  bookingId,
  amount,
}: {
  bookingId: string;
  amount: number;
}) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    // mock delay — feels like a real payment
    await new Promise((r) => setTimeout(r, 800));
    const res = await fetch(`/api/bookings/${bookingId}/pay`, {
      method: "POST",
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "การชำระเงินล้มเหลว");
      return;
    }
    router.push(`/tickets?paid=${bookingId}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-xl bg-neutral-900 border border-neutral-800 p-5 space-y-3"
    >
      <h2 className="font-bold mb-1">ข้อมูลบัตรเครดิต (จำลอง)</h2>
      <p className="text-xs text-neutral-500 mb-3">
        นี่คือระบบสาธิต ไม่มีการตัดเงินจริง
      </p>
      <div>
        <label className="block text-xs mb-1 text-neutral-400">หมายเลขบัตร</label>
        <input
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
          className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none font-mono"
        />
      </div>
      <div>
        <label className="block text-xs mb-1 text-neutral-400">ชื่อบนบัตร</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="JOHN DOE"
          className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none uppercase"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1 text-neutral-400">วันหมดอายุ</label>
          <input
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs mb-1 text-neutral-400">CVC</label>
          <input
            value={cvc}
            onChange={(e) => setCvc(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 font-medium"
      >
        {loading ? "กำลังประมวลผล..." : `ชำระเงิน ${formatTHB(amount)}`}
      </button>
    </form>
  );
}
