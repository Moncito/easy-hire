/**
 * Serializes a JSON-LD object for safe embedding inside a
 * `<script type="application/ld+json" dangerouslySetInnerHTML={...} />` tag.
 *
 * WHY THIS EXISTS — DO NOT "SIMPLIFY" THIS AWAY:
 * The JSON-LD payloads built by `lib/seo/job-posting-jsonld.ts` and
 * `lib/seo/organization-jsonld.ts` embed employer-supplied free text (job
 * `description`/`requirements`/`benefits`, company `description`). Plain
 * `JSON.stringify(data)` is NOT safe to hand to `dangerouslySetInnerHTML` for
 * a `<script>` element: the browser's HTML parser scans script *content* for
 * the literal byte sequence `</script` regardless of what's syntactically
 * "inside a JSON string" — it doesn't parse JSON, it just looks for that
 * closing tag. So an employer description containing `</script><img
 * src=x onerror=alert(1)>` would prematurely close our JSON-LD `<script>`
 * tag and get the rest interpreted as live HTML: stored XSS via employer
 * input, reachable by anyone who views a job or (approved) company page.
 *
 * Escaping is mandatory, not optional, and belongs at the serialization
 * boundary (here) rather than in the JSON-LD builders themselves, so it
 * can't be forgotten by a future call site.
 *
 * What's escaped and why:
 * - `<` -> `\u003c` is the load-bearing one: it makes `</script` structurally
 *   impossible to spell inside the emitted script body, which is the entire
 *   attack. `\uXXXX` escapes are valid inside a JSON string and are decoded
 *   back to the literal character by `JSON.parse` / any JSON-LD consumer
 *   (search engine crawlers included) — nothing about the parsed data
 *   changes, only how it's allowed to appear as literal HTML/script source.
 * - `>` -> `\u003e` isn't independently exploitable the way `<` is (a lone
 *   `>` can't open or close a tag), but it's escaped too so the output never
 *   contains a literal `<...>`-shaped substring at all — cheap insurance
 *   against conditional-comment-style tricks in older/nonstandard parsers,
 *   and it keeps this safe to reuse if the string is ever concatenated into
 *   an HTML attribute elsewhere instead of a script body.
 * - `&` -> `\u0026` is escaped so entity-decoding can't reconstruct `<` or
 *   `>` from something like `&lt;` after an HTML parser gets a second pass at
 *   this text (e.g. copy-pasted into an attribute, or re-embedded by a
 *   downstream tool). Escaping `&` itself prevents that class of
 *   double-decoding bug without needing to reason about every possible
 *   downstream consumer.
 *
 * This is the same family of mitigation Next.js applies internally when it
 * serializes flight/RSC data into inline `<script>` tags, and what libraries
 * like `serialize-javascript` do for the same reason.
 */
export function safeJsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
