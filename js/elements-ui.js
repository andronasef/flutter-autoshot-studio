/* ===== Elements tab UI ===== */
/* auto-split from app.js lines 3928–4726 */
// ===== Elements Tab UI =====

function updateElementsList() {
  const listEl = document.getElementById("elements-list");
  const emptyEl = document.getElementById("elements-empty");
  if (!listEl) return;

  const elements = getElements();

  // Remove old items (keep the empty message)
  listEl.querySelectorAll(".element-item").forEach((el) => el.remove());

  if (elements.length === 0) {
    if (emptyEl) emptyEl.style.display = "";
    return;
  }

  if (emptyEl) emptyEl.style.display = "none";

  elements.forEach((el) => {
    const item = document.createElement("div");
    item.className =
      "element-item" + (el.id === selectedElementId ? " selected" : "");
    item.dataset.elementId = el.id;

    const layerLabels = {
      "behind-screenshot": "Behind",
      "above-screenshot": "Middle",
      "above-text": "Front",
    };

    let thumbContent;
    if (el.type === "graphic" && el.image) {
      thumbContent = `<img src="${el.image.src}" alt="${el.name}">`;
    } else if (el.type === "emoji") {
      thumbContent = `<span class="emoji-thumb">${el.emoji}</span>`;
    } else if (el.type === "icon" && el.image) {
      thumbContent = `<img src="${el.image.src}" alt="${el.name}" style="padding: 4px; filter: var(--icon-thumb-filter, none);">`;
    } else {
      thumbContent = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/>
            </svg>`;
    }

    item.innerHTML = `
            <div class="element-item-thumb">${thumbContent}</div>
            <div class="element-item-info">
                <div class="element-item-name">${el.type === "text" ? getElementText(el) || "Text" : el.type === "emoji" ? `${el.emoji} ${el.name}` : el.name}</div>
                <div class="element-item-layer">${layerLabels[el.layer] || el.layer}</div>
            </div>
            <div class="element-item-actions">
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

    // Click to select
    item.addEventListener("click", (e) => {
      if (e.target.closest(".element-item-btn")) return;
      selectedElementId = el.id;
      updateElementsList();
      updateElementProperties();
    });

    // Action buttons
    item.querySelectorAll(".element-item-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action;
        if (action === "delete") deleteElement(el.id);
        else if (action === "move-up") moveElementLayer(el.id, "up");
        else if (action === "move-down") moveElementLayer(el.id, "down");
      });
    });

    listEl.appendChild(item);
  });
}

function updateElementProperties() {
  const propsEl = document.getElementById("element-properties");
  if (!propsEl) return;

  const el = getSelectedElement();
  if (!el) {
    propsEl.style.display = "none";
    return;
  }

  propsEl.style.display = "";
  const titleMap = {
    text: "Text Element",
    emoji: `${el.emoji} Emoji`,
    icon: `Icon: ${el.name}`,
    graphic: el.name || "Graphic",
  };
  document.getElementById("element-properties-title").textContent =
    titleMap[el.type] || el.name || "Element";

  document.getElementById("element-layer").value = el.layer;
  document.getElementById("element-x").value = el.x;
  document.getElementById("element-x-value").textContent =
    formatValue(el.x) + "%";
  document.getElementById("element-y").value = el.y;
  document.getElementById("element-y-value").textContent =
    formatValue(el.y) + "%";
  document.getElementById("element-width").value = el.width;
  document.getElementById("element-width-value").textContent =
    formatValue(el.width) + "%";
  document.getElementById("element-rotation").value = el.rotation;
  document.getElementById("element-rotation-value").textContent =
    formatValue(el.rotation) + "°";
  document.getElementById("element-opacity").value = el.opacity;
  document.getElementById("element-opacity-value").textContent =
    formatValue(el.opacity) + "%";

  // Type-specific properties
  const textProps = document.getElementById("element-text-properties");
  const iconProps = document.getElementById("element-icon-properties");

  // Hide all type-specific panels first
  textProps.style.display = "none";
  if (iconProps) iconProps.style.display = "none";

  if (el.type === "text") {
    textProps.style.display = "";
    document.getElementById("element-text-input").value = getElementText(el);
    document.getElementById("element-font").value = el.font;
    updateElementFontPickerPreview(el);
    document.getElementById("element-font-size").value = el.fontSize;
    document.getElementById("element-font-color").value = el.fontColor;
    document.getElementById("element-font-weight").value = el.fontWeight;
    document
      .getElementById("element-italic-btn")
      .classList.toggle("active", el.italic);
    document.getElementById("element-frame").value = el.frame || "none";
    const frameOpts = document.getElementById("element-frame-options");
    frameOpts.style.display = el.frame && el.frame !== "none" ? "" : "none";
    if (el.frame && el.frame !== "none") {
      document.getElementById("element-frame-color").value = el.frameColor;
      document.getElementById("element-frame-color-hex").value = el.frameColor;
      document.getElementById("element-frame-scale").value = el.frameScale;
      document.getElementById("element-frame-scale-value").textContent =
        formatValue(el.frameScale) + "%";
    }
  } else if (el.type === "icon" && iconProps) {
    iconProps.style.display = "";
    document.getElementById("element-icon-color").value =
      el.iconColor || "#ffffff";
    document.getElementById("element-icon-color-hex").value =
      el.iconColor || "#ffffff";
    document.getElementById("element-icon-stroke-width").value =
      el.iconStrokeWidth || 2;
    document.getElementById("element-icon-stroke-width-value").textContent =
      el.iconStrokeWidth || 2;
    // Shadow
    const shadow = el.iconShadow || {
      enabled: false,
      color: "#000000",
      blur: 20,
      opacity: 40,
      x: 0,
      y: 10,
    };
    const shadowToggle = document.getElementById("element-icon-shadow-toggle");
    const shadowOpts = document.getElementById("element-icon-shadow-options");
    const shadowRow = shadowToggle?.closest(".toggle-row");
    if (shadowToggle) shadowToggle.classList.toggle("active", shadow.enabled);
    if (shadowRow) shadowRow.classList.toggle("collapsed", !shadow.enabled);
    if (shadowOpts) shadowOpts.style.display = shadow.enabled ? "" : "none";
    document.getElementById("element-icon-shadow-color").value = shadow.color;
    document.getElementById("element-icon-shadow-color-hex").value =
      shadow.color;
    document.getElementById("element-icon-shadow-blur").value = shadow.blur;
    document.getElementById("element-icon-shadow-blur-value").textContent =
      shadow.blur + "px";
    document.getElementById("element-icon-shadow-opacity").value =
      shadow.opacity;
    document.getElementById("element-icon-shadow-opacity-value").textContent =
      shadow.opacity + "%";
    document.getElementById("element-icon-shadow-x").value = shadow.x;
    document.getElementById("element-icon-shadow-x-value").textContent =
      shadow.x + "px";
    document.getElementById("element-icon-shadow-y").value = shadow.y;
    document.getElementById("element-icon-shadow-y-value").textContent =
      shadow.y + "px";
  }
}

function setupElementEventListeners() {
  // Add Graphic button
  const addGraphicBtn = document.getElementById("add-graphic-btn");
  const graphicInput = document.getElementById("element-graphic-input");
  if (addGraphicBtn && graphicInput) {
    addGraphicBtn.addEventListener("click", () => graphicInput.click());
    graphicInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          addGraphicElement(img, ev.target.result, file.name);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
      graphicInput.value = "";
    });
  }

  // Add Text button
  const addTextBtn = document.getElementById("add-text-element-btn");
  if (addTextBtn) {
    addTextBtn.addEventListener("click", () => addTextElement());
  }

  // Add Emoji button
  const addEmojiBtn = document.getElementById("add-emoji-btn");
  if (addEmojiBtn) {
    addEmojiBtn.addEventListener("click", () => showEmojiPicker());
  }

  // Add Icon button
  const addIconBtn = document.getElementById("add-icon-btn");
  if (addIconBtn) {
    addIconBtn.addEventListener("click", () => showIconPicker());
  }

  // Icon color picker
  const iconColor = document.getElementById("element-icon-color");
  const iconColorHex = document.getElementById("element-icon-color-hex");
  if (iconColor) {
    iconColor.addEventListener("input", () => {
      const el = getSelectedElement();
      if (el && el.type === "icon") {
        el.iconColor = iconColor.value;
        if (iconColorHex) iconColorHex.value = iconColor.value;
        updateIconImage(el);
      }
    });
  }
  if (iconColorHex) {
    iconColorHex.addEventListener("change", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(iconColorHex.value)) {
        const el = getSelectedElement();
        if (el && el.type === "icon") {
          el.iconColor = iconColorHex.value;
          if (iconColor) iconColor.value = iconColorHex.value;
          updateIconImage(el);
        }
      }
    });
  }

  // Icon stroke width
  const iconStroke = document.getElementById("element-icon-stroke-width");
  const iconStrokeVal = document.getElementById(
    "element-icon-stroke-width-value",
  );
  if (iconStroke) {
    iconStroke.addEventListener("input", () => {
      const val = parseFloat(iconStroke.value);
      if (iconStrokeVal) iconStrokeVal.textContent = val;
      const el = getSelectedElement();
      if (el && el.type === "icon") {
        el.iconStrokeWidth = val;
        updateIconImage(el);
      }
    });
  }

  // Icon shadow toggle
  const iconShadowToggle = document.getElementById(
    "element-icon-shadow-toggle",
  );
  if (iconShadowToggle) {
    iconShadowToggle.addEventListener("click", () => {
      const el = getSelectedElement();
      if (!el || el.type !== "icon") return;
      if (!el.iconShadow)
        el.iconShadow = {
          enabled: false,
          color: "#000000",
          blur: 20,
          opacity: 40,
          x: 0,
          y: 10,
        };
      el.iconShadow.enabled = !el.iconShadow.enabled;
      updateElementProperties();
      updateCanvas();
    });
  }

  // Icon shadow property helpers
  const bindIconShadow = (inputId, prop, suffix) => {
    const input = document.getElementById(inputId);
    const valEl = document.getElementById(inputId + "-value");
    if (!input) return;
    input.addEventListener("input", () => {
      const el = getSelectedElement();
      if (!el || el.type !== "icon" || !el.iconShadow) return;
      el.iconShadow[prop] = parseFloat(input.value);
      if (valEl) valEl.textContent = input.value + suffix;
      updateCanvas();
    });
  };
  bindIconShadow("element-icon-shadow-blur", "blur", "px");
  bindIconShadow("element-icon-shadow-opacity", "opacity", "%");
  bindIconShadow("element-icon-shadow-x", "x", "px");
  bindIconShadow("element-icon-shadow-y", "y", "px");

  // Icon shadow color
  const iconShadowColor = document.getElementById("element-icon-shadow-color");
  const iconShadowColorHex = document.getElementById(
    "element-icon-shadow-color-hex",
  );
  if (iconShadowColor) {
    iconShadowColor.addEventListener("input", () => {
      const el = getSelectedElement();
      if (el?.type === "icon" && el.iconShadow) {
        el.iconShadow.color = iconShadowColor.value;
        if (iconShadowColorHex)
          iconShadowColorHex.value = iconShadowColor.value;
        updateCanvas();
      }
    });
  }
  if (iconShadowColorHex) {
    iconShadowColorHex.addEventListener("change", () => {
      if (/^#[0-9a-fA-F]{6}$/.test(iconShadowColorHex.value)) {
        const el = getSelectedElement();
        if (el?.type === "icon" && el.iconShadow) {
          el.iconShadow.color = iconShadowColorHex.value;
          if (iconShadowColor) iconShadowColor.value = iconShadowColorHex.value;
          updateCanvas();
        }
      }
    });
  }

  // Property sliders
  const bindSlider = (id, prop, suffix, parser) => {
    const input = document.getElementById(id);
    const valueEl = document.getElementById(id + "-value");
    if (!input) return;
    input.addEventListener("input", () => {
      const val = parser ? parser(input.value) : parseFloat(input.value);
      if (valueEl) valueEl.textContent = formatValue(val) + suffix;
      if (selectedElementId) setElementProperty(selectedElementId, prop, val);
    });
  };

  bindSlider("element-x", "x", "%");
  bindSlider("element-y", "y", "%");
  bindSlider("element-width", "width", "%");
  bindSlider("element-rotation", "rotation", "°");
  bindSlider("element-opacity", "opacity", "%");
  bindSlider("element-font-size", "fontSize", "", parseInt);
  bindSlider("element-frame-scale", "frameScale", "%");

  // Layer dropdown
  const layerSelect = document.getElementById("element-layer");
  if (layerSelect) {
    layerSelect.addEventListener("change", () => {
      if (selectedElementId) {
        setElementProperty(selectedElementId, "layer", layerSelect.value);
      }
    });
  }

  // Text input
  const textInput = document.getElementById("element-text-input");
  if (textInput) {
    textInput.addEventListener("input", () => {
      if (!selectedElementId) return;
      const el = getSelectedElement();
      if (!el) return;
      if (!el.texts) el.texts = {};
      el.texts[state.currentLanguage] = textInput.value;
      el.text = textInput.value; // sync for backwards compat
      updateCanvas();
      updateElementsList();
    });
  }

  // Font color
  const fontColor = document.getElementById("element-font-color");
  if (fontColor) {
    fontColor.addEventListener("input", () => {
      if (selectedElementId)
        setElementProperty(selectedElementId, "fontColor", fontColor.value);
    });
  }

  // Font weight
  const fontWeight = document.getElementById("element-font-weight");
  if (fontWeight) {
    fontWeight.addEventListener("change", () => {
      if (selectedElementId)
        setElementProperty(selectedElementId, "fontWeight", fontWeight.value);
    });
  }

  // Italic button
  const italicBtn = document.getElementById("element-italic-btn");
  if (italicBtn) {
    italicBtn.addEventListener("click", () => {
      const el = getSelectedElement();
      if (el) {
        setElementProperty(el.id, "italic", !el.italic);
        italicBtn.classList.toggle("active", el.italic);
      }
    });
  }

  // Frame dropdown
  const frameSelect = document.getElementById("element-frame");
  if (frameSelect) {
    frameSelect.addEventListener("change", () => {
      if (selectedElementId) {
        setElementProperty(selectedElementId, "frame", frameSelect.value);
        document.getElementById("element-frame-options").style.display =
          frameSelect.value !== "none" ? "" : "none";
      }
    });
  }

  // Frame color
  const frameColor = document.getElementById("element-frame-color");
  const frameColorHex = document.getElementById("element-frame-color-hex");
  if (frameColor) {
    frameColor.addEventListener("input", () => {
      if (selectedElementId) {
        setElementProperty(selectedElementId, "frameColor", frameColor.value);
        if (frameColorHex) frameColorHex.value = frameColor.value;
      }
    });
  }
  if (frameColorHex) {
    frameColorHex.addEventListener("change", () => {
      if (selectedElementId && /^#[0-9a-fA-F]{6}$/.test(frameColorHex.value)) {
        setElementProperty(
          selectedElementId,
          "frameColor",
          frameColorHex.value,
        );
        if (frameColor) frameColor.value = frameColorHex.value;
      }
    });
  }

  // Canvas drag interaction for elements
  setupElementCanvasDrag();
}

function setupElementCanvasDrag() {
  const canvasWrapper = document.getElementById("canvas-wrapper");
  const previewCanvas = document.getElementById("preview-canvas");
  if (!previewCanvas) return;

  // Snap guides state
  const SNAP_THRESHOLD = 1.5; // percentage units (of canvas width/height)
  let activeSnapGuides = { x: null, y: null }; // which guides are active

  function getCanvasCoords(e) {
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

  function snapToGuides(x, y) {
    const snapped = { x, y };
    activeSnapGuides = { x: null, y: null };

    // Snap to horizontal center (x = 50%)
    if (Math.abs(x - 50) < SNAP_THRESHOLD) {
      snapped.x = 50;
      activeSnapGuides.x = 50;
    }

    // Snap to vertical middle (y = 50%)
    if (Math.abs(y - 50) < SNAP_THRESHOLD) {
      snapped.y = 50;
      activeSnapGuides.y = 50;
    }

    return snapped;
  }

  function hitTestPopouts(canvasX, canvasY) {
    const popouts = getPopouts();
    const dims = getCanvasDimensions();
    const screenshot = getCurrentScreenshot();
    if (!screenshot) return null;
    const img = getScreenshotImage(screenshot);
    if (!img) return null;

    // Test in reverse order (topmost first)
    for (let i = popouts.length - 1; i >= 0; i--) {
      const p = popouts[i];
      const cx = dims.width * (p.x / 100);
      const cy = dims.height * (p.y / 100);
      const displayW = dims.width * (p.width / 100);
      const sw = (p.cropWidth / 100) * img.width;
      const sh = (p.cropHeight / 100) * img.height;
      const cropAspect = sh / sw;
      const displayH = displayW * cropAspect;
      const halfW = displayW / 2;
      const halfH = displayH / 2;

      if (
        canvasX >= cx - halfW &&
        canvasX <= cx + halfW &&
        canvasY >= cy - halfH &&
        canvasY <= cy + halfH
      ) {
        return p;
      }
    }
    return null;
  }

  function hitTestElements(canvasX, canvasY) {
    const elements = getElements();
    const dims = getCanvasDimensions();
    // Test in reverse order (topmost first)
    const layers = ["above-text", "above-screenshot", "behind-screenshot"];
    for (const layer of layers) {
      const layerEls = elements.filter((el) => el.layer === layer).reverse();
      for (const el of layerEls) {
        const cx = dims.width * (el.x / 100);
        const cy = dims.height * (el.y / 100);
        const elWidth = dims.width * (el.width / 100);
        let elHeight;

        if (el.type === "emoji" || el.type === "icon") {
          elHeight = elWidth; // square bounding box
        } else if (el.type === "graphic" && el.image) {
          elHeight = elWidth * (el.image.height / el.image.width);
        } else {
          elHeight = el.fontSize * 1.5;
        }

        // Simple bounding box hit test (ignoring rotation for simplicity)
        const halfW = elWidth / 2;
        const halfH = elHeight / 2;

        if (
          canvasX >= cx - halfW &&
          canvasX <= cx + halfW &&
          canvasY >= cy - halfH &&
          canvasY <= cy + halfH
        ) {
          return el;
        }
      }
    }
    return null;
  }

  function applyDragMove(coords) {
    const dx = coords.x - draggingElement.startX;
    const dy = coords.y - draggingElement.startY;
    const rawX =
      draggingElement.origX + (dx / draggingElement.dims.width) * 100;
    const rawY =
      draggingElement.origY + (dy / draggingElement.dims.height) * 100;

    const clamped = {
      x: Math.max(0, Math.min(100, rawX)),
      y: Math.max(0, Math.min(100, rawY)),
    };
    const snapped = snapToGuides(clamped.x, clamped.y);

    if (draggingElement.isPopout) {
      const p = getPopouts().find((po) => po.id === draggingElement.id);
      if (p) {
        p.x = snapped.x;
        p.y = snapped.y;
        updateCanvas();
        drawSnapGuides();
        updatePopoutProperties();
      }
    } else {
      const el = getElements().find((e) => e.id === draggingElement.id);
      if (el) {
        el.x = snapped.x;
        el.y = snapped.y;
        updateCanvas();
        drawSnapGuides();
        updateElementProperties();
      }
    }
  }

  function clearDrag() {
    if (draggingElement) {
      draggingElement = null;
      activeSnapGuides = { x: null, y: null };
      canvasWrapper.classList.remove("element-dragging");
      updateCanvas(); // redraw without guides
    }
  }

  previewCanvas.addEventListener("mousedown", (e) => {
    const coords = getCanvasCoords(e);

    // Check popouts first (they render on top of elements above-screenshot)
    const popoutHit = hitTestPopouts(coords.x, coords.y);
    if (popoutHit) {
      e.preventDefault();
      e.stopPropagation();
      const dims = getCanvasDimensions();
      draggingElement = {
        id: popoutHit.id,
        startX: coords.x,
        startY: coords.y,
        origX: popoutHit.x,
        origY: popoutHit.y,
        dims: dims,
        isPopout: true,
      };
      selectedPopoutId = popoutHit.id;
      selectedElementId = null;
      updatePopoutsList();
      updatePopoutProperties();
      updateElementsList();
      updateElementProperties();
      canvasWrapper.classList.add("element-dragging");

      const popoutsTab = document.querySelector('.tab[data-tab="popouts"]');
      if (popoutsTab && !popoutsTab.classList.contains("active")) {
        popoutsTab.click();
      }
      return;
    }

    const hit = hitTestElements(coords.x, coords.y);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      const dims = getCanvasDimensions();
      draggingElement = {
        id: hit.id,
        startX: coords.x,
        startY: coords.y,
        origX: hit.x,
        origY: hit.y,
        dims: dims,
        isPopout: false,
      };
      selectedElementId = hit.id;
      selectedPopoutId = null;
      updateElementsList();
      updateElementProperties();
      updatePopoutsList();
      updatePopoutProperties();
      canvasWrapper.classList.add("element-dragging");

      const elementsTab = document.querySelector('.tab[data-tab="elements"]');
      if (elementsTab && !elementsTab.classList.contains("active")) {
        elementsTab.click();
      }
    }
  });

  window.addEventListener("mousemove", (e) => {
    if (!draggingElement) {
      // Hover detection
      const coords = getCanvasCoords(e);
      const popoutHit = hitTestPopouts(coords.x, coords.y);
      const hit = popoutHit || hitTestElements(coords.x, coords.y);
      canvasWrapper.classList.toggle("element-hover", !!hit);
      return;
    }
    e.preventDefault();
    applyDragMove(getCanvasCoords(e));
  });

  window.addEventListener("mouseup", () => clearDrag());

  // Touch support
  previewCanvas.addEventListener(
    "touchstart",
    (e) => {
      const coords = getCanvasCoords(e);

      const popoutHit = hitTestPopouts(coords.x, coords.y);
      if (popoutHit) {
        e.preventDefault();
        const dims = getCanvasDimensions();
        draggingElement = {
          id: popoutHit.id,
          startX: coords.x,
          startY: coords.y,
          origX: popoutHit.x,
          origY: popoutHit.y,
          dims: dims,
          isPopout: true,
        };
        selectedPopoutId = popoutHit.id;
        selectedElementId = null;
        updatePopoutsList();
        updatePopoutProperties();
        return;
      }

      const hit = hitTestElements(coords.x, coords.y);
      if (hit) {
        e.preventDefault();
        const dims = getCanvasDimensions();
        draggingElement = {
          id: hit.id,
          startX: coords.x,
          startY: coords.y,
          origX: hit.x,
          origY: hit.y,
          dims: dims,
          isPopout: false,
        };
        selectedElementId = hit.id;
        updateElementsList();
        updateElementProperties();
      }
    },
    { passive: false },
  );

  previewCanvas.addEventListener(
    "touchmove",
    (e) => {
      if (!draggingElement) return;
      e.preventDefault();
      applyDragMove(getCanvasCoords(e));
    },
    { passive: false },
  );

  previewCanvas.addEventListener("touchend", () => clearDrag());
}

// Draw snap guide lines over the canvas when dragging near center/middle
function drawSnapGuides() {
  if (!draggingElement) return;

  const el = getSelectedElement();
  if (!el) return;

  const dims = getCanvasDimensions();
  // Scale relative to canvas so guides stay visible in the scaled-down preview
  const scale = dims.width / 400;

  ctx.save();
  ctx.strokeStyle = "rgba(120, 170, 255, 0.45)";
  ctx.lineWidth = Math.max(1, 1.5 * scale);
  ctx.setLineDash([12 * scale, 8 * scale]);

  // Vertical center line (x = 50%)
  if (Math.abs(el.x - 50) < 0.01) {
    const lineX = Math.round(dims.width * 0.5);
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, dims.height);
    ctx.stroke();
  }

  // Horizontal middle line (y = 50%)
  if (Math.abs(el.y - 50) < 0.01) {
    const lineY = Math.round(dims.height * 0.5);
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(dims.width, lineY);
    ctx.stroke();
  }

  ctx.restore();
}

