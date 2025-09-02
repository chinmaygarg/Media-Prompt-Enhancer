<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# Detailed Purpose of Core Processing Modules

## **1. Normalizer (Enhanced)**

### **Primary Purpose: Intelligent Prompt Expansion \& Context Enrichment**

The Normalizer is the first processing stage that transforms basic user input into rich, detailed prompts optimized for AI generation models.

### **Core Functions:**

#### **A. Basic Prompt Expansion**

```json
{
  "shorthand_expansion": {
    "input": "sunset cityscape",
    "expansion_process": {
      "time_context": "golden hour lighting, warm amber tones",
      "environmental_details": "urban skyline, skyscrapers silhouetted against sky",
      "atmospheric_elements": "soft clouds, gentle haze, romantic ambiance",
      "technical_quality": "high resolution, professional photography style"
    },
    "output": "Majestic urban skyline during golden hour sunset, warm amber lighting casting long shadows, skyscrapers silhouetted against colorful sky with soft clouds, atmospheric haze, cinematic composition, high resolution, professional cityscape photography"
  }
}
```


#### **B. Context-Aware Enhancement**

```json
{
  "contextual_intelligence": {
    "platform_optimization": {
      "instagram": "Add vertical aspect ratio, vibrant colors, social media optimized",
      "linkedin": "Professional tone, business context, corporate aesthetic",
      "tiktok": "Trendy, engaging, mobile-first composition"
    },
    "use_case_adaptation": {
      "commercial": "Add brand-safe elements, professional quality markers",
      "artistic": "Enhance creative style references, artistic techniques",
      "social_media": "Engaging, shareable, platform-specific formatting"
    }
  }
}
```


#### **C. Quality \& Technical Enhancement**

```json
{
  "technical_optimization": {
    "resolution_specs": "4K, ultra-detailed, sharp focus, high quality",
    "lighting_enhancement": "Professional lighting, optimal exposure, color balance",
    "composition_rules": "Rule of thirds, leading lines, balanced composition",
    "style_markers": "Photorealistic, cinematic, professional grade"
  }
}
```


#### **D. Model-Specific Optimization**

```json
{
  "model_preparation": {
    "ideogram_v3": {
      "text_rendering_prep": "Identify text elements, format for typography engine",
      "style_code_integration": "Prepare for style reference system"
    },
    "imagen_4": {
      "camera_terminology": "Add professional photography terms",
      "technical_settings": "Aperture, focal length, lighting specifications"
    },
    "qwen_image": {
      "bilingual_optimization": "Detect language, apply appropriate suffixes",
      "text_formula_prep": "Format mathematical or complex text elements"
    }
  }
}
```


### **Why "Enhanced" for Images:**

- **Text Rendering Intelligence**: Recognizes when user wants text in images, formats appropriately
- **Style Recognition**: Identifies artistic styles and applies relevant enhancement patterns
- **Platform Awareness**: Automatically adapts for social media, commercial, or artistic use
- **Quality Injection**: Adds professional-grade descriptors for higher output quality


### **Real-World Example:**

```
Input: "logo for coffee shop"
Normalizer Processing:
1. Recognizes: Logo design intent
2. Adds: Vector graphics specifications
3. Enhances: "Professional coffee shop logo design, minimalist style, warm brown and cream color palette, coffee bean icon, readable typography, scalable vector format, brand identity suitable for signage and packaging"
4. Routes to: Logo/Vector Adapter + Commercial Adapter
```


***

## **2. Style+Character Consistency Engine**

### **Primary Purpose: Visual Identity Management Across Generations**

Ensures consistent visual elements (characters, styles, brands) across multiple image generations within a project or campaign.

### **Core Functions:**

#### **A. Character Identity Management**

```json
{
  "character_database": {
    "character_profile": {
      "id": "char_001",
      "name": "Sarah_Marketing_Executive", 
      "physical_description": "Professional woman, mid-30s, shoulder-length auburn hair, confident posture, business attire",
      "reference_images": ["headshot_front.jpg", "full_body_profile.jpg", "casual_smile.jpg"],
      "consistency_markers": {
        "facial_features": "Green eyes, warm smile, defined jawline",
        "hair_style": "Auburn hair, shoulder-length, professional styling",
        "signature_clothing": "Navy blazer, white blouse, minimal jewelry",
        "personality_traits": "Confident, approachable, professional demeanor"
      }
    }
  }
}
```


#### **B. Style Consistency Management**

```json
{
  "style_library": {
    "brand_style_001": {
      "name": "Modern_Corporate_Campaign",
      "color_palette": ["#2C3E50", "#3498DB", "#FFFFFF", "#ECF0F1"],
      "visual_elements": {
        "lighting": "Soft natural lighting, minimal shadows",
        "composition": "Clean, minimalist, professional",
        "photography_style": "Corporate headshots, environmental portraits",
        "mood": "Confident, trustworthy, innovative"
      },
      "technical_specs": {
        "aspect_ratios": ["16:9", "1:1", "9:16"],
        "resolution": "High resolution, print-ready quality",
        "format_preferences": "Professional photography style"
      }
    }
  }
}
```


#### **C. Brand Consistency Framework**

```json
{
  "brand_enforcement": {
    "visual_identity": {
      "logo_placement": "Always visible in bottom-right corner",
      "color_restrictions": "Only use approved brand colors",
      "typography_rules": "Sans-serif fonts, high contrast text",
      "imagery_guidelines": "Professional, diverse, authentic people"
    },
    "consistency_checks": {
      "color_validation": "Verify all colors match brand palette",
      "composition_review": "Ensure logo visibility and placement",
      "style_adherence": "Check against brand style guidelines",
      "content_appropriateness": "Verify brand-safe imagery"
    }
  }
}
```


#### **D. Cross-Image Consistency Algorithms**

```json
{
  "consistency_techniques": {
    "character_reference_system": {
      "method": "Visual embedding anchoring",
      "implementation": "Store character visual signatures",
      "application": "Inject reference data into new prompts"
    },
    "style_code_system": {
      "method": "Style parameter inheritance", 
      "implementation": "Maintain style codes across generations",
      "application": "Apply consistent aesthetic rules"
    },
    "seed_coordination": {
      "method": "Strategic seed management",
      "implementation": "Related seeds for similar outputs",
      "application": "Maintain visual coherence in series"
    }
  }
}
```


### **Why "Style+Char" for Images:**

- **Static Consistency**: Unlike video's temporal consistency, focuses on visual identity across separate images
- **Character Development**: Build consistent character appearances for campaigns or stories
- **Brand Safety**: Ensures all generated images meet brand guidelines
- **Style Evolution**: Maintains aesthetic while allowing creative variation


### **Business Applications:**

- **Marketing Campaigns**: Same spokesperson across multiple ads
- **Content Series**: Consistent visual style for blog images
- **Brand Development**: Character mascots with consistent appearance
- **Social Media**: Cohesive visual identity across posts

***

## **3. Campaign Planner (Optional)**

### **Primary Purpose: Multi-Image Campaign Strategy \& Coordination**

Plans and coordinates multiple related images for campaigns, ensuring narrative flow and strategic variety.

### **Core Functions:**

#### **A. Campaign Architecture Planning**

```json
{
  "campaign_structure": {
    "campaign_type": "Product Launch Social Media Series",
    "total_images": 12,
    "image_categories": {
      "hero_shots": {
        "count": 3,
        "purpose": "Main product showcases",
        "platforms": ["Instagram feed", "Facebook ads", "Website banner"]
      },
      "lifestyle_images": {
        "count": 4, 
        "purpose": "Product in use scenarios",
        "platforms": ["Instagram stories", "Social media posts"]
      },
      "detail_shots": {
        "count": 3,
        "purpose": "Feature highlights",
        "platforms": ["Product pages", "Email marketing"]
      },
      "brand_moments": {
        "count": 2,
        "purpose": "Brand storytelling",
        "platforms": ["LinkedIn", "Corporate communications"]
      }
    }
  }
}
```


#### **B. Platform-Specific Optimization Planning**

```json
{
  "platform_strategy": {
    "instagram": {
      "feed_posts": "Square 1:1, high visual impact, brand colors",
      "stories": "Vertical 9:16, text overlays, interactive elements",
      "reels_covers": "Vertical with clear subject, minimal text"
    },
    "linkedin": {
      "post_images": "Professional 16:9, business context, clean design",
      "banner_images": "4:1 aspect ratio, corporate messaging"
    },
    "email_marketing": {
      "header_images": "Wide format, clear CTA space",
      "product_showcases": "High resolution, multiple angles"
    }
  }
}
```


#### **C. Narrative Flow Planning**

```json
{
  "storytelling_sequence": {
    "campaign_narrative": "Problem → Solution → Benefits → Call to Action",
    "image_sequence": [
      {
        "sequence": 1,
        "purpose": "Problem identification",
        "visual_concept": "Frustrated user with current solution",
        "mood": "Relatable challenge, empathetic tone"
      },
      {
        "sequence": 2,
        "purpose": "Solution introduction", 
        "visual_concept": "Product hero shot, clean and appealing",
        "mood": "Innovation, excitement, possibility"
      },
      {
        "sequence": 3,
        "purpose": "Benefits demonstration",
        "visual_concept": "Happy user with product, lifestyle integration",
        "mood": "Success, satisfaction, aspiration"
      }
    ]
  }
}
```


#### **D. Resource Optimization \& Efficiency**

```json
{
  "efficiency_planning": {
    "batch_generation": {
      "character_consistency": "Use same character across multiple scenarios",
      "style_inheritance": "Apply consistent style parameters",
      "cost_optimization": "Minimize unique elements, maximize reuse"
    },
    "variation_strategy": {
      "controlled_variation": "Change backgrounds while keeping subjects",
      "format_adaptation": "Create multiple aspect ratios from base compositions",
      "seasonal_adaptation": "Plan for holiday/seasonal variations"
    }
  }
}
```


### **Why "Optional" for Images:**

- **Not Always Needed**: Single image requests don't require campaign planning
- **Enterprise Focus**: Primarily valuable for agencies and large campaigns
- **Complexity Management**: Adds significant planning overhead
- **Premium Feature**: Justifies higher pricing tiers


### **When Campaign Planner Activates:**

- **Multiple Image Requests**: User requests 5+ related images
- **Campaign Keywords**: Mentions "series," "campaign," "collection"
- **Platform Variety**: Requests images for multiple social platforms
- **Enterprise Account**: Business accounts automatically get campaign planning


### **Business Value:**

- **Strategic Thinking**: Elevates service from "image generator" to "campaign strategist"
- **Cost Efficiency**: Optimizes generation to minimize redundant processing
- **Professional Results**: Ensures cohesive, professional campaign outcomes
- **Competitive Advantage**: Most prompt services don't offer strategic planning

***

## **Module Interaction Flow**

```
User Input: "Create images for coffee shop social media campaign"
                                ↓
                    NORMALIZER (Enhanced)
    • Recognizes: Campaign intent, social media optimization needed  
    • Expands: Coffee shop → artisanal coffee, cozy atmosphere, lifestyle
    • Enhances: Professional photography, warm lighting, brand-friendly
                                ↓
                 STYLE+CHAR CONSISTENCY ENGINE
    • Creates: Coffee shop brand identity profile
    • Establishes: Warm color palette, cozy aesthetic, consistent mood
    • Plans: Character consistency for barista/customer appearances
                                ↓
                    CAMPAIGN PLANNER
    • Strategizes: Instagram feed + stories + Facebook ads
    • Plans: Hero shots + lifestyle + detail shots + behind-scenes
    • Coordinates: 8-image series with narrative flow
                                ↓
                    ADAPTER ROUTING
    • Routes to: Text→Image + Commercial + Logo adapters
    • Optimizes: Platform-specific formatting and compliance
                                ↓
                        OUTPUT
    • Delivers: 8 optimized prompts + campaign strategy + brand guidelines
```


## **Resource Requirements**

### **Computational Complexity:**

- **Normalizer**: Low-medium (text processing, template matching)
- **Style+Char Engine**: Medium-high (image analysis, consistency algorithms)
- **Campaign Planner**: Low (strategic logic, planning algorithms)


### **Data Requirements:**

- **Normalizer**: Extensive prompt templates, model optimization patterns
- **Style+Char Engine**: Character databases, style libraries, brand profiles
- **Campaign Planner**: Platform specifications, campaign templates, strategy frameworks


### **Development Priority:**

1. **Normalizer**: Essential for MVP - all adapters depend on it
2. **Style+Char Engine**: Critical for differentiation and quality
3. **Campaign Planner**: Premium feature for enterprise market expansion

These three modules form the intelligent core that transforms your service from simple prompt enhancement to sophisticated content strategy and brand management platform.

