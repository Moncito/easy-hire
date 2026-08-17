export type SalaryPeriod = "HOURLY" | "MONTHLY" | "ANNUAL";

export function periodSuffix(period: SalaryPeriod = "MONTHLY"): string {
  if (period === "HOURLY") return "/hr";
  if (period === "ANNUAL") return "/yr";
  return "/mo";
}

export function periodLabel(period: SalaryPeriod = "MONTHLY"): string {
  if (period === "HOURLY") return "Hourly";
  if (period === "ANNUAL") return "Annual";
  return "Monthly";
}

/** Rough monthly-equivalent used only for cross-period range filtering — never shown to users. */
export function toMonthlyEquivalent(amount: number, period: SalaryPeriod = "MONTHLY"): number {
  if (period === "HOURLY") return Math.round(amount * 173);
  if (period === "ANNUAL") return Math.round(amount / 12);
  return amount;
}

/** Inverse of toMonthlyEquivalent — converts a monthly amount back into another period's units. */
export function fromMonthlyEquivalent(monthlyAmount: number, targetPeriod: SalaryPeriod = "MONTHLY"): number {
  if (targetPeriod === "HOURLY") return monthlyAmount / 173;
  if (targetPeriod === "ANNUAL") return monthlyAmount * 12;
  return monthlyAmount;
}

export function formatSalaryRange(
  min: number | null | undefined,
  max: number | null | undefined,
  period: SalaryPeriod = "MONTHLY"
): string {
  if (min == null && max == null) return "Not specified";

  const fmt = (n: number) => `$${n.toLocaleString("en-US")}`;
  const suffix = periodSuffix(period);

  if (min != null && max != null) {
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    return `${fmt(low)} – ${fmt(high)}${suffix}`;
  }
  if (min != null) return `From ${fmt(min)}${suffix}`;
  return `Up to ${fmt(max!)}${suffix}`;
}

/** @deprecated Use formatSalaryRange — job pay is USD. */
export const formatPesoRange = formatSalaryRange;

export function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}
