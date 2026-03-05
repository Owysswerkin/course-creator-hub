
-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- User roles (separate table per security rules)
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'user' role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_role
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- Courses
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published courses are viewable by everyone" ON public.courses FOR SELECT USING (published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lessons viewable if course is viewable" ON public.lessons FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND (published = true OR public.has_role(auth.uid(), 'admin')))
);
CREATE POLICY "Admins can manage lessons" ON public.lessons FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON public.lessons
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enrollments
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own enrollments" ON public.enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll themselves" ON public.enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unenroll themselves" ON public.enrollments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON public.enrollments FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Lesson Progress
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can mark lessons complete" ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unmark lessons" ON public.lesson_progress FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.lesson_progress FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Certificates
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  certificate_url TEXT,
  UNIQUE (user_id, course_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can verify certificate by id" ON public.certificates FOR SELECT USING (true);
