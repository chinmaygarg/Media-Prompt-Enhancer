# Media Prompt Enhancer - API Documentation

## Overview

The Media Prompt Enhancer API provides comprehensive prompt enhancement capabilities for AI content generation across 6 output types. This REST API handles multi-modal inputs, intelligent model selection, and cost optimization.

**Base URL**: `http://localhost:3000/api` (development)  
**Content-Type**: `application/json` (unless specified otherwise)  
**Response Format**: JSON with consistent error handling

## Authentication

Currently, the API is open and uses session-based file management. No authentication is required for development and testing purposes.

**Future**: Authentication will be added for production deployments.

## Core Enhancement API

### POST `/api/enhance`

Transform basic prompts into optimized AI-generation prompts with intelligent model selection and cost estimation.

#### Request Body

```json
{
  "base_prompt": "string",           // Required: Basic user prompt
  "config": {                        // Required: Enhancement configuration
    "outputType": "text-to-image" | "image-text-to-image" | "text-to-video" | 
                  "image-text-to-video" | "text-to-video-audio" | "image-text-to-video-audio",
    "platform": "instagram" | "tiktok" | "youtube" | "linkedin" | "custom",
    "style": "photographic" | "cinematic" | "artistic" | "commercial" | "documentary",
    "duration": number,              // Video duration in seconds (for video types)
    "aspectRatio": "16:9" | "9:16" | "1:1" | "4:3",
    "qualityTier": "draft" | "social" | "production"
  },
  "media_assets": [                  // Optional: Reference media files
    {
      "id": "string",
      "file_type": "image" | "video" | "audio",
      "file_url": "string",          // Optional: URL to file
      "description": "string"        // Optional: AI analysis description
    }
  ],
  "text_elements": [                 // Optional: Text overlays/in-video text
    {
      "id": "string",
      "text": "string",
      "type": "overlay" | "in-video",
      "placement": "top" | "center" | "bottom" | "custom",
      "timing": {
        "startTime": number,         // Milliseconds
        "endTime": number
      },
      "style": {
        "fontFamily": "string",
        "fontSize": number,
        "fontWeight": "normal" | "bold",
        "color": "string",           // Hex color
        "backgroundColor": "string"   // RGBA color
      }
    }
  ],
  "session_id": "string"             // Optional: Session tracking
}
```

#### Response Body

```json
{
  "success": true,
  "data": {
    "primary_prompt": "string",      // Enhanced main prompt
    "negative_prompt": "string",     // Quality control negative prompt
    "model_selected": "string",      // Selected AI model name
    "estimated_cost": number,        // Cost in USD
    "shots": [                       // For video: multi-clip breakdown
      {
        "prompt": "string",
        "duration": number,
        "transition": "cut" | "fade" | "dissolve",
        "camera_movement": "static" | "pan" | "zoom",
        "composition": "close-up" | "medium" | "wide"
      }
    ],
    "text_instructions": [           // Text handling instructions
      {
        "original": "string",
        "optimized": "string",
        "placement": "string",
        "model_compatibility": "high" | "medium" | "low"
      }
    ],
    "text_warnings": ["string"],     // Text-related warnings
    "media_insights": ["string"]     // Media analysis insights
  },
  "metadata": {
    "session_id": "string",
    "processing_time": number,       // Milliseconds
    "model_type": "image" | "video" | "video-audio",
    "platform_optimized": "string",
    "quality_tier": "string",
    "consistency_applied": boolean
  }
}
```

#### Example Request

```bash
curl -X POST http://localhost:3000/api/enhance \
  -H "Content-Type: application/json" \
  -d '{
    "base_prompt": "Create a cinematic product showcase featuring a luxury smartwatch",
    "config": {
      "outputType": "text-to-video",
      "platform": "instagram",
      "style": "cinematic",
      "duration": 15,
      "aspectRatio": "9:16",
      "qualityTier": "social"
    },
    "media_assets": [
      {
        "id": "asset_001",
        "file_type": "image",
        "description": "Premium titanium smartwatch with blue sport band on marble surface"
      }
    ],
    "text_elements": [
      {
        "id": "text_001",
        "text": "INTRODUCING\nNEW TITAN PRO",
        "type": "overlay",
        "timing": {"startTime": 2000, "endTime": 8000}
      }
    ],
    "session_id": "test_session_001"
  }'
```

#### Example Response

```json
{
  "success": true,
  "data": {
    "primary_prompt": "Cinematic luxury smartwatch product showcase, premium titanium watch with blue sport band on polished marble surface, professional product photography lighting, shallow depth of field, dramatic shadows, high-end commercial quality, 9:16 vertical composition for social media",
    "negative_prompt": "low quality, blurry, pixelated, distorted, amateur, poor lighting, cluttered background, overexposed, underexposed",
    "model_selected": "Wan 2.2 Text-to-Video",
    "estimated_cost": 0.30,
    "shots": [
      {
        "prompt": "Wide establishing shot of luxury environment with marble surfaces and dramatic lighting, smartwatch prominently displayed",
        "duration": 5,
        "transition": "fade",
        "camera_movement": "slow_zoom",
        "composition": "wide"
      },
      {
        "prompt": "Medium shot focusing on smartwatch details, blue sport band texture, titanium finish reflections",
        "duration": 7,
        "transition": "cut",
        "camera_movement": "static",
        "composition": "medium"
      },
      {
        "prompt": "Close-up hero shot of watch face with UI elements, premium materials showcase",
        "duration": 3,
        "transition": "dissolve",
        "camera_movement": "subtle_pan",
        "composition": "close-up"
      }
    ],
    "text_instructions": [],
    "text_warnings": ["Overlay text 'INTRODUCING NEW TITAN PRO' converted to in-video text for better model compatibility"],
    "media_insights": ["Applied luxury product styling", "Enhanced marble surface textures", "Optimized for vertical 9:16 format"]
  },
  "metadata": {
    "session_id": "test_session_001",
    "processing_time": 145,
    "model_type": "video",
    "platform_optimized": "instagram",
    "quality_tier": "social",
    "consistency_applied": true
  }
}
```

## AI Analysis API

### GET `/api/ai-analysis`

Get system status, budget information, and analytics for the AI analysis service.

#### Query Parameters

- `type`: `status` | `analytics` | `pricing` (default: `status`)
- `requestId`: Specific analysis request ID (for individual status)

#### GET `/api/ai-analysis?type=status`

```json
{
  "success": true,
  "data": {
    "queue": {
      "pending": 0,
      "processing": 1,
      "completed": 15,
      "failed": 0,
      "estimatedWaitTime": 0
    },
    "budget": {
      "tracker": {
        "dailySpent": 1.24,
        "monthlySpent": 23.67,
        "totalSpent": 156.43
      },
      "budget": {
        "dailyLimit": 5.00,
        "monthlyLimit": 50.00,
        "perAnalysisLimit": 0.50,
        "autoApproveUnder": 0.01,
        "requireConfirmationOver": 0.25,
        "emergencyStop": false
      }
    },
    "service": {
      "status": "operational",
      "lastUpdate": "2025-01-15T10:30:00Z"
    }
  }
}
```

#### GET `/api/ai-analysis?type=analytics`

```json
{
  "success": true,
  "data": {
    "usage": {
      "totalRequests": 156,
      "successfulAnalyses": 142,
      "failedAnalyses": 14,
      "averageCostPerAnalysis": 0.038,
      "averageProcessingTime": 1.2
    },
    "trends": {
      "dailyRequests": [5, 8, 12, 15, 9, 6, 11],
      "costTrend": [0.15, 0.23, 0.45, 0.67, 0.34, 0.28, 0.52],
      "popularAnalysisTypes": ["character", "scene", "product"]
    }
  }
}
```

### POST `/api/ai-analysis?action=analyze`

Request AI analysis of a media asset with budget controls.

#### Request Body

```json
{
  "mediaAssetId": "string",          // Required: Media asset ID
  "analysisLevel": "basic" | "detailed" | "comprehensive",
  "sessionId": "string",             // Required: Session tracking
  "userId": "string",                // Optional: User identification
  "priority": "low" | "medium" | "high",  // Optional: Queue priority
  "userConfirmed": boolean           // Required if cost > confirmation threshold
}
```

#### Response Body

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "cost": number,
    "status": "queued" | "processing" | "completed" | "failed"
  }
}
```

### PUT `/api/ai-analysis`

Update budget settings and limits.

#### Request Body

```json
{
  "dailyLimit": number,              // Optional: Daily spending limit
  "monthlyLimit": number,            // Optional: Monthly spending limit  
  "perAnalysisLimit": number,        // Optional: Per-analysis spending limit
  "autoApproveUnder": number,        // Optional: Auto-approve threshold
  "requireConfirmationOver": number, // Optional: Confirmation threshold
  "emergencyStop": boolean           // Optional: Emergency stop flag
}
```

## File Upload API

### POST `/api/upload`

Upload media files for use in prompt enhancement. Supports images, videos, and audio files.

#### Request

**Content-Type**: `multipart/form-data`

**Form Fields**:
- `files`: One or more media files
- `sessionId`: Session identifier
- `descriptions`: JSON string of file descriptions (optional)

#### Example Request

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "files=@product.jpg" \
  -F "files=@demo.mp4" \
  -F "sessionId=session_123" \
  -F 'descriptions={"product.jpg":"Luxury watch on marble","demo.mp4":"Product demo video"}'
```

#### Response Body

```json
{
  "success": true,
  "data": {
    "uploaded_files": [
      {
        "id": "file_abc123",
        "filename": "product.jpg",
        "original_name": "product.jpg",
        "storage_path": "/tmp/uploads/session_123/product.jpg",
        "file_size_bytes": 2048000,
        "mime_type": "image/jpeg",
        "upload_timestamp": "2025-01-15T10:30:00Z"
      }
    ],
    "session_info": {
      "session_id": "session_123",
      "total_files": 2,
      "total_size_bytes": 5242880
    }
  }
}
```

**Note**: Files are stored locally in `/tmp/uploads/` and are automatically cleaned up after 24 hours.

## Media Serving API

### GET `/api/media/[id]`

Serve uploaded media files with access control.

#### Parameters

- `id`: Media asset ID

#### Query Parameters

- `size`: `thumbnail` | `medium` | `full` (default: `full`)
- `format`: `original` | `webp` | `jpg` (for images)

#### Example Request

```bash
curl http://localhost:3000/api/media/file_abc123?size=medium&format=webp
```

#### Response

Returns the media file with appropriate content-type headers and caching directives.

## Error Handling

All API endpoints follow consistent error response format:

```json
{
  "success": false,
  "error": "string",                 // Human-readable error message
  "code": "string",                  // Machine-readable error code
  "details": {                       // Optional: Additional error context
    "field": "string",
    "expected": "string",
    "received": "string"
  }
}
```

### Common Error Codes

- `INVALID_REQUEST`: Malformed request body or missing required fields
- `UNSUPPORTED_OUTPUT_TYPE`: Invalid output type specified
- `FILE_TOO_LARGE`: Upload file exceeds size limits  
- `QUOTA_EXCEEDED`: User or session quota exceeded
- `BUDGET_EXCEEDED`: AI analysis budget limit reached
- `MODEL_UNAVAILABLE`: Selected AI model is temporarily unavailable
- `PROCESSING_FAILED`: Internal processing error

### HTTP Status Codes

- `200`: Success
- `202`: Accepted (for async operations requiring confirmation)
- `400`: Bad Request (client error)
- `401`: Unauthorized (future authentication)
- `403`: Forbidden (quota/budget limits)
- `404`: Not Found
- `413`: Payload Too Large
- `429`: Too Many Requests (rate limiting)
- `500`: Internal Server Error

## Rate Limiting

API endpoints are rate-limited to ensure fair usage:

- **Enhancement API**: 60 requests/minute per session
- **Upload API**: 20 uploads/minute per session  
- **Analysis API**: 30 requests/minute per session

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1642346400
```

## Model Support

### Available AI Models

#### Image Generation
- **Ideogram v3**: Typography, text rendering, commercial graphics
- **Imagen 4**: Photorealistic images, professional photography
- **Qwen Image**: Multi-language support, complex scenes

#### Video Generation  
- **Veo 3**: Premium quality, native audio support
- **Kling 2.1 Master**: Cinema-grade, highest quality
- **Seedance 1.0**: Fast generation, multi-shot storytelling
- **Runway Gen-4 Turbo**: Balanced speed/quality
- **Wan 2.2**: Cost-effective, good quality
- **Hailuo 02**: Image conditioning, smooth motion
- **PixVerse v4.5**: Creative effects, stylized content

### Model Selection Logic

The API automatically selects optimal models based on:

1. **Output Type**: Model compatibility with requested output
2. **Quality Tier**: Draft/Social/Production quality requirements  
3. **Budget Constraints**: Cost optimization within limits
4. **Platform Optimization**: Platform-specific model strengths
5. **Content Requirements**: Text, motion, audio needs

## SDK and Examples

### JavaScript/TypeScript SDK

```typescript
import { MediaPromptEnhancer } from 'media-prompt-enhancer-sdk'

const enhancer = new MediaPromptEnhancer({
  baseUrl: 'http://localhost:3000/api',
  apiKey: 'your-api-key' // Future authentication
})

// Enhance a prompt
const result = await enhancer.enhance({
  basePrompt: 'Create a product video',
  config: {
    outputType: 'text-to-video',
    platform: 'instagram',
    qualityTier: 'social'
  }
})

// Upload files
const upload = await enhancer.upload(['image.jpg'], 'session_123')

// Check AI analysis status  
const status = await enhancer.getAnalysisStatus()
```

### Python SDK

```python
from media_prompt_enhancer import MediaPromptEnhancer

enhancer = MediaPromptEnhancer(
    base_url='http://localhost:3000/api',
    api_key='your-api-key'  # Future authentication
)

# Enhance prompt
result = enhancer.enhance(
    base_prompt='Create a product video',
    config={
        'outputType': 'text-to-video',
        'platform': 'instagram', 
        'qualityTier': 'social'
    }
)

# Upload files
upload = enhancer.upload(['image.jpg'], session_id='session_123')
```

## Webhook Support (Future)

The API will support webhooks for long-running operations:

```json
{
  "webhook_url": "https://your-app.com/webhook",
  "events": ["analysis.completed", "enhancement.ready"],
  "secret": "webhook-secret-key"
}
```

## OpenAPI Specification

The complete OpenAPI 3.0 specification is available at:
- **Swagger UI**: `http://localhost:3000/api/docs` (future)
- **OpenAPI JSON**: `http://localhost:3000/api/openapi.json` (future)

## Support

- **Documentation**: [GitHub Wiki](https://github.com/chinmaygarg/Media-Prompt-Enhancer/wiki)
- **Issues**: [GitHub Issues](https://github.com/chinmaygarg/Media-Prompt-Enhancer/issues)  
- **API Questions**: Create an issue with the `api` label
- **Examples**: See `/examples` directory in repository

---

**Last Updated**: January 2025  
**API Version**: 1.0.0  
**Status**: Production Ready