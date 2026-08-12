-- Speed up "latest message per conversation" lookups for inbox list
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx"
ON "messages" ("conversation_id", "created_at" DESC);
