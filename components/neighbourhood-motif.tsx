import { useId } from "react";

/**
 * Motif « maillage de quartier » — en filigrane.
 *
 * Les ronds = les voisins, les petits carrés = les commerces de proximité,
 * les traits = les liens d'entraide et les rues qui les relient.
 * Dessiné en SVG (aucune image), coloré via `currentColor`, à utiliser en
 * très faible opacité pour ne jamais voler la vedette au contenu.
 */
export function NeighbourhoodMotif({ className }: { className?: string }) {
  const rawId = useId();
  const id = `motif-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <svg
      className={className}
      aria-hidden="true"
      width="100%"
      height="100%"
      viewBox="0 0 120 120"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id={id} width="120" height="120" patternUnits="userSpaceOnUse">
          {/* liens d'entraide / rues */}
          <g fill="none" stroke="currentColor" strokeWidth="1.1">
            <path d="M30 30 H60 V90" />
            <path d="M90 30 H60 V90" />
            <path d="M30 90 H60" />
            <path d="M60 30 V0 M60 90 V120" opacity="0.6" />
          </g>
          {/* voisins (ronds) */}
          <g fill="currentColor">
            <circle cx="30" cy="30" r="3.2" />
            <circle cx="90" cy="30" r="3.2" />
            <circle cx="30" cy="90" r="3.2" />
            <circle cx="90" cy="90" r="3.2" />
            <circle cx="60" cy="60" r="4" />
          </g>
          {/* commerces de proximité (carrés) */}
          <g fill="currentColor" opacity="0.65">
            <rect x="46" y="16" width="9" height="9" rx="1.8" />
            <rect x="46" y="95" width="9" height="9" rx="1.8" />
            <rect x="16" y="46" width="9" height="9" rx="1.8" />
            <rect x="95" y="46" width="9" height="9" rx="1.8" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
