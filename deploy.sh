#!/bin/bash

echo "🚀 AlgoArena Deployment Script"
echo "=============================="

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "❌ Git repository not found. Please initialize git first:"
    echo "   git init"
    echo "   git add ."
    echo "   git commit -m 'Initial commit'"
    echo "   git remote add origin <your-github-repo-url>"
    exit 1
fi

# Check if all changes are committed
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have uncommitted changes. Please commit them first:"
    echo "   git add ."
    echo "   git commit -m 'Prepare for deployment'"
    exit 1
fi

echo "✅ Git repository is clean"

# Push to GitHub
echo "📤 Pushing to GitHub..."
git push origin main

echo ""
echo "🎉 Code pushed to GitHub successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Deploy backend to Railway:"
echo "   - Go to https://railway.app"
echo "   - Create new project from GitHub repo"
echo "   - Set root directory to 'server'"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "2. Deploy frontend to Vercel:"
echo "   - Go to https://vercel.com"
echo "   - Create new project from GitHub repo"
echo "   - Set root directory to 'client'"
echo "   - Add environment variables (see DEPLOYMENT.md)"
echo ""
echo "3. Configure domain:"
echo "   - Purchase algoarena.com"
echo "   - Configure DNS records"
echo "   - Update environment variables"
echo ""
echo "📖 See DEPLOYMENT.md for detailed instructions" 