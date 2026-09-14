// Returns true if `current` is strictly older than `required` (both "x.y.z" strings).
export function isOlderVersion(current, required) {
  if (!current || !required) return false;
  const a = current.split('.').map((n) => parseInt(n, 10) || 0);
  const b = required.split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const av = a[i] || 0;
    const bv = b[i] || 0;
    if (av < bv) return true;
    if (av > bv) return false;
  }
  return false;
}
