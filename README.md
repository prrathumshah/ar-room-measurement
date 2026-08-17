# 📐 AR Room Measurement & Compliance Tool

A web-based digital dimension tracking and room compliance tool built with React, Three.js, and WebXR for real-time spatial measurement and floor area verification.

---

## Running on Mobile (WebXR AR Testing)

WebXR requires a secure HTTPS context with camera access permissions. Follow these steps to run the Vite dev server and tunnel it securely to your mobile device using Cloudflare Tunnels.

### 1. Prerequisites (One-time Setup)

Install project dependencies:
```powershell
npm install
```

Install the Cloudflare Tunnel CLI via Windows Package Manager:
```powershell
winget install Cloudflare.cloudflared
```

---

### 2. Starting the Application

You will need **two terminal tabs** running simultaneously in your project root:

#### **Terminal 1: Start Vite Dev Server**
Allow external Cloudflare hostnames and start Vite:
```powershell
$env:__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS = ".trycloudflare.com"
npm run dev
```

#### **Terminal 2: Start Cloudflare HTTPS Tunnel**
Open a second terminal, reload your system PATH, and forward HTTPS traffic to the dev server port with TLS verification disabled for local self-signed certificates:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
cloudflared tunnel --url https://localhost:5173 --no-tls-verify
```

---

### 3. Testing on Your Phone

1. In **Terminal 2**, look for the generated public tunnel URL:
   ```text
   https://<random-words>.trycloudflare.com
   ```
2. Open that URL in **Google Chrome** on an ARCore-compatible Android device.
3. Tap **Start AR Session** to grant camera permissions and start the session via a direct user gesture.
4. Aim the camera at the floor and pan slowly to detect surfaces.
5. Tap **Mark Corner** at each sequential corner (mark all 4 corners for rectangular rooms) to calculate real-time area ($m^2$) and perimeter ($m$).
