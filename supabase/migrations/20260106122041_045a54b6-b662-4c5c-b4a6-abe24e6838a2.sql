-- Add time-based auto-delete policy for data retention (90 days)
CREATE POLICY "Auto-delete old shared analyses"
ON public.shared_analyses
FOR DELETE
USING (created_at < NOW() - INTERVAL '90 days');

-- Create a SECURITY DEFINER function for admin deletion via edge function
-- This allows controlled deletion without exposing raw SQL
CREATE OR REPLACE FUNCTION public.delete_shared_analysis_by_code(p_share_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.shared_analyses 
  WHERE share_code = p_share_code;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count > 0;
END;
$$;