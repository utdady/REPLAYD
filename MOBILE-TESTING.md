# Testing REPLAYD on Your Phone

## Option 1: Same Wi-Fi Network (Easiest)

### Step 1: Find your computer's IP address

**Windows:**
1. Open PowerShell or Command Prompt
2. Run: `ipconfig`
3. Look for "IPv4 Address" under your Wi-Fi adapter (usually `192.168.x.x` or `10.x.x.x`)

**Or run this in PowerShell:**
```powershell
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Wireless*" } | Select-Object IPAddress
```

### Step 2: Make sure dev server is running

```bash
npm run dev
```

Note the port (usually `3000` or `3001` if 3000 is busy).

### Step 3: Connect phone to same Wi-Fi

- Make sure your phone and computer are on the **same Wi-Fi network**

### Step 4: Open on phone

On your phone's browser, go to:
```
http://[YOUR-IP]:3001
```

For example: `http://192.168.1.100:3001`

**Note:** Windows Firewall might block the connection. If it doesn't work:
1. Windows Security → Firewall & network protection
2. Allow an app through firewall → Allow Node.js (or temporarily disable firewall for testing)

---

## Option 2: Tunneling Service (Works from anywhere)

### Using Cloudflare Tunnel (Free, no signup needed)

1. **Install cloudflared:**
   - Download from: https://github.com/cloudflare/cloudflared/releases
   - Or use: `winget install cloudflare.cloudflared`

2. **Run tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3001
   ```

3. **Copy the URL** it gives you (looks like `https://random-words.trycloudflare.com`)

4. **Open that URL on your phone** — works from anywhere!

### Using ngrok (Alternative)

1. Sign up at https://ngrok.com (free tier available)
2. Install: `winget install ngrok.ngrok` or download from ngrok.com
3. Run: `ngrok http 3001`
4. Copy the `https://xxxx.ngrok.io` URL to your phone

---

## Option 3: Deploy to Vercel (Best for sharing)

1. **Push to GitHub** (already done ✅)

2. **Deploy:**
   - Go to https://vercel.com
   - Import your GitHub repo
   - Add environment variables from `.env.local`
   - Deploy

3. **Get URL** — Vercel gives you a public URL like `replayd.vercel.app`

4. **Access from phone** — works from anywhere, no setup needed

---

## Testing PWA Features

Once you can access the app on your phone:

1. **Service Worker:**
   - Open DevTools (if available) or check Network tab
   - Should see `/sw.js` loading

2. **Install Prompt:**
   - After visiting a few times, browser should show "Add to Home Screen"
   - Or look for install icon in address bar (Chrome/Safari)

3. **Bottom Nav:**
   - Should appear at bottom on mobile
   - Hidden on desktop (≥768px)

4. **Touch Targets:**
   - All buttons should be at least 44×44px
   - No zoom on input focus (16px font prevents iOS zoom)

---

## Troubleshooting

**Can't connect via IP:**
- Check Windows Firewall → Allow Node.js
- Make sure phone and computer are on same Wi-Fi
- Try disabling VPN if active

**Port not accessible:**
- Next.js dev server binds to `0.0.0.0` by default (should work)
- If not, try: `npm run dev -- -H 0.0.0.0`

**PWA not installing:**
- Need icons: `public/icons/icon-192.png` and `icon-512.png`
- Service worker must load successfully
- Must be HTTPS (or localhost) — tunneling services provide HTTPS
