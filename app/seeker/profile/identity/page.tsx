import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { requireSeekerPageContext } from "@/lib/auth/seeker-session";
import { ensureSeekerProfile } from "@/lib/seekers";
import { listIdentityDocuments, getVerificationScoreBreakdown } from "@/lib/seeker/identity-verification";
import { toBucketCompletionState, firstIncompleteBucket } from "@/lib/seeker/profile-completion";
import { profileBucketCompletion } from "@/components/seeker/profile-buckets";
import IdentityVerificationPanel from "@/components/seeker/IdentityVerificationPanel";
import { SeekerNavBandBleed } from "@/components/seeker/SeekerNavBand";

export default async function SeekerIdentityVerificationPage() {
  const { session, userId } = await requireSeekerPageContext();
  const ensuredProfile = await ensureSeekerProfile(userId, {
    fullName: session.user.name ?? "",
  });

  // Both depend on the profile existing (ensured above), but not on each
  // other — run them concurrently.
  const [identityDocuments, verificationScoreResult] = await Promise.all([
    listIdentityDocuments(userId),
    getVerificationScoreBreakdown(userId, ensuredProfile),
  ]);

  const bucketState = toBucketCompletionState(ensuredProfile);
  const { completed, total } = profileBucketCompletion(bucketState);
  const publicProfileHref = `/seekers/${ensuredProfile.id}`;

  return (
    <>
      <SeekerNavBandBleed section="Identity verification" icon={ShieldCheck} hint="Verify your identity" />

      <div className="pt-6 sm:pt-8">
        <Link
          href="/seeker/profile"
          className="inline-flex items-center gap-1 text-sm text-ink/50 transition-colors hover:text-ink"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Back to profile
        </Link>

        <div className="mb-6 mt-3 animate-fade-in lg:mb-8">
          <h1 className="font-display text-3xl font-bold text-ink sm:text-4xl">Identity verification</h1>
          <p className="mt-1.5 text-sm text-ink/50">Build trust with employers</p>
        </div>

        <IdentityVerificationPanel
          status={ensuredProfile.idVerificationStatus}
          rejectionReason={ensuredProfile.idVerificationRejectionReason}
          score={verificationScoreResult.score}
          breakdown={verificationScoreResult.breakdown}
          idVerifiedAt={ensuredProfile.idVerifiedAt?.toISOString() ?? null}
          profileBucketsCompleted={completed}
          profileBucketsTotal={total}
          firstIncompleteBucket={firstIncompleteBucket(ensuredProfile)}
          publicProfileHref={publicProfileHref}
          initialDocuments={identityDocuments.map((doc) => ({
            id: doc.id,
            fileUrl: doc.fileUrl,
            fileName: doc.fileName,
            docType: doc.docType,
            uploadedAt: doc.uploadedAt.toISOString(),
          }))}
        />
      </div>
    </>
  );
}
