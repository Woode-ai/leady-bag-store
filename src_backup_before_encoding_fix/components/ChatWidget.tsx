// src/components/ChatWidget.tsx
// ÙÙ‚Ø§Ø¹Ø© Ø¯Ø±Ø¯Ø´Ø© Ø¹Ø§Ø¦Ù…Ø© ÙÙŠ Ø£Ø³ÙÙ„ Ø§Ù„Ø²Ø§ÙˆÙŠØ© - Ù‡Ø°Ø§ Ù‡Ùˆ "Ù…ÙƒØ§Ù†" Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© Ø§Ù„Ø°ÙŠ ÙƒØ§Ù† Ù…ÙÙ‚ÙˆØ¯Ø§Ù‹
// ÙŠØ¸Ù‡Ø± ÙÙ‚Ø· Ù„Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† Ø¯Ø®ÙˆÙ„Ù‡Ù… (Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠØ³ØªØ®Ø¯Ù… ØµÙØ­Ø© Ù…Ø®ØµØµØ© /admin/chats Ø¨Ø¯Ù„Ø§Ù‹ Ù…Ù†Ù‡)
//
// ÙƒÙŠÙ ØªØ¹Ù…Ù„: roomId = Ø±Ù‚Ù… Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù†ÙØ³Ù‡ (userId) - Ø¨Ù‡Ø°Ø§ Ù„ÙƒÙ„ Ø¹Ù…ÙŠÙ„ "ØºØ±ÙØ©" ÙˆØ§Ø­Ø¯Ø© Ø«Ø§Ø¨ØªØ© ÙŠØªØ­Ø¯Ø« ÙÙŠÙ‡Ø§ Ù…Ø¹ Ø§Ù„Ø¯Ø¹Ù…
// Ø¹Ù†Ø¯ ÙØªØ­ Ø§Ù„ÙÙ‚Ø§Ø¹Ø©: Ù†Ø¬Ù„Ø¨ Ø³Ø¬Ù„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„Ù‚Ø¯ÙŠÙ… Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª (GET /api/chat/:roomId)
// Ø«Ù… Ù†ØªØµÙ„ Ø¨Ù€ Socket.io Ù„Ù†Ø³ØªÙ‚Ø¨Ù„ Ø£ÙŠ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù„Ø­Ø¸ÙŠØ§Ù‹ Ø¨Ø¯ÙˆÙ† ØªØ­Ø¯ÙŠØ« Ø§Ù„ØµÙØ­Ø©

"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { MessageCircle, X, Send } from "lucide-react";

interface ChatMessageItem {
  senderRole: "customer" | "admin";
  message: string;
  createdAt: string;
}

export default function ChatWidget() {
  const { user, lang } = useApp();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ÙÙ‚Ø· Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ (ÙˆÙ„ÙŠØ³ Ø§Ù„Ø£Ø¯Ù…Ù†) ÙŠØ±ÙˆÙ† Ù‡Ø°Ù‡ Ø§Ù„ÙÙ‚Ø§Ø¹Ø© - Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠØ¯ÙŠØ± ÙƒÙ„ Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª Ù…Ù† /admin/chats
  const shouldShow = user && user.role === "customer";

  useEffect(() => {
    if (!shouldShow) return;

    // Ù†ØªØµÙ„ Ø¨Ù€ Socket.io Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø© ÙÙ‚Ø· Ø·Ø§Ù„Ù…Ø§ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ù…Ø³Ø¬Ù‘Ù„ Ø¯Ø®ÙˆÙ„Ù‡ (Ø¨ØºØ¶ Ø§Ù„Ù†Ø¸Ø± Ù‡Ù„ Ø§Ù„ÙÙ‚Ø§Ø¹Ø© Ù…ÙØªÙˆØ­Ø© Ø£Ù… Ù„Ø§)
    // Ø¨Ù‡Ø°Ø§ ÙŠØ³ØªÙ‚Ø¨Ù„ Ø¥Ø´Ø¹Ø§Ø±Ø§Ù‹ Ø­ØªÙ‰ Ù„Ùˆ ÙƒØ§Ù†Øª Ø§Ù„Ù†Ø§ÙØ°Ø© Ù…ØºÙ„Ù‚Ø© (ÙŠÙ…ÙƒÙ† ØªÙØ¹ÙŠÙ„ Ù†Ù‚Ø·Ø© Ø­Ù…Ø±Ø§Ø¡ Ù„Ø§Ø­Ù‚Ø§Ù‹ Ø¥Ù† Ø£Ø±Ø¯Øª)
    // Ù†Ø±Ø³Ù„ ØªÙˆÙƒÙ† Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¶Ù…Ù† auth Ù„ÙŠØªØ­Ù‚Ù‚ Ù…Ù†Ù‡ Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆÙŠÙ…Ù†Ø¹ Ø£ÙŠ Ø´Ø®Øµ ØºÙŠØ± Ù…ØµØ±Ø­ Ù„Ù‡ Ù…Ù† Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ù„ØºØ±Ù Ø§Ù„Ø¢Ø®Ø±ÙŠÙ†
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;
    socket.emit("join_room", user!.id);

    socket.on("receive_message", (data: any) => {
      if (data.roomId !== user!.id) return;
      setMessages((prev) => [
        ...prev,
        { senderRole: data.senderRole, message: data.message, createdAt: data.createdAt },
      ]);
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldShow, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function loadHistory() {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiClient(`/chat/${user.id}`);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleOpen() {
    setOpen(true);
    if (messages.length === 0) loadHistory();
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const messageText = input.trim();
    setInput("");

    try {
      // 1. Ù†Ø­ÙØ¸ Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙŠ Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª (Ù„ØªØ¨Ù‚Ù‰ ÙÙŠ Ø§Ù„Ø³Ø¬Ù„ Ø­ØªÙ‰ Ù„Ùˆ Ø£ØºÙ„Ù‚ Ø£Ø­Ø¯Ù‡Ù…Ø§ Ø§Ù„Ù…ØªØµÙØ­)
      await apiClient(`/chat/${user.id}`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });

      // 2. Ù†Ø¨Ø«Ù‘Ù‡Ø§ Ù„Ø­Ø¸ÙŠØ§Ù‹ Ø¹Ø¨Ø± Socket.io Ù„ÙŠØ±Ø§Ù‡Ø§ Ø§Ù„Ø£Ø¯Ù…Ù† ÙÙˆØ±Ø§Ù‹ Ø¥Ù† ÙƒØ§Ù† Ù…ØªØµÙ„Ø§Ù‹ Ø§Ù„Ø¢Ù†
      socketRef.current?.emit("send_message", {
        roomId: user.id,
        senderId: user.id,
        senderRole: "customer",
        message: messageText,
      });

      // Ù†Ø¶ÙŠÙÙ‡Ø§ Ù…Ø­Ù„ÙŠØ§Ù‹ ÙÙˆØ±Ø§Ù‹ Ù„Ø¸Ù‡ÙˆØ±Ù‡Ø§ ÙÙŠ Ù†Ø§ÙØ°ØªÙ†Ø§ Ù†Ø­Ù† Ø£ÙŠØ¶Ø§Ù‹ Ø¨Ø¯ÙˆÙ† Ø§Ù†ØªØ¸Ø§Ø±
      setMessages((prev) => [
        ...prev,
        { senderRole: "customer", message: messageText, createdAt: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error(err);
      setInput(messageText); // Ù†ÙØ±Ø¬Ø¹ Ø§Ù„Ù†Øµ Ù„Ù„Ø­Ù‚Ù„ Ø¥Ù† ÙØ´Ù„ Ø§Ù„Ø¥Ø±Ø³Ø§Ù„ Ø­ØªÙ‰ Ù„Ø§ ÙŠØ¶ÙŠØ¹ Ø¹Ù„Ù‰ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    }
  }

  if (!shouldShow) return null;

  return (
    <div className="fixed bottom-4 end-4 z-50">
      {open ? (
        <div className="w-80 h-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-primary text-white px-4 py-3 flex items-center justify-between">
            <span className="font-medium text-sm">
              {lang === "ar" ? "Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„Ù…Ø¨Ø§Ø´Ø±" : "Live Support"}
            </span>
            <button onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {loading ? (
              <p className="text-center text-xs text-gray-400 mt-4">
                {lang === "ar" ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„..." : "Loading..."}
              </p>
            ) : messages.length === 0 ? (
              <p className="text-center text-xs text-gray-400 mt-4">
                {lang === "ar" ? "Ø§Ø¨Ø¯Ø£ Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ø¹ ÙØ±ÙŠÙ‚ Ø§Ù„Ø¯Ø¹Ù…" : "Start a conversation with support"}
              </p>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    m.senderRole === "customer"
                      ? "bg-primary text-white ms-auto rounded-ee-none"
                      : "bg-gray-100 text-secondary me-auto rounded-es-none"
                  }`}
                >
                  {m.message}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-gray-100 p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === "ar" ? "Ø§ÙƒØªØ¨ Ø±Ø³Ø§Ù„Ø©..." : "Type a message..."}
              className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={handleOpen}
          className="bg-primary text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:opacity-90"
        >
          <MessageCircle size={24} />
        </button>
      )}
    </div>
  );
}


