"use client";

import * as React from "react";

type Theme = "light" | "dark";
type ThemeContext = { theme: Theme; toggle: () => void; setTheme: (t: Theme) => void };

const Ctx = React.createContext<ThemeContext | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("light");

  React.useEffect(() => {
    const stored = localStorage.getItem("gs-theme") as Theme | null;
    const initial =
      stored ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    setThemeState(initial);
  }, []);

  const apply = React.useCallback((t: Theme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    localStorage.setItem("gs-theme", t);
  }, []);

  const setTheme = React.useCallback(
    (t: Theme) => {
      setThemeState(t);
      apply(t);
    },
    [apply],
  );

  React.useEffect(() => {
    apply(theme);
  }, [theme, apply]);

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
