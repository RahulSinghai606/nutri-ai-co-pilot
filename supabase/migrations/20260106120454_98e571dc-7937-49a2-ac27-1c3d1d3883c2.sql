-- Drop the existing unrestricted insert policy
DROP POLICY IF EXISTS "Anyone can create shared analyses" ON public.shared_analyses;

-- Create a throttled insert policy that limits to 100 inserts per hour globally
-- This provides defense-in-depth alongside existing gateway rate limiting
CREATE POLICY "Throttled shared analyses inserts"
ON public.shared_analyses
FOR INSERT
WITH CHECK (
  (SELECT COUNT(*) FROM public.shared_analyses 
   WHERE created_at > NOW() - INTERVAL '1 hour') < 100
);