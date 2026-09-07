// src/components/Header.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  ShoppingBag,
  Heart,
  User,
  Search,
  Globe,
  LogOut,
  Bell,
  Sparkles,
  Check,
  X,
  Loader2,
  Tag,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface SearchSuggestion {
  _id: string;
  name: { ar: string; en: string };
  price: number;
  discountPrice?: number;
  image: string | null;
  category?: { name: { ar: string; en: string }; slug: string } | null;
  inStock: boolean;
}

export default function Header() {
  const { t, lang, toggleLang, user, logout, cartCount } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const router = useRouter();
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // حالة الإشعارات
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // البحث الفوري مع Debounce
  useEffect(() => {
    if (!searchTerm.trim() || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient(`/products/search?q=${encodeURIComponent(searchTerm.trim())}&limit=6`);
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // إغلاق قائمة البحث عند النقر خارجها
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
      setShowDropdown(false);
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  }

  function handleSelectProduct(id: string) {
    setShowDropdown(false);
    setSearchTerm("");
    router.push(`/products/${id}`);
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

        {/* شريط البحث الفوري الذكي (Live Search) */}
        <div ref={searchContainerRef} className="flex-1 max-w-md hidden sm:block relative ms-auto lg:ms-6">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onFocus={() => {
                  if (suggestions.length > 0) setShowDropdown(true);
                }}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={lang === "ar" ? "ابحثي باسم الحقيبة أو المنتج..." : "Search handbags, products..."}
                className="w-full bg-gray-50/90 border border-gray-200 rounded-full py-2.5 px-4 pe-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all shadow-xs"
              />
              <div className="absolute end-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-gray-400">
                {isSearching ? (
                  <Loader2 size={16} className="animate-spin text-primary" />
                ) : searchTerm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      setSuggestions([]);
                      setShowDropdown(false);
                    }}
                    className="hover:text-gray-600"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <Search size={16} />
                )}
              </div>
            </div>
          </form>

          {/* القائمة المنسدلة لاقتراحات البحث الفوري */}
          {showDropdown && (searchTerm.trim().length >= 2 || suggestions.length > 0) && (
            <div className="absolute top-full mt-2 inset-x-0 bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-2.5 border-b border-gray-50 flex items-center justify-between text-xs text-gray-400 px-4">
                <span>{lang === "ar" ? "نتائج البحث المقترحة" : "Suggested Products"}</span>
                {suggestions.length > 0 && (
                  <span className="font-semibold text-primary">{suggestions.length} {lang === "ar" ? "منتجات" : "results"}</span>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                {isSearching && suggestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <span>{lang === "ar" ? "جاري البحث..." : "Searching..."}</span>
                  </div>
                ) : suggestions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400">
                    <p>{lang === "ar" ? "لم يتم العثور على منتجات مطابقة" : "No products found"}</p>
                    <button
                      onClick={handleSearch}
                      className="mt-2 text-primary font-semibold hover:underline"
                    >
                      {lang === "ar" ? "عرض جميع النتائج للبحث" : "View all search results"}
                    </button>
                  </div>
                ) : (
                  suggestions.map((item) => (
                    <div
                      key={item._id}
                      onClick={() => handleSelectProduct(item._id)}
                      className="p-3 hover:bg-rose-50/50 cursor-pointer transition-colors flex items-center gap-3.5 group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden relative shrink-0 border border-gray-100">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name[lang] || "Product"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] text-gray-300">
                            No Img
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-secondary truncate group-hover:text-primary transition-colors">
                            {item.name[lang] || item.name.ar}
                          </h4>
                          {item.category && (
                            <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full shrink-0">
                              {item.category.name[lang] || item.category.name.ar}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1">
                          {item.discountPrice ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-black text-primary">{item.discountPrice} SDG</span>
                              <span className="text-[10px] text-gray-400 line-through">{item.price} SDG</span>
                            </div>
                          ) : (
                            <span className="text-xs font-black text-primary">{item.price} SDG</span>
                          )}

                          {!item.inStock && (
                            <span className="text-[10px] text-rose-500 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                              {lang === "ar" ? "نفد المخزون" : "Out of stock"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {suggestions.length > 0 && (
                <button
                  onClick={handleSearch}
                  className="w-full py-2.5 bg-gray-50 text-center text-xs font-bold text-primary hover:bg-primary hover:text-white transition-colors border-t border-gray-100 flex items-center justify-center gap-1.5"
                >
                  <Search size={13} />
                  <span>{lang === "ar" ? "عرض كل النتائج" : "View all results"}</span>
                </button>
              )}
            </div>
          )}
        </div>

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
