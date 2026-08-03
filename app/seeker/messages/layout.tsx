export default function SeekerMessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-20 flex flex-col overflow-hidden bg-white">
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </div>
  );
}
