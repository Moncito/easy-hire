import { Suspense } from "react";
import MessagesInbox from "@/components/messages/MessagesInbox";
import MessagesSkeleton from "@/components/messages/MessagesSkeleton";

export default function EmployerMessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton />}>
      <MessagesInbox role="EMPLOYER" />
    </Suspense>
  );
}
