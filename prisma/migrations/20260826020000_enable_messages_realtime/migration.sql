-- Enable Postgres change broadcasting for the messages table, used by the
-- server-side Realtime subscription that powers live message delivery
-- (see lib/messaging/messages.ts / lib/collaborative-messages.ts). Idempotent
-- so it's safe regardless of whether this Supabase project already has the
-- default realtime publication set up.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
