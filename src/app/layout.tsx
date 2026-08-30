// src/app/layout.tsx
// الآن الـ Layout يضم: AppProvider (اللغة + المستخدم)، Header، Footer
// وهذا يظهر في كل صفحات الموقع بدون تكرار الكود

import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/ChatWidget";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata: Metadata = {
  title: "leadybag",
  description: "leadybag -  كل ما تحتاجه المرأة العصريه فى مكان واحد لك فقط ",
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


