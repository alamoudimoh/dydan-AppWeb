import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

/* ─────────────────────────────────────────────
   ThemeContext — production pattern
   brand : "dydan" | "sovereign"  (identity + token set)
   mode  : "light"  | "dark"       (follows brand by default)
   Also carries product-lens (view) and persona so the
   whole product state lives behind stable hooks.
───────────────────────────────────────────── */

export type Brand = "dydan" | "sovereign";
export type Mode = "light" | "dark";
export type View = "quest" | "focus";
export type Persona = "parent" | "child" | "solo";

interface ThemeState {
  brand: Brand;
  setBrand: (b: Brand) => void;
  mode: Mode;
  setMode: (m: Mode) => void;
  view: View;
  setView: (v: View) => void;
  persona: Persona;
  setPersona: (p: Persona) => void;
}

const ThemeCtx = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [brand, setBrandState] = useState<Brand>("dydan");
  const [mode, setMode] = useState<Mode>("light");
  const [view, setView] = useState<View>("focus");
  const [persona, setPersonaState] = useState<Persona>("parent");

  /* Sovereign is a dark-native identity; dydan is light-native. */
  const setBrand = useCallback((b: Brand) => {
    setBrandState(b);
    setMode(b === "sovereign" ? "dark" : "light");
  }, []);

  /* Children only ever see the Quest lens. */
  const setPersona = useCallback((p: Persona) => {
    setPersonaState(p);
    setView(p === "child" ? "quest" : "focus");
  }, []);

  /* Drive the CSS token set + Joy color scheme. */
  useEffect(() => {
    const html = document.documentElement;
    document.body.classList.add("theme-transitioning");
    if (brand === "sovereign") html.setAttribute("data-theme", "sovereign");
    else html.removeAttribute("data-theme");
    html.setAttribute("data-joy-color-scheme", mode);
    const t = setTimeout(() => document.body.classList.remove("theme-transitioning"), 350);
    return () => clearTimeout(t);
  }, [brand, mode]);

  return (
    <ThemeCtx.Provider value={{ brand, setBrand, mode, setMode, view, setView, persona, setPersona }}>
      {children}
    </ThemeCtx.Provider>
  );
}

function useThemeState() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("Theme hooks must be used within <ThemeProvider>");
  return ctx;
}

/* Production-style granular hooks */
export function useProductBrand() {
  const { brand, setBrand } = useThemeState();
  return { brand, setBrand };
}
export function useProductTheme() {
  const { mode, setMode } = useThemeState();
  return { mode, setMode };
}
export function useProductView() {
  const { view, setView } = useThemeState();
  return { view, setView };
}
export function useProductPersona() {
  const { persona, setPersona } = useThemeState();
  return { persona, setPersona };
}
