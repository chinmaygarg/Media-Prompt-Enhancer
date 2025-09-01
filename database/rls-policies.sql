-- Row Level Security (RLS) Policies for Prompt Enhancement Service
-- Run this after the main schema

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Prompt templates policies (read-only for users, admin can manage)
CREATE POLICY "Anyone can view active templates" ON prompt_templates
    FOR SELECT USING (is_active = true);

CREATE POLICY "Service role can manage templates" ON prompt_templates
    FOR ALL USING (auth.role() = 'service_role');

-- Enhancement sessions policies
CREATE POLICY "Users can view own sessions" ON enhancement_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions" ON enhancement_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON enhancement_sessions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage sessions" ON enhancement_sessions
    FOR ALL USING (auth.role() = 'service_role');

-- User feedback policies
CREATE POLICY "Users can view own feedback" ON user_feedback
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own feedback" ON user_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" ON user_feedback
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage feedback" ON user_feedback
    FOR ALL USING (auth.role() = 'service_role');

-- Function to handle user creation (trigger on auth.users)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();