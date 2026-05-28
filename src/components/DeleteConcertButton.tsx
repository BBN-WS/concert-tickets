"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteConcertButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (!confirm(`ลบคอนเสิร์ต "${title}"? การจองทั้งหมดจะถูกลบด้วย`)) return;
    setLoading(true);
    const res = await fetch(`/api/concerts/${id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) router.refresh();
    else alert("ลบไม่สำเร็จ");
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-3 py-1.5 rounded bg-red-600/20 text-red-300 hover:bg-red-600/40 text-xs disabled:opacity-50"
    >
      {loading ? "กำลังลบ..." : "ลบ"}
    </button>
  );
}
