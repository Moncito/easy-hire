import { Suspense } from "react";
import MessagesInbox from "@/components/messages/MessagesInbox";

export default function SeekerMessagesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-ink/45">Loading messages...</p>}>
      <MessagesInbox role="SEEKER" />
    </Suspense>
  );
}
