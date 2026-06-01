#!/bin/bash
# EC2 Setup Script for GitHub Actions Deployment
# Run this ONCE on your EC2 instance to prepare for automated deployments
# Usage: bash setup-ec2.sh

set -e

echo "=== GitHub Actions EC2 Setup Script ==="
echo ""

# Check if running on Ubuntu
if ! grep -q "Ubuntu" /etc/os-release; then
    echo "⚠️  Warning: This script is optimized for Ubuntu. Adjust commands for your distro."
fi

# 1. Generate SSH key
echo "Step 1: Generating SSH key for GitHub Actions..."
if [ ! -f ~/.ssh/github-actions ]; then
    ssh-keygen -t ed25519 -f ~/.ssh/github-actions -N "" -C "github-actions"
    echo "✅ SSH key generated"
    echo ""
    echo "📋 COPY THIS PRIVATE KEY TO GitHub Secrets as EC2_SSH_KEY:"
    echo "===================================================================="
    cat ~/.ssh/github-actions
    echo "===================================================================="
    echo ""
else
    echo "⚠️  SSH key already exists. Skipping generation."
fi

# 2. Add public key to authorized_keys
echo "Step 2: Adding public key to authorized_keys..."
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
echo "✅ Public key added"
echo ""

# 3. Update system
echo "Step 3: Updating system packages..."
sudo apt update -y
sudo apt upgrade -y
echo "✅ System updated"
echo ""

# 4. Install Node.js
echo "Step 4: Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    echo "Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt install -y nodejs
    echo "✅ Node.js installed: $(node --version)"
else
    echo "✅ Node.js already installed: $(node --version)"
fi
echo ""

# 5. Install PM2
echo "Step 5: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    echo "✅ PM2 installed: $(pm2 --version)"
else
    echo "✅ PM2 already installed: $(pm2 --version)"
fi
echo ""

# 6. Install Git
echo "Step 6: Checking Git installation..."
if ! command -v git &> /dev/null; then
    sudo apt install -y git
    echo "✅ Git installed"
else
    echo "✅ Git already installed"
fi
echo ""

# 7. Setup PM2 startup
echo "Step 7: Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
pm2 save
echo "✅ PM2 startup configured"
echo ""

# 8. Display EC2 info
echo "Step 8: EC2 Configuration Summary"
echo "================================="
echo "EC2_HOST: $(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'N/A')"
echo "EC2_USERNAME: ubuntu"
echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo "PM2 version: $(pm2 --version)"
echo "Git version: $(git --version)"
echo ""

echo "=== Setup Complete ==="
echo ""
echo "📝 Next steps:"
echo "1. Create GitHub Secrets in your repository:"
echo "   - EC2_HOST: Your EC2 public IP (from above)"
echo "   - EC2_USERNAME: ubuntu"
echo "   - EC2_SSH_KEY: (copied from output above)"
echo ""
echo "2. Commit .github/workflows/deploy.yml to your repository"
echo ""
echo "3. Push to main branch to trigger deployment"
echo ""
echo "4. Check GitHub Actions tab for deployment status"
