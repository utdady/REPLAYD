# Testing REPLAYD on Your Phone

## Step-by-step: Same Wi-Fi (most common)

Do these in order. Your phone and PC must be on the **same Wi-Fi**.

---

### Step 1: Open the project on your computer

1. Open **Cursor** (or your editor) and open the **REPLAYD** project folder.
2. Open the **terminal** in Cursor (Terminal → New Terminal, or `` Ctrl+` ``).

---

### Step 2: Install dependencies (if you haven’t already)

In the terminal, run:

```bash
npm install
```

Wait until it finishes. You only need to do this once (or when dependencies change).

---

### Step 3: Start the dev server so your phone can reach it

In the same terminal, run:

```bash
npm run dev:mobile
```

- **Leave this terminal open** while you test. Closing it stops the server.
- You should see something like:
  ```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000
  ```
- The **port** is usually **3000**. If you see a different port (e.g. 3001), use that in Step 6.
- The **Network** URL already contains your PC’s IP — you can use that IP in Step 6.

---

### Step 4: Find your computer’s IP address (if Step 3 didn’t show it)

**Option A – From the terminal output**

- Look at the line that says `Network: http://192.168.x.x:3000`. The `192.168.x.x` part is your IP. Write it down (e.g. `192.168.1.100`).

**Option B – Using Windows**

1. Press **Windows key**, type **cmd** or **PowerShell**, and open **Command Prompt** or **PowerShell**.
2. Type:
   ```bash
   ipconfig
   ```
3. Press **Enter**.
4. Scroll to the section for your **Wi-Fi** adapter (often named “Wireless LAN adapter Wi-Fi” or similar).
5. Find the line **IPv4 Address**. It will look like `192.168.1.100` or `10.0.0.5`. That is your IP. Write it down.

**Option C – Quick PowerShell one-liner**

In PowerShell, run:

```powershell
(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Wireless*" }).IPAddress
```

Use the number it prints (e.g. `192.168.1.100`).

---

### Step 5: Connect your phone to the same Wi-Fi

1. On your **phone**, open **Settings** → **Wi-Fi**.
2. Connect to the **same network** your computer is on (same name, same router).
3. Do **not** use mobile data only; Wi-Fi must be connected.

---

### Step 6: Open the app on your phone

1. On your **phone**, open the **browser** (Chrome, Safari, Edge, etc.).
2. In the **address bar**, type exactly (replace with your IP and port if different):
   ```
   http://192.168.1.100:3000
   ```
   Example: if your IP is `10.0.0.5` and port is 3000, use `http://10.0.0.5:3000`.
3. Press **Go** or **Enter**.
4. The REPLAYD app should load. You can log in, use the feed, etc.

---

### Step 7: If the page doesn’t load

**Check:**

1. **Same Wi-Fi** – Phone and PC on the same network.
2. **Server still running** – The terminal where you ran `npm run dev:mobile` is still open and shows no errors.
3. **Correct address** – You used `http://` (not `https://`), your real IP, and the right port (usually `3000`).

**Windows Firewall:**

1. Press **Windows key**, type **Windows Security**, open it.
2. Go to **Firewall & network protection**.
3. Click **Allow an app through firewall** (or **Allow an app or feature through Windows Defender Firewall**).
4. Click **Change settings**.
5. Find **Node.js** in the list and tick **Private** (and **Public** if you want). If it’s not there, click **Allow another app**, browse to your Node.js install, add it, then tick the boxes.
6. Click **OK**. Try opening the URL on your phone again.

**VPN:**

- Turn off any **VPN** on your PC or phone and try again.

---

## Option 2: Tunneling (works from anywhere)

---

## Option 2: Tunneling Service (Works from anywhere)

### Using Cloudflare Tunnel (Free, no signup needed)

1. **Install cloudflared:**
   - Download from: https://github.com/cloudflare/cloudflared/releases
   - Or use: `winget install cloudflare.cloudflared`

2. **Run tunnel** (with your dev server already running on port 3000):
   ```bash
   cloudflared tunnel --url http://localhost:3000
   ```

3. **Copy the URL** it gives you (looks like `https://random-words.trycloudflare.com`)

4. **Open that URL on your phone** — works from anywhere!

### Using ngrok (Alternative)

1. Sign up at https://ngrok.com (free tier available)
2. Install: `winget install ngrok.ngrok` or download from ngrok.com
3. Run: `ngrok http 3000`
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
- Use `npm run dev:mobile` so the server listens on all interfaces (`0.0.0.0`).
- If port 3000 is in use, run: `npm run dev:mobile -- -p 3001` and use `:3001` in the phone URL.

**PWA not installing:**
- Need icons: `public/icons/icon-192.png` and `icon-512.png`
- Service worker must load successfully
- Must be HTTPS (or localhost) — tunneling services provide HTTPS
