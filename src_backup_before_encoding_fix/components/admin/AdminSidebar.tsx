// src/components/admin/AdminSidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderTree,
  Package,
  ShoppingCart,
  Ticket,
  ShieldCheck,
  MessageCircle,
  ArrowRight,
  Wallet,
  Settings,
  Sparkles,
  Gift,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Ø§Ù„Ø¥Ø­ØµØ§Ø¦ÙŠØ§Øª", icon: LayoutDashboard },
  { href: "/admin/categories", label: "Ø§Ù„Ø£Ù‚Ø³Ø§Ù…", icon: FolderTree },
  { href: "/admin/products", label: "Ø§Ù„Ù…Ù†ØªØ¬Ø§Øª", icon: Package },
  { href: "/admin/looks", label: "ØªÙ†Ø³ÙŠÙ‚ Ø§Ù„Ø¥Ø·Ù„Ø§Ù„Ø§Øª (Looks)", icon: Sparkles },
  { href: "/admin/orders", label: "Ø§Ù„Ø·Ù„Ø¨Ø§Øª ÙˆØ§Ù„Ù…Ø¯ÙÙˆØ¹Ø§Øª", icon: ShoppingCart },
  { href: "/admin/coupons", label: "Ø§Ù„ÙƒÙˆØ¨ÙˆÙ†Ø§Øª", icon: Ticket },
  { href: "/admin/payment-methods", label: "Ø·Ø±Ù‚ Ø§Ù„Ø¯ÙØ¹", icon: Wallet },
  { href: "/admin/chats", label: "Ø§Ù„Ø¯Ø±Ø¯Ø´Ø§Øª Ø§Ù„Ù…Ø¨Ø§Ø´Ø±Ø©", icon: MessageCircle },
  { href: "/admin/security", label: "Ø§Ù„Ø£Ù…Ø§Ù†", icon: ShieldCheck },
  { href: "/admin/settings", label: "Ø§Ù„Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª ÙˆØ§Ù„Ù…ÙƒØ§ÙØ¢Øª", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-secondary text-white min-h-screen p-4">
      <Link href="/" className="flex items-center gap-2 text-sm text-gray-300 mb-8 hover:text-white">
        <ArrowRight size={16} />
        Ø§Ù„Ø¹ÙˆØ¯Ø© Ù„Ù„Ù…ØªØ¬Ø±
      </Link>

      <p className="text-primary font-bold text-lg mb-6">Ù„ÙˆØ­Ø© ØªØ­ÙƒÙ… leadybag</p>

      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive ? "bg-primary text-white shadow-md shadow-primary/20" : "text-gray-300 hover:bg-white/10"
              }`}
            >
              <Icon size={18} />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}


