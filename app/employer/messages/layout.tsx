export default function EmployerMessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-0 flex-col bg-white">
      {children}
    </div>
  );
}
