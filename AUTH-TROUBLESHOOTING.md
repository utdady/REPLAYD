# Auth Troubleshooting Guide

## Common Issues & Fixes

### 1. Rate Limiting Errors

**Error:** "For security purposes, you can only request this after X seconds"

**Cause:** Supabase has built-in rate limiting to prevent abuse.

**Fix:**
- **Wait** the specified time (usually 3-60 seconds)
- Or configure rate limits in Supabase Dashboard:
  - Authentication → Settings → Rate Limits
  - Increase limits for development

### 2. Email Rate Limit Exceeded

**Error:** "email rate limit exceeded"

**Cause:** Too many signup emails sent in a short time.

**Fix:**
- Wait a few minutes before trying again
- Or disable email confirmation temporarily for testing:
  - Supabase Dashboard → Authentication → Settings
  - Under "Email Auth", toggle **"Enable email confirmations"** OFF
  - Users will be logged in immediately after signup

### 3. Email Confirmation Not Working

**Issue:** Signup succeeds but user can't log in.

**Check:**
1. **Supabase Dashboard → Authentication → URL Configuration**
   - Add `http://localhost:3001` to **Redirect URLs**
   - Add `http://localhost:3001/auth/callback` to **Redirect URLs**
   - Add your production URL when deployed

2. **Check email spam folder** — confirmation emails might be there

3. **Email templates** — Supabase Dashboard → Authentication → Email Templates
   - Make sure "Confirm signup" template is enabled

### 4. "Invalid login credentials"

**Possible causes:**
- User hasn't confirmed email yet (if email confirmation is enabled)
- Wrong password
- User doesn't exist

**Fix:**
- Check if email confirmation is required
- Try resetting password: `/login` → "Forgot password?" (if you add that feature)

### 5. Callback Route Not Working

**Check:**
- URL in Supabase Dashboard matches your app URL
- `/auth/callback/route.ts` exists and is accessible
- Check browser console for errors

---

## Quick Fixes

### Disable Email Confirmation (for testing)

1. Go to **Supabase Dashboard → Authentication → Settings**
2. Scroll to **"Email Auth"**
3. Toggle **"Enable email confirmations"** OFF
4. Save

Now users can sign up and log in immediately without email confirmation.

### Add Redirect URLs

1. **Supabase Dashboard → Authentication → URL Configuration**
2. Under **"Redirect URLs"**, add:
   ```
   http://localhost:3001
   http://localhost:3001/auth/callback
   http://192.168.1.4:3001
   http://192.168.1.4:3001/auth/callback
   ```
3. Add your production URL when you deploy

### Check Rate Limits

1. **Supabase Dashboard → Authentication → Settings**
2. Scroll to **"Rate Limits"**
3. Adjust if needed (defaults are usually fine)

---

## Testing Steps

1. **Clear browser cookies** (or use incognito)
2. **Wait 60 seconds** if you hit rate limits
3. **Try signup** with a new email
4. **Check email** (including spam)
5. **Click confirmation link**
6. **Try logging in**

If email confirmation is disabled, you can log in immediately after signup.
