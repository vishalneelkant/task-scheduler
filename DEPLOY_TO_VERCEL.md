# 🚀 Deploy to Vercel from GitHub - Step by Step Guide

Complete guide to deploy your Task Scheduler application to Vercel from GitHub.

---

## 📋 Prerequisites

Before starting, ensure you have:
- ✅ A GitHub account
- ✅ A Vercel account (free tier works)
- ✅ Your project code ready to push to GitHub
- ✅ Python 3.8+ installed locally (for database migration)

---

## Step 1: Push Your Code to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
cd "/Users/vishanee/Task scheduler"

# Initialize git (if not already initialized)
git init

# Add all files
git add .

# Commit your code
git commit -m "Initial commit - Ready for Vercel deployment"
```

### 1.2 Create GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click the **"+"** icon in the top right → **"New repository"**
3. Repository name: `task-scheduler` (or your preferred name)
4. Description: "Task Scheduler - Productivity App"
5. Choose **Public** or **Private**
6. **DO NOT** initialize with README, .gitignore, or license (you already have these)
7. Click **"Create repository"**

### 1.3 Push Code to GitHub

GitHub will show you commands. Use these:

```bash
# Add remote repository (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/task-scheduler.git

# Rename main branch if needed
git branch -M main

# Push your code
git push -u origin main
```

**Verify**: Go to your GitHub repository page and confirm all files are uploaded.

---

## Step 2: Set Up PostgreSQL Database

You have two options for the database:

### Option A: Vercel Postgres (Recommended - Easiest)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on **"Storage"** in the left sidebar
3. Click **"Create Database"**
4. Select **"Postgres"**
5. Choose a name: `task-scheduler-db`
6. Select a region (closest to your users)
7. Click **"Create"**
8. **Important**: Copy the `POSTGRES_URL` - you'll need this in Step 4

### Option B: External PostgreSQL (Supabase, Neon, etc.)

#### Using Supabase (Free Tier):

1. Go to [Supabase](https://supabase.com) and sign up
2. Click **"New Project"**
3. Fill in:
   - Project name: `task-scheduler`
   - Database password: (generate a strong password)
   - Region: Choose closest to you
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup
6. Go to **Settings** → **Database**
7. Find **"Connection string"** → **"URI"**
8. Copy the connection string (starts with `postgresql://...`)

#### Using Neon (Free Tier):

1. Go to [Neon](https://neon.tech) and sign up
2. Click **"Create a project"**
3. Project name: `task-scheduler`
4. Click **"Create project"**
5. Copy the connection string from the dashboard

---

## Step 3: Generate JWT Secret Key

Generate a secure JWT secret key:

```bash
# On macOS/Linux
python3 -c "import secrets; print(secrets.token_hex(32))"

# On Windows
python -c "import secrets; print(secrets.token_hex(32))"
```

**Copy the output** - you'll need this in Step 4.

Example output: `a1b2c3d4e5f6...` (64 characters)

---

## Step 4: Deploy to Vercel

### 4.1 Import Project from GitHub

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Click **"Import Git Repository"**
4. Find your `task-scheduler` repository
5. Click **"Import"**

### 4.2 Configure Project

Vercel will auto-detect your project. Verify these settings:

- **Framework Preset**: Leave as default (Vercel will detect it)
- **Root Directory**: `./` (root of repository)
- **Build Command**: (auto-detected)
- **Output Directory**: (auto-detected)

**Click "Deploy"** (we'll add environment variables after)

### 4.3 Add Environment Variables

After the first deployment (it will fail without env vars, that's OK):

1. Go to your project in Vercel Dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"** in the left sidebar
4. Add these three variables:

#### Variable 1: DATABASE_URL
- **Name**: `DATABASE_URL`
- **Value**: 
  - If using Vercel Postgres: Use the `POSTGRES_URL` from Step 2
  - If using external: Paste your connection string
- **Environment**: Select **Production**, **Preview**, and **Development**
- Click **"Save"**

#### Variable 2: JWT_SECRET_KEY
- **Name**: `JWT_SECRET_KEY`
- **Value**: Paste the secret key from Step 3
- **Environment**: Select **Production**, **Preview**, and **Development**
- Click **"Save"**

#### Variable 3: FRONTEND_URL
- **Name**: `FRONTEND_URL`
- **Value**: 
  - For now, use `*` (allows all origins)
  - After deployment, update with your Vercel URL: `https://your-app.vercel.app`
- **Environment**: Select **Production**, **Preview**, and **Development**
- Click **"Save"**

### 4.4 Redeploy

1. Go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Select **"Use existing Build Cache"** (optional)
5. Click **"Redeploy"**

Wait for deployment to complete (2-3 minutes).

---

## Step 5: Initialize Database

After deployment, you need to create the database tables.

### 5.1 Get Your Database URL

If using **Vercel Postgres**:
1. Go to Vercel Dashboard → **Storage**
2. Click on your database
3. Go to **".env.local"** tab
4. Copy the `POSTGRES_URL` value

If using **external database**: Use the connection string you saved earlier.

### 5.2 Run Migration Script Locally

```bash
# Navigate to your project
cd "/Users/vishanee/Task scheduler"

# Set the database URL (replace with your actual URL)
export DATABASE_URL="postgresql://user:password@host:port/database"

# Navigate to api directory
cd api

# Run migration script
python3 migrate_postgres.py
```

**Expected output:**
```
🔄 Starting database migration...
Database URL: postgresql://...
✅ Database tables created successfully!

📋 Created tables: user, task, pomodoro_session

🎉 Database initialization complete!
Your Pomodoro database is ready to use.
```

### 5.3 Verify Database Tables

You can verify tables were created using:
- **Vercel Postgres**: Dashboard → Storage → Your DB → Tables
- **Supabase**: Dashboard → Table Editor
- **Neon**: Dashboard → SQL Editor → Run `SELECT * FROM information_schema.tables;`

---

## Step 6: Update FRONTEND_URL (Optional but Recommended)

After deployment, update the `FRONTEND_URL` environment variable:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Find `FRONTEND_URL`
3. Click **"Edit"**
4. Change value to: `https://your-app.vercel.app` (replace with your actual Vercel URL)
5. Click **"Save"**
6. **Redeploy** the project (Deployments → ... → Redeploy)

---

## Step 7: Verify Deployment

### 7.1 Test Health Endpoint

Open in browser:
```
https://your-app.vercel.app/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "database": "postgresql"
}
```

### 7.2 Test Frontend

Open in browser:
```
https://your-app.vercel.app
```

You should see:
- ✅ Login page loads
- ✅ Can register a new user
- ✅ Can login
- ✅ Can create tasks
- ✅ Analytics work

### 7.3 Test API Endpoints

Test registration:
```bash
curl -X POST https://your-app.vercel.app/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123"}'
```

---

## Step 8: Set Up Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → **Settings** → **Domains**
2. Enter your domain name
3. Follow Vercel's instructions to add DNS records
4. Wait for DNS propagation (5-30 minutes)

---

## 🔧 Troubleshooting

### Issue: Build Fails

**Solution:**
- Check build logs in Vercel Dashboard
- Verify `vercel.json` is in root directory
- Ensure `api/requirements.txt` exists
- Check that `frontend/package.json` has `vercel-build` script

### Issue: Database Connection Error

**Solution:**
- Verify `DATABASE_URL` is set correctly in Environment Variables
- Check if database allows connections from Vercel IPs
- Ensure SSL is enabled (add `?sslmode=require` to connection string if needed)
- Verify database is running and accessible

### Issue: CORS Errors

**Solution:**
- Update `FRONTEND_URL` environment variable with your actual Vercel URL
- Redeploy after updating environment variables
- Check browser console for specific CORS error

### Issue: Tables Not Created

**Solution:**
- Run `migrate_postgres.py` script locally with correct `DATABASE_URL`
- Check database connection string format
- Verify you have write permissions on the database

### Issue: Function Timeout

**Solution:**
- Current timeout is 30 seconds (configured in `vercel.json`)
- For longer operations, consider optimizing queries
- Check Vercel logs for slow queries

### Issue: 404 on Routes

**Solution:**
- Verify `vercel.json` routes are correct
- Ensure frontend build completed successfully
- Check that routes match your API endpoints

---

## 📊 Monitoring & Logs

### View Logs

1. Go to Vercel Dashboard → Your Project
2. Click **"Deployments"** tab
3. Click on a deployment
4. Click **"Functions"** tab to see serverless function logs
5. Click **"Runtime Logs"** for real-time logs

### Monitor Performance

- Vercel Dashboard shows:
  - Request count
  - Response times
  - Error rates
  - Function invocations

---

## 🔄 Updating Your Deployment

When you push new code to GitHub:

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Your update message"
   git push origin main
   ```

2. **Vercel Auto-Deploys:**
   - Vercel automatically detects the push
   - Creates a new deployment
   - Deploys to production (if main branch)

3. **Preview Deployments:**
   - Pull requests get preview deployments
   - Test changes before merging

---

## 📝 Quick Reference

### Environment Variables Needed:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `FRONTEND_URL` - Your Vercel app URL (or `*`)

### Important Files:
- `vercel.json` - Vercel configuration
- `api/index.py` - Flask serverless function
- `api/requirements.txt` - Python dependencies
- `api/migrate_postgres.py` - Database migration script

### Key URLs:
- Vercel Dashboard: https://vercel.com/dashboard
- Health Check: `https://your-app.vercel.app/api/health`
- Your App: `https://your-app.vercel.app`

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL database created
- [ ] JWT secret key generated
- [ ] Project imported to Vercel
- [ ] Environment variables added
- [ ] First deployment completed
- [ ] Database tables initialized
- [ ] Health endpoint tested
- [ ] Frontend loads correctly
- [ ] User registration works
- [ ] Tasks can be created
- [ ] Analytics work

---

## 🎉 Success!

Your Task Scheduler is now live on Vercel! 

**Next Steps:**
- Share your app URL with users
- Monitor performance in Vercel Dashboard
- Set up custom domain (optional)
- Configure analytics (optional)

---

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Python Runtime](https://vercel.com/docs/functions/runtimes/python)
- [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)
- [Flask on Vercel](https://vercel.com/guides/deploying-flask-with-vercel)

---

**Need Help?** Check the troubleshooting section or Vercel's support documentation.

