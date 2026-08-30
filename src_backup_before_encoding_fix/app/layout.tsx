// src/app/layout.tsx
// Ø§Ù„Ø¢Ù† Ø§Ù„Ù€ Layout ÙŠØ¶Ù…: AppProvider (Ø§Ù„Ù„ØºØ© + Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…)ØŒ HeaderØŒ Footer
// ÙˆÙ‡Ø°Ø§ ÙŠØ¸Ù‡Ø± ÙÙŠ ÙƒÙ„ ØµÙØ­Ø§Øª Ø§Ù„Ù…ÙˆÙ‚Ø¹ Ø¨Ø¯ÙˆÙ† ØªÙƒØ±Ø§Ø± Ø§Ù„ÙƒÙˆØ¯

import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "leadybag",
  description: "leadybag -  ÙƒÙ„ Ù…Ø§ ØªØ­ØªØ§Ø¬Ù‡ Ø§Ù„Ù…Ø±Ø£Ø© Ø§Ù„Ø¹ØµØ±ÙŠÙ‡ ÙÙ‰ Ù…ÙƒØ§Ù† ÙˆØ§Ø­Ø¯ Ù„Ùƒ ÙÙ‚Ø· ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>
        <AppProvider>
          <Header />
          <div className="min-h-[70vh]">{children}</div>
          <Footer />
          <ChatWidget />
          <WhatsAppButton />
        </AppProvider>
      </body>
    </html>
  );
}


