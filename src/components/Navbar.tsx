"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session, status } = useSession();
  const user = session?.user;

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl tracking-tight">
          <span className="text-fuchsia-400">Ticket</span>Box
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-fuchsia-400">
            คอนเสิร์ต
          </Link>
          {status === "authenticated" && (
            <>
              <Link href="/tickets" className="hover:text-fuchsia-400">
                บัตรของฉัน
              </Link>
              <Link href="/chat" className="hover:text-fuchsia-400">
                แชต
              </Link>
              {user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="hover:text-fuchsia-400 text-fuchsia-300"
                >
                  Admin
                </Link>
              )}
              <span className="text-neutral-400 hidden sm:inline">
                สวัสดี, {user?.name}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700"
              >
                ออกจากระบบ
              </button>
            </>
          )}
          {status === "unauthenticated" && (
            <>
              <Link href="/login" className="hover:text-fuchsia-400">
                เข้าสู่ระบบ
              </Link>
              <Link
                href="/register"
                className="px-3 py-1.5 rounded bg-fuchsia-600 hover:bg-fuchsia-500"
              >
                สมัครสมาชิก
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
