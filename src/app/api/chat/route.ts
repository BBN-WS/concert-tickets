import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const schema = z.object({
  content: z.string().trim().min(1).max(1000),
});

// Canned Thai auto-replies from the support bot ("Slide Kruoop").
function supportReply(message: string): string {
  const text = message.toLowerCase();
  if (/(คืนเงิน|refund|ยกเลิก|cancel)/.test(text)) {
    return "การยกเลิกทำได้จากหน้า “บัตรของฉัน” เฉพาะรายการที่ยังไม่ได้ชำระเงินนะครับ หากชำระแล้วและต้องการคืนเงิน รบกวนแจ้งหมายเลขการจองมาได้เลยครับ";
  }
  if (/(ชำระ|จ่าย|payment|pay|บัตรเครดิต)/.test(text)) {
    return "นี่เป็นระบบสาธิตครับ สามารถใช้บัตรทดสอบ 4242 4242 4242 4242 ในหน้าชำระเงินได้เลย ไม่มีการตัดเงินจริงครับ";
  }
  if (/(ที่นั่ง|seat|โซน|zone)/.test(text)) {
    return "เลือกที่นั่งได้จากผังในหน้าคอนเสิร์ตเลยครับ ที่นั่งสีเทาคือถูกจองแล้ว เลือกได้สูงสุด 6 ที่นั่งต่อการจองครับ";
  }
  if (/(สวัสดี|hello|hi|หวัดดี)/.test(text)) {
    return "สวัสดีครับ ยินดีต้อนรับสู่ TicketBox มีอะไรให้ช่วยเรื่องการจองบัตรไหมครับ";
  }
  return "ขอบคุณที่ติดต่อทีมงาน TicketBox ครับ เราได้รับข้อความของคุณแล้ว เจ้าหน้าที่จะตอบกลับโดยเร็วที่สุดครับ";
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "ข้อความไม่ถูกต้อง" }, { status: 400 });
  }
  const { content } = parsed.data;

  const userMessage = await prisma.chatMessage.create({
    data: { userId: session.user.id, sender: "USER", content },
  });
  const reply = await prisma.chatMessage.create({
    data: {
      userId: session.user.id,
      sender: "SUPPORT",
      content: supportReply(content),
    },
  });

  return NextResponse.json({ messages: [userMessage, reply] });
}
