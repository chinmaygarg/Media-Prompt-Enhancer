-- Supabase Database Schema for Prompt Enhancement Service
-- Run this in your Supabase SQL Editor

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'creator', 'professional', 'enterprise')),
    usage_count INTEGER DEFAULT 0,
    usage_reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prompt templates (for configurable LLM prompts)
CREATE TABLE prompt_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('analysis', 'questions', 'enhancement')),
    content TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhancement sessions (for tracking user interactions and analytics)
CREATE TABLE enhancement_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_prompt TEXT NOT NULL,
    enhanced_prompt TEXT,
    content_type VARCHAR(50) NOT NULL,
    platform VARCHAR(50) NOT NULL,
    questions_data JSONB,
    user_answers JSONB,
    processing_time_ms INTEGER,
    model_used VARCHAR(50),
    confidence_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User feedback for continuous improvement
CREATE TABLE user_feedback (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES enhancement_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_prompt_templates_type ON prompt_templates(template_type);
CREATE INDEX idx_prompt_templates_active ON prompt_templates(is_active);
CREATE INDEX idx_enhancement_sessions_user_id ON enhancement_sessions(user_id);
CREATE INDEX idx_enhancement_sessions_created_at ON enhancement_sessions(created_at);
CREATE INDEX idx_user_feedback_session_id ON user_feedback(session_id);

-- Insert default prompt templates
INSERT INTO prompt_templates (name, template_type, content, variables) VALUES 
(
    'Product Analysis Template',
    'analysis',
    'You are an expert marketing strategist analyzing products and services for content creation.

Analyze this product/service request for creating digital marketing content:

User Input: "{user_input}"
Content Type: {content_type}
Platform: {platform}

Please analyze and identify:
1. PRODUCT/SERVICE TYPE: What category does this fall into?
2. KEY FEATURES: What are the main functional benefits?
3. EMOTIONAL APPEALS: What emotions should the content evoke?
4. TARGET AUDIENCE: Who would be most interested in this?
5. COMPETITIVE ADVANTAGES: What makes this unique?
6. VISUAL STYLE: What aesthetic would work best?

Provide analysis in structured JSON format with the following structure:
{
  "product_type": "string",
  "key_features": ["string"],
  "emotional_appeals": ["string"],
  "target_audience": "string",
  "competitive_advantages": ["string"],
  "visual_style_recommendations": ["string"]
}',
    '["user_input", "content_type", "platform"]'::jsonb
),
(
    'Question Generation Template',
    'questions',
    'You are an expert at generating objective questions to optimize marketing content.

Based on this analysis: {analysis}

Generate 3-5 objective questions to optimize marketing content creation. 
Focus on gaps in understanding that would significantly improve the final prompt.

Each question should:
- Have 3-4 specific answer choices
- Be answerable in 5 seconds
- Directly impact content quality
- Be skippable without breaking the flow

Return as JSON array with this exact structure:
[
  {
    "question_id": "q1",
    "question_text": "What is your primary target audience?",
    "options": ["Young Adults (18-25)", "Professionals (25-40)", "Families", "Seniors (50+)"]
  }
]

Generate 3-5 relevant questions based on the analysis provided.',
    '["analysis"]'::jsonb
),
(
    'Enhancement Template',
    'enhancement',
    'You are the world''s best prompt engineer for AI image/video generation, specializing in marketing content.

Create the perfect prompt for generating {content_type} content:

ORIGINAL INPUT: "{original_input}"
PRODUCT ANALYSIS: {analysis}
USER PREFERENCES: {user_answers}
TARGET PLATFORM: {platform}

Requirements:
- Create content that converts viewers to customers
- Include specific visual details for product/service appeal  
- Add emotional triggers and psychological appeals
- Specify lighting, composition, colors for maximum impact
- Include platform-specific optimization ({platform} format and style)
- Make it extremely creative and engaging
- Focus on marketing effectiveness and conversion

Generate a detailed, professional prompt that will create stunning marketing content optimized for {platform}. The prompt should be comprehensive but concise, focusing on visual elements that drive engagement and conversion.',
    '["original_input", "content_type", "analysis", "user_answers", "platform"]'::jsonb
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prompt_templates_updated_at BEFORE UPDATE ON prompt_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();