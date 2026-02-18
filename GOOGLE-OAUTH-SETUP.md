# Google OAuth Setup for REPLAYD

To enable "Sign in with Google" on your REPLAYD app, you need to configure Google OAuth in Supabase.

## Steps

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Add authorized redirect URIs:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For local dev: `http://localhost:54321/auth/v1/callback` (if using Supabase CLI)
7. Copy the **Client ID** and **Client Secret**

### 2. Configure in Supabase

1. Go to **Supabase Dashboard** → your project → **Authentication** → **Providers**
2. Find **Google** and toggle it **ON**
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

### 3. Update Redirect URLs (if needed)

In Supabase → **Authentication** → **URL Configuration**:
- Add your production URL (e.g. `https://replayd.vercel.app`) to **Redirect URLs**
- The callback URL `/auth/callback` should already be handled by your app

### 4. Test

1. Go to your deployed app (or localhost)
2. Click **"Continue with Google"** on the login or signup page
3. You should be redirected to Google, then back to your app after authentication

## Notes

- **Username handling**: When users sign in with Google, if they don't have a username in their metadata, the trigger (`handle_new_user`) will generate one from their email (e.g. `john@gmail.com` → `john`).
- **Existing users**: If a Google account email already exists in your system, Supabase will link it automatically (if email confirmation is enabled) or show an error.
- **Profile creation**: The trigger automatically creates a profile row with a username when a new user signs up via Google OAuth.
