import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ChatBox, type ChatMessage } from "@/components/ChatBox";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?callbackUrl=/chat");
  }
  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  const initialMessages: ChatMessage[] = messages.map((m) => ({
    id: m.id,
    sender: m.sender,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-1">แชตกับทีมงาน</h1>
      <p className="text-neutral-500 text-sm mb-6">
        สอบถามเรื่องการจองบัตร การชำระเงิน หรือที่นั่งได้ที่นี่
        ประวัติการสนทนาจะถูกบันทึกไว้ให้
      </p>
      <ChatBox initialMessages={initialMessages} />
    </div>
  );
}
