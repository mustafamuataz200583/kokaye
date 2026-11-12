import localFont from "next/font/local";

// Brand fonts supplied by the owner. Verify web-embedding rights per each license.
export const thmanyah = localFont({
  variable: "--font-thmanyah",
  display: "swap",
  src: [
    { path: "../fonts/thmanyah-sans-300.woff2", weight: "300", style: "normal" },
    { path: "../fonts/thmanyah-sans-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/thmanyah-sans-700.woff2", weight: "700", style: "normal" },
  ],
});

export const tajarib = localFont({
  variable: "--font-tajarib",
  display: "swap",
  src: [
    { path: "../fonts/tajarib-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/tajarib-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/tajarib-700.woff2", weight: "700", style: "normal" },
  ],
});

// Cormorant Garamond (SIL OFL) echoes the serif in the KOKAYE wordmark — Latin only.
export const cormorant = localFont({
  variable: "--font-cormorant",
  display: "swap",
  src: [
    { path: "../fonts/cormorant-garamond-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-700-normal.woff2", weight: "700", style: "normal" },
    { path: "../fonts/cormorant-garamond-latin-500-italic.woff2", weight: "500", style: "italic" },
  ],
});
