// Language utilities for localized screenshot management
// This file handles language detection, localized image management, and translation dialogs

// Current screenshot index for translations modal
let currentTranslationsIndex = null;

/**
 * Extract the base filename without language suffix
 * e.g., "screenshot_de.png" -> "screenshot", "image-fr.png" -> "image"
 * @param {string} filename - The filename to parse
 * @returns {string} - Base filename without language suffix and extension
 */
function getBaseFilename(filename) {
  // Remove extension
  const withoutExt = filename.replace(/\.[^.]+$/, "");

  // All supported language codes from languageFlags
  const supportedLangs = Object.keys(languageFlags);

  // Sort by length (longest first) to match pt-br before pt
  const sortedLangs = [...supportedLangs].sort((a, b) => b.length - a.length);

  for (const lang of sortedLangs) {
    // Match patterns like: _pt-br, -pt-br, _pt_br, -pt_br, _de, -de
    const escapedLang = lang.replace("-", "[-_]?");
    const pattern = new RegExp(`[_-]${escapedLang}(?:[_-][a-z]{2})?$`, "i");
    if (pattern.test(withoutExt)) {
      return withoutExt.replace(pattern, "");
    }
  }

  return withoutExt;
}

/**
 * Find an existing screenshot with a matching base filename
 * @param {string} filename - The filename to check
 * @returns {number} - Index of matching screenshot, or -1 if not found
 */
function findScreenshotByBaseFilename(filename) {
  const baseName = getBaseFilename(filename);

  for (let i = 0; i < state.screenshots.length; i++) {
    const screenshot = state.screenshots[i];
    if (!screenshot.localizedImages) continue;

    // Check each localized image's filename
    for (const lang of Object.keys(screenshot.localizedImages)) {
      const localizedName = screenshot.localizedImages[lang]?.name;
      if (localizedName && getBaseFilename(localizedName) === baseName) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Detect language code from filename
 * Supports patterns like: screenshot_de.png, screenshot-fr.png, screenshot_pt-br.png
 * @param {string} filename - The filename to parse
 * @returns {string} - Language code (e.g., 'de', 'fr', 'pt-br') or 'en' as fallback
 */
function detectLanguageFromFilename(filename) {
  // All supported language codes from languageFlags (defined in app.js)
  const supportedLangs = Object.keys(languageFlags);

  // Normalize filename for matching
  const lower = filename.toLowerCase();

  // Check for longer codes first (pt-br, zh-tw, en-gb) to avoid false matches
  const sortedLangs = [...supportedLangs].sort((a, b) => b.length - a.length);

  for (const lang of sortedLangs) {
    // Match patterns like: _pt-br., -pt-br., _pt_br., -pt_br.
    // Also: _de., -de., _DE., -DE., _de-DE., etc.
    const escapedLang = lang.replace("-", "[-_]?");
    const pattern = new RegExp(`[_-]${escapedLang}(?:[_-][a-z]{2})?\\.`, "i");
    if (pattern.test(lower)) {
      return lang;
    }
  }

  return "en"; // fallback to English
}

/**
 * Get the appropriate image for a screenshot based on current language
 * Falls back to first available language if current language has no image
 * @param {Object} screenshot - The screenshot object
 * @returns {Image|null} - The Image object to use for rendering
 */
function getScreenshotImage(screenshot) {
  if (!screenshot) return null;

  const lang = state.currentLanguage;

  // Try current language first
  if (screenshot.localizedImages?.[lang]?.image) {
    return screenshot.localizedImages[lang].image;
  }

  // Fallback to first available language in project order
  for (const l of state.projectLanguages) {
    if (screenshot.localizedImages?.[l]?.image) {
      return screenshot.localizedImages[l].image;
    }
  }

  // Fallback to any available language
  if (screenshot.localizedImages) {
    for (const l of Object.keys(screenshot.localizedImages)) {
      if (screenshot.localizedImages[l]?.image) {
        return screenshot.localizedImages[l].image;
      }
    }
  }

  // Legacy fallback for old screenshot format
  return screenshot.image || null;
}

/**
 * Get list of languages that have images for a screenshot
 * @param {Object} screenshot - The screenshot object
 * @returns {string[]} - Array of language codes that have images
 */
function getAvailableLanguagesForScreenshot(screenshot) {
  if (!screenshot?.localizedImages) return [];

  return Object.keys(screenshot.localizedImages).filter(
    (lang) => screenshot.localizedImages[lang]?.image,
  );
}

/**
 * Check if a screenshot has images for all project languages
 * @param {Object} screenshot - The screenshot object
 * @returns {boolean} - True if all project languages have images
 */
function isScreenshotComplete(screenshot) {
  if (!screenshot?.localizedImages) return false;
  if (state.projectLanguages.length === 0) return true;

  return state.projectLanguages.every(
    (lang) => screenshot.localizedImages[lang]?.image,
  );
}

/**
 * Migrate old screenshot format to new localized format
 * Moves image to localizedImages.en (or detected language)
 * @param {Object} screenshot - The screenshot object to migrate
 * @param {string} detectedLang - Optional detected language from filename
 */
function migrateScreenshotToLocalized(screenshot, detectedLang = "en") {
  if (!screenshot) return;

  // Already migrated
  if (
    screenshot.localizedImages &&
    Object.keys(screenshot.localizedImages).length > 0
  ) {
    return;
  }

  // Initialize localizedImages if needed
  if (!screenshot.localizedImages) {
    screenshot.localizedImages = {};
  }

  // Move legacy image to localized storage
  if (screenshot.image) {
    screenshot.localizedImages[detectedLang] = {
      image: screenshot.image,
      src: screenshot.image.src,
      name: screenshot.name || "screenshot.png",
    };
  }
}

/**
 * Add a localized image to a screenshot
 * @param {number} screenshotIndex - Index of the screenshot
 * @param {string} lang - Language code
 * @param {Image} image - The Image object
 * @param {string} src - Data URL of the image
 * @param {string} name - Filename
 */
function addLocalizedImage(screenshotIndex, lang, image, src, name) {
  const screenshot = state.screenshots[screenshotIndex];
  if (!screenshot) return;

  if (!screenshot.localizedImages) {
    screenshot.localizedImages = {};
  }

  screenshot.localizedImages[lang] = {
    image: image,
    src: src,
    name: name,
  };

  // Auto-add language to project if not already present
  if (!state.projectLanguages.includes(lang)) {
    addProjectLanguage(lang);
  }

  // Update displays
  updateScreenshotList();
  updateCanvas();
  saveState();
}

/**
 * Remove a localized image from a screenshot
 * @param {number} screenshotIndex - Index of the screenshot
 * @param {string} lang - Language code to remove
 */
function removeLocalizedImage(screenshotIndex, lang) {
  const screenshot = state.screenshots[screenshotIndex];
  if (!screenshot?.localizedImages?.[lang]) return;

  delete screenshot.localizedImages[lang];

  // Update displays
  updateScreenshotList();
  updateCanvas();
  saveState();

  // Refresh modal if open
  if (currentTranslationsIndex === screenshotIndex) {
    updateScreenshotTranslationsList();
  }
}

// ==========================================
// Screenshot Translations Modal Functions
// ==========================================

/**
 * Open the screenshot translations modal for a specific screenshot
 * @param {number} index - Index of the screenshot to manage
 */
function openScreenshotTranslationsModal(index) {
  currentTranslationsIndex = index;
  const modal = document.getElementById("screenshot-translations-modal");
  if (!modal) return;

  modal.classList.add("visible");
  updateScreenshotTranslationsList();
}

/**
 * Close the screenshot translations modal
 */
function closeScreenshotTranslationsModal() {
  currentTranslationsIndex = null;
  const modal = document.getElementById("screenshot-translations-modal");
  if (modal) {
    modal.classList.remove("visible");
  }
}

/**
 * Update the list of languages in the translations modal
 */
function updateScreenshotTranslationsList() {
  const container = document.getElementById("screenshot-translations-list");
  if (!container || currentTranslationsIndex === null) return;

  const screenshot = state.screenshots[currentTranslationsIndex];
  if (!screenshot) return;

  container.innerHTML = "";

  state.projectLanguages.forEach((lang) => {
    const hasImage = screenshot.localizedImages?.[lang]?.image;
    const flag = languageFlags[lang] || "🏳️";
    const name = languageNames[lang] || lang.toUpperCase();

    const item = document.createElement("div");
    item.className = "translation-item" + (hasImage ? " has-image" : "");

    if (hasImage) {
      // Create thumbnail
      const thumbCanvas = document.createElement("canvas");
      thumbCanvas.width = 40;
      thumbCanvas.height = 86;
      const ctx = thumbCanvas.getContext("2d");
      const img = screenshot.localizedImages[lang].image;
      const scale = Math.min(40 / img.width, 86 / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (40 - w) / 2, (86 - h) / 2, w, h);

      item.innerHTML = `
                <div class="translation-thumb">
                    <img src="${thumbCanvas.toDataURL()}" alt="${name}">
                </div>
                <div class="translation-info">
                    <span class="flag">${flag}</span>
                    <span class="name">${name}</span>
                </div>
                <button class="translation-remove" title="Remove ${name} screenshot">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            `;

      item
        .querySelector(".translation-remove")
        .addEventListener("click", () => {
          removeLocalizedImage(currentTranslationsIndex, lang);
        });
    } else {
      item.innerHTML = `
                <div class="translation-thumb empty">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                    </svg>
                </div>
                <div class="translation-info">
                    <span class="flag">${flag}</span>
                    <span class="name">${name}</span>
                </div>
                <button class="translation-upload" title="Upload ${name} screenshot">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    Upload
                </button>
            `;

      item
        .querySelector(".translation-upload")
        .addEventListener("click", () => {
          uploadScreenshotForLanguage(lang);
        });
    }

    container.appendChild(item);
  });
}

/**
 * Trigger file upload for a specific language
 * @param {string} lang - Language code to upload for
 */
function uploadScreenshotForLanguage(lang) {
  const input = document.getElementById("translation-file-input");
  if (!input) return;

  // Store the target language
  input.dataset.targetLang = lang;
  input.click();
}

/**
 * Handle file selection for translation upload
 * @param {Event} event - The change event from file input
 */
function handleTranslationFileSelect(event) {
  const input = event.target;
  const lang = input.dataset.targetLang;
  const file = input.files?.[0];

  if (!file || !lang || currentTranslationsIndex === null) {
    input.value = "";
    return;
  }

  if (!file.type.startsWith("image/")) {
    input.value = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      addLocalizedImage(
        currentTranslationsIndex,
        lang,
        img,
        e.target.result,
        file.name,
      );
      updateScreenshotTranslationsList();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  input.value = "";
}

// ==========================================
// Export Language Dialog Functions
// ==========================================

/**
 * Show export language choice dialog
 * @param {Function} callback - Function to call with choice ('current' or 'all')
 */
function showExportLanguageDialog(callback) {
  const modal = document.getElementById("export-language-modal");
  if (!modal) {
    // Fallback if modal doesn't exist
    callback("current");
    return;
  }

  // Store callback for later
  window._exportLanguageCallback = callback;

  // Update current language display
  const currentLangDisplay = document.getElementById("export-current-lang");
  if (currentLangDisplay) {
    const flag = languageFlags[state.currentLanguage] || "🏳️";
    const name =
      languageNames[state.currentLanguage] ||
      state.currentLanguage.toUpperCase();
    currentLangDisplay.textContent = `${flag} ${name}`;
  }

  modal.classList.add("visible");
}

/**
 * Close export language dialog and execute callback
 * @param {string} choice - 'current' or 'all'
 */
function closeExportLanguageDialog(choice) {
  const modal = document.getElementById("export-language-modal");
  if (modal) {
    modal.classList.remove("visible");
  }

  if (window._exportLanguageCallback && choice) {
    window._exportLanguageCallback(choice);
    window._exportLanguageCallback = null;
  }
}

// ==========================================
// Duplicate Screenshot Dialog Functions
// ==========================================

// Queue for pending duplicate resolution
let duplicateQueue = [];
let currentDuplicateResolve = null;

/**
 * Show duplicate screenshot dialog
 * @param {Object} params - Parameters for the dialog
 * @param {number} params.existingIndex - Index of existing screenshot
 * @param {string} params.detectedLang - Detected language of new file
 * @param {Image} params.newImage - New image object
 * @param {string} params.newSrc - Data URL of new image
 * @param {string} params.newName - Filename of new file
 * @returns {Promise<string>} - User choice: 'replace', 'create', or 'ignore'
 */
function showDuplicateDialog(params) {
  return new Promise((resolve) => {
    currentDuplicateResolve = resolve;

    const modal = document.getElementById("duplicate-screenshot-modal");
    if (!modal) {
      resolve("create"); // fallback
      return;
    }

    const screenshot = state.screenshots[params.existingIndex];
    const existingThumb = document.getElementById("duplicate-existing-thumb");
    const newThumb = document.getElementById("duplicate-new-thumb");
    const existingName = document.getElementById("duplicate-existing-name");
    const newName = document.getElementById("duplicate-new-name");
    const langNameEl = document.getElementById("duplicate-lang-name");

    // Get existing thumbnail for the specific language being replaced
    const existingLangImg =
      screenshot.localizedImages?.[params.detectedLang]?.image;
    if (existingThumb) {
      if (existingLangImg) {
        existingThumb.innerHTML = `<img src="${existingLangImg.src}" alt="Existing">`;
      } else {
        // No existing image for this language - show empty placeholder
        existingThumb.innerHTML = `
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="color: var(--text-secondary); opacity: 0.5;">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <path d="M21 15l-5-5L5 21"/>
                    </svg>
                `;
      }
    }

    // Set new thumbnail
    if (newThumb && params.newImage) {
      newThumb.innerHTML = `<img src="${params.newSrc}" alt="New">`;
    }

    // Set filenames
    if (existingName) {
      const existingLangName =
        screenshot.localizedImages?.[params.detectedLang]?.name;
      if (existingLangName) {
        existingName.textContent = existingLangName;
      } else {
        // Show that no image exists for this language yet
        const flag = languageFlags[params.detectedLang] || "🏳️";
        existingName.textContent = `No ${flag} image`;
      }
    }
    if (newName) {
      newName.textContent = params.newName;
    }

    // Set language name in replace description
    if (langNameEl) {
      const flag = languageFlags[params.detectedLang] || "🏳️";
      const name =
        languageNames[params.detectedLang] || params.detectedLang.toUpperCase();
      langNameEl.textContent = `${flag} ${name}`;
    }

    // Store params for handlers
    modal.dataset.existingIndex = params.existingIndex;
    modal.dataset.detectedLang = params.detectedLang;
    window._duplicateNewImage = params.newImage;
    window._duplicateNewSrc = params.newSrc;
    window._duplicateNewName = params.newName;

    modal.classList.add("visible");
  });
}

/**
 * Close duplicate dialog with a choice
 * @param {string} choice - 'replace', 'create', or 'ignore'
 */
function closeDuplicateDialog(choice) {
  const modal = document.getElementById("duplicate-screenshot-modal");
  if (modal) {
    modal.classList.remove("visible");
  }

  if (currentDuplicateResolve) {
    currentDuplicateResolve(choice);
    currentDuplicateResolve = null;
  }

  // Clean up stored data
  window._duplicateNewImage = null;
  window._duplicateNewSrc = null;
  window._duplicateNewName = null;
}

/**
 * Initialize duplicate dialog event listeners
 */
function initDuplicateDialogListeners() {
  const replaceBtn = document.getElementById("duplicate-replace");
  const createBtn = document.getElementById("duplicate-create-new");
  const ignoreBtn = document.getElementById("duplicate-ignore");

  if (replaceBtn) {
    replaceBtn.addEventListener("click", () => closeDuplicateDialog("replace"));
  }
  if (createBtn) {
    createBtn.addEventListener("click", () => closeDuplicateDialog("create"));
  }
  if (ignoreBtn) {
    ignoreBtn.addEventListener("click", () => closeDuplicateDialog("ignore"));
  }
}

// ==========================================
// Autoshot ZIP Import Functions
// ==========================================

/**
 * Determine if a device name represents a phone or tablet.
 * @param {string} deviceName - e.g. 'iphone_13_pro_max', 'ipad_pro_11_inches'
 * @returns {'phone'|'tablet'}
 */
function getDeviceType(deviceName) {
  const d = deviceName.toLowerCase();
  // autoshot simplified naming convention: 'big' = tablet, 'small' = phone
  if (d === "tablet") return "tablet";
  if (d === "small") return "phone";
  if (
    d.includes("ipad") ||
    d.includes("galaxy_tab") ||
    d.includes("pixel_tablet") ||
    d.includes("mediapad") ||
    d.includes("tab_s") ||
    d.includes("nexus_9") ||
    d.includes("nexus_7") ||
    d.includes("kindle") ||
    d.includes("surface") ||
    d.includes("pixel_c") ||
    d.includes("lenovo_tab") ||
    d.includes("xiaomi_pad") ||
    d.includes("amazon_fire") ||
    d.includes("fire_hd") ||
    d.includes("realme_pad") ||
    d.includes("huawei_m_pad") ||
    d.startsWith("sm_t")
  ) {
    return "tablet";
  }
  return "phone";
}

/**
 * Normalize an autoshot locale string to a BCP-47 language code used by this app.
 * autoshot uses underscore-separated codes like 'en_us', 'fr_fr', 'pt_br', 'ar'.
 * We keep the 2-letter lang and optionally the region when it matters (pt-br, zh-tw).
 * @param {string} localePart - e.g. 'en_us', 'ar', 'pt_br', 'zh_tw'
 * @returns {string} - e.g. 'en', 'ar', 'pt-br', 'zh-tw'
 */
function normalizeAutoshotLocale(localePart) {
  const lower = localePart.toLowerCase().replace("_", "-");
  // Special cases where region matters
  const keepRegion = ["pt-br", "zh-tw", "zh-hk", "en-gb", "es-mx", "fr-ca"];
  if (keepRegion.includes(lower)) return lower;
  // Otherwise just take the 2-letter lang
  return lower.split("-")[0];
}

/**
 * Parse a single autoshot output filename into its components.
 * Format: {device_name}_{locale}_{screen_name}.png
 * Locale is either 'xx' (2-char) or 'xx_yy' (4-char with country code).
 *
 * @param {string} filename - e.g. 'iphone_13_pro_max_en_us_home.png'
 * @returns {{ device: string, deviceType: 'phone'|'tablet', locale: string, screenName: string }|null}
 */
function parseAutoshotFilename(filename) {
  // Strip path prefix if inside a folder
  const base = filename.split("/").pop().split("\\").pop();
  // Must be a PNG
  if (!base.toLowerCase().endsWith(".png")) return null;
  const stem = base.slice(0, -4); // remove .png

  // Try 4-char locale first: device_xx_yy_screen
  const match4 = stem.match(/^(.+)_([a-z]{2}_[a-z]{2})_([^_].*)$/i);
  if (match4) {
    const device = match4[1].toLowerCase();
    const locale = normalizeAutoshotLocale(match4[2]);
    const screenName = match4[3].toLowerCase();
    return { device, deviceType: getDeviceType(device), locale, screenName };
  }

  // Try 2-char locale: device_xx_screen
  const match2 = stem.match(/^(.+)_([a-z]{2})_([^_].*)$/i);
  if (match2) {
    const device = match2[1].toLowerCase();
    const locale = normalizeAutoshotLocale(match2[2]);
    const screenName = match2[3].toLowerCase();
    return { device, deviceType: getDeviceType(device), locale, screenName };
  }

  return null;
}

/**
 * Parse all entries in a JSZip object and group them by device type, screen name, and locale.
 * Returns a structured summary for the import dialog.
 *
 * @param {JSZip} zip
 * @returns {{
 *   deviceTypes: Set<'phone'|'tablet'>,
 *   screens: string[],           // sorted alphabetically
 *   locales: string[],           // sorted
 *   files: Map<string, {zipEntry, locale, device, deviceType, screenName}>
 * }}
 */
async function parseAutoshotZip(zip) {
  const result = {
    deviceTypes: new Set(),
    screens: [],
    locales: [],
    files: new Map(), // key: `${deviceType}:${screenName}:${locale}`
  };

  const screensSet = new Set();
  const localesSet = new Set();

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    const parsed = parseAutoshotFilename(relativePath);
    if (!parsed) return;

    result.deviceTypes.add(parsed.deviceType);
    screensSet.add(parsed.screenName);
    localesSet.add(parsed.locale);

    const key = `${parsed.deviceType}:${parsed.screenName}:${parsed.locale}`;
    // If multiple devices of same type exist, just keep the first encountered
    if (!result.files.has(key)) {
      result.files.set(key, { zipEntry, ...parsed });
    }
  });

  result.screens = [...screensSet].sort();
  result.locales = [...localesSet].sort();
  return result;
}

// Holds parsed ZIP data while the import dialog is open
let _autoshotImportData = null;
let _autoshotImportZip = null;
let _autoshotSelectedTypes = new Set(["phone"]); // Set<'phone'|'tablet'>

/**
 * Entry point: called when user selects a .zip file for autoshot import.
 * Parses the ZIP, then shows the confirmation dialog.
 * @param {File} zipFile
 */
async function importAutoshotZip(zipFile) {
  if (!window.JSZip) {
    await showAppAlert(
      "JSZip is not loaded. Please reload the page and try again.",
      "error",
    );
    return;
  }

  let zip;
  try {
    zip = await JSZip.loadAsync(zipFile);
  } catch (e) {
    await showAppAlert(
      "Could not read ZIP file. Make sure it is a valid autoshot export.",
      "error",
    );
    return;
  }

  const parsed = await parseAutoshotZip(zip);

  if (parsed.screens.length === 0) {
    await showAppAlert(
      "No autoshot screenshots found in this ZIP.\n\nExpected filenames like:\n  iphone_13_pro_max_en_us_home.png",
      "info",
    );
    return;
  }

  _autoshotImportData = parsed;
  _autoshotImportZip = zip;
  _autoshotSelectedTypes = new Set(
    [...parsed.deviceTypes].filter((t) => t === "phone" || t === "tablet"),
  );

  showAutoshotImportModal();
}

/**
 * Build and show the autoshot import modal with the parsed data.
 */
function showAutoshotImportModal() {
  const modal = document.getElementById("autoshot-import-modal");
  if (!modal) return;

  const parsed = _autoshotImportData;

  // Device type selector — show checkboxes; disable types not in the ZIP
  const deviceSelectEl = document.getElementById("autoshot-device-select");
  if (deviceSelectEl) {
    deviceSelectEl.style.display = "flex";
    deviceSelectEl
      .querySelectorAll(".autoshot-device-checkbox")
      .forEach((cb) => {
        const type = cb.dataset.type;
        const hasType = parsed.deviceTypes.has(type);
        cb.disabled = !hasType;
        cb.checked = _autoshotSelectedTypes.has(type) && hasType;
        cb.closest("label").title = hasType
          ? `Import ${type} screenshots`
          : `No ${type} screenshots found in this ZIP`;
        cb.closest("label").style.opacity = hasType ? "" : "0.4";
      });
  }

  _renderAutoshotMappingAndWarning();

  // Detected languages list
  const langsEl = document.getElementById("autoshot-langs-list");
  if (langsEl) {
    langsEl.innerHTML = parsed.locales
      .map((lang) => {
        const flag =
          (typeof languageFlags !== "undefined" && languageFlags[lang]) || "🏳️";
        const name =
          (typeof languageNames !== "undefined" && languageNames[lang]) ||
          lang.toUpperCase();
        return `<span class="autoshot-lang-tag">${flag} ${name}</span>`;
      })
      .join("");
  }

  modal.classList.add("visible");
}

function _renderAutoshotMappingAndWarning() {
  const parsed = _autoshotImportData;

  const typesToShow = [..._autoshotSelectedTypes].filter((t) =>
    parsed.deviceTypes.has(t),
  );

  const mappingEl = document.getElementById("autoshot-mapping-list");
  if (mappingEl) {
    const rows = [];
    for (const deviceType of typesToShow) {
      const deviceScreens = parsed.screens.filter((screenName) =>
        [...parsed.files.keys()].some((k) =>
          k.startsWith(`${deviceType}:${screenName}:`),
        ),
      );
      if (deviceScreens.length === 0) continue;
      if (typesToShow.length > 1) {
        rows.push(
          `<div class="autoshot-mapping-category-header">${deviceType === "phone" ? "📱 Phone" : "📲 Tablet"} (${deviceScreens.length} screens)</div>`,
        );
      }
      deviceScreens.forEach((screenName) => {
        const existingIdx = state.screenshots.findIndex(
          (s) =>
            s.autoshotScreenName === screenName &&
            (typeof getCategoryOf === "function"
              ? getCategoryOf(s)
              : s.category ||
                (s.deviceType === "iPad" ? "tablet" : "phone")) === deviceType,
        );
        const label =
          existingIdx !== -1
            ? `↺ Override slot ${existingIdx + 1}`
            : "✦ New slot";
        const cls =
          existingIdx !== -1
            ? "autoshot-mapping-override"
            : "autoshot-mapping-new";
        rows.push(`
          <div class="autoshot-mapping-row ${cls}">
            <span class="autoshot-screen-name">${screenName}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            <span class="autoshot-slot-label">${label}</span>
          </div>`);
      });
    }
    mappingEl.innerHTML = rows.join("");
  }

  const warningEl = document.getElementById("autoshot-import-warning");
  if (warningEl) {
    if (typesToShow.length === 0) {
      warningEl.textContent = "⚠ Select at least one device type to import.";
      warningEl.style.display = "block";
    } else {
      warningEl.style.display = "none";
    }
  }
}

function closeAutoshotImportModal() {
  const modal = document.getElementById("autoshot-import-modal");
  if (modal) modal.classList.remove("visible");
  _autoshotImportData = null;
  _autoshotImportZip = null;
}

/**
 * Execute the actual import after confirmation.
 */
async function confirmAutoshotImport() {
  const parsed = _autoshotImportData;
  const zip = _autoshotImportZip;
  const typesToImport = [..._autoshotSelectedTypes].filter((t) =>
    parsed.deviceTypes.has(t),
  );

  closeAutoshotImportModal();

  if (!parsed || !zip || typesToImport.length === 0) return;

  // Collect all screens across selected device types
  const allWork = []; // { deviceType, screenName }
  for (const deviceType of typesToImport) {
    const deviceScreens = parsed.screens.filter((screenName) =>
      [...parsed.files.keys()].some((k) =>
        k.startsWith(`${deviceType}:${screenName}:`),
      ),
    );
    deviceScreens.forEach((screenName) =>
      allWork.push({ deviceType, screenName }),
    );
  }

  // --- Phase 1: ensure a slot exists for every screen ---
  const slotMap = new Map(); // `${deviceType}:${screenName}` → flat index
  for (const { deviceType, screenName } of allWork) {
    const getCat = (s) =>
      typeof getCategoryOf === "function"
        ? getCategoryOf(s)
        : s.category || (s.deviceType === "iPad" ? "tablet" : "phone");

    let flatIndex = state.screenshots.findIndex(
      (s) => getCat(s) === deviceType && s.autoshotScreenName === screenName,
    );

    if (flatIndex === -1) {
      const normalizeText =
        typeof normalizeTextSettings === "function"
          ? normalizeTextSettings
          : (t) => t;
      state.screenshots.push({
        image: null,
        name: screenName,
        deviceType: deviceType === "tablet" ? "iPad" : "iPhone",
        category: deviceType,
        autoshotScreenName: screenName,
        localizedImages: {},
        background: JSON.parse(JSON.stringify(state.defaults.background)),
        screenshot: JSON.parse(JSON.stringify(state.defaults.screenshot)),
        text: JSON.parse(JSON.stringify(normalizeText(state.defaults.text))),
        elements: JSON.parse(JSON.stringify(state.defaults.elements || [])),
        popouts: [],
        overrides: {},
      });
      flatIndex = state.screenshots.length - 1;
    } else {
      state.screenshots[flatIndex].autoshotScreenName = screenName;
    }
    slotMap.set(`${deviceType}:${screenName}`, flatIndex);
  }

  // --- Phase 2: import images ---
  const totalOps = allWork.length * parsed.locales.length;
  let completed = 0;

  showExportProgress("Importing...", "Reading screenshots from ZIP", 0);

  for (let i = 0; i < allWork.length; i++) {
    const { deviceType, screenName } = allWork[i];
    const flatIndex = slotMap.get(`${deviceType}:${screenName}`);

    for (const locale of parsed.locales) {
      const key = `${deviceType}:${screenName}:${locale}`;
      const fileEntry = parsed.files.get(key);

      if (fileEntry) {
        try {
          const blob = await fileEntry.zipEntry.async("blob");
          const imageBlob = new Blob([blob], { type: "image/png" });
          const src = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(imageBlob);
          });
          const image = await new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          });
          const fileName = `${screenName}_${locale}.png`;
          addLocalizedImage(flatIndex, locale, image, src, fileName);
        } catch (e) {
          console.warn(`Failed to load ${key}:`, e);
        }
      }

      completed++;
      const percent = Math.round((completed / totalOps) * 90);
      showExportProgress(
        "Importing...",
        `${deviceType} · Screen ${i + 1}/${allWork.length} · ${locale}`,
        percent,
      );
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  showExportProgress("Done!", "", 100);
  await new Promise((r) => setTimeout(r, 1200));
  hideExportProgress();

  // Switch to the first imported category
  if (typeof switchToCategory === "function") {
    switchToCategory(typesToImport[0]);
  }
  updateCanvas();
  saveState();

  const langCount = parsed.locales.length;
  const phoneCount = allWork.filter((w) => w.deviceType === "phone").length;
  const tabletCount = allWork.filter((w) => w.deviceType === "tablet").length;
  const parts = [];
  if (phoneCount)
    parts.push(`${phoneCount} phone screen${phoneCount !== 1 ? "s" : ""}`);
  if (tabletCount)
    parts.push(`${tabletCount} tablet screen${tabletCount !== 1 ? "s" : ""}`);
  let successMsg = `Imported ${parts.join(" + ")} × ${langCount} language${langCount !== 1 ? "s" : ""} successfully.\n\nUse the language switcher to check each locale, then use AI Translate to fill in the text.`;
  if (tabletCount > 0 && !phoneCount) {
    const currentOutput =
      (typeof state !== "undefined" && state.outputDevice) || "";
    const isPhoneOutput =
      !currentOutput.includes("ipad") &&
      !currentOutput.includes("android-tablet");
    if (isPhoneOutput) {
      successMsg +=
        '\n\n💡 Tip: Switch your output size to iPad 12.9" or iPad 11" in the export panel for best results with tablet screenshots.';
    }
  }
  await showAppAlert(successMsg, "success");
}

/**
 * Initialize autoshot import modal event listeners (called once on DOMContentLoaded).
 */
function initAutoshotImportListeners() {
  // Device type checkboxes
  document.querySelectorAll(".autoshot-device-checkbox").forEach((cb) => {
    cb.addEventListener("change", () => {
      if (cb.checked) {
        _autoshotSelectedTypes.add(cb.dataset.type);
      } else {
        _autoshotSelectedTypes.delete(cb.dataset.type);
      }
      _renderAutoshotMappingAndWarning();
    });
  });

  const cancelBtn = document.getElementById("autoshot-import-cancel");
  if (cancelBtn) cancelBtn.addEventListener("click", closeAutoshotImportModal);

  const confirmBtn = document.getElementById("autoshot-import-confirm");
  if (confirmBtn) confirmBtn.addEventListener("click", confirmAutoshotImport);
}
