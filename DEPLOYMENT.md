# 🚀 AlgoArena Deployment Guide

This guide will help you deploy AlgoArena to make it accessible as `algoarena.com` on any device.

## 📋 Prerequisites

1. **GitHub Account** - For version control
2. **Vercel Account** - For frontend deployment (free tier available)
3. **Railway Account** - For backend deployment (free tier available)
4. **MongoDB Atlas Account** - For cloud database (free tier available)
5. **Domain Name** - `algoarena.com` (purchase from any registrar)

## 🗄️ Step 1: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account
   - Create a new cluster (M0 Free tier)

2. **Configure Database**
   - Create a database user with read/write permissions
   - Get your connection string
   - Add your IP address to the whitelist (or use 0.0.0.0/0 for all IPs)

3. **Connection String Format**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/algoarena
   ```

## 🔧 Step 2: Deploy Backend to Railway

1. **Push Code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

2. **Deploy to Railway**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your AlgoArena repository
   - Set the root directory to `server`

3. **Configure Environment Variables**
   In Railway dashboard, add these environment variables:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/algoarena
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=production
   CORS_ORIGIN=https://algoarena.com
   PORT=5000
   ```

4. **Deploy**
   - Railway will automatically build and deploy your backend
   - Note the generated URL (e.g., `https://algoarena-backend.railway.app`)

## 🌐 Step 3: Deploy Frontend to Vercel

1. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign up with GitHub
   - Click "New Project" → "Import Git Repository"
   - Select your AlgoArena repository
   - Set the root directory to `client`

2. **Configure Environment Variables**
   In Vercel dashboard, add these environment variables:
   ```
   REACT_APP_API_URL=https://algoarena-backend.railway.app
   REACT_APP_SOCKET_URL=https://algoarena-backend.railway.app
   ```

3. **Deploy**
   - Vercel will automatically build and deploy your frontend
   - Note the generated URL (e.g., `https://algoarena.vercel.app`)

## 🌍 Step 4: Configure Domain

1. **Purchase Domain**
   - Buy `algoarena.com` from any domain registrar (Namecheap, GoDaddy, etc.)

2. **Configure DNS**
   - Add a CNAME record:
     - **Name**: `@` or leave empty
     - **Value**: `algoarena.vercel.app`
   - Add another CNAME record for API:
     - **Name**: `api`
     - **Value**: `algoarena-backend.railway.app`

3. **Configure Vercel Domain**
   - In Vercel dashboard, go to your project settings
   - Add custom domain: `algoarena.com`
   - Follow the DNS configuration instructions

4. **Update Environment Variables**
   - Update `CORS_ORIGIN` in Railway to: `https://algoarena.com`
   - Update `REACT_APP_API_URL` in Vercel to: `https://api.algoarena.com`
   - Update `REACT_APP_SOCKET_URL` in Vercel to: `https://api.algoarena.com`

## 🔒 Step 5: Security & SSL

1. **SSL Certificates**
   - Vercel and Railway provide free SSL certificates automatically
   - Your site will be accessible via `https://algoarena.com`

2. **Environment Security**
   - Use strong, unique JWT secrets
   - Never commit `.env` files to Git
   - Use environment variables for all sensitive data

## 📱 Step 6: Test Your Deployment

1. **Test Frontend**
   - Visit `https://algoarena.com`
   - Test registration, login, and all features

2. **Test Backend**
   - Test API endpoints via `https://api.algoarena.com/api/problems`
   - Test Socket.io connections

3. **Test Duel Feature**
   - Create a duel room
   - Share room ID with another device
   - Test real-time coding battles

## 🔄 Step 7: Continuous Deployment

1. **Automatic Deployments**
   - Both Vercel and Railway will automatically redeploy when you push to GitHub
   - No manual intervention needed for updates

2. **Environment Management**
   - Use different environment variables for development and production
   - Test changes in development before pushing to production

## 📊 Step 8: Monitoring & Analytics

1. **Vercel Analytics**
   - Enable Vercel Analytics for performance monitoring
   - Track user engagement and performance

2. **Railway Monitoring**
   - Monitor backend performance and logs
   - Set up alerts for downtime

## 🛠️ Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` includes your domain
   - Check that frontend and backend URLs match

2. **Socket.io Connection Issues**
   - Verify Socket.io URL in frontend config
   - Check that backend is running and accessible

3. **Database Connection Issues**
   - Verify MongoDB Atlas connection string
   - Check IP whitelist in MongoDB Atlas

4. **Domain Not Working**
   - DNS propagation can take up to 48 hours
   - Verify DNS records are correct
   - Check domain configuration in Vercel

## 📞 Support

If you encounter issues:
1. Check the logs in Railway and Vercel dashboards
2. Verify all environment variables are set correctly
3. Test locally first to isolate issues
4. Check the browser console for frontend errors

## 🎉 Success!

Once deployed, your AlgoArena will be accessible at:
- **Frontend**: `https://algoarena.com`
- **Backend API**: `https://api.algoarena.com`
- **Socket.io**: `https://api.algoarena.com`

Users can now access your competitive coding platform from any device worldwide! 🚀 