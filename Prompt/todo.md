# Media Prompt Enhancer TODO

## 🎯 Project Overview
A comprehensive prompt enhancing service that transforms basic user inputs into optimized prompts for AI generation models across 6 output types, with optional visual content understanding and local media storage.

## ✅ COMPLETED IMPLEMENTATION

### ✅ Local Storage Architecture
- **Local File Service** (`/src/lib/storage/local.ts`) - Complete file handling without external dependencies
- **File Upload API** (`/src/app/api/upload/route.ts`) - Handles multipart form data, validation, local storage
- **URL Reference API** (`/src/app/api/media/url/route.ts`) - Validates external media URLs
- **Enhancement API** (`/src/app/api/enhance/route.ts`) - Complete prompt optimization with model selection

### ✅ UI Components & User Experience  
- **PromptEnhancer Component** - Main interface with configuration options
- **MediaInput Component** - Tabbed interface for file uploads and URL inputs
- **UI Component Library** - Card, Input, Textarea, Button components
- **Model Selection Logic** - Automatic optimal model selection (12 supported models)
- **Platform Optimization** - Instagram, TikTok, YouTube, LinkedIn specific enhancements

### ✅ Core Features Working
- Local file upload (images, videos, audio) to `public/uploads/`
- URL-based media references with validation
- 6 output types: text→image, image+text→image, text→video, etc.
- Quality tiers: draft, social, production
- Cost estimation for different models
- Video sequence planning for multi-clip content

## 🚀 NEW REQUIREMENTS & IMPLEMENTATION PRIORITIES

### Phase 1: Multi-Clip Video Generation with Consistency (HIGHEST PRIORITY)

#### Scene-Based Video Planning System
- **User Duration Control**: Users select total video length (5-120 seconds)
- **Automatic Clip Breakdown**: System calculates optimal scene divisions based on model limits
  ```typescript
  // Example: 30-second video → 4 clips of 7-8 seconds each
  function planVideoScenes(totalDuration: number, model: ModelConfig) {
    const maxClipLength = model.maxDuration // e.g., 8 seconds for Veo 3
    const optimalClips = Math.ceil(totalDuration / maxClipLength)
    return generateScenePlan(optimalClips, totalDuration)
  }
  ```
- **Scene-by-Scene Editor**: Each clip gets individual focus, camera movement, text elements
- **Transition Planning**: Smart transitions between clips (cut, fade, dissolve, wipe)

#### Visual Consistency Engine
- **Character Consistency**: Maintain same person appearance across all clips
  - Locked descriptors: "same person, blue eyes, brown hair, professional attire"
  - Reference frame system: Use first clip as visual template
- **Environment Consistency**: Same setting, lighting, color palette throughout
  - Style anchoring: "same office setting, warm natural lighting from left"
  - Color palette preservation: ["#FF6B35", "#F7931E", "#FFD23F"]
- **Camera Style Consistency**: Unified cinematographic approach
  - Consistent camera angles, movement styles, framing
  - Professional continuity between scenes

#### Focus Control Per Scene
- **Primary Focus Options**: character, product, environment, action, text
- **Secondary Elements**: Supporting visual elements to maintain
- **Camera Movement**: static, pan, zoom, dolly per clip
- **Composition Control**: close-up, medium shot, wide shot preferences

### Phase 2: Advanced Text Handling System (HIGH PRIORITY)

#### Dual Text Implementation
- **Text Overlays** (Post-generation graphics):
  ```typescript
  interface TextOverlay {
    text: string
    position: 'top' | 'center' | 'bottom' | 'custom'
    timing: { start: number, end: number }  // seconds in video
    style: {
      font: string
      size: number
      color: string
      backgroundColor?: string
      animation?: 'fadeIn' | 'slideUp' | 'typewriter'
    }
  }
  ```
- **In-Video Text** (AI-generated within scenes):
  ```typescript
  interface InVideoText {
    content: string
    placement: 'sign' | 'screen' | 'document' | 'product_label'
    readability: 'high' | 'medium' | 'stylistic'
    language: 'english' | 'spanish' | 'multilingual'
  }
  ```

#### Text Quality by Model Capability
- **Model Text Ratings**:
  ```typescript
  const TEXT_CAPABILITIES = {
    'veo-3': { textQuality: 'excellent', languages: ['english', 'spanish', 'french'] },
    'kling-2.1': { textQuality: 'good', languages: ['english'] },
    'seedance-1.0': { textQuality: 'poor', languages: [] } // Use overlays instead
  }
  ```
- **Smart Text Routing**: Route complex text to capable models
- **Overlay Recommendations**: Suggest overlays for models with poor text handling
- **Readability Enhancement**: High contrast, clear fonts, optimal positioning

#### Text Consistency Features
- **Typography Standards**: Consistent fonts, sizes, colors across clips
- **Brand Text Guidelines**: Corporate fonts, color schemes, messaging tone
- **Multi-language Support**: Unified styling across different languages
- **Clean Text Rendering**: Optimized prompts for sharp, readable text

### Phase 3: Enhanced Media Input with User Control (HIGH PRIORITY)

#### User Media Descriptions
- **Description Fields**: Add optional text input for each uploaded file/URL
- **Smart Placeholders**: Guide users with context-specific examples:
  - Images: "Describe the style, mood, colors, subjects, composition..."
  - Videos: "Describe the scene, action, camera movement, visual style..."  
  - Audio: "Describe the mood, genre, instruments, tempo..."
- **Character Limits**: 500 characters per media description
- **Enhanced MediaAsset Interface**:
  ```typescript
  interface MediaAsset {
    // ... existing fields
    user_description?: string
    ai_analysis_enabled?: boolean
    ai_analysis_result?: string
    analysis_cost?: number
  }
  ```

#### Optional Visual Content Understanding
- **User Toggle Control**: Let users choose per-file whether to enable AI analysis
- **Cost Transparency**: Display clear pricing: "AI analysis: $0.01 per image"
- **Budget Management**: Show running total and monthly usage
- **Fallback Strategy**: Use user descriptions when AI analysis disabled
- **Model Integration**: Support GPT-4V, Claude-3-Vision for visual understanding

### Phase 4: Hybrid Auto/Manual Parameter System (MEDIUM PRIORITY)

#### Auto vs Manual Mode Toggle
- **Auto Mode (Default)**: System automatically selects all parameters
  - User sees: Basic prompt + Platform + Quality tier
  - System decides: Model, resolution, frame rate, duration limits
  - Display: "Using Veo 3 • 1080p • 30fps • ~$0.36 for 3 clips"
- **Manual Mode (Advanced)**: Full user control over technical parameters
  - Model selection with capability info
  - Resolution options (filtered by model limits)  
  - Frame rate selection (24fps cinematic, 30fps standard, 60fps smooth)
  - Duration and clip count control
  - Motion style preferences

#### Enhanced Model Capabilities Database
```typescript
interface ModelCapabilities {
  // ... existing fields
  
  // Text handling capabilities
  textQuality: 'poor' | 'good' | 'excellent'
  supportedLanguages: string[]
  maxTextLength: number
  textPlacement: ('sign' | 'screen' | 'document' | 'product_label')[]
  
  // Consistency capabilities  
  characterConsistency: 'poor' | 'good' | 'excellent'
  styleConsistency: 'poor' | 'good' | 'excellent'
  colorConsistency: 'poor' | 'good' | 'excellent'
  environmentConsistency: 'poor' | 'good' | 'excellent'
  
  // Multi-clip support
  supportsReferenceFrames: boolean
  maxConsistentClips: number
  optimalClipsPerModel: number
  
  // Technical specifications
  maxResolution: '480p' | '720p' | '1080p' | '1440p' | '2160p'
  supportedAspectRatios: ('1:1' | '9:16' | '16:9' | '4:5')[]
  frameRates: ('24' | '30' | '60')[]
  maxDuration: number
  minDuration: number
}

// Updated model configurations with advanced capabilities:
const ENHANCED_MODEL_CONFIGS = {
  'veo-3': {
    name: 'Veo 3',
    type: 'video-audio',
    costPerSecond: 0.12,
    maxDuration: 8,
    qualityTier: 'production',
    
    // Text capabilities
    textQuality: 'excellent',
    supportedLanguages: ['english', 'spanish', 'french'],
    maxTextLength: 200,
    textPlacement: ['sign', 'screen', 'document', 'product_label'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'excellent', 
    colorConsistency: 'excellent',
    environmentConsistency: 'excellent',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 6,
    optimalClipsPerModel: 4,
    
    // Technical specs
    maxResolution: '2160p',
    supportedAspectRatios: ['1:1', '9:16', '16:9', '4:5'],
    frameRates: ['24', '30', '60']
  },
  
  'kling-2.1': {
    name: 'Kling 2.1 Master',
    type: 'video',
    costPerSecond: 0.25,
    maxDuration: 10,
    qualityTier: 'production',
    
    // Text capabilities  
    textQuality: 'good',
    supportedLanguages: ['english'],
    maxTextLength: 100,
    textPlacement: ['sign', 'screen'],
    
    // Consistency capabilities
    characterConsistency: 'excellent',
    styleConsistency: 'good',
    colorConsistency: 'excellent', 
    environmentConsistency: 'good',
    
    // Multi-clip support
    supportsReferenceFrames: true,
    maxConsistentClips: 4,
    optimalClipsPerModel: 3,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9'],
    frameRates: ['24', '30']
  },
  
  'seedance-1.0': {
    name: 'Seedance 1.0',
    type: 'video',
    costPerSecond: 0.05,
    maxDuration: 10,
    qualityTier: 'social',
    
    // Text capabilities
    textQuality: 'poor', // Recommend overlays instead
    supportedLanguages: [],
    maxTextLength: 0,
    textPlacement: [],
    
    // Consistency capabilities
    characterConsistency: 'good',
    styleConsistency: 'good',
    colorConsistency: 'good',
    environmentConsistency: 'fair',
    
    // Multi-clip support  
    supportsReferenceFrames: false,
    maxConsistentClips: 2,
    optimalClipsPerModel: 2,
    
    // Technical specs
    maxResolution: '1080p',
    supportedAspectRatios: ['9:16', '16:9'],
    frameRates: ['30']
  }
}
```

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Multi-Clip Video Generation Logic
```typescript
interface VideoScene {
  clipNumber: number
  duration: number  
  primaryFocus: 'character' | 'product' | 'environment' | 'action' | 'text'
  secondaryElements: string[]
  cameraMovement: 'static' | 'pan' | 'zoom' | 'dolly'
  textElements?: InVideoText[]
  transitionTo?: 'cut' | 'fade' | 'dissolve' | 'wipe'
  consistencyAnchors: {
    character?: string  // "same person, blue eyes, brown hair"
    environment?: string // "same office setting, warm lighting"
    style?: string      // "professional, clean, corporate"
  }
}

// Example: 24-second marketing video breakdown
const exampleVideoScript: VideoScene[] = [
  {
    clipNumber: 1,
    duration: 8,
    primaryFocus: 'character',
    secondaryElements: ['office environment', 'laptop screen'],
    cameraMovement: 'static',
    textElements: [{ content: 'PRODUCTIVITY', placement: 'screen', readability: 'high' }],
    transitionTo: 'fade',
    consistencyAnchors: {
      character: "professional woman, blue eyes, brown hair, business suit",
      environment: "modern office, natural lighting from window",
      style: "clean, corporate, professional"
    }
  },
  {
    clipNumber: 2,
    duration: 8, 
    primaryFocus: 'product',
    secondaryElements: ['same character', 'consistent lighting'],
    cameraMovement: 'zoom',
    textElements: [{ content: 'EFFICIENCY', placement: 'product_label', readability: 'high' }],
    transitionTo: 'cut',
    consistencyAnchors: {
      character: "same professional woman from clip 1",
      environment: "same office setting, same lighting",
      style: "same professional aesthetic"
    }
  },
  {
    clipNumber: 3,
    duration: 8,
    primaryFocus: 'action',
    secondaryElements: ['character interaction', 'product usage'],
    cameraMovement: 'pan',
    textElements: [{ content: 'SUCCESS', placement: 'sign', readability: 'high' }],
    transitionTo: 'none',
    consistencyAnchors: {
      character: "same professional woman, now smiling",
      environment: "same office, slightly different angle",
      style: "same corporate branding"
    }
  }
]
```

### Consistency Prompt Generation Strategy
```typescript
function generateConsistentPrompts(scenes: VideoScene[], basePrompt: string) {
  const prompts = scenes.map((scene, index) => {
    let prompt = basePrompt
    
    // First clip: Full detailed prompt
    if (index === 0) {
      prompt += `, ${scene.consistencyAnchors.character}`
      prompt += `, ${scene.consistencyAnchors.environment}`  
      prompt += `, ${scene.consistencyAnchors.style}`
      prompt += `, focus on ${scene.primaryFocus}`
      prompt += `, ${scene.cameraMovement} camera movement`
      
      // Add text elements if present
      scene.textElements?.forEach(text => {
        prompt += `, ${text.content} visible on ${text.placement}`
      })
      
    } else {
      // Subsequent clips: Reference previous + changes
      prompt += `, maintain consistency with previous clip`
      prompt += `, ${scene.consistencyAnchors.character}`
      prompt += `, ${scene.consistencyAnchors.environment}`
      prompt += `, now focus on ${scene.primaryFocus}`
      prompt += `, ${scene.cameraMovement} camera movement`
      
      // Transition context
      prompt += `, smooth ${scene.transitionTo} transition from previous scene`
      
      // Scene-specific text
      scene.textElements?.forEach(text => {
        prompt += `, ${text.content} clearly readable on ${text.placement}`
      })
    }
    
    return {
      clipNumber: scene.clipNumber,
      prompt,
      duration: scene.duration,
      transition: scene.transitionTo
    }
  })
  
  return prompts
}
```

### Text Optimization by Model
```typescript
function optimizeTextForModel(text: InVideoText, model: ModelCapabilities): string {
  let optimization = ""
  
  if (model.textQuality === 'excellent') {
    // Can handle complex text scenarios
    optimization = `"${text.content}" text clearly visible on ${text.placement}, `
    optimization += `${text.readability} readability, sharp typography, `
    optimization += `high contrast, professional text rendering`
    
  } else if (model.textQuality === 'good') {
    // Needs simpler, clearer text
    optimization = `"${text.content}" in bold clear font on ${text.placement}, `
    optimization += `high contrast, simple typography, easy to read`
    
  } else {
    // Poor text quality - recommend overlays
    return `avoid text in scene, use post-generation overlay instead`
  }
  
  return optimization
}
```

## 📋 UPDATED IMPLEMENTATION TIMELINE

### Phase 1: Multi-Clip Foundation (Weeks 1-3) - HIGHEST PRIORITY
- [ ] **Week 1**: Scene Planning Algorithm
  - Create video scene breakdown logic
  - Implement optimal clip calculation based on model limits
  - Build scene planning data structures and interfaces
  
- [ ] **Week 2**: Visual Consistency Engine  
  - Implement consistency anchor system
  - Create reference frame logic for visual continuity
  - Build consistency prompt generation
  
- [ ] **Week 3**: Scene-by-Scene UI
  - Create video planning interface components
  - Build scene editor with focus/camera/text controls
  - Add transition selection and preview

### Phase 2: Advanced Text Systems (Weeks 4-6) - HIGH PRIORITY
- [ ] **Week 4**: Text Capability System
  - Implement model text quality ratings
  - Create text optimization logic per model
  - Build text routing and recommendation system
  
- [ ] **Week 5**: Dual Text Implementation
  - Create in-video text planning interface
  - Implement text overlay system
  - Add multi-language text support
  
- [ ] **Week 6**: Text Consistency Features
  - Build typography standards system
  - Create brand text guidelines integration  
  - Add readability enhancement logic

### Phase 3: Enhanced Media Input (Weeks 7-8) - HIGH PRIORITY  
- [ ] **Week 7**: User Description System
  - Add description fields to MediaInput component
  - Create smart placeholders and guidance
  - Implement description storage and retrieval
  
- [ ] **Week 8**: Optional AI Analysis
  - Add AI analysis toggle with cost display
  - Implement budget management features
  - Create fallback logic for descriptions vs AI

### Phase 4: Auto/Manual Systems (Weeks 9-10) - MEDIUM PRIORITY
- [ ] **Week 9**: Hybrid Interface
  - Create auto/manual mode toggle
  - Build advanced parameter controls
  - Implement smart parameter suggestions
  
- [ ] **Week 10**: Integration & Polish
  - Integrate all systems with existing enhancement API
  - Add comprehensive testing and validation
  - Performance optimization for multi-clip generation

## 🎯 ENHANCED SUCCESS METRICS

### Professional Video Quality
- **Visual Consistency**: >90% user satisfaction with character/environment continuity
- **Text Readability**: >95% text clarity across all supported models
- **Scene Flow**: Smooth transitions between clips with narrative coherence
- **Production Value**: Professional-grade multi-clip videos competitive with manual editing

### User Experience Excellence  
- **Ease of Use**: Beginners can create professional videos in <5 minutes
- **Advanced Control**: Power users have full creative control when desired
- **Cost Transparency**: Users understand and can control generation costs
- **Learning Curve**: Progressive disclosure from simple to advanced features

### Technical Performance
- **Generation Speed**: <30 seconds for multi-clip video planning and enhancement
- **Consistency Accuracy**: >85% visual consistency maintained across clips
- **Text Quality**: Model-appropriate text handling with smart fallbacks
- **Scalability**: Support 5-120 second videos with optimal clip distribution

### Phase 5: Cost Management & User Experience (MEDIUM PRIORITY)

#### Analysis Cost Controls
- **Per-Request Approval**: Confirm before expensive analysis
- **Monthly Budget Limits**: User-configurable spending limits  
- **Batch Processing**: Discounted rates for multiple file analysis
- **Preview Mode**: Show analysis benefits before user commits
- **Cost Dashboard**: Track spending and provide alternatives

#### Enhanced UI Components
```typescript
// Updated MediaInput with descriptions and analysis options
<MediaInput 
  onMediaChange={setMediaAssets}
  enableDescriptions={true}
  enableAIAnalysis={true} 
  showCostEstimates={true}
  maxDescriptionLength={500}
/>
```

#### Smart Enhancement Integration
- **Hybrid Prompts**: Combine user descriptions + AI analysis when both available
- **Weight Balancing**: Prioritize user insight with AI detail augmentation
- **Context Preservation**: Maintain user intent while adding technical accuracy
- **Quality Scoring**: Rate enhancement quality based on input richness

### Phase 3: Advanced Visual Analysis (MEDIUM PRIORITY)

#### Vision Model Integration
- **Multi-Model Support**: GPT-4V for detailed analysis, Claude-3 for creative insight
- **Specialized Analysis**: 
  - Product images → commercial photography optimization
  - Character art → consistency and style matching
  - Scenes → cinematographic enhancement  
  - Brand assets → style guide compliance
- **Confidence Scoring**: Rate AI analysis reliability vs user description value

#### Consistency Engine Enhancement  
- **Visual Style Matching**: Analyze uploaded references for consistent aesthetics
- **Character Recognition**: Maintain character consistency across generations
- **Brand Coherence**: Ensure uploaded logos/assets match brand guidelines
- **Scene Continuity**: Link related images for narrative flow

## 🔧 TECHNICAL IMPLEMENTATION DETAILS

### Updated Data Flow
```
1. User uploads media + optional descriptions
2. User chooses: AI analysis ($) OR description only (free)  
3. System processes based on choice:
   - AI enabled: Vision model analysis + user description  
   - AI disabled: User description only
4. Enhanced prompt generation uses available data
5. Cost tracking and usage analytics
```

### File Storage Structure (Current)
```
public/uploads/
├── images/           # User uploaded images
├── videos/           # User uploaded videos  
├── audio/            # User uploaded audio
└── temp/            # Temporary upload processing
```

### API Endpoints Status
- ✅ **POST /api/upload** - Local file upload with metadata
- ✅ **POST /api/media/url** - URL validation and type detection
- ✅ **POST /api/enhance** - Prompt enhancement with model selection
- ⏳ **POST /api/analyze** - Visual content analysis (NEW)
- ⏳ **POST /api/media/describe** - Save/update user descriptions (NEW)

### Enhancement Quality Assurance
- **Multi-Criteria Scoring**: Clarity, specificity, feasibility, impact
- **Model Selection Logic**: Optimal model based on content + quality tier
- **Platform Optimization**: Tailored keywords and specs per platform
- **Negative Prompt Generation**: Smart exclusions based on context

## 📋 IMMEDIATE NEXT STEPS

### Week 1: Media Description System
- [ ] Add description fields to MediaInput component
- [ ] Update MediaAsset interface with user_description field
- [ ] Modify local file storage to save descriptions
- [ ] Create /api/media/describe endpoint
- [ ] Add description UI with helpful placeholders

### Week 2: Optional AI Analysis Toggle
- [ ] Add analysis enable/disable toggle per file
- [ ] Display cost estimates clearly in UI
- [ ] Create /api/analyze endpoint for vision analysis
- [ ] Implement cost calculation and tracking
- [ ] Add user consent flow for expensive operations

### Week 3: Enhanced Prompt Integration  
- [ ] Update enhancement logic to use descriptions + analysis
- [ ] Weight user descriptions vs AI analysis appropriately
- [ ] Improve prompt generation with multimodal context
- [ ] Add quality scoring based on input richness

### Week 4: Cost Management & Settings
- [ ] User preference settings for analysis defaults
- [ ] Monthly budget tracking and limits
- [ ] Usage dashboard with cost breakdown
- [ ] Alternative suggestions when budget reached

## 🎯 SUCCESS METRICS

### User Experience
- **Cost Control**: Users can manage AI analysis spending
- **Quality Options**: Free (descriptions) vs Premium (AI analysis) paths
- **Transparency**: Clear cost display and usage tracking
- **Flexibility**: Works well with or without AI analysis

### Technical Performance  
- **Response Time**: <2s for description-only enhancement
- **Analysis Speed**: <5s for AI visual analysis when enabled
- **Cost Efficiency**: Optimal model selection to minimize expense
- **Accuracy**: High-quality prompts from either input method

### Business Value
- **User Retention**: Optional premium features vs forced costs
- **Revenue Growth**: Premium analysis as value-add service
- **Market Differentiation**: Hybrid AI + human approach
- **Scalability**: Cost-effective growth with user choice

## 🔒 IMPLEMENTATION PRINCIPLES

### User-First Design
1. **Always Optional**: Never force expensive AI analysis
2. **Transparent Costs**: Clear pricing before any charges
3. **Graceful Fallback**: Excellent results with descriptions alone
4. **User Empowerment**: Manual descriptions often beat AI understanding

### Cost Management
1. **Budget Controls**: User-configurable spending limits
2. **Smart Defaults**: Analysis disabled by default, user opts in
3. **Batch Discounts**: Lower per-image costs for multiple files
4. **Usage Analytics**: Help users optimize their enhancement spending

### Quality Assurance
1. **Hybrid Enhancement**: Best of both human + AI insight
2. **Context Preservation**: User intent always takes priority
3. **Progressive Enhancement**: Start with descriptions, add AI analysis
4. **Feedback Learning**: Improve based on user satisfaction

---

## 📈 CURRENT STATUS SUMMARY

**✅ COMPLETED: Core Enhancement System**
- Local storage implementation
- Basic media upload and URL handling  
- 12-model prompt enhancement engine
- Platform-specific optimizations
- Quality tier management

**🚀 IN PROGRESS: User-Controlled Visual Analysis**
- Media description system
- Optional AI analysis with cost controls
- Enhanced prompt generation with multimodal inputs
- Cost management and user budgets

## 📈 CURRENT STATUS SUMMARY

**✅ COMPLETED: Core Enhancement System**
- Local storage implementation with file upload and URL validation
- 12-model prompt enhancement engine with cost estimation
- Platform-specific optimizations for Instagram, TikTok, YouTube, LinkedIn
- Basic video sequence planning and model selection logic

**🚀 NEXT: Advanced Multi-Clip Video System (HIGHEST PRIORITY)**
- Scene-based video planning with consistency anchors
- Professional text handling (overlays + in-video text)  
- Visual consistency engine for character/environment continuity
- Auto/manual parameter control with model capabilities database

**🎯 ULTIMATE GOAL: Professional Video Production Platform**
- **Cinematic Quality**: Multi-clip videos with Hollywood-level consistency
- **Text Excellence**: Clean, readable text whether AI-generated or overlaid
- **User Empowerment**: Simple auto-mode for beginners, full control for professionals
- **Cost Efficiency**: Smart model selection balancing quality, features, and budget
- **Scalability**: From 5-second social clips to 2-minute marketing videos

**💡 KEY DIFFERENTIATOR**: The only prompt enhancement system that understands video as a sequence of consistent, interconnected scenes rather than isolated clips.