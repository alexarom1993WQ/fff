-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_image TEXT,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  attendance_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  session_type TEXT NOT NULL DEFAULT 'regular', -- 'regular' or 'single_session'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  subscription_type TEXT NOT NULL, -- '13 حصة', '15 حصة', '30 حصة', etc.
  total_sessions INTEGER NOT NULL DEFAULT 0,
  used_sessions INTEGER NOT NULL DEFAULT 0,
  remaining_sessions INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'completed'
  price DECIMAL(10,2),
  payment_status TEXT NOT NULL DEFAULT 'paid', -- 'paid', 'unpaid', 'partial'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, attendance_date);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_member_id ON sessions(member_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user_member ON sessions(user_id, member_id);

-- Enable realtime for both tables (skip if already added)
-- alter publication supabase_realtime add table attendance;
-- alter publication supabase_realtime add table sessions;

-- Create function to automatically update remaining_sessions
CREATE OR REPLACE FUNCTION update_remaining_sessions()
RETURNS TRIGGER AS $$
BEGIN
  NEW.remaining_sessions = NEW.total_sessions - NEW.used_sessions;
  NEW.updated_at = NOW();
  
  -- Update status based on remaining sessions
  IF NEW.remaining_sessions <= 0 THEN
    NEW.status = 'completed';
  ELSIF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    NEW.status = 'expired';
  ELSE
    NEW.status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for sessions table
DROP TRIGGER IF EXISTS trigger_update_remaining_sessions ON sessions;
CREATE TRIGGER trigger_update_remaining_sessions
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_remaining_sessions();

-- Create function to update attendance timestamp
CREATE OR REPLACE FUNCTION update_attendance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for attendance table
DROP TRIGGER IF EXISTS trigger_update_attendance_timestamp ON attendance;
CREATE TRIGGER trigger_update_attendance_timestamp
  BEFORE UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_timestamp();

-- Enable Row Level Security
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for attendance table
DROP POLICY IF EXISTS "Users can view their own attendance records" ON attendance;
CREATE POLICY "Users can view their own attendance records"
  ON attendance FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own attendance records" ON attendance;
CREATE POLICY "Users can insert their own attendance records"
  ON attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own attendance records" ON attendance;
CREATE POLICY "Users can update their own attendance records"
  ON attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own attendance records" ON attendance;
CREATE POLICY "Users can delete their own attendance records"
  ON attendance FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for sessions table
DROP POLICY IF EXISTS "Users can view their own sessions" ON sessions;
CREATE POLICY "Users can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sessions" ON sessions;
CREATE POLICY "Users can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own sessions" ON sessions;
CREATE POLICY "Users can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sessions" ON sessions;
CREATE POLICY "Users can delete their own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update session when attendance is marked
CREATE OR REPLACE FUNCTION handle_attendance_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the corresponding session's used_sessions count
  UPDATE sessions 
  SET used_sessions = used_sessions + 1,
      updated_at = NOW()
  WHERE id = (
    SELECT id FROM sessions
    WHERE member_id = NEW.member_id 
      AND user_id = NEW.user_id 
      AND status = 'active'
      AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    ORDER BY created_at ASC
    LIMIT 1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create weekly_attendance table
CREATE TABLE IF NOT EXISTS weekly_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  member_image TEXT,
  week_start_date DATE NOT NULL, -- Start of the week (Monday)
  week_end_date DATE NOT NULL,   -- End of the week (Sunday)
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,  -- Week number in the year (1-53)
  total_days_attended INTEGER NOT NULL DEFAULT 0,
  attendance_days TEXT[] DEFAULT '{}', -- Array of days attended ['Monday', 'Tuesday', etc.]
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, member_id, year, week_number)
);

-- Create indexes for weekly_attendance table
CREATE INDEX IF NOT EXISTS idx_weekly_attendance_user_id ON weekly_attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_attendance_member_id ON weekly_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_weekly_attendance_week ON weekly_attendance(year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_attendance_user_week ON weekly_attendance(user_id, year, week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_attendance_member_week ON weekly_attendance(member_id, year, week_number);

-- Enable Row Level Security for weekly_attendance
ALTER TABLE weekly_attendance ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for weekly_attendance table
DROP POLICY IF EXISTS "Users can view their own weekly attendance" ON weekly_attendance;
CREATE POLICY "Users can view their own weekly attendance"
  ON weekly_attendance FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own weekly attendance" ON weekly_attendance;
CREATE POLICY "Users can insert their own weekly attendance"
  ON weekly_attendance FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own weekly attendance" ON weekly_attendance;
CREATE POLICY "Users can update their own weekly attendance"
  ON weekly_attendance FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own weekly attendance" ON weekly_attendance;
CREATE POLICY "Users can delete their own weekly attendance"
  ON weekly_attendance FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update weekly attendance timestamp
CREATE OR REPLACE FUNCTION update_weekly_attendance_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for weekly_attendance table
DROP TRIGGER IF EXISTS trigger_update_weekly_attendance_timestamp ON weekly_attendance;
CREATE TRIGGER trigger_update_weekly_attendance_timestamp
  BEFORE UPDATE ON weekly_attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_weekly_attendance_timestamp();

-- Create function to automatically update weekly attendance when daily attendance is added
CREATE OR REPLACE FUNCTION handle_weekly_attendance_update()
RETURNS TRIGGER AS $$
DECLARE
  week_start DATE;
  week_end DATE;
  week_num INTEGER;
  year_num INTEGER;
  day_name TEXT;
  total_daily_attendance INTEGER;
  existing_record RECORD;
BEGIN
  -- Calculate week start (Sunday) and end (Saturday)
  week_start := (DATE_TRUNC('week', NEW.attendance_date) - INTERVAL '1 day')::DATE;
  week_end := (week_start + INTERVAL '6 days')::DATE;
  
  -- Get week number and year
  week_num := EXTRACT(WEEK FROM NEW.attendance_date);
  year_num := EXTRACT(YEAR FROM NEW.attendance_date);
  
  -- Get day name in Arabic (Sunday = 0, Monday = 1, etc.)
  day_name := CASE EXTRACT(DOW FROM NEW.attendance_date)
    WHEN 0 THEN 'الأحد'
    WHEN 1 THEN 'الإثنين'
    WHEN 2 THEN 'الثلاثاء'
    WHEN 3 THEN 'الأربعاء'
    WHEN 4 THEN 'الخميس'
    WHEN 5 THEN 'الجمعة'
    WHEN 6 THEN 'السبت'
  END;
  
  -- Calculate total daily attendance for this date including:
  -- 1. Regular attendance records
  -- 2. Session payments (single sessions)
  -- 3. Non-subscribed customers total sessions for this date
  SELECT 
    COALESCE(
      (SELECT COUNT(*) FROM attendance WHERE user_id = NEW.user_id AND attendance_date = NEW.attendance_date), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM payments WHERE user_id = NEW.user_id AND subscription_type = 'حصة واحدة' AND date::date = NEW.attendance_date), 0
    ) +
    COALESCE(
      (SELECT SUM(total_sessions) FROM non_subscribed_customers WHERE user_id = NEW.user_id AND last_visit_date = NEW.attendance_date), 0
    )
  INTO total_daily_attendance;
  
  -- Check if weekly record already exists for this user and week
  SELECT * INTO existing_record
  FROM weekly_attendance 
  WHERE user_id = NEW.user_id 
    AND year = year_num 
    AND week_number = week_num
  LIMIT 1;
  
  IF existing_record IS NOT NULL THEN
    -- Update existing weekly record
    UPDATE weekly_attendance
    SET 
      attendance_days = CASE 
        WHEN day_name = ANY(attendance_days) THEN attendance_days
        ELSE array_append(attendance_days, day_name)
      END,
      total_days_attended = CASE 
        WHEN day_name = ANY(attendance_days) THEN total_days_attended
        ELSE total_days_attended + 1
      END,
      updated_at = NOW()
    WHERE id = existing_record.id;
  ELSE
    -- Create new weekly record using the member info from the current attendance
    INSERT INTO weekly_attendance (
      user_id, member_id, member_name, member_image,
      week_start_date, week_end_date, year, week_number,
      total_days_attended, attendance_days
    )
    VALUES (
      NEW.user_id, NEW.member_id, NEW.member_name, NEW.member_image,
      week_start, week_end, year_num, week_num,
      1, ARRAY[day_name]
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to handle weekly attendance removal when daily attendance is deleted
CREATE OR REPLACE FUNCTION handle_weekly_attendance_removal()
RETURNS TRIGGER AS $$
DECLARE
  week_num INTEGER;
  year_num INTEGER;
  day_name TEXT;
  updated_days TEXT[];
BEGIN
  -- Get week number and year
  week_num := EXTRACT(WEEK FROM OLD.attendance_date);
  year_num := EXTRACT(YEAR FROM OLD.attendance_date);
  
  -- Get day name in Arabic (Sunday = 0, Monday = 1, etc.)
  day_name := CASE EXTRACT(DOW FROM OLD.attendance_date)
    WHEN 0 THEN 'الأحد'
    WHEN 1 THEN 'الإثنين'
    WHEN 2 THEN 'الثلاثاء'
    WHEN 3 THEN 'الأربعاء'
    WHEN 4 THEN 'الخميس'
    WHEN 5 THEN 'الجمعة'
    WHEN 6 THEN 'السبت'
  END;
  
  -- Remove the day from attendance_days array and update total
  UPDATE weekly_attendance
  SET 
    attendance_days = array_remove(attendance_days, day_name),
    total_days_attended = GREATEST(total_days_attended - 1, 0),
    updated_at = NOW()
  WHERE user_id = OLD.user_id 
    AND member_id = OLD.member_id 
    AND year = year_num 
    AND week_number = week_num;
  
  -- Delete the weekly record if no days attended
  DELETE FROM weekly_attendance
  WHERE user_id = OLD.user_id 
    AND member_id = OLD.member_id 
    AND year = year_num 
    AND week_number = week_num
    AND total_days_attended = 0;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for weekly attendance updates
DROP TRIGGER IF EXISTS trigger_weekly_attendance_update ON attendance;
CREATE TRIGGER trigger_weekly_attendance_update
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION handle_weekly_attendance_update();

DROP TRIGGER IF EXISTS trigger_weekly_attendance_removal ON attendance;
CREATE TRIGGER trigger_weekly_attendance_removal
  AFTER DELETE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION handle_weekly_attendance_removal();

-- Create function to get weekly attendance summary with total attendance calculation
DROP FUNCTION IF EXISTS get_weekly_attendance_summary(UUID, INTEGER, INTEGER);
CREATE OR REPLACE FUNCTION get_weekly_attendance_summary(p_user_id UUID, p_year INTEGER DEFAULT NULL, p_week INTEGER DEFAULT NULL)
RETURNS TABLE (
  member_id UUID,
  member_name TEXT,
  member_image TEXT,
  week_start_date DATE,
  week_end_date DATE,
  total_days_attended INTEGER,
  attendance_days TEXT[],
  attendance_percentage NUMERIC,
  total_weekly_attendance INTEGER,
  total_daily_attendance INTEGER
) AS $
DECLARE
  target_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
  target_week INTEGER := COALESCE(p_week, EXTRACT(WEEK FROM CURRENT_DATE));
  week_start_calc DATE;
  week_end_calc DATE;
  total_week_attendance INTEGER := 0;
  total_daily_count INTEGER := 0;
BEGIN
  -- Calculate week boundaries
  SELECT 
    (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day')::DATE,
    (DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '1 day' + INTERVAL '6 days')::DATE
  INTO week_start_calc, week_end_calc;
  
  -- Calculate total weekly attendance including all sources
  SELECT 
    COALESCE(
      (SELECT COUNT(*) FROM attendance 
       WHERE user_id = p_user_id 
         AND attendance_date BETWEEN week_start_calc AND week_end_calc), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM payments 
       WHERE user_id = p_user_id 
         AND subscription_type = 'حصة واحدة' 
         AND date::date BETWEEN week_start_calc AND week_end_calc), 0
    ) +
    COALESCE(
      (SELECT SUM(total_sessions) FROM non_subscribed_customers 
       WHERE user_id = p_user_id 
         AND last_visit_date BETWEEN week_start_calc AND week_end_calc), 0
    )
  INTO total_week_attendance;
  
  -- Calculate total daily attendance count (sum of all daily attendance records)
  SELECT 
    COALESCE(
      (SELECT COUNT(*) FROM attendance 
       WHERE user_id = p_user_id 
         AND attendance_date BETWEEN week_start_calc AND week_end_calc), 0
    ) +
    COALESCE(
      (SELECT COUNT(*) FROM payments 
       WHERE user_id = p_user_id 
         AND subscription_type = 'حصة واحدة' 
         AND date::date BETWEEN week_start_calc AND week_end_calc), 0
    ) +
    COALESCE(
      (SELECT SUM(total_sessions) FROM non_subscribed_customers 
       WHERE user_id = p_user_id 
         AND last_visit_date BETWEEN week_start_calc AND week_end_calc), 0
    )
  INTO total_daily_count;
  
  RETURN QUERY
  SELECT 
    wa.member_id,
    wa.member_name,
    wa.member_image,
    wa.week_start_date,
    wa.week_end_date,
    wa.total_days_attended,
    wa.attendance_days,
    ROUND((wa.total_days_attended::NUMERIC / 7.0) * 100, 2) as attendance_percentage,
    total_week_attendance as total_weekly_attendance,
    total_daily_count as total_daily_attendance
  FROM weekly_attendance wa
  WHERE wa.user_id = p_user_id
    AND wa.year = target_year
    AND wa.week_number = target_week
  ORDER BY wa.member_name;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get member weekly attendance history
CREATE OR REPLACE FUNCTION get_member_weekly_history(p_user_id UUID, p_member_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  week_start_date DATE,
  week_end_date DATE,
  year INTEGER,
  week_number INTEGER,
  total_days_attended INTEGER,
  attendance_days TEXT[],
  attendance_percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    wa.week_start_date,
    wa.week_end_date,
    wa.year,
    wa.week_number,
    wa.total_days_attended,
    wa.attendance_days,
    ROUND((wa.total_days_attended::NUMERIC / 7.0) * 100, 2) as attendance_percentage
  FROM weekly_attendance wa
  WHERE wa.user_id = p_user_id AND wa.member_id = p_member_id
  ORDER BY wa.year DESC, wa.week_number DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable realtime for weekly_attendance table (already added)

-- Create function to automatically restore session when attendance is removed
CREATE OR REPLACE FUNCTION handle_attendance_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Restore the session's used_sessions count
  UPDATE sessions 
  SET used_sessions = GREATEST(used_sessions - 1, 0),
      updated_at = NOW()
  WHERE id = (
    SELECT id FROM sessions
    WHERE member_id = OLD.member_id 
      AND user_id = OLD.user_id
    ORDER BY updated_at DESC
    LIMIT 1
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for attendance table
DROP TRIGGER IF EXISTS trigger_attendance_insert ON attendance;
CREATE TRIGGER trigger_attendance_insert
  AFTER INSERT ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION handle_attendance_insert();

DROP TRIGGER IF EXISTS trigger_attendance_delete ON attendance;
CREATE TRIGGER trigger_attendance_delete
  AFTER DELETE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION handle_attendance_delete();

-- Create function to get member session summary
CREATE OR REPLACE FUNCTION get_member_session_summary(p_user_id UUID, p_member_id UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  used_sessions INTEGER,
  remaining_sessions INTEGER,
  status TEXT,
  last_attendance_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(s.total_sessions, 0) as total_sessions,
    COALESCE(s.used_sessions, 0) as used_sessions,
    COALESCE(s.remaining_sessions, 0) as remaining_sessions,
    COALESCE(s.status, 'inactive') as status,
    MAX(a.attendance_date) as last_attendance_date
  FROM sessions s
  LEFT JOIN attendance a ON a.member_id = s.member_id AND a.user_id = s.user_id
  WHERE s.user_id = p_user_id AND s.member_id = p_member_id
    AND s.status = 'active'
  GROUP BY s.total_sessions, s.used_sessions, s.remaining_sessions, s.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create non_subscribed_customers table for single session customers
CREATE TABLE IF NOT EXISTS non_subscribed_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL DEFAULT 'زبون غير مشترك',
  phone_number TEXT,
  email TEXT,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  last_visit_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for non_subscribed_customers table
CREATE INDEX IF NOT EXISTS idx_non_subscribed_customers_user_id ON non_subscribed_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_non_subscribed_customers_phone ON non_subscribed_customers(phone_number);
CREATE INDEX IF NOT EXISTS idx_non_subscribed_customers_last_visit ON non_subscribed_customers(last_visit_date);

-- Enable Row Level Security for non_subscribed_customers
ALTER TABLE non_subscribed_customers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for non_subscribed_customers table
DROP POLICY IF EXISTS "Users can view their own non-subscribed customers" ON non_subscribed_customers;
CREATE POLICY "Users can view their own non-subscribed customers"
  ON non_subscribed_customers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own non-subscribed customers" ON non_subscribed_customers;
CREATE POLICY "Users can insert their own non-subscribed customers"
  ON non_subscribed_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own non-subscribed customers" ON non_subscribed_customers;
CREATE POLICY "Users can update their own non-subscribed customers"
  ON non_subscribed_customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own non-subscribed customers" ON non_subscribed_customers;
CREATE POLICY "Users can delete their own non-subscribed customers"
  ON non_subscribed_customers FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update non_subscribed_customers timestamp
CREATE OR REPLACE FUNCTION update_non_subscribed_customers_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for non_subscribed_customers table
DROP TRIGGER IF EXISTS trigger_update_non_subscribed_customers_timestamp ON non_subscribed_customers;
CREATE TRIGGER trigger_update_non_subscribed_customers_timestamp
  BEFORE UPDATE ON non_subscribed_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_non_subscribed_customers_timestamp();

-- Create function to get comprehensive attendance statistics
DROP FUNCTION IF EXISTS get_attendance_stats(UUID, DATE, DATE);
CREATE OR REPLACE FUNCTION get_attendance_stats(p_user_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_attendance INTEGER,
  unique_members INTEGER,
  avg_daily_attendance NUMERIC,
  regular_attendance INTEGER,
  session_payments INTEGER,
  non_subscribed_sessions INTEGER
) AS $$
DECLARE
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
  days_count INTEGER;
  regular_count INTEGER := 0;
  session_count INTEGER := 0;
  non_subscribed_count INTEGER := 0;
BEGIN
  days_count := (end_date - start_date) + 1;
  
  -- Count regular attendance
  SELECT COUNT(*) INTO regular_count
  FROM attendance
  WHERE user_id = p_user_id
    AND attendance_date BETWEEN start_date AND end_date;
  
  -- Count session payments
  SELECT COUNT(*) INTO session_count
  FROM payments
  WHERE user_id = p_user_id
    AND subscription_type = 'حصة واحدة'
    AND date::date BETWEEN start_date AND end_date;
  
  -- Count non-subscribed customer sessions
  SELECT COALESCE(SUM(total_sessions), 0) INTO non_subscribed_count
  FROM non_subscribed_customers
  WHERE user_id = p_user_id
    AND last_visit_date BETWEEN start_date AND end_date;
  
  RETURN QUERY
  SELECT 
    (regular_count + session_count + non_subscribed_count)::INTEGER as total_attendance,
    (SELECT COUNT(DISTINCT member_id) FROM attendance WHERE user_id = p_user_id AND attendance_date BETWEEN start_date AND end_date)::INTEGER as unique_members,
    ROUND((regular_count + session_count + non_subscribed_count)::NUMERIC / days_count, 2) as avg_daily_attendance,
    regular_count::INTEGER as regular_attendance,
    session_count::INTEGER as session_payments,
    non_subscribed_count::INTEGER as non_subscribed_sessions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get non-subscribed customers statistics
CREATE OR REPLACE FUNCTION get_non_subscribed_stats(p_user_id UUID, p_start_date DATE DEFAULT NULL, p_end_date DATE DEFAULT NULL)
RETURNS TABLE (
  total_customers INTEGER,
  total_sessions INTEGER,
  total_revenue NUMERIC,
  avg_sessions_per_customer NUMERIC
) AS $$
DECLARE
  start_date DATE := COALESCE(p_start_date, CURRENT_DATE - INTERVAL '30 days');
  end_date DATE := COALESCE(p_end_date, CURRENT_DATE);
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT nsc.id)::INTEGER as total_customers,
    COALESCE(SUM(nsc.total_sessions), 0)::INTEGER as total_sessions,
    COALESCE(SUM(nsc.total_amount_paid), 0)::NUMERIC as total_revenue,
    CASE 
      WHEN COUNT(DISTINCT nsc.id) > 0 THEN ROUND(COALESCE(SUM(nsc.total_sessions), 0)::NUMERIC / COUNT(DISTINCT nsc.id), 2)
      ELSE 0
    END as avg_sessions_per_customer
  FROM non_subscribed_customers nsc
  WHERE nsc.user_id = p_user_id
    AND (nsc.last_visit_date IS NULL OR nsc.last_visit_date BETWEEN start_date AND end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;