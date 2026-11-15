/**
 * Logo Le Bon Voisin (LBV) — une maison (le quartier) avec un point accent
 * (le voisin). Même dessin que le favicon `app/icon.svg`.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" className={className} aria-hidden="true" role="img">
      <rect width="512" height="512" rx="118" fill="#15803D" />
      <path d="M256 104 L428 252 V414 H84 V252 Z" fill="#FFFFFF" />
      <rect x="216" y="306" width="80" height="108" rx="16" fill="#15803D" />
      <circle cx="384" cy="134" r="50" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="18" />
    </svg>
  );
}
