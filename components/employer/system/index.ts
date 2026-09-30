/**
 * EMPLOYER DESIGN SYSTEM
 * ======================
 * One set of components for every employer screen, so Dashboard, Jobs,
 * Applicants and Settings read as one product and differ only in content.
 * Tokens live in app/globals.css (--eh-* colours, rounded-card/control/
 * chip/panel, shadow-eh-*, text-display/section/card-title/metric/…,
 * font-heading, num). Import from here, not from the individual files.
 *
 * Rules the components encode:
 *  - Buttons, inputs and cards are squared (8px / 12px). Only statuses,
 *    filters, tags, avatars and dots are fully round.
 *  - Space Grotesk (font-heading) for page titles, section headings and KPI
 *    values; Inter for everything else.
 *  - Colour means something: marigold = worth attention, Ember = genuinely
 *    overdue or destructive, teal = positive / Easy AI. Status always has a
 *    text label too.
 *  - Cards only where content needs a container; shadows are hairlines.
 */

export { cx } from "@/components/employer/system/cx";

export { default as Button } from "@/components/employer/system/Button";
export type { ButtonSize, ButtonVariant } from "@/components/employer/system/Button";
export { default as IconButton } from "@/components/employer/system/IconButton";
export { default as DropdownMenu } from "@/components/employer/system/DropdownMenu";
export type { MenuItem } from "@/components/employer/system/DropdownMenu";

export { Card, CardHeader, SectionHeader, PageHeader } from "@/components/employer/system/Card";

export { default as SegmentedControl } from "@/components/employer/system/SegmentedControl";
export type { SegmentOption } from "@/components/employer/system/SegmentedControl";
export { default as FilterButton } from "@/components/employer/system/FilterButton";
export { default as SearchInput } from "@/components/employer/system/SearchInput";

export { default as MetricCard, TrendIndicator } from "@/components/employer/system/MetricCard";
export type { TrendDirection } from "@/components/employer/system/MetricCard";
export { default as AnalyticsCard } from "@/components/employer/system/AnalyticsCard";
export { default as TrendBarChart } from "@/components/employer/system/TrendBarChart";
export type { ChartSeries } from "@/components/employer/system/TrendBarChart";
export { PipelineSummary, PipelineMini } from "@/components/employer/system/Pipeline";
export type { PipelineStage, PipelineStageTone } from "@/components/employer/system/Pipeline";
export { default as JobCard, JobStatusBadge, JobAttentionMessage } from "@/components/employer/system/JobCard";
export { Table, Th, Tr, Td, StackedRow } from "@/components/employer/system/Table";

export { default as StatusBadge, ApplicationStatusBadge, APPLICATION_STATUS_BADGE } from "@/components/employer/system/StatusBadge";
export type { StatusTone } from "@/components/employer/system/StatusBadge";
export { default as Avatar } from "@/components/employer/system/Avatar";
export type { AvatarSize } from "@/components/employer/system/Avatar";
export { default as CandidateReviewCard } from "@/components/employer/system/CandidateReviewCard";
export { default as AttentionBanner } from "@/components/employer/system/AttentionBanner";
export type { BannerTone } from "@/components/employer/system/AttentionBanner";

export { default as EmptyState } from "@/components/employer/system/EmptyState";
export {
  Skeleton,
  MetricCardSkeleton,
  TableRowSkeleton,
  CandidateRowSkeleton,
  AnalyticsCardSkeleton,
  PipelineSkeleton,
  JobCardSkeleton,
} from "@/components/employer/system/Skeleton";
