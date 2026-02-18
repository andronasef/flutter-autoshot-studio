/* ===== File handling, screenshot list management & screenshot actions ===== */
/* auto-split from app.js lines 8141–9825 */
// Handle files from desktop app (receives array of {dataUrl, name})
function handleFilesFromDesktop(filesData) {
  processDesktopFilesSequentially(filesData);
}

async function processDesktopFilesSequentially(filesData) {
  for (const fileData of filesData) {
    await processDesktopImageFile(fileData);
  }
}

// Import screenshots via Tauri native file dialog
async function importScreenshotsFromTauri() {
  if (!window.__TAURI__) return;
  try {
    const selected = await window.__TAURI__.dialog.open({
      multiple: true,
      filters: [
        { name: "Images", extensions: ["png", "jpg", "jpeg", "gif", "webp"] },
      ],
    });
    if (!selected) return;
    const paths = Array.isArray(selected) ? selected : [selected];
    for (const filePath of paths) {
      const bytes = await window.__TAURI__.fs.readFile(filePath);
      const blob = new Blob([bytes]);
      const dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
      const name = filePath.split(/[\\/]/).pop();
      await handleFilesFromDesktop([{ dataUrl, name }]);
    }
  } catch (err) {
    console.error("Tauri import error:", err);
  }
}

async function processDesktopImageFile(fileData) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      // Detect device type based on aspect ratio
      const ratio = img.width / img.height;
      let deviceType = "iPhone";
      if (ratio > 0.6) {
        deviceType = "iPad";
      }

      // Detect language from filename
      const detectedLang = detectLanguageFromFilename(fileData.name);

      // Check if this is a localized version of an existing screenshot
      const existingIndex = findScreenshotByBaseFilename(fileData.name);

      if (existingIndex !== -1) {
        // Found a screenshot with matching base filename
        const existingScreenshot = state.screenshots[existingIndex];
        const hasExistingLangImage =
          existingScreenshot.localizedImages?.[detectedLang]?.image;

        if (hasExistingLangImage) {
          // There's already an image for this language - show dialog
          const choice = await showDuplicateDialog({
            existingIndex: existingIndex,
            detectedLang: detectedLang,
            newImage: img,
            newSrc: fileData.dataUrl,
            newName: fileData.name,
          });

          if (choice === "replace") {
            addLocalizedImage(
              existingIndex,
              detectedLang,
              img,
              fileData.dataUrl,
              fileData.name,
            );
          } else if (choice === "create") {
            createNewScreenshot(
              img,
              fileData.dataUrl,
              fileData.name,
              detectedLang,
              deviceType,
            );
          }
        } else {
          // No image for this language yet - just add it silently
          addLocalizedImage(
            existingIndex,
            detectedLang,
            img,
            fileData.dataUrl,
            fileData.name,
          );
        }
      } else {
        createNewScreenshot(
          img,
          fileData.dataUrl,
          fileData.name,
          detectedLang,
          deviceType,
        );
      }

      // Update 3D texture if in 3D mode
      const ss = getScreenshotSettings();
      if (ss.use3D && typeof updateScreenTexture === "function") {
        updateScreenTexture();
      }
      updateCanvas();
      resolve();
    };
    img.src = fileData.dataUrl;
  });
}

async function processFilesSequentially(files) {
  for (const file of files) {
    await processImageFile(file);
  }
}

async function processImageFile(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const img = new Image();
      img.onload = async () => {
        // Detect device type based on aspect ratio
        const ratio = img.width / img.height;
        let deviceType = "iPhone";
        if (ratio > 0.6) {
          deviceType = "iPad";
        }

        // Detect language from filename
        const detectedLang = detectLanguageFromFilename(file.name);

        // Check if this is a localized version of an existing screenshot
        const existingIndex = findScreenshotByBaseFilename(file.name);

        if (existingIndex !== -1) {
          // Found a screenshot with matching base filename
          const existingScreenshot = state.screenshots[existingIndex];
          const hasExistingLangImage =
            existingScreenshot.localizedImages?.[detectedLang]?.image;

          if (hasExistingLangImage) {
            // There's already an image for this language - show dialog
            const choice = await showDuplicateDialog({
              existingIndex: existingIndex,
              detectedLang: detectedLang,
              newImage: img,
              newSrc: e.target.result,
              newName: file.name,
            });

            if (choice === "replace") {
              addLocalizedImage(
                existingIndex,
                detectedLang,
                img,
                e.target.result,
                file.name,
              );
            } else if (choice === "create") {
              createNewScreenshot(
                img,
                e.target.result,
                file.name,
                detectedLang,
                deviceType,
              );
            }
            // 'ignore' does nothing
          } else {
            // No image for this language yet - just add it silently
            addLocalizedImage(
              existingIndex,
              detectedLang,
              img,
              e.target.result,
              file.name,
            );
          }
        } else {
          // No duplicate - create new screenshot
          createNewScreenshot(
            img,
            e.target.result,
            file.name,
            detectedLang,
            deviceType,
          );
        }

        // Update 3D texture if in 3D mode
        const ss = getScreenshotSettings();
        if (ss.use3D && typeof updateScreenTexture === "function") {
          updateScreenTexture();
        }
        updateCanvas();
        resolve();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function createNewScreenshot(
  img,
  src,
  name,
  lang,
  deviceType,
  explicitCategory,
) {
  const category =
    explicitCategory || (deviceType === "iPad" ? "tablet" : "phone");
  const localizedImages = {};
  if (img && src) {
    localizedImages[lang || "en"] = {
      image: img,
      src: src,
      name: name,
    };
  }

  // Auto-add language to project if not already present
  if (lang && !state.projectLanguages.includes(lang)) {
    addProjectLanguage(lang);
  }

  const textDefaults = normalizeTextSettings(state.defaults.text);
  state.defaults.text = textDefaults;

  // Each screenshot gets its own copy of all settings from defaults
  state.screenshots.push({
    image: img || null, // Keep for legacy compatibility
    name: name || "Blank Screen",
    deviceType: deviceType,
    category: category,
    localizedImages: localizedImages,
    background: JSON.parse(JSON.stringify(state.defaults.background)),
    screenshot: JSON.parse(JSON.stringify(state.defaults.screenshot)),
    text: JSON.parse(JSON.stringify(textDefaults)),
    elements: JSON.parse(JSON.stringify(state.defaults.elements || [])),
    popouts: [],
    // Legacy overrides for backwards compatibility
    overrides: {},
  });

  updateScreenshotList();
  if (state.screenshots.length === 1) {
    state.selectedIndex = 0;
    // Show Magical Titles tooltip hint for first screenshot
    setTimeout(() => showMagicalTitlesTooltip(), 500);
  }
  // If the new screenshot landed in a different category than what's active, switch
  if (category !== state.activeCategory) {
    switchToCategory(category);
    state.selectedIndex = state.screenshots.length - 1;
  }
}

let draggedScreenshotIndex = null;

function startInlineRename(item, index) {
  const nameEl = item.querySelector(".screenshot-name");
  if (!nameEl || nameEl.querySelector("input")) return; // already renaming
  const currentName = state.screenshots[index]?.name || "";

  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.className = "screenshot-name-input";

  nameEl.textContent = "";
  nameEl.appendChild(input);
  input.focus();
  input.select();

  let committed = false;
  const commit = () => {
    if (committed) return;
    committed = true;
    const newName = input.value.trim() || currentName;
    if (state.screenshots[index]) {
      state.screenshots[index].name = newName;
      saveState();
    }
    updateScreenshotList();
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      committed = true;
      updateScreenshotList();
    }
    e.stopPropagation();
  });
  input.addEventListener("blur", commit);
  input.addEventListener("click", (e) => e.stopPropagation());
  input.addEventListener("dblclick", (e) => e.stopPropagation());
}

function updateScreenshotList() {
  screenshotList.innerHTML = "";
  const activeCatIndices = getActiveCategoryIndices();
  const isEmpty = activeCatIndices.length === 0;
  const totalEmpty = state.screenshots.length === 0;
  noScreenshot.style.display = isEmpty ? "block" : "none";

  // Update category tab badges
  ["phone", "tablet"].forEach((cat) => {
    const count = state.screenshots.filter(
      (s) => getCategoryOf(s) === cat,
    ).length;
    const tab = document.querySelector(
      `.device-category-tab[data-category="${cat}"]`,
    );
    if (tab) {
      const badge = tab.querySelector(".cat-badge");
      if (badge) badge.textContent = count || "";
    }
  });

  // Disable right sidebar and export buttons when no screenshots in active category
  const rightSidebar = document.querySelector(".sidebar-right");
  if (rightSidebar) rightSidebar.classList.toggle("disabled", isEmpty);
  const exportCurrent = document.getElementById("export-current");
  const exportAll = document.getElementById("export-all");
  if (exportCurrent) {
    exportCurrent.disabled = totalEmpty;
    exportCurrent.style.opacity = totalEmpty ? "0.4" : "";
    exportCurrent.style.pointerEvents = totalEmpty ? "none" : "";
  }
  if (exportAll) {
    exportAll.disabled = totalEmpty;
    exportAll.style.opacity = totalEmpty ? "0.4" : "";
    exportAll.style.pointerEvents = totalEmpty ? "none" : "";
  }

  // Show transfer mode hint if active
  if (state.transferTarget !== null && activeCatIndices.length > 1) {
    const hint = document.createElement("div");
    hint.className = "transfer-hint";
    hint.innerHTML = `
            <span>Select a screenshot to copy style from</span>
            <button class="transfer-cancel" onclick="cancelTransfer()">Cancel</button>
        `;
    screenshotList.appendChild(hint);
  }

  state.screenshots.forEach((screenshot, index) => {
    // Only render screenshots in the active category
    if (getCategoryOf(screenshot) !== state.activeCategory) return;

    const item = document.createElement("div");
    const isTransferTarget = state.transferTarget === index;
    const isTransferMode = state.transferTarget !== null;
    item.className =
      "screenshot-item" +
      (index === state.selectedIndex ? " selected" : "") +
      (isTransferTarget ? " transfer-target" : "") +
      (isTransferMode && !isTransferTarget ? " transfer-source-option" : "");

    // Enable drag and drop (disabled in transfer mode)
    if (!isTransferMode) {
      item.draggable = true;
      item.dataset.index = index;
    }

    // Show different UI in transfer mode
    const buttonsHtml = isTransferMode
      ? ""
      : `
            <div class="screenshot-menu-wrapper">
                <button class="screenshot-menu-btn" data-index="${index}" title="More options">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2"/>
                        <circle cx="12" cy="12" r="2"/>
                        <circle cx="12" cy="19" r="2"/>
                    </svg>
                </button>
                <div class="screenshot-menu" data-index="${index}">
                    <button class="screenshot-menu-item screenshot-rename" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Rename
                    </button>
                    <button class="screenshot-menu-item screenshot-translations" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2v3M22 22l-5-10-5 10M14 18h6"/>
                        </svg>
                        Manage Translations...
                    </button>
                    <button class="screenshot-menu-item screenshot-replace" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                            <polyline points="17 8 12 3 7 8"/>
                            <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        Replace Screenshot...
                    </button>
                    <button class="screenshot-menu-item screenshot-transfer" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Copy style from...
                    </button>
                    <button class="screenshot-menu-item screenshot-apply-all" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                            <path d="M14 14l2 2 4-4"/>
                        </svg>
                        Apply style to all...
                    </button>
                    <button class="screenshot-menu-item screenshot-duplicate" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                        Duplicate
                    </button>
                    <button class="screenshot-menu-item screenshot-delete danger" data-index="${index}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                        Remove
                    </button>
                </div>
            </div>
        `;

    // Get localized thumbnail image
    const thumbImg = getScreenshotImage(screenshot);
    const thumbSrc = thumbImg?.src || "";
    const isBlank = !thumbSrc;

    // Build language flags indicator
    const availableLangs = getAvailableLanguagesForScreenshot(screenshot);
    const isComplete = isScreenshotComplete(screenshot);
    let langFlagsHtml = "";
    if (state.projectLanguages.length > 1) {
      const flags = availableLangs
        .map((lang) => languageFlags[lang] || "🏳️")
        .join("");
      const checkmark = isComplete
        ? '<span class="screenshot-complete">✓</span>'
        : "";
      langFlagsHtml = `<span class="screenshot-lang-flags">${flags}${checkmark}</span>`;
    }

    const thumbHtml = isBlank
      ? `<div class="screenshot-thumb blank-thumb">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                </svg>
              </div>`
      : `<img class="screenshot-thumb" src="${thumbSrc}" alt="${screenshot.name}">`;

    item.innerHTML = `
            <div class="drag-handle">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="9" cy="6" r="2"/><circle cx="15" cy="6" r="2"/>
                    <circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/>
                    <circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                </svg>
            </div>
            ${thumbHtml}
            <div class="screenshot-info">
                <div class="screenshot-name" title="Double-click to rename">${screenshot.name}</div>
                <div class="screenshot-device">${isTransferTarget ? "Click source to copy style" : screenshot.deviceType}${langFlagsHtml}</div>
            </div>
            ${buttonsHtml}
        `;

    // Drag and drop handlers
    item.addEventListener("dragstart", (e) => {
      draggedScreenshotIndex = index;
      item.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
    });

    item.addEventListener("dragend", () => {
      item.classList.remove("dragging");
      draggedScreenshotIndex = null;
      // Remove all drag-over states
      document
        .querySelectorAll(
          ".screenshot-item.drag-insert-after, .screenshot-item.drag-insert-before",
        )
        .forEach((el) => {
          el.classList.remove("drag-insert-after", "drag-insert-before");
        });
    });

    item.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (draggedScreenshotIndex !== null && draggedScreenshotIndex !== index) {
        // Determine if cursor is in top or bottom half
        const rect = item.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const isAbove = e.clientY < midpoint;

        // Clear all indicators first
        document
          .querySelectorAll(
            ".screenshot-item.drag-insert-after, .screenshot-item.drag-insert-before",
          )
          .forEach((el) => {
            el.classList.remove("drag-insert-after", "drag-insert-before");
          });

        // Show line on the item AFTER which the drop will occur
        if (isAbove && index === 0) {
          // Dropping before the first item - show line above it
          item.classList.add("drag-insert-before");
        } else if (isAbove && index > 0) {
          // Dropping before this item = after the previous item
          const items = screenshotList.querySelectorAll(".screenshot-item");
          const prevItem = items[index - 1];
          if (prevItem && !prevItem.classList.contains("dragging")) {
            prevItem.classList.add("drag-insert-after");
          }
        } else if (!isAbove) {
          // Dropping after this item
          item.classList.add("drag-insert-after");
        }
      }
    });

    item.addEventListener("dragleave", () => {
      // Don't remove here - let dragover on other items handle it
    });

    item.addEventListener("drop", (e) => {
      e.preventDefault();

      // Determine drop position based on cursor
      const rect = item.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      const dropAbove = e.clientY < midpoint;

      document
        .querySelectorAll(
          ".screenshot-item.drag-insert-after, .screenshot-item.drag-insert-before",
        )
        .forEach((el) => {
          el.classList.remove("drag-insert-after", "drag-insert-before");
        });

      if (draggedScreenshotIndex !== null && draggedScreenshotIndex !== index) {
        // Calculate target index based on drop position
        let targetIndex = dropAbove ? index : index + 1;

        // Adjust if dragging from before the target
        if (draggedScreenshotIndex < targetIndex) {
          targetIndex--;
        }

        // Reorder screenshots
        const draggedItem = state.screenshots[draggedScreenshotIndex];
        state.screenshots.splice(draggedScreenshotIndex, 1);
        state.screenshots.splice(targetIndex, 0, draggedItem);

        // Update selected index to follow the selected item
        if (state.selectedIndex === draggedScreenshotIndex) {
          state.selectedIndex = targetIndex;
        } else if (
          draggedScreenshotIndex < state.selectedIndex &&
          targetIndex >= state.selectedIndex
        ) {
          state.selectedIndex--;
        } else if (
          draggedScreenshotIndex > state.selectedIndex &&
          targetIndex <= state.selectedIndex
        ) {
          state.selectedIndex++;
        }

        updateScreenshotList();
        updateCanvas();
      }
    });

    item.addEventListener("click", (e) => {
      if (
        e.target.closest(".screenshot-menu-wrapper") ||
        e.target.closest(".drag-handle")
      ) {
        return;
      }

      // Handle transfer mode click
      if (state.transferTarget !== null) {
        if (index !== state.transferTarget) {
          // Transfer style from clicked screenshot to target
          transferStyle(index, state.transferTarget);
        }
        return;
      }

      // Normal selection
      state.selectedIndex = index;
      updateScreenshotList();
      // Sync all UI with current screenshot's settings
      syncUIWithState();
      updateGradientStopsUI();
      // Update 3D texture if in 3D mode
      const ss = getScreenshotSettings();
      if (ss.use3D && typeof updateScreenTexture === "function") {
        updateScreenTexture();
      }
      updateCanvas();
    });

    // Menu button handler
    const menuBtn = item.querySelector(".screenshot-menu-btn");
    const menu = item.querySelector(".screenshot-menu");
    if (menuBtn && menu) {
      menuBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Close all other menus first
        document.querySelectorAll(".screenshot-menu.open").forEach((m) => {
          if (m !== menu) m.classList.remove("open");
        });
        menu.classList.toggle("open");
      });
    }

    // Manage Translations button handler
    const translationsBtn = item.querySelector(".screenshot-translations");
    if (translationsBtn) {
      translationsBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        openScreenshotTranslationsModal(index);
      });
    }

    // Replace button handler
    const replaceBtn = item.querySelector(".screenshot-replace");
    if (replaceBtn) {
      replaceBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        replaceScreenshot(index);
      });
    }

    // Transfer button handler
    const transferBtn = item.querySelector(".screenshot-transfer");
    if (transferBtn) {
      transferBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        state.transferTarget = index;
        updateScreenshotList();
      });
    }

    // Apply style to all button handler
    const applyAllBtn = item.querySelector(".screenshot-apply-all");
    if (applyAllBtn) {
      applyAllBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        showApplyStyleModal(index);
      });
    }

    const duplicateBtn = item.querySelector(".screenshot-duplicate");
    if (duplicateBtn) {
      duplicateBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        duplicateScreenshot(index);
      });
    }

    // Delete button handler
    const deleteBtn = item.querySelector(".screenshot-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        state.screenshots.splice(index, 1);
        if (state.selectedIndex >= state.screenshots.length) {
          state.selectedIndex = Math.max(0, state.screenshots.length - 1);
        }
        updateScreenshotList();
        syncUIWithState();
        updateGradientStopsUI();
        updateCanvas();
      });
    }

    // Rename button handler
    const renameBtn = item.querySelector(".screenshot-rename");
    if (renameBtn) {
      renameBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu?.classList.remove("open");
        startInlineRename(item, index);
      });
    }

    // Double-click on name to rename
    const nameEl = item.querySelector(".screenshot-name");
    if (nameEl) {
      nameEl.addEventListener("dblclick", (e) => {
        e.stopPropagation();
        startInlineRename(item, index);
      });
    }

    screenshotList.appendChild(item);
  });

  // Hide add buttons during transfer mode
  const addButtonsContainer = document.querySelector(".sidebar-add-buttons");
  if (addButtonsContainer) {
    addButtonsContainer.style.display =
      state.transferTarget === null ? "" : "none";
  }

  // Update project selector to reflect current screenshot count
  updateProjectSelector();
}

function cancelTransfer() {
  state.transferTarget = null;
  updateScreenshotList();
}

function transferStyle(sourceIndex, targetIndex) {
  const source = state.screenshots[sourceIndex];
  const target = state.screenshots[targetIndex];

  if (!source || !target) {
    state.transferTarget = null;
    updateScreenshotList();
    return;
  }

  // Deep copy background settings
  target.background = JSON.parse(JSON.stringify(source.background));
  // Handle background image separately (not JSON serializable)
  if (source.background.image) {
    target.background.image = source.background.image;
  }

  // Deep copy screenshot settings
  target.screenshot = JSON.parse(JSON.stringify(source.screenshot));

  // Copy text styling but preserve actual text content
  const targetHeadlines = target.text.headlines;
  const targetSubheadlines = target.text.subheadlines;
  target.text = JSON.parse(JSON.stringify(source.text));
  // Restore original text content
  target.text.headlines = targetHeadlines;
  target.text.subheadlines = targetSubheadlines;

  // Deep copy elements (reconstruct Image objects for graphics and icons)
  target.elements = (source.elements || []).map((el) => {
    const copy = JSON.parse(JSON.stringify({ ...el, image: undefined }));
    if (el.type === "graphic" && el.image) {
      copy.image = el.image;
    } else if (el.type === "icon" && el.image) {
      copy.image = el.image;
    }
    copy.id = crypto.randomUUID();
    return copy;
  });

  // Explicitly skip popouts — crop regions are specific to each screenshot's source image

  // Reset transfer mode
  state.transferTarget = null;

  // Update UI
  updateScreenshotList();
  syncUIWithState();
  updateGradientStopsUI();
  updateCanvas();
}

// Track which screenshot to apply style from
let applyStyleSourceIndex = null;

function showApplyStyleModal(sourceIndex) {
  applyStyleSourceIndex = sourceIndex;
  document.getElementById("apply-style-modal").classList.add("visible");
}

function applyStyleToAll() {
  if (applyStyleSourceIndex === null) return;

  const source = state.screenshots[applyStyleSourceIndex];
  if (!source) {
    applyStyleSourceIndex = null;
    return;
  }

  // Apply style to all other screenshots
  state.screenshots.forEach((target, index) => {
    if (index === applyStyleSourceIndex) return; // Skip source

    // Deep copy background settings
    target.background = JSON.parse(JSON.stringify(source.background));
    // Handle background image separately (not JSON serializable)
    if (source.background.image) {
      target.background.image = source.background.image;
    }

    // Deep copy screenshot settings
    target.screenshot = JSON.parse(JSON.stringify(source.screenshot));

    // Copy text styling but preserve actual text content
    const targetHeadlines = target.text.headlines;
    const targetSubheadlines = target.text.subheadlines;
    target.text = JSON.parse(JSON.stringify(source.text));
    // Restore original text content
    target.text.headlines = targetHeadlines;
    target.text.subheadlines = targetSubheadlines;

    // Deep copy elements
    target.elements = (source.elements || []).map((el) => {
      const copy = JSON.parse(JSON.stringify({ ...el, image: undefined }));
      if (el.type === "graphic" && el.image) {
        copy.image = el.image;
      }
      copy.id = crypto.randomUUID();
      return copy;
    });

    // Explicitly skip popouts — crop regions are specific to each screenshot's source image
  });

  applyStyleSourceIndex = null;

  // Update UI
  updateScreenshotList();
  syncUIWithState();
  updateGradientStopsUI();
  updateCanvas();
}

// Replace screenshot image via file picker
function replaceScreenshot(index) {
  const screenshot = state.screenshots[index];
  if (!screenshot) return;

  // Create a hidden file input
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.style.display = "none";
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) {
      document.body.removeChild(fileInput);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Get the current language
        const lang = state.currentLanguage;

        // Update the localized image for the current language
        if (!screenshot.localizedImages) {
          screenshot.localizedImages = {};
        }

        screenshot.localizedImages[lang] = {
          image: img,
          src: event.target.result,
          name: file.name,
        };

        // Also update legacy image field for compatibility
        screenshot.image = img;

        // Update displays
        updateScreenshotList();
        updateCanvas();
        saveState();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    document.body.removeChild(fileInput);
  });

  // Trigger file dialog
  fileInput.click();
}

function updateGradientStopsUI() {
  const container = document.getElementById("gradient-stops");
  container.innerHTML = "";

  const bg = getBackground();
  bg.gradient.stops.forEach((stop, index) => {
    const div = document.createElement("div");
    div.className = "gradient-stop";
    div.innerHTML = `
            <input type="color" value="${stop.color}" data-stop="${index}">
            <input type="number" value="${stop.position}" min="0" max="100" data-stop="${index}">
            <span>%</span>
            ${
              index > 1
                ? `<button class="screenshot-delete" data-stop="${index}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
            </button>`
                : ""
            }
        `;

    div.querySelector('input[type="color"]').addEventListener("input", (e) => {
      const currentBg = getBackground();
      currentBg.gradient.stops[index].color = e.target.value;
      // Deselect preset when manually changing colors
      document
        .querySelectorAll(".preset-swatch")
        .forEach((s) => s.classList.remove("selected"));
      updateCanvas();
    });

    div.querySelector('input[type="number"]').addEventListener("input", (e) => {
      const currentBg = getBackground();
      currentBg.gradient.stops[index].position = parseInt(e.target.value);
      // Deselect preset when manually changing positions
      document
        .querySelectorAll(".preset-swatch")
        .forEach((s) => s.classList.remove("selected"));
      updateCanvas();
    });

    const deleteBtn = div.querySelector(".screenshot-delete");
    if (deleteBtn) {
      deleteBtn.addEventListener("click", () => {
        const currentBg = getBackground();
        currentBg.gradient.stops.splice(index, 1);
        // Deselect preset when deleting a stop
        document
          .querySelectorAll(".preset-swatch")
          .forEach((s) => s.classList.remove("selected"));
        updateGradientStopsUI();
        updateCanvas();
      });
    }

    container.appendChild(div);
  });
}

function getCanvasDimensions() {
  if (state.outputDevice === "custom") {
    return { width: state.customWidth, height: state.customHeight };
  }
  return deviceDimensions[state.outputDevice];
}

function updateCanvas() {
  saveState(); // Persist state on every update
  const dims = getCanvasDimensions();
  canvas.width = dims.width;
  canvas.height = dims.height;

  // Scale for preview
  const maxPreviewWidth = 400;
  const maxPreviewHeight = 700;
  const scale = Math.min(
    maxPreviewWidth / dims.width,
    maxPreviewHeight / dims.height,
  );
  canvas.style.width = dims.width * scale + "px";
  canvas.style.height = dims.height * scale + "px";

  // Draw background
  drawBackground();

  // Draw noise overlay on background if enabled
  if (getBackground().noise) {
    drawNoise();
  }

  // Elements behind screenshot
  drawElements(ctx, dims, "behind-screenshot");

  // Draw screenshot (2D mode) or 3D phone model
  if (state.screenshots.length > 0) {
    const screenshot = state.screenshots[state.selectedIndex];
    const img = screenshot ? getScreenshotImage(screenshot) : null;
    const ss = getScreenshotSettings();
    const use3D = ss.use3D || false;
    if (
      use3D &&
      img &&
      typeof renderThreeJSToCanvas === "function" &&
      phoneModelLoaded
    ) {
      // In 3D mode, update the screen texture and render the phone model
      if (typeof updateScreenTexture === "function") {
        updateScreenTexture();
      }
      renderThreeJSToCanvas(canvas, dims.width, dims.height);
    } else if (!use3D) {
      // In 2D mode, draw the screenshot normally
      drawScreenshot();
    }
  }

  // Elements above screenshot but behind text
  drawElements(ctx, dims, "above-screenshot");

  // Draw popouts (cropped regions from source image)
  drawPopouts(ctx, dims);

  // Draw text
  drawText();

  // Elements above text
  drawElements(ctx, dims, "above-text");

  // Update side previews
  updateSidePreviews();
}

function updateSidePreviews() {
  const dims = getCanvasDimensions();
  // Same scale as main preview
  const maxPreviewWidth = 400;
  const maxPreviewHeight = 700;
  const previewScale = Math.min(
    maxPreviewWidth / dims.width,
    maxPreviewHeight / dims.height,
  );

  // Initialize Three.js if any screenshot uses 3D mode (needed for side previews)
  const any3D = state.screenshots.some((s) => s.screenshot?.use3D);
  if (any3D && typeof showThreeJS === "function") {
    showThreeJS(true);

    // Preload phone models for adjacent screenshots to prevent flicker
    if (typeof loadCachedPhoneModel === "function") {
      const adjacentIndices = [
        getNeighborIndex(-1),
        getNeighborIndex(1),
      ].filter((i) => i >= 0);
      adjacentIndices.forEach((i) => {
        const ss = state.screenshots[i]?.screenshot;
        if (ss?.use3D && ss?.device3D) {
          loadCachedPhoneModel(ss.device3D);
        }
      });
    }
  }

  // Calculate main canvas display width and position side previews with 10px gap
  const mainCanvasWidth = dims.width * previewScale;
  const gap = 10;
  const sideOffset = mainCanvasWidth / 2 + gap;
  const farSideOffset = sideOffset + mainCanvasWidth + gap;

  // Previous screenshot (left, category neighbor -1)
  const prevIndex = getNeighborIndex(-1);
  if (prevIndex >= 0 && getActiveCategoryIndices().length > 1) {
    sidePreviewLeft.classList.remove("hidden");
    sidePreviewLeft.style.right = `calc(50% + ${sideOffset}px)`;
    // Skip render if already pre-rendered during slide transition
    if (!skipSidePreviewRender) {
      renderScreenshotToCanvas(
        prevIndex,
        canvasLeft,
        ctxLeft,
        dims,
        previewScale,
      );
    }
    // Click to select previous with animation
    sidePreviewLeft.onclick = () => {
      if (isSliding) return;
      slideToScreenshot(prevIndex, "left");
    };
  } else {
    sidePreviewLeft.classList.add("hidden");
  }

  // Far previous screenshot (far left, category neighbor -2)
  const farPrevIndex = getNeighborIndex(-2);
  if (farPrevIndex >= 0 && getActiveCategoryIndices().length > 2) {
    sidePreviewFarLeft.classList.remove("hidden");
    sidePreviewFarLeft.style.right = `calc(50% + ${farSideOffset}px)`;
    renderScreenshotToCanvas(
      farPrevIndex,
      canvasFarLeft,
      ctxFarLeft,
      dims,
      previewScale,
    );
  } else {
    sidePreviewFarLeft.classList.add("hidden");
  }

  // Next screenshot (right, category neighbor +1)
  const nextIndex = getNeighborIndex(1);
  if (nextIndex >= 0 && getActiveCategoryIndices().length > 1) {
    sidePreviewRight.classList.remove("hidden");
    sidePreviewRight.style.left = `calc(50% + ${sideOffset}px)`;
    // Skip render if already pre-rendered during slide transition
    if (!skipSidePreviewRender) {
      renderScreenshotToCanvas(
        nextIndex,
        canvasRight,
        ctxRight,
        dims,
        previewScale,
      );
    }
    // Click to select next with animation
    sidePreviewRight.onclick = () => {
      if (isSliding) return;
      slideToScreenshot(nextIndex, "right");
    };
  } else {
    sidePreviewRight.classList.add("hidden");
  }

  // Far next screenshot (far right, category neighbor +2)
  const farNextIndex = getNeighborIndex(2);
  if (farNextIndex >= 0 && getActiveCategoryIndices().length > 2) {
    sidePreviewFarRight.classList.remove("hidden");
    sidePreviewFarRight.style.left = `calc(50% + ${farSideOffset}px)`;
    renderScreenshotToCanvas(
      farNextIndex,
      canvasFarRight,
      ctxFarRight,
      dims,
      previewScale,
    );
  } else {
    sidePreviewFarRight.classList.add("hidden");
  }
}

function slideToScreenshot(newIndex, direction) {
  isSliding = true;
  previewStrip.classList.add("sliding");

  const dims = getCanvasDimensions();
  const maxPreviewWidth = 400;
  const maxPreviewHeight = 700;
  const previewScale = Math.min(
    maxPreviewWidth / dims.width,
    maxPreviewHeight / dims.height,
  );
  const slideDistance = dims.width * previewScale + 10; // canvas width + gap

  const newPrevIndex = getCategoryNeighborOf(newIndex, -1);
  const newNextIndex = getCategoryNeighborOf(newIndex, 1);

  // Collect model loading promises for new active AND adjacent screenshots
  const modelPromises = [];
  [newIndex, newPrevIndex, newNextIndex].forEach((index) => {
    if (index >= 0 && index < state.screenshots.length) {
      const ss = state.screenshots[index]?.screenshot;
      if (
        ss?.use3D &&
        ss?.device3D &&
        typeof loadCachedPhoneModel === "function"
      ) {
        modelPromises.push(loadCachedPhoneModel(ss.device3D).catch(() => null));
      }
    }
  });

  // Start loading models immediately (in parallel with animation)
  const modelsReady =
    modelPromises.length > 0 ? Promise.all(modelPromises) : Promise.resolve();

  // Slide the strip in the opposite direction of the click
  if (direction === "right") {
    previewStrip.style.transform = `translateX(-${slideDistance}px)`;
  } else {
    previewStrip.style.transform = `translateX(${slideDistance}px)`;
  }

  // Wait for BOTH animation AND models to be ready
  const animationDone = new Promise((resolve) => setTimeout(resolve, 300));
  Promise.all([animationDone, modelsReady]).then(() => {
    // Pre-render new side previews to temporary canvases NOW (models are loaded)
    const tempCanvases = [];

    const prerenderToTemp = (index, targetCanvas) => {
      if (index < 0 || index >= state.screenshots.length) return null;
      const tempCanvas = document.createElement("canvas");
      const tempCtx = tempCanvas.getContext("2d");
      renderScreenshotToCanvas(index, tempCanvas, tempCtx, dims, previewScale);
      return { tempCanvas, targetCanvas };
    };

    const leftPrerender = prerenderToTemp(newPrevIndex, canvasLeft);
    const rightPrerender = prerenderToTemp(newNextIndex, canvasRight);
    if (leftPrerender) tempCanvases.push(leftPrerender);
    if (rightPrerender) tempCanvases.push(rightPrerender);

    // Disable transition temporarily for instant reset
    previewStrip.style.transition = "none";
    previewStrip.style.transform = "translateX(0)";

    // Suppress updateCanvas calls from switchPhoneModel during sync
    window.suppressSwitchModelUpdate = true;

    // Update state
    state.selectedIndex = newIndex;
    updateScreenshotList();
    syncUIWithState();
    updateGradientStopsUI();

    // Copy pre-rendered canvases to actual canvases BEFORE updateCanvas
    // This prevents flicker by having content ready before the swap
    tempCanvases.forEach(({ tempCanvas, targetCanvas }) => {
      targetCanvas.width = tempCanvas.width;
      targetCanvas.height = tempCanvas.height;
      targetCanvas.style.width = tempCanvas.style.width;
      targetCanvas.style.height = tempCanvas.style.height;
      const targetCtx = targetCanvas.getContext("2d");
      targetCtx.drawImage(tempCanvas, 0, 0);
    });

    // Skip side preview re-render since we already pre-rendered them
    skipSidePreviewRender = true;

    // Now do a full updateCanvas for main preview, far sides, etc.
    // Side previews won't flicker because we already drew to them
    updateCanvas();

    // Reset flags
    skipSidePreviewRender = false;
    window.suppressSwitchModelUpdate = false;

    // Re-enable transition after a frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        previewStrip.style.transition = "";
        previewStrip.classList.remove("sliding");
        isSliding = false;
      });
    });
  });
}

function renderScreenshotToCanvas(
  index,
  targetCanvas,
  targetCtx,
  dims,
  previewScale,
) {
  const screenshot = state.screenshots[index];
  if (!screenshot) return;

  // Get localized image for current language
  const img = getScreenshotImage(screenshot);

  // Set canvas size (this also clears the canvas)
  targetCanvas.width = dims.width;
  targetCanvas.height = dims.height;
  targetCanvas.style.width = dims.width * previewScale + "px";
  targetCanvas.style.height = dims.height * previewScale + "px";

  // Clear canvas explicitly
  targetCtx.clearRect(0, 0, dims.width, dims.height);

  // Draw background for this screenshot
  const bg = screenshot.background;
  drawBackgroundToContext(targetCtx, dims, bg);

  // Draw noise if enabled
  if (bg.noise) {
    drawNoiseToContext(targetCtx, dims, bg.noiseIntensity);
  }

  const elements = screenshot.elements || [];

  // Elements behind screenshot
  drawElementsToContext(targetCtx, dims, elements, "behind-screenshot");

  // Draw screenshot - 3D if active for this screenshot, otherwise 2D
  const settings = screenshot.screenshot;
  const use3D = settings.use3D || false;

  if (img) {
    if (
      use3D &&
      typeof renderThreeJSForScreenshot === "function" &&
      phoneModelLoaded
    ) {
      // Render 3D phone model for this specific screenshot
      renderThreeJSForScreenshot(targetCanvas, dims.width, dims.height, index);
    } else {
      // Draw 2D screenshot using localized image
      drawScreenshotToContext(targetCtx, dims, img, settings);
    }
  }

  // Elements above screenshot
  drawElementsToContext(targetCtx, dims, elements, "above-screenshot");

  // Draw popouts
  const popouts = screenshot.popouts || [];
  drawPopoutsToContext(targetCtx, dims, popouts, img, settings);

  // Draw text
  const txt = screenshot.text;
  drawTextToContext(targetCtx, dims, txt);

  // Elements above text
  drawElementsToContext(targetCtx, dims, elements, "above-text");
}

function drawBackgroundToContext(context, dims, bg) {
  if (bg.type === "gradient") {
    const angle = (bg.gradient.angle * Math.PI) / 180;
    const x1 = dims.width / 2 - Math.cos(angle) * dims.width;
    const y1 = dims.height / 2 - Math.sin(angle) * dims.height;
    const x2 = dims.width / 2 + Math.cos(angle) * dims.width;
    const y2 = dims.height / 2 + Math.sin(angle) * dims.height;

    const gradient = context.createLinearGradient(x1, y1, x2, y2);
    bg.gradient.stops.forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });

    context.fillStyle = gradient;
    context.fillRect(0, 0, dims.width, dims.height);
  } else if (bg.type === "solid") {
    context.fillStyle = bg.solid;
    context.fillRect(0, 0, dims.width, dims.height);
  } else if (bg.type === "image" && bg.image) {
    const img = bg.image;
    let sx = 0,
      sy = 0,
      sw = img.width,
      sh = img.height;
    let dx = 0,
      dy = 0,
      dw = dims.width,
      dh = dims.height;

    if (bg.imageFit === "cover") {
      const imgRatio = img.width / img.height;
      const canvasRatio = dims.width / dims.height;

      if (imgRatio > canvasRatio) {
        sw = img.height * canvasRatio;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / canvasRatio;
        sy = (img.height - sh) / 2;
      }
    } else if (bg.imageFit === "contain") {
      const imgRatio = img.width / img.height;
      const canvasRatio = dims.width / dims.height;

      if (imgRatio > canvasRatio) {
        dh = dims.width / imgRatio;
        dy = (dims.height - dh) / 2;
      } else {
        dw = dims.height * imgRatio;
        dx = (dims.width - dw) / 2;
      }

      context.fillStyle = "#000";
      context.fillRect(0, 0, dims.width, dims.height);
    }

    if (bg.imageBlur > 0) {
      context.filter = `blur(${bg.imageBlur}px)`;
    }

    context.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    context.filter = "none";

    if (bg.overlayOpacity > 0) {
      context.fillStyle = bg.overlayColor;
      context.globalAlpha = bg.overlayOpacity / 100;
      context.fillRect(0, 0, dims.width, dims.height);
      context.globalAlpha = 1;
    }
  }
}

function drawNoiseToContext(context, dims, intensity) {
  const imageData = context.getImageData(0, 0, dims.width, dims.height);
  const data = imageData.data;
  const noiseAmount = intensity / 100;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 255 * noiseAmount;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  context.putImageData(imageData, 0, 0);
}

function drawScreenshotToContext(context, dims, img, settings) {
  if (!img) return;

  const scale = settings.scale / 100;
  let imgWidth = dims.width * scale;
  let imgHeight = (img.height / img.width) * imgWidth;

  if (imgHeight > dims.height * scale) {
    imgHeight = dims.height * scale;
    imgWidth = (img.width / img.height) * imgHeight;
  }

  const x = (dims.width - imgWidth) * (settings.x / 100);
  const y = (dims.height - imgHeight) * (settings.y / 100);
  const centerX = x + imgWidth / 2;
  const centerY = y + imgHeight / 2;

  context.save();

  // Apply transformations
  context.translate(centerX, centerY);

  // Apply rotation
  if (settings.rotation !== 0) {
    context.rotate((settings.rotation * Math.PI) / 180);
  }

  // Apply perspective (simulated with scale transform)
  if (settings.perspective !== 0) {
    context.transform(1, settings.perspective * 0.01, 0, 1, 0, 0);
  }

  context.translate(-centerX, -centerY);

  // Scale corner radius with image size
  const radius = (settings.cornerRadius || 0) * (imgWidth / 400);

  // Draw shadow first (needs a filled shape, not clipped)
  if (settings.shadow && settings.shadow.enabled) {
    const shadowOpacity = settings.shadow.opacity / 100;
    const shadowColor =
      settings.shadow.color +
      Math.round(shadowOpacity * 255)
        .toString(16)
        .padStart(2, "0");
    context.shadowColor = shadowColor;
    context.shadowBlur = settings.shadow.blur;
    context.shadowOffsetX = settings.shadow.x;
    context.shadowOffsetY = settings.shadow.y;

    // Draw filled rounded rect for shadow
    context.fillStyle = "#000";
    context.beginPath();
    context.roundRect(x, y, imgWidth, imgHeight, radius);
    context.fill();

    // Reset shadow before drawing image
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetX = 0;
    context.shadowOffsetY = 0;
  }

  // Clip and draw image
  context.beginPath();
  context.roundRect(x, y, imgWidth, imgHeight, radius);
  context.clip();
  context.drawImage(img, x, y, imgWidth, imgHeight);

  context.restore();

  // Draw device frame if enabled
  if (settings.frame && settings.frame.enabled) {
    context.save();
    context.translate(centerX, centerY);
    if (settings.rotation !== 0) {
      context.rotate((settings.rotation * Math.PI) / 180);
    }
    if (settings.perspective !== 0) {
      context.transform(1, settings.perspective * 0.01, 0, 1, 0, 0);
    }
    context.translate(-centerX, -centerY);
    drawDeviceFrameToContext(context, x, y, imgWidth, imgHeight, settings);
    context.restore();
  }
}

function drawDeviceFrameToContext(context, x, y, width, height, settings) {
  const frameColor = settings.frame.color;
  const frameWidth = settings.frame.width * (width / 400);
  const frameOpacity = settings.frame.opacity / 100;
  const radius = (settings.cornerRadius || 0) * (width / 400) + frameWidth;

  context.globalAlpha = frameOpacity;
  context.strokeStyle = frameColor;
  context.lineWidth = frameWidth;
  context.beginPath();
  context.roundRect(
    x - frameWidth / 2,
    y - frameWidth / 2,
    width + frameWidth,
    height + frameWidth,
    radius,
  );
  context.stroke();
  context.globalAlpha = 1;
}

function drawTextToContext(context, dims, txt) {
  // Check enabled states (default headline to true for backwards compatibility)
  const headlineEnabled = txt.headlineEnabled !== false;
  const subheadlineEnabled = txt.subheadlineEnabled || false;

  const headlineLang = txt.currentHeadlineLang || "en";
  const subheadlineLang = txt.currentSubheadlineLang || "en";
  const layoutLang = getTextLayoutLanguage(txt);
  const headlineLayout = getEffectiveLayout(txt, headlineLang);
  const subheadlineLayout = getEffectiveLayout(txt, subheadlineLang);
  const layoutSettings = getEffectiveLayout(txt, layoutLang);

  const headline =
    headlineEnabled && txt.headlines ? txt.headlines[headlineLang] || "" : "";
  const subheadline =
    subheadlineEnabled && txt.subheadlines
      ? txt.subheadlines[subheadlineLang] || ""
      : "";

  if (!headline && !subheadline) return;

  const padding = dims.width * 0.08;
  const textY =
    layoutSettings.position === "top"
      ? dims.height * (layoutSettings.offsetY / 100)
      : dims.height * (1 - layoutSettings.offsetY / 100);

  context.textAlign = "center";
  context.textBaseline = layoutSettings.position === "top" ? "top" : "bottom";

  let currentY = textY;

  // Draw headline
  if (headline) {
    const fontStyle = txt.headlineItalic ? "italic" : "normal";
    context.font = `${fontStyle} ${txt.headlineWeight} ${headlineLayout.headlineSize}px ${txt.headlineFont}`;
    context.fillStyle = txt.headlineColor;

    const lines = wrapText(context, headline, dims.width - padding * 2);
    const lineHeight =
      headlineLayout.headlineSize * (layoutSettings.lineHeight / 100);

    // For bottom positioning, offset currentY so lines draw correctly
    if (layoutSettings.position === "bottom") {
      currentY -= (lines.length - 1) * lineHeight;
    }

    let lastLineY;
    lines.forEach((line, i) => {
      const y = currentY + i * lineHeight;
      lastLineY = y;
      context.fillText(line, dims.width / 2, y);

      // Calculate text metrics for decorations
      const textWidth = context.measureText(line).width;
      const fontSize = headlineLayout.headlineSize;
      const lineThickness = Math.max(2, fontSize * 0.05);
      const x = dims.width / 2 - textWidth / 2;

      // Draw underline
      if (txt.headlineUnderline) {
        const underlineY =
          layoutSettings.position === "top"
            ? y + fontSize * 0.9
            : y + fontSize * 0.1;
        context.fillRect(x, underlineY, textWidth, lineThickness);
      }

      // Draw strikethrough
      if (txt.headlineStrikethrough) {
        const strikeY =
          layoutSettings.position === "top"
            ? y + fontSize * 0.4
            : y - fontSize * 0.4;
        context.fillRect(x, strikeY, textWidth, lineThickness);
      }
    });

    // Track where subheadline should start (below the bottom edge of headline)
    // The gap between headline and subheadline should be (lineHeight - fontSize)
    // This is the "extra" spacing beyond the text itself
    const gap = lineHeight - headlineLayout.headlineSize;
    if (layoutSettings.position === "top") {
      // For top: lastLineY is top of last line, add fontSize to get bottom, then add gap
      currentY = lastLineY + headlineLayout.headlineSize + gap;
    } else {
      // For bottom: lastLineY is already the bottom of last line, just add gap
      currentY = lastLineY + gap;
    }
  }

  // Draw subheadline (always below headline visually)
  if (subheadline) {
    const subFontStyle = txt.subheadlineItalic ? "italic" : "normal";
    const subWeight = txt.subheadlineWeight || "400";
    context.font = `${subFontStyle} ${subWeight} ${subheadlineLayout.subheadlineSize}px ${txt.subheadlineFont || txt.headlineFont}`;
    context.fillStyle = hexToRgba(
      txt.subheadlineColor,
      txt.subheadlineOpacity / 100,
    );

    const lines = wrapText(context, subheadline, dims.width - padding * 2);
    const subLineHeight = subheadlineLayout.subheadlineSize * 1.4;

    // Subheadline starts after headline with gap determined by headline lineHeight
    // For bottom position, switch to 'top' baseline so subheadline draws downward
    const subY = currentY;
    if (layoutSettings.position === "bottom") {
      context.textBaseline = "top";
    }

    lines.forEach((line, i) => {
      const y = subY + i * subLineHeight;
      context.fillText(line, dims.width / 2, y);

      // Calculate text metrics for decorations
      const textWidth = context.measureText(line).width;
      const fontSize = subheadlineLayout.subheadlineSize;
      const lineThickness = Math.max(2, fontSize * 0.05);
      const x = dims.width / 2 - textWidth / 2;

      // Draw underline (using 'top' baseline for subheadline)
      if (txt.subheadlineUnderline) {
        const underlineY = y + fontSize * 0.9;
        context.fillRect(x, underlineY, textWidth, lineThickness);
      }

      // Draw strikethrough
      if (txt.subheadlineStrikethrough) {
        const strikeY = y + fontSize * 0.4;
        context.fillRect(x, strikeY, textWidth, lineThickness);
      }
    });

    // Restore baseline if we changed it
    if (layoutSettings.position === "bottom") {
      context.textBaseline = "bottom";
    }
  }
}

