import { describe, expect, it } from "vitest";
import { safeJsonLdString } from "@/lib/seo/safe-json-ld";

/**
 * These payloads model employer-supplied free text (job description /
 * requirements / benefits, company description), which is what makes the
 * escaping load-bearing rather than cosmetic.
 */
describe("safeJsonLdString", () => {
  it("makes `</script` unspellable in the emitted source", () => {
    const payload = {
      "@type": "JobPosting",
      description: 'Great role.</script><img src=x onerror=alert(document.domain)><script>',
    };

    const out = safeJsonLdString(payload);

    // The HTML parser scans script *content* for this byte sequence without
    // parsing JSON, so its absence is the actual security property.
    expect(out).not.toMatch(/<\/script/i);
    expect(out).not.toContain("<");
    expect(out).not.toContain(">");
  });

  it("escapes & so entity decoding cannot reconstruct a tag", () => {
    const out = safeJsonLdString({ description: "Ampersand &lt;script&gt; trick" });
    expect(out).not.toContain("&");
    expect(out).toContain("\\u0026");
  });

  it("round-trips to identical data for a crawler", () => {
    const payload = {
      "@type": "JobPosting",
      title: "Virtual Assistant",
      description: 'A & B </script> <b>bold</b>',
      baseSalary: { "@type": "MonetaryAmount", currency: "PHP" },
    };

    // \uXXXX escapes are valid inside a JSON string, so any JSON-LD consumer
    // decodes them back to the original characters — escaping changes how the
    // text may appear as HTML source, never the parsed value.
    expect(JSON.parse(safeJsonLdString(payload))).toEqual(payload);
  });

  it("leaves ordinary content untouched apart from the escapes", () => {
    const out = safeJsonLdString({ title: "Virtual Assistant", employmentType: "CONTRACTOR" });
    expect(JSON.parse(out)).toEqual({ title: "Virtual Assistant", employmentType: "CONTRACTOR" });
  });

  it("handles nested and array payloads, not just top-level strings", () => {
    const payload = {
      hiringOrganization: { name: "Acme </script>" },
      responsibilities: ["one </script>", "two <b>"],
    };
    expect(safeJsonLdString(payload)).not.toMatch(/<\/script/i);
    expect(JSON.parse(safeJsonLdString(payload))).toEqual(payload);
  });
});
