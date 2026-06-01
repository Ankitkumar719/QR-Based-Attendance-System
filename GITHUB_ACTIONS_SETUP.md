# GitHub Actions Deployment Setup Guide

## Complete Workflow Overview

This guide sets up automatic deployment to AWS EC2 when you push to the `main` branch.

---

## Step 1: Generate EC2 SSH Key

### On your EC2 instance (Ubuntu):

```bash
# Generate a new SSH key pair
ssh-keygen -t ed25519 -f ~/.ssh/github-actions -N ""

# Display the private key (you'll need this for GitHub Secrets)
cat ~/.ssh/github-actions

# Add public key to authorized_keys
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

**Save the private key output** — you'll paste it into GitHub Secrets as `EC2_SSH_KEY`.

---

## Step 2: Create GitHub Secrets

Navigate to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Create three secrets:

1. **`EC2_HOST`**
   - Value: Your EC2 public IP or DNS (e.g., `54.123.45.67` or `ec2-user.amazonaws.com`)
   - Description: EC2 public IP/DNS

2. **`EC2_USERNAME`**
   - Value: `ubuntu` (for Ubuntu AMIs) or `ec2-user` (for Amazon Linux)
   - Description: SSH username

3. **`EC2_SSH_KEY`**
   - Value: **Paste the entire private key** from Step 1 (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
   - Description: SSH private key

### Verification:
All three secrets should appear in the repository's Secrets list.

---

## Step 3: EC2 Setup (One-time)

### Prerequisites on EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Start PM2 as a daemon and configure startup
pm2 start server.js --name "attendance-system"
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu

# Verify PM2 is running
pm2 list
```

### EC2 Security Group Setup:

Make sure your EC2 security group allows:
- **SSH** (port 22) from your GitHub Actions IP or anywhere (GitHub uses multiple IPs)
- **Application ports** (e.g., port 3000 for Express) from clients

---

## Step 4: Test the Deployment

### Option 1: Automatic (Push to main)
```bash
git push origin main
```

Then check:
- GitHub Actions tab → Select the latest workflow run
- View logs for SSH connection, git pull, npm install, pm2 status

### Option 2: Manual SSH Test

Before relying on the workflow, verify SSH connectivity:

```bash
# From your local machine
ssh -i ~/.ssh/github-actions ubuntu@<EC2_HOST>

# Once connected, verify the project exists
cd ~/QR-Based-Attendance-System
ls -la
pm2 list
```

### Option 3: Dry Run (Simulate Deployment)

```bash
ssh ubuntu@<EC2_HOST> 'cd ~/QR-Based-Attendance-System && git status && npm list --depth=0'
```

---

## Workflow File Location

The workflow file is located at:
```
.github/workflows/deploy.yml
```

This file is already created in your repository and will trigger automatically on every push to `main`.

---

## Understanding the Workflow Steps

### 1. **Checkout code**
   - Downloads your repository code (not used for deployment, but maintains consistency)

### 2. **Configure SSH**
   - Creates `~/.ssh/id_rsa` with your private key
   - Sets correct permissions (600)
   - Adds EC2 host to `known_hosts` to avoid SSH verification prompts

### 3. **Deploy to EC2**
   - Connects via SSH
   - Navigates to project directory
   - Runs commands in sequence:
     - `git pull origin main` — pulls latest code
     - `npm install` — installs dependencies
     - `pm2 restart all` — restarts PM2 apps
     - `pm2 save` — persists PM2 state

### 4. **Verify deployment**
   - Shows PM2 status and recent logs
   - Non-blocking (continues even if this fails, so you see results)

### 5. **Status reporting**
   - Reports success or failure

---

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Cause**: SSH key not properly authorized on EC2

**Fix**:
```bash
# On EC2
cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Issue: "git pull: command not found"

**Cause**: Git not installed on EC2

**Fix**:
```bash
sudo apt install -y git
```

### Issue: "pm2: command not found"

**Cause**: PM2 not installed globally

**Fix**:
```bash
sudo npm install -g pm2
```

### Issue: Workflow fails with timeout

**Cause**: Slow npm install or network issues

**Fix**: Increase timeout in workflow or optimize dependencies

### Issue: "No space left on device"

**Cause**: EC2 disk is full

**Fix**:
```bash
df -h
# Clean up old logs or node_modules
rm -rf node_modules
npm install
```

---

## Security Best Practices

✅ **Implemented in this workflow**:
- SSH key stored in GitHub Secrets (encrypted)
- SSH key permissions set to 600
- `StrictHostKeyChecking=no` for non-interactive SSH
- Private key cleaned up after use (workflow isolation)
- Timeout set to 15 minutes to catch hung processes

✅ **Additional recommendations**:
1. **Restrict EC2 SSH access** to GitHub's IP ranges (if possible) or VPN
2. **Rotate SSH keys** periodically (monthly/quarterly)
3. **Monitor EC2 CloudTrail logs** for unauthorized access attempts
4. **Use IAM roles** instead of storing long-term credentials
5. **Enable EC2 detailed monitoring** for resource utilization
6. **Use secrets rotation** services (AWS Secrets Manager, HashiCorp Vault)

---

## Advanced Configuration

### Deploy only on tagged releases:

```yaml
on:
  push:
    tags:
      - 'v*'
```

### Deploy to multiple environments:

```yaml
jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    steps:
      # ... deploy to staging EC2
  
  deploy-production:
    runs-on: ubuntu-latest
    needs: deploy-staging  # Only run after staging succeeds
    steps:
      # ... deploy to production EC2
```

### Add Slack notifications:

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1.24.0
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Deployment to EC2: ${{ job.status }}"
      }
```

---

## Verification Checklist

- [ ] GitHub Secrets created (EC2_HOST, EC2_USERNAME, EC2_SSH_KEY)
- [ ] SSH key generated on EC2 and authorized
- [ ] `.github/workflows/deploy.yml` exists in repository
- [ ] Node.js and PM2 installed on EC2
- [ ] Project directory exists at `~/QR-Based-Attendance-System`
- [ ] SSH connectivity tested manually
- [ ] First deployment tested by pushing to main
- [ ] PM2 logs verified on EC2

---

## File Checklist

Ensure these files are in your repository:

```
.github/
  workflows/
    deploy.yml          ← GitHub Actions workflow
.nojekyll              ← Disables Jekyll for GitHub Pages
_config.yml            ← GitHub Pages config
.gitignore             ← Includes node_modules/
package.json           ← Project dependencies
package-lock.json      ← Locked versions
```

---

## Monitoring & Logs

### View workflow logs:
1. Go to repository → **Actions** tab
2. Select the latest workflow run
3. Expand deployment step to see full output

### View EC2 application logs:
```bash
ssh ubuntu@<EC2_HOST> 'pm2 logs'
pm2 logs --lines 100  # Last 100 lines
```

---

## Next Steps

1. **Set up GitHub Secrets** (Step 2)
2. **Prepare EC2** (Step 3)
3. **Test SSH connectivity manually**
4. **Push to main** to trigger the workflow
5. **Monitor the Actions tab** for success/failure

**Questions?** Check the "Troubleshooting" section above.
