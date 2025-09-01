# Database Setup Instructions

## Quick Setup

1. **Open Supabase Dashboard**: Go to https://supabase.com/dashboard and select your project
2. **Run Schema**: In the SQL Editor, copy and paste the contents of `schema.sql` and run it
3. **Setup RLS**: Copy and paste the contents of `rls-policies.sql` and run it

## Database Structure

### Tables

#### `users`
- Extends Supabase auth.users
- Tracks subscription tiers and usage limits
- Auto-created when user signs up

#### `prompt_templates`
- Stores configurable LLM prompt templates
- Supports versioning and activation status
- Pre-populated with default templates

#### `enhancement_sessions`
- Tracks all prompt enhancement requests
- Stores original prompts, enhanced results, and user interactions
- Used for analytics and improvement

#### `user_feedback`
- Collects user ratings and feedback
- Linked to enhancement sessions
- Used for continuous improvement

### Default Templates

The schema includes three default prompt templates:

1. **Product Analysis Template**: For analyzing user input and extracting marketing insights
2. **Question Generation Template**: For creating intelligent follow-up questions
3. **Enhancement Template**: For generating marketing-perfect prompts

## Security

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Service role has full access for API operations
- Templates are publicly readable but admin-managed

## Environment Variables Required

Make sure these are set in your Supabase project:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Testing the Setup

After running the SQL scripts, you should see:

1. 4 tables created (users, prompt_templates, enhancement_sessions, user_feedback)
2. 3 default prompt templates inserted
3. RLS policies active on all tables
4. Trigger for automatic user profile creation