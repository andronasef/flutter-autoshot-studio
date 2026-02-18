/* ===== Canvas drawing, popout/element rendering, export ===== */
/* auto-split from app.js lines 9826–10741 */
// Draw elements for the current screenshot at a specific layer
function drawElements(context, dims, layer) {
  const elements = getElements();
  drawElementsToContext(context, dims, elements, layer);
}

// Draw elements to any context (for side previews and export)
function drawElementsToContext(context, dims, elements, layer) {
  const filtered = elements.filter((el) => el.layer === layer);
  filtered.forEach((el) => {
    context.save();
    context.globalAlpha = el.opacity / 100;

    const cx = dims.width * (el.x / 100);
    const cy = dims.height * (el.y / 100);
    const elWidth = dims.width * (el.width / 100);

    context.translate(cx, cy);
    if (el.rotation !== 0) {
      context.rotate((el.rotation * Math.PI) / 180);
    }

    if (el.type === "emoji" && el.emoji) {
      const emojiSize = elWidth * 0.85;
      context.font = `${emojiSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(el.emoji, 0, 0);
    } else if (el.type === "icon" && el.image) {
      // Shadow
      if (el.iconShadow?.enabled) {
        const s = el.iconShadow;
        const hex = s.color || "#000000";
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        context.shadowColor = `rgba(${r},${g},${b},${(s.opacity || 0) / 100})`;
        context.shadowBlur = s.blur || 0;
        context.shadowOffsetX = s.x || 0;
        context.shadowOffsetY = s.y || 0;
      }
      // Icons are square (1:1)
      context.drawImage(el.image, -elWidth / 2, -elWidth / 2, elWidth, elWidth);
      // Reset shadow
      if (el.iconShadow?.enabled) {
        context.shadowColor = "transparent";
        context.shadowBlur = 0;
        context.shadowOffsetX = 0;
        context.shadowOffsetY = 0;
      }
    } else if (el.type === "graphic" && el.image) {
      const aspect = el.image.height / el.image.width;
      const elHeight = elWidth * aspect;
      context.drawImage(
        el.image,
        -elWidth / 2,
        -elHeight / 2,
        elWidth,
        elHeight,
      );
    } else if (el.type === "text") {
      const elText = getElementText(el);
      if (!elText) {
        context.restore();
        return;
      }
      const fontStyle = el.italic ? "italic" : "normal";
      context.font = `${fontStyle} ${el.fontWeight} ${el.fontSize}px ${el.font}`;
      context.fillStyle = el.fontColor;
      context.textAlign = "center";
      context.textBaseline = "middle";

      // Word-wrap text within element width (respects manual line breaks)
      const lines = wrapText(context, elText, elWidth);
      const lineHeight = el.fontSize * 1.05;
      const totalHeight = (lines.length - 1) * lineHeight + el.fontSize;

      // Draw frame behind text if enabled
      if (el.frame && el.frame !== "none") {
        drawElementFrame(context, el, dims, elWidth, totalHeight);
      }

      // Draw text lines
      const startY = -(totalHeight / 2) + el.fontSize / 2;
      lines.forEach((line, i) => {
        context.fillText(line, 0, startY + i * lineHeight);
      });
    }

    context.restore();
  });
}

// ===== Popout rendering =====
function drawPopouts(context, dims) {
  const screenshot = getCurrentScreenshot();
  if (!screenshot) return;
  const img = getScreenshotImage(screenshot);
  if (!img) return;
  const popouts = screenshot.popouts || [];
  const ss = getScreenshotSettings();
  drawPopoutsToContext(context, dims, popouts, img, ss);
}

function drawPopoutsToContext(context, dims, popouts, img, screenshotSettings) {
  if (!img || !popouts || popouts.length === 0) return;

  popouts.forEach((p) => {
    context.save();
    context.globalAlpha = p.opacity / 100;

    // Crop from source image (percentages -> pixels)
    const sx = (p.cropX / 100) * img.width;
    const sy = (p.cropY / 100) * img.height;
    const sw = (p.cropWidth / 100) * img.width;
    const sh = (p.cropHeight / 100) * img.height;

    // Display position and size (percentages -> canvas pixels)
    const displayW = dims.width * (p.width / 100);
    const cropAspect = sh / sw;
    const displayH = displayW * cropAspect;
    const cx = dims.width * (p.x / 100);
    const cy = dims.height * (p.y / 100);

    context.translate(cx, cy);

    // Apply popout's own rotation only (no 3D transform inheritance)
    if (p.rotation !== 0) {
      context.rotate((p.rotation * Math.PI) / 180);
    }

    const halfW = displayW / 2;
    const halfH = displayH / 2;
    const radius = p.cornerRadius * (displayW / 300);

    // Draw shadow
    if (p.shadow && p.shadow.enabled) {
      const shadowOpacity = p.shadow.opacity / 100;
      const hex = p.shadow.color || "#000000";
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      context.shadowColor = `rgba(${r},${g},${b},${shadowOpacity})`;
      context.shadowBlur = p.shadow.blur;
      context.shadowOffsetX = p.shadow.x;
      context.shadowOffsetY = p.shadow.y;

      context.fillStyle = "#000";
      context.beginPath();
      context.roundRect(-halfW, -halfH, displayW, displayH, radius);
      context.fill();

      context.shadowColor = "transparent";
      context.shadowBlur = 0;
      context.shadowOffsetX = 0;
      context.shadowOffsetY = 0;
    }

    // Draw border behind the image
    if (p.border && p.border.enabled) {
      const bw = p.border.width;
      context.save();
      context.globalAlpha = (p.opacity / 100) * (p.border.opacity / 100);
      context.fillStyle = p.border.color;
      context.beginPath();
      context.roundRect(
        -halfW - bw,
        -halfH - bw,
        displayW + bw * 2,
        displayH + bw * 2,
        radius + bw,
      );
      context.fill();
      context.restore();
    }

    // Clip and draw cropped image
    context.beginPath();
    context.roundRect(-halfW, -halfH, displayW, displayH, radius);
    context.clip();
    context.drawImage(img, sx, sy, sw, sh, -halfW, -halfH, displayW, displayH);

    context.restore();
  });
}

// Draw decorative frames around text elements
function drawElementFrame(context, el, dims, textWidth, textHeight) {
  const scale = el.frameScale / 100;
  const padding = el.fontSize * 0.4 * scale;
  // Measure the widest line (using wrapText to match rendering)
  const elWidth = dims.width * (el.width / 100);
  const lines = wrapText(context, getElementText(el), elWidth);
  const maxLineW = Math.max(...lines.map((l) => context.measureText(l).width));
  const frameW = maxLineW + padding * 2;
  const frameH = textHeight + padding * 2;

  context.save();
  context.strokeStyle = el.frameColor;
  context.fillStyle = "none";
  context.lineWidth = Math.max(2, el.fontSize * 0.04) * scale;

  const isLaurel = el.frame.startsWith("laurel-");
  const hasStar = el.frame.endsWith("-star");

  if (isLaurel) {
    const variant = el.frame.includes("detailed")
      ? "laurel-detailed-left"
      : "laurel-simple-left";
    drawLaurelSVG(context, variant, frameW, frameH, scale, el.frameColor);
    if (hasStar) {
      drawStar(
        context,
        0,
        -frameH / 2 - el.fontSize * 0.2 * scale,
        el.fontSize * 0.3 * scale,
        el.frameColor,
      );
    }
  } else if (el.frame === "badge-circle") {
    context.beginPath();
    const radius = Math.max(frameW, frameH) / 2 + padding * 0.5;
    context.arc(0, 0, radius, 0, Math.PI * 2);
    context.stroke();
  } else if (el.frame === "badge-ribbon") {
    const sw = frameW + padding;
    const sh = frameH + padding * 1.5;
    context.beginPath();
    context.moveTo(-sw / 2, -sh / 2);
    context.lineTo(sw / 2, -sh / 2);
    context.lineTo(sw / 2, sh / 2 - padding);
    context.lineTo(0, sh / 2);
    context.lineTo(-sw / 2, sh / 2 - padding);
    context.closePath();
    context.stroke();
  }

  context.restore();
}

// Draw laurel wreath using SVG image — left branch + mirrored right branch
function drawLaurelSVG(context, variant, w, h, scale, color) {
  const img = laurelImages[variant];
  if (!img || !img.complete || !img.naturalWidth) return;

  // Scale SVG branch to match the frame height
  const branchH = h * 1.1 * scale;
  const aspect = img.naturalWidth / img.naturalHeight;
  const branchW = branchH * aspect;

  // The SVG is black fill — use a temp canvas to recolor it
  const tmp = document.createElement("canvas");
  tmp.width = Math.ceil(branchW);
  tmp.height = Math.ceil(branchH);
  const tctx = tmp.getContext("2d");

  // Draw the SVG scaled into the temp canvas
  tctx.drawImage(img, 0, 0, branchW, branchH);

  // Recolor: draw color on top using source-in composite
  tctx.globalCompositeOperation = "source-in";
  tctx.fillStyle = color;
  tctx.fillRect(0, 0, branchW, branchH);

  // Position: left branch sits to the left of the text area
  const gap = 2 * scale;
  const leftX = -w / 2 - branchW - gap;
  const topY = -branchH / 2;

  // Draw left branch
  context.drawImage(tmp, leftX, topY, branchW, branchH);

  // Draw right branch (mirrored horizontally)
  context.save();
  context.scale(-1, 1);
  context.drawImage(tmp, leftX, topY, branchW, branchH);
  context.restore();
}

// Draw a 5-point star
function drawStar(context, cx, cy, size, color) {
  context.save();
  context.fillStyle = color;
  context.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const inner = outer + Math.PI / 5;
    const ox = cx + Math.cos(outer) * size;
    const oy = cy + Math.sin(outer) * size;
    const ix = cx + Math.cos(inner) * size * 0.4;
    const iy = cy + Math.sin(inner) * size * 0.4;
    if (i === 0) context.moveTo(ox, oy);
    else context.lineTo(ox, oy);
    context.lineTo(ix, iy);
  }
  context.closePath();
  context.fill();
  context.restore();
}

function drawBackground() {
  const dims = getCanvasDimensions();
  const bg = getBackground();

  if (bg.type === "gradient") {
    const angle = (bg.gradient.angle * Math.PI) / 180;
    const x1 = dims.width / 2 - Math.cos(angle) * dims.width;
    const y1 = dims.height / 2 - Math.sin(angle) * dims.height;
    const x2 = dims.width / 2 + Math.cos(angle) * dims.width;
    const y2 = dims.height / 2 + Math.sin(angle) * dims.height;

    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    bg.gradient.stops.forEach((stop) => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, dims.width, dims.height);
  } else if (bg.type === "solid") {
    ctx.fillStyle = bg.solid;
    ctx.fillRect(0, 0, dims.width, dims.height);
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

      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, dims.width, dims.height);
    }

    if (bg.imageBlur > 0) {
      ctx.filter = `blur(${bg.imageBlur}px)`;
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
    ctx.filter = "none";

    // Overlay
    if (bg.overlayOpacity > 0) {
      ctx.fillStyle = bg.overlayColor;
      ctx.globalAlpha = bg.overlayOpacity / 100;
      ctx.fillRect(0, 0, dims.width, dims.height);
      ctx.globalAlpha = 1;
    }
  }
}

function drawScreenshot() {
  const dims = getCanvasDimensions();
  const screenshot = state.screenshots[state.selectedIndex];
  if (!screenshot) return;

  // Use localized image based on current language
  const img = getScreenshotImage(screenshot);
  if (!img) return;

  const settings = getScreenshotSettings();
  const scale = settings.scale / 100;

  // Calculate scaled dimensions
  let imgWidth = dims.width * scale;
  let imgHeight = (img.height / img.width) * imgWidth;

  // If image is taller than canvas after scaling, adjust
  if (imgHeight > dims.height * scale) {
    imgHeight = dims.height * scale;
    imgWidth = (img.width / img.height) * imgHeight;
  }

  const x = (dims.width - imgWidth) * (settings.x / 100);
  const y = (dims.height - imgHeight) * (settings.y / 100);

  // Center point for transformations
  const centerX = x + imgWidth / 2;
  const centerY = y + imgHeight / 2;

  ctx.save();

  // Apply transformations
  ctx.translate(centerX, centerY);

  // Apply rotation
  if (settings.rotation !== 0) {
    ctx.rotate((settings.rotation * Math.PI) / 180);
  }

  // Apply perspective (simulated with scale transform)
  if (settings.perspective !== 0) {
    const perspectiveScale = 1 - Math.abs(settings.perspective) * 0.005;
    ctx.transform(1, settings.perspective * 0.01, 0, 1, 0, 0);
  }

  ctx.translate(-centerX, -centerY);

  // Draw rounded rectangle with screenshot
  const radius = settings.cornerRadius * (imgWidth / 400); // Scale radius with image

  // Draw shadow first (needs a filled shape, not clipped)
  if (settings.shadow.enabled) {
    const shadowColor = hexToRgba(
      settings.shadow.color,
      settings.shadow.opacity / 100,
    );
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = settings.shadow.blur;
    ctx.shadowOffsetX = settings.shadow.x;
    ctx.shadowOffsetY = settings.shadow.y;

    // Draw filled rounded rect for shadow
    ctx.fillStyle = "#000";
    ctx.beginPath();
    roundRect(ctx, x, y, imgWidth, imgHeight, radius);
    ctx.fill();

    // Reset shadow before drawing image
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  // Clip and draw image
  ctx.beginPath();
  roundRect(ctx, x, y, imgWidth, imgHeight, radius);
  ctx.clip();
  ctx.drawImage(img, x, y, imgWidth, imgHeight);

  ctx.restore();

  // Draw device frame if enabled (needs separate transform context)
  if (settings.frame.enabled) {
    ctx.save();
    ctx.translate(centerX, centerY);
    if (settings.rotation !== 0) {
      ctx.rotate((settings.rotation * Math.PI) / 180);
    }
    if (settings.perspective !== 0) {
      ctx.transform(1, settings.perspective * 0.01, 0, 1, 0, 0);
    }
    ctx.translate(-centerX, -centerY);
    drawDeviceFrame(x, y, imgWidth, imgHeight);
    ctx.restore();
  }
}

function drawDeviceFrame(x, y, width, height) {
  const settings = getScreenshotSettings();
  const frameColor = settings.frame.color;
  const frameWidth = settings.frame.width * (width / 400); // Scale with image
  const frameOpacity = settings.frame.opacity / 100;
  const radius = settings.cornerRadius * (width / 400) + frameWidth;

  ctx.globalAlpha = frameOpacity;
  ctx.strokeStyle = frameColor;
  ctx.lineWidth = frameWidth;
  ctx.beginPath();
  roundRect(
    ctx,
    x - frameWidth / 2,
    y - frameWidth / 2,
    width + frameWidth,
    height + frameWidth,
    radius,
  );
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawText() {
  const dims = getCanvasDimensions();
  const text = getTextSettings();

  // Check enabled states (default headline to true for backwards compatibility)
  const headlineEnabled = text.headlineEnabled !== false;
  const subheadlineEnabled = text.subheadlineEnabled || false;

  const headlineLang = text.currentHeadlineLang || "en";
  const subheadlineLang = text.currentSubheadlineLang || "en";
  const layoutLang = getTextLayoutLanguage(text);
  const headlineLayout = getEffectiveLayout(text, headlineLang);
  const subheadlineLayout = getEffectiveLayout(text, subheadlineLang);
  const layoutSettings = getEffectiveLayout(text, layoutLang);

  // Get current language text (only if enabled)
  const headline =
    headlineEnabled && text.headlines ? text.headlines[headlineLang] || "" : "";
  const subheadline =
    subheadlineEnabled && text.subheadlines
      ? text.subheadlines[subheadlineLang] || ""
      : "";

  if (!headline && !subheadline) return;

  const padding = dims.width * 0.08;
  const textY =
    layoutSettings.position === "top"
      ? dims.height * (layoutSettings.offsetY / 100)
      : dims.height * (1 - layoutSettings.offsetY / 100);

  ctx.textAlign = "center";
  ctx.textBaseline = layoutSettings.position === "top" ? "top" : "bottom";

  let currentY = textY;

  // Draw headline
  if (headline) {
    ctx.direction = isRtlLanguage(headlineLang) ? "rtl" : "ltr";
    const fontStyle = text.headlineItalic ? "italic" : "normal";
    ctx.font = `${fontStyle} ${text.headlineWeight} ${headlineLayout.headlineSize}px ${text.headlineFont}`;
    ctx.fillStyle = text.headlineColor;

    const lines = wrapText(ctx, headline, dims.width - padding * 2);
    const lineHeight =
      headlineLayout.headlineSize * (layoutSettings.lineHeight / 100);

    if (layoutSettings.position === "bottom") {
      currentY -= (lines.length - 1) * lineHeight;
    }

    let lastLineY;
    lines.forEach((line, i) => {
      const y = currentY + i * lineHeight;
      lastLineY = y;
      ctx.fillText(line, dims.width / 2, y);

      // Calculate text metrics for decorations
      // When textBaseline is 'top', y is at top of text; when 'bottom', y is at bottom
      const textWidth = ctx.measureText(line).width;
      const fontSize = headlineLayout.headlineSize;
      const lineThickness = Math.max(2, fontSize * 0.05);
      const x = dims.width / 2 - textWidth / 2;

      // Draw underline
      if (text.headlineUnderline) {
        const underlineY =
          layoutSettings.position === "top"
            ? y + fontSize * 0.9 // Below text when baseline is top
            : y + fontSize * 0.1; // Below text when baseline is bottom
        ctx.fillRect(x, underlineY, textWidth, lineThickness);
      }

      // Draw strikethrough
      if (text.headlineStrikethrough) {
        const strikeY =
          layoutSettings.position === "top"
            ? y + fontSize * 0.4 // Middle of text when baseline is top
            : y - fontSize * 0.4; // Middle of text when baseline is bottom
        ctx.fillRect(x, strikeY, textWidth, lineThickness);
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
    ctx.direction = isRtlLanguage(subheadlineLang) ? "rtl" : "ltr";
    const subFontStyle = text.subheadlineItalic ? "italic" : "normal";
    const subWeight = text.subheadlineWeight || "400";
    ctx.font = `${subFontStyle} ${subWeight} ${subheadlineLayout.subheadlineSize}px ${text.subheadlineFont || text.headlineFont}`;
    ctx.fillStyle = hexToRgba(
      text.subheadlineColor,
      text.subheadlineOpacity / 100,
    );

    const lines = wrapText(ctx, subheadline, dims.width - padding * 2);
    const subLineHeight = subheadlineLayout.subheadlineSize * 1.4;

    // Subheadline starts after headline with gap determined by headline lineHeight
    // For bottom position, switch to 'top' baseline so subheadline draws downward
    const subY = currentY;
    if (layoutSettings.position === "bottom") {
      ctx.textBaseline = "top";
    }

    lines.forEach((line, i) => {
      const y = subY + i * subLineHeight;
      ctx.fillText(line, dims.width / 2, y);

      // Calculate text metrics for decorations
      const textWidth = ctx.measureText(line).width;
      const fontSize = subheadlineLayout.subheadlineSize;
      const lineThickness = Math.max(2, fontSize * 0.05);
      const x = dims.width / 2 - textWidth / 2;

      // Draw underline (using 'top' baseline for subheadline)
      if (text.subheadlineUnderline) {
        const underlineY = y + fontSize * 0.9;
        ctx.fillRect(x, underlineY, textWidth, lineThickness);
      }

      // Draw strikethrough
      if (text.subheadlineStrikethrough) {
        const strikeY = y + fontSize * 0.4;
        ctx.fillRect(x, strikeY, textWidth, lineThickness);
      }
    });

    // Restore baseline if we changed it
    if (layoutSettings.position === "bottom") {
      ctx.textBaseline = "bottom";
    }
    ctx.direction = "ltr"; // reset after subheadline
  }
}

function drawNoise() {
  const dims = getCanvasDimensions();
  const imageData = ctx.getImageData(0, 0, dims.width, dims.height);
  const data = imageData.data;
  const intensity = (getBackground().noiseIntensity / 100) * 50;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, maxWidth) {
  const lines = [];
  const rawLines = String(text).split(/\r?\n/);

  rawLines.forEach((rawLine) => {
    if (rawLine === "") {
      lines.push("");
      return;
    }

    const words = rawLine.split(" ");
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + (currentLine ? " " : "") + word;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });

    if (currentLine) {
      lines.push(currentLine);
    }
  });

  return lines;
}

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

async function exportCurrent() {
  if (state.screenshots.length === 0) {
    await showAppAlert("Please upload a screenshot first", "info");
    return;
  }

  // Ensure canvas is up-to-date (especially important for 3D mode)
  updateCanvas();

  const link = document.createElement("a");
  link.download = `screenshot-${state.selectedIndex + 1}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

async function exportAll() {
  if (state.screenshots.length === 0) {
    await showAppAlert("Please upload screenshots first", "info");
    return;
  }

  // Check if project has multiple languages configured
  const hasMultipleLanguages = state.projectLanguages.length > 1;

  if (hasMultipleLanguages) {
    // Show language choice dialog
    showExportLanguageDialog(async (choice) => {
      if (choice === "current") {
        await exportAllForLanguage(state.currentLanguage);
      } else if (choice === "all") {
        await exportAllLanguages();
      }
    });
  } else {
    // Only one language, export directly
    await exportAllForLanguage(state.currentLanguage);
  }
}

// Show export progress modal
function showExportProgress(status, detail, percent) {
  const modal = document.getElementById("export-progress-modal");
  const statusEl = document.getElementById("export-progress-status");
  const detailEl = document.getElementById("export-progress-detail");
  const fillEl = document.getElementById("export-progress-fill");

  if (modal) modal.classList.add("visible");
  if (statusEl) statusEl.textContent = status;
  if (detailEl) detailEl.textContent = detail || "";
  if (fillEl) fillEl.style.width = `${percent}%`;
}

// Hide export progress modal
function hideExportProgress() {
  const modal = document.getElementById("export-progress-modal");
  if (modal) modal.classList.remove("visible");
}

// Export all screenshots for a specific language
async function exportAllForLanguage(lang) {
  const originalIndex = state.selectedIndex;
  const originalLang = state.currentLanguage;
  const zip = new JSZip();
  const total = state.screenshots.length;

  // Show progress
  const langName = languageNames[lang] || lang.toUpperCase();
  showExportProgress("Exporting...", `Preparing ${langName} screenshots`, 0);

  // Save original text languages for each screenshot
  const originalTextLangs = state.screenshots.map((s) => ({
    headline: s.text.currentHeadlineLang,
    subheadline: s.text.currentSubheadlineLang,
  }));

  // Temporarily switch to the target language (images and text)
  state.currentLanguage = lang;
  state.screenshots.forEach((s) => {
    s.text.currentHeadlineLang = lang;
    s.text.currentSubheadlineLang = lang;
  });

  for (let i = 0; i < state.screenshots.length; i++) {
    state.selectedIndex = i;
    updateCanvas();

    // Update progress
    const percent = Math.round(((i + 1) / total) * 90); // Reserve 10% for ZIP generation
    showExportProgress(
      "Exporting...",
      `Screenshot ${i + 1} of ${total}`,
      percent,
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Get canvas data as base64, strip the data URL prefix
    const dataUrl = canvas.toDataURL("image/png");
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

    zip.file(`screenshot-${i + 1}.png`, base64Data, { base64: true });
  }

  // Restore original settings
  state.selectedIndex = originalIndex;
  state.currentLanguage = originalLang;
  state.screenshots.forEach((s, i) => {
    s.text.currentHeadlineLang = originalTextLangs[i].headline;
    s.text.currentSubheadlineLang = originalTextLangs[i].subheadline;
  });
  updateCanvas();

  // Generate ZIP
  showExportProgress("Generating ZIP...", "", 95);
  const content = await zip.generateAsync({ type: "blob" });

  showExportProgress("Complete!", "", 100);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  hideExportProgress();

  const link = document.createElement("a");
  link.download = `screenshots_${state.outputDevice}_${lang}.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
  URL.revokeObjectURL(link.href);
}

// Export all screenshots for all languages (separate folders)
async function exportAllLanguages() {
  const originalIndex = state.selectedIndex;
  const originalLang = state.currentLanguage;
  const zip = new JSZip();

  const totalLangs = state.projectLanguages.length;
  const totalScreenshots = state.screenshots.length;
  const totalItems = totalLangs * totalScreenshots;
  let completedItems = 0;

  // Show progress
  showExportProgress("Exporting...", "Preparing all languages", 0);

  // Save original text languages for each screenshot
  const originalTextLangs = state.screenshots.map((s) => ({
    headline: s.text.currentHeadlineLang,
    subheadline: s.text.currentSubheadlineLang,
  }));

  for (let langIdx = 0; langIdx < state.projectLanguages.length; langIdx++) {
    const lang = state.projectLanguages[langIdx];
    const langName = languageNames[lang] || lang.toUpperCase();

    // Temporarily switch to this language (images and text)
    state.currentLanguage = lang;
    state.screenshots.forEach((s) => {
      s.text.currentHeadlineLang = lang;
      s.text.currentSubheadlineLang = lang;
    });

    for (let i = 0; i < state.screenshots.length; i++) {
      state.selectedIndex = i;
      updateCanvas();

      completedItems++;
      const percent = Math.round((completedItems / totalItems) * 90); // Reserve 10% for ZIP
      showExportProgress(
        "Exporting...",
        `${langName}: Screenshot ${i + 1} of ${totalScreenshots}`,
        percent,
      );

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Get canvas data as base64, strip the data URL prefix
      const dataUrl = canvas.toDataURL("image/png");
      const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");

      // Use language code as folder name
      zip.file(`${lang}/screenshot-${i + 1}.png`, base64Data, { base64: true });
    }
  }

  // Restore original settings
  state.selectedIndex = originalIndex;
  state.currentLanguage = originalLang;
  state.screenshots.forEach((s, i) => {
    s.text.currentHeadlineLang = originalTextLangs[i].headline;
    s.text.currentSubheadlineLang = originalTextLangs[i].subheadline;
  });
  updateCanvas();

  // Generate ZIP
  showExportProgress("Generating ZIP...", "", 95);
  const content = await zip.generateAsync({ type: "blob" });

  showExportProgress("Complete!", "", 100);
  await new Promise((resolve) => setTimeout(resolve, 1500));
  hideExportProgress();

  const link = document.createElement("a");
  link.download = `screenshots_${state.outputDevice}_all-languages.zip`;
  link.href = URL.createObjectURL(content);
  link.click();
  URL.revokeObjectURL(link.href);
}
