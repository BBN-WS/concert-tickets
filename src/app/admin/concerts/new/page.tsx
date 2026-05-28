import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { NewConcertForm } from "@/components/NewConcertForm";

export default async function NewConcertPage() {
  const session = await getSession();
  if (!session) redirect("/login?callbackUrl=/admin/concerts/new");
  if (session.user.role !== "ADMIN") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-2">ไม่อนุญาต</h1>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-6">เพิ่มคอนเสิร์ตใหม่</h1>
      <NewConcertForm />
    </div>
  );
}
