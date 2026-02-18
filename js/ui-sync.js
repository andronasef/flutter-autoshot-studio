/* ===== syncUIWithState ===== */
/* auto-split from app.js lines 3674–3927 */
// Sync UI controls with current state
function syncUIWithState() {
  // Update language button
  updateLanguageButton();

  // Device selector dropdown
  document
    .querySelectorAll(".output-size-menu .device-option")
    .forEach((opt) => {
      opt.classList.toggle(
        "selected",
        opt.dataset.device === state.outputDevice,
      );
    });

  // Update dropdown trigger text
  const selectedOption = document.querySelector(
    `.output-size-menu .device-option[data-device="${state.outputDevice}"]`,
  );
  if (selectedOption) {
    document.getElementById("output-size-name").textContent =
      selectedOption.querySelector(".device-option-name").textContent;
    if (state.outputDevice === "custom") {
      document.getElementById("output-size-dims").textContent =
        `${state.customWidth} × ${state.customHeight}`;
    } else {
      document.getElementById("output-size-dims").textContent =
        selectedOption.querySelector(".device-option-size").textContent;
    }
  }

  // Show/hide custom inputs
  const customInputs = document.getElementById("custom-size-inputs");
  customInputs.classList.toggle("visible", state.outputDevice === "custom");
  document.getElementById("custom-width").value = state.customWidth;
  document.getElementById("custom-height").value = state.customHeight;

  // Get current screenshot's settings
  const bg = getBackground();
  const ss = getScreenshotSettings();
  const txt = getText();

  // Background type
  document.querySelectorAll("#bg-type-selector button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === bg.type);
  });
  document.getElementById("gradient-options").style.display =
    bg.type === "gradient" ? "block" : "none";
  document.getElementById("solid-options").style.display =
    bg.type === "solid" ? "block" : "none";
  document.getElementById("image-options").style.display =
    bg.type === "image" ? "block" : "none";

  // Gradient
  document.getElementById("gradient-angle").value = bg.gradient.angle;
  document.getElementById("gradient-angle-value").textContent =
    formatValue(bg.gradient.angle) + "°";
  updateGradientStopsUI();

  // Solid color
  document.getElementById("solid-color").value = bg.solid;
  document.getElementById("solid-color-hex").value = bg.solid;

  // Image background
  document.getElementById("bg-image-fit").value = bg.imageFit;
  document.getElementById("bg-blur").value = bg.imageBlur;
  document.getElementById("bg-blur-value").textContent =
    formatValue(bg.imageBlur) + "px";
  document.getElementById("bg-overlay-color").value = bg.overlayColor;
  document.getElementById("bg-overlay-hex").value = bg.overlayColor;
  document.getElementById("bg-overlay-opacity").value = bg.overlayOpacity;
  document.getElementById("bg-overlay-opacity-value").textContent =
    formatValue(bg.overlayOpacity) + "%";

  // Noise
  document.getElementById("noise-toggle").classList.toggle("active", bg.noise);
  document.getElementById("noise-intensity").value = bg.noiseIntensity;
  document.getElementById("noise-intensity-value").textContent =
    formatValue(bg.noiseIntensity) + "%";

  // Screenshot settings
  document.getElementById("screenshot-scale").value = ss.scale;
  document.getElementById("screenshot-scale-value").textContent =
    formatValue(ss.scale) + "%";
  document.getElementById("screenshot-y").value = ss.y;
  document.getElementById("screenshot-y-value").textContent =
    formatValue(ss.y) + "%";
  document.getElementById("screenshot-x").value = ss.x;
  document.getElementById("screenshot-x-value").textContent =
    formatValue(ss.x) + "%";
  document.getElementById("corner-radius").value = ss.cornerRadius;
  document.getElementById("corner-radius-value").textContent =
    formatValue(ss.cornerRadius) + "px";
  document.getElementById("screenshot-rotation").value = ss.rotation;
  document.getElementById("screenshot-rotation-value").textContent =
    formatValue(ss.rotation) + "°";

  // Shadow
  document
    .getElementById("shadow-toggle")
    .classList.toggle("active", ss.shadow.enabled);
  document.getElementById("shadow-color").value = ss.shadow.color;
  document.getElementById("shadow-color-hex").value = ss.shadow.color;
  document.getElementById("shadow-blur").value = ss.shadow.blur;
  document.getElementById("shadow-blur-value").textContent =
    formatValue(ss.shadow.blur) + "px";
  document.getElementById("shadow-opacity").value = ss.shadow.opacity;
  document.getElementById("shadow-opacity-value").textContent =
    formatValue(ss.shadow.opacity) + "%";
  document.getElementById("shadow-x").value = ss.shadow.x;
  document.getElementById("shadow-x-value").textContent =
    formatValue(ss.shadow.x) + "px";
  document.getElementById("shadow-y").value = ss.shadow.y;
  document.getElementById("shadow-y-value").textContent =
    formatValue(ss.shadow.y) + "px";

  // Frame/Border
  document
    .getElementById("frame-toggle")
    .classList.toggle("active", ss.frame.enabled);
  document.getElementById("frame-color").value = ss.frame.color;
  document.getElementById("frame-color-hex").value = ss.frame.color;
  document.getElementById("frame-width").value = ss.frame.width;
  document.getElementById("frame-width-value").textContent =
    formatValue(ss.frame.width) + "px";
  document.getElementById("frame-opacity").value = ss.frame.opacity;
  document.getElementById("frame-opacity-value").textContent =
    formatValue(ss.frame.opacity) + "%";

  // Text
  const headlineLang = txt.currentHeadlineLang || "en";
  const subheadlineLang = txt.currentSubheadlineLang || "en";
  const layoutLang = getTextLayoutLanguage(txt);
  const headlineLayout = getEffectiveLayout(txt, headlineLang);
  const subheadlineLayout = getEffectiveLayout(txt, subheadlineLang);
  const layoutSettings = getEffectiveLayout(txt, layoutLang);
  const currentHeadline = txt.headlines
    ? txt.headlines[headlineLang] || ""
    : txt.headline || "";
  document.getElementById("headline-text").value = currentHeadline;
  document.getElementById("headline-font").value = txt.headlineFont;
  updateFontPickerPreview();
  document.getElementById("headline-size").value = headlineLayout.headlineSize;
  document.getElementById("headline-color").value = txt.headlineColor;
  document.getElementById("headline-weight").value = txt.headlineWeight;
  // Sync text style buttons
  document.querySelectorAll("#headline-style button").forEach((btn) => {
    const style = btn.dataset.style;
    const key = "headline" + style.charAt(0).toUpperCase() + style.slice(1);
    btn.classList.toggle("active", txt[key] || false);
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
  const currentSubheadline = txt.subheadlines
    ? txt.subheadlines[subheadlineLang] || ""
    : txt.subheadline || "";
  document.getElementById("subheadline-text").value = currentSubheadline;
  document.getElementById("subheadline-font").value =
    txt.subheadlineFont || txt.headlineFont;
  document.getElementById("subheadline-size").value =
    subheadlineLayout.subheadlineSize;
  document.getElementById("subheadline-color").value = txt.subheadlineColor;
  document.getElementById("subheadline-opacity").value = txt.subheadlineOpacity;
  document.getElementById("subheadline-opacity-value").textContent =
    formatValue(txt.subheadlineOpacity) + "%";
  document.getElementById("subheadline-weight").value =
    txt.subheadlineWeight || "400";
  // Sync subheadline style buttons
  document.querySelectorAll("#subheadline-style button").forEach((btn) => {
    const style = btn.dataset.style;
    const key = "subheadline" + style.charAt(0).toUpperCase() + style.slice(1);
    btn.classList.toggle("active", txt[key] || false);
  });

  // Per-language layout toggle
  document
    .getElementById("per-language-layout-toggle")
    .classList.toggle("active", txt.perLanguageLayout || false);

  // Headline/Subheadline toggles
  const headlineEnabled = txt.headlineEnabled !== false; // default true for backwards compatibility
  const subheadlineEnabled = txt.subheadlineEnabled || false;
  document
    .getElementById("headline-toggle")
    .classList.toggle("active", headlineEnabled);
  document
    .getElementById("subheadline-toggle")
    .classList.toggle("active", subheadlineEnabled);

  // Language UIs
  updateHeadlineLanguageUI();
  updateSubheadlineLanguageUI();

  // 3D mode
  const use3D = ss.use3D || false;
  const device3D = ss.device3D || "iphone";
  const rotation3D = ss.rotation3D || { x: 0, y: 0, z: 0 };
  document.querySelectorAll("#device-type-selector button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.type === (use3D ? "3d" : "2d"));
  });
  document.querySelectorAll("#device-3d-selector button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.model === device3D);
  });
  document.getElementById("rotation-3d-options").style.display = use3D
    ? "block"
    : "none";
  document.getElementById("rotation-3d-x").value = rotation3D.x;
  document.getElementById("rotation-3d-x-value").textContent =
    formatValue(rotation3D.x) + "°";
  document.getElementById("rotation-3d-y").value = rotation3D.y;
  document.getElementById("rotation-3d-y-value").textContent =
    formatValue(rotation3D.y) + "°";
  document.getElementById("rotation-3d-z").value = rotation3D.z;
  document.getElementById("rotation-3d-z-value").textContent =
    formatValue(rotation3D.z) + "°";

  // Hide 2D-only settings in 3D mode, show 3D tip
  document.getElementById("2d-only-settings").style.display = use3D
    ? "none"
    : "block";
  document.getElementById("position-presets-section").style.display = use3D
    ? "none"
    : "block";
  document.getElementById("3d-tip").style.display = use3D ? "flex" : "none";

  // Show/hide 3D renderer and switch model if needed
  if (typeof showThreeJS === "function") {
    showThreeJS(use3D);
  }
  if (use3D && typeof switchPhoneModel === "function") {
    switchPhoneModel(device3D);
  }

  // Elements
  selectedElementId = null;
  updateElementsList();
  updateElementProperties();

  // Popouts
  selectedPopoutId = null;
  updatePopoutsList();
  updatePopoutProperties();
}

