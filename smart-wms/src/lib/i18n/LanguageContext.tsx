"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { en } from "./en";
import { vi } from "./vi";

type Language = "en" | "vi";
type Translations = typeof en;

interface LanguageContextProps {
  language: Language;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en");

  useEffect(() => {
    const stored = localStorage.getItem("app_lang") as Language;
    if (stored === "en" || stored === "vi") {
      setLanguage(stored);
    } else {
      // Auto-detect based on browser if not stored
      if (navigator.language.startsWith("vi")) {
        setLanguage("vi");
      }
    }
  }, []);

  const toggleLanguage = () => {
    const newLang = language === "en" ? "vi" : "en";
    setLanguage(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  const getTranslation = (path: string) => {
    const keys = path.split(".");
    const dict: any = language === "en" ? en : vi;
    
    let result = dict;
    for (const key of keys) {
      if (result && typeof result === "object" && key in result) {
        result = result[key];
      } else {
        return path; // fallback to key path if not found
      }
    }
    return typeof result === "string" ? result : path;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t: getTranslation }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
