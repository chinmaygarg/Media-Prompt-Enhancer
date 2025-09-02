-- Row Level Security (RLS) Policies for Prompt Enhancement Service
-- Run this after the main schema

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhancement_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE consistency_object_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_assets ENABLE ROW LEVEL SECURITY;

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

-- Media assets policies
CREATE POLICY "Users can view own media assets" ON media_assets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own media assets" ON media_assets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own media assets" ON media_assets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own media assets" ON media_assets
  FOR DELETE USING (auth.uid() = user_id);

-- Products policies
CREATE POLICY "Users can view own products" ON products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- Product assets policies (inherit from product ownership)
CREATE POLICY "Users can view own product assets" ON product_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_assets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own product assets" ON product_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_assets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own product assets" ON product_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_assets.product_id 
      AND products.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own product assets" ON product_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM products 
      WHERE products.id = product_assets.product_id 
      AND products.user_id = auth.uid()
    )
  );

-- Consistency objects policies
CREATE POLICY "Users can view own consistency objects" ON consistency_objects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consistency objects" ON consistency_objects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own consistency objects" ON consistency_objects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own consistency objects" ON consistency_objects
  FOR DELETE USING (auth.uid() = user_id);

-- Consistency object assets policies (inherit from consistency object ownership)
CREATE POLICY "Users can view own consistency object assets" ON consistency_object_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM consistency_objects 
      WHERE consistency_objects.id = consistency_object_assets.consistency_object_id 
      AND consistency_objects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own consistency object assets" ON consistency_object_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM consistency_objects 
      WHERE consistency_objects.id = consistency_object_assets.consistency_object_id 
      AND consistency_objects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own consistency object assets" ON consistency_object_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM consistency_objects 
      WHERE consistency_objects.id = consistency_object_assets.consistency_object_id 
      AND consistency_objects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own consistency object assets" ON consistency_object_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM consistency_objects 
      WHERE consistency_objects.id = consistency_object_assets.consistency_object_id 
      AND consistency_objects.user_id = auth.uid()
    )
  );

-- Session assets policies (inherit from session ownership)
CREATE POLICY "Users can view own session assets" ON session_assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM enhancement_sessions 
      WHERE enhancement_sessions.id = session_assets.session_id 
      AND enhancement_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session assets" ON session_assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM enhancement_sessions 
      WHERE enhancement_sessions.id = session_assets.session_id 
      AND enhancement_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own session assets" ON session_assets
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM enhancement_sessions 
      WHERE enhancement_sessions.id = session_assets.session_id 
      AND enhancement_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own session assets" ON session_assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM enhancement_sessions 
      WHERE enhancement_sessions.id = session_assets.session_id 
      AND enhancement_sessions.user_id = auth.uid()
    )
  );

-- Service role policies for all new tables
CREATE POLICY "Service role can manage media assets" ON media_assets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage products" ON products
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage product assets" ON product_assets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage consistency objects" ON consistency_objects
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage consistency object assets" ON consistency_object_assets
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage session assets" ON session_assets
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up expired temporary files (run as scheduled task)
CREATE OR REPLACE FUNCTION cleanup_expired_media_assets()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  expired_asset RECORD;
BEGIN
  -- Find and delete expired assets
  FOR expired_asset IN
    SELECT id, storage_bucket, storage_path
    FROM media_assets
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW()
  LOOP
    -- Delete from database
    DELETE FROM media_assets WHERE id = expired_asset.id;
    deleted_count := deleted_count + 1;
    
    -- Note: Storage file deletion should be handled by the application
    -- since we can't make HTTP calls from PostgreSQL functions
  END LOOP;
  
  RETURN deleted_count;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_media_assets() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_media_assets() TO service_role;