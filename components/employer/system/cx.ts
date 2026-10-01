/** Joins class names, skipping falsy values. No merging: system components take `className` for layout only (margin, width, grid placement), never to restyle. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
