import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "ohsheet_theme";

// DARK MODE IS OFF FOR NOW — coming back later.
//
// The toggle has been taken out of Settings, so the app is pinned to the
// light theme here. A "dark" choice someone saved earlier is ignored AND
// cleared, otherwise they'd be stuck in a theme with no switch left to
// turn it off with.
//
// To bring it back: read the saved value here again (it used to accept
// "dark"/"light" from localStorage), and put the Dark mode toggle back in
// SettingsPage's Appearance tab. The dark palette itself is untouched —
// it's still in index.css under :root[data-theme="dark"].
function getInitialTheme() {
  try {
    if (localStorage.getItem(STORAGE_KEY) === "dark") localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable — nothing to clear
  }
  return "light";
}

// The whole app is built on CSS custom properties (--app-*), so a theme
// is just a data-theme attribute on <html>.
export function ThemeProvider({ children }) {
  const [theme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // setTheme/toggleTheme stay on the context so nothing that still calls
  // them breaks — they just don't do anything while dark mode is off.
  return (
    <ThemeContext.Provider value={{ theme, setTheme: () => {}, toggleTheme: () => {} }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
