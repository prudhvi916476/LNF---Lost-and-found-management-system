-- =========================================================================
-- Enable Row Level Security (RLS) on all public tables in Supabase / Postgres
-- Resolves Supabase Security Advisor "RLS Disabled in Public" Critical Alerts
-- =========================================================================

-- 1. Enable RLS on all public tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.found_item_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_verification_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- 2. Define service_role and postgres full access policies
DO $$
DECLARE
  tbl text;
  tbls text[] := ARRAY[
    'organizations', 'audit_log', 'users', 'lost_items', 'found_items',
    'item_images', 'found_item_claims', 'custom_verification_questions',
    'matches', 'claims', 'claim_evidence', 'conversations', 'messages',
    'notifications', 'qr_tags', 'user_badges'
  ];
BEGIN
  FOREACH tbl IN ARRAY tbls
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = tbl 
        AND policyname = 'service_role_full_access'
    ) THEN
      EXECUTE format('
        CREATE POLICY service_role_full_access ON public.%I
          FOR ALL
          TO service_role, postgres
          USING (true)
          WITH CHECK (true);
      ', tbl);
    END IF;
  END LOOP;
END
$$;
