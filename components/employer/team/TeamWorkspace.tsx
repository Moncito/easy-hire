"use client";

import { FormEvent, useState } from "react";
import { Clock3, Mail, ShieldCheck, UserPlus, UsersRound, X } from "lucide-react";
import {
  Avatar,
  Button,
  Card,
  IconButton,
  PageHeader,
  Select,
  StatusBadge,
  type SelectOption,
  type StatusTone,
} from "@/components/employer/system";
import EmployerConfirmModal from "@/components/employer/EmployerConfirmModal";
import ProFormSection from "@/components/employer/pro-dashboard/ProFormSection";

type Role = "OWNER" | "RECRUITER" | "HIRING_MANAGER" | "VIEWER";
type Member = { id: string; role: Role; user: { id: string; email: string } };
type Team = {
  members: Member[];
  invitations: Array<{ id: string; email: string; role: Role; expiresAt: string }>;
};

const ROLES: Record<Role, { label: string; description: string; tone: StatusTone }> = {
  OWNER: { label: "Owner", description: "Full workspace and team control", tone: "warning" },
  RECRUITER: { label: "Recruiter", description: "Manages applicants and feedback", tone: "success" },
  HIRING_MANAGER: { label: "Hiring manager", description: "Reviews assigned roles", tone: "info" },
  VIEWER: { label: "Viewer", description: "Read-only workspace access", tone: "neutral" },
};

const ASSIGNABLE: Exclude<Role, "OWNER">[] = ["RECRUITER", "HIRING_MANAGER", "VIEWER"];
const ROLE_OPTIONS: SelectOption[] = ASSIGNABLE.map((r) => ({
  value: r,
  label: ROLES[r].label,
  description: ROLES[r].description,
}));

function RoleBadge({ role }: { role: Role }) {
  return <StatusBadge tone={ROLES[role].tone}>{ROLES[role].label}</StatusBadge>;
}

/**
 * The private hiring room: who has access, what each role can do, and
 * invitations. Same API calls as before (invite, revoke, change role,
 * remove); removing someone's access now asks first.
 */
export default function TeamWorkspace({
  initialTeam,
  canManage = true,
  companyName = "Your company",
  companyLogoUrl,
  viewerRole,
}: {
  initialTeam: Team;
  canManage?: boolean;
  companyName?: string;
  companyLogoUrl?: string | null;
  viewerRole?: Role;
}) {
  const [team, setTeam] = useState(initialTeam);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<Role, "OWNER">>("RECRUITER");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [removing, setRemoving] = useState<Member | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  async function invite(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const res = await fetch("/api/employer/team/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) return setError(data.error || "Could not send invitation.");
    setTeam((current) => ({
      ...current,
      invitations: [data, ...current.invitations.filter((item) => item.email !== data.email)],
    }));
    setEmail("");
  }

  async function revoke(id: string) {
    setError("");
    const res = await fetch(`/api/employer/team/invitations/${id}`, { method: "DELETE" });
    if (!res.ok) return setError((await res.json()).error || "Could not revoke invitation.");
    setTeam((current) => ({ ...current, invitations: current.invitations.filter((item) => item.id !== id) }));
  }

  async function remove(id: string) {
    setError("");
    setRemoveBusy(true);
    const res = await fetch(`/api/employer/team/${id}`, { method: "DELETE" });
    setRemoveBusy(false);
    if (!res.ok) {
      setRemoving(null);
      return setError((await res.json()).error || "Could not remove member.");
    }
    setTeam((current) => ({ ...current, members: current.members.filter((item) => item.id !== id) }));
    setRemoving(null);
  }

  async function changeRole(id: string, nextRole: Role) {
    setError("");
    const res = await fetch(`/api/employer/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Could not update role.");
    setTeam((current) => ({
      ...current,
      members: current.members.map((item) => (item.id === id ? { ...item, role: data.role } : item)),
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Hiring team"
        leading={<Avatar name={companyName} src={companyLogoUrl} size="lg" shape="square" />}
        description={`${companyName}’s private decision-making space.`}
        meta={
          <>
            <span>
              <b className="num font-semibold text-eh-ink">{team.members.length}</b> active
            </span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span>
              <b className="num font-semibold text-eh-ink">{team.invitations.length}</b> invited
            </span>
          </>
        }
      />

      {!canManage && viewerRole && (
        <p className="flex items-start gap-3 rounded-card border border-[color-mix(in_srgb,var(--eh-teal)_22%,transparent)] bg-eh-teal-tint px-4 py-3 text-ui text-eh-ink-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-eh-teal" aria-hidden="true" />
          <span>
            <b className="font-semibold text-eh-ink">You’re reviewing as a {ROLES[viewerRole].label.toLowerCase()}.</b>{" "}
            {ROLES[viewerRole].description}. Your seeker profile remains separate.
          </span>
        </p>
      )}

      {canManage && (
        <ProFormSection
          id="invite"
          title="Bring in a teammate"
          description="Invite only the people needed for this role."
          icon={<UserPlus />}
          tone="marigold"
        >
          <form onSubmit={invite} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_200px_auto]">
            <label className="sr-only" htmlFor="member-email">
              Work email
            </label>
            <input
              id="member-email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              className="h-10 min-w-0 rounded-control border border-eh-line bg-eh-surface px-3 text-ui text-eh-ink outline-none transition-colors duration-150 placeholder:text-eh-muted hover:border-[color-mix(in_srgb,var(--eh-ink)_22%,var(--eh-line))] focus-visible:border-eh-teal"
            />
            <Select
              label="Invitee role"
              value={role}
              onChange={(next) => setRole(next as Exclude<Role, "OWNER">)}
              options={ROLE_OPTIONS}
              className="h-10 w-full"
              menuWidth={260}
            />
            <Button type="submit" size="lg" variant="primary" icon={<Mail />} loading={pending}>
              {pending ? "Sending…" : "Invite"}
            </Button>
          </form>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-eh-line pt-4 text-small text-eh-muted">
            {ASSIGNABLE.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <RoleBadge role={item} />
                {ROLES[item].description}
              </li>
            ))}
          </ul>
          {error && (
            <p role="alert" className="mt-3 text-ui text-eh-danger">
              {error}
            </p>
          )}
        </ProFormSection>
      )}

      <Card padded={false} aria-labelledby="people-heading" className="overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-5 sm:px-6">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-eh-teal-tint text-eh-teal-ink" aria-hidden="true">
            <UsersRound className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="people-heading" className="font-heading text-[18px] font-semibold tracking-[-0.01em] text-eh-ink">
              People with access
            </h2>
            <p className="mt-0.5 text-ui text-eh-muted">
              A single source of truth for your hiring room · <span className="num">{team.members.length} active</span>
            </p>
          </div>
        </div>
        <ul className="divide-y divide-eh-line border-t border-eh-line">
          {team.members.map((member) => (
            <li
              key={member.id}
              className="flex flex-wrap items-center gap-3 px-5 py-3.5 transition-colors duration-150 hover:bg-eh-surface-2 sm:flex-nowrap sm:px-6"
            >
              <Avatar
                name={member.user.email}
                src={member.role === "OWNER" ? companyLogoUrl : null}
                size="md"
                shape={member.role === "OWNER" ? "square" : "circle"}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-ui font-semibold text-eh-ink">{member.user.email}</p>
                <p className="mt-0.5 text-small text-eh-muted">
                  {canManage ? ROLES[member.role].description : "Private hiring workspace member"}
                </p>
              </div>
              {canManage && member.role !== "OWNER" ? (
                <div className="flex items-center gap-1.5">
                  <Select
                    label={`Change access for ${member.user.email}`}
                    size="sm"
                    value={member.role}
                    onChange={(next) => void changeRole(member.id, next as Exclude<Role, "OWNER">)}
                    options={ROLE_OPTIONS}
                    className="w-40"
                    menuWidth={260}
                  />
                  <IconButton
                    aria-label={`Remove ${member.user.email}`}
                    title="Remove access"
                    icon={<X />}
                    onClick={() => setRemoving(member)}
                    className="hover:text-eh-danger!"
                  />
                </div>
              ) : (
                <RoleBadge role={member.role} />
              )}
            </li>
          ))}
        </ul>

        {canManage && team.invitations.length > 0 && (
          <>
            <div className="flex items-center justify-between border-y border-eh-line bg-eh-surface-2 px-5 py-2.5 sm:px-6">
              <span className="inline-flex items-center gap-2 text-small font-medium text-eh-ink-2">
                <Clock3 className="h-4 w-4 text-eh-muted" aria-hidden="true" />
                Waiting to join
              </span>
              <span className="text-small text-eh-muted">Invites expire after 7 days</span>
            </div>
            <ul className="divide-y divide-eh-line">
              {team.invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap sm:px-6">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-eh-surface-2 text-eh-muted" aria-hidden="true">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-ui font-semibold text-eh-ink">{invitation.email}</p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-small text-eh-muted">
                      <RoleBadge role={invitation.role} />
                      Expires {new Date(invitation.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => void revoke(invitation.id)} className="text-eh-danger! hover:bg-eh-danger-tint!">
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <EmployerConfirmModal
        open={removing !== null}
        title="Remove this teammate?"
        subject={removing?.user.email}
        description="They lose access to this company's hiring workspace right away. You can invite them again later."
        confirmLabel="Remove access"
        danger
        loading={removeBusy}
        onCancel={() => {
          if (removeBusy) return;
          setRemoving(null);
        }}
        onConfirm={() => removing && void remove(removing.id)}
      />
    </div>
  );
}
