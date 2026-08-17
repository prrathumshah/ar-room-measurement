# Tech Stack Overview

This project is a web-based room measurement and compliance tool for checking room dimensions and area requirements using modern frontend and AR-friendly web technologies.

## 1. Core Frontend

### React
- Used for building the user interface and app structure.
- Handles the main dashboard, room selection, measurement panels, and interaction flows.
- Library: `react`, `react-dom`

### TypeScript
- Used to add static typing for safer development.
- Helps manage measurement data, room types, saved records, and AR measurement inputs.
- Tool: `typescript`

### Vite
- Used as the development server and build tool.
- Provides fast local development, bundling, and production build generation.
- Tool: `vite`, `@vitejs/plugin-react`

---

## 2. Styling and UI Design

### Tailwind CSS
- Used for rapid responsive styling and layout design.
- Helps create the dark dashboard UI, cards, buttons, and control panels.
- Tools: `tailwindcss`, `postcss`, `autoprefixer`

### Lucide React
- Used for icons in the interface.
- Supports status indicators such as location, compliance, and measurement states.
- Library: `lucide-react`

---

## 3. AR / Spatial / 3D Logic

### Three.js
- Used for rendering 3D scenes and spatial visualization.
- Supports the geometric measurement workflow and scene-based room interactions.
- Library: `three`

### WebXR / AR Support
- Used to detect and enable browser-based augmented reality support.
- Enables immersive measurement experiences when the device/browser supports `immersive-ar` sessions.
- Native browser APIs via `navigator.xr` and WebXR checks in the app logic.

### Custom Measurement Logic
- Used to calculate room area, perimeter, and compliance based on corner points.
- File: `src/hooks/useAreaMath.ts`
- Purpose: convert user-drawn or AR-marked points into real measurements and threshold checks.

---

## 4. Geolocation and Device Data

### Browser Geolocation API
- Used to capture the device's current GPS coordinates during inspection.
- Helps store a geo trace for measurement records.
- Hook: `src/hooks/useGeolocation.ts`

### GPS + Timestamp Metadata
- Used to attach location metadata to saved room measurement records.
- Helps support evidence-based facility auditing.

---

## 5. Progressive Web App (PWA)

### vite-plugin-pwa
- Used to turn the app into a PWA.
- Allows installation on devices like a mobile app experience.
- Tool: `vite-plugin-pwa`

### Why it matters
- Makes the app easier to access on the field.
- Supports offline/standalone install behavior and improved access for inspectors.

---

## 6. Testing

### Vitest
- Used for unit testing the measurement logic and validation behavior.
- Helps ensure area and compliance calculations remain correct.
- Tool: `vitest`

### Example test area
- File: `src/hooks/useAreaMath.test.ts`
- Purpose: verifies measurement formulas and threshold-based compliance checks.

---

## 7. Development & Build Tools

### Type definitions
- `@types/react`, `@types/react-dom`, `@types/node`, `@types/three`
- Used to provide TypeScript support for React, Node, and Three.js APIs.

### Vite server configuration
- Used for local hosting, HTTPS support for secure AR contexts, and preview deployment.
- Config file: `vite.config.ts`

---

## 8. Summary

This project uses a modern React + TypeScript + Vite stack with:
- React for UI
- TypeScript for safety and structure
- Tailwind for responsive styling
- Three.js + WebXR for AR/3D spatial measurement
- Geolocation for field verification
- PWA support for installability
- Vitest for testing

Together, these technologies enable a digital room dimension tracking app that can measure spaces, validate compliance, and record location-aware data for facility inspection.
