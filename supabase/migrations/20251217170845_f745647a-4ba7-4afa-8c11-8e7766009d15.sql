-- Create profiles table for user preferences
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  diet_preference TEXT DEFAULT 'any' CHECK (diet_preference IN ('veg', 'non-veg', 'any')),
  budget_preference TEXT DEFAULT 'moderate' CHECK (budget_preference IN ('budget', 'moderate', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dining requests table
CREATE TABLE public.dining_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  restaurant_name TEXT NOT NULL,
  location TEXT NOT NULL,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  cuisine_type TEXT,
  diet_type TEXT DEFAULT 'any' CHECK (diet_type IN ('veg', 'non-veg', 'any')),
  budget TEXT DEFAULT 'moderate' CHECK (budget IN ('budget', 'moderate', 'premium')),
  max_participants INTEGER DEFAULT 4,
  description TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create participants table for joining requests
CREATE TABLE public.dining_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.dining_requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, user_id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dining_participants ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Dining requests policies
CREATE POLICY "Anyone can view open requests" ON public.dining_requests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create requests" ON public.dining_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own requests" ON public.dining_requests FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own requests" ON public.dining_requests FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Participants policies
CREATE POLICY "Anyone can view participants" ON public.dining_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join requests" ON public.dining_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave requests" ON public.dining_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_dining_requests_updated_at BEFORE UPDATE ON public.dining_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();