"use client";

type Props = {
  children: React.ReactNode;
  /** Fill the shell (messages / kanban). Dashboard should size to content. */
  fill?: boolean;
};

export default function EmployerPageEnter({ children, fill = false }: Props) {
  return (
    <div
      className={
        fill
          ? "employer-page-enter flex h-full min-h-0 flex-1 flex-col"
          : "employer-page-enter"
      }
    >
      {children}
    </div>
  );
}
