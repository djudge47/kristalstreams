# 📧 EmailJS Templates - Copy & Paste Ready

Follow these instructions to create all email templates in EmailJS. Each template is ready to copy and paste exactly as shown.

---

## Template 1: Contact Form

### Steps:
1. Go to EmailJS Dashboard → **Email Templates**
2. Click **"Create New Template"**
3. Copy and paste the content below

### Template Settings:
- **Template Name**: `Contact Form`

### Email Subject:
```
New Contact Form - {{subject}}
```

### Email Content:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #e50914; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Kristal Streams</h1>
    <p style="color: white; margin: 5px 0 0 0;">New Contact Form Submission</p>
  </div>

  <div style="background-color: white; padding: 30px; margin-top: 20px; border-radius: 8px;">
    <h2 style="color: #333; margin-top: 0;">Contact Details</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Name:</td>
        <td style="padding: 10px 0; color: #333;">{{from_name}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
        <td style="padding: 10px 0; color: #333;">{{from_email}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Subject:</td>
        <td style="padding: 10px 0; color: #333;">{{subject}}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
      <h3 style="color: #333; margin-bottom: 10px;">Message:</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; color: #333; line-height: 1.6;">
        {{message}}
      </div>
    </div>

    <div style="margin-top: 30px; padding: 15px; background-color: #f0f0f0; border-radius: 5px;">
      <p style="margin: 0; color: #666; font-size: 14px;">
        <strong>Reply To:</strong> <a href="mailto:{{reply_to}}" style="color: #e50914;">{{reply_to}}</a>
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">Sent from Kristal Streams Contact Form</p>
    <p style="margin: 5px 0 0 0;">© 2024 Kristal Streams. All rights reserved.</p>
  </div>
</div>
```

### Reply To:
```
{{reply_to}}
```

---

## Template 2: Support Ticket

### Steps:
1. Click **"Create New Template"** again
2. Copy and paste the content below

### Template Settings:
- **Template Name**: `Support Ticket`

### Email Subject:
```
[{{priority}}] Support Ticket - {{subject}}
```

### Email Content:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #e50914; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Kristal Streams Support</h1>
    <p style="color: white; margin: 5px 0 0 0;">New Support Ticket</p>
  </div>

  <div style="background-color: white; padding: 30px; margin-top: 20px; border-radius: 8px;">
    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
      <p style="margin: 0; color: #856404; font-weight: bold;">Priority: {{priority}}</p>
    </div>

    <h2 style="color: #333; margin-top: 0;">Ticket Information</h2>

    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666; width: 30%;">Customer:</td>
        <td style="padding: 10px 0; color: #333;">{{user_name}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Email:</td>
        <td style="padding: 10px 0; color: #333;">{{user_email}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Category:</td>
        <td style="padding: 10px 0; color: #333;">{{category}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Subject:</td>
        <td style="padding: 10px 0; color: #333;">{{subject}}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; font-weight: bold; color: #666;">Priority:</td>
        <td style="padding: 10px 0; color: #333;">{{priority}}</td>
      </tr>
    </table>

    <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
      <h3 style="color: #333; margin-bottom: 10px;">Issue Description:</h3>
      <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; color: #333; line-height: 1.6;">
        {{message}}
      </div>
    </div>

    <div style="margin-top: 30px; padding: 15px; background-color: #e7f3ff; border-left: 4px solid #2196F3; border-radius: 5px;">
      <p style="margin: 0; color: #0d47a1; font-size: 14px;">
        <strong>📧 Reply directly to this email to respond to the customer</strong>
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
    <p style="margin: 0;">Kristal Streams Support System</p>
    <p style="margin: 5px 0 0 0;">© 2024 Kristal Streams. All rights reserved.</p>
  </div>
</div>
```

### Reply To:
```
{{reply_to}}
```

---

## Template 3: Welcome Email

### Steps:
1. Click **"Create New Template"** again
2. Copy and paste the content below

### Template Settings:
- **Template Name**: `Welcome Email`

### Email Subject:
```
Welcome to Kristal Streams! 🎉
```

### Email Content:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #e50914; padding: 40px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 32px;">Welcome to Kristal Streams! 🎉</h1>
    <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">Your premium streaming journey starts now</p>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 18px; color: #333; margin: 0 0 20px 0;">Hi {{user_name}},</p>

    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you for choosing Kristal Streams! Your <strong style="color: #e50914;">{{subscription_plan}}</strong> subscription is now active and ready to use.
    </p>

    <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 30px 0;">
      <h2 style="color: #333; margin: 0 0 20px 0; font-size: 20px;">🚀 Getting Started</h2>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 30px; height: 30px; background-color: #e50914; color: white; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">1</div>
        <span style="color: #333; font-size: 16px;">Browse 500+ live TV channels</span>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 30px; height: 30px; background-color: #e50914; color: white; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">2</div>
        <span style="color: #333; font-size: 16px;">Download apps for all your devices</span>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="display: inline-block; width: 30px; height: 30px; background-color: #e50914; color: white; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">3</div>
        <span style="color: #333; font-size: 16px;">Watch on up to 3 devices simultaneously</span>
      </div>

      <div>
        <div style="display: inline-block; width: 30px; height: 30px; background-color: #e50914; color: white; text-align: center; line-height: 30px; border-radius: 50%; font-weight: bold; margin-right: 10px;">4</div>
        <span style="color: #333; font-size: 16px;">Enjoy HD & 4K streaming quality</span>
      </div>
    </div>

    <div style="background-color: #e7f3ff; padding: 20px; border-left: 4px solid #2196F3; border-radius: 5px; margin: 30px 0;">
      <h3 style="color: #0d47a1; margin: 0 0 10px 0; font-size: 16px;">📱 Download Our Apps</h3>
      <p style="color: #0d47a1; margin: 0; line-height: 1.6;">
        Available on iOS, Android, Fire TV, Apple TV, Smart TVs, and more!<br>
        Visit our website to download.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://kristalstreams.com/channel-list" style="display: inline-block; background-color: #e50914; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Browse Channels</a>
    </div>

    <div style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 30px;">
      <h3 style="color: #333; margin: 0 0 15px 0; font-size: 18px;">Need Help?</h3>
      <p style="color: #666; line-height: 1.6; margin: 0 0 10px 0;">
        Our support team is here 24/7 to help you:
      </p>
      <p style="color: #666; margin: 0;">
        📧 Email: <a href="mailto:{{support_email}}" style="color: #e50914; text-decoration: none;">{{support_email}}</a><br>
        💬 Live Chat: Available on our website<br>
        📚 Help Center: Comprehensive guides and FAQs
      </p>
    </div>

    <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 25px 0; border-left: 4px solid #ffc107;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>Pro Tip:</strong> Install our PWA (Progressive Web App) for the best mobile experience. Just visit our website on your phone and add it to your home screen!
      </p>
    </div>

    <p style="color: #666; line-height: 1.6; margin: 30px 0 0 0;">
      Enjoy your streaming experience!
    </p>

    <p style="color: #666; margin: 10px 0 0 0;">
      Best regards,<br>
      <strong style="color: #333;">The Kristal Streams Team</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">You're receiving this email because you signed up for Kristal Streams.</p>
    <p style="margin: 0;">© 2024 Kristal Streams. All rights reserved.</p>
    <p style="margin: 10px 0 0 0;">
      <a href="https://kristalstreams.com" style="color: #e50914; text-decoration: none;">Visit Website</a> |
      <a href="https://kristalstreams.com/support" style="color: #e50914; text-decoration: none;">Support</a> |
      <a href="https://kristalstreams.com/terms" style="color: #e50914; text-decoration: none;">Terms</a>
    </p>
  </div>
</div>
```

---

## Template 4: Password Reset (Optional)

### Steps:
1. Click **"Create New Template"** again
2. Copy and paste the content below

### Template Settings:
- **Template Name**: `Password Reset`

### Email Subject:
```
Reset Your Kristal Streams Password
```

### Email Content:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #e50914; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset Request</h1>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Hi {{user_name}},</p>

    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
      We received a request to reset your password for your Kristal Streams account. If you didn't make this request, you can safely ignore this email.
    </p>

    <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; border-radius: 5px; margin: 25px 0;">
      <p style="color: #856404; margin: 0; font-size: 14px;">
        <strong>⚠️ Security Notice:</strong> This reset link expires in 1 hour for your protection.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="{{reset_link}}" style="display: inline-block; background-color: #e50914; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Reset Password</a>
    </div>

    <p style="color: #999; font-size: 14px; text-align: center; margin: 20px 0;">
      Or copy and paste this link into your browser:
    </p>
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
      {{reset_link}}
    </div>

    <div style="border-top: 2px solid #f0f0f0; padding-top: 25px; margin-top: 30px;">
      <p style="color: #666; line-height: 1.6; margin: 0;">
        If you didn't request a password reset, please contact our support team immediately at:
      </p>
      <p style="color: #e50914; margin: 10px 0 0 0; font-weight: bold;">
        {{support_email}}
      </p>
    </div>
  </div>

  <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">For security reasons, we never ask for your password via email.</p>
    <p style="margin: 0;">© 2024 Kristal Streams. All rights reserved.</p>
  </div>
</div>
```

---

## Template 5: Newsletter Subscription

### Steps:
1. Click **"Create New Template"** again
2. Copy and paste the content below

### Template Settings:
- **Template Name**: `Newsletter Subscription`

### Email Subject:
```
Thanks for subscribing to Kristal Streams! 📬
```

### Email Content:
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
  <div style="background-color: #e50914; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Thanks for Subscribing! 📬</h1>
  </div>

  <div style="background-color: white; padding: 40px 30px; border-radius: 0 0 8px 8px;">
    <p style="font-size: 16px; color: #333; margin: 0 0 20px 0;">Hi there!</p>

    <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you for subscribing to the Kristal Streams newsletter! You'll now receive:
    </p>

    <div style="background-color: #f9f9f9; padding: 25px; border-radius: 8px; margin: 25px 0;">
      <div style="margin-bottom: 15px;">
        <span style="color: #e50914; font-size: 20px; margin-right: 10px;">✨</span>
        <span style="color: #333; font-size: 16px;">Exclusive streaming tips and tricks</span>
      </div>

      <div style="margin-bottom: 15px;">
        <span style="color: #e50914; font-size: 20px; margin-right: 10px;">🎬</span>
        <span style="color: #333; font-size: 16px;">New channel announcements</span>
      </div>

      <div style="margin-bottom: 15px;">
        <span style="color: #e50914; font-size: 20px; margin-right: 10px;">🎁</span>
        <span style="color: #333; font-size: 16px;">Special promotions and offers</span>
      </div>

      <div>
        <span style="color: #e50914; font-size: 20px; margin-right: 10px;">📺</span>
        <span style="color: #333; font-size: 16px;">Upcoming live events and sports</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://kristalstreams.com" style="display: inline-block; background-color: #e50914; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Visit Kristal Streams</a>
    </div>

    <p style="color: #666; line-height: 1.6; margin: 25px 0 0 0;">
      Looking forward to keeping you entertained!
    </p>

    <p style="color: #666; margin: 10px 0 0 0;">
      Best regards,<br>
      <strong style="color: #333;">The Kristal Streams Team</strong>
    </p>
  </div>

  <div style="text-align: center; padding: 30px 20px; color: #999; font-size: 12px;">
    <p style="margin: 0 0 10px 0;">You can unsubscribe at any time by clicking the link in our emails.</p>
    <p style="margin: 0;">© 2024 Kristal Streams. All rights reserved.</p>
  </div>
</div>
```

---

## ✅ After Creating Templates

### Save Your Template IDs

After creating each template, you'll get a **Template ID** (like `template_abc123xyz`). Save them here:

1. **Contact Form ID**: `_________________`
2. **Support Ticket ID**: `_________________`
3. **Welcome Email ID**: `_________________`
4. **Password Reset ID**: `_________________`
5. **Newsletter ID**: `_________________`

### Update Your .env File

Copy these IDs to your `.env` file:

```env
VITE_EMAILJS_TEMPLATE_ID=your_contact_form_id
VITE_EMAILJS_SUPPORT_TEMPLATE_ID=your_support_ticket_id
VITE_EMAILJS_WELCOME_TEMPLATE_ID=your_welcome_email_id
VITE_EMAILJS_RESET_TEMPLATE_ID=your_password_reset_id
```

---

## 🎨 Customization Tips

### Change Colors
- Replace `#e50914` with your brand color
- Adjust background colors to match your theme

### Add Your Logo
Add this at the top of any template:
```html
<img src="YOUR_LOGO_URL" alt="Logo" style="max-width: 150px; margin-bottom: 20px;">
```

### Modify Content
- All templates are fully customizable
- Keep the `{{variables}}` intact
- Test after making changes

---

## 🧪 Testing

After creating templates:
1. Go to any template in EmailJS
2. Click **"Test It"** button
3. Fill in sample data
4. Send test email to yourself
5. Verify formatting looks good

---

**Ready to use these templates? Just copy and paste each one into EmailJS!** 🚀
