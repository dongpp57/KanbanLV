-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Drop existing tables if they exist to prevent type conflicts
DROP TABLE IF EXISTS public.attachments;
DROP TABLE IF EXISTS public.tasks;

-- 1. Create tasks table
CREATE TABLE public.tasks (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    title text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'todo',
    position numeric NOT NULL,
    tags text[],
    links text[]
);

-- 2. Create attachments table
CREATE TABLE public.attachments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_url text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Enable RLS (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- 4. Create Public Access Policies for Tasks
CREATE POLICY "Enable SELECT for all users on tasks" ON public.tasks FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for all users on tasks" ON public.tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for all users on tasks" ON public.tasks FOR UPDATE USING (true);
CREATE POLICY "Enable DELETE for all users on tasks" ON public.tasks FOR DELETE USING (true);

-- 5. Create Public Access Policies for Attachments
CREATE POLICY "Enable SELECT for attachments" ON public.attachments FOR SELECT USING (true);
CREATE POLICY "Enable INSERT for attachments" ON public.attachments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable UPDATE for attachments" ON public.attachments FOR UPDATE USING (true);
CREATE POLICY "Enable DELETE for attachments" ON public.attachments FOR DELETE USING (true);

-- 6. Storage Bucket setup (task_attachments)
INSERT INTO storage.buckets (id, name, public) VALUES ('task_attachments', 'task_attachments', true) ON CONFLICT DO NOTHING;

-- 7. Storage Policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "Public Update" ON storage.objects;
DROP POLICY IF EXISTS "Public Delete" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'task_attachments');
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'task_attachments');
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'task_attachments');
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING (bucket_id = 'task_attachments');
