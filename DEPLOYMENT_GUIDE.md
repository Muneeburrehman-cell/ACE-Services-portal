# ACE Services Portal — Complete Deployment Guide
## From Personal Laptop to Company Server

**Prepared For:** Company Server Deployment  
**Date:** August 25, 2026  
**Target:** Remote Access via Cloudflare + Local Server Setup

---

## TABLE OF CONTENTS

1. [Pre-Deployment Testing & Validation](#1-pre-deployment-testing--validation)
2. [Server Laptop Setup](#2-server-laptop-setup-prerequisites)
3. [Git Repository Setup](#3-git-repository-setup)
4. [Database & PostgreSQL Setup](#4-database--postgresql-setup)
5. [Environment Variables & Configuration](#5-environment-variables--configuration)
6. [Resend Email Service Setup](#6-resend-email-service-setup)
7. [Cloudflare Tunneling Setup](#7-cloudflare-tunneling-setup)
8. [Building & Starting Production](#8-building--starting-production)
9. [Verification Checklist](#9-verification-checklist)
10. [Troubleshooting Guide](#10-troubleshooting-guide)

---

## 1. PRE-DEPLOYMENT TESTING & VALIDATION

### 1.1 Backend Integration Tests

Run these commands to verify backend API is working:

```powershell
# Terminal 1: Start PostgreSQL (if local)
# Terminal 2: Start API server
cd d:\Portal\apps\api
pnpm dev

# Terminal 3: Test authentication endpoints
curl -X POST http://localhost:4000/api/auth/login `
  -H "Content-Type: application/json" `
  -d '{"email":"test@company.com","password":"password123"}'

# Response should be:
# {
#   "accessToken": "eyJhbGc...",
#   "role": "ADMIN",
#   "refreshToken": "..."
# }
```

**Test Suite:**

```powershell
# Run all backend tests
cd d:\Portal\apps\api
pnpm test

# Run specific test file
pnpm test auth.service.spec.ts

# View test coverage
pnpm test --coverage
```

### 1.2 Frontend Integration Tests

```powershell
# Terminal: Start both services
cd d:\Portal
pnpm dev:api
# Terminal 2:
pnpm dev:web

# Browser: Navigate to http://localhost:3000
# Test login flow:
# 1. Click "Business Development" role
# 2. Enter test email: admin@aceservices.com
# 3. Enter test password: password123
# 4. Should redirect to BD dashboard
```

### 1.3 New Employee Setup Flow Test

```
1. Browser: http://localhost:3000
2. Click "New Employee? Setup your account credentials →"
3. Enter email: newemployee@aceservices.com
4. Expected: Error (email not in database yet)

# Create test user via backend
curl -X POST http://localhost:4000/api/users `
  -H "Authorization: Bearer {ADMIN_TOKEN}" `
  -H "Content-Type: application/json" `
  -d '{
    "email":"newemployee@aceservices.com",
    "fullName":"New Employee",
    "role":"ESTIMATION_ENGINEER"
  }'

# Now setup should work:
1. Enter email again
2. Set password (8+ chars)
3. Should see success screen
4. Click "Go to Login"
5. Login with new email + password
6. Should see engineer dashboard
```

### 1.4 Logo Verification

Check that logo displays correctly:

```
Frontend:
- Login page: ACE SERVICES logo in top center ✓
- Setup page: ACE SERVICES logo in top center ✓
- Dashboard (after login): ACE SERVICES logo in sidebar ✓
- Dashboard: ACE SERVICES logo in top navigation ✓

Email:
- New project submitted email ✓
- Project assigned email ✓
- Account setup email ✓
- Email should include ACE SERVICES branding
```

### 1.5 Project Workflow Integration Test

```
1. Login as BD Agent: bd@aceservices.com / password123
2. Click "New Project"
3. Fill form:
   - Client Company: Test Construction LLC
   - Contact: John Doe
   - Email: john@test.com
   - Phone: 555-1234
   - Scope: Test scope
   - Deadline: 2025-01-31
   - Price: $5000
4. Submit
5. Admin gets email: "🚀 New Project Uploaded: PRJ-2025-0001 — Test Construction LLC"
6. Login as Admin: admin@aceservices.com / password123
7. Navigate to Pipeline Control → Should see PRJ-2025-0001
8. Assign to engineer with deadline, priority, instructions
9. Engineer gets email: "📐 New Assignment: PRJ-2025-0001 (Cost Estimation)"
10. Engineer marks in_progress → delivered (with file upload)
11. Admin gets notification: "Deliverables Ready for Review"
12. Admin sends to client
13. Client (john@test.com) receives email with deliverables + invoice
```

### 1.6 RFI Workflow Test

```
1. Engineer (logged in) → Project detail
2. Click "Create RFI"
3. Title: "Client Clarification Needed"
4. Question: "Need client approval for redesign"
5. Submit
6. Admin gets email: "❓ New Engineering RFI: PRJ-2025-0001 — Client Clarification Needed"
7. Admin answers: "Approved. Proceed with redesign."
8. Engineer gets email: "RFI Answered: PRJ-2025-0001"
9. Engineer sees answer in portal ✓
```

---

## 2. SERVER LAPTOP SETUP — PREREQUISITES

### 2.1 Hardware Requirements

**Minimum Specifications:**
- **RAM:** 16 GB (8 GB minimum, but 16 GB recommended)
- **Storage:** 100 GB free SSD space
- **CPU:** Quad-core processor or better
- **Network:** Ethernet connection preferred (or strong WiFi)
- **OS:** Windows 10/11 Professional or Server Edition

**Recommended Server Setup:**
- Static IP address on company network (e.g., `192.168.1.50`)
- Backup power supply (UPS)
- External hard drive for daily backups
- Separate monitor + keyboard (always-on setup)

### 2.2 Software Prerequisites

Install these on the server laptop **before starting deployment**:

#### Git for Windows
```powershell
# Download from: https://git-scm.com/download/win
# Run installer, use defaults
# Verify installation:
git --version
# Output: git version 2.46.0.windows.1
```

#### Node.js LTS (v20 or v22)
```powershell
# Download from: https://nodejs.org/
# Choose LTS version (v20.x or v22.x)
# Use default installation path
# Verify:
node --version
npm --version
```

#### pnpm (Package Manager)
```powershell
# Install globally
npm install -g pnpm@latest

# Verify
pnpm --version
# Output: 9.x.x
```

#### PostgreSQL Server 15+
```powershell
# Download from: https://www.postgresql.org/download/windows/
# Installation steps:
# 1. Run installer
# 2. Installation directory: C:\Program Files\PostgreSQL\16 (default)
# 3. Data directory: C:\Program Files\PostgreSQL\16\data
# 4. Super user (postgres) password: [STRONG_PASSWORD_HERE]
# 5. Port: 5432 (default)
# 6. Locale: [Default]
# 7. Check "Install as Windows Service"

# After installation, verify:
psql --version
# Output: psql (PostgreSQL) 16.0
```

#### Cloudflare Tunnel (cloudflared)
```powershell
# Download from: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/tunnel-guide/remote-setup/
# Or via Chocolatey:
choco install cloudflared

# Verify:
cloudflared --version
```

### 2.3 Network Configuration

**Server Laptop Network Setup:**

```powershell
# 1. Set static IP on company network
# Settings → Network & Internet → Advanced network settings → Change adapter options
# Right-click Ethernet → Properties → IPv4 Properties
# Set: 
#   IP Address: 192.168.1.50 (or ask network admin for IP)
#   Subnet Mask: 255.255.255.0
#   Gateway: 192.168.1.1 (or ask network admin)
#   DNS: 8.8.8.8, 8.8.4.4

# 2. Enable Windows Firewall with ports open:
# Settings → Privacy & Security → Windows Defender Firewall
# Click "Allow an app through firewall"
# Add:
#   - Node.js (or port 4000 manually)
#   - PostgreSQL (port 5432)
#   - Allow on Private network only

# 3. Test connectivity from another machine:
ping 192.168.1.50  # Should respond

# 4. Configure Cloudflare tunnel (see section 7)
```

---

## 3. GIT REPOSITORY SETUP

### 3.1 Initialize Git Repository (First Time Only)

On your **personal laptop**, initialize git:

```powershell
cd d:\Portal

# Initialize git repo
git init

# Create .gitignore if not exists (check existing)
# Should have: node_modules, dist, .env, .env.*.local, etc.

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: ACE Services Portal project"

# Add remote (choose one option below)
```

### 3.2 Git Remote Options

**Option A: GitHub** (Recommended for Teams)

```powershell
# 1. Create new private repository on GitHub.com
# Repository name: ace-portal
# Privacy: Private
# Do NOT initialize with README

# 2. On personal laptop:
cd d:\Portal
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ace-portal.git
git branch -M main
git push -u origin main

# 3. Add team members (optional)
# GitHub → Settings → Collaborators → Add people
# Invite team members with appropriate permissions
```

**Option B: GitLab** (Alternative)

```powershell
git remote add origin https://gitlab.com/YOUR_USERNAME/ace-portal.git
git branch -M main
git push -u origin main
```

**Option C: Gitea (Self-Hosted)** (For Company Server)

```powershell
# If company has self-hosted Gitea server
git remote add origin https://gitea.company.com/ace-portal.git
git branch -M main
git push -u origin main
```

### 3.3 Clone on Server Laptop

```powershell
# On company server laptop:
cd C:\Projects  # or preferred location

# Clone repository
git clone https://github.com/YOUR_GITHUB_USERNAME/ace-portal.git

# Navigate to project
cd ace-portal

# Verify status
git status
# On branch main
# Your branch is up to date with 'origin/main'.
# nothing to commit, working tree clean
```

### 3.4 Git Workflow for Deployment

**Pull Latest Changes Before Deployment:**

```powershell
# On server laptop:
cd C:\Projects\ace-portal

# Fetch latest from GitHub
git fetch origin

# Check if updates available
git log --oneline -5

# Pull updates
git pull origin main

# Verify changes
git status
```

**Push Bug Fixes or Improvements:**

```powershell
# On personal or server laptop:
cd d:\Portal  # or C:\Projects\ace-portal

# Create feature branch
git checkout -b feature/fix-login-issue

# Make changes
# ... edit files ...

# Stage changes
git add src/auth/auth.service.ts

# Commit
git commit -m "Fix: prevent account lockout for simultaneous login attempts"

# Push to GitHub
git push origin feature/fix-login-issue

# Create Pull Request on GitHub (optional)
# GitHub → Compare & pull request
# Add description, assign reviewers
# Merge into main after review
```

**Branch Strategy (Recommended):**

```
main (production-ready, deployed to server)
  ├── develop (staging, tested features)
  │    ├── feature/new-rfi-system
  │    ├── feature/enhance-reports
  │    └── bugfix/login-timeout
  └── [production release tags]
       v1.0.0, v1.0.1, v1.1.0, etc.
```

---

## 4. DATABASE & POSTGRESQL SETUP

### 4.1 Create Database on Server

```powershell
# Connect to PostgreSQL as super user
psql -U postgres -h 127.0.0.1 -p 5432

# Enter password (set during PostgreSQL installation)

# In psql console, create database:
CREATE DATABASE portal;

# Create user for application
CREATE USER portal_user WITH PASSWORD 'STRONG_PASSWORD_HERE';

# Grant permissions
GRANT ALL PRIVILEGES ON DATABASE portal TO portal_user;

# Exit psql
\q
```

### 4.2 Verify Database Connection

```powershell
# Test connection as portal_user
psql -U portal_user -h 127.0.0.1 -d portal -p 5432

# Enter password
# Should connect successfully

# List tables (initially empty):
\dt

# Exit
\q
```

### 4.3 Run Database Migrations

```powershell
# On server laptop:
cd C:\Projects\ace-portal\apps\api

# Create .env file (see section 5)
# DATABASE_URL=postgresql://portal_user:STRONG_PASSWORD_HERE@127.0.0.1:5432/portal

# Install dependencies
pnpm install

# Run migrations
pnpm db:migrate

# Verify schema created
pnpm prisma studio
# Opens browser at http://localhost:5555
# Should show all tables: users, projects, files, etc.
```

### 4.4 Backup & Restore Procedures

**Automated Daily Backup:**

```powershell
# Create backup script: C:\Scripts\backup-postgres.ps1

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\Backups\portal_db_$timestamp.sql"
$logFile = "C:\Backups\backup.log"

# Create backup
& "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" `
  -U portal_user `
  -h 127.0.0.1 `
  -d portal > $backupFile

# Log result
"$(Get-Date): Backup completed to $backupFile" >> $logFile

# Schedule with Task Scheduler:
# Trigger: Daily at 2:00 AM
# Action: PowerShell -ExecutionPolicy Bypass -File C:\Scripts\backup-postgres.ps1
```

**Manual Backup:**

```powershell
# Backup database
pg_dump -U portal_user -h 127.0.0.1 -d portal > portal_backup_2025-01-31.sql

# Restore from backup
psql -U portal_user -h 127.0.0.1 -d portal < portal_backup_2025-01-31.sql
```

---

## 5. ENVIRONMENT VARIABLES & CONFIGURATION

### 5.1 Create Production .env File

**File Location:** `C:\Projects\ace-portal\apps\api\.env`

```env
# ────────────────────────────────────────────────────────────
# DATABASE
# ────────────────────────────────────────────────────────────
DATABASE_URL=postgresql://portal_user:STRONG_PASSWORD_HERE@192.168.1.50:5432/portal

# ────────────────────────────────────────────────────────────
# JWT & AUTHENTICATION
# ────────────────────────────────────────────────────────────
JWT_SECRET=your-256-bit-secret-key-generate-this-securely-min-32-chars-long-1a2b3c4d5e6f7g8h
JWT_REFRESH_SECRET=your-256-bit-refresh-secret-key-min-32-chars-long-9i0j1k2l3m4n5o6p
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ────────────────────────────────────────────────────────────
# FILE STORAGE (S3 / Cloudflare R2)
# ────────────────────────────────────────────────────────────
# Option 1: Production (Cloudflare R2)
CF_ACCOUNT_ID=your-cloudflare-account-id
CF_R2_ACCESS_KEY_ID=your-r2-access-key-id
CF_R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
CF_R2_BUCKET=your-r2-bucket-name

# Option 2: Demo mode (local filesystem)
# CF_ACCOUNT_ID=demo
# CF_R2_ACCESS_KEY_ID=demo
# CF_R2_SECRET_ACCESS_KEY=demo
# CF_R2_BUCKET=demo-local

# ────────────────────────────────────────────────────────────
# EMAIL SERVICE (Resend)
# ────────────────────────────────────────────────────────────
RESEND_API_KEY=re_YOUR_RESEND_API_KEY_HERE
RESEND_FROM_EMAIL=noreply@aceservices.com

# Optional: SendGrid fallback
# SENDGRID_API_KEY=SG.your-sendgrid-key
# SENDGRID_FROM_EMAIL=noreply@aceservices.com

# Optional: SMTP fallback
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# SMTP_FROM_EMAIL=noreply@aceservices.com

# ────────────────────────────────────────────────────────────
# APPLICATION URLS
# ────────────────────────────────────────────────────────────
APP_BASE_URL=https://ace-portal.YOUR_COMPANY.com
API_BASE_URL=https://ace-api.YOUR_COMPANY.com

# Local/LAN alternative:
# APP_BASE_URL=http://192.168.1.50:3000
# API_BASE_URL=http://192.168.1.50:4000

# ────────────────────────────────────────────────────────────
# ADMIN & COMPANY
# ────────────────────────────────────────────────────────────
ADMIN_EMAIL=admin@aceservices.com
COMPANY_NAME=ACE SERVICES

# ────────────────────────────────────────────────────────────
# ENVIRONMENT
# ────────────────────────────────────────────────────────────
NODE_ENV=production
```

### 5.2 Create Frontend Environment Configuration

**File Location:** `C:\Projects\ace-portal\apps\web\.env.local`

```env
# Frontend can only access NEXT_PUBLIC_ variables
NEXT_PUBLIC_API_URL=https://ace-api.YOUR_COMPANY.com/api

# For local/LAN testing:
# NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api
```

### 5.3 Generate Secure Secrets

```powershell
# Generate JWT secrets (256-bit = 32 bytes = 64 hex chars)
$secret = [System.Linq.Enumerable]::Range(0, 32) | `
  ForEach-Object { [string]::Format("{0:x2}", [System.Security.Cryptography.RandomNumberGenerator]::GetByte($_)) } | `
  Join-String

Write-Host "JWT_SECRET=$secret"

# Run twice for JWT_SECRET and JWT_REFRESH_SECRET
# Use in .env file
```

**Alternative (easier):**

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output example:
# a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 5.4 Protect Secrets

```powershell
# Never commit .env to Git
# Verify in .gitignore:
Get-Content .gitignore | Select-String ".env"

# Should output:
# .env
# .env.*.local
# .env.prod

# Store real secrets in a secure location:
# - Save .env file on server laptop, restricted permissions
# - Document secrets in secure vault (LastPass, 1Password, etc.)
# - Use Git-based secrets management for team (e.g., git-crypt)

# Restrict file permissions (Windows)
icacls "C:\Projects\ace-portal\apps\api\.env" /grant:r "%USERNAME%:F" /inheritance:r
```

---

## 6. RESEND EMAIL SERVICE SETUP

### 6.1 Create Resend Account

1. Visit https://resend.com/
2. Sign up with company email
3. Verify email address
4. Click "Create API Key"
5. Copy the key (starts with `re_`)

### 6.2 Configure Custom Domain (Optional but Recommended)

**In Resend Dashboard:**

```
Settings → Domains → Add Domain
1. Enter domain: aceservices.com (or ace.company.com)
2. Add DNS records (CNAME, SPF, DKIM to your DNS provider)
3. Verify domain
4. Update RESEND_FROM_EMAIL=noreply@aceservices.com
```

### 6.3 Update .env

```env
RESEND_API_KEY=re_YOUR_KEY_FROM_RESEND_DASHBOARD
RESEND_FROM_EMAIL=noreply@aceservices.com
```

### 6.4 Test Email Sending

```powershell
# Create test file: C:\test-email.js

const resend = require('resend');

const client = new resend.Resend('re_YOUR_API_KEY');

async function sendTest() {
  try {
    const result = await client.emails.send({
      from: 'noreply@aceservices.com',
      to: 'your-email@company.com',
      subject: 'ACE Portal Test Email',
      text: 'If you received this, Resend is working!',
    });
    console.log('Email sent:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

sendTest();

# Run test
node C:\test-email.js
```

### 6.5 Monitor Email Delivery

**Resend Dashboard:**
- Analytics → View delivery metrics
- Logs → See bounce, delivered, opened events
- Webhooks → Optional: send delivery events to your API

---

## 7. CLOUDFLARE TUNNELING SETUP

### 7.1 Create Cloudflare Account

1. Visit https://dash.cloudflare.com/
2. Sign up or log in
3. Add your company domain (e.g., `company.com`)
4. Follow DNS setup instructions

### 7.2 Create Cloudflare Tunnel

**Via Cloudflare Dashboard:**

```
Cloudflare Dashboard → Zero Trust → Networks → Tunnels
1. Click "Create a tunnel"
2. Name: "ACE Portal Server"
3. Environment: Windows (select Connector)
4. Download connector (cloudflared)
```

### 7.3 Install Cloudflared on Server Laptop

```powershell
# Download from: https://github.com/cloudflare/cloudflared/releases
# Or via Chocolatey:
choco install cloudflared -y

# Verify
cloudflared --version
# Output: cloudflared version 2024.1.0

# Authenticate cloudflared
cloudflared tunnel login

# Browser opens → Log in to Cloudflare account
# Authorize cloudflared to manage tunnels
# Certificate saved to: %APPDATA%\cloudflared\cert.pem
```

### 7.4 Create Tunnel Configuration

**File: `C:\Program Files\cloudflared\config.yml`**

```yaml
tunnel: ace-portal-tunnel-uuid
credentials-file: C:\Users\YOUR_USERNAME\.cloudflared\ace-portal-tunnel-uuid.json

ingress:
  # API Backend on port 4000
  - hostname: ace-api.company.com
    service: http://localhost:4000

  # Frontend on port 3000
  - hostname: ace-portal.company.com
    service: http://localhost:3000

  # PostgreSQL (optional, not recommended to expose)
  # - hostname: ace-db.company.com
  #   service: tcp://localhost:5432

  # Default catch-all
  - service: http_status:404

# Logging
loglevel: info
logfile: C:\Logs\cloudflared.log
```

### 7.5 Run Cloudflared as Windows Service

```powershell
# Install as Windows Service
cloudflared service install `
  --config "C:\Program Files\cloudflared\config.yml" `
  --logfile "C:\Logs\cloudflared.log"

# Start service
cloudflared service start

# Verify service running
Get-Service cloudflared | Select-Object Status

# View logs
Get-Content "C:\Logs\cloudflared.log" -Tail 20

# Stop service (if needed)
cloudflared service stop
```

### 7.6 Configure DNS (Cloudflare Dashboard)

**In Cloudflare Dashboard:**

```
DNS Records → Add Record
1. Type: CNAME
   Name: ace-api
   Content: ace-portal-tunnel-uuid.cfargotunnel.com
   TTL: Auto
   Proxy: Proxied

2. Type: CNAME
   Name: ace-portal
   Content: ace-portal-tunnel-uuid.cfargotunnel.com
   TTL: Auto
   Proxy: Proxied
```

### 7.7 Test Cloudflare Tunnel

```powershell
# From any computer (not on company LAN):
curl https://ace-api.company.com/health

# Response should be:
# {"status":"ok"}

# Test frontend
Start-Process "https://ace-portal.company.com"
# Should load login page

# From company LAN, test local access:
curl http://192.168.1.50:4000/health
curl http://192.168.1.50:3000/
```

### 7.8 Optional: Cloudflare Access Control

**Restrict access to authenticated users only (Zero Trust):**

```
Cloudflare Dashboard → Zero Trust → Access → Applications
1. Create new application
   Name: ACE Portal
   Domain: ace-portal.company.com

2. Add policies:
   - Allowed: company email domain (@company.com)
   - Blocked: everything else

3. Authentication: Email OTP (one-time password)
```

---

## 8. BUILDING & STARTING PRODUCTION

### 8.1 Install Dependencies

```powershell
cd C:\Projects\ace-portal

# Install monorepo dependencies
pnpm install

# Verify installations
pnpm -v
node -v
npm -v
```

### 8.2 Build Backend

```powershell
cd C:\Projects\ace-portal\apps\api

# Build NestJS application
pnpm build

# Output: dist/ folder created with compiled JavaScript

# Verify build
Get-ChildItem dist/ -Recurse | Select-Object -First 10
```

### 8.3 Build Frontend

```powershell
cd C:\Projects\ace-portal\apps\web

# Build Next.js application
pnpm build

# Output: .next/ folder created (production build)

# Verify build
Get-ChildItem .next/ | Select-Object -Last 5
```

### 8.4 Start Backend Production Server

**Option A: Manual Start**

```powershell
cd C:\Projects\ace-portal\apps\api

# Start production server
pnpm start:prod

# Output should show:
# [Nest] 1234  - 01/31/2025, 10:30:45 AM     LOG [NestFactory] Starting Nest application...
# [Nest] 1234  - 01/31/2025, 10:30:46 AM     LOG [InstanceLoader] PrismaModule dependencies initialized
# [Nest] 1234  - 01/31/2025, 10:30:47 AM     LOG Listening on port 4000
```

**Option B: Windows Service (PM2)**

```powershell
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file: C:\Projects\ace-portal\ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'ACE-API',
      script: './apps/api/dist/main.js',
      cwd: 'C:\\Projects\\ace-portal',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
      },
      error_file: 'C:\\Logs\\api-error.log',
      out_file: 'C:\\Logs\\api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};

# Start with PM2
pm2 start ecosystem.config.js

# Make PM2 auto-start on system reboot
pm2 startup
pm2 save

# Monitor
pm2 monit
pm2 logs ACE-API
```

### 8.5 Start Frontend Production Server

**Terminal 2:**

```powershell
cd C:\Projects\ace-portal\apps\web

# Start production server
pnpm start

# Output should show:
# > ace-portal@0.1.0 start
# > next start
# ▲ Next.js 14.2.5
# - Local: http://localhost:3000
```

### 8.6 Verify Services Running

```powershell
# Check running processes
Get-Process | Select-Object Name, Id, WorkingSet | Where-Object {$_.Name -like "*node*"}

# Test API endpoint
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"admin@aceservices.com","password":"wrong"}'

# Should get 401 (unauthorized) - that's correct!

# Test Frontend
Invoke-WebRequest -Uri "http://localhost:3000" | Select-Object StatusCode
# Output: 200
```

---

## 9. VERIFICATION CHECKLIST

### Pre-Launch Verification ✓

- [ ] PostgreSQL running on server laptop
  - [ ] Database "portal" created
  - [ ] User "portal_user" created with permissions
  - [ ] Connection test successful

- [ ] Git repository cloned to server
  - [ ] Latest commit pulled from GitHub
  - [ ] No uncommitted changes
  - [ ] `.env` file exists (not in Git)

- [ ] Environment variables configured
  - [ ] DATABASE_URL points to server database
  - [ ] RESEND_API_KEY set
  - [ ] JWT_SECRET and JWT_REFRESH_SECRET generated (32+ chars)
  - [ ] APP_BASE_URL and API_BASE_URL set to company domain
  - [ ] NODE_ENV=production

- [ ] Dependencies installed
  - [ ] `pnpm install` completed without errors
  - [ ] All modules loaded

- [ ] Database migrations ran
  - [ ] `pnpm db:migrate` completed
  - [ ] All 12 tables created (users, projects, files, etc.)
  - [ ] Indexes created

- [ ] Backend built successfully
  - [ ] `pnpm build` completed
  - [ ] `dist/` folder contains compiled code
  - [ ] No TypeScript errors

- [ ] Frontend built successfully
  - [ ] `pnpm build` completed
  - [ ] `.next/` folder created
  - [ ] No build errors

- [ ] Services running
  - [ ] API server listening on port 4000
  - [ ] Frontend server listening on port 3000
  - [ ] Cloudflared tunnel connected

- [ ] Cloudflare tunnel configured
  - [ ] Tunnel created and authenticated
  - [ ] DNS records (CNAME) added
  - [ ] External domain resolves
  - [ ] HTTPS certificate valid

- [ ] Email service tested
  - [ ] Resend API key valid
  - [ ] Test email sent successfully
  - [ ] Email received in inbox

- [ ] Functionality tested
  - [ ] Admin login works
  - [ ] BD agent login works
  - [ ] Engineer login works
  - [ ] New employee setup works
  - [ ] Project submission works
  - [ ] Email notifications received
  - [ ] Logo displays in UI
  - [ ] Project assignment works
  - [ ] RFI workflow works
  - [ ] File upload works

- [ ] Local network access
  - [ ] Can access from other company machine: `http://192.168.1.50:3000`
  - [ ] Can access API: `http://192.168.1.50:4000/api/auth/login`

- [ ] Remote access via Cloudflare
  - [ ] Can access from outside company network: `https://ace-portal.company.com`
  - [ ] HTTPS working (no security warnings)
  - [ ] Login works from remote

- [ ] Database backup configured
  - [ ] Backup script created
  - [ ] Manual backup tested
  - [ ] Task Scheduler job created for automated backups

- [ ] Logs configured
  - [ ] Log files created in `C:\Logs\`
  - [ ] Can view error logs
  - [ ] PM2/cloudflared logging working

- [ ] Security verified
  - [ ] `.env` file permissions restricted
  - [ ] No secrets in Git repository
  - [ ] JWT secrets secure
  - [ ] Firewall allows only necessary ports

---

## 10. TROUBLESHOOTING GUIDE

### Issue: Cannot Connect to Database

```powershell
# Check PostgreSQL running
Get-Service postgresql-x64-16 | Select-Object Status

# If stopped, start it
Start-Service postgresql-x64-16

# Test connection
psql -U portal_user -h 127.0.0.1 -d portal -p 5432

# If connection refused:
# 1. Check DATABASE_URL in .env
# 2. Verify password is correct
# 3. Check PostgreSQL listening on port 5432:
netstat -ano | findstr :5432

# If port not open, restart PostgreSQL service
```

### Issue: API Not Starting

```powershell
# Check for port conflicts
netstat -ano | findstr :4000

# If port 4000 in use, kill process
Get-Process -Id <PID> | Stop-Process -Force

# Check .env file
Get-Content apps/api/.env | Select-String -Pattern "DATABASE_URL|JWT_SECRET"

# If NODE_ENV not set correctly
$env:NODE_ENV = "production"

# Rebuild and start
cd apps/api
pnpm build
pnpm start:prod

# Check logs for errors
Get-Content dist/main.js | head -20
```

### Issue: Frontend Not Loading

```powershell
# Check Next.js process
Get-Process | Where-Object {$_.Name -like "*node*"} | Select-Object Name, Id, CommandLine

# Check .env.local
Get-Content apps/web/.env.local

# Verify API_URL is correct
$env:NEXT_PUBLIC_API_URL = "http://localhost:4000/api"

# Rebuild frontend
cd apps/web
rm -r .next node_modules
pnpm install
pnpm build
pnpm start
```

### Issue: Cloudflare Tunnel Not Connecting

```powershell
# Check cloudflared service status
Get-Service cloudflared

# If stopped
Start-Service cloudflared

# Check logs
Get-Content "C:\Logs\cloudflared.log" -Tail 50

# Verify config file
Get-Content "C:\Program Files\cloudflared\config.yml"

# Test connection manually
cloudflared tunnel run ace-portal-tunnel-uuid

# If connection fails, re-authenticate
cloudflared tunnel login
```

### Issue: Emails Not Sending

```powershell
# Check Resend API key
Get-Content apps/api/.env | Select-String "RESEND_API_KEY"

# Test with curl
$header = @{
    "Authorization" = "Bearer re_YOUR_API_KEY"
    "Content-Type" = "application/json"
}
$body = @{
    "from" = "noreply@aceservices.com"
    "to" = "test@company.com"
    "subject" = "Test"
    "text" = "Test email"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://api.resend.com/emails" `
  -Method POST `
  -Headers $header `
  -Body $body

# Check email service logs in API
# API logs should show: "Sending email to test@company.com"
```

### Issue: Login Fails with "Invalid Credentials"

```powershell
# Check admin user exists in database
psql -U portal_user -h 127.0.0.1 -d portal

# In psql:
SELECT id, email, full_name, is_active FROM users WHERE email='admin@aceservices.com';

# If not found, insert test user:
INSERT INTO users (id, email, full_name, password_hash, role, is_active)
VALUES (
  gen_random_uuid(),
  'admin@aceservices.com',
  'Administrator',
  '$2a$12$...hash...', -- bcrypt hash of password
  'ADMIN'::user_role,
  true
);

# Better: Use admin user creation endpoint via API
```

### Issue: Logo Not Showing

```powershell
# Check logo file exists
Get-ChildItem apps/web/public/ace-logo.png

# Check file permissions
(Get-ItemProperty apps/web/public/ace-logo.png).Mode

# Check path in AppShell.tsx
Get-Content apps/web/components/layout/AppShell.tsx | Select-String "ace-logo"

# Rebuild and clear cache
cd apps/web
rm -r .next
pnpm build
pnpm start

# Hard refresh browser: Ctrl+Shift+R
```

---

## 11. DAILY OPERATIONS & MAINTENANCE

### 11.1 Daily Startup (Server Powers Down at Night)

```powershell
# 1. Boot server laptop
# 2. PostgreSQL service auto-starts (if configured)
# 3. PM2 auto-starts API (if configured)
# 4. Check services:
pm2 status
pm2 logs ACE-API
Get-Service cloudflared | Select-Object Status

# 5. Test access:
Invoke-WebRequest -Uri "http://localhost:3000"
Invoke-WebRequest -Uri "https://ace-portal.company.com"
```

### 11.2 Daily Shutdown

```powershell
# Graceful shutdown
pm2 stop ace-portal
pm2 stop ACE-API

# Or full shutdown
pm2 delete ace-portal
pm2 delete ACE-API

# Stop cloudflared
Stop-Service cloudflared

# Shutdown server
shutdown /s /t 60  # Shutdown in 60 seconds
```

### 11.3 Monitor Performance

```powershell
# Check disk space
Get-PSDrive C | Select-Object Name, Used, Free

# Check memory
(Get-WmiObject -Class Win32_LogicalMemoryConfiguration | Select-Object TotalPhysicalMemory) / 1024 /1024

# Database size
# In psql:
SELECT pg_database.datname, pg_size_pretty(pg_database_size(pg_database.datname)) 
FROM pg_database 
WHERE datname = 'portal';

# Check database growth over time
SELECT 
  datname,
  TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI') as checked_at,
  pg_size_pretty(pg_database_size(pg_database.datname)) as size
FROM pg_database 
WHERE datname = 'portal';
```

### 11.4 Health Check Script

**File: `C:\Scripts\health-check.ps1`**

```powershell
$results = @()

# Check Services
$api_health = if ((Get-Service cloudflared).Status -eq "Running") { "✓" } else { "✗" }
$db_health = if ((Get-Service postgresql-x64-16).Status -eq "Running") { "✓" } else { "✗" }

# Check Ports
$api_port = if (Test-NetConnection -ComputerName localhost -Port 4000 -ErrorAction Ignore) { "✓" } else { "✗" }
$web_port = if (Test-NetConnection -ComputerName localhost -Port 3000 -ErrorAction Ignore) { "✓" } else { "✗" }

# Check Disk Space
$disk_free = (Get-PSDrive C).Free / 1GB
$disk_status = if ($disk_free -gt 10) { "✓" } else { "✗" }

# Report
Write-Host "ACE Portal Health Check - $(Get-Date)"
Write-Host "Cloudflared Service: $api_health"
Write-Host "PostgreSQL Service: $db_health"
Write-Host "API Port 4000: $api_port"
Write-Host "Web Port 3000: $web_port"
Write-Host "Disk Space (Free): $([math]::Round($disk_free, 2)) GB $disk_status"

# Send alert if issues
if ($api_health -eq "✗" -or $db_health -eq "✗") {
  Send-MailMessage -From "server@company.com" `
    -To "admin@company.com" `
    -Subject "⚠ ACE Portal Health Alert" `
    -Body "Service failure detected. Check server immediately." `
    -SmtpServer "smtp.company.com"
}
```

**Schedule Daily:**
```powershell
# Task Scheduler → Create Basic Task
# Trigger: Daily at 6:00 AM
# Action: PowerShell -ExecutionPolicy Bypass -File C:\Scripts\health-check.ps1
```

---

## 12. APPENDIX: QUICK REFERENCE

### API Endpoints for Testing

```
POST   /api/auth/login
POST   /api/auth/refresh
POST   /api/auth/logout
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

POST   /api/projects
GET    /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id/assign

GET    /api/notifications
POST   /api/files/upload-url
POST   /api/files/confirm
```

### Default Test Credentials

```
Admin:
  Email: admin@aceservices.com
  Password: password123
  Role: ADMIN

BD Agent:
  Email: bd@aceservices.com
  Password: password123
  Role: BD_AGENT

Engineer:
  Email: engineer@aceservices.com
  Password: password123
  Role: ESTIMATION_ENGINEER
```

### Important File Locations

```
Git Repository:     C:\Projects\ace-portal
API:                C:\Projects\ace-portal\apps\api
Frontend:           C:\Projects\ace-portal\apps\web
Database:           C:\Program Files\PostgreSQL\16\data
Backups:            C:\Backups\
Logs:               C:\Logs\
Cloudflared Config: C:\Program Files\cloudflared\config.yml
Environment:        C:\Projects\ace-portal\apps\api\.env
Certificates:       %APPDATA%\cloudflared\cert.pem
```

### Emergency Recovery

**If Everything Breaks:**

```powershell
# 1. Stop all services
pm2 delete all
Stop-Service cloudflared
Stop-Service postgresql-x64-16

# 2. Restore from backup
psql -U portal_user -d postgres < C:\Backups\portal_db_latest.sql

# 3. Pull fresh code from Git
cd C:\Projects\ace-portal
git fetch origin
git reset --hard origin/main

# 4. Rebuild everything
pnpm clean
pnpm install
pnpm build

# 5. Start services
pm2 start ecosystem.config.js
Start-Service postgresql-x64-16
Start-Service cloudflared

# 6. Verify
pnpm test
```

---

## FINAL NOTES

✅ **Before Going Live:**
- [ ] Test all features on production environment
- [ ] Verify email delivery to real mailboxes
- [ ] Check external access via Cloudflare
- [ ] Confirm database backups working
- [ ] Brief team on new access URLs
- [ ] Set up support/help contacts
- [ ] Document any custom modifications

✅ **Post-Launch Monitoring:**
- [ ] Monitor server performance first 24 hours
- [ ] Check email delivery rates
- [ ] Monitor user login patterns
- [ ] Review audit logs for suspicious activity
- [ ] Verify all role-based workflows
- [ ] Test failover/recovery procedures

✅ **Team Communication:**
- Update team with new URLs: `https://ace-portal.company.com`
- Send credentials to staff members
- Provide login instructions & troubleshooting
- Schedule onboarding session for new employee setup
- Set up help desk for support issues

---

**Deployment Guide Complete!**

For questions or issues, refer to section 10 (Troubleshooting) or contact your development team.

Last Updated: August 25, 2026
