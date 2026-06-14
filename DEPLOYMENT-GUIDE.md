# Pizzerio Bites Deployment Guide

This guide will help you deploy your Pizzerio Bites application to production using:
- **Vercel** - Frontend (React application)
- **Render.com** - Backend API (Express.js server)
- **MongoDB Atlas** - Database

## Prerequisites

- GitHub account with your project pushed to a repository
- MongoDB Atlas account (free tier available)
- Render.com account (free tier available)
- Vercel account (free tier available)

## Deployment Order

1. MongoDB Atlas (Database)
2. Render.com (API)
3. Vercel (Frontend)

---

## Step 1: Set Up MongoDB Atlas Database

Follow the detailed instructions in [MONGODB-ATLAS-SETUP.md](./MONGODB-ATLAS-SETUP.md)

**Quick Summary:**
1. Create a free MongoDB Atlas account
2. Create an M0 free cluster
3. Create a database user with read/write permissions
4. Configure network access (allow all IPs for development)
5. Copy your connection string

**Save your connection string** - you'll need it for Render deployment:
```
mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

---

## Step 2: Deploy API to Render.com

### 2.1 Prepare Your Code

Ensure your server is ready for production:

```bash
# Update server package.json if needed
cd server
npm install
```

### 2.2 Deploy to Render

1. Go to [Render.com](https://render.com) and sign up/login
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Select the `pizzerio-bites` repository
5. Configure the service:

   **Build & Deploy Settings:**
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Runtime**: Node (latest)

   **Environment Variables:**
   Add the following environment variables:
   
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-here
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ENABLE_DEFAULT_SEED=false
   ```

6. Click "Create Web Service"
7. Wait for the deployment to complete (2-5 minutes)
8. Copy your API URL (e.g., `https://pizzerio-bites-api.onrender.com`)

**Note:** Render free tier spins down after 15 minutes of inactivity. The first request after spin-down may take 30-60 seconds.

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update API URL in Client

Before deploying, update your client to use the production API URL:

1. Open `client/src` and find where API calls are made
2. Replace `http://localhost:5000` with your Render API URL
3. Update environment variables if using `.env` in client

### 3.2 Deploy to Vercel

1. Go to [Vercel.com](https://vercel.com) and sign up/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure the project:

   **Framework Preset:** Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

   **Environment Variables:**
   Add if your client uses environment variables:
   ```
   VITE_API_URL=https://your-render-api.onrender.com
   ```

5. Click "Deploy"
6. Wait for deployment to complete (1-2 minutes)
7. Copy your Vercel URL (e.g., `https://pizzerio-bites.vercel.app`)

### 3.3 Update CORS Settings

After deploying, update your Render environment variable:
- Go to Render dashboard → your service → Environment
- Update `FRONTEND_URL` to your Vercel URL
- Redeploy the service

---

## Step 4: Post-Deployment Configuration

### 4.1 Test Your Deployment

1. Visit your Vercel URL
2. Test user registration/login
3. Create a test order
4. Check that images upload correctly (if using Cloudinary)
5. Verify all features work as expected

### 4.2 Monitor Your Services

**MongoDB Atlas:**
- Monitor cluster performance
- Check storage usage (512MB limit on free tier)
- Set up alerts for high CPU/memory

**Render:**
- Monitor service health
- Check logs for errors
- Review response times

**Vercel:**
- Monitor build status
- Check analytics
- Review deployment logs

---

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/...` |
| `JWT_SECRET` | Secret key for JWT tokens | `random-secret-string-123` |
| `PORT` | Server port | `10000` |
| `NODE_ENV` | Environment | `production` |

### Optional Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `my-cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc123def456` |
| `FRONTEND_URL` | Frontend URL for CORS | `https://myapp.vercel.app` |
| `ENABLE_DEFAULT_SEED` | Enable default menu items | `false` |

---

## Troubleshooting

### Common Issues

**API not responding:**
- Check Render logs for errors
- Verify MongoDB connection string is correct
- Ensure MongoDB cluster is running (not paused)
- Check environment variables are set correctly

**CORS errors:**
- Verify `FRONTEND_URL` matches your Vercel URL exactly
- Check CORS configuration in `server/app.js`
- Ensure API is accessible from your frontend domain

**Images not uploading:**
- Verify Cloudinary credentials are correct
- Check Cloudinary account has available credits
- Review upload limits in Cloudinary dashboard

**Database connection failed:**
- Verify MongoDB connection string format
- Check IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions
- Verify cluster is not paused

### Getting Help

- Render Dashboard: Check logs and deployment history
- Vercel Dashboard: Check build logs and deployment status
- MongoDB Atlas: Check metrics and logs
- GitHub Issues: Check for known issues

---

## Cost Summary (Free Tiers)

| Service | Free Tier Limit | Cost if Exceeded |
|---------|----------------|------------------|
| MongoDB Atlas | 512MB storage | ~$9/month for 2GB |
| Render.com | 750 hours/month | ~$7/month for basic |
| Vercel | 100GB bandwidth | ~$20/month for Pro |

**Total Free Tier Cost:** $0/month
**Estimated Production Cost:** ~$15-36/month

---

## Security Best Practices

1. **Never commit** `.env` files to version control
2. Use strong, unique passwords for all services
3. Enable 2FA on all accounts (MongoDB, Render, Vercel)
4. Rotate JWT secrets regularly
5. Use IP whitelisting for MongoDB in production
6. Enable SSL/TLS on all connections
7. Monitor logs for suspicious activity
8. Keep dependencies updated

---

## Next Steps

After successful deployment:

1. Set up custom domains (optional)
2. Configure SSL certificates (automatic on Vercel/Render)
3. Set up monitoring and alerting
4. Implement automated backups
5. Configure CI/CD pipeline
6. Set up staging environment
7. Add analytics (Google Analytics, etc.)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
