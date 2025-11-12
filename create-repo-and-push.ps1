# PowerShell script to create GitHub repository and push code
# This script helps you push to Atul-Kumar-Git account

Write-Host "=== AlgoArena GitHub Repository Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if GitHub CLI is installed
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "GitHub CLI found! Creating repository..." -ForegroundColor Green
    Write-Host ""
    
    # Check if logged in
    $ghAuth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Please login to GitHub CLI first:" -ForegroundColor Yellow
        Write-Host "  gh auth login" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Then run this script again." -ForegroundColor Yellow
        exit 1
    }
    
    # Create repository
    Write-Host "Creating repository: Atul-Kumar-Git/algoarena" -ForegroundColor Cyan
    gh repo create Atul-Kumar-Git/algoarena --public --description "A competitive coding platform" --source=. --remote=origin --push
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "Repository created and code pushed successfully!" -ForegroundColor Green
        Write-Host "Repository URL: https://github.com/Atul-Kumar-Git/algoarena" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "Error creating repository. Please check:" -ForegroundColor Red
        Write-Host "1. You have access to Atul-Kumar-Git account" -ForegroundColor Yellow
        Write-Host "2. Repository doesn't already exist" -ForegroundColor Yellow
        Write-Host "3. You're logged in with correct account" -ForegroundColor Yellow
    }
} else {
    Write-Host "GitHub CLI not found. Please use manual method:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Create repository manually on GitHub:" -ForegroundColor Cyan
    Write-Host "   https://github.com/new" -ForegroundColor White
    Write-Host "   Owner: Atul-Kumar-Git" -ForegroundColor White
    Write-Host "   Repository name: algoarena" -ForegroundColor White
    Write-Host "   Description: A competitive coding platform" -ForegroundColor White
    Write-Host "   DO NOT initialize with README" -ForegroundColor Red
    Write-Host ""
    Write-Host "2. After creating, run these commands:" -ForegroundColor Cyan
    Write-Host "   git remote set-url origin https://github.com/Atul-Kumar-Git/algoarena.git" -ForegroundColor White
    Write-Host "   git push -u origin main" -ForegroundColor White
    Write-Host ""
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan

