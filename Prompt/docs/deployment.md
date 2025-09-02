# Deployment Guide

## Overview

This guide covers deploying the Media Prompt Enhancer to various platforms including Vercel, Netlify, Docker, and self-hosted environments.

## Quick Deployment (Recommended)

### Deploy to Vercel

1. **Connect Repository**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from repository root
   vercel --prod
   ```

2. **Environment Variables**:
   ```env
   # Optional: Custom domain
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   
   # Optional: Storage configuration  
   MAX_FILE_SIZE=50MB
   MAX_FILES_PER_SESSION=10
   ```

3. **Build Settings**:
   - Framework: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Node.js Version: 18.x

### Deploy to Netlify

1. **Build Configuration** (`netlify.toml`):
   ```toml
   [build]
   command = "npm run build"
   publish = ".next"
   
   [build.environment]
   NODE_VERSION = "18"
   NPM_VERSION = "9"
   ```

2. **Environment Variables**:
   - Add same variables as Vercel through Netlify dashboard

## Docker Deployment

### Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  media-prompt-enhancer:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_KEY}
    restart: unless-stopped
    
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
    depends_on:
      - media-prompt-enhancer
    restart: unless-stopped
```

### Building and Running

```bash
# Build image
docker build -t media-prompt-enhancer .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL="your_url" \
  -e SUPABASE_SERVICE_ROLE_KEY="your_key" \
  media-prompt-enhancer

# Using docker-compose
docker-compose up -d
```

## Self-Hosted Deployment

### Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
npm install -g pm2
```

### Deploy Application

```bash
# Clone repository
git clone https://github.com/chinmaygarg/Media-Prompt-Enhancer.git
cd Media-Prompt-Enhancer

# Install dependencies
npm ci

# Build application
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

### PM2 Configuration (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [{
    name: 'media-prompt-enhancer',
    script: 'npm',
    args: 'start',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NEXT_PUBLIC_SUPABASE_URL: 'your_supabase_url',
      SUPABASE_SERVICE_ROLE_KEY: 'your_service_key'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css text/xml text/javascript 
               application/javascript application/xml+rss application/json;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets caching
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }
}
```

## Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0

# Storage (Local filesystem)
UPLOAD_DIR=/app/uploads
TEMP_DIR=/app/temp
MAX_FILE_SIZE=50MB
MAX_FILES_PER_USER=100

# Security
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://your-domain.com

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=GA-XXXXXXXXX
SENTRY_DSN=your-sentry-dsn

# API Keys (Future)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
```

### Development vs Production

```bash
# Development
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Production
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Performance Optimization

### Next.js Configuration (`next.config.js`)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new (require('@next/bundle-analyzer'))())
      return config
    }
  }),
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Output standalone for Docker
  output: 'standalone',
}

module.exports = nextConfig
```

### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_user_id 
ON media_assets(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_session_id 
ON media_assets(session_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_media_assets_created_at 
ON media_assets(created_at DESC);

-- Cleanup old sessions (run via cron)
DELETE FROM media_assets 
WHERE created_at < NOW() - INTERVAL '7 days' 
AND session_id IS NOT NULL 
AND user_id IS NULL;
```

## Monitoring and Logging

### Health Check Endpoint

```javascript
// pages/api/health.js
export default function handler(req, res) {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    uptime: process.uptime()
  })
}
```

### PM2 Monitoring

```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs media-prompt-enhancer

# Restart application
pm2 restart media-prompt-enhancer

# Auto-restart on file changes (development)
pm2 start ecosystem.config.js --watch
```

### Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## SSL/HTTPS Setup

### Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Manual SSL Certificate

```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate signing request
openssl req -new -key private.key -out certificate.csr

# Generate self-signed certificate (development)
openssl x509 -req -days 365 -in certificate.csr -signkey private.key -out certificate.crt
```

## Backup and Recovery

### Application Backup

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/media-prompt-enhancer"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=.git \
  /path/to/Media-Prompt-Enhancer/

# Backup database (if using PostgreSQL)
pg_dump -h localhost -U username dbname > $BACKUP_DIR/db_$DATE.sql

# Backup media files (if using local storage)
tar -czf $BACKUP_DIR/media_$DATE.tar.gz /path/to/media/files/

# Clean old backups (keep 7 days)
find $BACKUP_DIR -name "*.tar.gz" -o -name "*.sql" | \
  head -n -21 | xargs rm -f

echo "Backup completed: $DATE"
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## Security Checklist

- [ ] Enable HTTPS with valid SSL certificate
- [ ] Set secure environment variables
- [ ] Configure security headers
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Regular dependency updates
- [ ] Monitor for vulnerabilities
- [ ] Implement proper authentication (future)
- [ ] Set up CSP headers
- [ ] Enable request logging

## Troubleshooting

### Common Issues

1. **Build Failures**:
   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm ci
   npm run build
   ```

2. **Memory Issues**:
   ```bash
   # Increase Node.js memory limit
   export NODE_OPTIONS="--max-old-space-size=4096"
   npm run build
   ```

3. **Port Conflicts**:
   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

4. **Database Connection**:
   ```bash
   # Test database connection
   psql -h hostname -U username -d database -c "SELECT 1;"
   ```

### Performance Issues

1. **Slow API Responses**:
   - Check database indexes
   - Monitor CPU/memory usage
   - Enable Next.js logging
   
2. **Large Bundle Size**:
   ```bash
   # Analyze bundle
   npm install -g @next/bundle-analyzer
   ANALYZE=true npm run build
   ```

3. **Memory Leaks**:
   ```bash
   # Monitor memory usage
   pm2 monit
   
   # Restart periodically
   pm2 set pm2-auto-pull:cron_restart "0 2 * * *"
   ```

## Support

- **Deployment Issues**: Create issue with `deployment` label
- **Performance Problems**: Include monitoring data
- **Security Concerns**: Email security@your-domain.com
- **General Help**: [GitHub Discussions](https://github.com/chinmaygarg/Media-Prompt-Enhancer/discussions)

---

**Last Updated**: January 2025  
**Deployment Status**: Production Ready  
**Tested Platforms**: Vercel, Netlify, Docker, Ubuntu 22.04