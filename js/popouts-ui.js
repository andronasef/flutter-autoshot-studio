/* ===== Popouts tab UI & interactive crop preview ===== */
/* auto-split from app.js lines 4727–6682 */
// ===== Popouts Tab UI =====

function updatePopoutsList() {
  const listEl = document.getElementById("popouts-list");
  const emptyEl = document.getElementById("popouts-empty");
  const addBtn = document.getElementById("add-popout-btn");
  if (!listEl) return;

  const popouts = getPopouts();
  const screenshot = getCurrentScreenshot();
  const hasImage = screenshot && getScreenshotImage(screenshot);

  // Disable add button when no screenshot image
  if (addBtn) {
    addBtn.disabled = !hasImage;
    addBtn.style.opacity = hasImage ? "" : "0.4";
  }

  // Remove old items
  listEl.querySelectorAll(".popout-item").forEach((el) => el.remove());

  if (popouts.length === 0) {
    if (emptyEl) emptyEl.style.display = "";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  popouts.forEach((p, idx) => {
    const item = document.createElement("div");
    item.className =
      "popout-item" + (p.id === selectedPopoutId ? " selected" : "");
    item.dataset.popoutId = p.id;

    // Generate crop preview thumbnail
    const thumbCanvas = document.createElement("canvas");
    thumbCanvas.width = 28;
    thumbCanvas.height = 28;
    const thumbCtx = thumbCanvas.getContext("2d");
    const img = hasImage ? getScreenshotImage(screenshot) : null;
    if (img) {
      const sx = (p.cropX / 100) * img.width;
      const sy = (p.cropY / 100) * img.height;
      const sw = (p.cropWidth / 100) * img.width;
      const sh = (p.cropHeight / 100) * img.height;
      thumbCtx.drawImage(img, sx, sy, sw, sh, 0, 0, 28, 28);
    }

    item.innerHTML = `
            <div class="popout-item-thumb"></div>
            <div class="popout-item-info">
                <div class="popout-item-name">Popout ${idx + 1}</div>
                <div class="popout-item-crop">${Math.round(p.cropWidth)}% × ${Math.round(p.cropHeight)}%</div>
            </div>
            <div class="popout-item-actions">
                <button class="element-item-btn" data-action="move-up" title="Move up">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="18 15 12 9 6 15"/>
                    </svg>
                </button>
                <button class="element-item-btn" data-action="move-down" title="Move down">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
                <button class="element-item-btn danger" data-action="delete" title="Delete">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                </button>
            </div>
        `;

    // Insert thumbnail canvas
    const thumbHolder = item.querySelector(".popout-item-thumb");
    if (thumbHolder) thumbHolder.appendChild(thumbCanvas);

    item.addEventListener("click", (e) => {
      if (e.target.closest(".element-item-btn")) return;
      selectedPopoutId = p.id;
      updatePopoutsList();
      updatePopoutProperties();
    });

    item.querySelectorAll(".element-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "delete") deletePopout(p.id);
        else if (action === "move-up") movePopout(p.id, "up");
        else if (action === "move-down") movePopout(p.id, "down");
      });
    });

    listEl.appendChild(item);
  });
}

function updatePopoutProperties() {
  const propsEl = document.getElementById("popout-properties");
  if (!propsEl) return;

  const p = getSelectedPopout();
  if (!p) {
    propsEl.style.display = "none";
    return;
  }
  propsEl.style.display = "";

  // Crop region
  document.getElementById("popout-crop-x").value = p.cropX;
  document.getElementById("popout-crop-x-value").textContent =
    formatValue(p.cropX) + "%";
  document.getElementById("popout-crop-y").value = p.cropY;
  document.getElementById("popout-crop-y-value").textContent =
    formatValue(p.cropY) + "%";
  document.getElementById("popout-crop-width").value = p.cropWidth;
  document.getElementById("popout-crop-width-value").textContent =
    formatValue(p.cropWidth) + "%";
  document.getElementById("popout-crop-height").value = p.cropHeight;
  document.getElementById("popout-crop-height-value").textContent =
    formatValue(p.cropHeight) + "%";

  // Display
  document.getElementById("popout-x").value = p.x;
  document.getElementById("popout-x-value").textContent =
    formatValue(p.x) + "%";
  document.getElementById("popout-y").value = p.y;
  document.getElementById("popout-y-value").textContent =
    formatValue(p.y) + "%";
  document.getElementById("popout-width").value = p.width;
  document.getElementById("popout-width-value").textContent =
    formatValue(p.width) + "%";
  document.getElementById("popout-rotation").value = p.rotation;
  document.getElementById("popout-rotation-value").textContent =
    formatValue(p.rotation) + "°";
  document.getElementById("popout-opacity").value = p.opacity;
  document.getElementById("popout-opacity-value").textContent =
    formatValue(p.opacity) + "%";
  document.getElementById("popout-corner-radius").value = p.cornerRadius;
  document.getElementById("popout-corner-radius-value").textContent =
    formatValue(p.cornerRadius) + "px";

  // Shadow
  const shadow = p.shadow || {
    enabled: false,
    color: "#000000",
    blur: 30,
    opacity: 40,
    x: 0,
    y: 15,
  };
  document
    .getElementById("popout-shadow-toggle")
    .classList.toggle("active", shadow.enabled);
  const shadowRow = document
    .getElementById("popout-shadow-toggle")
    ?.closest(".toggle-row");
  if (shadowRow) shadowRow.classList.toggle("collapsed", !shadow.enabled);
  document.getElementById("popout-shadow-options").style.display =
    shadow.enabled ? "" : "none";
  document.getElementById("popout-shadow-color").value = shadow.color;
  document.getElementById("popout-shadow-color-hex").value = shadow.color;
  document.getElementById("popout-shadow-blur").value = shadow.blur;
  document.getElementById("popout-shadow-blur-value").textContent =
    formatValue(shadow.blur) + "px";
  document.getElementById("popout-shadow-opacity").value = shadow.opacity;
  document.getElementById("popout-shadow-opacity-value").textContent =
    formatValue(shadow.opacity) + "%";
  document.getElementById("popout-shadow-x").value = shadow.x;
  document.getElementById("popout-shadow-x-value").textContent =
    formatValue(shadow.x) + "px";
  document.getElementById("popout-shadow-y").value = shadow.y;
  document.getElementById("popout-shadow-y-value").textContent =
    formatValue(shadow.y) + "px";

  // Border
  const border = p.border || {
    enabled: false,
    color: "#ffffff",
    width: 3,
    opacity: 100,
  };
  document
    .getElementById("popout-border-toggle")
    .classList.toggle("active", border.enabled);
  const borderRow = document
    .getElementById("popout-border-toggle")
    ?.closest(".toggle-row");
  if (borderRow) borderRow.classList.toggle("collapsed", !border.enabled);
  document.getElementById("popout-border-options").style.display =
    border.enabled ? "" : "none";
  document.getElementById("popout-border-color").value = border.color;
  document.getElementById("popout-border-color-hex").value = border.color;
  document.getElementById("popout-border-width").value = border.width;
  document.getElementById("popout-border-width-value").textContent =
    formatValue(border.width) + "px";
  document.getElementById("popout-border-opacity").value = border.opacity;
  document.getElementById("popout-border-opacity-value").textContent =
    formatValue(border.opacity) + "%";

  // Update crop preview
  updateCropPreview();
}

// Compute image-fit layout within the crop preview canvas (letterboxed)
function getCropPreviewLayout(previewCanvas, img) {
  const w = previewCanvas.width;
  const h = previewCanvas.height;
  const imgAspect = img.width / img.height;
  const canvasAspect = w / h;
  let drawW, drawH, drawX, drawY;
  if (imgAspect > canvasAspect) {
    drawW = w;
    drawH = w / imgAspect;
    drawX = 0;
    drawY = (h - drawH) / 2;
  } else {
    drawH = h;
    drawW = h * imgAspect;
    drawX = (w - drawW) / 2;
    drawY = 0;
  }
  return { drawX, drawY, drawW, drawH };
}

function updateCropPreview() {
  const previewCanvas = document.getElementById("popout-crop-preview");
  if (!previewCanvas) return;
  const p = getSelectedPopout();
  const screenshot = getCurrentScreenshot();
  if (!p || !screenshot) return;
  const img = getScreenshotImage(screenshot);
  if (!img) return;

  // Resize canvas to match sidebar width while keeping image aspect
  const containerWidth = previewCanvas.parentElement?.clientWidth || 280;
  const imgAspect = img.width / img.height;
  const canvasW = containerWidth * 2; // 2x for retina
  const canvasH = Math.round(canvasW / imgAspect);
  previewCanvas.width = canvasW;
  previewCanvas.height = canvasH;
  previewCanvas.style.width = containerWidth + "px";
  previewCanvas.style.height = Math.round(containerWidth / imgAspect) + "px";

  const ctx2 = previewCanvas.getContext("2d");
  const layout = getCropPreviewLayout(previewCanvas, img);
  const { drawX, drawY, drawW, drawH } = layout;

  ctx2.clearRect(0, 0, canvasW, canvasH);

  // Draw full image
  ctx2.drawImage(img, drawX, drawY, drawW, drawH);

  // Dim overlay outside crop region
  const rx = drawX + (p.cropX / 100) * drawW;
  const ry = drawY + (p.cropY / 100) * drawH;
  const rw = (p.cropWidth / 100) * drawW;
  const rh = (p.cropHeight / 100) * drawH;

  ctx2.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx2.fillRect(0, 0, canvasW, canvasH);

  // Clear crop region to show undimmed image
  ctx2.save();
  ctx2.beginPath();
  ctx2.rect(rx, ry, rw, rh);
  ctx2.clip();
  ctx2.clearRect(rx, ry, rw, rh);
  ctx2.drawImage(img, drawX, drawY, drawW, drawH);
  ctx2.restore();

  // Crop border
  ctx2.strokeStyle = "rgba(10, 132, 255, 0.9)";
  ctx2.lineWidth = 2;
  ctx2.strokeRect(rx, ry, rw, rh);

  // Corner handles (vector editor style)
  const handleSize = 8;
  const handles = [
    { x: rx, y: ry }, // top-left
    { x: rx + rw, y: ry }, // top-right
    { x: rx, y: ry + rh }, // bottom-left
    { x: rx + rw, y: ry + rh }, // bottom-right
  ];
  // Edge midpoint handles
  const midHandles = [
    { x: rx + rw / 2, y: ry }, // top-center
    { x: rx + rw / 2, y: ry + rh }, // bottom-center
    { x: rx, y: ry + rh / 2 }, // left-center
    { x: rx + rw, y: ry + rh / 2 }, // right-center
  ];

  ctx2.fillStyle = "#ffffff";
  ctx2.strokeStyle = "rgba(10, 132, 255, 1)";
  ctx2.lineWidth = 1.5;
  [...handles, ...midHandles].forEach((h) => {
    ctx2.fillRect(
      h.x - handleSize / 2,
      h.y - handleSize / 2,
      handleSize,
      handleSize,
    );
    ctx2.strokeRect(
      h.x - handleSize / 2,
      h.y - handleSize / 2,
      handleSize,
      handleSize,
    );
  });
}

// ===== Interactive crop preview drag =====
let cropDragState = null;

function setupCropPreviewDrag() {
  const previewCanvas = document.getElementById("popout-crop-preview");
  if (!previewCanvas) return;

  function getCropCanvasCoords(e) {
    const rect = previewCanvas.getBoundingClientRect();
    const scaleX = previewCanvas.width / rect.width;
    const scaleY = previewCanvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function hitTestCropHandle(coords) {
    const p = getSelectedPopout();
    const screenshot = getCurrentScreenshot();
    if (!p || !screenshot) return null;
    const img = getScreenshotImage(screenshot);
    if (!img) return null;

    const layout = getCropPreviewLayout(previewCanvas, img);
    const { drawX, drawY, drawW, drawH } = layout;
    const rx = drawX + (p.cropX / 100) * drawW;
    const ry = drawY + (p.cropY / 100) * drawH;
    const rw = (p.cropWidth / 100) * drawW;
    const rh = (p.cropHeight / 100) * drawH;

    const hitR = 12; // hit radius
    const tests = [
      { x: rx, y: ry, handle: "top-left" },
      { x: rx + rw, y: ry, handle: "top-right" },
      { x: rx, y: ry + rh, handle: "bottom-left" },
      { x: rx + rw, y: ry + rh, handle: "bottom-right" },
      { x: rx + rw / 2, y: ry, handle: "top" },
      { x: rx + rw / 2, y: ry + rh, handle: "bottom" },
      { x: rx, y: ry + rh / 2, handle: "left" },
      { x: rx + rw, y: ry + rh / 2, handle: "right" },
    ];
    for (const t of tests) {
      if (Math.abs(coords.x - t.x) < hitR && Math.abs(coords.y - t.y) < hitR) {
        return t.handle;
      }
    }
    // Check if inside the crop region (move)
    if (
      coords.x >= rx &&
      coords.x <= rx + rw &&
      coords.y >= ry &&
      coords.y <= ry + rh
    ) {
      return "move";
    }
    return null;
  }

  function startCropDrag(e) {
    const coords = getCropCanvasCoords(e);
    const handle = hitTestCropHandle(coords);
    if (!handle) return;

    e.preventDefault();
    const p = getSelectedPopout();
    if (!p) return;
    cropDragState = {
      handle,
      startX: coords.x,
      startY: coords.y,
      origCropX: p.cropX,
      origCropY: p.cropY,
      origCropW: p.cropWidth,
      origCropH: p.cropHeight,
    };
  }

  function moveCropDrag(e) {
    if (!cropDragState) {
      // Update cursor based on hover
      const coords = getCropCanvasCoords(e);
      const handle = hitTestCropHandle(coords);
      const cursorMap = {
        "top-left": "nwse-resize",
        "bottom-right": "nwse-resize",
        "top-right": "nesw-resize",
        "bottom-left": "nesw-resize",
        top: "ns-resize",
        bottom: "ns-resize",
        left: "ew-resize",
        right: "ew-resize",
        move: "move",
      };
      previewCanvas.style.cursor = cursorMap[handle] || "default";
      return;
    }
    e.preventDefault();
    const coords = getCropCanvasCoords(e);
    const p = getSelectedPopout();
    const screenshot = getCurrentScreenshot();
    if (!p || !screenshot) return;
    const img = getScreenshotImage(screenshot);
    if (!img) return;

    const layout = getCropPreviewLayout(previewCanvas, img);
    const { drawW, drawH } = layout;

    // Convert pixel delta to percentage
    const dxPct = ((coords.x - cropDragState.startX) / drawW) * 100;
    const dyPct = ((coords.y - cropDragState.startY) / drawH) * 100;
    const h = cropDragState.handle;
    const orig = cropDragState;

    let newX = orig.origCropX,
      newY = orig.origCropY;
    let newW = orig.origCropW,
      newH = orig.origCropH;

    if (h === "move") {
      newX = Math.max(0, Math.min(100 - newW, orig.origCropX + dxPct));
      newY = Math.max(0, Math.min(100 - newH, orig.origCropY + dyPct));
    } else {
      if (h.includes("left")) {
        newX = orig.origCropX + dxPct;
        newW = orig.origCropW - dxPct;
      }
      if (h.includes("right") || h === "right") {
        newW = orig.origCropW + dxPct;
      }
      if (h.includes("top")) {
        newY = orig.origCropY + dyPct;
        newH = orig.origCropH - dyPct;
      }
      if (h.includes("bottom") || h === "bottom") {
        newH = orig.origCropH + dyPct;
      }

      // Enforce minimums
      if (newW < 5) {
        if (h.includes("left")) newX = orig.origCropX + orig.origCropW - 5;
        newW = 5;
      }
      if (newH < 5) {
        if (h.includes("top")) newY = orig.origCropY + orig.origCropH - 5;
        newH = 5;
      }

      // Clamp to canvas bounds
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      if (newX + newW > 100) newW = 100 - newX;
      if (newY + newH > 100) newH = 100 - newY;
    }

    p.cropX = newX;
    p.cropY = newY;
    p.cropWidth = newW;
    p.cropHeight = newH;
    updateCropPreview();
    updatePopoutProperties();
    updateCanvas();
  }

  function endCropDrag() {
    cropDragState = null;
  }

  previewCanvas.addEventListener("mousedown", startCropDrag);
  window.addEventListener("mousemove", moveCropDrag);
  window.addEventListener("mouseup", endCropDrag);
  previewCanvas.addEventListener("touchstart", startCropDrag, {
    passive: false,
  });
  previewCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (cropDragState) moveCropDrag(e);
    },
    { passive: false },
  );
  previewCanvas.addEventListener("touchend", endCropDrag);
}

function setupPopoutEventListeners() {
  // Add Popout button
  const addBtn = document.getElementById("add-popout-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => addPopout());
  }

  // Crop sliders
  const bindPopoutSlider = (id, key, suffix) => {
    const input = document.getElementById(id);
    const valueEl = document.getElementById(id + "-value");
    if (!input) return;
    input.addEventListener("input", () => {
      const val = parseFloat(input.value);
      if (valueEl) valueEl.textContent = formatValue(val) + suffix;
      if (selectedPopoutId) setPopoutProperty(selectedPopoutId, key, val);
      if (key.startsWith("crop")) updateCropPreview();
    });
  };

  bindPopoutSlider("popout-crop-x", "cropX", "%");
  bindPopoutSlider("popout-crop-y", "cropY", "%");
  bindPopoutSlider("popout-crop-width", "cropWidth", "%");
  bindPopoutSlider("popout-crop-height", "cropHeight", "%");
  bindPopoutSlider("popout-x", "x", "%");
  bindPopoutSlider("popout-y", "y", "%");
  bindPopoutSlider("popout-width", "width", "%");
  bindPopoutSlider("popout-rotation", "rotation", "°");
  bindPopoutSlider("popout-opacity", "opacity", "%");
  bindPopoutSlider("popout-corner-radius", "cornerRadius", "px");

  // Shadow toggle
  const shadowToggle = document.getElementById("popout-shadow-toggle");
  if (shadowToggle) {
    shadowToggle.addEventListener("click", () => {
      const p = getSelectedPopout();
      if (!p) return;
      p.shadow.enabled = !p.shadow.enabled;
      updatePopoutProperties();
      updateCanvas();
    });
  }

  // Shadow properties
  const bindPopoutShadow = (inputId, prop, suffix) => {
    const input = document.getElementById(inputId);
    const valEl = document.getElementById(inputId + "-value");
    if (!input) return;
    input.addEventListener("input", () => {
      const p = getSelectedPopout();
      if (!p) return;
      p.shadow[prop] = parseFloat(input.value);
      if (valEl)
        valEl.textContent = formatValue(parseFloat(input.value)) + suffix;
      updateCanvas();
    });
  };
  bindPopoutShadow("popout-shadow-blur", "blur", "px");
  bindPopoutShadow("popout-shadow-opacity", "opacity", "%");
  bindPopoutShadow("popout-shadow-x", "x", "px");
  bindPopoutShadow("popout-shadow-y", "y", "px");

  // Shadow color
  const shadowColor = document.getElementById("popout-shadow-color");
  const shadowColorHex = document.getElementById("popout-shadow-color-hex");
  if (shadowColor) {
    shadowColor.addEventListener("input", () => {
      const p = getSelectedPopout();
      if (p) {
        p.shadow.color = shadowColor.value;
        if (shadowColorHex) shadowColorHex.value = shadowColor.value;
        updateCanvas();
      }
    });
  }
  if (shadowColorHex) {
    shadowColorHex.addEventListener("change", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(shadowColorHex.value)) {
        const p = getSelectedPopout();
        if (p) {
          p.shadow.color = shadowColorHex.value;
          if (shadowColor) shadowColor.value = shadowColorHex.value;
          updateCanvas();
        }
      }
    });
  }

  // Border toggle
  const borderToggle = document.getElementById("popout-border-toggle");
  if (borderToggle) {
    borderToggle.addEventListener("click", () => {
      const p = getSelectedPopout();
      if (!p) return;
      p.border.enabled = !p.border.enabled;
      updatePopoutProperties();
      updateCanvas();
    });
  }

  // Border properties
  const bindPopoutBorder = (inputId, prop, suffix) => {
    const input = document.getElementById(inputId);
    const valEl = document.getElementById(inputId + "-value");
    if (!input) return;
    input.addEventListener("input", () => {
      const p = getSelectedPopout();
      if (!p) return;
      p.border[prop] = parseFloat(input.value);
      if (valEl)
        valEl.textContent = formatValue(parseFloat(input.value)) + suffix;
      updateCanvas();
    });
  };
  bindPopoutBorder("popout-border-width", "width", "px");
  bindPopoutBorder("popout-border-opacity", "opacity", "%");

  // Border color
  const borderColor = document.getElementById("popout-border-color");
  const borderColorHex = document.getElementById("popout-border-color-hex");
  if (borderColor) {
    borderColor.addEventListener("input", () => {
      const p = getSelectedPopout();
      if (p) {
        p.border.color = borderColor.value;
        if (borderColorHex) borderColorHex.value = borderColor.value;
        updateCanvas();
      }
    });
  }
  if (borderColorHex) {
    borderColorHex.addEventListener("change", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(borderColorHex.value)) {
        const p = getSelectedPopout();
        if (p) {
          p.border.color = borderColorHex.value;
          if (borderColor) borderColor.value = borderColorHex.value;
          updateCanvas();
        }
      }
    });
  }

  // Interactive crop preview drag handles
  setupCropPreviewDrag();
}

function setupEventListeners() {
  // Collapsible toggle rows
  document.querySelectorAll(".toggle-row.collapsible").forEach((row) => {
    row.addEventListener("click", (e) => {
      // Don't collapse when clicking the toggle switch itself
      if (e.target.closest(".toggle")) return;

      const targetId = row.dataset.target;
      const target = document.getElementById(targetId);
      if (target) {
        row.classList.toggle("collapsed");
        target.style.display = row.classList.contains("collapsed")
          ? "none"
          : "block";
      }
    });
  });

  // File upload
  fileInput.addEventListener("change", (e) => handleFiles(e.target.files));

  // Add screenshots button
  document
    .getElementById("add-screenshots-btn")
    .addEventListener("click", () => fileInput.click());

  // Add blank screen button
  document.getElementById("add-blank-btn").addEventListener("click", () => {
    createNewScreenshot(
      null,
      null,
      "Blank Screen",
      null,
      null,
      state.activeCategory,
    );
    state.selectedIndex = state.screenshots.length - 1;
    updateScreenshotList();
    syncUIWithState();
    updateGradientStopsUI();
    updateCanvas();
  });

  // Import autoshot ZIP button
  const autoshotZipInput = document.getElementById("autoshot-zip-input");
  document.getElementById("add-autoshot-btn").addEventListener("click", () => {
    autoshotZipInput.click();
  });
  autoshotZipInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (file) importAutoshotZip(file);
  });

  // Make the entire sidebar content area a drop zone
  const sidebarContent = screenshotList.closest(".sidebar-content");
  sidebarContent.addEventListener("dragover", (e) => {
    // Only handle file drops, not internal screenshot reordering
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      sidebarContent.classList.add("drop-active");
    }
  });
  sidebarContent.addEventListener("dragleave", (e) => {
    // Only remove class if leaving the area entirely
    if (!sidebarContent.contains(e.relatedTarget)) {
      sidebarContent.classList.remove("drop-active");
    }
  });
  sidebarContent.addEventListener("drop", (e) => {
    if (e.dataTransfer.types.includes("Files")) {
      e.preventDefault();
      sidebarContent.classList.remove("drop-active");
      handleFiles(e.dataTransfer.files);
    }
  });

  // Set as Default button (commented out)
  // document.getElementById('set-as-default-btn').addEventListener('click', () => {
  //     if (state.screenshots.length === 0) return;
  //     setCurrentScreenshotAsDefault();
  //     // Show brief confirmation
  //     const btn = document.getElementById('set-as-default-btn');
  //     const originalText = btn.textContent;
  //     btn.textContent = 'Saved!';
  //     btn.style.borderColor = 'var(--accent)';
  //     btn.style.color = 'var(--accent)';
  //     setTimeout(() => {
  //         btn.textContent = originalText;
  //         btn.style.borderColor = '';
  //         btn.style.color = '';
  //     }, 1500);
  // });

  // Project dropdown
  const projectDropdown = document.getElementById("project-dropdown");
  const projectTrigger = document.getElementById("project-trigger");

  projectTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    projectDropdown.classList.toggle("open");
    // Close output size dropdown if open
    document.getElementById("output-size-dropdown").classList.remove("open");
  });

  // Close project dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!projectDropdown.contains(e.target)) {
      projectDropdown.classList.remove("open");
    }
  });

  document.getElementById("new-project-btn").addEventListener("click", () => {
    document.getElementById("project-modal-title").textContent = "New Project";
    document.getElementById("project-name-input").value = "";
    document.getElementById("project-modal-confirm").textContent = "Create";
    document.getElementById("project-modal").dataset.mode = "new";

    const duplicateGroup = document.getElementById("duplicate-from-group");
    const duplicateSelect = document.getElementById("duplicate-from-select");
    if (projects.length > 0) {
      duplicateGroup.style.display = "block";
      duplicateSelect.innerHTML =
        '<option value="">None (empty project)</option>';
      projects.forEach((p) => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent =
          p.name +
          (p.screenshotCount ? ` (${p.screenshotCount} screenshots)` : "");
        duplicateSelect.appendChild(option);
      });
    } else {
      duplicateGroup.style.display = "none";
    }

    document.getElementById("project-modal").classList.add("visible");
    document.getElementById("project-name-input").focus();
  });

  document
    .getElementById("duplicate-from-select")
    .addEventListener("change", (e) => {
      const selectedId = e.target.value;
      if (selectedId) {
        const selectedProject = projects.find((p) => p.id === selectedId);
        if (selectedProject) {
          document.getElementById("project-name-input").value =
            selectedProject.name + " (Copy)";
        }
      } else {
        document.getElementById("project-name-input").value = "";
      }
    });

  document
    .getElementById("rename-project-btn")
    .addEventListener("click", () => {
      const project = projects.find((p) => p.id === currentProjectId);
      document.getElementById("project-modal-title").textContent =
        "Rename Project";
      document.getElementById("project-name-input").value = project
        ? project.name
        : "";
      document.getElementById("project-modal-confirm").textContent = "Rename";
      document.getElementById("project-modal").dataset.mode = "rename";
      document.getElementById("duplicate-from-group").style.display = "none";
      document.getElementById("project-modal").classList.add("visible");
      document.getElementById("project-name-input").focus();
    });

  document
    .getElementById("delete-project-btn")
    .addEventListener("click", async () => {
      if (projects.length <= 1) {
        await showAppAlert("Cannot delete the only project", "info");
        return;
      }
      const project = projects.find((p) => p.id === currentProjectId);
      document.getElementById("delete-project-message").textContent =
        `Are you sure you want to delete "${project ? project.name : "this project"}"? This cannot be undone.`;
      document.getElementById("delete-project-modal").classList.add("visible");
    });

  document
    .getElementById("export-project-btn")
    .addEventListener("click", () => {
      exportProject();
    });

  document
    .getElementById("import-project-btn")
    .addEventListener("click", () => {
      document.getElementById("import-project-input").click();
    });

  document
    .getElementById("import-project-input")
    .addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      e.target.value = "";
      await importProject(file);
    });

  // Project modal buttons
  document
    .getElementById("project-modal-cancel")
    .addEventListener("click", () => {
      document.getElementById("project-modal").classList.remove("visible");
    });

  document
    .getElementById("project-modal-confirm")
    .addEventListener("click", async () => {
      const name = document.getElementById("project-name-input").value.trim();
      if (!name) {
        await showAppAlert("Please enter a project name", "info");
        return;
      }

      const mode = document.getElementById("project-modal").dataset.mode;
      if (mode === "new") {
        const duplicateFromId = document.getElementById(
          "duplicate-from-select",
        ).value;
        if (duplicateFromId) {
          await duplicateProject(duplicateFromId, name);
        } else {
          createProject(name);
        }
      } else if (mode === "rename") {
        renameProject(name);
      }

      document.getElementById("project-modal").classList.remove("visible");
    });

  document
    .getElementById("project-name-input")
    .addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        document.getElementById("project-modal-confirm").click();
      }
    });

  // Delete project modal buttons
  document
    .getElementById("delete-project-cancel")
    .addEventListener("click", () => {
      document
        .getElementById("delete-project-modal")
        .classList.remove("visible");
    });

  document
    .getElementById("delete-project-confirm")
    .addEventListener("click", () => {
      deleteProject();
      document
        .getElementById("delete-project-modal")
        .classList.remove("visible");
    });

  // Apply style to all modal buttons
  document
    .getElementById("apply-style-cancel")
    .addEventListener("click", () => {
      document.getElementById("apply-style-modal").classList.remove("visible");
    });

  document
    .getElementById("apply-style-confirm")
    .addEventListener("click", () => {
      applyStyleToAll();
      document.getElementById("apply-style-modal").classList.remove("visible");
    });

  // Close modals on overlay click
  document.getElementById("project-modal").addEventListener("click", (e) => {
    if (e.target.id === "project-modal") {
      document.getElementById("project-modal").classList.remove("visible");
    }
  });

  document
    .getElementById("delete-project-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "delete-project-modal") {
        document
          .getElementById("delete-project-modal")
          .classList.remove("visible");
      }
    });

  document
    .getElementById("apply-style-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "apply-style-modal") {
        document
          .getElementById("apply-style-modal")
          .classList.remove("visible");
      }
    });

  // Language picker events
  document.getElementById("language-btn").addEventListener("click", (e) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    const menu = document.getElementById("language-menu");
    menu.classList.toggle("visible");
    if (menu.classList.contains("visible")) {
      // Position menu below button using fixed positioning
      const rect = btn.getBoundingClientRect();
      menu.style.top = rect.bottom + 4 + "px";
      menu.style.left = rect.left + "px";
      updateLanguageMenu();
    }
  });

  // Close language menu when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".language-picker")) {
      document.getElementById("language-menu").classList.remove("visible");
    }
  });

  // Edit Languages button
  document
    .getElementById("edit-languages-btn")
    .addEventListener("click", () => {
      openLanguagesModal();
    });

  // Translate All button
  document.getElementById("translate-all-btn").addEventListener("click", () => {
    document.getElementById("language-menu").classList.remove("visible");
    translateAllText();
  });

  // Magical Titles button (in header)
  document
    .getElementById("magical-titles-btn")
    .addEventListener("click", () => {
      dismissMagicalTitlesTooltip();
      showMagicalTitlesDialog();
    });

  // Magical Titles modal events
  document
    .getElementById("magical-titles-cancel")
    .addEventListener("click", hideMagicalTitlesDialog);
  document
    .getElementById("magical-titles-confirm")
    .addEventListener("click", generateMagicalTitles);
  document
    .getElementById("magical-titles-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "magical-titles-modal") hideMagicalTitlesDialog();
    });

  // Languages modal events
  document
    .getElementById("languages-modal-close")
    .addEventListener("click", closeLanguagesModal);
  document
    .getElementById("languages-modal-done")
    .addEventListener("click", closeLanguagesModal);
  document.getElementById("languages-modal").addEventListener("click", (e) => {
    if (e.target.id === "languages-modal") closeLanguagesModal();
  });

  document
    .getElementById("add-language-select")
    .addEventListener("change", (e) => {
      if (e.target.value) {
        addProjectLanguage(e.target.value);
        e.target.value = "";
      }
    });

  // Screenshot translations modal events
  document
    .getElementById("screenshot-translations-modal-close")
    .addEventListener("click", closeScreenshotTranslationsModal);
  document
    .getElementById("screenshot-translations-modal-done")
    .addEventListener("click", closeScreenshotTranslationsModal);
  document
    .getElementById("screenshot-translations-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "screenshot-translations-modal")
        closeScreenshotTranslationsModal();
    });
  document
    .getElementById("translation-file-input")
    .addEventListener("change", handleTranslationFileSelect);

  // Export language modal events
  document
    .getElementById("export-current-only")
    .addEventListener("click", () => {
      closeExportLanguageDialog("current");
    });
  document
    .getElementById("export-all-languages")
    .addEventListener("click", () => {
      closeExportLanguageDialog("all");
    });
  document
    .getElementById("export-language-modal-cancel")
    .addEventListener("click", () => {
      closeExportLanguageDialog(null);
    });
  document
    .getElementById("export-language-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "export-language-modal")
        closeExportLanguageDialog(null);
    });

  // Duplicate screenshot dialog
  initDuplicateDialogListeners();
  document
    .getElementById("duplicate-screenshot-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "duplicate-screenshot-modal")
        closeDuplicateDialog("ignore");
    });

  // Autoshot import dialog
  initAutoshotImportListeners();

  // Device category tabs (Phone / Tablet)
  document.querySelectorAll(".device-category-tab").forEach((tab) => {
    tab.addEventListener("click", () => switchToCategory(tab.dataset.category));
  });
  document
    .getElementById("autoshot-import-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "autoshot-import-modal") closeAutoshotImportModal();
    });

  // Translate button events
  document
    .getElementById("translate-headline-btn")
    .addEventListener("click", () => {
      openTranslateModal("headline");
    });

  document
    .getElementById("translate-subheadline-btn")
    .addEventListener("click", () => {
      openTranslateModal("subheadline");
    });

  document
    .getElementById("translate-element-btn")
    .addEventListener("click", () => {
      openTranslateModal("element");
    });

  document
    .getElementById("translate-source-lang")
    .addEventListener("change", (e) => {
      updateTranslateSourcePreview();
    });

  document
    .getElementById("translate-modal-cancel")
    .addEventListener("click", () => {
      document.getElementById("translate-modal").classList.remove("visible");
    });

  document
    .getElementById("translate-modal-apply")
    .addEventListener("click", () => {
      applyTranslations();
      document.getElementById("translate-modal").classList.remove("visible");
    });

  document.getElementById("ai-translate-btn").addEventListener("click", () => {
    aiTranslateAll();
  });

  document.getElementById("translate-modal").addEventListener("click", (e) => {
    if (e.target.id === "translate-modal") {
      document.getElementById("translate-modal").classList.remove("visible");
    }
  });

  // Save translate instructions to localStorage on change
  document
    .getElementById("translate-instructions")
    .addEventListener("change", (e) => {
      localStorage.setItem("translationInstructions", e.target.value);
    });

  // Text editor modal
  document.getElementById("text-editor-btn").addEventListener("click", () => {
    openTextEditorModal();
  });

  document.getElementById("text-editor-close").addEventListener("click", () => {
    closeTextEditorModal();
  });

  document.getElementById("text-editor-done").addEventListener("click", () => {
    closeTextEditorModal();
  });

  document
    .getElementById("text-editor-modal")
    .addEventListener("click", (e) => {
      if (e.target.id === "text-editor-modal") closeTextEditorModal();
    });

  // About modal
  document.getElementById("about-btn").addEventListener("click", () => {
    document.getElementById("about-modal").classList.add("visible");
    checkForUpdates();
  });

  document.getElementById("about-modal-close").addEventListener("click", () => {
    document.getElementById("about-modal").classList.remove("visible");
  });

  document.getElementById("about-modal").addEventListener("click", (e) => {
    if (e.target.id === "about-modal") {
      document.getElementById("about-modal").classList.remove("visible");
    }
  });

  // Settings modal
  document.getElementById("settings-btn").addEventListener("click", () => {
    openSettingsModal();
  });

  document
    .getElementById("settings-modal-close")
    .addEventListener("click", () => {
      document.getElementById("settings-modal").classList.remove("visible");
    });

  document
    .getElementById("settings-modal-cancel")
    .addEventListener("click", () => {
      document.getElementById("settings-modal").classList.remove("visible");
    });

  document
    .getElementById("settings-modal-save")
    .addEventListener("click", () => {
      saveSettings();
    });

  // Theme selector buttons
  document.querySelectorAll("#theme-selector button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#theme-selector button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyTheme(btn.dataset.theme);
    });
  });

  // Provider radio buttons
  document.querySelectorAll('input[name="ai-provider"]').forEach((radio) => {
    radio.addEventListener("change", (e) => {
      updateProviderSection(e.target.value);
    });
  });

  // Show/hide key buttons for all providers
  document.querySelectorAll(".settings-show-key").forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === "password" ? "text" : "password";
      }
    });
  });

  document.getElementById("settings-modal").addEventListener("click", (e) => {
    if (e.target.id === "settings-modal") {
      document.getElementById("settings-modal").classList.remove("visible");
    }
  });

  // Output size dropdown
  const outputDropdown = document.getElementById("output-size-dropdown");
  const outputTrigger = document.getElementById("output-size-trigger");

  outputTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    outputDropdown.classList.toggle("open");
    // Close project dropdown if open
    document.getElementById("project-dropdown").classList.remove("open");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!outputDropdown.contains(e.target)) {
      outputDropdown.classList.remove("open");
    }
  });

  // Device option selection
  document
    .querySelectorAll(".output-size-menu .device-option")
    .forEach((opt) => {
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        document
          .querySelectorAll(".output-size-menu .device-option")
          .forEach((o) => o.classList.remove("selected"));
        opt.classList.add("selected");
        state.outputDevice = opt.dataset.device;

        // Keep per-category settings in sync
        state.categorySettings[state.activeCategory] = {
          outputDevice: state.outputDevice,
          customWidth: state.customWidth,
          customHeight: state.customHeight,
        };

        // Update trigger text
        document.getElementById("output-size-name").textContent =
          opt.querySelector(".device-option-name").textContent;
        document.getElementById("output-size-dims").textContent =
          opt.querySelector(".device-option-size").textContent;

        // Show/hide custom inputs
        const customInputs = document.getElementById("custom-size-inputs");
        if (state.outputDevice === "custom") {
          customInputs.classList.add("visible");
        } else {
          customInputs.classList.remove("visible");
          outputDropdown.classList.remove("open");
        }
        updateCanvas();
      });
    });

  // Custom size inputs
  document.getElementById("custom-width").addEventListener("input", (e) => {
    state.customWidth = parseInt(e.target.value) || 1290;
    state.categorySettings[state.activeCategory].customWidth =
      state.customWidth;
    document.getElementById("output-size-dims").textContent =
      `${state.customWidth} × ${state.customHeight}`;
    updateCanvas();
  });
  document.getElementById("custom-height").addEventListener("input", (e) => {
    state.customHeight = parseInt(e.target.value) || 2796;
    state.categorySettings[state.activeCategory].customHeight =
      state.customHeight;
    document.getElementById("output-size-dims").textContent =
      `${state.customWidth} × ${state.customHeight}`;
    updateCanvas();
  });

  // Tabs
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById("tab-" + tab.dataset.tab).classList.add("active");
      // Save active tab to localStorage
      localStorage.setItem("activeTab", tab.dataset.tab);
    });
  });

  // Restore active tab from localStorage
  const savedTab = localStorage.getItem("activeTab");
  if (savedTab) {
    const tabBtn = document.querySelector(`.tab[data-tab="${savedTab}"]`);
    if (tabBtn) {
      document
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.remove("active"));
      document
        .querySelectorAll(".tab-content")
        .forEach((c) => c.classList.remove("active"));
      tabBtn.classList.add("active");
      document.getElementById("tab-" + savedTab).classList.add("active");
    }
  }

  // Background type selector
  document.querySelectorAll("#bg-type-selector button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#bg-type-selector button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setBackground("type", btn.dataset.type);

      document.getElementById("gradient-options").style.display =
        btn.dataset.type === "gradient" ? "block" : "none";
      document.getElementById("solid-options").style.display =
        btn.dataset.type === "solid" ? "block" : "none";
      document.getElementById("image-options").style.display =
        btn.dataset.type === "image" ? "block" : "none";

      updateCanvas();
    });
  });

  // Gradient preset dropdown toggle
  const presetDropdown = document.getElementById("gradient-preset-dropdown");
  const presetTrigger = document.getElementById("gradient-preset-trigger");
  presetTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    presetDropdown.classList.toggle("open");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!presetDropdown.contains(e.target)) {
      presetDropdown.classList.remove("open");
    }
  });

  // Position preset dropdown toggle
  const positionPresetDropdown = document.getElementById(
    "position-preset-dropdown",
  );
  const positionPresetTrigger = document.getElementById(
    "position-preset-trigger",
  );
  positionPresetTrigger.addEventListener("click", (e) => {
    e.stopPropagation();
    positionPresetDropdown.classList.toggle("open");
  });

  // Close position preset dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!positionPresetDropdown.contains(e.target)) {
      positionPresetDropdown.classList.remove("open");
    }
  });

  // Close screenshot menus when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".screenshot-menu-wrapper")) {
      document
        .querySelectorAll(".screenshot-menu.open")
        .forEach((m) => m.classList.remove("open"));
    }
  });

  // Gradient presets
  document.querySelectorAll(".preset-swatch").forEach((swatch) => {
    swatch.addEventListener("click", () => {
      document
        .querySelectorAll(".preset-swatch")
        .forEach((s) => s.classList.remove("selected"));
      swatch.classList.add("selected");

      // Parse gradient from preset
      const gradientStr = swatch.dataset.gradient;
      const angleMatch = gradientStr.match(/(\d+)deg/);
      const colorMatches = gradientStr.matchAll(/(#[a-fA-F0-9]{6})\s+(\d+)%/g);

      if (angleMatch) {
        const angle = parseInt(angleMatch[1]);
        setBackground("gradient.angle", angle);
        document.getElementById("gradient-angle").value = angle;
        document.getElementById("gradient-angle-value").textContent =
          formatValue(angle) + "°";
      }

      const stops = [];
      for (const match of colorMatches) {
        stops.push({ color: match[1], position: parseInt(match[2]) });
      }
      if (stops.length >= 2) {
        setBackground("gradient.stops", stops);
        updateGradientStopsUI();
      }

      updateCanvas();
    });
  });

  // Gradient angle
  document.getElementById("gradient-angle").addEventListener("input", (e) => {
    setBackground("gradient.angle", parseInt(e.target.value));
    document.getElementById("gradient-angle-value").textContent =
      formatValue(e.target.value) + "°";
    // Deselect preset when manually changing angle
    document
      .querySelectorAll(".preset-swatch")
      .forEach((s) => s.classList.remove("selected"));
    updateCanvas();
  });

  // Add gradient stop
  document.getElementById("add-gradient-stop").addEventListener("click", () => {
    const bg = getBackground();
    const lastStop = bg.gradient.stops[bg.gradient.stops.length - 1];
    bg.gradient.stops.push({
      color: lastStop.color,
      position: Math.min(lastStop.position + 20, 100),
    });
    // Deselect preset when adding a stop
    document
      .querySelectorAll(".preset-swatch")
      .forEach((s) => s.classList.remove("selected"));
    updateGradientStopsUI();
    updateCanvas();
  });

  // Solid color
  document.getElementById("solid-color").addEventListener("input", (e) => {
    setBackground("solid", e.target.value);
    document.getElementById("solid-color-hex").value = e.target.value;
    updateCanvas();
  });
  document.getElementById("solid-color-hex").addEventListener("input", (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      setBackground("solid", e.target.value);
      document.getElementById("solid-color").value = e.target.value;
      updateCanvas();
    }
  });

  // Background image
  const bgImageUpload = document.getElementById("bg-image-upload");
  const bgImageInput = document.getElementById("bg-image-input");
  bgImageUpload.addEventListener("click", () => bgImageInput.click());
  bgImageInput.addEventListener("change", (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackground("image", img);
          document.getElementById("bg-image-preview").src = event.target.result;
          document.getElementById("bg-image-preview").style.display = "block";
          updateCanvas();
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  });

  document.getElementById("bg-image-fit").addEventListener("change", (e) => {
    setBackground("imageFit", e.target.value);
    updateCanvas();
  });

  document.getElementById("bg-blur").addEventListener("input", (e) => {
    setBackground("imageBlur", parseInt(e.target.value));
    document.getElementById("bg-blur-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  document.getElementById("bg-overlay-color").addEventListener("input", (e) => {
    setBackground("overlayColor", e.target.value);
    document.getElementById("bg-overlay-hex").value = e.target.value;
    updateCanvas();
  });

  document
    .getElementById("bg-overlay-opacity")
    .addEventListener("input", (e) => {
      setBackground("overlayOpacity", parseInt(e.target.value));
      document.getElementById("bg-overlay-opacity-value").textContent =
        formatValue(e.target.value) + "%";
      updateCanvas();
    });

  // Noise toggle
  document
    .getElementById("noise-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const noiseEnabled = this.classList.contains("active");
      setBackground("noise", noiseEnabled);
      const row = this.closest(".toggle-row");
      if (noiseEnabled) {
        if (row) row.classList.remove("collapsed");
        document.getElementById("noise-options").style.display = "block";
      } else {
        if (row) row.classList.add("collapsed");
        document.getElementById("noise-options").style.display = "none";
      }
      updateCanvas();
    });

  document.getElementById("noise-intensity").addEventListener("input", (e) => {
    setBackground("noiseIntensity", parseInt(e.target.value));
    document.getElementById("noise-intensity-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  // Screenshot settings
  document.getElementById("screenshot-scale").addEventListener("input", (e) => {
    setScreenshotSetting("scale", parseInt(e.target.value));
    document.getElementById("screenshot-scale-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("screenshot-y").addEventListener("input", (e) => {
    setScreenshotSetting("y", parseInt(e.target.value));
    document.getElementById("screenshot-y-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("screenshot-x").addEventListener("input", (e) => {
    setScreenshotSetting("x", parseInt(e.target.value));
    document.getElementById("screenshot-x-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("corner-radius").addEventListener("input", (e) => {
    setScreenshotSetting("cornerRadius", parseInt(e.target.value));
    document.getElementById("corner-radius-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  document
    .getElementById("screenshot-rotation")
    .addEventListener("input", (e) => {
      setScreenshotSetting("rotation", parseInt(e.target.value));
      document.getElementById("screenshot-rotation-value").textContent =
        formatValue(e.target.value) + "°";
      updateCanvas();
    });

  // Shadow toggle
  document
    .getElementById("shadow-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const shadowEnabled = this.classList.contains("active");
      setScreenshotSetting("shadow.enabled", shadowEnabled);
      const row = this.closest(".toggle-row");
      if (shadowEnabled) {
        if (row) row.classList.remove("collapsed");
        document.getElementById("shadow-options").style.display = "block";
      } else {
        if (row) row.classList.add("collapsed");
        document.getElementById("shadow-options").style.display = "none";
      }
      updateCanvas();
    });

  document.getElementById("shadow-color").addEventListener("input", (e) => {
    setScreenshotSetting("shadow.color", e.target.value);
    document.getElementById("shadow-color-hex").value = e.target.value;
    updateCanvas();
  });

  document.getElementById("shadow-blur").addEventListener("input", (e) => {
    setScreenshotSetting("shadow.blur", parseInt(e.target.value));
    document.getElementById("shadow-blur-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  document.getElementById("shadow-opacity").addEventListener("input", (e) => {
    setScreenshotSetting("shadow.opacity", parseInt(e.target.value));
    document.getElementById("shadow-opacity-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("shadow-x").addEventListener("input", (e) => {
    setScreenshotSetting("shadow.x", parseInt(e.target.value));
    document.getElementById("shadow-x-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  document.getElementById("shadow-y").addEventListener("input", (e) => {
    setScreenshotSetting("shadow.y", parseInt(e.target.value));
    document.getElementById("shadow-y-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  // Frame toggle
  document
    .getElementById("frame-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const frameEnabled = this.classList.contains("active");
      setScreenshotSetting("frame.enabled", frameEnabled);
      const row = this.closest(".toggle-row");
      if (frameEnabled) {
        if (row) row.classList.remove("collapsed");
        document.getElementById("frame-options").style.display = "block";
      } else {
        if (row) row.classList.add("collapsed");
        document.getElementById("frame-options").style.display = "none";
      }
      updateCanvas();
    });

  document.getElementById("frame-color").addEventListener("input", (e) => {
    setScreenshotSetting("frame.color", e.target.value);
    document.getElementById("frame-color-hex").value = e.target.value;
    updateCanvas();
  });

  document.getElementById("frame-color-hex").addEventListener("input", (e) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
      setScreenshotSetting("frame.color", e.target.value);
      document.getElementById("frame-color").value = e.target.value;
      updateCanvas();
    }
  });

  document.getElementById("frame-width").addEventListener("input", (e) => {
    setScreenshotSetting("frame.width", parseInt(e.target.value));
    document.getElementById("frame-width-value").textContent =
      formatValue(e.target.value) + "px";
    updateCanvas();
  });

  document.getElementById("frame-opacity").addEventListener("input", (e) => {
    setScreenshotSetting("frame.opacity", parseInt(e.target.value));
    document.getElementById("frame-opacity-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  // Per-language layout toggle
  document
    .getElementById("per-language-layout-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const enabled = this.classList.contains("active");
      const text = getTextSettings();
      if (enabled && !text.perLanguageLayout) {
        // Seed all language settings from current global values
        const languages = new Set([
          ...(text.headlineLanguages || ["en"]),
          ...(text.subheadlineLanguages || ["en"]),
        ]);
        if (!text.languageSettings) text.languageSettings = {};
        languages.forEach((lang) => {
          text.languageSettings[lang] = {
            headlineSize: text.headlineSize || 100,
            subheadlineSize: text.subheadlineSize || 50,
            position: text.position || "top",
            offsetY: typeof text.offsetY === "number" ? text.offsetY : 12,
            lineHeight: text.lineHeight || 110,
          };
        });
      }
      text.perLanguageLayout = enabled;
      updateCanvas();
    });

  // Headline toggle
  document
    .getElementById("headline-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const enabled = this.classList.contains("active");
      setTextValue("headlineEnabled", enabled);
      const row = this.closest(".toggle-row");
      if (enabled) {
        if (row) row.classList.remove("collapsed");
        document.getElementById("headline-options").style.display = "block";
      } else {
        if (row) row.classList.add("collapsed");
        document.getElementById("headline-options").style.display = "none";
      }
      updateCanvas();
    });

  // Subheadline toggle
  document
    .getElementById("subheadline-toggle")
    .addEventListener("click", function () {
      this.classList.toggle("active");
      const enabled = this.classList.contains("active");
      setTextValue("subheadlineEnabled", enabled);
      const row = this.closest(".toggle-row");
      if (enabled) {
        if (row) row.classList.remove("collapsed");
        document.getElementById("subheadline-options").style.display = "block";
      } else {
        if (row) row.classList.add("collapsed");
        document.getElementById("subheadline-options").style.display = "none";
      }
      updateCanvas();
    });

  // Text settings
  document.getElementById("headline-text").addEventListener("input", (e) => {
    const text = getTextSettings();
    if (!text.headlines) text.headlines = { en: "" };
    text.headlines[text.currentHeadlineLang || "en"] = e.target.value;
    updateCanvas();
  });

  // Font picker is initialized separately via initFontPicker()

  document.getElementById("headline-size").addEventListener("input", (e) => {
    const text = getTextSettings();
    const lang = text.currentHeadlineLang || "en";
    setTextLanguageValue("headlineSize", parseInt(e.target.value) || 100, lang);
    updateCanvas();
  });

  document.getElementById("headline-color").addEventListener("input", (e) => {
    setTextValue("headlineColor", e.target.value);
    updateCanvas();
  });

  document.getElementById("headline-weight").addEventListener("change", (e) => {
    setTextValue("headlineWeight", e.target.value);
    updateCanvas();
  });

  // Text style buttons (italic, underline, strikethrough)
  document.querySelectorAll("#headline-style button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const style = btn.dataset.style;
      const key = "headline" + style.charAt(0).toUpperCase() + style.slice(1);
      const text = getTextSettings();
      const newValue = !text[key];
      setTextValue(key, newValue);
      btn.classList.toggle("active", newValue);
      updateCanvas();
    });
  });

  document.querySelectorAll("#text-position button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#text-position button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setTextLanguageValue("position", btn.dataset.position);
      updateCanvas();
    });
  });

  document.getElementById("text-offset-y").addEventListener("input", (e) => {
    setTextLanguageValue("offsetY", parseInt(e.target.value));
    document.getElementById("text-offset-y-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("line-height").addEventListener("input", (e) => {
    setTextLanguageValue("lineHeight", parseInt(e.target.value));
    document.getElementById("line-height-value").textContent =
      formatValue(e.target.value) + "%";
    updateCanvas();
  });

  document.getElementById("subheadline-text").addEventListener("input", (e) => {
    const text = getTextSettings();
    if (!text.subheadlines) text.subheadlines = { en: "" };
    text.subheadlines[text.currentSubheadlineLang || "en"] = e.target.value;
    updateCanvas();
  });

  document.getElementById("subheadline-size").addEventListener("input", (e) => {
    const text = getTextSettings();
    const lang = text.currentSubheadlineLang || "en";
    setTextLanguageValue(
      "subheadlineSize",
      parseInt(e.target.value) || 50,
      lang,
    );
    updateCanvas();
  });

  document
    .getElementById("subheadline-color")
    .addEventListener("input", (e) => {
      setTextValue("subheadlineColor", e.target.value);
      updateCanvas();
    });

  document
    .getElementById("subheadline-opacity")
    .addEventListener("input", (e) => {
      const value = parseInt(e.target.value) || 70;
      setTextValue("subheadlineOpacity", value);
      document.getElementById("subheadline-opacity-value").textContent =
        formatValue(value) + "%";
      updateCanvas();
    });

  // Subheadline weight
  document
    .getElementById("subheadline-weight")
    .addEventListener("change", (e) => {
      setTextValue("subheadlineWeight", e.target.value);
      updateCanvas();
    });

  // Subheadline style buttons (italic, underline, strikethrough)
  document.querySelectorAll("#subheadline-style button").forEach((btn) => {
    btn.addEventListener("click", () => {
      const style = btn.dataset.style;
      const key =
        "subheadline" + style.charAt(0).toUpperCase() + style.slice(1);
      const text = getTextSettings();
      const newValue = !text[key];
      setTextValue(key, newValue);
      btn.classList.toggle("active", newValue);
      updateCanvas();
    });
  });

  // Export buttons
  document
    .getElementById("export-current")
    .addEventListener("click", exportCurrent);
  document.getElementById("export-all").addEventListener("click", exportAll);

  // Position presets
  document.querySelectorAll(".position-preset").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".position-preset")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      applyPositionPreset(btn.dataset.preset);
    });
  });

  // Device type selector (2D/3D)
  document.querySelectorAll("#device-type-selector button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#device-type-selector button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const use3D = btn.dataset.type === "3d";
      setScreenshotSetting("use3D", use3D);
      document.getElementById("rotation-3d-options").style.display = use3D
        ? "block"
        : "none";

      // Hide 2D-only settings in 3D mode, show 3D tip
      document.getElementById("2d-only-settings").style.display = use3D
        ? "none"
        : "block";
      document.getElementById("position-presets-section").style.display = use3D
        ? "none"
        : "block";
      document.getElementById("3d-tip").style.display = use3D ? "flex" : "none";

      if (typeof showThreeJS === "function") {
        showThreeJS(use3D);
      }

      if (use3D && typeof updateScreenTexture === "function") {
        updateScreenTexture();
      }

      updateCanvas();
    });
  });

  // 3D device model selector
  document.querySelectorAll("#device-3d-selector button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll("#device-3d-selector button")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const device3D = btn.dataset.model;
      setScreenshotSetting("device3D", device3D);

      if (typeof switchPhoneModel === "function") {
        switchPhoneModel(device3D);
      }

      updateCanvas();
    });
  });

  // 3D rotation controls
  document.getElementById("rotation-3d-x").addEventListener("input", (e) => {
    const ss = getScreenshotSettings();
    if (!ss.rotation3D) ss.rotation3D = { x: 0, y: 0, z: 0 };
    ss.rotation3D.x = parseInt(e.target.value);
    document.getElementById("rotation-3d-x-value").textContent =
      formatValue(e.target.value) + "°";
    if (typeof setThreeJSRotation === "function") {
      setThreeJSRotation(ss.rotation3D.x, ss.rotation3D.y, ss.rotation3D.z);
    }
    updateCanvas(); // Keep export canvas in sync
  });

  document.getElementById("rotation-3d-y").addEventListener("input", (e) => {
    const ss = getScreenshotSettings();
    if (!ss.rotation3D) ss.rotation3D = { x: 0, y: 0, z: 0 };
    ss.rotation3D.y = parseInt(e.target.value);
    document.getElementById("rotation-3d-y-value").textContent =
      formatValue(e.target.value) + "°";
    if (typeof setThreeJSRotation === "function") {
      setThreeJSRotation(ss.rotation3D.x, ss.rotation3D.y, ss.rotation3D.z);
    }
    updateCanvas(); // Keep export canvas in sync
  });

  document.getElementById("rotation-3d-z").addEventListener("input", (e) => {
    const ss = getScreenshotSettings();
    if (!ss.rotation3D) ss.rotation3D = { x: 0, y: 0, z: 0 };
    ss.rotation3D.z = parseInt(e.target.value);
    document.getElementById("rotation-3d-z-value").textContent =
      formatValue(e.target.value) + "°";
    if (typeof setThreeJSRotation === "function") {
      setThreeJSRotation(ss.rotation3D.x, ss.rotation3D.y, ss.rotation3D.z);
    }
    updateCanvas(); // Keep export canvas in sync
  });
}

/* ===== Version / Update check ===== */

function compareVersions(a, b) {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] ?? 0) > (pb[i] ?? 0)) return 1;
    if ((pa[i] ?? 0) < (pb[i] ?? 0)) return -1;
  }
  return 0;
}

async function checkForUpdates() {
  const badge = document.getElementById("about-update-badge");
  const versionText = document.getElementById("about-version-text");
  if (!badge) return;

  if (versionText) versionText.textContent = `v${APP_VERSION}`;

  // Reset to checking state
  badge.style.display = "inline";
  badge.textContent = "Checking for updates…";
  badge.style.background = "rgba(255,255,255,0.07)";
  badge.style.color = "var(--text-muted)";

  try {
    const res = await fetch(
      "https://api.github.com/repos/YUZU-Hub/appscreen/releases/latest",
      { headers: { Accept: "application/vnd.github.v3+json" } },
    );
    if (!res.ok) throw new Error("response not ok");
    const data = await res.json();
    const latestTag = (data.tag_name ?? "").replace(/^v/, "");
    if (!latestTag) throw new Error("no tag");

    if (compareVersions(APP_VERSION, latestTag) >= 0) {
      badge.textContent = "✓ Up to date";
      badge.style.background = "rgba(34, 197, 94, 0.15)";
      badge.style.color = "#22c55e";
      const dot = document.getElementById("update-dot");
      if (dot) dot.style.display = "none";
    } else {
      badge.innerHTML = `⬆ v${latestTag} available &mdash; <a href="${data.html_url}" target="_blank" style="color:inherit;text-decoration:underline">View release</a>`;
      badge.style.background = "rgba(251, 191, 36, 0.15)";
      badge.style.color = "#fbbf24";
      const dot = document.getElementById("update-dot");
      if (dot) dot.style.display = "block";
    }
  } catch {
    badge.textContent = "Could not check for updates";
    badge.style.background = "transparent";
    badge.style.color = "var(--text-muted)";
  }
}
