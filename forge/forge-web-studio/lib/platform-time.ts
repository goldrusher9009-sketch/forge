// Platform timestamps arrive as SQLite text, "2026-09-21 18:45:12", which is UTC but carries no
// zone marker. A browser reads that as local time, so a task created a minute ago can land in
// yesterday's group for anyone east of UTC. Normalising here keeps every rendered time honest.
const SQLITE_UTC = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(\.\d+)?$/;

export function utcStamp<T>(value: T): T | string {
  if (typeof value !== 'string' || !SQLITE_UTC.test(value)) return value;
  return value.replace(' ', 'T') + 'Z';
}

export function platformDate(value: unknown): Date {
  return new Date(utcStamp(value) as any);
}
