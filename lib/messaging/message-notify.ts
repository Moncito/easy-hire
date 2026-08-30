/**
 * New-message email throttling — pure decision logic, no Prisma.
 *
 * The rule: send at most one "you have a new message" email per unread
 * streak. A message is the "first unread" for its recipient when the
 * recipient has no *other* unread message from the sender's side still
 * sitting in the same conversation (i.e. `earlierUnreadCount === 0`,
 * computed as `Message.count({ conversationId, senderUserId: { not:
 * recipientUserId }, readAt: null, id: { not: newMessageId } })`).
 *
 * Once the recipient reads the thread (readAt gets set on those rows —
 * via `getConversationThread` / `getMessagesAfter` / `markConversationRead`),
 * the next message they haven't seen again counts as "first unread" and
 * triggers exactly one more email. A back-and-forth burst of messages sent
 * before the recipient reads anything only ever fires the first email.
 *
 * Failure modes:
 *  - Race condition: two messages from the same sender, written concurrently
 *    before either commit, can both observe `earlierUnreadCount === 0` and
 *    both send an email (no row lock / dedupe key exists for this). Rare in
 *    practice since sends are one-at-a-time per user action.
 *  - No time-based cooldown: if the recipient is actively polling
 *    (getMessagesAfter marks messages read as they're fetched) and reads a
 *    message right as a second one arrives, the second can still count as
 *    "first unread" and trigger another email. This matches the desired
 *    "notify once per quiet period" behavior for a recipient who has left
 *    the conversation, but can send more than one email in a single close,
 *    fast-moving conversation the recipient is only half-watching.
 *  - Read receipts are per-message, not per-visit: `readAt` is set in bulk
 *    for every unread row from the other side whenever the recipient opens
 *    or polls the thread, so this degrades gracefully — there's no separate
 *    "did they see this exact message" signal to get out of sync with.
 *  - Would be strengthened by a `lastNotifiedAt` column on `Conversation`
 *    (a real cooldown window, e.g. one email per conversation per N
 *    minutes regardless of read state) — that requires a migration, which
 *    is out of scope here.
 */
export function shouldSendNewMessageEmail(earlierUnreadCount: number): boolean {
  return earlierUnreadCount <= 0;
}
