/* ===== Device helpers, settings accessors, Lucide icons, utils ===== */
/* auto-split from app.js lines 128–721 */
// ===== Device category helpers =====
function getCategoryOf(screenshot) {
  if (screenshot.category) return screenshot.category;
  // Backward compatibility: derive from deviceType
  return screenshot.deviceType === "iPad" ? "tablet" : "phone";
}

function getActiveCategoryIndices() {
  return state.screenshots.reduce((acc, s, i) => {
    if (getCategoryOf(s) === state.activeCategory) acc.push(i);
    return acc;
  }, []);
}

// Returns the flat-array index of the screenshot offset steps away in the active category
function getNeighborIndex(offset) {
  const indices = getActiveCategoryIndices();
  const pos = indices.indexOf(state.selectedIndex);
  if (pos === -1) return -1;
  const target = pos + offset;
  if (target < 0 || target >= indices.length) return -1;
  return indices[target];
}

// Returns the flat-array category neighbor of a given flat index (not using state.selectedIndex)
function getCategoryNeighborOf(flatIndex, offset) {
  const indices = getActiveCategoryIndices();
  const pos = indices.indexOf(flatIndex);
  if (pos === -1) return -1;
  const target = pos + offset;
  if (target < 0 || target >= indices.length) return -1;
  return indices[target];
}

function switchToCategory(category) {
  // Persist current output settings before switching
  state.categorySettings[state.activeCategory] = {
    outputDevice: state.outputDevice,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
  };

  state.activeCategory = category;

  // Restore the new category's output settings
  const catSet = state.categorySettings[category];
  if (catSet) {
    state.outputDevice = catSet.outputDevice;
    state.customWidth = catSet.customWidth;
    state.customHeight = catSet.customHeight;
  }

  document.querySelectorAll(".device-category-tab").forEach((t) => {
    t.classList.toggle("active", t.dataset.category === category);
  });
  // Keep selected index if already in this category, else pick first in category
  const indices = getActiveCategoryIndices();
  if (indices.length > 0 && !indices.includes(state.selectedIndex)) {
    state.selectedIndex = indices[0];
  }
  updateScreenshotList();
  syncUIWithState();
  updateGradientStopsUI();
  updateCanvas();
}

// Helper functions to get/set current screenshot settings
function getCurrentScreenshot() {
  if (state.screenshots.length === 0) return null;
  return state.screenshots[state.selectedIndex];
}

function getBackground() {
  const screenshot = getCurrentScreenshot();
  return screenshot ? screenshot.background : state.defaults.background;
}

function getScreenshotSettings() {
  const screenshot = getCurrentScreenshot();
  return screenshot ? screenshot.screenshot : state.defaults.screenshot;
}

function getText() {
  const screenshot = getCurrentScreenshot();
  if (screenshot) {
    screenshot.text = normalizeTextSettings(screenshot.text);
    return screenshot.text;
  }
  state.defaults.text = normalizeTextSettings(state.defaults.text);
  return state.defaults.text;
}

function getTextLayoutLanguage(text) {
  if (text.currentLayoutLang) return text.currentLayoutLang;
  if (text.headlineEnabled !== false) return text.currentHeadlineLang || "en";
  if (text.subheadlineEnabled) return text.currentSubheadlineLang || "en";
  return text.currentHeadlineLang || text.currentSubheadlineLang || "en";
}

function getTextLanguageSettings(text, lang) {
  if (!text.languageSettings) text.languageSettings = {};
  if (!text.languageSettings[lang]) {
    const sourceLang =
      text.currentLayoutLang ||
      text.currentHeadlineLang ||
      text.currentSubheadlineLang ||
      "en";
    const sourceSettings = text.languageSettings[sourceLang];
    text.languageSettings[lang] = {
      headlineSize: sourceSettings
        ? sourceSettings.headlineSize
        : text.headlineSize || 100,
      subheadlineSize: sourceSettings
        ? sourceSettings.subheadlineSize
        : text.subheadlineSize || 50,
      position: sourceSettings
        ? sourceSettings.position
        : text.position || "top",
      offsetY: sourceSettings
        ? sourceSettings.offsetY
        : typeof text.offsetY === "number"
          ? text.offsetY
          : 12,
      lineHeight: sourceSettings
        ? sourceSettings.lineHeight
        : text.lineHeight || 110,
    };
  }
  return text.languageSettings[lang];
}

function getEffectiveLayout(text, lang) {
  if (!text.perLanguageLayout) {
    return {
      headlineSize: text.headlineSize || 100,
      subheadlineSize: text.subheadlineSize || 50,
      position: text.position || "top",
      offsetY: typeof text.offsetY === "number" ? text.offsetY : 12,
      lineHeight: text.lineHeight || 110,
    };
  }
  return getTextLanguageSettings(text, lang);
}

function normalizeTextSettings(text) {
  const merged = JSON.parse(JSON.stringify(baseTextDefaults));
  if (text) {
    Object.assign(merged, text);
    if (text.languageSettings) {
      merged.languageSettings = JSON.parse(
        JSON.stringify(text.languageSettings),
      );
    }
  }

  merged.headlines = merged.headlines || { en: "" };
  merged.headlineLanguages = merged.headlineLanguages || ["en"];
  merged.currentHeadlineLang =
    merged.currentHeadlineLang || merged.headlineLanguages[0] || "en";
  merged.currentLayoutLang =
    merged.currentLayoutLang || merged.currentHeadlineLang || "en";

  // Ensure Arabic/RTL font fields are always present
  if (!merged.headlineArabicFont)
    merged.headlineArabicFont = "'Noto Sans Arabic', 'Segoe UI', sans-serif";
  if (!merged.subheadlineArabicFont)
    merged.subheadlineArabicFont = "'Noto Sans Arabic', 'Segoe UI', sans-serif";

  merged.subheadlines = merged.subheadlines || { en: "" };
  merged.subheadlineLanguages = merged.subheadlineLanguages || ["en"];
  merged.currentSubheadlineLang =
    merged.currentSubheadlineLang || merged.subheadlineLanguages[0] || "en";

  if (!merged.languageSettings) merged.languageSettings = {};
  const languages = new Set([
    ...merged.headlineLanguages,
    ...merged.subheadlineLanguages,
  ]);
  if (languages.size === 0) languages.add("en");
  languages.forEach((lang) => {
    getTextLanguageSettings(merged, lang);
  });

  return merged;
}

function getElements() {
  const screenshot = getCurrentScreenshot();
  return screenshot ? screenshot.elements || [] : [];
}

function getSelectedElement() {
  if (!selectedElementId) return null;
  return getElements().find((el) => el.id === selectedElementId) || null;
}

function getElementText(el) {
  if (el.texts) {
    return (
      el.texts[state.currentLanguage] ||
      el.texts["en"] ||
      Object.values(el.texts).find((v) => v) ||
      el.text ||
      ""
    );
  }
  return el.text || "";
}

function setElementProperty(id, key, value) {
  const elements = getElements();
  const el = elements.find((e) => e.id === id);
  if (el) {
    el[key] = value;
    updateCanvas();
    updateElementsList();
  }
}

// ===== Popout accessors =====
function getPopouts() {
  const screenshot = getCurrentScreenshot();
  return screenshot ? screenshot.popouts || [] : [];
}

function getSelectedPopout() {
  if (!selectedPopoutId) return null;
  return getPopouts().find((p) => p.id === selectedPopoutId) || null;
}

function setPopoutProperty(id, key, value) {
  const popouts = getPopouts();
  const p = popouts.find((po) => po.id === id);
  if (p) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let obj = p;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      p[key] = value;
    }
    updateCanvas();
    updatePopoutProperties();
  }
}

function addPopout() {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  const img = getScreenshotImage(screenshot);
  if (!img) return;
  if (!screenshot.popouts) screenshot.popouts = [];
  const p = {
    id: crypto.randomUUID(),
    cropX: 25,
    cropY: 25,
    cropWidth: 30,
    cropHeight: 30,
    x: 70,
    y: 30,
    width: 30,
    rotation: 0,
    opacity: 100,
    cornerRadius: 12,
    shadow: {
      enabled: true,
      color: "#000000",
      blur: 30,
      opacity: 40,
      x: 0,
      y: 15,
    },
    border: { enabled: true, color: "#ffffff", width: 3, opacity: 100 },
  };
  screenshot.popouts.push(p);
  selectedPopoutId = p.id;
  updateCanvas();
  updatePopoutsList();
  updatePopoutProperties();
}

function deletePopout(id) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot || !screenshot.popouts) return;
  screenshot.popouts = screenshot.popouts.filter((p) => p.id !== id);
  if (selectedPopoutId === id) selectedPopoutId = null;
  updateCanvas();
  updatePopoutsList();
  updatePopoutProperties();
}

function movePopout(id, direction) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot || !screenshot.popouts) return;
  const idx = screenshot.popouts.findIndex((p) => p.id === id);
  if (idx === -1) return;
  if (direction === "up" && idx < screenshot.popouts.length - 1) {
    [screenshot.popouts[idx], screenshot.popouts[idx + 1]] = [
      screenshot.popouts[idx + 1],
      screenshot.popouts[idx],
    ];
  } else if (direction === "down" && idx > 0) {
    [screenshot.popouts[idx], screenshot.popouts[idx - 1]] = [
      screenshot.popouts[idx - 1],
      screenshot.popouts[idx],
    ];
  }
  updateCanvas();
  updatePopoutsList();
}

function addGraphicElement(img, src, name) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  if (!screenshot.elements) screenshot.elements = [];
  const el = {
    id: crypto.randomUUID(),
    type: "graphic",
    x: 50,
    y: 50,
    width: 20,
    rotation: 0,
    opacity: 100,
    layer: "above-text",
    image: img,
    src: src,
    name: name || "Graphic",
    text: "",
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    fontSize: 60,
    fontWeight: "600",
    fontColor: "#ffffff",
    italic: false,
    frame: "none",
    frameColor: "#ffffff",
    frameScale: 100,
  };
  screenshot.elements.push(el);
  selectedElementId = el.id;
  updateCanvas();
  updateElementsList();
  updateElementProperties();
}

function addTextElement() {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  if (!screenshot.elements) screenshot.elements = [];
  const el = {
    id: crypto.randomUUID(),
    type: "text",
    x: 50,
    y: 50,
    width: 40,
    rotation: 0,
    opacity: 100,
    layer: "above-text",
    image: null,
    src: null,
    name: "Text",
    text: "Your Text",
    texts: { [state.currentLanguage]: "Your Text" },
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    fontSize: 60,
    fontWeight: "600",
    fontColor: "#ffffff",
    italic: false,
    frame: "none",
    frameColor: "#ffffff",
    frameScale: 100,
  };
  screenshot.elements.push(el);
  selectedElementId = el.id;
  updateCanvas();
  updateElementsList();
  updateElementProperties();
}

// ===== Lucide SVG loading & caching =====
const lucideSVGCache = new Map(); // name -> raw SVG text

async function fetchLucideSVG(name) {
  if (lucideSVGCache.has(name)) return lucideSVGCache.get(name);
  const url = `https://unpkg.com/lucide-static@latest/icons/${name}.svg`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Failed to fetch icon: ${name}`);
  const svgText = await resp.text();
  lucideSVGCache.set(name, svgText);
  return svgText;
}

function colorizeLucideSVG(svgText, color, strokeWidth) {
  return svgText
    .replace(/stroke="currentColor"/g, `stroke="${color}"`)
    .replace(/stroke-width="[^"]*"/g, `stroke-width="${strokeWidth}"`);
}

async function getLucideImage(name, color, strokeWidth) {
  const rawSVG = await fetchLucideSVG(name);
  const colorized = colorizeLucideSVG(rawSVG, color, strokeWidth);
  const blob = new Blob([colorized], { type: "image/svg+xml" });
  const blobURL = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = blobURL;
  });
}

async function updateIconImage(el) {
  if (el.type !== "icon") return;
  try {
    el.image = await getLucideImage(
      el.iconName,
      el.iconColor,
      el.iconStrokeWidth,
    );
    updateCanvas();
  } catch (e) {
    console.error("Failed to update icon image:", e);
  }
}

function addEmojiElement(emoji, name) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  if (!screenshot.elements) screenshot.elements = [];
  const el = {
    id: crypto.randomUUID(),
    type: "emoji",
    x: 50,
    y: 50,
    width: 15,
    rotation: 0,
    opacity: 100,
    layer: "above-text",
    emoji: emoji,
    name: name || "Emoji",
    image: null,
    src: null,
    text: "",
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    fontSize: 60,
    fontWeight: "600",
    fontColor: "#ffffff",
    italic: false,
    frame: "none",
    frameColor: "#ffffff",
    frameScale: 100,
  };
  screenshot.elements.push(el);
  selectedElementId = el.id;
  updateCanvas();
  updateElementsList();
  updateElementProperties();
}

async function addIconElement(iconName) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  if (!screenshot.elements) screenshot.elements = [];
  const el = {
    id: crypto.randomUUID(),
    type: "icon",
    x: 50,
    y: 50,
    width: 15,
    rotation: 0,
    opacity: 100,
    layer: "above-text",
    iconName: iconName,
    iconColor: "#ffffff",
    iconStrokeWidth: 2,
    iconShadow: {
      enabled: false,
      color: "#000000",
      blur: 20,
      opacity: 40,
      x: 0,
      y: 10,
    },
    image: null,
    src: null,
    name: iconName,
    text: "",
    font: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
    fontSize: 60,
    fontWeight: "600",
    fontColor: "#ffffff",
    italic: false,
    frame: "none",
    frameColor: "#ffffff",
    frameScale: 100,
  };
  screenshot.elements.push(el);
  selectedElementId = el.id;
  updateElementsList();
  updateElementProperties();
  // Async: fetch icon SVG
  try {
    el.image = await getLucideImage(iconName, el.iconColor, el.iconStrokeWidth);
    updateCanvas();
  } catch (e) {
    console.error("Failed to load icon:", e);
  }
  updateCanvas();
}

function deleteElement(id) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot || !screenshot.elements) return;
  screenshot.elements = screenshot.elements.filter((e) => e.id !== id);
  if (selectedElementId === id) selectedElementId = null;
  updateCanvas();
  updateElementsList();
  updateElementProperties();
}

function moveElementLayer(id, direction) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot || !screenshot.elements) return;
  const idx = screenshot.elements.findIndex((e) => e.id === id);
  if (idx === -1) return;
  if (direction === "up" && idx < screenshot.elements.length - 1) {
    [screenshot.elements[idx], screenshot.elements[idx + 1]] = [
      screenshot.elements[idx + 1],
      screenshot.elements[idx],
    ];
  } else if (direction === "down" && idx > 0) {
    [screenshot.elements[idx], screenshot.elements[idx - 1]] = [
      screenshot.elements[idx - 1],
      screenshot.elements[idx],
    ];
  }
  updateCanvas();
  updateElementsList();
}

// Format number to at most 1 decimal place
function formatValue(num) {
  const rounded = Math.round(num * 10) / 10;
  return Number.isInteger(rounded) ? rounded.toString() : rounded.toFixed(1);
}

function setBackground(key, value) {
  const screenshot = getCurrentScreenshot();
  if (screenshot) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let obj = screenshot.background;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      screenshot.background[key] = value;
    }
  }
}

function setScreenshotSetting(key, value) {
  const screenshot = getCurrentScreenshot();
  if (screenshot) {
    if (key.includes(".")) {
      const parts = key.split(".");
      let obj = screenshot.screenshot;
      for (let i = 0; i < parts.length - 1; i++) {
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = value;
    } else {
      screenshot.screenshot[key] = value;
    }
  }
}

function setTextSetting(key, value) {
  const screenshot = getCurrentScreenshot();
  if (screenshot) {
    screenshot.text[key] = value;
  }
}

function setCurrentScreenshotAsDefault() {
  const screenshot = getCurrentScreenshot();
  if (screenshot) {
    state.defaults.background = JSON.parse(
      JSON.stringify(screenshot.background),
    );
    state.defaults.screenshot = JSON.parse(
      JSON.stringify(screenshot.screenshot),
    );
    state.defaults.text = JSON.parse(JSON.stringify(screenshot.text));
  }
}
