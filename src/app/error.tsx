"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="text-3xl font-extrabold mb-3">เกิดข้อผิดพลาด</h1>
      <p className="text-neutral-400 mb-6">
        ขออภัย ระบบไม่สามารถโหลดหน้านี้ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-500"
      >
        ลองใหม่อีกครั้ง
      </button>
    </div>
  );
}
