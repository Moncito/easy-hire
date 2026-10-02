import { describe, expect, it } from "vitest";
import { getDeployEnv, getEnvironmentBadge } from "@/lib/shared/deploy-env";

describe("getDeployEnv", () => {
  it("trusts VERCEL_ENV over NODE_ENV on Vercel", () => {
    expect(getDeployEnv({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBe("production");
    expect(getDeployEnv({ VERCEL_ENV: "preview", NODE_ENV: "production" })).toBe("staging");
    expect(getDeployEnv({ VERCEL_ENV: "development", NODE_ENV: "production" })).toBe("staging");
  });

  it("falls back to NODE_ENV off Vercel", () => {
    expect(getDeployEnv({ NODE_ENV: "production" })).toBe("production");
    expect(getDeployEnv({ NODE_ENV: "development" })).toBe("development");
    expect(getDeployEnv({})).toBe("development");
  });

  it("treats a blank VERCEL_ENV as unset", () => {
    expect(getDeployEnv({ VERCEL_ENV: "  ", NODE_ENV: "development" })).toBe("development");
  });
});

describe("getEnvironmentBadge", () => {
  it("shows nothing on the live site", () => {
    expect(getEnvironmentBadge({ VERCEL_ENV: "production", NODE_ENV: "production" })).toBeNull();
  });

  it("labels Vercel preview as the testing environment", () => {
    expect(getEnvironmentBadge({ VERCEL_ENV: "preview", NODE_ENV: "production" })?.tone).toBe("testing");
  });

  it("labels local dev:staging as the testing database", () => {
    expect(getEnvironmentBadge({ NODE_ENV: "development", LOCAL_DATABASE: "staging" })).toEqual({
      label: "Local · testing database",
      tone: "testing",
    });
  });

  it("warns that plain local dev uses live data", () => {
    expect(getEnvironmentBadge({ NODE_ENV: "development" })?.tone).toBe("live-data");
  });
});
