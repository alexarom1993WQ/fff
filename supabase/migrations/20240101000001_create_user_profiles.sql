-- Create user profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create members table with user_id foreign key
CREATE TABLE IF NOT EXISTS public.members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  membership_status TEXT DEFAULT 'pending' CHECK (membership_status IN ('active', 'expired', 'pending')),
  last_attendance DATE,
  image_url TEXT,
  phone_number TEXT,
  email TEXT,
  membership_type TEXT,
  membership_start_date DATE,
  membership_end_date DATE,
  subscription_type TEXT,
  sessions_remaining INTEGER DEFAULT 0,
  subscription_price DECIMAL(10,2),
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'partial')),
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table with user_id foreign key
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  member_id UUID REFERENCES public.members(id),
  amount DECIMAL(10,2) NOT NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  subscription_type TEXT NOT NULL,
  payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card', 'transfer')),
  notes TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'pending', 'cancelled')),
  invoice_number TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create activities table with user_id foreign key
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  member_id UUID REFERENCES public.members(id),
  member_name TEXT,
  member_image TEXT,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('check-in', 'membership-renewal', 'payment', 'other')),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_user_id ON public.members(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_members_membership_status ON public.members(membership_status);
CREATE INDEX IF NOT EXISTS idx_payments_date ON public.payments(date);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp);

-- Enable realtime for all tables (tables are already added to publication)

-- Create RLS policies
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Members policies
DROP POLICY IF EXISTS "Users can view own members" ON public.members;
CREATE POLICY "Users can view own members"
  ON public.members FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own members" ON public.members;
CREATE POLICY "Users can insert own members"
  ON public.members FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own members" ON public.members;
CREATE POLICY "Users can update own members"
  ON public.members FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own members" ON public.members;
CREATE POLICY "Users can delete own members"
  ON public.members FOR DELETE
  USING (auth.uid() = user_id);

-- Payments policies
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own payments" ON public.payments;
CREATE POLICY "Users can insert own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own payments" ON public.payments;
CREATE POLICY "Users can update own payments"
  ON public.payments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own payments" ON public.payments;
CREATE POLICY "Users can delete own payments"
  ON public.payments FOR DELETE
  USING (auth.uid() = user_id);

-- Activities policies
DROP POLICY IF EXISTS "Users can view own activities" ON public.activities;
CREATE POLICY "Users can view own activities"
  ON public.activities FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can insert own activities"
  ON public.activities FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update own activities" ON public.activities;
CREATE POLICY "Users can update own activities"
  ON public.activities FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own activities" ON public.activities;
CREATE POLICY "Users can delete own activities"
  ON public.activities FOR DELETE
  USING (auth.uid() = user_id);