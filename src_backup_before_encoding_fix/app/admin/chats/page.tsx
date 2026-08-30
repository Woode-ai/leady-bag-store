// src/app/admin/chats/page.tsx
// Ù‚Ø§Ø¦Ù…Ø© ÙƒÙ„ Ø§Ù„Ø¹Ù…Ù„Ø§Ø¡ Ø§Ù„Ø°ÙŠÙ† Ø±Ø§Ø³Ù„ÙˆØ§ Ø§Ù„Ø¯Ø¹Ù…ØŒ Ù…Ø¹ Ù†Ø§ÙØ°Ø© Ø¯Ø±Ø¯Ø´Ø© Ù„ÙƒÙ„ ÙˆØ§Ø­Ø¯
// Ù‡Ø°Ø§ Ù‡Ùˆ "Ù…ÙƒØ§Ù†" Ø¥Ø¯Ø§Ø±Ø© Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø© Ù…Ù† Ø¬Ù‡Ø© Ø§Ù„Ø£Ø¯Ù…Ù†

"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useApp } from "@/context/AppContext";
import { apiClient } from "@/lib/apiClient";
import { Send, MessageCircle } from "lucide-react";

interface Room {
  roomId: string;
  customerName: string;
  customerEmail: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface ChatMessageItem {
  senderRole: "customer" | "admin";
  message: string;
  createdAt: string;
}

export default function AdminChatsPage() {
  const { user } = useApp();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loadingRooms, setLoadingRooms] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  // Ø§Ù„Ø£Ø¯Ù…Ù† ÙŠØªØµÙ„ Ø¨Ù€ Socket.io Ù…Ø±Ø© ÙˆØ§Ø­Ø¯Ø©ØŒ ÙˆÙŠÙ†Ø¶Ù… Ù„Ø£ÙŠ ØºØ±ÙØ© ÙŠÙØªØ­Ù‡Ø§
  useEffect(() => {
    if (!user) return;
    // Ù†Ø±Ø³Ù„ ØªÙˆÙƒÙ† Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¶Ù…Ù† auth Ù„ÙŠØªØ­Ù‚Ù‚ Ù…Ù†Ù‡ Ø§Ù„Ø³ÙŠØ±ÙØ± ÙˆÙŠØ³Ù…Ø­ Ù„Ù„Ø£Ø¯Ù…Ù† ÙÙ‚Ø· Ø¨Ø§Ù„Ø§Ù†Ø¶Ù…Ø§Ù… Ù„Ø£ÙŠ ØºØ±ÙØ©
    const socket = io({ path: "/socket.io", withCredentials: true });
    socketRef.current = socket;

    socket.on("receive_message", (data: any) => {
      setMessages((prev) => {
        // Ù†Ø¶ÙŠÙ Ø§Ù„Ø±Ø³Ø§Ù„Ø© ÙÙ‚Ø· Ø¥Ø°Ø§ ÙƒØ§Ù†Øª Ù„Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„Ù…ÙØªÙˆØ­Ø© Ø­Ø§Ù„ÙŠØ§Ù‹ Ø£Ù…Ø§Ù… Ø§Ù„Ø£Ø¯Ù…Ù†
        if (selectedRoom && data.roomId === selectedRoom.roomId) {
          return [...prev, { senderRole: data.senderRole, message: data.message, createdAt: data.createdAt }];
        }
        return prev;
      });
      loadRooms(); // Ù†Ø­Ø¯Ù‘Ø« Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª (Ø¢Ø®Ø± Ø±Ø³Ø§Ù„Ø©) Ø¹Ù†Ø¯ ÙˆØµÙˆÙ„ Ø£ÙŠ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø© Ù…Ù† Ø£ÙŠ Ø¹Ù…ÙŠÙ„
    });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom?.roomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadRooms() {
    try {
      const data = await apiClient("/chat");
      setRooms(data.rooms);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRooms(false);
    }
  }

  async function openRoom(room: Room) {
    setSelectedRoom(room);
    socketRef.current?.emit("join_room", room.roomId);
    try {
      const data = await apiClient(`/chat/${room.roomId}`);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !selectedRoom || !user) return;

    const messageText = input.trim();
    setInput("");

    try {
      await apiClient(`/chat/${selectedRoom.roomId}`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      });

      socketRef.current?.emit("send_message", {
        roomId: selectedRoom.roomId,
        senderId: user.id,
        senderRole: "admin",
        message: messageText,
      });

      setMessages((prev) => [
        ...prev,
        { senderRole: "admin", message: messageText, createdAt: new Date().toISOString() },
      ]);
    } catch (err) {
      console.error(err);
      setInput(messageText);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-secondary mb-6">Ø§Ù„Ø¯Ø±Ø¯Ø´Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[70vh]">
        {/* Ù‚Ø§Ø¦Ù…Ø© Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø§Øª */}
        <div className="border border-gray-200 rounded-xl overflow-y-auto">
          {loadingRooms ? (
            <p className="text-center text-gray-400 text-sm p-4">Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</p>
          ) : rooms.length === 0 ? (
            <p className="text-center text-gray-400 text-sm p-4">
              Ù„Ø§ ØªÙˆØ¬Ø¯ Ù…Ø­Ø§Ø¯Ø«Ø§Øª Ø¨Ø¹Ø¯ - Ø³ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ ÙÙˆØ± Ø£Ù† ÙŠØ±Ø§Ø³Ù„ Ø£ÙŠ Ø¹Ù…ÙŠÙ„ Ø§Ù„Ø¯Ø¹Ù… Ø¹Ø¨Ø± ÙÙ‚Ø§Ø¹Ø© Ø§Ù„Ø¯Ø±Ø¯Ø´Ø© ÙÙŠ Ø§Ù„Ù…ÙˆÙ‚Ø¹
            </p>
          ) : (
            rooms.map((room) => (
              <button
                key={room.roomId}
                onClick={() => openRoom(room)}
                className={`w-full text-start p-3 border-b border-gray-100 hover:bg-gray-50 ${
                  selectedRoom?.roomId === room.roomId ? "bg-primary/5" : ""
                }`}
              >
                <p className="font-medium text-secondary text-sm">{room.customerName}</p>
                <p className="text-xs text-gray-400 truncate">{room.lastMessage}</p>
              </button>
            ))
          )}
        </div>

        {/* Ù†Ø§ÙØ°Ø© Ø§Ù„Ù…Ø­Ø§Ø¯Ø«Ø© Ø§Ù„Ù…ÙØªÙˆØ­Ø© */}
        <div className="md:col-span-2 border border-gray-200 rounded-xl flex flex-col">
          {!selectedRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <MessageCircle size={40} />
              <p className="text-sm mt-2">Ø§Ø®ØªØ± Ù…Ø­Ø§Ø¯Ø«Ø© Ù…Ù† Ø§Ù„Ù‚Ø§Ø¦Ù…Ø©</p>
            </div>
          ) : (
            <>
              <div className="border-b border-gray-100 p-3">
                <p className="font-medium text-secondary text-sm">{selectedRoom.customerName}</p>
                <p className="text-xs text-gray-400">{selectedRoom.customerEmail}</p>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                      m.senderRole === "admin"
                        ? "bg-primary text-white ms-auto rounded-ee-none"
                        : "bg-gray-100 text-secondary me-auto rounded-es-none"
                    }`}
                  >
                    {m.message}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="border-t border-gray-100 p-2 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ø§ÙƒØªØ¨ Ø±Ø¯Ø§Ù‹..."
                  className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="bg-primary text-white rounded-full w-9 h-9 flex items-center justify-center shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


