export function parseTimestamp(value: unknown): number {
  if (value == null) return 0;

  let ms: number | null = null;

  if (typeof value === "number") {
    ms = Math.floor(value);
  } else if (typeof value === "string") {
    if (value.includes("-")) {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    }
    const parsed = parseInt(value, 10);
    ms = Number.isNaN(parsed) ? null : parsed;
  }

  if (ms == null || ms === 0) return 0;

  return ms < 100000000000 ? ms * 1000 : ms;
}
