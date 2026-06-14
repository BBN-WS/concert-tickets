"use client";

import { useEffect, useRef, useState } from "react";

export type ChatMessage = {
  id: string;
  sender: "USER" | "SUPPORT";
  content: string;
  createdAt: string;
};

function formatTime(iso: string) {
  return new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function ChatBox({ initialMessages }: { initialMessages: ChatMessage[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content || loading) return;
    setError(null);
    setLoading(true);
    setInput("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j.error ?? "ส่งข้อความไม่สำเร็จ");
      setInput(content);
      return;
    }
    const j = (await res.json()) as { messages: ChatMessage[] };
    setMessages((prev) => [...prev, ...j.messages]);
  }

  return (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden flex flex-col h-[70vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-neutral-500 text-sm text-center mt-8">
            ยังไม่มีข้อความ เริ่มแชตกับทีมงานได้เลย
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === "USER";
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "bg-fuchsia-600 text-white rounded-br-sm"
                    : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
                }`}
              >
                {!mine && (
                  <p className="text-xs font-medium text-fuchsia-300 mb-0.5">
                    ทีมงาน TicketBox
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    mine ? "text-fuchsia-200" : "text-neutral-500"
                  }`}
                >
                  {formatTime(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      {error && (
        <p className="px-4 text-red-400 text-sm pb-1">{error}</p>
      )}
      <form
        onSubmit={onSubmit}
        className="border-t border-neutral-800 p-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          maxLength={1000}
          className="flex-1 px-3 py-2 rounded bg-neutral-950 border border-neutral-700 focus:border-fuchsia-500 focus:outline-none text-sm"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length === 0}
          className="px-4 py-2 rounded bg-fuchsia-600 hover:bg-fuchsia-500 disabled:opacity-50 text-sm font-medium"
        >
          {loading ? "กำลังส่ง..." : "ส่ง"}
        </button>
      </form>
    </div>
  );
}
