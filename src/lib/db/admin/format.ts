import "server-only";

/** Server-safe relative time strings (activity feed). */
export function formatRelativeTime(iso: string, nowMs: number = Date.now()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffMs = Math.max(0, nowMs - t);
  const mins = Math.round(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export function toDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
}

const sectorDisplayOverrides: Record<string, string> = {
  edu: "EDU",
  saas: "SaaS",
  b2b: "B2B",
};

export function toDisplaySector(value: string | null | undefined): string {
  if (!value) return "—";
  const normalized = value.trim().toLowerCase();
  if (sectorDisplayOverrides[normalized]) {
    return sectorDisplayOverrides[normalized];
  }
  return normalized
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Display DB enum-style strings (e.g. `in_progress` → `In progress`). */
export function humanizeDbEnum(value: string | null | undefined): string {
  if (!value) return "—";
  return value
    .trim()
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
