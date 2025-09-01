# LLM-Powered Prompt Enhancement Service

A comprehensive prompt enhancement service that transforms basic user inputs into marketing-perfect prompts for AI content generation using OpenAI GPT-4 and Google Gemini.

## 🚀 Features

- **Intelligent Analysis**: AI-powered product/service understanding and categorization
- **Interactive Questions**: Dynamic Q&A system for personalized optimization (max 5 questions, all skippable)
- **Multi-Platform Optimization**: Tailored for Instagram, TikTok, LinkedIn, Facebook, YouTube
- **LLM Fallback**: Automatic failover between OpenAI and Gemini for reliability
- **Real-time Processing**: Fast prompt enhancement with processing time tracking
- **Rate Limiting**: Built-in protection with Redis-based rate limiting
- **Serverless Architecture**: Optimized for Vercel deployment with auto-scaling

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL)
- **LLM Services**: OpenAI GPT-4, Google Gemini
- **Cache & Rate Limiting**: Upstash Redis
- **Deployment**: Vercel
- **Authentication**: NextAuth.js + Supabase (ready to implement)

## 📋 Prerequisites

- Node.js 18+ 
- OpenAI API key
- Google AI Studio API key (Gemini)
- Supabase project
- Upstash Redis instance
- Vercel account (for deployment)

## 🔧 Setup Instructions

### 1. Clone and Install

```bash
git clone https://github.com/chinmaygarg/Media-Prompt-Enhancer.git
cd Media-Prompt-Enhancer
npm install
```

### 2. Environment Configuration

Create `.env.local` with your API keys:

```bash
# Core LLM Services
OPENAI_API_KEY=sk-your-openai-key-here
GOOGLE_API_KEY=AI-your-google-key-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Rate Limiting with Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# NextAuth Configuration (optional)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters

# Rate Limiting Configuration
# Development limits (10x higher than production)
RATE_LIMIT_ANALYZE_REQUESTS=200
RATE_LIMIT_QUESTIONS_REQUESTS=300
RATE_LIMIT_ENHANCE_REQUESTS=150
RATE_LIMIT_TEMPLATES_REQUESTS=100
RATE_LIMIT_WINDOW=3600

# Development Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1
```

### 3. Database Setup

1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Run the contents of `database/schema.sql`
4. Run the contents of `database/rls-policies.sql`

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

### 5. Health Check

Visit `http://localhost:3000/api/health` to verify all services are working.

## 🚀 Deployment

### Vercel Deployment

1. **Connect Repository**:
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

2. **Set Environment Variables** in Vercel dashboard:
   - All variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production URL

3. **Deploy**:
   ```bash
   git push origin main
   ```
   (Auto-deploys with Vercel GitHub integration)

## 📡 API Endpoints

### Core Endpoints

- `POST /api/analyze` - Analyze product/service input
- `POST /api/questions` - Generate intelligent questions
- `POST /api/enhance` - Create enhanced prompt
- `GET /api/health` - Service health check

### Template Management

- `GET /api/templates` - List all templates
- `GET /api/templates?type=analysis` - Get specific template type
- `POST /api/templates` - Create new template (admin)
- `PUT /api/templates/[id]` - Update template (admin)
- `DELETE /api/templates/[id]` - Deactivate template (admin)

## 🧪 Testing the Complete Flow

1. **Input**: "New eco-friendly water bottle for fitness enthusiasts"
2. **Platform**: Instagram
3. **Content Type**: Product Advertisement
4. **Questions**: Answer or skip the generated questions
5. **Result**: Receive marketing-optimized prompt

Expected enhanced prompt example:
```
Professional product photography of a sleek, modern eco-friendly water bottle held by a fit young adult in athletic wear, set against a pristine natural outdoor background with lush greenery...
```

## 📊 Monitoring & Analytics

- **Health Monitoring**: `/api/health` endpoint
- **Rate Limiting**: Automatic with headers
- **Error Tracking**: Console logging (Sentry ready)
- **Performance**: Processing time tracking

## 🔒 Security Features

- Rate limiting with Redis
- Input validation with Zod schemas
- SQL injection protection (Supabase RLS)
- Environment variable validation
- CORS configuration

## 🎯 Rate Limits

- **Analysis**: 20 requests/hour (anonymous)
- **Questions**: 30 requests/hour (anonymous)
- **Enhancement**: 15 requests/hour (anonymous)
- **Templates**: 10 requests/hour (admin operations)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

1. **LLM API Errors**: Check API keys and quotas
2. **Database Connection**: Verify Supabase configuration
3. **Rate Limiting**: Check Redis connection and quotas
4. **Deployment**: Ensure all environment variables are set

### Health Check

Always start troubleshooting with:
```bash
curl http://localhost:3000/api/health
```

## 📈 Performance

- **Average Response Time**: <2 seconds
- **LLM Processing**: 1-3 seconds per request
- **Database Queries**: <100ms
- **Rate Limiting**: <50ms overhead

Built with ❤️ for creating better AI-generated content.