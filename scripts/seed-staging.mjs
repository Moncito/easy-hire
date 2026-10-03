// Fills the STAGING database with a fixed set of test accounts, companies,
// jobs and applications, so nobody has to sign up by hand after a reset.
// See plans/STAGING-AND-RELEASE.md.
//
// Reads `.env.staging` (never `.env`) and refuses to run unless DATABASE_URL
// points at the staging Supabase project. Safe to run repeatedly: every row
// is matched by a stable key (email, company owner, job title) and updated in
// place instead of duplicated.
//
// All accounts share one password, SEED_PASSWORD from `.env.staging`.
// Addresses use the reserved `.test` domain, so they can never receive mail.
//
// Usage:
//   node scripts/seed-staging.mjs
//
// Mirrors the style of scripts/grant-employer-pro.mjs.

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "dotenv";

config({ path: ".env.staging", override: true });

// Supabase project ref of `easyhire-staging`. The production ref is
// deliberately not listed anywhere in this file.
const STAGING_PROJECT_REF = "pmonckgkzmszkuycizcn";

const databaseUrl = process.env.DATABASE_URL ?? "";
if (!databaseUrl.includes(STAGING_PROJECT_REF)) {
  console.error(
    "Refusing to seed: DATABASE_URL in .env.staging does not point at the staging project " +
      `(${STAGING_PROJECT_REF}).`
  );
  process.exit(1);
}

const password = process.env.SEED_PASSWORD;
if (!password || password.length < 10) {
  console.error("Refusing to seed: set SEED_PASSWORD (10+ characters) in .env.staging.");
  process.exit(1);
}

// Must match CURRENT_TERMS_VERSION in lib/legal/terms-version.ts, or every
// seeded user is bounced to /accept-terms on first login.
const TERMS_VERSION = "2026-10-01";

const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const DAY_MS = 24 * 60 * 60 * 1000;

async function upsertUser(email, role, passwordHash) {
  const now = new Date();
  const data = {
    passwordHash,
    role,
    emailVerifiedAt: now,
    termsAcceptedAt: now,
    termsVersion: TERMS_VERSION,
  };
  return prisma.user.upsert({
    where: { email },
    update: data,
    create: { email, ...data },
  });
}

async function upsertSeeker(email, passwordHash, profile) {
  const user = await upsertUser(email, "SEEKER", passwordHash);
  const seeker = await prisma.seekerProfile.upsert({
    where: { userId: user.id },
    update: profile,
    create: { userId: user.id, ...profile },
  });
  return { user, seeker };
}

async function upsertEmployer(email, passwordHash, company) {
  const user = await upsertUser(email, "EMPLOYER", passwordHash);
  const data = { ...company, verifiedStatus: "APPROVED" };
  const row = await prisma.company.upsert({
    where: { userId: user.id },
    update: data,
    create: { userId: user.id, ...data },
  });
  return { user, company: row };
}

async function upsertJob(companyId, job) {
  const now = new Date();
  const data = {
    ...job,
    status: "ACTIVE",
    publishedAt: now,
    expiresAt: new Date(now.getTime() + 90 * DAY_MS),
  };
  const existing = await prisma.job.findFirst({ where: { companyId, title: job.title } });
  if (existing) return prisma.job.update({ where: { id: existing.id }, data });
  return prisma.job.create({ data: { companyId, ...data } });
}

async function upsertApplication(jobId, seekerId, status) {
  const hired = status === "HIRED";
  const data = {
    status,
    hiredAt: hired ? new Date() : null,
    hireSource: hired ? "EMPLOYER_MARKED" : null,
    hireConfirmedBySeekerAt: null,
    firstEmployerResponseAt: status === "APPLIED" ? null : new Date(),
  };
  const application = await prisma.application.upsert({
    where: { jobId_seekerId: { jobId, seekerId } },
    update: data,
    create: { jobId, seekerId, ...data },
  });
  // A reset returns each seeded application to a clean state: no offers left
  // over from earlier test runs (plans/HIRE-REVENUE-PLAN.md).
  await prisma.jobOffer.deleteMany({ where: { applicationId: application.id } });
  return application;
}

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await upsertUser("admin@easyhire.test", "ADMIN", passwordHash);
  await prisma.adminProfile.upsert({
    where: { userId: admin.id },
    update: { level: "SUPER_ADMIN" },
    create: { userId: admin.id, level: "SUPER_ADMIN" },
  });

  const free = await upsertEmployer("employer.free@easyhire.test", passwordHash, {
    companyName: "Staging Free Co",
    description: "Free-plan employer for staging tests.",
    industry: "E-commerce",
    website: "https://example.com",
  });

  const pro = await upsertEmployer("employer.pro@easyhire.test", passwordHash, {
    companyName: "Staging Pro Co",
    description: "Employer Pro company for staging tests.",
    industry: "Marketing agency",
    website: "https://example.com",
  });

  const hasPro = await prisma.subscription.findFirst({
    where: { companyId: pro.company.id, planType: "PRO", status: "ACTIVE" },
  });
  if (!hasPro) {
    await prisma.subscription.create({
      data: { companyId: pro.company.id, planType: "PRO", status: "ACTIVE" },
    });
  }

  const vaOne = await upsertSeeker("va.one@easyhire.test", passwordHash, {
    fullName: "Ana Staging",
    headline: "Executive Virtual Assistant",
    bio: "Test VA profile for staging.",
    location: "Cebu, Philippines",
    skills: ["Email management|Proficient", "Calendar management|Proficient", "Customer support|Proficient"],
    yearsExperience: "3-5",
  });

  const vaTwo = await upsertSeeker("va.two@easyhire.test", passwordHash, {
    fullName: "Ben Staging",
    headline: "Social Media VA",
    bio: "Second test VA profile for staging.",
    location: "Davao, Philippines",
    skills: ["Canva|Proficient", "Content scheduling|Proficient", "Community management|Proficient"],
    yearsExperience: "1-2",
  });

  const freeJob = await upsertJob(free.company.id, {
    title: "Customer Support VA (Staging)",
    description: "Handle email and chat support for a small online store. Staging test listing.",
    category: "Customer Support",
    industry: "Call Center & Customer Service",
    employmentType: "FULL_TIME",
    location: "Remote",
    salaryMin: 25000,
    salaryMax: 35000,
    salaryPeriod: "MONTHLY",
  });

  await upsertJob(free.company.id, {
    title: "Data Entry VA (Staging)",
    description: "Part-time data entry and spreadsheet cleanup. Staging test listing.",
    category: "Virtual Assistant",
    industry: "Administration & Office Support",
    employmentType: "PART_TIME",
    location: "Remote",
    salaryMin: 15000,
    salaryMax: 20000,
    salaryPeriod: "MONTHLY",
  });

  const proJob = await upsertJob(pro.company.id, {
    title: "Social Media Manager VA (Staging)",
    description: "Plan and schedule content across three brand accounts. Staging test listing.",
    category: "Social Media Manager",
    industry: "Marketing & Communications",
    employmentType: "FULL_TIME",
    location: "Remote",
    salaryMin: 30000,
    salaryMax: 45000,
    salaryPeriod: "MONTHLY",
  });

  await upsertApplication(freeJob.id, vaOne.seeker.id, "APPLIED");
  await upsertApplication(freeJob.id, vaTwo.seeker.id, "INTERVIEW");
  await upsertApplication(proJob.id, vaTwo.seeker.id, "SHORTLISTED");
  await upsertApplication(proJob.id, vaOne.seeker.id, "HIRED");

  console.log("Seeded staging: 1 admin, 2 employers (Free + Pro), 2 VAs, 3 jobs, 4 applications.");
  console.log("Accounts (password = SEED_PASSWORD in .env.staging):");
  for (const email of [
    "admin@easyhire.test",
    "employer.free@easyhire.test",
    "employer.pro@easyhire.test",
    "va.one@easyhire.test",
    "va.two@easyhire.test",
  ]) {
    console.log(`  ${email}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
