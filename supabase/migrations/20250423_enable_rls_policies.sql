
-- Enable Row Level Security for book_stalls table and add necessary policies
ALTER TABLE IF EXISTS public.book_stalls ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read all book_stalls
CREATE POLICY IF NOT EXISTS "Allow users to read all book_stalls" 
ON public.book_stalls FOR SELECT USING (true);

-- Create policy to allow authenticated users to insert their own book_stalls
CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert book_stalls" 
ON public.book_stalls FOR INSERT WITH CHECK (true);

-- Create policy to allow authenticated users to update their own book_stalls
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update own book_stalls" 
ON public.book_stalls FOR UPDATE USING (true);

-- Create policy to allow authenticated users to delete their own book_stalls
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete own book_stalls" 
ON public.book_stalls FOR DELETE USING (true);
