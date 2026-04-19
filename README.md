# ✦ Air Writer — Gesture Canvas Studio

<div align="center">

![Air Writer Banner](https://img.shields.io/badge/Air%20Writer-v2.0-4f8ef7?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMC43MSA3LjA0YS45Ni45NiAwIDAgMCAwLTEuNDFsLTIuMzQtMi4zNGEuOTYuOTYgMCAwIDAtMS40MSAwbC0xLjg0IDEuODMgMy43NSAzLjc1TTMgMTcuMjVWMjFoMy43NUwxNy44MSA5Ljk0bC0zLjc1LTMuNzVMMyAxNy4yNXoiLz48L3N2Zz4=)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646cff?style=for-the-badge&logo=vite)
![Mediapipe](https://img.shields.io/badge/Mediapipe-Hands-ff6f00?style=for-the-badge&logo=google)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Draw, write, and create using only your hand gestures via webcam.**  
A professional browser-based canvas app powered by Google Mediapipe hand tracking.

[🚀 Live Demo](#) · [📖 Documentation](#table-of-contents) · [🐛 Report Bug](../../issues) · [💡 Request Feature](../../issues)

</div>

---

## 📸 Preview

```
┌─────────────────────────────────────────────────────────────┐
│  ✦ Air Writer          │                                     │
│  Gesture Canvas Studio │         White Canvas                │
│ ─────────────────────  │                                     │
│  🟢 Camera Active      │    ✍️ Draw with your hand           │
│  ☝️ DRAWING            │                                     │
│ ─────────────────────  │                                     │
│  [Tools][Shape][Tmpl]  │                                     │
│  [OCR Results]         │                                     │
│ ─────────────────────  │                                     │
│  COLOR  ● ● ● ● ●      │                                     │
│  STROKE  ────────      │                                     │
│  OPACITY ────────      │                                     │
│ ─────────────────────  │                                     │
│  📄 PDF  🖼 PNG         │  ☝️ Draw · ✌️ Hover · ✊ Erase     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Gesture Reference](#-gesture-reference)
- [Using the App](#-using-the-app)
- [Character Recognition](#-character-recognition-ocr)
- [Shapes & Templates](#-shapes--templates)
- [Export Options](#-export-options)
- [Configuration](#-configuration)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🖐️ Gesture Control
- **Real-time hand tracking** via Google Mediapipe Hands (21 landmarks)
- **Three intuitive gestures** — Draw, Hover, Erase
- **Dual Kalman filter** smoothing eliminates shaky lines
- **Mirrored display** — moves feel natural like a mirror

### 🎨 Drawing Tools
- **15-color palette** + full custom color picker
- **Stroke width** 1–40px with live preview bar
- **Opacity** control 10–100% per stroke
- **Quadratic bezier** curves for silky smooth lines
- **Mouse fallback** — works without a camera too

### ⬡ Shape Drawing
- 8 shapes: Rectangle, Circle, Triangle, Arrow, Star, Diamond, Line, Heart
- **Live drag preview** while drawing
- **Fill / outline** toggle
- Works with both mouse and gesture

### 🔤 Character Recognition (OCR)
- **Automatic** — runs after every stroke
- Detects **A–Z, 0–9, and symbols**
- Confidence score per character
- Builds up a **detected string** live in the OCR tab
- Based on geometric feature analysis (no server calls)

### 📋 Templates
- Blank, Lined Paper, Grid, Dotted, Music Staff, Isometric

### 📄 Export
- **PDF** — print-ready, correct orientation
- **PNG** — transparent or white background

### 🏗️ History
- **Undo / Redo** up to 20 steps (Ctrl+Z / Ctrl+Y)
- Snapshot taken before each stroke

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| **React 18** | UI framework |
| **Vite 5** | Build tool (Node 16–22 compatible) |
| **Mediapipe Hands** | Hand landmark detection (21 points) |
| **HTML5 Canvas API** | Drawing engine |
| **jsPDF** | PDF export |
| **docx** | Word document export |
| **file-saver** | Download trigger |
| **DM Sans** + **Playfair Display** | UI typography |

---

## 📁 Project Structure

```
air-writer-vite/
├── index.html                    # Entry HTML
├── vite.config.js                # Vite configuration
├── package.json                  # Dependencies
└── src/
    ├── main.jsx                  # React entry point
    ├── App.jsx                   # Root component & orchestration
    ├── App.css                   # Global styles (light studio theme)
    │
    ├── components/
    │   ├── Toolbar.jsx           # 4-tab side panel (Tools/Shapes/Templates/OCR)
    │   ├── WebcamPIP.jsx         # Draggable picture-in-picture webcam feed
    │   ├── GestureCursor.jsx     # Visual cursor ring for finger position
    │   └── StatusBar.jsx         # Bottom bar: gesture state / coords / fps
    │
    ├── hooks/
    │   ├── useHandTracking.js    # Mediapipe camera + landmark stream
    │   └── useDrawing.js         # Stroke engine + shape drawing + undo/redo
    │
    └── utils/
        ├── smoother.js           # Dual Kalman filter + Weighted Moving Average
        ├── gestureDetector.js    # Landmark array → gesture classifier
        ├── canvasUtils.js        # Drawing primitives, eraser, grid
        ├── charRecognizer.js     # Stroke → character recognition engine
        ├── shapeDrawer.js        # 8 shape drawing functions
        ├── templates.js          # 6 canvas background templates
        └── exportUtils.js        # PNG / JPG / PDF / DOCX export
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| **Node.js** | v16 or higher | [Download](https://nodejs.org/) |
| **Chrome** | Latest | Best Mediapipe support |
| **Webcam** | Any | Required for gesture mode |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/air-writer.git
cd air-writer

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```

Open **http://localhost:3000** in Chrome.

> ⚠️ **Camera permissions**: When you click "Enable Camera", Chrome will ask for webcam access. Click **Allow**. If you accidentally blocked it, click the 🔒 padlock in the address bar → Site settings → Camera → Allow → Refresh.

### Available Scripts

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Build for production → dist/
npm run preview  # Preview production build locally
```

---

## 🖐️ Gesture Reference

Position your hand **30–60 cm** from the camera for best results.

| Gesture | Hand Position | Action | Indicator |
|---|---|---|---|
| ☝️ **Draw** | Index finger up, others folded | Ink follows fingertip | Blue cursor ring |
| ✌️ **Hover** | Index + Middle up (peace sign) | Navigate without drawing | Yellow dashed ring |
| ✊ **Erase** | Closed fist, all fingers curled | Circular eraser | Red cursor ring |

### Tips for Accurate Tracking
- Ensure **even lighting** — avoid strong backlight behind you
- Keep hand **within camera frame** at all times
- Make gestures **deliberate and clear** — don't rush transitions
- If tracking is jittery, adjust the Kalman filter values in `src/utils/smoother.js`

---

## 🎯 Using the App

### 1. Draw Mode (default)
1. Click **Enable Camera** in the sidebar
2. Wait ~5 seconds for the Mediapipe model to load (first time: ~12 MB download)
3. Show your ☝️ index finger to start drawing
4. Switch to ✌️ peace sign to hover/navigate without drawing
5. Make a ✊ fist to erase

### 2. Mouse Mode (no camera)
- **Left-click drag** to draw
- **Right-click** to erase at that spot
- All tools, shapes, and exports work normally

### 3. Toolbar Tabs

| Tab | What it contains |
|---|---|
| 🖌 **Tools** | Color palette, stroke width, opacity, eraser size, undo/redo, export |
| ⬡ **Shapes** | 8 shape types, fill toggle, stroke width |
| 📋 **Templates** | 6 background presets |
| 🔤 **OCR** | Live character recognition results |

---

## 🔤 Character Recognition (OCR)

The OCR engine runs **100% client-side** — no server, no API calls.

### How it works
After each stroke finishes (finger lifts or switches gesture), the engine:
1. **Normalizes** the stroke into a 0–1 bounding box
2. **Resamples** to 32 equidistant points
3. Computes a **direction histogram** (8 bins)
4. Measures **aspect ratio, loop detection, reversal count, centroid position**
5. Matches against geometric patterns for each character

### Supported characters
```
Letters:  A B C D E F H I J K L M N O P S T U V W X Z
Digits:   0 1 7
Symbols:  - / \ ~ O
```

### Tips for better recognition
- Write **one letter per stroke** — lift between letters
- Write letters **large** — use the full canvas height
- Use **natural handwriting** motion, not block printing
- Check the **confidence score** in the OCR tab — below 60% means ambiguous

---

## ⬡ Shapes & Templates

### Drawing Shapes
1. Switch to the **Shapes tab**
2. Click a shape button (e.g., Circle)
3. **Click and drag** on the canvas to draw the shape
4. Toggle **Fill shape** for filled vs outlined

### Available Shapes
| Shape | Description |
|---|---|
| Rectangle | Axis-aligned rectangle |
| Circle | Ellipse (proportional with Shift) |
| Triangle | Isoceles triangle |
| Arrow | Line with arrowhead |
| Star | 5-pointed star |
| Diamond | Rotated square |
| Line | Straight line segment |
| Heart | Bezier heart curve |

### Applying Templates
1. Switch to the **Templates tab**
2. Click a template — **canvas resets** with that background
3. Draw on top of the template
4. Export includes the template background

---

## 📄 Export Options

| Format | Background | Use case |
|---|---|---|
| **PDF** | White | Printing, sharing documents |
| **PNG** | Transparent | Web use, design work |

Click the export button in the **Tools tab** to download immediately.

---

## ⚙️ Configuration

### Smoothing (reduce shakiness)
Edit `src/utils/smoother.js`:
```js
// Lower R = more smoothing (slower response)
// Higher Q = faster response (more jitter)
this.R = 0.008  // measurement noise
this.Q = 2      // process noise
```

### Gesture sensitivity
Edit `src/utils/gestureDetector.js` — the `up()` function determines when a finger is considered "up":
```js
function up(lm, tip, pip) {
  return lm[tip].y < lm[pip].y  // tip is above PIP joint
}
```

### Mediapipe confidence thresholds
Edit `src/hooks/useHandTracking.js`:
```js
hands.setOptions({
  minDetectionConfidence: 0.7,   // lower = detects from further away
  minTrackingConfidence:  0.6,   // lower = more stable but less accurate
})
```

---




## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# Fork the repo on GitHub, then:
git clone https://github.com/YOUR_USERNAME/air-writer.git
cd air-writer
git checkout -b feature/your-feature-name
# Make changes...
git commit -m "feat: add your feature"
git push origin feature/your-feature-name
# Open a Pull Request on GitHub
```

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgements

- [Google Mediapipe](https://mediapipe.dev/) — hand landmark detection
- [Vite](https://vitejs.dev/) — lightning-fast build tool
- [React](https://react.dev/) — UI framework
- [jsPDF](https://parall.ax/products/jspdf) — PDF generation

---

<div align="center">
Made with ☝️ gestures and ❤️ · <a href="https://air-writer.vercel.app/">⭐ Star this repo</a>
</div>
