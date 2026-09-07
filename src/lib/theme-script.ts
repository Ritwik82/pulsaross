// Single source of truth for the pre-paint theme script. Kept in its own module
// so layout.tsx can inline it (CSP uses a per-request nonce, set in src/proxy.ts).
// The script runs pre-paint: no flash of the wrong theme, and the meta tag must
// match the persisted theme, not OS preference (AGENTS.md known pattern).

export const DARK_THEMES = ["espresso", "caramel", "terminal", "midnight"] as const;
export const LIGHT_THEMES = ["latte", "cream", "blush", "azure"] as const;

export const THEMES = [...DARK_THEMES, ...LIGHT_THEMES] as const;

export type ThemeName = (typeof THEMES)[number];

export function isDarkTheme(value: string | null | undefined): value is ThemeName {
  return typeof value === "string" && (DARK_THEMES as readonly string[]).includes(value);
}

// Per-theme <meta name="theme-color"> values — kept here so the pre-paint
// script and the theme picker can never drift apart.
export const THEME_META_COLORS: Record<ThemeName, string> = {
  espresso: "#1a1410",
  caramel: "#3a2a1a",
  terminal: "#0a0e13",
  midnight: "#12161d",
  latte: "#e6d9bf",
  cream: "#f6eddd",
  blush: "#f2dfda",
  azure: "#d9e6f2",
};

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === "string" && (THEMES as readonly string[]).includes(value);
}

/**
 * Pre-paint theme script, inlined into HTML by layout.tsx.
 * Runs before first paint to set `data-theme` + theme-color meta from
 * localStorage (no wrong-theme flash). Self-contained with no imports so it
 * can run under CSP via the per-request nonce set in src/proxy.ts — the
 * theme list is duplicated inside the string on purpose.
 */
export const themeScript = `
(function() {
  var THEMES = ["espresso", "caramel", "terminal", "midnight", "latte", "cream", "blush", "azure"];
  var META = { espresso: "#1a1410", caramel: "#3a2a1a", terminal: "#0a0e13", midnight: "#12161d", latte: "#e6d9bf", cream: "#f6eddd", blush: "#f2dfda", azure: "#d9e6f2" };
  var t = localStorage.getItem('pulsaross-theme');
  if (THEMES.indexOf(t) === -1) t = "terminal";
  document.documentElement.dataset.theme = t;
  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', META[t]);
})()
`;