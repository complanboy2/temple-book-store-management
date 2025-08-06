-- Create user_metadata table for storing detailed user information
CREATE TABLE public.user_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mobile_number TEXT UNIQUE NOT NULL,
  family_members TEXT, -- Can store as comma-separated or JSON
  gothram TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  institute_id TEXT NOT NULL
);

-- Create activities table for managing different types of activities
CREATE TABLE public.activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  institute_id TEXT NOT NULL
);

-- Create activity_slots table for specific date-based activity instances
CREATE TABLE public.activity_slots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  display_name TEXT NOT NULL, -- e.g., "Satyanarayana Swamy Vratam - 2025-09-01"
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  institute_id TEXT NOT NULL
);

-- Create user_activity_bookings table for tracking user participation
CREATE TABLE public.user_activity_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_metadata_id UUID NOT NULL REFERENCES public.user_metadata(id) ON DELETE CASCADE,
  activity_slot_id UUID NOT NULL REFERENCES public.activity_slots(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  institute_id TEXT NOT NULL,
  UNIQUE(user_metadata_id, activity_slot_id) -- Prevent duplicate bookings
);

-- Enable Row Level Security
ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_metadata
CREATE POLICY "Admins can manage user metadata" 
ON public.user_metadata 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can view user metadata" 
ON public.user_metadata 
FOR SELECT 
USING (true);

-- Create RLS policies for activities
CREATE POLICY "Admins can manage activities" 
ON public.activities 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can view activities" 
ON public.activities 
FOR SELECT 
USING (true);

-- Create RLS policies for activity_slots
CREATE POLICY "Admins can manage activity slots" 
ON public.activity_slots 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can view activity slots" 
ON public.activity_slots 
FOR SELECT 
USING (true);

-- Create RLS policies for user_activity_bookings
CREATE POLICY "Admins can manage bookings" 
ON public.user_activity_bookings 
FOR ALL 
USING (is_current_user_admin());

CREATE POLICY "Users can view bookings" 
ON public.user_activity_bookings 
FOR SELECT 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_metadata_updated_at
BEFORE UPDATE ON public.user_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activities_updated_at
BEFORE UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_slots_updated_at
BEFORE UPDATE ON public.activity_slots
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_metadata_mobile ON public.user_metadata(mobile_number);
CREATE INDEX idx_user_metadata_name ON public.user_metadata(name);
CREATE INDEX idx_activity_slots_date ON public.activity_slots(scheduled_date);
CREATE INDEX idx_user_activity_bookings_slot ON public.user_activity_bookings(activity_slot_id);
CREATE INDEX idx_user_activity_bookings_user ON public.user_activity_bookings(user_metadata_id);