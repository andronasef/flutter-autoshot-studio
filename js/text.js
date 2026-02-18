/* ===== Text value helpers ===== */
/* auto-split from app.js lines 8004–8140 */
// Helper function to set text value for current screenshot
function setTextValue(key, value) {
  setTextSetting(key, value);
}

function setTextLanguageValue(key, value, lang = null) {
  const text = getTextSettings();
  if (!text.perLanguageLayout) {
    // Global mode - write directly to text
    text[key] = value;
    return;
  }
  const targetLang = lang || getTextLayoutLanguage(text);
  const settings = getTextLanguageSettings(text, targetLang);
  settings[key] = value;
  text.currentLayoutLang = targetLang;
}

// Helper function to get text settings for current screenshot
function getTextSettings() {
  return getText();
}

// Load text UI from current screenshot's settings
function loadTextUIFromScreenshot() {
  updateTextUI(getText());
}

// Load text UI from default settings
function loadTextUIFromGlobal() {
  updateTextUI(state.defaults.text);
}

// Update all text UI elements
function updateTextUI(text) {
  const headlineLang = text.currentHeadlineLang || "en";
  const subheadlineLang = text.currentSubheadlineLang || "en";
  const layoutLang = getTextLayoutLanguage(text);
  const headlineLayout = getEffectiveLayout(text, headlineLang);
  const subheadlineLayout = getEffectiveLayout(text, subheadlineLang);
  const layoutSettings = getEffectiveLayout(text, layoutLang);
  const headlineText = text.headlines
    ? text.headlines[headlineLang] || ""
    : text.headline || "";
  const subheadlineText = text.subheadlines
    ? text.subheadlines[subheadlineLang] || ""
    : text.subheadline || "";

  document.getElementById("headline-text").value = headlineText;
  document.getElementById("headline-text").dir = isRtlLanguage(headlineLang)
    ? "rtl"
    : "ltr";
  document.getElementById("subheadline-text").dir = isRtlLanguage(
    subheadlineLang,
  )
    ? "rtl"
    : "ltr";
  document.getElementById("headline-font").value = text.headlineFont;
  updateFontPickerPreview();
  document.getElementById("headline-size").value = headlineLayout.headlineSize;
  document.getElementById("headline-color").value = text.headlineColor;
  document.getElementById("headline-weight").value = text.headlineWeight;
  // Sync text style buttons
  document.querySelectorAll("#headline-style button").forEach((btn) => {
    const style = btn.dataset.style;
    const key = "headline" + style.charAt(0).toUpperCase() + style.slice(1);
    btn.classList.toggle("active", text[key] || false);
  });
  document.querySelectorAll("#text-position button").forEach((btn) => {
    btn.classList.toggle(
      "active",
      btn.dataset.position === layoutSettings.position,
    );
  });
  document.getElementById("text-offset-y").value = layoutSettings.offsetY;
  document.getElementById("text-offset-y-value").textContent =
    formatValue(layoutSettings.offsetY) + "%";
  document.getElementById("line-height").value = layoutSettings.lineHeight;
  document.getElementById("line-height-value").textContent =
    formatValue(layoutSettings.lineHeight) + "%";
  document.getElementById("subheadline-text").value = subheadlineText;
  document.getElementById("subheadline-font").value =
    text.subheadlineFont || text.headlineFont;
  document.getElementById("subheadline-size").value =
    subheadlineLayout.subheadlineSize;
  document.getElementById("subheadline-color").value = text.subheadlineColor;
  document.getElementById("subheadline-opacity").value =
    text.subheadlineOpacity;
  document.getElementById("subheadline-opacity-value").textContent =
    formatValue(text.subheadlineOpacity) + "%";
  document.getElementById("subheadline-weight").value =
    text.subheadlineWeight || "400";
  // Sync subheadline style buttons
  document.querySelectorAll("#subheadline-style button").forEach((btn) => {
    const style = btn.dataset.style;
    const key = "subheadline" + style.charAt(0).toUpperCase() + style.slice(1);
    btn.classList.toggle("active", text[key] || false);
  });
}

function applyPositionPreset(preset) {
  const presets = {
    centered: { scale: 70, x: 50, y: 50, rotation: 0, perspective: 0 },
    "bleed-bottom": { scale: 85, x: 50, y: 120, rotation: 0, perspective: 0 },
    "bleed-top": { scale: 85, x: 50, y: -20, rotation: 0, perspective: 0 },
    "float-center": { scale: 60, x: 50, y: 50, rotation: 0, perspective: 0 },
    "tilt-left": { scale: 65, x: 50, y: 60, rotation: -8, perspective: 0 },
    "tilt-right": { scale: 65, x: 50, y: 60, rotation: 8, perspective: 0 },
    perspective: { scale: 65, x: 50, y: 50, rotation: 0, perspective: 15 },
    "float-bottom": { scale: 55, x: 50, y: 70, rotation: 0, perspective: 0 },
  };

  const p = presets[preset];
  if (!p) return;

  setScreenshotSetting("scale", p.scale);
  setScreenshotSetting("x", p.x);
  setScreenshotSetting("y", p.y);
  setScreenshotSetting("rotation", p.rotation);
  setScreenshotSetting("perspective", p.perspective);

  // Update UI controls
  document.getElementById("screenshot-scale").value = p.scale;
  document.getElementById("screenshot-scale-value").textContent =
    formatValue(p.scale) + "%";
  document.getElementById("screenshot-x").value = p.x;
  document.getElementById("screenshot-x-value").textContent =
    formatValue(p.x) + "%";
  document.getElementById("screenshot-y").value = p.y;
  document.getElementById("screenshot-y-value").textContent =
    formatValue(p.y) + "%";
  document.getElementById("screenshot-rotation").value = p.rotation;
  document.getElementById("screenshot-rotation-value").textContent =
    formatValue(p.rotation) + "°";

  updateCanvas();
}

function handleFiles(files) {
  // Process files sequentially to handle duplicates one at a time
  processFilesSequentially(
    Array.from(files).filter((f) => f.type.startsWith("image/")),
  );
}
