#!/bin/bash
# scripts/deploy.sh - Production deployment script

set -e

ENVIRONMENT=${1:-production}
VERSION=${2:-latest}

echo "🚀 Deploying Comic Translator to $ENVIRONMENT..."

# Check environment
if [ "$ENVIRONMENT" != "production" ] && [ "$ENVIRONMENT" != "staging" ]; then
    echo "❌ Invalid environment. Use 'production' or 'staging'"
    exit 1
fi

# Check if required environment variables are set
if [ -z "$GOOGLE_TRANSLATE_API_KEY" ]; then
    echo "⚠️  Warning: GOOGLE_TRANSLATE_API_KEY not set"
fi

# Build and deploy with Docker Compose
echo "🔨 Building Docker images..."
docker-compose -f docker/docker-compose.yml build

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker/docker-compose.yml down

# Start new containers
echo "🚀 Starting new containers..."
docker-compose -f docker/docker-compose.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "❌ Backend health check failed"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend health check failed"
    exit 1
fi

echo "✅ Deployment complete!"
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"

#!/bin/bash
# scripts/backup.sh - Backup script

set -e

BACKUP_DIR="/backups/comic-translator"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="comic-translator-backup-$DATE"

echo "🗄️ Starting backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup uploaded files
echo "📂 Backing up uploaded files..."
if [ -d "backend/uploads" ]; then
    tar -czf "$BACKUP_DIR/$BACKUP_NAME-uploads.tar.gz" -C backend uploads/
fi

# Backup logs
echo "📝 Backing up logs..."
if [ -d "backend/logs" ]; then
    tar -czf "$BACKUP_DIR/$BACKUP_NAME-logs.tar.gz" -C backend logs/
fi

# Backup configuration
echo "⚙️ Backing up configuration..."
tar -czf "$BACKUP_DIR/$BACKUP_NAME-config.tar.gz" \
    --exclude="node_modules" \
    --exclude="dist" \
    --exclude="uploads" \
    --exclude="logs" \
    --exclude="temp" \
    --exclude=".git" \
    .

# Backup database (if using PostgreSQL)
if [ ! -z "$DATABASE_URL" ]; then
    echo "🗃️ Backing up database..."
    pg_dump "$DATABASE_URL" | gzip > "$BACKUP_DIR/$BACKUP_NAME-database.sql.gz"
fi

# Remove old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find "$BACKUP_DIR" -name "comic-translator-backup-*" -mtime +7 -delete

echo "✅ Backup complete: $BACKUP_DIR/$BACKUP_NAME"
