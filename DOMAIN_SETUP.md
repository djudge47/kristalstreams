# Domain Setup Guide: kristalstream.com

This guide will help you connect your kristalstream.com domain from GoDaddy to your application.

## Prerequisites

- GoDaddy account with kristalstream.com domain
- Access to your hosting platform (where your app is deployed)
- Application already deployed and running

## Option 1: Deploy to Netlify (Recommended)

### Step 1: Deploy Your Application to Netlify

1. **Create a Netlify Account**
   - Go to https://www.netlify.com
   - Sign up with GitHub, GitLab, or email

2. **Deploy Your Site**
   - Click "Add new site" → "Import an existing project"
   - Connect your Git repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Click "Deploy site"

3. **Note Your Netlify Domain**
   - After deployment, you'll get a domain like `your-site-name.netlify.app`
   - Keep this handy for the next steps

### Step 2: Configure GoDaddy DNS

1. **Login to GoDaddy**
   - Go to https://www.godaddy.com
   - Navigate to "My Products" → "Domains"
   - Click "DNS" next to kristalstream.com

2. **Add DNS Records**

   **For Root Domain (kristalstream.com):**
   - Type: `A`
   - Name: `@`
   - Value: `75.2.60.5` (Netlify's load balancer)
   - TTL: `600` (10 minutes)

   **For WWW Subdomain:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `your-site-name.netlify.app` (your Netlify domain)
   - TTL: `600`

3. **Save Changes**

### Step 3: Configure Custom Domain in Netlify

1. **Go to Netlify Dashboard**
   - Select your site
   - Go to "Domain management" → "Add custom domain"

2. **Add Your Domain**
   - Enter `kristalstream.com`
   - Click "Verify"
   - Netlify will verify DNS settings (this may take a few minutes)

3. **Enable HTTPS**
   - Netlify will automatically provision a free SSL certificate
   - This takes 1-24 hours to complete
   - Once ready, enable "Force HTTPS"

### Step 4: Update Environment Variables

Update your `.env` file with the production domain:

```
VITE_APP_URL=https://kristalstream.com
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Deploy these changes to Netlify.

---

## Option 2: Deploy to Vercel

### Step 1: Deploy to Vercel

1. **Create a Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub, GitLab, or email

2. **Import Your Project**
   - Click "Add New" → "Project"
   - Import your Git repository
   - Framework preset: Vite
   - Click "Deploy"

3. **Note Your Vercel Domain**
   - After deployment: `your-project.vercel.app`

### Step 2: Configure GoDaddy DNS

1. **Login to GoDaddy**
   - Go to "My Products" → "Domains"
   - Click "DNS" next to kristalstream.com

2. **Add DNS Records**

   **For Root Domain:**
   - Type: `A`
   - Name: `@`
   - Value: `76.76.21.21` (Vercel's IP)
   - TTL: `600`

   **For WWW:**
   - Type: `CNAME`
   - Name: `www`
   - Value: `cname.vercel-dns.com`
   - TTL: `600`

### Step 3: Add Domain in Vercel

1. **Go to Project Settings**
   - Select "Domains"
   - Enter `kristalstream.com`
   - Click "Add"

2. **Verify and Enable HTTPS**
   - Vercel will verify DNS (may take a few minutes)
   - SSL certificate is automatic

---

## Option 3: Use Existing Hosting with GoDaddy

If you're hosting on your own server or another provider:

### Step 1: Get Your Server IP Address

- Contact your hosting provider for the server IP address
- OR find it in your hosting control panel

### Step 2: Configure GoDaddy DNS

1. **Login to GoDaddy**
   - Navigate to DNS management for kristalstream.com

2. **Update A Record**
   - Type: `A`
   - Name: `@`
   - Value: `YOUR_SERVER_IP_ADDRESS`
   - TTL: `600`

3. **Add WWW Record**
   - Type: `CNAME`
   - Name: `www`
   - Value: `kristalstream.com`
   - TTL: `600`

### Step 3: Configure SSL Certificate

You'll need to set up SSL on your server:

1. **Using Let's Encrypt (Free)**
   - Install Certbot on your server
   - Run: `certbot --nginx -d kristalstream.com -d www.kristalstream.com`

2. **Or use GoDaddy SSL**
   - Purchase SSL certificate from GoDaddy
   - Follow their installation guide

---

## Verification Steps

After configuring DNS (allow 24-48 hours for full propagation):

1. **Check DNS Propagation**
   - Visit https://www.whatsmydns.net
   - Enter `kristalstream.com`
   - Verify A or CNAME records are showing correctly worldwide

2. **Test Your Domain**
   - Visit `http://kristalstream.com`
   - Visit `https://kristalstream.com`
   - Visit `http://www.kristalstream.com`
   - Visit `https://www.kristalstream.com`

3. **Verify SSL Certificate**
   - Check for padlock icon in browser
   - Certificate should show as valid

## Update Supabase Configuration

After your domain is live:

1. **Update Supabase Site URL**
   - Go to Supabase Dashboard
   - Project Settings → API
   - Update Site URL to: `https://kristalstream.com`

2. **Update Redirect URLs**
   - Add to allowed redirect URLs:
     - `https://kristalstream.com/auth/callback`
     - `https://www.kristalstream.com/auth/callback`

3. **Update CORS Origins**
   - Add: `https://kristalstream.com`
   - Add: `https://www.kristalstream.com`

## Update PWA Manifest

Update `/public/manifest.json`:

```json
{
  "start_url": "https://kristalstream.com/",
  "scope": "https://kristalstream.com/"
}
```

## Troubleshooting

### Domain Not Loading
- Wait 24-48 hours for DNS propagation
- Clear browser cache
- Check DNS records in GoDaddy

### SSL Certificate Issues
- Ensure HTTPS is enabled in hosting platform
- Wait for certificate provisioning (can take up to 24 hours)
- Check certificate status in hosting dashboard

### Redirect Issues
- Ensure both www and non-www versions work
- Set up redirect from one to the other (usually www → non-www)

### App Not Working After Domain Change
- Update all environment variables with new domain
- Redeploy application
- Check browser console for errors

## Need Help?

- **Netlify**: https://docs.netlify.com/domains-https/custom-domains/
- **Vercel**: https://vercel.com/docs/concepts/projects/custom-domains
- **GoDaddy**: https://www.godaddy.com/help/manage-dns-records-680
- **Let's Encrypt**: https://letsencrypt.org/getting-started/

---

## Recommended Approach

**For fastest setup with minimal technical knowledge:**
1. Deploy to Netlify (free tier available)
2. Follow Option 1 above
3. Netlify handles SSL automatically
4. No server management needed

This will have your site live at kristalstream.com within a few hours!
