/* ===== Device dims, IndexedDB, custom fonts, export/import, project CRUD, save/load state ===== */
/* auto-split from app.js lines 2554–3673 */
// Device dimensions
const deviceDimensions = {
  "iphone-6.9": { width: 1320, height: 2868 },
  "iphone-6.7": { width: 1290, height: 2796 },
  "iphone-6.5": { width: 1284, height: 2778 },
  "iphone-5.5": { width: 1242, height: 2208 },
  "ipad-12.9": { width: 2048, height: 2732 },
  "ipad-11": { width: 1668, height: 2388 },
  "android-phone": { width: 1080, height: 1920 },
  "android-phone-hd": { width: 1440, height: 2560 },
  "android-tablet-7": { width: 1200, height: 1920 },
  "android-tablet-10": { width: 1600, height: 2560 },
  "web-og": { width: 1200, height: 630 },
  "web-twitter": { width: 1200, height: 675 },
  "web-hero": { width: 1920, height: 1080 },
  "web-feature": { width: 1024, height: 500 },
};

// DOM elements
const canvas = document.getElementById("preview-canvas");
const ctx = canvas.getContext("2d");
const canvasLeft = document.getElementById("preview-canvas-left");
const ctxLeft = canvasLeft.getContext("2d");
const canvasRight = document.getElementById("preview-canvas-right");
const ctxRight = canvasRight.getContext("2d");
const canvasFarLeft = document.getElementById("preview-canvas-far-left");
const ctxFarLeft = canvasFarLeft.getContext("2d");
const canvasFarRight = document.getElementById("preview-canvas-far-right");
const ctxFarRight = canvasFarRight.getContext("2d");
const sidePreviewLeft = document.getElementById("side-preview-left");
const sidePreviewRight = document.getElementById("side-preview-right");
const sidePreviewFarLeft = document.getElementById("side-preview-far-left");
const sidePreviewFarRight = document.getElementById("side-preview-far-right");
const previewStrip = document.querySelector(".preview-strip");
const canvasWrapper = document.getElementById("canvas-wrapper");

let isSliding = false;
let skipSidePreviewRender = false; // Flag to skip re-rendering side previews after pre-render

// Two-finger horizontal swipe to navigate between screenshots
let swipeAccumulator = 0;
const SWIPE_THRESHOLD = 50; // Minimum accumulated delta to trigger navigation

// Prevent browser back/forward gesture on the entire canvas area
canvasWrapper.addEventListener(
  "wheel",
  (e) => {
    // Prevent horizontal scroll from triggering browser back/forward
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
    }
  },
  { passive: false },
);

previewStrip.addEventListener(
  "wheel",
  (e) => {
    // Only handle horizontal scrolling (two-finger swipe on trackpad)
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;

    e.preventDefault();
    e.stopPropagation();

    if (isSliding) return;
    if (state.screenshots.length <= 1) return;

    swipeAccumulator += e.deltaX;

    if (swipeAccumulator > SWIPE_THRESHOLD) {
      const nextIndex = getNeighborIndex(1);
      if (nextIndex >= 0) slideToScreenshot(nextIndex, "right");
      swipeAccumulator = 0;
    } else if (swipeAccumulator < -SWIPE_THRESHOLD) {
      const prevIndex = getNeighborIndex(-1);
      if (prevIndex >= 0) slideToScreenshot(prevIndex, "left");
      swipeAccumulator = 0;
    }
  },
  { passive: false },
);
let suppressSwitchModelUpdate = false; // Flag to suppress updateCanvas from switchPhoneModel
const fileInput = document.getElementById("file-input");
const screenshotList = document.getElementById("screenshot-list");
const noScreenshot = document.getElementById("no-screenshot");

// IndexedDB for larger storage (can store hundreds of MB vs localStorage's 5-10MB)
let db = null;
const DB_NAME = "AppStoreScreenshotGenerator";
const DB_VERSION = 3;
const PROJECTS_STORE = "projects";
const META_STORE = "meta";
const FONTS_STORE = "fonts";

let currentProjectId = "default";
let projects = [{ id: "default", name: "Default Project", screenshotCount: 0 }];

let _saveFeedbackTimer = null;
let _saveFeedbackHideTimer = null;

function showSaveFeedback() {
  // Debounce: only show "Saved ✓" after saves have settled (500ms of no further saves)
  clearTimeout(_saveFeedbackTimer);
  _saveFeedbackTimer = setTimeout(() => {
    const el = document.getElementById("save-status");
    if (el) {
      el.textContent = "Saved ✓";
      el.classList.add("saved");
      clearTimeout(_saveFeedbackHideTimer);
      _saveFeedbackHideTimer = setTimeout(() => {
        el.textContent = "Auto-saved";
        el.classList.remove("saved");
      }, 2000);
    }
  }, 500);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
        // Continue without database
        resolve(null);
      };

      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = event.target.result;

        // Delete old store if exists (from version 1)
        if (database.objectStoreNames.contains("state")) {
          database.deleteObjectStore("state");
        }

        // Create projects store
        if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
          database.createObjectStore(PROJECTS_STORE, { keyPath: "id" });
        }

        // Create meta store for project list and current project
        if (!database.objectStoreNames.contains(META_STORE)) {
          database.createObjectStore(META_STORE, { keyPath: "key" });
        }

        // Create fonts store for custom uploaded fonts
        if (!database.objectStoreNames.contains(FONTS_STORE)) {
          database.createObjectStore(FONTS_STORE, { keyPath: "name" });
        }
      };

      request.onblocked = () => {
        console.warn("Database upgrade blocked. Please close other tabs.");
        resolve(null);
      };
    } catch (e) {
      console.error("Failed to open IndexedDB:", e);
      resolve(null);
    }
  });
}

// ─── Custom Fonts ────────────────────────────────────────────────────────────

async function loadCustomFonts() {
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([FONTS_STORE], "readonly");
      const store = transaction.objectStore(FONTS_STORE);
      const request = store.getAll();

      request.onsuccess = async () => {
        const fonts = request.result || [];
        for (const font of fonts) {
          try {
            const fontFace = new FontFace(font.name, `url(${font.dataURL})`);
            const loaded = await fontFace.load();
            document.fonts.add(loaded);
            if (!googleFonts.custom.some((f) => f.name === font.name)) {
              googleFonts.custom.push({
                name: font.name,
                value: `'${font.name}', sans-serif`,
              });
            }
            googleFonts.loaded.add(font.name);
          } catch (e) {
            console.error("Failed to load custom font:", font.name, e);
          }
        }
        resolve();
      };
      request.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

async function saveCustomFont(name, arrayBuffer, mimeType) {
  // Load font immediately via FontFace API
  const fontFace = new FontFace(name, arrayBuffer);
  const loaded = await fontFace.load();
  document.fonts.add(loaded);

  // Convert ArrayBuffer to base64 dataURL for storage
  const uint8 = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < uint8.length; i++)
    binary += String.fromCharCode(uint8[i]);
  const base64 = btoa(binary);
  const dataURL = `data:${mimeType || "font/truetype"};base64,${base64}`;

  // Update in-memory list (replace if name already exists)
  googleFonts.custom = googleFonts.custom.filter((f) => f.name !== name);
  googleFonts.custom.push({ name, value: `'${name}', sans-serif` });
  googleFonts.loaded.add(name);

  // Persist to IndexedDB
  if (db) {
    const transaction = db.transaction([FONTS_STORE], "readwrite");
    transaction
      .objectStore(FONTS_STORE)
      .put({ name, dataURL, mimeType: mimeType || "font/truetype" });
  }
}

function deleteCustomFont(name) {
  googleFonts.custom = googleFonts.custom.filter((f) => f.name !== name);
  googleFonts.loaded.delete(name);
  if (db) {
    const transaction = db.transaction([FONTS_STORE], "readwrite");
    transaction.objectStore(FONTS_STORE).delete(name);
  }
}

// ─── Export / Import Project ─────────────────────────────────────────────────

async function exportProject() {
  if (!db) {
    await showAppAlert("Database not available", "error");
    return;
  }
  return new Promise((resolve) => {
    const transaction = db.transaction([PROJECTS_STORE], "readonly");
    const store = transaction.objectStore(PROJECTS_STORE);
    const request = store.get(currentProjectId);

    request.onsuccess = () => {
      const projectData = request.result;
      if (!projectData) {
        showAppAlert("Could not read project data", "error");
        resolve();
        return;
      }
      const currentProject = projects.find((p) => p.id === currentProjectId);
      const exportData = {
        exportVersion: 1,
        exportedAt: new Date().toISOString(),
        projectName: currentProject?.name || "Project",
        data: projectData,
      };
      const blob = new Blob([JSON.stringify(exportData)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(currentProject?.name || "project").replace(/[^a-z0-9_\-]/gi, "_")}.autoshot`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    };
    request.onerror = () => {
      showAppAlert("Failed to export project", "error");
      resolve();
    };
  });
}

async function importProject(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        let projectData, projectName;

        if (parsed.exportVersion && parsed.data) {
          projectData = parsed.data;
          projectName = parsed.projectName || "Imported Project";
        } else if (parsed.screenshots) {
          projectData = parsed;
          projectName = "Imported Project";
        } else {
          await showAppAlert("Invalid or unrecognized project file", "error");
          resolve();
          return;
        }

        const newId = "project_" + Date.now();
        projectData.id = newId;
        projects.push({
          id: newId,
          name: projectName + " (Imported)",
          screenshotCount: projectData.screenshots?.length || 0,
        });
        saveProjectsMeta();

        const transaction = db.transaction([PROJECTS_STORE], "readwrite");
        transaction.objectStore(PROJECTS_STORE).put(projectData);
        transaction.oncomplete = async () => {
          await switchProject(newId);
          updateProjectSelector();
          resolve();
        };
        transaction.onerror = async () => {
          await showAppAlert("Failed to save imported project", "error");
          resolve();
        };
      } catch (err) {
        await showAppAlert("Failed to import project: " + err.message, "error");
        resolve();
      }
    };
    reader.onerror = async () => {
      await showAppAlert("Failed to read file", "error");
      resolve();
    };
    reader.readAsText(file);
  });
}

// Load project list and current project
async function loadProjectsMeta() {
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([META_STORE], "readonly");
      const store = transaction.objectStore(META_STORE);

      const projectsReq = store.get("projects");
      const currentReq = store.get("currentProject");

      transaction.oncomplete = () => {
        if (projectsReq.result) {
          projects = projectsReq.result.value;
        }
        if (currentReq.result) {
          currentProjectId = currentReq.result.value;
        }
        updateProjectSelector();
        resolve();
      };

      transaction.onerror = () => resolve();
    } catch (e) {
      resolve();
    }
  });
}

// Save project list and current project
function saveProjectsMeta() {
  if (!db) return;

  try {
    const transaction = db.transaction([META_STORE], "readwrite");
    const store = transaction.objectStore(META_STORE);
    store.put({ key: "projects", value: projects });
    store.put({ key: "currentProject", value: currentProjectId });
  } catch (e) {
    console.error("Error saving projects meta:", e);
  }
}

// Update project selector dropdown
function updateProjectSelector() {
  const menu = document.getElementById("project-menu");
  menu.innerHTML = "";

  // Find current project
  const currentProject =
    projects.find((p) => p.id === currentProjectId) || projects[0];

  // Update trigger display - always use actual state for current project
  document.getElementById("project-trigger-name").textContent =
    currentProject.name;
  const count = state.screenshots.length;
  document.getElementById("project-trigger-meta").textContent =
    `${count} screenshot${count !== 1 ? "s" : ""}`;

  // Build menu options
  projects.forEach((project) => {
    const option = document.createElement("div");
    option.className =
      "project-option" + (project.id === currentProjectId ? " selected" : "");
    option.dataset.projectId = project.id;

    const screenshotCount =
      project.id === currentProjectId
        ? state.screenshots.length
        : project.screenshotCount || 0;

    option.innerHTML = `
            <span class="project-option-name">${project.name}</span>
            <span class="project-option-meta">${screenshotCount} screenshot${screenshotCount !== 1 ? "s" : ""}</span>
        `;

    option.addEventListener("click", (e) => {
      e.stopPropagation();
      if (project.id !== currentProjectId) {
        switchProject(project.id);
      }
      document.getElementById("project-dropdown").classList.remove("open");
    });

    menu.appendChild(option);
  });
}

// Initialize
async function init() {
  try {
    await openDatabase();
    await loadProjectsMeta();
    await loadCustomFonts();
    await loadState();
    syncUIWithState();
    updateCanvas();
  } catch (e) {
    console.error("Initialization error:", e);
    // Continue with defaults
    syncUIWithState();
    updateCanvas();
  }
}

// Set up event listeners immediately (don't wait for async init)
function initSync() {
  setupEventListeners();
  setupElementEventListeners();
  setupPopoutEventListeners();
  initFontPicker();
  updateGradientStopsUI();
  updateCanvas();

  // Save button: immediate save with visual feedback
  document.getElementById("save-btn").addEventListener("click", () => {
    saveState();
    const btn = document.getElementById("save-btn");
    const el = document.getElementById("save-status");
    btn.classList.add("saved");
    clearTimeout(_saveFeedbackTimer);
    clearTimeout(_saveFeedbackHideTimer);
    if (el) {
      el.textContent = "Saved ✓";
      el.classList.add("saved");
    }
    _saveFeedbackHideTimer = setTimeout(() => {
      btn.classList.remove("saved");
      if (el) {
        el.textContent = "Auto-saved";
        el.classList.remove("saved");
      }
    }, 2000);
  });

  // Then load saved data asynchronously
  init();
}

// Save state to IndexedDB for current project
function saveState() {
  if (!db) return;

  // Convert screenshots to base64 for storage, including per-screenshot settings and localized images
  const screenshotsToSave = state.screenshots.map((s) => {
    // Save localized images (without Image objects, just src/name)
    const localizedImages = {};
    if (s.localizedImages) {
      Object.keys(s.localizedImages).forEach((lang) => {
        const langData = s.localizedImages[lang];
        if (langData?.src) {
          localizedImages[lang] = {
            src: langData.src,
            name: langData.name,
          };
        }
      });
    }

    return {
      src: s.image?.src || "", // Legacy compatibility
      name: s.name,
      deviceType: s.deviceType,
      category: getCategoryOf(s),
      autoshotScreenName: s.autoshotScreenName || null,
      localizedImages: localizedImages,
      background: s.background,
      screenshot: s.screenshot,
      text: s.text,
      elements: (s.elements || []).map((el) => ({
        ...el,
        image: undefined, // Don't serialize Image objects
      })),
      popouts: s.popouts || [],
      overrides: s.overrides,
    };
  });

  // Always keep categorySettings in sync with the currently active category before saving
  state.categorySettings[state.activeCategory] = {
    outputDevice: state.outputDevice,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
  };

  const stateToSave = {
    id: currentProjectId,
    formatVersion: 2, // Version 2: new 3D positioning formula
    screenshots: screenshotsToSave,
    selectedIndex: state.selectedIndex,
    activeCategory: state.activeCategory,
    outputDevice: state.outputDevice,
    customWidth: state.customWidth,
    customHeight: state.customHeight,
    categorySettings: state.categorySettings,
    currentLanguage: state.currentLanguage,
    projectLanguages: state.projectLanguages,
    defaults: state.defaults,
  };

  // Update screenshot count in project metadata
  const project = projects.find((p) => p.id === currentProjectId);
  if (project) {
    project.screenshotCount = state.screenshots.length;
    saveProjectsMeta();
  }

  try {
    const transaction = db.transaction([PROJECTS_STORE], "readwrite");
    const store = transaction.objectStore(PROJECTS_STORE);
    store.put(stateToSave);
    showSaveFeedback();
  } catch (e) {
    console.error("Error saving state:", e);
  }
}

// Migrate 3D positions from old formula to new formula
// Old: xOffset = ((x-50)/50)*2, yOffset = -((y-50)/50)*3
// New: xOffset = ((x-50)/50)*(1-scale)*0.9, yOffset = -((y-50)/50)*(1-scale)*2
function migrate3DPosition(screenshotSettings) {
  if (!screenshotSettings?.use3D) return; // Only migrate 3D screenshots

  const scale = (screenshotSettings.scale || 70) / 100;
  const oldX = screenshotSettings.x ?? 50;
  const oldY = screenshotSettings.y ?? 50;

  // Convert old position to new position that produces same visual offset
  // newX = 50 + (oldX - 50) * oldFactor / newFactor
  const xFactor = 2 / ((1 - scale) * 0.9);
  const yFactor = 3 / ((1 - scale) * 2);

  screenshotSettings.x = Math.max(0, Math.min(100, 50 + (oldX - 50) * xFactor));
  screenshotSettings.y = Math.max(0, Math.min(100, 50 + (oldY - 50) * yFactor));
}

// Reconstruct Image objects for graphic/icon elements from saved data
function reconstructElementImages(elements) {
  if (!elements || !Array.isArray(elements)) return [];
  return elements.map((el) => {
    const restored = { ...el };
    if (el.type === "graphic" && el.src) {
      const img = new Image();
      img.src = el.src;
      restored.image = img;
    } else if (el.type === "icon" && el.iconName) {
      // Async fetch; image will be null initially, then updateCanvas() when ready
      getLucideImage(
        el.iconName,
        el.iconColor || "#ffffff",
        el.iconStrokeWidth || 2,
      )
        .then((img) => {
          restored.image = img;
          updateCanvas();
        })
        .catch((e) => console.error("Failed to reconstruct icon:", e));
    }
    return restored;
  });
}

// Load state from IndexedDB for current project
function loadState() {
  if (!db) return Promise.resolve();

  return new Promise((resolve) => {
    try {
      const transaction = db.transaction([PROJECTS_STORE], "readonly");
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.get(currentProjectId);

      request.onsuccess = () => {
        const parsed = request.result;
        if (parsed) {
          // Check if this is an old-style project (no per-screenshot settings)
          const isOldFormat =
            !parsed.defaults &&
            (parsed.background || parsed.screenshot || parsed.text);
          const hasScreenshotsWithoutSettings = parsed.screenshots?.some(
            (s) => !s.background && !s.screenshot && !s.text,
          );
          const needsMigration = isOldFormat || hasScreenshotsWithoutSettings;

          // Check if we need to migrate 3D positions (formatVersion < 2)
          const needs3DMigration =
            !parsed.formatVersion || parsed.formatVersion < 2;

          // Load screenshots with their per-screenshot settings
          state.screenshots = [];

          // Build migrated settings from old format if needed
          let migratedBackground = state.defaults.background;
          let migratedScreenshot = state.defaults.screenshot;
          let migratedText = state.defaults.text;

          if (isOldFormat) {
            if (parsed.background) {
              migratedBackground = {
                type: parsed.background.type || "gradient",
                gradient:
                  parsed.background.gradient ||
                  state.defaults.background.gradient,
                solid:
                  parsed.background.solid || state.defaults.background.solid,
                image: null,
                imageFit: parsed.background.imageFit || "cover",
                imageBlur: parsed.background.imageBlur || 0,
                overlayColor: parsed.background.overlayColor || "#000000",
                overlayOpacity: parsed.background.overlayOpacity || 0,
                noise: parsed.background.noise || false,
                noiseIntensity: parsed.background.noiseIntensity || 10,
              };
            }
            if (parsed.screenshot) {
              migratedScreenshot = {
                ...state.defaults.screenshot,
                ...parsed.screenshot,
              };
            }
            if (parsed.text) {
              migratedText = { ...state.defaults.text, ...parsed.text };
            }
          }

          if (parsed.screenshots && parsed.screenshots.length > 0) {
            let loadedCount = 0;
            const totalToLoad = parsed.screenshots.length;

            parsed.screenshots.forEach((s, index) => {
              // Check if we have new localized format or old single-image format
              const hasLocalizedImages =
                s.localizedImages && Object.keys(s.localizedImages).length > 0;

              if (!hasLocalizedImages && !s.src) {
                // Blank screen (no image)
                const screenshotSettings =
                  s.screenshot ||
                  JSON.parse(JSON.stringify(migratedScreenshot));
                if (needs3DMigration) {
                  migrate3DPosition(screenshotSettings);
                }
                state.screenshots[index] = {
                  image: null,
                  name: s.name || "Blank Screen",
                  deviceType: s.deviceType,
                  category: s.category || null,
                  autoshotScreenName: s.autoshotScreenName || null,
                  localizedImages: {},
                  background:
                    s.background ||
                    JSON.parse(JSON.stringify(migratedBackground)),
                  screenshot: screenshotSettings,
                  text: s.text || JSON.parse(JSON.stringify(migratedText)),
                  elements: reconstructElementImages(s.elements),
                  popouts: s.popouts || [],
                  overrides: s.overrides || {},
                };
                loadedCount++;
                checkAllLoaded();
              } else if (hasLocalizedImages) {
                // New format: load all localized images
                const langKeys = Object.keys(s.localizedImages);
                let langLoadedCount = 0;
                const localizedImages = {};

                langKeys.forEach((lang) => {
                  const langData = s.localizedImages[lang];
                  if (langData?.src) {
                    const langImg = new Image();
                    langImg.onload = () => {
                      localizedImages[lang] = {
                        image: langImg,
                        src: langData.src,
                        name: langData.name || s.name,
                      };
                      langLoadedCount++;

                      if (langLoadedCount === langKeys.length) {
                        // All language versions loaded
                        const firstLang = langKeys[0];
                        const screenshotSettings =
                          s.screenshot ||
                          JSON.parse(JSON.stringify(migratedScreenshot));
                        if (needs3DMigration) {
                          migrate3DPosition(screenshotSettings);
                        }
                        state.screenshots[index] = {
                          image: localizedImages[firstLang]?.image, // Legacy compat
                          name: s.name,
                          deviceType: s.deviceType,
                          category: s.category || null,
                          autoshotScreenName: s.autoshotScreenName || null,
                          localizedImages: localizedImages,
                          background:
                            s.background ||
                            JSON.parse(JSON.stringify(migratedBackground)),
                          screenshot: screenshotSettings,
                          text:
                            s.text || JSON.parse(JSON.stringify(migratedText)),
                          elements: reconstructElementImages(s.elements),
                          popouts: s.popouts || [],
                          overrides: s.overrides || {},
                        };
                        loadedCount++;
                        checkAllLoaded();
                      }
                    };
                    langImg.src = langData.src;
                  } else {
                    langLoadedCount++;
                    if (langLoadedCount === langKeys.length) {
                      loadedCount++;
                      checkAllLoaded();
                    }
                  }
                });
              } else {
                // Old format: migrate to localized images
                const img = new Image();
                img.onload = () => {
                  // Detect language from filename, default to 'en'
                  const detectedLang =
                    typeof detectLanguageFromFilename === "function"
                      ? detectLanguageFromFilename(s.name || "")
                      : "en";

                  const localizedImages = {};
                  localizedImages[detectedLang] = {
                    image: img,
                    src: s.src,
                    name: s.name,
                  };

                  const screenshotSettings =
                    s.screenshot ||
                    JSON.parse(JSON.stringify(migratedScreenshot));
                  if (needs3DMigration) {
                    migrate3DPosition(screenshotSettings);
                  }
                  state.screenshots[index] = {
                    image: img,
                    name: s.name,
                    deviceType: s.deviceType,
                    category: s.category || null,
                    autoshotScreenName: s.autoshotScreenName || null,
                    localizedImages: localizedImages,
                    background:
                      s.background ||
                      JSON.parse(JSON.stringify(migratedBackground)),
                    screenshot: screenshotSettings,
                    text: s.text || JSON.parse(JSON.stringify(migratedText)),
                    elements: reconstructElementImages(s.elements),
                    popouts: s.popouts || [],
                    overrides: s.overrides || {},
                  };
                  loadedCount++;
                  checkAllLoaded();
                };
                img.src = s.src;
              }
            });

            function checkAllLoaded() {
              if (loadedCount === totalToLoad) {
                updateScreenshotList();
                syncUIWithState();
                updateGradientStopsUI();
                updateCanvas();

                if (needsMigration && parsed.screenshots.length > 0) {
                  showMigrationPrompt();
                }
              }
            }
          } else {
            // No screenshots - still need to update UI
            updateScreenshotList();
            syncUIWithState();
            updateGradientStopsUI();
            updateCanvas();
          }

          state.selectedIndex = parsed.selectedIndex || 0;
          state.activeCategory = parsed.activeCategory || "phone";
          state.outputDevice = parsed.outputDevice || "iphone-6.9";
          state.customWidth = parsed.customWidth || 1320;
          state.customHeight = parsed.customHeight || 2868;
          state.categorySettings = parsed.categorySettings || {
            phone: {
              outputDevice: state.outputDevice,
              customWidth: state.customWidth,
              customHeight: state.customHeight,
            },
            tablet: {
              outputDevice: "ipad-12.9",
              customWidth: 2048,
              customHeight: 2732,
            },
          };

          // Load global language settings
          state.currentLanguage = parsed.currentLanguage || "en";
          state.projectLanguages = parsed.projectLanguages || ["en"];

          // Load defaults (new format) or use migrated settings
          if (parsed.defaults) {
            state.defaults = parsed.defaults;
            // Ensure elements array exists (may be missing from older saves)
            if (!state.defaults.elements) state.defaults.elements = [];
          } else {
            state.defaults.background = migratedBackground;
            state.defaults.screenshot = migratedScreenshot;
            state.defaults.text = migratedText;
          }
        } else {
          // New project, reset to defaults
          resetStateToDefaults();
          updateScreenshotList();
        }
        resolve();
      };

      request.onerror = () => {
        console.error("Error loading state:", request.error);
        resolve();
      };
    } catch (e) {
      console.error("Error loading state:", e);
      resolve();
    }
  });
}

// Show migration prompt for old-style projects
function showMigrationPrompt() {
  const modal = document.getElementById("migration-modal");
  if (modal) {
    modal.classList.add("visible");
  }
}

function hideMigrationPrompt() {
  const modal = document.getElementById("migration-modal");
  if (modal) {
    modal.classList.remove("visible");
  }
}

function convertProject() {
  // Project is already converted in memory, just save it
  saveState();
  hideMigrationPrompt();
}

// Reset state to defaults (without clearing storage)
function resetStateToDefaults() {
  state.screenshots = [];
  state.selectedIndex = 0;
  state.activeCategory = "phone";
  state.outputDevice = "iphone-6.9";
  state.customWidth = 1320;
  state.customHeight = 2868;
  state.categorySettings = {
    phone: {
      outputDevice: "iphone-6.9",
      customWidth: 1320,
      customHeight: 2868,
    },
    tablet: {
      outputDevice: "ipad-12.9",
      customWidth: 2048,
      customHeight: 2732,
    },
  };
  state.currentLanguage = "en";
  state.projectLanguages = ["en"];
  state.defaults = {
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
  };
}

// Switch to a different project
async function switchProject(projectId) {
  // Save current project first
  saveState();

  currentProjectId = projectId;
  saveProjectsMeta();

  // Reset and load new project
  resetStateToDefaults();
  await loadState();

  syncUIWithState();
  updateScreenshotList();
  updateGradientStopsUI();
  updateProjectSelector();
  updateCanvas();
}

// Create a new project
async function createProject(name) {
  const id = "project_" + Date.now();
  projects.push({ id, name, screenshotCount: 0 });
  saveProjectsMeta();
  await switchProject(id);
  updateProjectSelector();
}

// Rename current project
function renameProject(newName) {
  const project = projects.find((p) => p.id === currentProjectId);
  if (project) {
    project.name = newName;
    saveProjectsMeta();
    updateProjectSelector();
  }
}

// Delete current project
async function deleteProject() {
  if (projects.length <= 1) {
    await showAppAlert("Cannot delete the only project", "info");
    return;
  }

  // Remove from projects list
  const index = projects.findIndex((p) => p.id === currentProjectId);
  if (index > -1) {
    projects.splice(index, 1);
  }

  // Delete from IndexedDB
  if (db) {
    const transaction = db.transaction([PROJECTS_STORE], "readwrite");
    const store = transaction.objectStore(PROJECTS_STORE);
    store.delete(currentProjectId);
  }

  // Switch to first available project
  saveProjectsMeta();
  await switchProject(projects[0].id);
  updateProjectSelector();
}

async function duplicateProject(sourceProjectId, customName) {
  if (!db) return;

  const transaction = db.transaction([PROJECTS_STORE], "readonly");
  const store = transaction.objectStore(PROJECTS_STORE);
  const request = store.get(sourceProjectId);

  return new Promise((resolve) => {
    request.onsuccess = async () => {
      const projectData = request.result;
      if (!projectData) {
        await showAppAlert("Could not read project data", "error");
        resolve();
        return;
      }

      const newId = "project_" + Date.now();
      const sourceProject = projects.find((p) => p.id === sourceProjectId);
      const newName =
        customName ||
        (sourceProject ? sourceProject.name : "Project") + " (Copy)";

      const clonedData = JSON.parse(JSON.stringify(projectData));
      clonedData.id = newId;

      projects.push({
        id: newId,
        name: newName,
        screenshotCount: clonedData.screenshots?.length || 0,
      });
      saveProjectsMeta();

      const writeTransaction = db.transaction([PROJECTS_STORE], "readwrite");
      const writeStore = writeTransaction.objectStore(PROJECTS_STORE);
      writeStore.put(clonedData);

      writeTransaction.oncomplete = async () => {
        await switchProject(newId);
        updateProjectSelector();
        resolve();
      };
    };
  });
}

function duplicateScreenshot(index) {
  const original = state.screenshots[index];
  if (!original) return;

  const clone = JSON.parse(
    JSON.stringify({
      name: original.name,
      deviceType: original.deviceType,
      background: original.background,
      screenshot: original.screenshot,
      text: original.text,
      overrides: original.overrides,
    }),
  );

  const nameParts = clone.name.split(".");
  if (nameParts.length > 1) {
    const ext = nameParts.pop();
    clone.name = nameParts.join(".") + " (Copy)." + ext;
  } else {
    clone.name = clone.name + " (Copy)";
  }

  clone.localizedImages = {};
  if (original.localizedImages) {
    Object.keys(original.localizedImages).forEach((lang) => {
      const langData = original.localizedImages[lang];
      if (langData?.src) {
        const img = new Image();
        img.src = langData.src;
        clone.localizedImages[lang] = {
          image: img,
          src: langData.src,
          name: langData.name,
        };
      }
    });
  }

  if (original.image?.src) {
    const img = new Image();
    img.src = original.image.src;
    clone.image = img;
  }

  state.screenshots.splice(index + 1, 0, clone);
  state.selectedIndex = index + 1;

  updateScreenshotList();
  syncUIWithState();
  updateGradientStopsUI();
  updateCanvas();
}
