-- Add remaining tables to realtime (shift_requests already added)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swap_requests;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Add unique constraint on attendance_records for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_shift_worker_unique 
ON public.attendance_records (shift_id, worker_id);