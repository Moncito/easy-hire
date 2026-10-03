import { businessInfo, contractingPartyName } from "@/lib/legal/business-info";

/**
 * Who-we-are block shared by the Terms and Privacy Policy. Unregistered
 * fields (null in lib/legal/business-info.ts) collapse into one honest
 * "pending" line rather than printing placeholders.
 */
export default function BusinessDetails() {
  const { legalName, registration, address, brandName } = businessInfo;
  const pending = !legalName || !registration || !address;

  return (
    <dl className="grid gap-x-6 gap-y-2 rounded-xl border border-ink/10 bg-white/60 p-4 text-sm sm:grid-cols-[auto_1fr]">
      <dt className="font-semibold text-ink">Operator</dt>
      <dd>
        {contractingPartyName()}
        {legalName && legalName !== brandName ? ` (trading as ${brandName})` : null}
      </dd>
      {registration && (
        <>
          <dt className="font-semibold text-ink">Registration</dt>
          <dd className="font-mono text-xs">{registration}</dd>
        </>
      )}
      {address && (
        <>
          <dt className="font-semibold text-ink">Address</dt>
          <dd>{address}</dd>
        </>
      )}
      <dt className="font-semibold text-ink">Contact</dt>
      <dd>
        <a href={`mailto:${businessInfo.contact.general}`} className="text-navy hover:underline">
          {businessInfo.contact.general}
        </a>
      </dd>
      {pending && (
        <dd className="text-xs text-ink/55 sm:col-span-2">
          Our business registration details will be published here once registration is complete.
        </dd>
      )}
    </dl>
  );
}
