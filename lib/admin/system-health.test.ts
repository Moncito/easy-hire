import { describe, expect, it } from "vitest";
import { notInstrumented, SYSTEM_HEALTH_ALERT_THRESHOLDS, type SystemHealthMetric } from "@/lib/admin/system-health";

/**
 * Guards the two purely-structural pieces of the health screen that don't
 * touch Prisma: the "not instrumented" discriminated-union constructor (the
 * thing that makes it physically impossible for the UI to render a
 * fabricated number for a metric this app cannot honestly measure), and the
 * §4.10 alert-threshold constants.
 */

describe("notInstrumented", () => {
  it("produces the not_instrumented branch of the discriminated union, carrying the given reason", () => {
    const metric: SystemHealthMetric<number> = notInstrumented("no local source");
    expect(metric.status).toBe("not_instrumented");
    if (metric.status === "not_instrumented") {
      expect(metric.reason).toBe("no local source");
    }
  });

  it("never has a `value` field — the type this constructs cannot be misread as a real 0 or null", () => {
    const metric = notInstrumented("no local source");
    expect("value" in metric).toBe(false);
  });
});

describe("SYSTEM_HEALTH_ALERT_THRESHOLDS", () => {
  it("matches the exact §4.10 thresholds", () => {
    expect(SYSTEM_HEALTH_ALERT_THRESHOLDS).toEqual({
      dbCpuSustainedPercent: 70,
      poolerClientCount: 150,
      realtimeConnectionCount: 150,
    });
  });
});
