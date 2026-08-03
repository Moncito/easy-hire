import { Suspense } from "react";
import MessagesInbox from "@/components/messages/MessagesInbox";
import MessagesSkeleton from "@/components/messages/MessagesSkeleton";

export default function SeekerMessagesPage() {
  return (
    <Suspense fallback={<MessagesSkeleton showNavBand />}>
      <MessagesInbox role="SEEKER" fillNavClearance />
    </Suspense>
  );
}
