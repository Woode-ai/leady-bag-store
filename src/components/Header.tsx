// src/components/Header.tsx
"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { ShoppingBag, Heart, User, Search, Globe, LogOut, Bell, Sparkles, Check, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

export default function Header() {
  const { t, lang, toggleLang, user, logout, cartCount } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // حالة الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    async function loadNotifications() {
      try {
        const data = await apiClient("/notifications");
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch {
        // إذا لم يكن مسار الإشعارات جاهزاً بعد
      }
    }
    loadNotifications();
  }, [user]);

  async function markAllAsRead() {
    try {
      await apiClient("/notifications/read-all", { method: "PATCH" });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  return (
    <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* الشعار */}
        <Link href="/" className="text-2xl font-black text-primary tracking-tight shrink-0 flex items-center gap-1.5">
          <span>leadybag</span>
          <span className="w-2 h-2 rounded-full bg-primary animate-ping inline-block"></span>
        </Link>

        {/* روابط التنقل الرئيسية */}
        <nav className="hidden lg:flex items-center gap-6 ms-4">
          <Link href="/products" className="text-sm font-semibold text-secondary hover:text-primary transition-colors">
            {t("products")}
          </Link>
          <Link
            href="/looks"
            className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 bg-rose-50 px-3 py-1 rounded-full border border-rose-100 transition-all hover:scale-105"
          >
            <Sparkles size={14} />
            <span>تنسيق الإطلالة (Looks)</span>
          </Link>
        </nav>

        {/* شريط البحث */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden sm:flex ms-auto lg:ms-6">
          <div className="relative w-full">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === "ar" ? "ابحثي باسم المنتج..." : "Search by product name..."}
              className="w-full bg-gray-50/80 border border-gray-200 rounded-full py-2 px-4 pe-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
            />
            <button type="submit" className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors">
              <Search size={17} />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-3 ms-auto">
          {/* تبديل اللغة */}
          <button
            onClick={toggleLang}
            className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-primary px-2.5 py-1.5 rounded-full hover:bg-gray-50 transition-all"
            title={lang === "ar" ? "Switch to English" : "التبديل للعربية"}
          >
            <Globe size={16} />
            <span>{lang === "ar" ? "EN" : "AR"}</span>
          </button>

          {/* جرس الإشعارات الذكي */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-secondary hover:text-primary p-1.5 rounded-full hover:bg-gray-50 transition-colors"
                title="الإشعارات والتنبيهات"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 end-0 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* القائمة المنسدلة للإشعارات */}
              {showNotifications && (
                <div className="absolute end-0 mt-3 w-80 sm:w-96 bg-white border border-gray-100 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-2">
                    <h3 className="font-bold text-secondary text-sm flex items-center gap-1.5">
                      <Bell size={16} className="text-primary" /> الإشعارات والتنبيهات
                    </h3>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-[11px] text-primary font-semibold hover:underline flex items-center gap-1"
                      >
                        <Check size={12} /> قراءة الكل
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-center text-gray-400 text-xs py-8">لا توجد إشعارات جديدة حالياً</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          className={`p-3 rounded-2xl text-xs transition-colors ${
                            n.isRead ? "bg-gray-50/50 text-gray-600" : "bg-rose-50/60 border border-rose-100 text-secondary font-medium"
                          }`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold">{n.title}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(n.createdAt).toLocaleDateString("ar-SD")}
                            </span>
                          </div>
                          <p className="text-gray-600 text-[11px] leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <Link href="/wishlist" className="text-secondary hover:text-primary p-1.5 rounded-full hover:bg-gray-50 transition-colors" title={t("wishlist")}>
            <Heart size={20} />
          </Link>

          <Link href="/cart" className="relative text-secondary hover:text-primary p-1.5 rounded-full hover:bg-gray-50 transition-colors" title={t("cart")}>
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute top-0 end-0 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-xs">
                {cartCount}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1 ps-2 border-s border-gray-200">
              <Link
                href="/account"
                className="flex items-center gap-1 text-xs font-semibold text-secondary hover:text-primary bg-gray-50 px-3 py-1.5 rounded-full hover:bg-primary/10 transition-colors"
                title={t("myAccount")}
              >
                <User size={16} />
                <span className="max-w-[80px] truncate">{user.name.split(" ")[0]}</span>
              </Link>
              <button
                onClick={logout}
                className="text-gray-400 hover:text-rose-600 p-1.5 rounded-full hover:bg-rose-50 transition-colors"
                title={t("logout")}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold bg-primary text-white px-5 py-2 rounded-full hover:bg-primary/95 shadow-md shadow-primary/20 transition-all hover:scale-105"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


