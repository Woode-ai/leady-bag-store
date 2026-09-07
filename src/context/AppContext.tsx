// src/context/AppContext.tsx
"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { translations, Lang, TranslationKey } from "@/lib/i18n";
import { apiClient } from "@/lib/apiClient";
import { ToastProvider, useToast } from "@/components/Toast";

interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  emailVerified?: boolean;
  loyaltyPoints?: number;
}

export interface LocalCartItem {
  productId: string;
  quantity: number;
}

interface AppContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
  user: User | null;
  authLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  cartCount: number;
  refreshCartCount: () => Promise<void>;
  refreshUser: () => Promise<void>;
  addToCartLocal: (productId: string, quantity?: number) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function AppProviderContent({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  // مزامنة السلة المحفوظة محلياً عند تسجيل الدخول
  const syncLocalCartWithServer = useCallback(async () => {
    try {
      const savedLocalCart = localStorage.getItem("leadybag_local_cart");
      if (!savedLocalCart) return;

      const items: LocalCartItem[] = JSON.parse(savedLocalCart);
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          try {
            await apiClient("/cart", {
              method: "POST",
              body: JSON.stringify({ productId: item.productId, quantity: item.quantity }),
            });
          } catch {
            // تجاهل أخطاء المنتجات الفردية أثناء المزامنة
          }
        }
        localStorage.removeItem("leadybag_local_cart");
      }
    } catch (e) {
      console.error("Local cart sync error:", e);
    }
  }, []);

  const refreshCartCount = useCallback(async () => {
    try {
      if (user) {
        const data = await apiClient("/cart");
        const count = (data.cart?.items || []).reduce(
          (sum: number, item: any) => sum + (item.quantity || 0),
          0
        );
        setCartCount(count);
      } else {
        const saved = localStorage.getItem("leadybag_local_cart");
        if (saved) {
          const items: LocalCartItem[] = JSON.parse(saved);
          const count = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
          setCartCount(count);
        } else {
          setCartCount(0);
        }
      }
    } catch {
      setCartCount(0);
    }
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const data = await apiClient("/auth/me");
      const nextUser: User = {
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
        loyaltyPoints: data.user.loyaltyPoints || 0,
      };
      setUser(nextUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Lang | null;
    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);

    apiClient("/auth/me")
      .then(async (data) => {
        const nextUser: User = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
          loyaltyPoints: data.user.loyaltyPoints || 0,
        };
        setUser(nextUser);
        await syncLocalCartWithServer();
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, [syncLocalCartWithServer]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    refreshCartCount();
  }, [user, refreshCartCount]);

  function toggleLang() {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] || key;
  }

  async function login(newUser: User) {
    setUser(newUser);
    await syncLocalCartWithServer();
    await refreshCartCount();
  }

  async function logout() {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Clear UI state even if server fails
    } finally {
      setUser(null);
      setCartCount(0);
      localStorage.removeItem("leadybag_local_cart");
    }
  }

  // إضافة منتج للسلة مع دعم التخزين المحلي للزوار
  async function addToCartLocal(productId: string, quantity: number = 1) {
    if (user) {
      await apiClient("/cart", {
        method: "POST",
        body: JSON.stringify({ productId, quantity }),
      });
      await refreshCartCount();
    } else {
      let localCart: LocalCartItem[] = [];
      try {
        const saved = localStorage.getItem("leadybag_local_cart");
        if (saved) localCart = JSON.parse(saved);
      } catch {
        localCart = [];
      }

      const existingIndex = localCart.findIndex((i) => i.productId === productId);
      if (existingIndex >= 0) {
        localCart[existingIndex].quantity += quantity;
      } else {
        localCart.push({ productId, quantity });
      }

      localStorage.setItem("leadybag_local_cart", JSON.stringify(localCart));
      const count = localCart.reduce((sum, i) => sum + i.quantity, 0);
      setCartCount(count);
    }
  }

  return (
    <AppContext.Provider
      value={{
        lang,
        toggleLang,
        t,
        user,
        authLoading,
        login,
        logout,
        cartCount,
        refreshCartCount,
        refreshUser,
        addToCartLocal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <AppProviderContent>{children}</AppProviderContent>
    </ToastProvider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp يجب أن يُستخدم داخل AppProvider");
  }
  return context;
}
