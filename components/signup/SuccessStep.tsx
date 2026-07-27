import { Role } from "./types";

type Props = {
  role: Role;
};

export default function SuccessStep({ role }: Props) {
  const accentColor = role === "SEEKER" ? "#F2A93B" : "#1F8073";

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-10 text-center shadow-xl shadow-black/5">
      <style>{`
        @keyframes checkmark-scale {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes dots-pulse {
          0%, 20% { opacity: 1; }
          50% { opacity: 0.3; }
          80%, 100% { opacity: 1; }
        }
        .checkmark-icon {
          animation: checkmark-scale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .dots-pulse-1 { animation: dots-pulse 1.4s infinite 0s; }
        .dots-pulse-2 { animation: dots-pulse 1.4s infinite 0.2s; }
        .dots-pulse-3 { animation: dots-pulse 1.4s infinite 0.4s; }
      `}</style>

      <div className="mb-6 flex justify-center">
        <div
          className="checkmark-icon flex h-20 w-20 items-center justify-center rounded-full"
          style={{ backgroundColor: accentColor + "20" }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 28L12 20M20 28L36 12M20 28V28"
              stroke={accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      <h1 className="mb-2 font-display text-2xl font-bold text-ink">
        Welcome to EasyHire!
      </h1>

      <p className="mb-6 text-sm text-ink/60">
        {role === "SEEKER"
          ? "Your account is ready."
          : "Your company account is ready."}
      </p>

      <p className="text-sm text-ink/50">
        Redirecting you to your dashboard
        <span className="dots-pulse-1">.</span>
        <span className="dots-pulse-2">.</span>
        <span className="dots-pulse-3">.</span>
      </p>
    </div>
  );
}