/**
 * Jetons de propriété côté client. Le serveur renvoie un jeton à la création
 * d'un besoin / événement / outil ; on le conserve en localStorage pour pouvoir
 * supprimer ses propres publications. Le jeton n'est jamais dans les listes GET.
 */

const KEY = "voisins-owners";

type OwnerMap = Record<string, string>;

function readMap(): OwnerMap {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as OwnerMap;
  } catch {
    return {};
  }
}

export function saveOwnerToken(id: string, token: string): void {
  try {
    const map = readMap();
    map[id] = token;
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* stockage indisponible */
  }
}

export function getOwnerToken(id: string): string | null {
  return readMap()[id] ?? null;
}

export function removeOwnerToken(id: string): void {
  try {
    const map = readMap();
    delete map[id];
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* stockage indisponible */
  }
}

/** Identifiants des publications dont on possède le jeton (bouton « supprimer » visible). */
export function loadOwnedIds(): Set<string> {
  return new Set(Object.keys(readMap()));
}
