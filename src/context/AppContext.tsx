"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { translations, Lang, TranslationKey } from "@/lib/i18n";
import { apiClient } from "@/lib/apiClient";

interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  emailVerified?: boolean;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("ar");
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang") as Lang | null;
    if (savedLang === "ar" || savedLang === "en") setLang(savedLang);

    // The session cookie is HttpOnly and cannot be read from JavaScript.
    // Ask the server who the current user is instead of trusting localStorage.
    apiClient("/auth/me")
      .then((data) => {
        const nextUser: User = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          emailVerified: data.user.emailVerified,
        };
        setUser(nextUser);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => setAuthLoading(false));
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  useEffect(() => {
    if (user) refreshCartCount();
    else setCartCount(0);
  }, [user]);

  function toggleLang() {
    setLang((prev) => (prev === "ar" ? "en" : "ar"));
  }

  function t(key: TranslationKey): string {
    return translations[lang][key] || key;
  }

  function login(newUser: User) {
    setUser(newUser);
  }

  async function logout() {
    try {
      await apiClient("/auth/logout", { method: "POST" });
    } catch {
      // Clear local UI state even if the server-side request fails.
    } finally {
      setUser(null);
      setCartCount(0);
    }
  }

  async function refreshCartCount() {
    try {
      const data = await apiClient("/cart");
      const count = data.cart.items.reduce(
        (sum: number, item: any) => sum + item.quantity,
        0
      );
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  }

  async function refreshUser() {
    try {
      const data = await apiClient("/auth/me");
      setUser({
        id: data.user._id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        emailVerified: data.user.emailVerified,
      });
    } catch {
      setUser(null);
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
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp يجب أن يُستخدم داخل AppProvider");
  }
  return context;
}


