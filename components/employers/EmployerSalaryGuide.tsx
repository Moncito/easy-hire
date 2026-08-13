type SalaryRow = {
  role: string;
  phpLow: number;
  phpHigh: number;
  usd: string;
  aud: string;
  gbp: string;
};

const SALARY_ROWS: SalaryRow[] = [
  { role: "Virtual Assistant / Executive Assistant", phpLow: 25000, phpHigh: 45000, usd: "$440–790", aud: "A$660–1,180", gbp: "£340–620" },
  { role: "Customer Support", phpLow: 22000, phpHigh: 38000, usd: "$390–670", aud: "A$580–1,000", gbp: "£300–520" },
  { role: "Social Media Manager", phpLow: 30000, phpHigh: 55000, usd: "$530–960", aud: "A$790–1,450", gbp: "£410–750" },
  { role: "Content Writer", phpLow: 25000, phpHigh: 48000, usd: "$440–840", aud: "A$660–1,260", gbp: "£340–660" },
  { role: "Bookkeeping", phpLow: 30000, phpHigh: 55000, usd: "$530–960", aud: "A$790–1,450", gbp: "£410–750" },
  { role: "Graphic Designer", phpLow: 28000, phpHigh: 50000, usd: "$490–880", aud: "A$740–1,320", gbp: "£380–690" },
  { role: "Web Developer", phpLow: 45000, phpHigh: 90000, usd: "$790–1,580", aud: "A$1,180–2,370", gbp: "£620–1,230" },
  { role: "E-commerce / Amazon VA", phpLow: 28000, phpHigh: 50000, usd: "$490–880", aud: "A$740–1,320", gbp: "£380–690" },
];

function formatPhp(n: number) {
  return `₱${n.toLocaleString("en-US")}`;
}

export default function EmployerSalaryGuide() {
  return (
    <section
      className="emp-bg-elevated relative w-full overflow-hidden border-t px-6 py-20 md:py-24 emp-border"
      aria-label="Virtual assistant salary guide"
    >
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-12 max-w-2xl">
          <h2 className="emp-text font-display text-3xl font-extrabold tracking-tight md:text-5xl">
            What VAs typically earn
          </h2>
          <p className="emp-text-secondary mt-4 text-sm font-medium leading-relaxed md:text-base">
            A rough monthly guide in Philippine pesos for common roles, with a rough
            USD, AUD and GBP equivalent so you can budget in your own currency.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border emp-border">
          <div
            className="hidden grid-cols-[2fr_1.2fr_1fr_1fr_1fr] gap-4 border-b px-6 py-3 text-[11px] font-semibold uppercase tracking-wider md:grid emp-border emp-text-muted"
            style={{ backgroundColor: "var(--emp-table-header)" }}
          >
            <span>Role</span>
            <span>PHP / month</span>
            <span>≈ USD</span>
            <span>≈ AUD</span>
            <span>≈ GBP</span>
          </div>

          <div className="emp-bg-elevated divide-y divide-[var(--emp-border-subtle)]">
            {SALARY_ROWS.map((row) => (
              <div
                key={row.role}
                className="grid grid-cols-1 gap-2 px-6 py-4 transition-colors duration-150 md:grid-cols-[2fr_1.2fr_1fr_1fr_1fr] md:items-center md:gap-4 hover:[background-color:var(--emp-table-row-hover)]"
              >
                <span className="emp-text font-display text-sm font-bold md:text-[0.9rem]">
                  {row.role}
                </span>
                <span className="font-data text-sm font-semibold text-teal">
                  {formatPhp(row.phpLow)}–{formatPhp(row.phpHigh)}
                </span>
                <span className="emp-text-secondary font-data text-xs md:text-[0.8rem]">{row.usd}</span>
                <span className="emp-text-secondary font-data text-xs md:text-[0.8rem]">{row.aud}</span>
                <span className="emp-text-secondary font-data text-xs md:text-[0.8rem]">{row.gbp}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="emp-text-muted mt-5 max-w-2xl text-xs leading-relaxed">
          Estimates only, based on typical full-time monthly rates reported by employers on
          EasyHire. Actual pay depends on experience, scope, and hours — foreign currency
          figures use approximate exchange rates and will vary.
        </p>
      </div>
    </section>
  );
}
