import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "ohsheet_theme";

// Light unless this device has chosen otherwise. No system-preference
// sniffing on purpose: the choice is an explicit switch in Settings, so
// the app shouldn't quietly go dark on someone who never asked it to.
function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
  } catch {
    // localStorage unavailable (private window, blocked storage) — the
    // theme just won't be remembered between visits.
  }
  return "light";
}

// The whole app is built on CSS custom properties (--app-*), so a theme
// is nothing more than a data-theme attribute on <html>: everything
// re-colours off the :root[data-theme="dark"] block in index.css.
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    // Keeps the phone's own browser chrome (status bar, address bar) in
    // step with the page instead of leaving a light strip above a dark
    // app.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "dark" ? "#111214" : "#f5c945");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore — theme just won't persist across reloads
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
