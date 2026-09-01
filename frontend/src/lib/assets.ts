/** Site-root or GitHub Pages base (`/` or `/Ducati/`). */
export function publicUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  const trimmed = path.replace(/^\//, '');
  return `${base}${trimmed}`;
}
