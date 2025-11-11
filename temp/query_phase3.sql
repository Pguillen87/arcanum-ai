-- Inspect RLS, triggers, indexes for key tables
SELECT 'assets' AS table, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.assets'::regclass;
SELECT 'transcriptions' AS table, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.transcriptions'::regclass;
SELECT 'transcription_history' AS table, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.transcription_history'::regclass;
SELECT 'transformations' AS table, relrowsecurity, relforcerowsecurity
FROM pg_class WHERE oid = 'public.transformations'::regclass;

SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname='public'
  AND tablename IN ('assets','transcriptions','transcription_history','transformations')
ORDER BY tablename, cmd;

SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_schema='public'
  AND event_object_table IN ('assets','transcriptions','transcription_history','transformations','projects','notifications','characters')
ORDER BY event_object_table, trigger_name;

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname='public'
  AND tablename IN ('transcriptions','transcription_history','assets','transformations')
ORDER BY tablename, indexname;
