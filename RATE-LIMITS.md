# Supabase Rate Limits

## App-level rate limits (per user)

In addition to Supabase auth limits, the app enforces **per-user** rate limits in server actions (no extra infra; uses your existing DB):

| Action            | Limit              | Window   |
|-------------------|--------------------|----------|
| Create match log  | 20 logs            | 5 minutes |
| Create list       | 5 lists            | 5 minutes |
| Like / unlike log | 60 likes           | 5 minutes |

When exceeded, the user sees: *"Too many … Please try again in a few minutes."* These limits reduce spam and abuse from a single account.

---

## Default Rate Limits (Free Tier)

Supabase has built-in rate limits to prevent abuse:

### Authentication Rate Limits

1. **Sign up requests:** 
   - **3 requests per hour** per IP address
   - After hitting limit: "For security purposes, you can only request this after X seconds"

2. **Email sending:**
   - **4 emails per hour** per user
   - After hitting limit: "email rate limit exceeded"

3. **Password reset requests:**
   - **3 requests per hour** per email

4. **Login attempts:**
   - **5 failed attempts** → temporary lockout
   - Resets after a few minutes

---

## How to Check Your Current Rate Limits

1. Go to **Supabase Dashboard** → **Authentication** → **Settings**
2. Scroll down to **"Rate Limits"** section
3. You'll see:
   - Rate limit per hour
   - Rate limit per minute
   - Lockout duration

---

## How to Adjust Rate Limits

### Option 1: Increase Limits (Pro/Team Plan)

If you're on a paid plan:
1. **Authentication** → **Settings** → **Rate Limits**
2. Adjust the values:
   - **Rate limit per hour:** Increase from 3 to higher (e.g., 10-20)
   - **Rate limit per minute:** Increase if needed
3. Click **"Save"**

### Option 2: Disable Rate Limiting (Development Only)

**⚠️ WARNING: Only do this for local development!**

1. **Authentication** → **Settings** → **Rate Limits**
2. Set limits to very high values (e.g., 1000/hour)
3. Or use Supabase CLI to disable (not recommended for production)

### Option 3: Wait It Out (Free Tier)

If you're on the free tier and hit limits:
- **Wait 60 seconds** between signup attempts
- Use different email addresses for testing
- Clear browser cookies between attempts

---

## Current Status Check

To see if you're currently rate-limited:

1. **Supabase Dashboard** → **Authentication** → **Users**
2. Check if recent signup attempts show errors
3. Check **Logs** tab for rate limit errors

---

## Best Practices for Development

1. **Use test emails** — Create multiple test accounts with different emails
2. **Wait between attempts** — Don't spam signup requests
3. **Use incognito/private browsing** — Helps avoid cookie-based rate limiting
4. **Clear cookies** — Between test attempts
5. **Disable email confirmation temporarily** — For faster testing (turn back on for production)

---

## Production Considerations

- Rate limits protect your app from abuse
- Keep them enabled in production
- Consider upgrading to Pro plan if you need higher limits
- Monitor rate limit errors in Supabase logs

---

## Quick Fix for Testing

If you need to test immediately:

1. **Wait 60 seconds** from your last attempt
2. **Use a different email address**
3. **Clear browser cookies** (or use incognito)
4. Try again

The rate limit resets after the specified time period.
