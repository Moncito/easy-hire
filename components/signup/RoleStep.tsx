import { Role } from "./types";

type Props = {
  onSelect: (role: Role) => void;
};

export default function RoleStep({ onSelect }: Props) {
  return (
    <div>
      <h1 className="mb-8 text-center font-display text-2xl font-bold text-ink">
        How do you want to use EasyHire?
      </h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <button
          onClick={() => onSelect("SEEKER")}
          className="rounded-3xl border-2 border-marigold/30 bg-white p-8 text-left shadow-lg shadow-black/5 transition-all hover:border-marigold hover:shadow-xl cursor-pointer"
        >
          <p className="mb-2 font-display text-xl font-bold text-ink">Looking for work</p>
          <p className="mb-4 text-sm text-ink/60">Find VA opportunities and apply with one profile</p>
          <span className="font-semibold text-marigold">Select &rarr;</span>
        </button>
        <button
          onClick={() => onSelect("EMPLOYER")}
          className="rounded-3xl border-2 border-teal/30 bg-white p-8 text-left shadow-lg shadow-black/5 transition-all hover:border-teal hover:shadow-xl cursor-pointer"
        >
          <p className="mb-2 font-display text-xl font-bold text-ink">Looking to hire</p>
          <p className="mb-4 text-sm text-ink/60">Post jobs and review applicants directly</p>
          <span className="font-semibold text-teal">Select &rarr;</span>
        </button>
      </div>
    </div>
  );
}