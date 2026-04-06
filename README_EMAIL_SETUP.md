# 📧 EmailJS Integration Setup Guide

This project uses **EmailJS** - a free email service that allows sending emails directly from the frontend without a backend server.

## 🚀 Quick Setup (5 minutes)

### 1. Create EmailJS Account
1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a **FREE** account (200 emails/month)
3. Verify your email address

### 2. Create Email Service
1. In EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider:
   - **Gmail** (recommended for testing)
   - **Outlook/Hotmail**
   - **Yahoo**
   - **Custom SMTP**
4. Follow the setup wizard
5. **Copy the Service ID** (e.g., `service_abc123`)

### 3. Create Email Templates

#### Template 1: Contact Form
1. Go to **Email Templates** → **Create New Template**
2. **Template Name**: `Contact Form`
3. **Template Content**:
```html
Subject: New Contact Form Submission - {{subject}}

From: {{from_name}} <{{from_email}}>
Reply-To: {{reply_to}}

Message:
{{message}}

---
Sent from Kristal Streams website
```
4. **Copy the Template ID** (e.g., `template_contact123`)

#### Template 2: Support Ticket
1. Create another template: `Support Ticket`
2. **Template Content**:
```html
Subject: [{{priority}}] Support Ticket - {{subject}}

From: {{user_name}} <{{user_email}}>
Category: {{category}}
Priority: {{priority}}

Message:
{{message}}

---
Reply to: {{reply_to}}
```
3. **Copy the Template ID** (e.g., `template_support123`)

#### Template 3: Welcome Email
1. Create template: `Welcome Email`
2. **Template Content**:
```html
Subject: Welcome to {{company_name}}!

Hi {{user_name}},

Welcome to Kristal Streams! Your {{subscription_plan}} is now active.

Getting Started:
- Download our apps
- Browse 18,000+ channels
- Contact support: {{support_email}}

Enjoy streaming!

Best regards,
The Kristal Streams Team
```
3. **Copy the Template ID** (e.g., `template_welcome123`)

### 4. Get Public Key
1. Go to **Account** → **General**
2. Find **Public Key** section
3. **Copy the Public Key** (e.g., `user_abc123xyz`)

### 5. Update Environment Variables
Update your `.env` file:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_abc123
VITE_EMAILJS_TEMPLATE_ID=template_contact123
VITE_EMAILJS_PUBLIC_KEY=user_abc123xyz
VITE_EMAILJS_SUPPORT_TEMPLATE_ID=template_support123
VITE_EMAILJS_WELCOME_TEMPLATE_ID=template_welcome123
VITE_EMAILJS_RESET_TEMPLATE_ID=template_reset123
```

## 🎯 Features Included

### ✅ Contact Forms
- **Support page contact form**
- **General contact form**
- **Rate limiting** (5 emails per minute)
- **Email validation**
- **Success/error feedback**

### ✅ Newsletter Signup
- **Footer newsletter**
- **Support page newsletter**
- **Compact and full versions**
- **Confirmation emails**

### ✅ User Emails
- **Welcome emails** for new registrations
- **Password reset emails**
- **Support ticket notifications**

### ✅ Email Management
- **Rate limiting** to prevent spam
- **Email validation**
- **Status tracking**
- **Error handling**

## 🔧 Customization

### Change Email Recipients
Edit `src/lib/emailjs.ts`:
```typescript
// Change support email
to_email: 'your-support@yourdomain.com'
```

### Add New Email Templates
1. Create template in EmailJS dashboard
2. Add template ID to `.env`
3. Create new function in `emailjs.ts`

### Modify Rate Limits
```typescript
// In emailjs.ts
private readonly maxAttempts = 10; // Change from 5 to 10
private readonly timeWindow = 120000; // Change to 2 minutes
```

## 📊 Usage Limits (Free Plan)

- **200 emails/month** (FREE)
- **Upgrade to 1,000 emails/month** for $15/month
- **No daily limits**
- **All features included**

## 🛠️ Testing

1. **Start the development server**:
```bash
npm run dev
```

2. **Test contact form**:
   - Go to `/support`
   - Fill out contact form
   - Check your email inbox

3. **Test newsletter**:
   - Scroll to footer
   - Enter email in newsletter signup
   - Check for confirmation email

## 🚨 Troubleshooting

### Emails Not Sending
1. **Check console** for error messages
2. **Verify environment variables** are correct
3. **Check EmailJS dashboard** for failed sends
4. **Ensure email service** is properly connected

### Rate Limiting Issues
- **Wait 1 minute** between test emails
- **Use different email addresses** for testing
- **Check browser console** for rate limit messages

### Template Errors
- **Verify template IDs** match exactly
- **Check template variables** ({{variable_name}})
- **Test templates** in EmailJS dashboard

## 🎉 You're All Set!

Your website now has a complete email system that's:
- ✅ **Free to use** (200 emails/month)
- ✅ **No backend required**
- ✅ **Professional looking**
- ✅ **Spam protected**
- ✅ **Mobile responsive**

Need help? Check the [EmailJS Documentation](https://www.emailjs.com/docs/) or contact support!