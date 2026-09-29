import { describe, expect, it } from "vitest";
import {
  assertCanReceiveOwnership,
  isOwnershipTransferPending,
  ownershipTransferExpiresAt,
} from "@/lib/company-ownership-transfer";

describe("isOwnershipTransferPending", () => {
  const requestedAt = new Date("2026-09-25T00:00:00.000Z");

  it("is false when no offer exists", () => {
    expect(isOwnershipTransferPending({ pendingOwnerUserId: null, ownerTransferRequestedAt: null })).toBe(false);
  });

  it("is false when only one of the two fields is set", () => {
    expect(isOwnershipTransferPending({ pendingOwnerUserId: "u1", ownerTransferRequestedAt: null })).toBe(false);
    expect(isOwnershipTransferPending({ pendingOwnerUserId: null, ownerTransferRequestedAt: requestedAt })).toBe(false);
  });

  it("is true inside the 7-day window and false once it lapses", () => {
    const offer = { pendingOwnerUserId: "u1", ownerTransferRequestedAt: requestedAt };
    const expiresAt = ownershipTransferExpiresAt(requestedAt);
    expect(expiresAt.toISOString()).toBe("2026-10-02T00:00:00.000Z");
    expect(isOwnershipTransferPending(offer, new Date(expiresAt.getTime() - 1))).toBe(true);
    expect(isOwnershipTransferPending(offer, expiresAt)).toBe(false);
  });
});

describe("assertCanReceiveOwnership", () => {
  const eligible = { isActiveMember: true, isCurrentOwner: false, accountRole: "SEEKER" as const, ownsCompany: false };

  it("accepts an active seeker or employer member with no company", () => {
    expect(() => assertCanReceiveOwnership(eligible)).not.toThrow();
    expect(() => assertCanReceiveOwnership({ ...eligible, accountRole: "EMPLOYER" })).not.toThrow();
  });

  it("rejects the current owner", () => {
    expect(() => assertCanReceiveOwnership({ ...eligible, isCurrentOwner: true })).toThrow(/already own/);
  });

  it("rejects someone who is no longer an active member", () => {
    expect(() => assertCanReceiveOwnership({ ...eligible, isActiveMember: false })).toThrow(/active member/);
  });

  it("rejects admin accounts", () => {
    expect(() => assertCanReceiveOwnership({ ...eligible, accountRole: "ADMIN" })).toThrow(/admin/);
  });

  it("rejects an account that already owns a company", () => {
    expect(() => assertCanReceiveOwnership({ ...eligible, accountRole: "EMPLOYER", ownsCompany: true })).toThrow(
      /only one/
    );
  });
});
