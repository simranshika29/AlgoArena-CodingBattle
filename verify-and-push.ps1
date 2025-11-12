# PowerShell script to verify setup and push to GitHub
# This script helps you push to Atul-Kumar-Git account

Write-Host "=== AlgoArena GitHub Push Script ===" -ForegroundColor Cyan
Write-Host ""

# Check remote configuration
Write-Host "Checking remote configuration..." -ForegroundColor Yellow
$remote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Remote URL: $remote" -ForegroundColor Green
    if ($remote -like "*Atul-Kumar-Git*") {
        Write-Host "✓ Remote is correctly set to Atul-Kumar-Git" -ForegroundColor Green
    } else {
        Write-Host "✗ Remote is not set to Atul-Kumar-Git" -ForegroundColor Red
        Write-Host "Updating remote..." -ForegroundColor Yellow
        git remote set-url origin https://github.com/Atul-Kumar-Git/algoarena.git
        Write-Host "✓ Remote updated" -ForegroundColor Green
    }
} else {
    Write-Host "✗ No remote configured" -ForegroundColor Red
    Write-Host "Adding remote..." -ForegroundColor Yellow
    git remote add origin https://github.com/Atul-Kumar-Git/algoarena.git
    Write-Host "✓ Remote added" -ForegroundColor Green
}

Write-Host ""
Write-Host "Checking git status..." -ForegroundColor Yellow
git status --short

Write-Host ""
Write-Host "Current branch:" -ForegroundColor Yellow
git branch --show-current

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. CREATE REPOSITORY ON GITHUB:" -ForegroundColor Yellow
Write-Host "   Go to: https://github.com/new" -ForegroundColor White
Write-Host "   - Owner: Atul-Kumar-Git" -ForegroundColor White
Write-Host "   - Repository name: algoarena" -ForegroundColor White
Write-Host "   - Description: A competitive coding platform" -ForegroundColor White
Write-Host "   - DO NOT initialize with README/gitignore/license" -ForegroundColor Red
Write-Host "   - Click 'Create repository'" -ForegroundColor White
Write-Host ""
Write-Host "2. PUSH CODE:" -ForegroundColor Yellow
Write-Host "   Run: git push -u origin main" -ForegroundColor White
Write-Host ""
Write-Host "3. IF AUTHENTICATION REQUIRED:" -ForegroundColor Yellow
Write-Host "   - Create Personal Access Token: https://github.com/settings/tokens" -ForegroundColor White
Write-Host "   - Use token as password when pushing" -ForegroundColor White
Write-Host ""
Write-Host "4. VERIFY:" -ForegroundColor Yellow
Write-Host "   Check: https://github.com/Atul-Kumar-Git/algoarena" -ForegroundColor White
Write-Host ""

# Ask if user wants to try pushing now
$response = Read-Host "Do you want to try pushing now? (y/n)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host ""
    Write-Host "Attempting to push..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Successfully pushed to GitHub!" -ForegroundColor Green
        Write-Host "Repository URL: https://github.com/Atul-Kumar-Git/algoarena" -ForegroundColor Cyan
    } else {
        Write-Host ""
        Write-Host "✗ Push failed. Common reasons:" -ForegroundColor Red
        Write-Host "  1. Repository doesn't exist - Create it first on GitHub" -ForegroundColor Yellow
        Write-Host "  2. Authentication failed - Create Personal Access Token" -ForegroundColor Yellow
        Write-Host "  3. Permission denied - Check account access" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "See QUICK_SETUP.md for detailed instructions." -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "Run 'git push -u origin main' after creating the repository on GitHub." -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=== Script Complete ===" -ForegroundColor Cyan

