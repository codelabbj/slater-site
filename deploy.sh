#!/bin/bash

# Load environment variables
set -a
source .env.deploy
set +a

# Configuration
VPS_HOST="${VPS_HOST:-localhost}"
VPS_USER="${VPS_USER:-root}"
VPS_PATH="${VPS_PATH:-/var/www/app}"
BRANCH="${DEPLOY_BRANCH:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo_report() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

echo_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

echo_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check required variables
if [ -z "$VPS_HOST" ] || [ -z "$VPS_USER" ] || [ -z "$VPS_PATH" ]; then
    echo_error "Missing configuration in .env.deploy"
    echo "Create .env.deploy with:"
    echo "  VPS_HOST=192.168.1.100"
    echo "  VPS_USER=root"
    echo "  VPS_PATH=/var/www/my-app"
    exit 1
fi

echo_report "=========================================="
echo_report "   DEPLOYMENT REPORT - $(date)"
echo_report "=========================================="
echo_report "Host: $VPS_HOST"
echo_report "User: $VPS_USER"
echo_report "Path: $VPS_PATH"
echo_report "Branch: $BRANCH"
echo ""

# Step 1: Push to production branch
echo_report "[1/4] Pushing to production branch..."
if git push origin "$BRANCH" 2>&1; then
    echo_report "Push successful"
else
    echo_error "Push failed"
    exit 1
fi
echo ""

# Step 2: Connect to VPS and update
echo_report "[2/4] Connecting to VPS and updating..."

SSH_CMD="
    echo '=== Deployment Started: \$(date) ===' && \
    cd $VPS_PATH && \
    echo '--- Pulling latest code ---' && \
    git checkout $BRANCH && \
    git pull origin $BRANCH && \
    echo '--- Installing dependencies ---' && \
    pnpm install && \
    echo '--- Building application ---' && \
    pnpm build && \
    echo '--- Restarting PM2 ---' && \
    pm2 restart all && \
    echo '--- Checking status ---' && \
    pm2 status && \
    echo '=== Deployment Completed: \$(date) ==='
"

if ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "$SSH_CMD" 2>&1; then
    echo_report "VPS update successful"
else
    echo_error "VPS update failed"
    exit 1
fi
echo ""

# Step 3: Final report
echo_report "[3/4] Deployment Summary"
echo_report "------------------------"
echo_report "Branch: $BRANCH"
echo_report "Server: $VPS_HOST"
echo_report "Status: SUCCESS"
echo_report "Time: $(date)"
echo ""

# Step 4: Health check
echo_report "[4/4] Health check..."
HEALTH=$(ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/health 2>/dev/null || echo 'N/A'")

if [ "$HEALTH" = "200" ]; then
    echo_report "Application is responding (HTTP $HEALTH)"
else
    echo_warn "Health check returned: $HEALTH (may need manual verification)"
fi

echo ""
echo_report "=========================================="
echo_report "   DEPLOYMENT FINISHED SUCCESSFULLY"
echo_report "=========================================="