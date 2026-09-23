import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import "../i18n";

/* ─────────────────────────────────────────────
   LocalizationContext — language + direction
   Real RTL: mirrors layout via dir="rtl" and swaps
   Cairo as the Arabic-glyph fallback after Comfortaa.
───────────────────────────────────────────── */

export type Lang = "en" | "ar";

interface LocalizationState {
  lang: Lang;
  isRTL: boolean;
  setLang: (l: Lang) => void;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LocalizationCtx = createContext<LocalizationState | null>(null);

export function LocalizationProvider({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation();
  const [lang, setLangState] = useState<Lang>("en");
  const isRTL = lang === "ar";

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", isRTL ? "rtl" : "ltr");
    html.setAttribute("lang", lang);
    i18n.changeLanguage(lang);
  }, [lang, isRTL, i18n]);

  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const toggleLang = useCallback(() => setLangState(l => (l === "en" ? "ar" : "en")), []);

  return (
    <LocalizationCtx.Provider value={{ lang, isRTL, setLang, toggleLang, t }}>
      {children}
    </LocalizationCtx.Provider>
  );
}

export function useLocalization() {
  const ctx = useContext(LocalizationCtx);
  if (!ctx) throw new Error("useLocalization must be used within <LocalizationProvider>");
  return ctx;
}
