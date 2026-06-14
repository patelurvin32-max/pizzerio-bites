# MongoDB Atlas Setup Guide

This guide will help you set up a MongoDB Atlas cluster for your Pizzerio Bites application.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account using your email or GitHub
4. Verify your email address

## Step 2: Create a New Cluster

1. After logging in, click "Build a Database"
2. Choose the **M0** (Free) plan:
   - 512 MB storage
   - Shared RAM
   - No credit card required
3. Select a cloud provider (AWS, GCP, or Azure)
4. Choose a region closest to your users
5. Name your cluster (e.g., `pizzerio-bites-cluster`)
6. Click "Create"

## Step 3: Create Database User

1. Once the cluster is created, click "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose authentication method: "Password"
4. Enter username: `pizzerio-admin` (or your preferred username)
5. Enter a strong password (save this securely - you'll need it for the connection string)
6. Select "Built-in Role" → `Read and write to any database`
7. Click "Add User"

## Step 4: Configure Network Access

1. Click "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Choose "Allow Access from Anywhere" (0.0.0.0/0) for development
   - For production, add specific IP addresses or use VPC peering
4. Click "Confirm"

## Step 5: Get Connection String

1. Click "Database" in the left sidebar
2. Click "Connect" button on your cluster
3. Choose "Connect your application"
4. Select driver: **Node.js** and version: **4.1 or later**
5. Copy the connection string

The connection string will look like:
```
mongodb+srv://pizzerio-admin:<password>@pizzerio-bites-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<password>` with your actual database user password.

## Step 6: Add Connection String to Environment Variables

Add the connection string to your `.env` file:

```env
MONGODB_URI=mongodb+srv://pizzerio-admin:YOUR_PASSWORD@pizzerio-bites-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 7: Test Connection

Run your server locally to test the connection:

```bash
cd server
npm start
```

If successful, you should see "MongoDB connected" in the console.

## Important Notes

- **Security**: Never commit your MongoDB connection string to version control
- **Production**: For production, consider:
  - Using a paid cluster for better performance
  - Setting up IP whitelisting instead of allowing all IPs
  - Enabling encryption at rest
  - Setting up automated backups
- **Monitoring**: Use MongoDB Atlas dashboard to monitor:
  - Cluster performance
  - Storage usage
  - Connection counts
  - Slow queries

## Troubleshooting

**Connection Timeout:**
- Check your IP whitelist in Network Access
- Verify your connection string is correct
- Ensure your cluster is running (not paused)

**Authentication Failed:**
- Verify username and password are correct
- Check that the user has the correct permissions
- Ensure you're using the correct database name

**Cluster Paused:**
- Free clusters pause after inactivity
- Click "Resume" in the MongoDB Atlas dashboard
