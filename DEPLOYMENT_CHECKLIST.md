# 🚀 Deployment Checklist for AlgoArena

## Pre-Deployment Checklist

### ✅ Code Quality
- [x] All code is committed to Git
- [x] No console errors or warnings
- [x] All sensitive files are in .gitignore
- [x] Environment variables are properly configured
- [x] No hardcoded URLs or credentials

### ✅ Database Setup
- [ ] MongoDB Atlas account created
- [ ] Database cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (0.0.0.0/0 for all IPs)
- [ ] Connection string obtained
- [ ] Test connection locally

### ✅ Backend (Railway) Setup
- [ ] Railway account created
- [ ] GitHub repository connected
- [ ] New project created in Railway
- [ ] Root directory set to `server`
- [ ] Environment variables added:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (frontend URL)
  - [ ] `PORT=5000`
- [ ] Build command: `npm run build`
- [ ] Start command: `npm start`
- [ ] Health check: `/api/problems`
- [ ] Deploy and test backend URL

### ✅ Frontend (Vercel) Setup
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] New project created in Vercel
- [ ] Root directory set to `client`
- [ ] Build command: `npm run build`
- [ ] Output directory: `build`
- [ ] Environment variables added:
  - [ ] `REACT_APP_API_URL` (Railway backend URL)
  - [ ] `REACT_APP_SOCKET_URL` (Railway backend URL)
- [ ] Deploy and test frontend URL

### ✅ Testing
- [ ] Test registration
- [ ] Test login
- [ ] Test problem submission
- [ ] Test code execution
- [ ] Test duel creation
- [ ] Test duel joining
- [ ] Test admin features (if applicable)
- [ ] Test on mobile device
- [ ] Test on different browsers

### ✅ Security
- [ ] JWT_SECRET is strong and unique
- [ ] MongoDB password is strong
- [ ] CORS is properly configured
- [ ] No sensitive data in code
- [ ] Environment variables are secure
- [ ] HTTPS is enabled (automatic on Railway/Vercel)

### ✅ Documentation
- [ ] README.md is updated
- [ ] DEPLOYMENT.md is updated
- [ ] Environment variables documented
- [ ] API endpoints documented

## Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy Backend (Railway)
1. Go to Railway dashboard
2. Create new project
3. Connect GitHub repository
4. Set root directory to `server`
5. Add environment variables
6. Deploy

### Step 3: Deploy Frontend (Vercel)
1. Go to Vercel dashboard
2. Create new project
3. Connect GitHub repository
4. Set root directory to `client`
5. Add environment variables (use Railway backend URL)
6. Deploy

### Step 4: Update Environment Variables
1. Update `CORS_ORIGIN` in Railway to Vercel frontend URL
2. Update `REACT_APP_API_URL` in Vercel to Railway backend URL
3. Redeploy both services

### Step 5: Test Deployment
1. Test all features
2. Check logs for errors
3. Monitor performance
4. Test on different devices

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (optional)
- [ ] Set up analytics (optional)
- [ ] Monitor server logs
- [ ] Monitor database usage
- [ ] Set up alerts for downtime

### Maintenance
- [ ] Regular backups of database
- [ ] Update dependencies regularly
- [ ] Monitor security updates
- [ ] Review and update documentation

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Check `CORS_ORIGIN` in Railway
   - Ensure frontend URL matches exactly
   - Check browser console for errors

2. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist
   - Verify database user permissions
   - Check Railway logs for connection errors

3. **Build Failures**
   - Check build logs in Railway/Vercel
   - Verify all dependencies are in package.json
   - Check for TypeScript errors
   - Verify build commands are correct

4. **Socket.io Connection Issues**
   - Verify Socket.io URL in frontend
   - Check backend is running
   - Verify CORS settings
   - Check network connectivity

5. **Environment Variables Not Working**
   - Verify variable names are correct
   - Check for typos
   - Ensure variables are set in deployment platform
   - Redeploy after changing variables

## Useful Commands

### Local Development
```bash
# Install dependencies
npm run install-all

# Start both server and client
npm start

# Start server only
npm run server

# Start client only
npm run client
```

### Production Build
```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

### Git Commands
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Your message"

# Push to GitHub
git push origin main
```

## Support

If you encounter issues:
1. Check the logs in Railway/Vercel
2. Verify all environment variables are set
3. Test locally first
4. Check browser console for errors
5. Review the deployment documentation

## Success Criteria

- [ ] Application is accessible via public URL
- [ ] All features work correctly
- [ ] No console errors
- [ ] Database is connected
- [ ] Socket.io is working
- [ ] Authentication works
- [ ] Code execution works
- [ ] Duels work correctly
- [ ] Admin features work (if applicable)

