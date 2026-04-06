# Deployment Instructions for Kristal Streams

## Current Build Status
✅ **Build completed successfully** - dist/ folder is ready for deployment

## Environment Variables Required

Add these to your Netlify deployment:

```
VITE_SUPABASE_URL=https://lawqyijrfxnlwqyzvebw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxhd3F5aWpyZnhubHdxeXp2ZWJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzOTE5NzYsImV4cCI6MjA3NTk2Nzk3Nn0.yhzkkQXwh5mnZ894N4lZYLo7IoMLFhPMIONJoCXgt4k
```

## Deploying to Netlify

### Option 1: Deploy from Git (Recommended)

1. Push this code to a GitHub repository
2. In Netlify, click "Add new site" → "Import an existing project"
3. Connect to your GitHub repo
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Add the environment variables above in Site settings → Environment variables
6. Deploy!

### Option 2: Manual Deploy

1. Drag and drop the `dist/` folder directly to Netlify
   - Go to https://app.netlify.com/drop
   - Drag the entire `dist` folder
2. After deployment, go to Site settings → Environment variables
3. Add the environment variables listed above
4. Trigger a redeploy from the Deploys tab

### Option 3: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

## What's Included

- ✅ React + TypeScript + Vite
- ✅ Supabase authentication & database
- ✅ 10 pricing tiers with Stripe integration
- ✅ Client dashboard with support tickets
- ✅ Channel management & EPG
- ✅ AI chat support
- ✅ Progressive Web App (PWA) features
- ✅ Responsive design

## After Deployment

1. Test authentication (login/register)
2. Verify Supabase connection
3. Test a pricing plan checkout flow
4. Check support ticket creation

## Troubleshooting

**Black screen after deployment?**
- Environment variables are missing or incorrect
- Go to Netlify Site settings → Environment variables
- Add both VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Trigger a new deploy

**Build fails?**
- Make sure Node.js version is 18 or higher
- In Netlify: Site settings → Build & deploy → Environment → Node version: `18`
