/**
 * Light or dark, remembered in this browser.
 *
 * The theme is a `dark` class on <html> -- index.css declares
 * `@custom-variant dark (&:is(.dark *))` and a `.dark` token block. It is
 * applied in main.jsx before the first render, so a reload in dark mode does
 * not flash light, and it covers the signed-out screens too.
 *
 * Light is the default. Storage can throw (a browser blocking site data), so
 * every read and write is guarded and falls back to light.
 */

export const THEMES = { LIGHT: 'light', DARK: 'dark' }

const THEME_KEY = 'banca.theme'

export function readTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === THEMES.DARK ? THEMES.DARK : THEMES.LIGHT
  } catch {
    return THEMES.LIGHT
  }
}

/** Puts the class on <html> and remembers the choice. */
export function applyTheme(theme) {
  document.documentElement.classList.toggle('dark', theme === THEMES.DARK)
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch {
    // Ignored on purpose: the theme still applies for this visit.
  }
}
