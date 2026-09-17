/**
 * Client-side (serialized) wire shape for `/admin/system/flags` — mirrors
 * Prisma's `FeatureFlag` model (`lib/admin/feature-flags.ts`) with `Date`
 * fields turned into ISO strings by the page's `JSON.parse(JSON.stringify(...))`
 * round-trip, same convention as `components/admin/team/types.ts`.
 */
export type SerializedFeatureFlag = {
  id: string;
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number | null;
  /** The admin user id that last wrote this row (`FeatureFlag.updatedBy`). No email join exists on this read path, so this renders as a raw id, not a name. */
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
};
