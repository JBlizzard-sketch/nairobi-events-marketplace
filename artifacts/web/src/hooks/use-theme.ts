import { useState, useEffect, useCallback } from "react";

type Theme = "light" | "dark";

const KEY = "nairobi_theme_v1";

function getPreferred(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === "light" || stored === "dark") return stored;
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) return "dark";
  } catch {}
  return "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const t = getPreferred();
    setThemeState(t);
    applyTheme(t);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    try { localStorage.setItem(KEY, t); } catch {}
    setThemeState(t);
    applyTheme(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
