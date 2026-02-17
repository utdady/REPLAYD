# Node.js not found — setup for REPLAYD

Your terminal says `npm is not recognized` because **Node.js isn’t installed** (or isn’t on your PATH).

## Install Node.js

### Option A — Website (recommended)

1. Open **https://nodejs.org**
2. Download the **LTS** Windows installer (.msi)
3. Run the installer
4. Leave **“Add to PATH”** checked, then finish
5. **Close and reopen** your terminal (and Cursor if you use its terminal)
6. In the project folder run:
   ```powershell
   npm install
   npm run dev
   ```

### Option B — Winget (Windows 11 / Windows Package Manager)

In PowerShell (Run as Administrator optional):

```powershell
winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
```

Then close and reopen the terminal and run:

```powershell
cd C:\Users\addyb\OneDrive\Desktop\REPLAYD
npm install
npm run dev
```

---

## After installing

- Open **http://localhost:3000** in your browser to view the app.
- If a **new** terminal still doesn’t see `node` or `npm`, restart Cursor so it picks up the updated PATH.
