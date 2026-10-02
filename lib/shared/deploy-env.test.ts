import { describe, expect, it } from "vitest";
import { getDeployEnv } from "@/lib/shared/deploy-env";

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
