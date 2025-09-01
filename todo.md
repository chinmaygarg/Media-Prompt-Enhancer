# Supabase Storage Integration TODO

## 🎯 Project Overview
Integrate Supabase Storage with the Prompt Enhancement Service to enable multimodal content generation (text + images/video) and maintain consistency across campaigns through product libraries and character cards.

## ✅ Completed Analysis

### Current Codebase Status
- **Next.js 14** application with TypeScript
- **Supabase** already configured (`@supabase/supabase-js` v2.39.0)
- **Database schema** with users, enhancement_sessions, prompt_templates tables
- **LLM service architecture** with rate limiting and model adapters
- **Auth system** with subscription tiers (free, creator, professional, enterprise)

### Key Findings
- 📁 `/src/lib/supabase.ts` - Client/server configurations ready
- 📊 `/database/schema.sql` - Base tables established
- 🔧 `/src/types/index.ts` - Type definitions need extension
- 🚦 Rate limiting system in place for usage quotas
- 🏗️ Model adapter framework exists (`/src/lib/llm/`)

## ✅ COMPLETED IMPLEMENTATION

### ✅ Database Schema Extensions
- **Extended `/database/schema.sql`** with 6 new tables:
  - `media_assets` - File metadata tracking
  - `products` - Product library management  
  - `product_assets` - Links products to media assets
  - `consistency_objects` - Character cards, scenes, styles
  - `consistency_object_assets` - Links objects to media assets
  - `session_assets` - Links uploads to enhancement sessions
- **Added indexes** for optimal query performance
- **Added triggers** for automatic `updated_at` timestamps

### ✅ TypeScript Type System
- **Extended `/src/types/index.ts`** with comprehensive storage types:
  - `MediaAsset`, `Product`, `ConsistencyObject` interfaces
  - `EnhancementRequestV2` with multimodal support
  - `FileUploadRequest/Response` for upload handling
  - `SubscriptionQuotas` with tier-based limits
  - Complete type safety for all storage operations

### ✅ Storage Service Layer (`/src/lib/storage/`)
- **`client.ts`** - Supabase Storage wrapper with access control
- **`types.ts`** - Storage-specific type definitions and constants
- **`upload.ts`** - File upload service with validation and quota management
- **`products.ts`** - Complete product library management
- **`consistency.ts`** - Character cards and consistency object management
- **`index.ts`** - Clean exports and service aggregation

## 🚀 NEXT IMPLEMENTATION STEPS

### Phase 1: API Endpoints (Ready to implement)
- ⏳ **File Upload API** (`/src/app/api/upload/route.ts`)
  - Handle multipart form data uploads
  - File type/size validation using storage services
  - Subscription tier quota enforcement
  - Temporary upload session management
  
- ⏳ **Media Management APIs**
  - `GET /api/media/[id]` - Serve files with access control
  - `DELETE /api/media/[id]` - Remove assets using storage services
  - `POST /api/media/link` - Link assets to enhancement sessions

- ⏳ **Product Library APIs**
  - `POST /api/products` - Create products using product service
  - `GET /api/products` - List user's products with filtering
  - `PUT /api/products/[id]` - Update product details
  - `DELETE /api/products/[id]` - Soft delete products
  - `POST /api/products/[id]/assets` - Add media assets to products

- ⏳ **Consistency Object APIs**
  - `POST /api/consistency-objects` - Create character cards/scenes
  - `GET /api/consistency-objects` - List with type filtering
  - `PUT /api/consistency-objects/[id]` - Update objects
  - `POST /api/consistency-objects/[id]/assets` - Add reference images

### Phase 2: Frontend Components
- ⏳ **Enhanced Input Form** with multimodal support
- ⏳ **File Upload Components** with drag & drop
- ⏳ **Product Management UI** 
- ⏳ **Character Card Creator**

### Phase 3: Integration Updates
- ⏳ **Update existing enhancement APIs** to handle `EnhancementRequestV2`
- ⏳ **Extend model adapters** for multimodal inputs
- ⏳ **Add consistency prompt generation** to enhancement flow

## 📋 REFERENCE: Database Schema (COMPLETED)

#### ✅ Implemented Tables:
```sql
-- ✅ COMPLETED: Media Assets Table
CREATE TABLE media_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio'
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket VARCHAR(100) NOT NULL,
    upload_session_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE -- For temporary uploads
);

-- ✅ COMPLETED: Products Table
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'physical_product', 'software', 'service', 'brand'
    description TEXT,
    key_features JSONB DEFAULT '[]'::jsonb,
    target_audience TEXT,
    price_point VARCHAR(50), -- 'budget', 'mid-range', 'premium', 'luxury'
    brand_colors JSONB DEFAULT '[]'::jsonb, -- Array of hex codes
    brand_voice TEXT,
    prohibited_contexts JSONB DEFAULT '[]'::jsonb,
    required_disclaimers JSONB DEFAULT '[]'::jsonb,
    preferred_models JSONB DEFAULT '[]'::jsonb,
    quality_tier VARCHAR(50) DEFAULT 'social', -- 'production', 'social', 'draft'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ COMPLETED: Product Assets Linking Table
CREATE TABLE product_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL, -- 'reference_image', 'logo', 'brand_asset'
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ COMPLETED: Consistency Objects (Character Cards)
CREATE TABLE consistency_objects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    object_type VARCHAR(50) NOT NULL, -- 'character', 'scene', 'style'
    description TEXT NOT NULL,
    locked_attributes JSONB DEFAULT '[]'::jsonb, -- ["blue eyes", "red hair"]
    style_notes TEXT,
    reference_prompt TEXT, -- Base prompt for this object
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ COMPLETED: Consistency Object Assets
CREATE TABLE consistency_object_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    consistency_object_id UUID REFERENCES consistency_objects(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ✅ COMPLETED: Session Assets (Link uploads to enhancement sessions)
CREATE TABLE session_assets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES enhancement_sessions(id) ON DELETE CASCADE,
    media_asset_id UUID REFERENCES media_assets(id) ON DELETE CASCADE,
    asset_role VARCHAR(50) NOT NULL, -- 'reference_image', 'reference_video', 'audio_style'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes & Constraints:
```sql
-- ✅ COMPLETED: Performance Indexes
CREATE INDEX idx_media_assets_user_id ON media_assets(user_id);
CREATE INDEX idx_media_assets_file_type ON media_assets(file_type);
CREATE INDEX idx_media_assets_expires_at ON media_assets(expires_at);
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_consistency_objects_user_id ON consistency_objects(user_id);
CREATE INDEX idx_consistency_objects_type ON consistency_objects(object_type);
```

## 🚀 Implementation Phases

### ✅ Phase 1: Storage Infrastructure (COMPLETED)
- ✅ **Created complete storage service layer** (`/src/lib/storage/`)
  - `client.ts` - Supabase Storage client wrapper with access control
  - `upload.ts` - File upload utilities with validation and quota management
  - `products.ts` - Complete product library management service
  - `consistency.ts` - Character/scene asset management with prompt generation
  - `types.ts` - Storage-related TypeScript interfaces and constants
  - `index.ts` - Clean service exports

### Phase 2: API Endpoints
- ⏳ **File Upload API** (`/src/app/api/upload/route.ts`)
  - Handle multipart form data
  - File type/size validation
  - Subscription tier quotas
  - Temporary upload sessions
  
- ⏳ **Media Management APIs**
  - `GET /api/media/[id]` - Serve files with access control
  - `DELETE /api/media/[id]` - Remove assets
  - `POST /api/media/link` - Link assets to sessions

- ⏳ **Product Library APIs**
  - `POST /api/products` - Create product entries
  - `GET /api/products` - List user's products
  - `PUT /api/products/[id]` - Update product details
  - `DELETE /api/products/[id]` - Remove products

- ⏳ **Consistency Object APIs**
  - `POST /api/consistency-objects` - Create character cards
  - `GET /api/consistency-objects` - List user's objects
  - `PUT /api/consistency-objects/[id]` - Update objects

### Phase 3: Frontend Components
- ⏳ **Enhanced Input Form**
  - Content type selector (6 output types)
  - Conditional media upload zones
  - Product library selector
  - Consistency object manager
  
- ⏳ **File Upload Components**
  - Drag & drop zones
  - Progress indicators
  - File type validation UI
  - Subscription quota display

- ⏳ **Product Management UI**
  - Product creation wizard
  - Asset gallery management
  - Brand guideline inputs

### Phase 4: Integration Updates
- ⏳ **Extend Enhancement Request Types**
  ```typescript
  interface EnhancementRequest {
    original_prompt: string
    content_type: 'text_to_image' | 'image_text_to_image' | 'text_to_video' | 
                  'image_text_to_video' | 'text_to_video_audio' | 'image_text_to_video_audio'
    
    // NEW: Media inputs
    reference_images?: string[] // Media asset IDs
    reference_video?: string
    audio_style_reference?: string
    
    // NEW: Product/consistency references
    product_id?: string
    consistency_object_ids?: string[]
    
    platform: string
    context?: object
  }
  ```

- ⏳ **Update Model Adapters**
  - Handle multimodal inputs in model selection
  - Process reference images/videos
  - Apply consistency constraints

## 🗄️ Storage Organization

### Supabase Storage Buckets
```
user-uploads/ (Private bucket)
├── {user_id}/
│   ├── reference-images/
│   │   ├── {session_id}/{filename}
│   │   └── temp/{upload_id}/{filename}
│   ├── reference-videos/
│   ├── audio-styles/
│   ├── products/
│   │   └── {product_id}/{filename}
│   └── consistency-objects/
│       └── {object_id}/{filename}

system/ (Public bucket)
├── templates/
├── defaults/
└── examples/
```

## 🔒 Security & Access Control

### File Upload Validation
- ⏳ **MIME type restrictions**
  - Images: `image/jpeg`, `image/png`, `image/webp`
  - Videos: `video/mp4`, `video/webm`
  - Audio: `audio/mp3`, `audio/wav`

- ⏳ **File size limits by subscription tier**
  ```typescript
  const UPLOAD_LIMITS = {
    free: { max_files: 2, max_size_mb: 10, total_storage_mb: 100 },
    creator: { max_files: 5, max_size_mb: 50, total_storage_mb: 1000 },
    professional: { max_files: 10, max_size_mb: 100, total_storage_mb: 5000 },
    enterprise: { max_files: 50, max_size_mb: 500, total_storage_mb: 25000 }
  }
  ```

### RLS Policies
- ⏳ **Users can only access their own uploads**
- ⏳ **Service role access for system operations**
- ⏳ **Temporary upload session management**
- ⏳ **Automatic cleanup of expired files**

## 🧪 Testing Requirements

### Unit Tests
- ⏳ Storage service functions
- ⏳ File validation utilities
- ⏳ Product/consistency object CRUD
- ⏳ API endpoint responses

### Integration Tests
- ⏳ End-to-end file upload flow
- ⏳ Enhancement with multimodal inputs
- ⏳ Product library functionality
- ⏳ Subscription quota enforcement

### Performance Tests
- ⏳ Large file upload handling
- ⏳ Concurrent upload sessions
- ⏳ Storage cleanup efficiency

## 📈 Progress Tracking

### ✅ Week 1: Database & Storage Setup (COMPLETED)
- [x] ✅ Extended database schema with 6 new tables
- [x] ✅ Added comprehensive indexes and triggers  
- [x] ✅ Created complete storage service layer
- [x] ✅ Implemented file upload utilities with validation
- [x] ✅ Built product and consistency object services

### Week 2: API Development (READY TO START)
- [ ] File upload endpoint (`/src/app/api/upload/route.ts`)
- [ ] Media management APIs (`/src/app/api/media/`)
- [ ] Product library APIs (`/src/app/api/products/`)
- [ ] Consistency object APIs (`/src/app/api/consistency-objects/`)

### Week 3: Frontend Integration  
- [ ] Enhanced input forms with multimodal support
- [ ] File upload components with drag & drop
- [ ] Product management UI
- [ ] Character card creator and manager

### Week 4: Testing & Deployment
- [ ] Comprehensive testing of all services
- [ ] Performance optimization
- [ ] Security audit and RLS policies
- [ ] Production deployment

## 📝 Implementation Notes

### Key Considerations
1. **Subscription Quotas**: Enforce storage limits based on user tier
2. **File Cleanup**: Implement automatic deletion of expired temporary files
3. **Consistency Engine**: Link products/characters to enhancement sessions
4. **Model Optimization**: Select best models based on content type + media inputs
5. **Error Handling**: Graceful degradation when uploads fail

### Future Enhancements
- [ ] AI-powered image analysis for automatic tagging
- [ ] Style transfer between consistency objects
- [ ] Advanced product catalog search
- [ ] Team collaboration on product libraries
- [ ] Integration with external asset management systems

---

## 🎯 Immediate Next Steps (READY TO IMPLEMENT)

### 1. Set up Supabase Storage Buckets
```bash
# Run in Supabase SQL Editor or via API:
# - Create 'user-uploads' private bucket
# - Create 'system' public bucket  
# - Set up RLS policies for user access control
```

### 2. Implement File Upload API
```bash
# Create: /src/app/api/upload/route.ts
# - Use fileUploadService for validation and upload
# - Handle multipart form data
# - Enforce subscription quotas
```

### 3. Build Product & Consistency APIs  
```bash
# Create API routes using existing services:
# - /src/app/api/products/route.ts
# - /src/app/api/consistency-objects/route.ts
# All business logic already implemented in services
```

### 4. Update Enhancement API for Multimodal
```bash  
# Extend /src/app/api/enhance/route.ts
# - Accept EnhancementRequestV2 format
# - Process reference images/videos
# - Apply consistency constraints
```

## ✅ STATUS SUMMARY

**Phase 1: Database & Storage Foundation** ✅ **COMPLETED**
- ✅ 6 new database tables with relationships
- ✅ Complete TypeScript type system  
- ✅ Full storage service layer with validation
- ✅ Product library and consistency object management
- ✅ File upload service with quota management

**Next Phase: API Implementation** 🚀 **READY TO START** 
**Priority**: High  
**Estimated Time**: 1-2 weeks (foundation complete)