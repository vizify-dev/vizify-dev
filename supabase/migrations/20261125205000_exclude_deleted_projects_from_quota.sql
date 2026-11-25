CREATE OR REPLACE FUNCTION public.enforce_project_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  p text;
  n int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(NEW.user_id::text));

  SELECT plan INTO p
  FROM public.profiles
  WHERE id = NEW.user_id;

  IF p = 'free' THEN
    SELECT COUNT(*) INTO n
    FROM public.projects
    WHERE user_id = NEW.user_id
      AND deleted_at IS NULL;

    IF n >= 3 THEN
      RAISE EXCEPTION 'project_limit_reached';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
