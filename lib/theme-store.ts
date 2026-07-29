// Shared theme store for managing dark mode across the app
// Uses useSyncExternalStore pattern for React 18+ compatibility
export const themeStore = {
  // Returns the current dark mode status from the DOM
  getSnapshot: (): boolean => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  },

  // Default server snapshot for SSR stability
  getServerSnapshot: (): boolean => false,

  // Subscribes to HTML class attribute mutations to trigger React re-renders
  subscribe: (callback: () => void): (() => void) => {
    const observer = new MutationObserver(callback);
    if (typeof window !== "undefined") {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
    }
    return () => observer.disconnect();
  },

  // Updates the DOM class list and persists the choice in localStorage
  setTheme: (isDark: boolean): void => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  },

  // Initializes the theme balance on startup using localStorage or system preference
  initTheme: (): void => {
    if (typeof window === "undefined") return;
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
    if (savedTheme === "dark" || (!savedTheme && systemPrefersDark)) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  },
};
