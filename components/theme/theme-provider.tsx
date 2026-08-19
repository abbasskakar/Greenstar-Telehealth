"use client";

import * as React from "react";

type Theme = "light" | "dark";
type ThemeContext = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const Ctx = React.createContext<ThemeContext | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  // On mount, adopt the theme the pre-hydration script already applied to
  // <html> (from localStorage / system) in a single pass — no light→dark flash.
  React.useEffect(() => {
    const stored = localStorage.getItem("gs-theme") as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = React.useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("gs-theme", t);
  }, []);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === "dark" ? "light" : "dark") }),
    [theme, setTheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/** Inline script to set the theme before hydration (prevents flash). */
export const themeInitScript = `(function(){try{var t=localStorage.getItem('gs-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`;
