import type { AttentionItem, EmployerAnalytics } from "@/lib/employer-analytics";

export function isSparseDashboard(analytics: EmployerAnalytics): boolean {
  const weeklyTotal =
    analytics.weeklyTrend.applications.reduce((sum, day) => sum + day.count, 0) +
    analytics.weeklyTrend.interviews.reduce((sum, day) => sum + day.count, 0);

  return (
    analytics.metrics.totalApplicants < 5 ||
    weeklyTotal === 0 ||
    analytics.activeJobs.length < 2
  );
}

export function areMetricsEmpty(analytics: EmployerAnalytics): boolean {
  const { metrics } = analytics;
  return (
    metrics.appsToday === 0 &&
    metrics.interviewsActive === 0 &&
    metrics.appsTodaySparkline.every((value) => value === 0) &&
    metrics.interviewsSparkline.every((value) => value === 0)
  );
}

export type GettingStartedStep = {
  id: string;
  label: string;
  description: string;
  href: string;
  done: boolean;
  optional?: boolean;
};

export function getGettingStartedSteps(analytics: EmployerAnalytics): GettingStartedStep[] {
  const steps: GettingStartedStep[] = [
    {
      id: "profile",
      label: "Complete your company profile",
      description: "Add logo, description, and social links to build trust with candidates.",
      href: "/employer/company-profile",
      done: analytics.profileCompletion >= 100,
    },
    {
      id: "first-job",
      label: "Post your first job",
      description: "Publish a role so qualified VAs can discover and apply.",
      href: "/employer/jobs/new",
      done: analytics.metrics.activeJobs > 0,
    },
  ];

  if (analytics.metrics.activeJobs >= 1 && analytics.metrics.activeJobs < 3) {
    steps.push({
      id: "second-job",
      label: "Post another job",
      description: "More listings increase visibility and applicant volume.",
      href: "/employer/jobs/new",
      done: analytics.metrics.activeJobs >= 3,
    });
  }

  if (analytics.metrics.activeJobs > 0) {
    steps.push({
      id: "review-applicants",
      label: "Review your first applicant",
      description: "Move promising candidates forward in your hiring pipeline.",
      href: "/employer/applicants",
      done:
        analytics.funnel.reviewed +
          analytics.funnel.interview +
          analytics.funnel.hired >
        0,
    });
  }

  if (analytics.metrics.activeJobs > 0 && analytics.metrics.totalApplicants < 5) {
    steps.push({
      id: "talent",
      label: "Browse the talent pool",
      description: "Search skilled VAs and save profiles for future roles.",
      href: "/employer/talent",
      done: false,
      optional: true,
    });
  }

  return steps;
}

export function shouldShowGettingStarted(steps: GettingStartedStep[]): boolean {
  return steps.some((step) => !step.done && !step.optional);
}

export function getOnboardingAttentionItems(analytics: EmployerAnalytics): AttentionItem[] {
  const items: AttentionItem[] = [];

  if (analytics.profileCompletion < 100) {
    items.push({
      id: "profile",
      label: `Complete profile (${analytics.profileCompletion}%)`,
      href: "/employer/company-profile",
      priority: "normal",
    });
  }

  if (analytics.metrics.activeJobs === 0) {
    items.push({
      id: "post-job",
      label: "Post your first job",
      href: "/employer/jobs/new",
      priority: "normal",
    });
  }

  if (analytics.metrics.totalApplicants === 0 && analytics.metrics.activeJobs > 0) {
    items.push({
      id: "browse-talent",
      label: "Browse talent pool",
      href: "/employer/talent",
      priority: "normal",
    });
  }

  if (analytics.metrics.activeJobs > 0 && analytics.metrics.totalApplicants === 0) {
    items.push({
      id: "share-jobs",
      label: "Share job listings",
      href: "/employer/jobs",
      priority: "normal",
    });
  }

  return items.slice(0, 3);
}

export function getHiringScoreHint(analytics: EmployerAnalytics): string | null {
  if (analytics.metrics.totalApplicants === 0 && analytics.metrics.activeJobs > 0) {
    return "Strong profile setup — share your jobs to attract applicants and raise your score.";
  }

  if (analytics.profileCompletion < 100) {
    return "Complete your company profile to improve visibility with candidates.";
  }

  if (analytics.metrics.needsReview > 0) {
    return "Review pending applicants to keep your pipeline moving.";
  }

  return null;
}
