# Autoshot Studio

A powerful, AI-driven, open-source studio for creating professional App Store and Play Store marketing screenshots. Designed for speed, flexibility, and multi-device workflows.

**[Start using the Studio. Hosted on GitHub Pages](https://andronasef.github.io/flutter-autoshot-studio/)**

![Autoshot Studio](img/screenshot-generator.png)

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> 🍋 **The Mission**: To provide a professional-grade, free, and AI-powered creative studio that empowers developers and marketers to turn raw screenshots into gorgeous marketing assets in seconds, supporting unified phone & tablet workflows. Built by [YuzuHub](https://yuzuhub.com).

## 🚀 Key Features

### ✨ AI-Powered Intelligence

- **AI Magical Titles**: Automatically analyze your screenshots using Vision AI (Claude, GPT, or Gemini) to generate punchy, benefit-driven marketing copy.
- **Smart AI Translation**: Localize your headlines and subheadlines into dozens of languages instantly using high-quality LLMs.
- **Contextual Copywriting**: Generates unique headlines for every screen while maintaining a consistent brand voice.

### 📱 Unified Multi-Device Workflow

- **Phone & Tablet Tabs**: Manage both iPhone and iPad (or Android phone and tablet) screenshots in a single project.
- **Dual-Category Export**: Export all phone and tablet sizes in one click, perfectly organized for store submission.
- **Smart `autoshot` Integration**: Direct import and mapping for the Flutter `autoshot` package — keeps your marketing assets in sync with your codebase.

### 🎨 Creative Elements System

- **Graphics & Icons**: Overlay custom images, Lucide icons, and emojis to highlight features.
- **Text Elements**: Add extra call-to-actions, badges, or descriptive labels anywhere on the canvas.
- **Popouts & Magnification**: Crop and magnify specific regions of your screen (e.g., a specific button or graph) with custom shadows and borders.
- **Decorative Frames**: Built-in laurel wreaths and badges for social proof (e.g., "App of the Day").

### 🛠️ Advanced Rendering

- **3D Device Mockups**: Interactive iPhone 15 Pro Max and Galaxy S25 Ultra 3D models with drag-to-rotate.
- **2D Device Frames**: Precise control over scale, position, rotation, corner radius, and shadows.
- **Dynamic Backgrounds**: Multi-stop gradients, solid colors, or image backgrounds with blur, noise, and overlays.
- **Perspective Presets**: One-click application of professional layouts (Bleed, Tilt, Perspective, Float).

### 🖥️ Native Desktop Experience

- **Tauri Powered**: Available as a high-performance native desktop app for macOS, Windows, and Linux.
- **Native File System Access**: Faster imports and exports on your local machine.
- **System Theme Integration**: Respects your OS light/dark preferences automatically.

## 🛠️ Tech Stack

- **Graphics**: HTML5 Canvas (2D) & Three.js (3D)
- **Local Runtime**: Tauri (Rust/JavaScript)
- **Deployment**: Docker + Nginx
- **Intelligence**: Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google)
- **Persistence**: IndexedDB for zero-latency auto-saving

## 🚦 Getting Started

### 🌐 Just Want to Use It?

Visit **[yuzu-hub.github.io/appscreen](https://yuzu-hub.github.io/appscreen/)** to start creating. No registration or installation required.

### 📦 Run with Docker

```bash
docker run -d -p 8080:80 ghcr.io/yuzu-hub/appscreen:latest
```

### 💻 Local Development

Since the app uses IndexedDB for persistence, you must serve it via a local web server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js
npx serve .
```

## Author

Proudly vibe coded by [Stefan](https://github.com/BlackMac) and forked by [Andrew Nasef] to make it great for flutter development!!

## License

MIT License - feel free to use, modify, and distribute.
