/** Official-style bank marks for Money Center account tiles (SVG data URIs). */

/** Absa — red circle with white wordmark */
export const absaLogo =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Absa">` +
      `<rect width="64" height="64" rx="12" fill="#AF0C3E"/>` +
      `<circle cx="32" cy="32" r="18" fill="none" stroke="#fff" stroke-width="3.5"/>` +
      `<text x="32" y="36.5" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="14" font-weight="700" fill="#fff">absa</text>` +
      `</svg>`,
  );

/** Equity — red chevron / roof mark on dark tile */
export const equityLogo =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Equity">` +
      `<rect width="64" height="64" rx="12" fill="#111"/>` +
      `<path d="M12 40 L12 28 L32 14 L52 28 L52 40 L40 40 L40 34 L32 28 L24 34 L24 40 Z" fill="#A61C2E"/>` +
      `</svg>`,
  );

/** Family Bank — blue house mark + word */
export const familyLogo =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" role="img" aria-label="Family Bank">` +
      `<rect width="96" height="64" rx="12" fill="#fff"/>` +
      `<path d="M14 36 L14 28 L24 18 L34 28 L34 36 L28 36 L28 30 L24 26 L20 30 L20 36 Z" fill="#0088CE"/>` +
      `<text x="40" y="30" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" fill="#0088CE">Family</text>` +
      `<text x="40" y="44" font-family="Arial,Helvetica,sans-serif" font-size="11" font-weight="700" fill="#0088CE">Bank</text>` +
      `</svg>`,
  );

/** NCBA — brown Africa-inspired mark + wordmark */
export const ncbaLogo =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 64" role="img" aria-label="NCBA">` +
      `<rect width="96" height="64" rx="12" fill="#fff"/>` +
      `<path d="M18 18 L28 14 L34 20 L32 28 L36 36 L30 44 L22 42 L16 34 L14 24 Z" fill="#3D2B1F"/>` +
      `<circle cx="24" cy="26" r="2.2" fill="#fff" opacity="0.35"/>` +
      `<text x="42" y="38" font-family="Arial,Helvetica,sans-serif" font-size="16" font-weight="700" fill="#3D2B1F">NCBA</text>` +
      `</svg>`,
  );
