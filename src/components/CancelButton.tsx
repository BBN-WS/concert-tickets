"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm("ยกเลิกการจองนี้?")) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
    setLoading(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-sm disabled:opacity-50"
    >
      {loading ? "กำลังยกเลิก..." : "ยกเลิก"}
    </button>
  );
}
