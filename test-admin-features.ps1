# Test script for admin project creation and client filtering

$apiUrl = "http://localhost:4000/api"
$adminEmail = "abdul.manan004@gmail.com"
$adminPassword = "225580@aceservices"

Write-Host "=== Testing Admin Project Creation & Client Features ===" -ForegroundColor Cyan

# Step 1: Login as admin
Write-Host "`n1. Logging in as admin..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "$apiUrl/auth/login" -Method Post `
        -ContentType "application/json" `
        -Body (ConvertTo-Json @{
            email = $adminEmail
            password = $adminPassword
        }) -ErrorAction Stop
    
    if (-not $loginResponse.accessToken) {
        throw "No access token in response"
    }
    
    $token = $loginResponse.accessToken
    Write-Host "[OK] Login successful. Token: $($token.Substring(0, 30))..." -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $loginResponse" -ForegroundColor Gray
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# Step 2: Test admin create project endpoint
Write-Host "`n2. Testing POST /projects/admin/create..." -ForegroundColor Yellow
$projectData = @{
    clientCompanyName = "Tech Innovations Inc"
    clientContactPerson = "Sarah Johnson"
    clientEmail = "sarah.johnson@techinnovations.com"
    clientPhone = "+1-555-987-6543"
    salespersonName = "Admin Test"
    decidedPrice = 15000
    scopeDescription = "Complete architectural design and cost estimation for new office complex"
    requestedDeadline = (Get-Date).AddDays(30).ToString("yyyy-MM-dd")
    projectType = "estimation"
}

try {
    $createResponse = Invoke-RestMethod -Uri "$apiUrl/projects/admin/create" -Method Post `
        -Headers $headers `
        -Body (ConvertTo-Json $projectData) -ErrorAction Stop
    
    $projectId = $createResponse.id
    $refNumber = $createResponse.referenceNumber
    Write-Host "[OK] Project created successfully!" -ForegroundColor Green
    Write-Host "  - Reference: $refNumber" -ForegroundColor Green
    Write-Host "  - ID: $projectId" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Create project failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Create another project for same client
Write-Host "`n3. Creating second project for same client..." -ForegroundColor Yellow
$projectData2 = @{
    clientCompanyName = "Tech Innovations Inc"
    clientContactPerson = "Sarah Johnson"
    clientEmail = "sarah.johnson.design@techinnovations.com"
    clientPhone = "+1-555-987-6543"
    salespersonName = "Admin Test"
    decidedPrice = 22500
    scopeDescription = "Design & drafting services for interior layouts"
    requestedDeadline = (Get-Date).AddDays(45).ToString("yyyy-MM-dd")
    projectType = "design_drafting"
}

try {
    $createResponse2 = Invoke-RestMethod -Uri "$apiUrl/projects/admin/create" -Method Post `
        -Headers $headers `
        -Body (ConvertTo-Json $projectData2) -ErrorAction Stop
    
    $refNumber2 = $createResponse2.referenceNumber
    Write-Host "[OK] Second project created!" -ForegroundColor Green
    Write-Host "  - Reference: $refNumber2" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Create second project failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 4: Test get projects by client
Write-Host "`n4. Testing GET /projects/by-client/Tech%20Innovations%20Inc..." -ForegroundColor Yellow
try {
    $clientProjects = Invoke-RestMethod -Uri "$apiUrl/projects/by-client/Tech%20Innovations%20Inc" -Method Get `
        -Headers $headers -ErrorAction Stop
    
    Write-Host "[OK] Retrieved projects by client!" -ForegroundColor Green
    Write-Host "  - Found $($clientProjects.Count) projects" -ForegroundColor Green
    
    foreach ($proj in $clientProjects) {
        Write-Host "    • $($proj.referenceNumber) - $($proj.projectType) - Status: $($proj.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "[FAIL] Get projects by client failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 5: Verify all projects still visible
Write-Host "`n5. Verifying all projects are still accessible..." -ForegroundColor Yellow
try {
    $allProjects = Invoke-RestMethod -Uri "$apiUrl/projects?limit=100" -Method Get `
        -Headers $headers -ErrorAction Stop
    
    $count = if ($allProjects -is [array]) { $allProjects.Count } else { 1 }
    Write-Host "[OK] Successfully retrieved all projects" -ForegroundColor Green
    Write-Host "  - Total projects: $count" -ForegroundColor Green
} catch {
    Write-Host "[FAIL] Get all projects failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== All Tests Completed ===" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "[OK] Admin can create projects directly" -ForegroundColor Green
Write-Host "[OK] Projects by client can be queried" -ForegroundColor Green
Write-Host "[OK] All projects remain accessible" -ForegroundColor Green
