# Prompt Enhancement Service

## Project Overview
A comprehensive prompt enhancing service that transforms basic user inputs into optimized prompts for various AI generation models across 6 output types:

1. Text to Image Generation
2. Image(s) + Text to Image Generation  
3. Text to Video Generation
4. Image(s) + Text to Video Generation
5. Text to Video + Audio Generation
6. Image(s) + Text to Video + Audio Generation

## Architecture Decision
**Single unified service** with modular adapters rather than separate services for each output type.

### Key Benefits:
- Shared consistency engine for character/scene/product continuity
- Unified UX and API
- Cross-modal workflow support (Image → Video → Video+Audio)
- Cost-efficient shared infrastructure

## Service Architecture

```
┌─────────────────────────────────────────┐
│           Prompt Enhancer API           │
├─────────────────────────────────────────┤
│ 1. Input Normalizer                     │
│ 2. Consistency Engine                   │
│ 3. Video Planner (for multi-clip)       │
│ 4. Model Adapters (6 types)             │
│ 5. Output Formatter                     │
└─────────────────────────────────────────┘
```

## Core Components

### 1. Input Normalizer
- Processes basic prompts and expands shorthand
- Handles platform-specific requirements
- Validates input parameters

### 2. Consistency Engine
- Manages character/product/scene canon
- Maintains visual continuity across clips
- Handles reference image bindings

### 3. Video Planner
- Auto-builds storyboards for long content
- Splits into model-appropriate clip lengths
- Manages transitions and continuity

### 4. Model Adapters
- Text→Image: Qwen Image, Ideogram v3, Imagen 4
- Image+Text→Image: Minimax Image-01, FLUX.1 Kontext
- Text→Video: Seedance 1.0, Veo 3, Kling 2.1
- Image+Text→Video: Hailuo 02, Wan 2.2, PixVerse v4.5
- Text→Video+Audio: Veo 3 (native audio)
- Image+Text→Video+Audio: Veo 3 + audio post-processing

### 5. Output Formatter
- Returns enhanced prompts as text
- Provides JSON manifests for video stitching
- Includes metadata for consistency tracking

## Input System Specification

The service accepts comprehensive input objects with:

- **Project Configuration**: Goal, output type, platform, duration, aspect ratio
- **Base Prompt**: User's initial prompt text
- **References**: Images, audio styles, visual references
- **Consistency Objects**: Character cards, product specs, scene definitions
- **Style Preferences**: Visual style, color palette, camera movement, mood
- **Model Preferences**: Specific models, quality vs speed, budget tier
- **Constraints**: Safety filters, brand guidelines, technical limits

## Long Video Consistency Strategy

### Multi-Clip Challenges:
- Video models limited to 5-10 second clips
- Need character/scene/product consistency across clips
- Narrative flow maintenance

### Solutions:
1. **Storyboard Generator**: Auto-splits content into model-appropriate segments
2. **Consistency Matrix**: Tracks shared elements across shots
3. **Prompt Anchoring**: Locked phrases, negative prompts, visual elements
4. **Reference Binding**: Character cards with stable descriptors

## Model Selection Logic

### Text-to-Image Priority:
1. **Qwen Image** - Complex text rendering, bilingual support
2. **Ideogram v3** - Typography excellence, style references  
3. **Imagen 4** - Professional photography, commercial quality

### Text-to-Video Priority:
1. **Seedance 1.0** - Multi-shot storytelling, fastest generation
2. **Veo 3** - Native audio, professional grade
3. **Kling 2.1 Master** - Premium quality, cinema-level output

### Budget Considerations:
- **Premium**: Kling Master ($$$), Imagen 4 Ultra
- **Balanced**: Veo 3, Seedance 1.0, Ideogram v3
- **Budget**: Wan 2.2 5B, Seedance Mini, Ideogram Turbo

## Platform Optimization

### Social Media Specs:
- **Instagram**: 1080×1080 (feed), 1080×1920 (stories/reels)
- **TikTok**: 1080×1920 vertical, 15-60s duration
- **YouTube Shorts**: 1080×1920, 15-60s maximum
- **LinkedIn**: 1200×627 (posts), professional tone

### Output Quality Tiers:
- **Production**: 1080p+, premium models, full consistency
- **Social**: 720p-1080p, balanced speed/quality
- **Draft**: 480p-720p, fast generation, basic consistency

## API Design Considerations

### Request Flow:
1. Input validation and normalization
2. Consistency object creation/retrieval
3. Model selection based on requirements
4. Prompt enhancement per model specifications
5. Output formatting and metadata generation

### Response Format:
```json
{
  "enhanced_prompts": {
    "primary_prompt": "string",
    "negative_prompt": "string", 
    "model_specific_params": {},
    "shots": [] // for video sequences
  },
  "metadata": {
    "consistency_ids": {},
    "model_selected": "string",
    "estimated_cost": "number",
    "generation_time": "string"
  }
}
```

## Development Priorities

### Phase 1: Core Service
- Input normalization and validation
- Basic prompt enhancement for single images
- Model adapter framework

### Phase 2: Consistency Engine  
- Character/product/scene management
- Reference image processing
- Cross-generation consistency

### Phase 3: Video Planning
- Multi-clip storyboard generation
- Sequence optimization for model limits
- Transition planning

### Phase 4: Advanced Features
- Platform-specific optimization
- A/B testing for prompt variations
- Analytics and performance tracking

## Success Metrics

- **Quality**: User satisfaction with enhanced prompts
- **Consistency**: Character/scene maintenance across clips  
- **Speed**: Enhancement processing time < 2s
- **Cost**: Optimal model selection for budget constraints
- **Coverage**: Support for all 6 output types

## Technical Requirements

### Infrastructure:
- API service with REST endpoints
- Image processing and analysis
- Model adapter plugin system
- Consistency database for character/scene storage

### Performance:
- Sub-2 second prompt enhancement
- Concurrent processing for multi-clip videos
- Caching for frequently used consistency objects

### Scalability:
- Horizontal scaling for high demand
- Model adapter hot-swapping
- Rate limiting and quota management