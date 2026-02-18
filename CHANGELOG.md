# Changelog

All notable changes to **Autoshot Studio** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.2.0] — 2026-02-18

### Added
- **Import phone + tablet in one shot** — the autoshot import dialog now shows checkboxes instead of radio buttons; both types are selected by default when the ZIP contains both, so phone and tablet slots are created and filled in a single import operation
- **Per-category output size** — Phone and Tablet tabs remember their own output device selection independently (e.g. Phone → iPhone 6.9", Tablet → iPad 12.9"); switching tabs restores each category's last-used size automatically
- **Screen rename** — double-click any screen name in the sidebar to edit it inline, or use the ⋮ menu → Rename; confirm with Enter, cancel with Escape
- **Import with no existing screens** — importing an autoshot ZIP no longer requires pre-created slots; slots are created automatically for every screen name found in the ZIP
- **Smart re-import** — each slot is tagged with its autoshot screen name so re-importing the same ZIP (e.g. after updating screenshots) overwrites the correct slot regardless of order

### Changed
- Import progress label now shows the device type alongside the screen index (`phone · Screen 2/5 · en`)
- Autoshot mapping list now shows `↺ Override slot N` vs `✦ New slot` labels so it is clear what will be created vs updated
- Category settings (output device, custom dimensions) are saved to IndexedDB and restored on project load

---

## [1.1.0] — 2026-02-18

### Added
- **Phone / Tablet separate spaces** — the screenshot list now has Phone and Tablet tabs; each screenshot belongs to one category, and navigation (swipe, keyboard, side previews) stays within the active category
- Autoshot ZIP import now routes phone screenshots to phone slots and tablet screenshots to tablet slots automatically; the app switches to the matching tab after import
- **Tablet support for autoshot import** — ZIP files containing tablet screenshots are now fully supported
- Recognized autoshot simplified naming convention: `small_…` = phone, `big_…` = tablet (e.g. `big_en_us_favorites.png`)
- Expanded full-device-name tablet recognition: iPad, Galaxy Tab, Pixel Tablet, Lenovo Tab, Amazon Fire, Xiaomi Pad, Realme Pad, Huawei M-Pad, and Samsung SM-T prefix
- Device type selector (Phone / Tablet) is now always visible in the autoshot import modal, with unavailable types shown as disabled rather than hidden
- Helpful tip after importing tablet screenshots suggesting to switch output size to iPad 12.9" or iPad 11" when the current output is a phone size

### Changed
- Project renamed from **App Store Screenshot Generator** to **Autoshot Studio**
- Version bumped to `1.1.0` in `package.json` and `tauri.conf.json`
- Updated meta description and Open Graph tags to reflect the new name and tablet support
- README updated with new project name and description

---

## [1.0.0] — 2025 (Initial Public Release)

### Added
- **Output Sizes**: iPhone 6.9", 6.7", 6.5", 5.5" · iPad 12.9", 11" · Android phone & tablet · Web banners (Open Graph, Twitter Card, Hero, Feature Graphic) · Custom dimensions
- **Backgrounds**: Multi-stop gradient editor with presets, solid color, image background with blur/overlay, noise texture overlay
- **2D Device Mode**: Scale, position (X/Y), rotation, corner radius, drop shadow, border
- **3D Device Mode**: Interactive iPhone 15 Pro Max and Samsung Galaxy S25 Ultra mockups via Three.js with drag-to-rotate
- **Position Presets**: Centered, Bleed Bottom/Top, Float Center/Bottom, Tilt Left/Right, Perspective
- **Text Overlays**: Headline and Subheadline with 1500+ Google Fonts, font weight, italic, underline, strikethrough, top/bottom positioning, offset and line-height controls
- **Elements System**: Add graphics, text, emoji (with picker), and Lucide icons to any screenshot; control layer, position, size, rotation, opacity
- **Popouts**: Crop and magnify regions of a screenshot with shadow and border options
- **Decorative Frames**: Laurel wreaths (simple & detailed, with/without star), circle badge, shield badge for text elements
- **Multi-Language Support**: Language switcher with flag icons; per-language screenshots and text; auto-detection from filename suffixes (`_de`, `-fr`, `_pt-br`, …)
- **AI Translation**: Auto-translate headlines and subheadlines via Claude (Anthropic), GPT (OpenAI), or Gemini (Google)
- **AI Magical Titles**: Analyse screenshots and generate marketing copy for all screens at once
- **autoshot Import**: Import screenshots from a Flutter autoshot package ZIP (phone screenshots); maps screen names to slots alphabetically, supports multiple locales per ZIP
- **Project Management**: Multiple projects with create, rename, duplicate, and delete; auto-save to browser IndexedDB
- **Export**: Single screenshot PNG, batch ZIP, multi-language ZIP (one folder per language); export progress indicator
- **UI**: Dark theme (auto/light/dark), side-preview carousel, drag-and-drop reorder, collapsible settings panels, tab persistence, per-screenshot settings
- **Deployment**: Docker + nginx, Tauri desktop app (macOS, Windows, Linux)
