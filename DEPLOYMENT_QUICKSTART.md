# GitHub Actions → EC2 Deployment: Quick Start (5 Minutes)

## TL;DR - Fastest Setup Path

### 1. On Your EC2 Instance

```bash
# SSH into EC2
ssh -i <your-key.pem> ubuntu@<EC2_PUBLIC_IP>

# Download and run setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/QR-Based-Attendance-System/main/setup-ec2.sh
bash setup-ec2.sh

# 📋 COPY THE PRIVATE KEY OUTPUT
```

### 2. In GitHub Repository

**Settings → Secrets and variables → Actions → New repository secret**

Create three secrets:

| Secret Name | Value |
|-----------|-------|
| `EC2_HOST` | Your EC2 public IP (e.g., `54.123.45.67`) |
| `EC2_USERNAME` | `ubuntu` |
| `EC2_SSH_KEY` | Paste the **entire private key** from setup script output |

### 3. Deploy

```bash
git push origin main
```

**Check deployment:**
- GitHub repo → Actions tab → View latest workflow run
- Verify "Deploy to EC2" job succeeded
- Check EC2: `pm2 list` shows your app running

---

## What Gets Created

| File | Purpose |
|------|---------|
| `.github/workflows/deploy.yml` | GitHub Actions workflow |
| `GITHUB_ACTIONS_SETUP.md` | Detailed setup guide (70+ lines) |
| `setup-ec2.sh` | One-command EC2 setup script |
| `verify-deployment.sh` | Deployment verification script |

---

## Workflow Triggers

```yaml
# Automatic deployment on:
- Any push to main branch

# Deployment steps:
1. Checkout code
2. Configure SSH
3. Connect to EC2 and run:
   - git pull origin main
   - npm install
   - pm2 restart all
   - pm2 save
4. Verify PM2 status
5. Report success/failure
```

---

## Testing Deployment

### Quick test (1 minute):
```bash
git push origin main
# Check GitHub Actions → workflows for status
```

### Manual SSH test (verify connectivity):
```bash
ssh -i ~/.ssh/github-actions ubuntu@<EC2_HOST>
cd ~/QR-Based-Attendance-System
pm2 list
```

### Full simulation:
```bash
ssh ubuntu@<EC2_HOST> 'cd ~/QR-Based-Attendance-System && git pull origin main && npm install && pm2 restart all'
```

---

## Troubleshooting (Most Common Issues)

| Issue | Solution |
|-------|----------|
| "Permission denied (publickey)" | Run `setup-ec2.sh` again, check authorized_keys |
| Workflow says "SSH key invalid" | Verify EC2_SSH_KEY secret contains full private key (-----BEGIN to -----END) |
| "pm2: command not found" | Run `sudo npm install -g pm2` on EC2 |
| Deployment times out | Check EC2 security group allows SSH (port 22) |
| App crashes after deploy | Check `pm2 logs` on EC2, verify app.js is correct |

---

## Security Checklist

✅ SSH private key stored in GitHub Secrets (encrypted)  
✅ SSH key permissions: 600  
✅ EC2 security group restricts SSH access  
✅ Private key never logged or exposed  
✅ Each deployment is isolated in GitHub Actions  

---

## Full Docs

- **Detailed Setup**: See `GITHUB_ACTIONS_SETUP.md`
- **Workflow Code**: See `.github/workflows/deploy.yml`
- **EC2 Setup Script**: See `setup-ec2.sh`
- **Verification**: Run `bash verify-deployment.sh`

---

## Next Push Deployment

After first successful deployment, every push to `main` will automatically:
1. Pull latest code
2. Install dependencies
3. Restart PM2 apps
4. Report status in GitHub Actions

No manual SSH or PM2 commands needed anymore! 🚀
