#!/bin/bash
# GitHub Actions Deployment Verification Script
# Run this to verify your GitHub Actions → EC2 deployment setup
# Usage: bash verify-deployment.sh

set +e

echo "=== GitHub Actions Deployment Verification ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_mark() {
    echo -e "${GREEN}✅${NC} $1"
}

warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

error() {
    echo -e "${RED}❌${NC} $1"
}

# Check if secrets are set (from environment or command line)
echo "1. GitHub Secrets Check"
echo "========================"
if [ -z "$EC2_HOST" ]; then
    warning "EC2_HOST environment variable not set (this is OK for local testing)"
else
    check_mark "EC2_HOST is set: $EC2_HOST"
fi

if [ -z "$EC2_USERNAME" ]; then
    warning "EC2_USERNAME environment variable not set (this is OK for local testing)"
else
    check_mark "EC2_USERNAME is set: $EC2_USERNAME"
fi

if [ -z "$EC2_SSH_KEY" ]; then
    warning "EC2_SSH_KEY environment variable not set (this is OK for local testing)"
else
    check_mark "EC2_SSH_KEY is set (length: ${#EC2_SSH_KEY})"
fi
echo ""

# Check if workflow file exists
echo "2. Workflow File Check"
echo "======================"
if [ -f ".github/workflows/deploy.yml" ]; then
    check_mark "Workflow file exists: .github/workflows/deploy.yml"
    echo "   File size: $(wc -c < .github/workflows/deploy.yml) bytes"
else
    error "Workflow file NOT found at .github/workflows/deploy.yml"
fi
echo ""

# Check local environment
echo "3. Local Environment Check"
echo "=========================="
if command -v git &> /dev/null; then
    check_mark "Git is installed: $(git --version | awk '{print $3}')"
else
    error "Git is NOT installed"
fi

if command -v node &> /dev/null; then
    check_mark "Node.js is installed: $(node --version)"
else
    warning "Node.js is NOT installed locally (not required for deployment)"
fi

if command -v ssh &> /dev/null; then
    check_mark "SSH is installed"
else
    error "SSH is NOT installed"
fi

if command -v ssh-keygen &> /dev/null; then
    check_mark "ssh-keygen is installed"
else
    error "ssh-keygen is NOT installed"
fi
echo ""

# Check for GitHub Actions SSH key locally
echo "4. SSH Key Check"
echo "================"
if [ -f ~/.ssh/github-actions ]; then
    check_mark "GitHub Actions SSH key exists locally"
    key_type=$(head -1 ~/.ssh/github-actions | awk '{print $2}')
    echo "   Key type: $key_type"
else
    warning "GitHub Actions SSH key not found at ~/.ssh/github-actions"
    echo "   (This is OK if using GitHub Secrets)"
fi
echo ""

# Test SSH connectivity (if EC2 info provided)
echo "5. SSH Connectivity Test"
echo "======================="
if [ ! -z "$EC2_HOST" ] && [ ! -z "$EC2_USERNAME" ]; then
    echo "Attempting SSH connection to $EC2_USERNAME@$EC2_HOST..."
    
    if timeout 5 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new \
        $EC2_USERNAME@$EC2_HOST "echo 'SSH connection successful'" 2>/dev/null; then
        check_mark "SSH connection successful"
    else
        error "SSH connection failed"
        echo "   Troubleshooting steps:"
        echo "   1. Verify EC2_HOST is correct"
        echo "   2. Check EC2 security group allows SSH (port 22)"
        echo "   3. Verify SSH key has correct permissions (600)"
        echo "   4. Check SSH public key is in EC2 ~/.ssh/authorized_keys"
    fi
else
    warning "Skipping SSH test (EC2_HOST or EC2_USERNAME not set)"
fi
echo ""

# Check EC2 environment (if SSH available)
echo "6. EC2 Environment Check"
echo "========================"
if [ ! -z "$EC2_HOST" ] && [ ! -z "$EC2_USERNAME" ]; then
    echo "Checking EC2 dependencies..."
    
    # Check Node.js
    if ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "node --version" &>/dev/null; then
        node_ver=$(ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "node --version" 2>/dev/null)
        check_mark "Node.js installed on EC2: $node_ver"
    else
        error "Node.js NOT found on EC2"
    fi
    
    # Check PM2
    if ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "pm2 --version" &>/dev/null; then
        pm2_ver=$(ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "pm2 --version" 2>/dev/null)
        check_mark "PM2 installed on EC2: $pm2_ver"
    else
        error "PM2 NOT found on EC2"
    fi
    
    # Check Git
    if ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "git --version" &>/dev/null; then
        check_mark "Git installed on EC2"
    else
        error "Git NOT found on EC2"
    fi
    
    # Check project directory
    if ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "test -d ~/QR-Based-Attendance-System" &>/dev/null; then
        check_mark "Project directory exists: ~/QR-Based-Attendance-System"
    else
        error "Project directory NOT found: ~/QR-Based-Attendance-System"
    fi
    
    # Check PM2 status
    echo ""
    echo "   Current PM2 status:"
    ssh -o ConnectTimeout=5 $EC2_USERNAME@$EC2_HOST "pm2 list" 2>/dev/null | head -10
    
else
    warning "Skipping EC2 checks (EC2_HOST or EC2_USERNAME not set)"
fi
echo ""

# Summary
echo "7. Summary"
echo "=========="
echo ""
echo "To complete your setup:"
echo "1. Run setup-ec2.sh on your EC2 instance"
echo "2. Create GitHub Secrets:"
echo "   - Go to: GitHub repo → Settings → Secrets and variables → Actions"
echo "   - Add: EC2_HOST, EC2_USERNAME, EC2_SSH_KEY"
echo "3. Push to main branch to trigger deployment"
echo "4. Check GitHub Actions tab for workflow status"
echo ""
echo "For detailed setup guide, see: GITHUB_ACTIONS_SETUP.md"
