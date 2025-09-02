# Database Setup Guide

## Overview
This guide helps you set up your Supabase database to support multimodal prompt enhancement with storage capabilities.

## Prerequisites
- Supabase project with admin access
- Access to Supabase Dashboard SQL Editor

## Migration Steps

### Manual Schema Setup (Required)
Apply the database schema via Supabase Dashboard:

1. **Go to Supabase Dashboard > SQL Editor**

2. **Copy and paste the complete contents of `/database/schema.sql`**

3. **Run the SQL** - This creates all tables, indexes, RLS policies, and functions

4. **Create Storage Buckets** (via Supabase Dashboard > Storage):
   - Create `user-uploads` bucket (private) - for user uploaded media
   - Create `system` bucket (public) - for system templates and defaults

## New Database Tables Created

### Core Storage Tables
- `media_assets` - File metadata and references
- `products` - Product library for brand consistency
- `product_assets` - Links products to media files
- `consistency_objects` - Character cards, scenes, styles
- `consistency_object_assets` - Links consistency objects to media
- `session_assets` - Links media files to enhancement sessions

### Key Features
- **Row Level Security (RLS)** - Users can only access their own data
- **Automatic cleanup** - Expired temporary files are handled
- **Comprehensive indexing** - Optimized query performance
- **Foreign key constraints** - Data integrity maintained

## Storage Configuration

### Bucket Structure
```
user-uploads/ (Private)
├── {user_id}/
│   ├── reference-images/
│   ├── reference-videos/
│   └── audio-styles/

system/ (Public)
├── templates/
└── defaults/
```

### File Type Support
- **Images**: JPEG, PNG, WebP, GIF
- **Videos**: MP4, WebM, QuickTime, AVI  
- **Audio**: MP3, WAV, OGG

### Storage Limits by Subscription
- **Free**: 2 files, 10MB each, 100MB total
- **Creator**: 5 files, 50MB each, 1GB total
- **Professional**: 10 files, 100MB each, 5GB total
- **Enterprise**: 50 files, 500MB each, 25GB total

## Verification Steps

After migration, verify:

1. **Tables Created**:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('media_assets', 'products', 'consistency_objects');
```

2. **RLS Enabled**:
```sql
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

3. **Storage Buckets**:
   - Check Supabase Dashboard > Storage
   - Verify `user-uploads` and `system` buckets exist

## API Endpoints Ready

The following endpoints are now available:

### File Management
- `POST /api/upload` - Upload media files
- `GET /api/media/[id]` - Serve files with access control
- `DELETE /api/media/[id]` - Delete media assets

### Product Library  
- `GET/POST /api/products` - Manage products
- `GET/PUT/DELETE /api/products/[id]` - Individual product operations
- `POST/DELETE /api/products/[id]/assets` - Manage product assets

### Consistency Objects
- `GET/POST /api/consistency-objects` - Character cards, scenes
- `GET/PUT/DELETE /api/consistency-objects/[id]` - Individual operations
- `POST /api/consistency-objects/generate-prompt` - Generate consistency prompts

### Enhanced Enhancement
- `POST /api/enhance` - Now supports multimodal inputs

## Testing Your Setup

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables** in `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

3. **Run development server**:
```bash
npm run dev
```

4. **Test the APIs** once you have authentication set up

## Troubleshooting

### Common Issues

1. **"relation does not exist"** - Tables not created
   - Re-run migration script or apply schema manually

2. **"permission denied"** - RLS policies not applied
   - Run RLS policies SQL or check authentication

3. **"bucket not found"** - Storage buckets missing
   - Create buckets in Supabase Dashboard or via API

4. **File upload fails** - Storage permissions
   - Check bucket policies and RLS settings

### Need to Start Over?

If you need to remove the new tables:

```sql
-- Drop new tables (in Supabase SQL Editor)
DROP TABLE IF EXISTS session_assets CASCADE;
DROP TABLE IF EXISTS consistency_object_assets CASCADE;
DROP TABLE IF EXISTS consistency_objects CASCADE;
DROP TABLE IF EXISTS product_assets CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS media_assets CASCADE;
```

## Support

- Check Supabase Dashboard for table structure
- Review API logs in development console  
- Verify environment variables are set correctly
- Test with small files first before larger uploads

---

**Status**: Ready for production use
**Estimated Migration Time**: 2-5 minutes
**Database Size Impact**: ~6 new tables + indexes