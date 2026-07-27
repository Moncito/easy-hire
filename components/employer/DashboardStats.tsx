type Props = {
  activeJobs: number;
  totalApplicants: number;
  pendingReviewJobs: number;
};

export default function DashboardStats({ activeJobs, totalApplicants, pendingReviewJobs }: Props) {
  const stats = [
    { label: "Active job postings", value: activeJobs },
    { label: "Total applicants", value: totalApplicants },
    { label: "Jobs pending review", value: pendingReviewJobs },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl bg-white p-6 shadow-md shadow-black/5">
          <p className="font-data text-3xl font-bold text-ink">{stat.value}</p>
          <p className="mt-1 text-sm text-ink/60">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}