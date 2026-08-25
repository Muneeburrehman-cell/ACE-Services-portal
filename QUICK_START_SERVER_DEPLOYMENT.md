# ACE Portal — Quick Start Server Deployment (30 Minutes)
**For IT Teams: Copy & Paste Ready Commands**

---

## PHASE 1: PREREQUISITES (5 min)

### Install Required Software

```powershell
# 1. Git (if not installed)
winget install Git.Git

# 2. Node.js LTS v20/v22
winget install OpenJS.NodeJS.LTS

# 3. pnpm (package manager)
npm install -g pnpm@latest

# 4. PostgreSQL 15+
# Download from https://www.postgresql.org/download/windows/
# Run installer with these settings:
#   - Super user password: [STRONG_PASSWORD]
#   - Port: 5432
#   - Check "Install as Windows Service"

# 5. Cloudflared (optional, for remote access)
choco install cloudflared -y
# OR download from https://github.com/cloudflare/cloudflared/releases
```

### Verify Installations

```powershell
git --version
node --version
pnpm --version
psql --version
cloudflared --version
```

---

## PHASE 2: DATABASE SETUP (5 min)

```powershell
# 1. Connect to PostgreSQL as admin
psql -U postgres -h 127.0.0.1 -p 5432

# 2. In psql console, run these commands:
CREATE DATABASE portal;
CREATE USER portal_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_123';
GRANT ALL PRIVILEGES ON DATABASE portal TO portal_user;
\q

# 3. Verify connection as portal_user
psql -U portal_user -h 127.0.0.1 -d portal -p 5432
# (Enter password when prompted)
\dt
# (Should show empty list initially)
\q
```

---

## PHASE 3: CLONE & SETUP (5 min)

```powershell
# 1. Create projects directory
mkdir C:\Projects
cd C:\Projects

# 2. Clone repository (replace with your GitHub URL)
git clone https://github.com/YOUR_USERNAME/ace-portal.git
cd ace-portal

# 3. Install dependencies
pnpm install

# 4. Create .env file for API
$envContent = @"
DATABASE_URL=postgresql://portal_user:YOUR_STRONG_PASSWORD_123@127.0.0.1:5432/portal
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_REFRESH_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CF_ACCOUNT_ID=demo
CF_R2_ACCESS_KEY_ID=demo
CF_R2_SECRET_ACCESS_KEY=demo
CF_R2_BUCKET=demo-local
RESEND_API_KEY=re_YOUR_API_KEY_HERE
RESEND_FROM_EMAIL=noreply@aceservices.com
APP_BASE_URL=http://192.168.1.50:3000
API_BASE_URL=http://192.168.1.50:4000
ADMIN_EMAIL=admin@aceservices.com
COMPANY_NAME=ACE SERVICES
NODE_ENV=production
"@

Set-Content -Path apps/api/.env -Value $envContent

# 5. Create .env.local for frontend
Set-Content -Path apps/web/.env.local -Value 'NEXT_PUBLIC_API_URL=http://192.168.1.50:4000/api'
```

---

## PHASE 4: DATABASE MIGRATIONS (3 min)

```powershell
cd C:\Projects\ace-portal\apps\api

# 1. Run migrations
pnpm db:migrate

# 2. Verify schema created
pnpm prisma studio
# Opens browser at http://localhost:5555
# Check all 12 tables exist, then close
```

---

## PHASE 5: BUILD & START (7 min)

```powershell
cd C:\Projects\ace-portal

# 1. Build backend
cd apps/api
pnpm build

# 2. Build frontend
cd ..\web
pnpm build

# 3. Start API (Terminal 1)
cd ..\api
$env:NODE_ENV = "production"
pnpm start:prod
# Output: "Listening on port 4000"

# 4. Start Frontend (Terminal 2, new PowerShell window)
cd C:\Projects\ace-portal\apps\web
pnpm start
# Output: "started server on 0.0.0.0:3000"
```

---

## PHASE 6: VERIFICATION (2 min)

```powershell
# 1. Test API health (Terminal 3)
$response = Invoke-WebRequest -Uri "http://localhost:4000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body '{"email":"test","password":"test"}' `
  -ErrorAction SilentlyContinue

Write-Host "API Status: $($response.StatusCode)"
# Output: 401 (expected - invalid credentials)

# 2. Test Frontend
Start-Process "http://localhost:3000"
# Should load login page with 4 role buttons

# 3. Test login
# Click "Administrator"
# Email: admin@aceservices.com
# Password: password123
# Should redirect to admin dashboard
```

---

## PHASE 7: OPTIONAL - CLOUDFLARE REMOTE ACCESS (5 min)

```powershell
# 1. Authenticate cloudflared
cloudflared tunnel login
# Browser opens → Log in to Cloudflare account

# 2. Create tunnel config file
$configPath = "C:\Program Files\cloudflared\config.yml"
$configContent = @"
tunnel: YOUR_TUNNEL_UUID
credentials-file: %APPDATA%\.cloudflared\YOUR_TUNNEL_UUID.json

ingress:
  - hostname: ace-api.YOUR_COMPANY.com
    service: http://localhost:4000
  - hostname: ace-portal.YOUR_COMPANY.com
    service: http://localhost:3000
  - service: http_status:404

loglevel: info
logfile: C:\Logs\cloudflared.log
"@

Set-Content -Path $configPath -Value $configContent

# 3. Install as Windows Service
cloudflared service install `
  --config $configPath `
  --logfile "C:\Logs\cloudflared.log"

# 4. Start service
cloudflared service start

# 5. Check logs
Get-Content "C:\Logs\cloudflared.log" -Tail 10
```

---

## QUICK TEST CHECKLIST

After deployment, test these:

```
☐ Admin Login Works
  Email: admin@aceservices.com
  Password: password123

☐ BD Agent Dashboard
  Email: bd@aceservices.com
  Password: password123

☐ Engineer Dashboard
  Email: engineer@aceservices.com
  Password: password123

☐ Logo Displays Correctly
  - Sidebar: ✓
  - Top navigation: ✓
  - Login page: ✓

☐ New Employee Setup Works
  - Go to /setup
  - Enter: newtest@company.com
  - Create user first (via API or admin panel)
  - Setup email should be sent (check console in demo mode)

☐ Project Workflow
  - BD Agent: Submit project
  - Admin: Assign to engineer
  - Engineer: Mark in progress → delivered
  - Admin: Send to client
  - Check emails sent

☐ Local Access Works
  http://192.168.1.50:3000

☐ Remote Access Works (if Cloudflare)
  https://ace-portal.company.com
```

---

## TROUBLESHOOTING

### API Won't Start
```powershell
# Check if port 4000 in use
netstat -ano | findstr :4000

# Kill process if needed
Get-Process -Id <PID> | Stop-Process -Force

# Verify .env has DATABASE_URL
Get-Content apps/api/.env | Select-String DATABASE_URL
```

### Frontend Won't Load
```powershell
# Check .env.local
Get-Content apps/web/.env.local

# Verify NEXT_PUBLIC_API_URL is correct
# Should be: http://192.168.1.50:4000/api
```

### Database Connection Failed
```powershell
# Test PostgreSQL connection
psql -U portal_user -h 127.0.0.1 -d portal

# Check DATABASE_URL password
Get-Content apps/api/.env | Select-String DATABASE_URL
```

### Emails Not Sending (Demo Mode)
```powershell
# In demo mode, emails log to console
# Check API terminal for: "Email content:..."

# To use real Resend:
# 1. Get API key from https://resend.com/
# 2. Update RESEND_API_KEY in .env
# 3. Restart API
```

---

## DAILY STARTUP

```powershell
# Morning (when starting server)
$env:NODE_ENV = "production"

# Terminal 1: API
cd C:\Projects\ace-portal\apps\api
pnpm start:prod

# Terminal 2: Frontend
cd C:\Projects\ace-portal\apps\web
pnpm start

# Terminal 3: Verify (optional)
curl http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d "{}"
# Should get 400 (bad request) or 401 (unauthorized)

# Terminal 4: Monitor (optional)
Get-Process | Where-Object {$_.Name -like "*node*"} | Format-Table Name, Id, WorkingSet
```

## DAILY SHUTDOWN

```powershell
# Evening (when stopping server)
# Terminal 1-2: Press Ctrl+C
# Database: Auto-saves, no action needed
# Cloudflared: Keep running or stop with:
Stop-Service cloudflared
```

---

## PRODUCTION HARDENING (After Initial Testing)

```powershell
# 1. Remove test credentials from .env
#    Add real Resend API key
#    Add real domain URLs
#    Use strong JWT secrets

# 2. Set up automated backups
#    Add backup script to Task Scheduler
#    Run daily at 2:00 AM

# 3. Enable Windows Firewall
#    Allow only ports 3000, 4000
#    Restrict to company IP ranges

# 4. Set up log rotation
#    Monthly archive of logs to external drive

# 5. Schedule health checks
#    Create PowerShell script
#    Run hourly to monitor services

# 6. Document access URLs
#    Internal: http://192.168.1.50:3000
#    Remote: https://ace-portal.company.com
#    Send to team

# 7. Set up admin monitoring
#    Email alerts if services down
#    Dashboard for audit logs
```

---

## REFERENCE

**Default Test Credentials:**
```
Admin:     admin@aceservices.com / password123
BD Agent:  bd@aceservices.com / password123
Engineer:  engineer@aceservices.com / password123
```

**Important Ports:**
- API: 4000
- Frontend: 3000
- PostgreSQL: 5432
- Cloudflared Tunnel: Auto (443/HTTPS)

**Important Files:**
- API Config: `C:\Projects\ace-portal\apps\api\.env`
- Frontend Config: `C:\Projects\ace-portal\apps\web\.env.local`
- Cloudflared Config: `C:\Program Files\cloudflared\config.yml`
- Logs: `C:\Logs\`
- Database: PostgreSQL data folder

**Useful Commands:**
```powershell
# View API logs
Get-Content C:\Logs\api-out.log -Tail 20

# View cloudflared logs
Get-Content C:\Logs\cloudflared.log -Tail 20

# Database backup
pg_dump -U portal_user -h 127.0.0.1 -d portal > backup.sql

# Restart all services
Stop-Service postgresql-x64-16
Start-Service postgresql-x64-16
Stop-Service cloudflared
Start-Service cloudflared
```

---

**Estimated Total Time: 25-30 minutes**

**Status After Completion: ✅ PRODUCTION READY**

---

**For detailed information, see:**
- DEPLOYMENT_GUIDE.md — Full deployment guide
- TESTING_SUMMARY_REPORT.md — Complete testing report
- FEATURE_CHECKLIST_FOR_VERIFICATION.md — Feature verification
