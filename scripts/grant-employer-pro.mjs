import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();
const search = process.argv[2] ?? "Black Saint";

async function main() {
  const companies = await prisma.company.findMany({
    where: { companyName: { contains: search, mode: "insensitive" } },
    select: {
      id: true,
      companyName: true,
      user: { select: { email: true } },
      subscriptions: {
        select: { id: true, planType: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (companies.length === 0) {
    console.error(`No company found matching "${search}".`);
    process.exit(1);
  }

  if (companies.length > 1) {
    console.log("Multiple matches — using the first exact-ish match:");
    companies.forEach((c) => console.log(` - ${c.companyName} (${c.user.email})`));
  }

  const company = companies[0];
  console.log(`Granting Employer Pro to: ${company.companyName} (${company.user.email})`);

  const existing = company.subscriptions.find(
    (s) => s.planType === "PRO" && s.status === "ACTIVE"
  );

  if (existing) {
    console.log(`Already on Employer Pro (subscription ${existing.id}).`);
    return;
  }

  const inactivePro = company.subscriptions.find((s) => s.planType === "PRO");
  if (inactivePro) {
    const updated = await prisma.subscription.update({
      where: { id: inactivePro.id },
      data: { status: "ACTIVE" },
    });
    console.log(`Reactivated Pro subscription: ${updated.id}`);
    return;
  }

  const created = await prisma.subscription.create({
    data: {
      companyId: company.id,
      planType: "PRO",
      status: "ACTIVE",
    },
  });
  console.log(`Created Pro subscription: ${created.id}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
