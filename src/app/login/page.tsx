"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">เข้าสู่ระบบ</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">อีเมล</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">รหัสผ่าน</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none"
          />
        </div>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 font-medium"
        >
          {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
        </button>
      </form>
      <p className="mt-4 text-sm text-neutral-400">
        ยังไม่มีบัญชี?{" "}
        <Link href="/register" className="text-fuchsia-400 hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
      <div className="mt-6 p-3 rounded bg-neutral-900 border border-neutral-800 text-xs text-neutral-400">
        <p className="font-medium text-neutral-300 mb-1">บัญชีทดสอบ:</p>
        <p>admin@demo.com / admin1234 (admin)</p>
        <p>user@demo.com / user1234 (ผู้ใช้)</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">กำลังโหลด...</div>}>
      <LoginForm />
    </Suspense>
  );
}
