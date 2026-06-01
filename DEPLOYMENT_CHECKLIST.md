# Deployment Setup Checklist

Complete this checklist to ensure your GitHub Actions → EC2 deployment is ready.

---

## Pre-Setup

- [ ] EC2 instance is running (Ubuntu 20.04 or later)
- [ ] EC2 has public IP address or DNS
- [ ] You have SSH access to EC2
- [ ] Git repository is on GitHub
- [ ] You have admin access to the GitHub repository
- [ ] `.github/workflows/deploy.yml` exists in repository
- [ ] `.nojekyll` and `_config.yml` exist (for GitHub Pages fix)

---

## Step 1: Generate SSH Key on EC2

**On EC2 instance:**

- [ ] SSH into EC2: `ssh -i <your-key.pem> ubuntu@<EC2_IP>`
- [ ] Generate Ed25519 key: `ssh-keygen -t ed25519 -f ~/.ssh/github-actions -N ""`
- [ ] Display private key: `cat ~/.ssh/github-actions`
- [ ] **COPY the entire private key** (save to local file for reference)
- [ ] Add public key to authorized_keys: `cat ~/.ssh/github-actions.pub >> ~/.ssh/authorized_keys`
- [ ] Fix permissions:
  - `chmod 600 ~/.ssh/authorized_keys`
  - `chmod 700 ~/.ssh`

---

## Step 2: Install Dependencies on EC2

**On EC2 instance:**

- [ ] Update system: `sudo apt update && sudo apt upgrade -y`
- [ ] Install Node.js:
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt install -y nodejs
  ```
- [ ] Verify Node.js: `node --version` (should be v18+)
- [ ] Install Git: `sudo apt install -y git` (if not present)
- [ ] Install PM2 globally: `sudo npm install -g pm2`
- [ ] Verify PM2: `pm2 --version`
- [ ] Configure PM2 startup:
  ```bash
  sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup ubuntu -u ubuntu --hp /home/ubuntu
  pm2 save
  ```

---

## Step 3: Prepare EC2 Project Directory

**On EC2 instance:**

- [ ] Create project directory: `mkdir -p ~/QR-Based-Attendance-System`
- [ ] Navigate to directory: `cd ~/QR-Based-Attendance-System`
- [ ] Clone repository (if not already):
  ```bash
  git clone https://github.com/YOUR_USERNAME/QR-Based-Attendance-System.git .
  ```
  Or if already cloned:
  ```bash
  git remote -v  # verify origin points to correct repo
  ```
- [ ] Verify files exist: `ls -la` (should show backend/, frontend/, ml/, etc.)
- [ ] Install backend dependencies: `npm install`
- [ ] Verify package.json: `ls -la package.json`

---

## Step 4: Test Manual Deployment (Dry Run)

**On EC2 instance:**

- [ ] Test git pull: `git pull origin main`
- [ ] Test npm install: `npm install`
- [ ] List PM2 apps: `pm2 list`
- [ ] Start app with PM2: `pm2 start server.js --name "attendance-system"`
- [ ] Verify app is running: `pm2 list` (should show "online")
- [ ] Check app logs: `pm2 logs --lines 10`
- [ ] Stop app: `pm2 stop all`
- [ ] Delete from PM2: `pm2 delete all`

---

## Step 5: Create GitHub Secrets

**In GitHub repository UI:**

1. Navigate to: **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Create secret 1:
- [ ] Name: `EC2_HOST`
- [ ] Value: Your EC2 public IP (e.g., `54.123.45.67`)
- [ ] Click **Add secret**

Create secret 2:
- [ ] Name: `EC2_USERNAME`
- [ ] Value: `ubuntu`
- [ ] Click **Add secret**

Create secret 3:
- [ ] Name: `EC2_SSH_KEY`
- [ ] Value: **Paste entire private key** from Step 1 (including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`)
- [ ] Click **Add secret**

**Verify:**
- [ ] All three secrets appear in the Secrets list
- [ ] No red errors next to secrets

---

## Step 6: EC2 Security Group Configuration

**In AWS Console:**

- [ ] Navigate to EC2 → Security Groups
- [ ] Select your security group
- [ ] Edit inbound rules
- [ ] Verify SSH (port 22) is open:
  - [ ] Protocol: TCP
  - [ ] Port: 22
  - [ ] Source: 0.0.0.0/0 (or restrict to your IP)
- [ ] Verify app port is open (if needed for testing):
  - [ ] Protocol: TCP
  - [ ] Port: 3000 (or your app port)
  - [ ] Source: 0.0.0.0/0
- [ ] Click **Save rules**

---

## Step 7: Test GitHub Actions Workflow

**From local machine:**

- [ ] Commit workflow changes (if not already):
  ```bash
  git add .github/workflows/deploy.yml
  git commit -m "Add GitHub Actions deployment workflow"
  ```
- [ ] Push to main: `git push origin main`
- [ ] Navigate to: GitHub repo → **Actions** tab
- [ ] Select the latest workflow run
- [ ] Expand **Deploy to EC2** job
- [ ] Verify all steps succeeded:
  - [ ] ✅ Checkout code
  - [ ] ✅ Configure SSH
  - [ ] ✅ Deploy to EC2
  - [ ] ✅ Verify deployment
  - [ ] ✅ Summary (green checkmark)

---

## Step 8: Verify Application on EC2

**On EC2 instance:**

- [ ] SSH in: `ssh -i ~/.ssh/github-actions ubuntu@<EC2_HOST>`
- [ ] Check PM2 status: `pm2 list` (should show app as "online")
- [ ] Check application logs: `pm2 logs --nostream --lines 20`
- [ ] Verify app is listening:
  ```bash
  curl http://localhost:3000/health  # or your health endpoint
  ```
- [ ] Confirm latest code is deployed: `git log --oneline -1`

---

## Step 9: Make Test Deployment

**From local machine:**

- [ ] Create a test commit: `echo "Test deployment" > test.txt`
- [ ] Commit: `git add . && git commit -m "Test deployment trigger"`
- [ ] Push: `git push origin main`
- [ ] Watch GitHub Actions:
  - [ ] Workflow starts automatically
  - [ ] All steps complete successfully
  - [ ] No errors in logs

---

## Step 10: Ongoing Deployments

- [ ] Future `git push origin main` automatically triggers deployment
- [ ] No manual SSH or PM2 commands needed
- [ ] Monitor **Actions** tab for workflow status
- [ ] Check EC2 via SSH for verification: `pm2 logs`

---

## Troubleshooting Quick Links

**Stuck? Check these sections in GITHUB_ACTIONS_SETUP.md:**

- [ ] "Permission denied (publickey)" → Troubleshooting section
- [ ] "git pull: command not found" → Troubleshooting section
- [ ] "pm2: command not found" → Troubleshooting section
- [ ] "Workflow fails with timeout" → Troubleshooting section
- [ ] Need to test connectivity? → "Verification Checklist" section

---

## Final Sign-Off

- [ ] All items above are checked
- [ ] First deployment via GitHub Actions succeeded
- [ ] Application is running on EC2
- [ ] No manual intervention needed for future deployments
- [ ] PM2 logs are accessible: `pm2 logs`
- [ ] EC2 SSH access is configured and tested

**🎉 Congratulations!** Your automated deployment pipeline is ready.

---

## Quick Commands Reference

```bash
# EC2 verification
ssh ubuntu@<EC2_HOST>
pm2 list
pm2 logs
pm2 restart all
pm2 save

# Local testing
git push origin main
# Then check GitHub Actions tab

# Manual deployment (if needed)
ssh ubuntu@<EC2_HOST> 'cd ~/QR-Based-Attendance-System && git pull && npm install && pm2 restart all'
```

---

## Support Files

- `DEPLOYMENT_QUICKSTART.md` — 5-minute quick start
- `GITHUB_ACTIONS_SETUP.md` — Detailed setup guide (70+ lines)
- `setup-ec2.sh` — Automated EC2 setup script
- `verify-deployment.sh` — Deployment verification script
- `.github/workflows/deploy.yml` — GitHub Actions workflow
