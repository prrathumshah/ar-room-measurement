# Project Handoff Document

## Project Name
Digital Dimension Tracking

## Overview
This project is a web app designed to measure room dimensions and verify whether a room meets required space compliance standards. It supports both AR-assisted measurement and a manual fallback for devices that do not support WebXR or GPS.

## Main Objective
The app helps inspect rooms such as classrooms and labs by:
- measuring corners/geometry
- calculating area and perimeter
- checking compliance against required minimum area
- storing room measurement records with timestamps and GPS data
- supporting field inspection workflows on mobile devices

## Tech Stack
- React + TypeScript for the UI and app logic
- Vite for local development and production builds
- Tailwind CSS for styling and responsive layout
- Three.js for 3D / spatial rendering
- WebXR for AR support detection
- Browser Geolocation API for GPS tracking
- Vitest for unit testing
- vite-plugin-pwa for installable mobile app experience

## Key Files
- src/App.tsx — main app shell and room measurement flow
- src/components/ARMeasurementView.tsx — AR measurement UI
- src/components/ManualFallbackView.tsx — manual measurement fallback
- src/hooks/useAreaMath.ts — area/perimeter/compliance calculations
- src/hooks/useGeolocation.ts — GPS logic and status handling
- vite.config.ts — local server, HTTPS, and PWA configuration
- TECH_STACK.md — summary of all technologies used

## How the App Works
1. User selects a room type and room name.
2. The app checks whether the browser/device supports WebXR AR.
3. If AR is supported, the app uses AR measurement tools.
4. If AR is not supported, the app shows manual input fallback.
5. User marks points or enters dimensions.
6. The app calculates area and perimeter.
7. It checks whether the room meets the required minimum area threshold.
8. Saved records include room details, compliance status, GPS trace, and timestamp.

## Important Notes for Testing
### GPS / Security Requirement
The browser requires a secure context for geolocation access. This means:
- HTTPS is required for GPS and AR detection in many mobile browsers.
- `http://` may fail on phones even if the app loads.
- If you use local development, the app must be served with HTTPS or a trusted tunnel.

### Fallback Behavior
The app intentionally falls back to manual measurement when:
- WebXR is unsupported
- GPS is unavailable
- location permission is denied
- the browser is not on a secure origin

This is not a crash; it is the designed fallback mode.

## Local Development Commands
From the project folder:

```bash
npm install
npm run dev
```

## Mobile Testing Important
If testing on a phone:
- connect the phone and laptop to the same network, or
- use a secure tunnel/public HTTPS URL, or
- use a hotspot setup with the laptop acting as host

For real mobile browser support, avoid plain HTTP when GPS or AR is needed.

## Current Issue / Known Caveat
The app may show a security warning or switch to manual mode when served over a local self-signed certificate or an insecure HTTP URL. This is because browsers require trusted HTTPS for secure APIs, especially geolocation and WebXR.

## Suggested Next Improvements
- Add a proper production deployment with trusted HTTPS
- Improve the AR measurement UI for mobile usability
- Add export to CSV/PDF for inspection records
- Add authentication or admin access for official audits
- Improve GPS accuracy handling and status messaging

## Handoff Summary
This project is ready for continuation by another developer with a full frontend stack already in place. The main areas to work on next are mobile testing, secure HTTPS setup, and refinement of the AR/manual measurement flow.
