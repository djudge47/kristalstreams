# Netlify Deployment Guide for Kristal Streams

## Method 1: Drag & Drop (Easiest - No Git Required)

### Step 1: Build Your Project

The project is already built! The `dist` folder contains your production-ready files.

### Step 2: Deploy to Netlify

1. **Go to Netlify**
   - Visit https://app.netlify.com/drop
   - Or sign up at https://www.netlify.com and go to "Sites"

2. **Drag & Drop**
   - Simply drag the `dist` folder from your project
   - Drop it onto the Netlify drop zone
   - Netlify will deploy immediately!

3. **Get Your Site URL**
   - You'll receive a random URL like `random-name-123456.netlify.app`
   - Your site is now live!

### Step 3: Configure Custom Domain

1. **In Netlify Dashboard**
   - Click on your site
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Enter `kristalstream.com`
   - Click "Verify"

2. **Update DNS in GoDaddy**
   - Follow the DNS instructions in `DOMAIN_SETUP.md`
   - Wait 1-24 hours for DNS propagation

3. **Enable HTTPS**
   - Netlify will automatically provision SSL certificate
   - Enable "Force HTTPS" once certificate is ready

---

## Method 2: Connect Git Repository (Recommended for Updates)

### Step 1: Push to Git

If you haven't already, push your code to GitHub, GitLab, or Bitbucket:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/kristal-streams.git

# Push
git push -u origin main
```

### Step 2: Import to Netlify

1. **Sign in to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"

2. **Connect Git Provider**
   - Choose GitHub, GitLab, or Bitbucket
   - Authorize Netlify to access your repositories
   - Select your Kristal Streams repository

3. **Configure Build Settings**
   - **Branch to deploy**: `main` (or your default branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Click "Deploy site"

### Step 3: Add Environment Variables

1. **In Netlify Dashboard**
   - Go to "Site settings" → "Environment variables"
   - Add the following:

```
VITE_SUPABASE_URL = your_supabase_url
VITE_SUPABASE_ANON_KEY = your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY = your_stripe_key (if using Stripe)
VITE_EMAILJS_SERVICE_ID = your_emailjs_service_id (if using EmailJS)
VITE_EMAILJS_TEMPLATE_ID = your_emailjs_template_id
VITE_EMAILJS_PUBLIC_KEY = your_emailjs_public_key
```

2. **Redeploy**
   - Go to "Deploys"
   - Click "Trigger deploy" → "Deploy site"

---

## Method 3: Netlify CLI (For Advanced Users)

### Step 1: Install Netlify CLI

```bash
npm install -g netlify-cli
```

### Step 2: Login to Netlify

```bash
netlify login
```

### Step 3: Initialize Site

```bash
# From your project directory
netlify init
```

Follow the prompts:
- Create & configure a new site
- Choose your team
- Site name: `kristal-streams` (or your preferred name)

### Step 4: Deploy

```bash
# Deploy to production
netlify deploy --prod
```

---

## After Deployment Checklist

### 1. Update Supabase Settings

Go to your Supabase Dashboard:

1. **Update Site URL**
   - Project Settings → API
   - Site URL: `https://your-site.netlify.app` (or your custom domain)

2. **Add Redirect URLs**
   - Authentication → URL Configuration
   - Add redirect URLs:
     - `https://your-site.netlify.app/auth/callback`
     - `https://kristalstream.com/auth/callback` (if using custom domain)
     - `https://www.kristalstream.com/auth/callback`

3. **Update CORS Origins**
   - Add allowed origins:
     - `https://your-site.netlify.app`
     - `https://kristalstream.com`
     - `https://www.kristalstream.com`

### 2. Test Your Deployment

Visit your site and test:
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Authentication (login/register)
- [ ] PWA installation
- [ ] All pages render properly
- [ ] SSL certificate is active (padlock in browser)

### 3. Connect Custom Domain

Follow the instructions in `DOMAIN_SETUP.md` to connect `kristalstream.com`

---

## Troubleshooting

### Build Fails
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set

### Environment Variables Not Working
- Must start with `VITE_` for Vite projects
- Redeploy after adding variables
- Check variable names match exactly

### Site Shows 404 Errors
- Ensure `netlify.toml` is in the root directory
- Check that redirects are configured
- Verify publish directory is `dist`

### PWA Not Working
- Ensure `manifest.json` and `sw.js` are in `public` folder
- Check service worker registration in browser DevTools
- Clear browser cache and try again

---

## Continuous Deployment (Git Method Only)

Once connected via Git, Netlify automatically deploys when you push changes:

```bash
# Make changes to your code
git add .
git commit -m "Update feature"
git push

# Netlify automatically builds and deploys!
```

---

## Netlify Features You Can Use

- **Forms**: Add `netlify` attribute to forms for serverless form handling
- **Functions**: Create serverless functions in `netlify/functions/`
- **Split Testing**: A/B test different versions
- **Analytics**: Track visitors (paid feature)
- **Identity**: Built-in authentication (alternative to Supabase Auth)

---

## Need Help?

- **Netlify Docs**: https://docs.netlify.com
- **Netlify Support**: https://answers.netlify.com
- **Status Page**: https://www.netlifystatus.com

---

## Quick Reference

**Your Project Structure:**
```
kristal-streams/
├── dist/                 ← Drag & drop this folder
├── netlify.toml         ← Configuration file
├── package.json
├── vite.config.ts
└── src/
```

**Build Command**: `npm run build`
**Publish Directory**: `dist`
**Node Version**: 18

---

## Recommended Next Steps

1. Deploy using drag & drop method (fastest)
2. Test the site thoroughly
3. Connect your custom domain kristalstream.com
4. Set up continuous deployment via Git (optional but recommended)
5. Enable HTTPS and force HTTPS redirect

Your site will be live in minutes!
