import { describe, expect, it } from "vitest";
import {
  savedJobFolderCreateSchema,
  savedJobFolderUpdateSchema,
  savedJobFolderItemCreateSchema,
} from "@/lib/validations/saved-job-folder";

describe("savedJobFolderCreateSchema", () => {
  it("trims whitespace from the name", () => {
    const result = savedJobFolderCreateSchema.parse({ name: "  Dream Jobs  " });
    expect(result.name).toBe("Dream Jobs");
  });

  it("rejects an empty name", () => {
    expect(() => savedJobFolderCreateSchema.parse({ name: "" })).toThrow();
  });

  it("rejects a name that is only whitespace", () => {
    expect(() => savedJobFolderCreateSchema.parse({ name: "   " })).toThrow();
  });

  it("accepts a name at the 80-character boundary", () => {
    const name = "a".repeat(80);
    const result = savedJobFolderCreateSchema.parse({ name });
    expect(result.name).toHaveLength(80);
  });

  it("rejects a name over the 80-character boundary", () => {
    const name = "a".repeat(81);
    expect(() => savedJobFolderCreateSchema.parse({ name })).toThrow();
  });
});

describe("savedJobFolderUpdateSchema", () => {
  it("trims whitespace from the name", () => {
    const result = savedJobFolderUpdateSchema.parse({ name: "  Renamed  " });
    expect(result.name).toBe("Renamed");
  });

  it("rejects an empty name", () => {
    expect(() => savedJobFolderUpdateSchema.parse({ name: "" })).toThrow();
  });

  it("accepts a name at the 80-character boundary", () => {
    const name = "b".repeat(80);
    const result = savedJobFolderUpdateSchema.parse({ name });
    expect(result.name).toHaveLength(80);
  });

  it("rejects a name over the 80-character boundary", () => {
    const name = "b".repeat(81);
    expect(() => savedJobFolderUpdateSchema.parse({ name })).toThrow();
  });
});

describe("savedJobFolderItemCreateSchema", () => {
  it("accepts a non-empty savedJobId", () => {
    const result = savedJobFolderItemCreateSchema.parse({ savedJobId: "clabc123" });
    expect(result.savedJobId).toBe("clabc123");
  });

  it("rejects a missing savedJobId", () => {
    expect(() => savedJobFolderItemCreateSchema.parse({})).toThrow();
  });

  it("rejects an empty savedJobId", () => {
    expect(() => savedJobFolderItemCreateSchema.parse({ savedJobId: "" })).toThrow();
  });
});
