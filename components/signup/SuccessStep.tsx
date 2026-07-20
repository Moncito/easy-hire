import { Role } from "./types";

type Props = {
  role: Role;
};

export default function SuccessStep({ role }: Props) {
  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-xl shadow-black/5">
      <h1 className="mb-2 font-display text-2xl font-bold text-ink">Welcome to EasyHire!</h1>
      <p className="text-sm text-ink/60">
        {role === "SEEKER"
          ? "Your account is ready. Taking you to your dashboard..."
          : "Your company account is ready. Taking you to your dashboard..."}
      </p>
    </div>
  );
}