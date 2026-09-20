// Test-only helpers for proving a response never carries the answer key.
// Excluded from the production build (see tsconfig.build.json).

// Walks any JSON-shaped value and returns the path of the first property
// named `key`, or null when it appears nowhere. Checking the top level is not
// enough - a leak inside options[] is exactly the one that matters.
export function findKeyPath(
  value: unknown,
  key: string,
  path = "$"
): string | null {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const hit = findKeyPath(item, key, `${path}[${index}]`);
      if (hit) return hit;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  if (value instanceof Date) return null;

  for (const [name, child] of Object.entries(value)) {
    if (name === key) return `${path}.${name}`;
    const hit = findKeyPath(child, key, `${path}.${name}`);
    if (hit) return hit;
  }
  return null;
}

type SelectNode = Record<string, unknown>;

// A stand-in for Prisma's `select`, applied by the fake Prisma in these specs.
// Fixtures can therefore hold the real is_correct flags, which makes the
// "no answer key in the response" assertions test the service's select rather
// than a fixture that simply never had the field.
export function applySelect(row: any, select: SelectNode): any {
  if (row === null || row === undefined) return row;
  const picked: Record<string, unknown> = {};

  for (const [field, rule] of Object.entries(select)) {
    if (rule === true) {
      picked[field] = row[field];
      continue;
    }
    if (rule && typeof rule === "object") {
      const nested = (rule as { select?: SelectNode }).select;
      if (!nested) continue;
      const child = row[field];
      picked[field] = Array.isArray(child)
        ? child.map((item) => applySelect(item, nested))
        : applySelect(child, nested);
    }
  }
  return picked;
}
