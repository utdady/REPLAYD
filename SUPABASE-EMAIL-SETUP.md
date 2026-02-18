# Supabase Email Authorization Setup

Follow these steps to enable email confirmation:

## Step 1: Configure Redirect URLs

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Under **"Redirect URLs"**, add these URLs (one per line):
   ```
   http://localhost:3001
   http://localhost:3001/auth/callback
   http://192.168.1.4:3001
   http://192.168.1.4:3001/auth/callback
   ```
3. Click **"Save"**

**Important:** When you deploy to production, add your production URLs here too.

## Step 2: Set Site URL

1. In the same **URL Configuration** page
2. Set **"Site URL"** to: `http://localhost:3001`
3. Click **"Save"**

## Step 3: Enable Email Confirmation

1. Go to **Authentication** → **Settings**
2. Scroll to **"Email Auth"**
3. Make sure **"Enable email confirmations"** is **ON** (toggle should be green)
4. Click **"Save"**

## Step 4: Configure Email Templates (Optional)

1. Go to **Authentication** → **Email Templates**
2. Click on **"Confirm signup"**
3. Customize the email if you want (or leave default)
4. Make sure it's **enabled**

## Step 5: Test Email Delivery

Supabase uses their own email service by default. For production, you might want to use a custom SMTP:

1. **Authentication** → **Settings** → **SMTP Settings**
2. Configure your SMTP provider (SendGrid, Mailgun, etc.) for production
3. For development, Supabase's default email works fine

---

## Testing the Flow

1. **Sign up** with a real email address
2. **Check your email** (including spam folder)
3. **Click the confirmation link** in the email
4. You should be redirected to `http://localhost:3001/auth/callback`
5. Then automatically redirected to the home page
6. **You should now be logged in**

## Troubleshooting

### Email not arriving?
- Check spam folder
- Wait 1-2 minutes (can take time)
- Check Supabase Dashboard → Authentication → Users → see if user was created
- Check email templates are enabled

### "Redirect URL mismatch" error?
- Make sure the URL in the email matches exactly what's in Redirect URLs
- Check `NEXT_PUBLIC_SITE_URL` in `.env.local` matches your dev server URL

### Callback route not working?
- Check browser console for errors
- Verify `/auth/callback/route.ts` exists
- Check server logs for errors

### Rate limiting?
- Wait the specified time
- Or temporarily increase rate limits in Authentication → Settings → Rate Limits

---

## Production Setup

When deploying:

1. Set `NEXT_PUBLIC_SITE_URL` to your production URL (e.g., `https://replayd.vercel.app`)
2. Add production URLs to Supabase Redirect URLs:
   ```
   https://replayd.vercel.app
   https://replayd.vercel.app/auth/callback
   ```
3. Update Site URL in Supabase to your production URL
4. Configure custom SMTP for better email delivery
