export function formatDistance(km?: number): string {
  if (km == null || !Number.isFinite(km)) return "";
  if (km < 1) return `À ${Math.round(km * 1000)} m`;
  return `À ${km.toFixed(1).replace(".", ",")} km`;
}

export function formatPrice(value: number): string {
  return `${value.toFixed(2).replace(".", ",")} €`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.round(hours / 24);
  return `il y a ${days} j`;
}

export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-BE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
