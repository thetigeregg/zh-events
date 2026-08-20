export type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "theme";

function getStoredTheme(): ThemeMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
}

function applyTheme(mode: ThemeMode) {
  if (mode === "auto") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", mode);
  }
}

export const theme = $state<{ mode: ThemeMode }>({ mode: getStoredTheme() });

export function setTheme(mode: ThemeMode) {
  theme.mode = mode;
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme(mode);
}

// Sync the DOM attribute on load too, in case the blocking inline script in
// index.html didn't run (e.g. localStorage was unavailable at that point).
applyTheme(theme.mode);
