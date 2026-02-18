/* ===== State management & runtime vars ===== */
/* auto-split from app.js lines 1–127 */
// State management
const state = {
  screenshots: [],
  selectedIndex: 0,
  activeCategory: "phone", // 'phone' | 'tablet'
  transferTarget: null, // Index of screenshot waiting to receive style transfer
  outputDevice: "iphone-6.9",
  currentLanguage: "en", // Global current language for all text
  projectLanguages: ["en"], // Languages available in this project
  customWidth: 1290,
  customHeight: 2796,
  categorySettings: {
    phone: {
      outputDevice: "iphone-6.9",
      customWidth: 1290,
      customHeight: 2796,
    },
    tablet: {
      outputDevice: "ipad-12.9",
      customWidth: 2048,
      customHeight: 2732,
    },
  },
  // Default settings applied to new screenshots
  defaults: {
    background: {
      type: "gradient",
      gradient: {
        angle: 135,
        stops: [
          { color: "#667eea", position: 0 },
          { color: "#764ba2", position: 100 },
        ],
      },
      solid: "#1a1a2e",
      image: null,
      imageFit: "cover",
      imageBlur: 0,
      overlayColor: "#000000",
      overlayOpacity: 0,
      noise: false,
      noiseIntensity: 10,
    },
    screenshot: {
      scale: 70,
      y: 60,
      x: 50,
      rotation: 0,
      perspective: 0,
      cornerRadius: 24,
      use3D: false,
      device3D: "iphone",
      rotation3D: { x: 0, y: 0, z: 0 },
      shadow: {
        enabled: true,
        color: "#000000",
        blur: 40,
        opacity: 30,
        x: 0,
        y: 20,
      },
      frame: {
        enabled: false,
        color: "#1d1d1f",
        width: 12,
        opacity: 100,
      },
    },
    text: {
      headlineEnabled: true,
      headlines: { en: "" },
      headlineLanguages: ["en"],
      currentHeadlineLang: "en",
      headlineFont: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
      headlineSize: 100,
      headlineWeight: "600",
      headlineItalic: false,
      headlineUnderline: false,
      headlineStrikethrough: false,
      headlineColor: "#ffffff",
      perLanguageLayout: false,
      languageSettings: {
        en: {
          headlineSize: 100,
          subheadlineSize: 50,
          position: "top",
          offsetY: 12,
          lineHeight: 110,
        },
      },
      currentLayoutLang: "en",
      position: "top",
      offsetY: 12,
      lineHeight: 110,
      subheadlineEnabled: false,
      subheadlines: { en: "" },
      subheadlineLanguages: ["en"],
      currentSubheadlineLang: "en",
      subheadlineFont: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
      subheadlineSize: 50,
      subheadlineWeight: "400",
      subheadlineItalic: false,
      subheadlineUnderline: false,
      subheadlineStrikethrough: false,
      subheadlineColor: "#ffffff",
      subheadlineOpacity: 70,
    },
    elements: [],
    popouts: [],
  },
};

const baseTextDefaults = JSON.parse(JSON.stringify(state.defaults.text));

// Runtime-only state (not persisted)
let selectedElementId = null;
let selectedPopoutId = null;
let draggingElement = null;

// Preload laurel SVG images for element frames
const laurelImages = {};
["laurel-simple-left", "laurel-detailed-left"].forEach((name) => {
  const img = new Image();
  img.src = `img/${name}.svg`;
  laurelImages[name] = img;
});

