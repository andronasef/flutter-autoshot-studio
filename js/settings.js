/* ===== Settings modal & theme management ===== */
/* auto-split from app.js lines 7869–8003 */
// Settings modal functions
// LLM configuration is in llm.js (llmProviders, getSelectedModel, getSelectedProvider)

// Theme management
function applyTheme(preference) {
  if (preference === "light" || preference === "dark") {
    document.documentElement.dataset.theme = preference;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function initTheme() {
  const saved = localStorage.getItem("themePreference") || "auto";
  applyTheme(saved);
}

// Apply theme immediately (before async init)
initTheme();

function openSettingsModal() {
  // Load saved provider
  const savedProvider = getSelectedProvider();
  document.querySelectorAll('input[name="ai-provider"]').forEach((radio) => {
    radio.checked = radio.value === savedProvider;
  });

  // Show the correct API section
  updateProviderSection(savedProvider);

  // Load all saved API keys and models
  Object.entries(llmProviders).forEach(([provider, config]) => {
    const savedKey = localStorage.getItem(config.storageKey);
    const input = document.getElementById(`settings-api-key-${provider}`);
    if (input) {
      input.value = savedKey || "";
      input.type = "password";
    }

    const status = document.getElementById(`settings-key-status-${provider}`);
    if (status) {
      if (savedKey) {
        status.textContent = "✓ API key is saved";
        status.className = "settings-key-status success";
      } else {
        status.textContent = "";
        status.className = "settings-key-status";
      }
    }

    // Populate and load saved model selection
    const modelSelect = document.getElementById(`settings-model-${provider}`);
    if (modelSelect) {
      // Populate options from llm.js config
      modelSelect.innerHTML = generateModelOptions(provider);
      // Set saved value
      const savedModel =
        localStorage.getItem(config.modelStorageKey) || config.defaultModel;
      modelSelect.value = savedModel;
    }
  });

  // Load saved theme preference
  const savedTheme = localStorage.getItem("themePreference") || "auto";
  document.querySelectorAll("#theme-selector button").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.theme === savedTheme);
  });

  document.getElementById("settings-modal").classList.add("visible");
}

function updateProviderSection(provider) {
  document.querySelectorAll(".settings-api-section").forEach((section) => {
    section.style.display =
      section.dataset.provider === provider ? "block" : "none";
  });
}

function saveSettings() {
  // Save theme preference
  const activeThemeBtn = document.querySelector(
    "#theme-selector button.active",
  );
  const themePreference = activeThemeBtn
    ? activeThemeBtn.dataset.theme
    : "auto";
  localStorage.setItem("themePreference", themePreference);
  applyTheme(themePreference);

  // Save selected provider
  const selectedProvider = document.querySelector(
    'input[name="ai-provider"]:checked',
  ).value;
  localStorage.setItem("aiProvider", selectedProvider);

  // Save all API keys and models
  let allValid = true;
  Object.entries(llmProviders).forEach(([provider, config]) => {
    const input = document.getElementById(`settings-api-key-${provider}`);
    const status = document.getElementById(`settings-key-status-${provider}`);
    if (!input || !status) return;

    const key = input.value.trim();

    if (key) {
      // Validate key format
      if (key.startsWith(config.keyPrefix)) {
        localStorage.setItem(config.storageKey, key);
        status.textContent = "✓ API key saved";
        status.className = "settings-key-status success";
      } else {
        status.textContent = `Invalid format. Should start with ${config.keyPrefix}...`;
        status.className = "settings-key-status error";
        if (provider === selectedProvider) allValid = false;
      }
    } else {
      localStorage.removeItem(config.storageKey);
      status.textContent = "";
      status.className = "settings-key-status";
    }

    // Save model selection
    const modelSelect = document.getElementById(`settings-model-${provider}`);
    if (modelSelect) {
      localStorage.setItem(config.modelStorageKey, modelSelect.value);
    }
  });

  if (allValid) {
    setTimeout(() => {
      document.getElementById("settings-modal").classList.remove("visible");
    }, 500);
  }
}

