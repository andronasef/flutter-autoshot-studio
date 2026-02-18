/* ===== Emoji picker, icon picker, app bootstrap (initSync) ===== */
/* auto-split from app.js lines 10742–11018 */
// ===== Emoji Picker (inline dropdown) =====

let emojiPickerInitialized = false;

function showEmojiPicker() {
  const picker = document.getElementById("emoji-picker");
  const iconPicker = document.getElementById("icon-picker");
  if (!picker) return;

  // Close icon picker if open
  if (iconPicker) iconPicker.style.display = "none";

  // Toggle
  if (picker.style.display !== "none") {
    picker.style.display = "none";
    return;
  }

  picker.style.display = "";
  const searchInput = document.getElementById("emoji-search");
  if (searchInput) {
    searchInput.value = "";
    setTimeout(() => searchInput.focus(), 50);
  }

  // Reset to popular category
  document.querySelectorAll("#emoji-categories .picker-cat").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === "popular");
  });
  renderEmojiGrid("popular");

  if (!emojiPickerInitialized) {
    emojiPickerInitialized = true;

    // Category tabs
    document
      .querySelectorAll("#emoji-categories .picker-cat")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          document
            .querySelectorAll("#emoji-categories .picker-cat")
            .forEach((b) => b.classList.remove("active"));
          btn.classList.add("active");
          const searchVal = document
            .getElementById("emoji-search")
            .value.trim();
          if (searchVal) {
            renderEmojiSearchResults(searchVal);
          } else {
            renderEmojiGrid(btn.dataset.category);
          }
        });
      });

    // Search
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const val = searchInput.value.trim().toLowerCase();
        if (val) {
          renderEmojiSearchResults(val);
        } else {
          const active = document.querySelector(
            "#emoji-categories .picker-cat.active",
          );
          renderEmojiGrid(active?.dataset.category || "popular");
        }
      });
    }
  }
}

function renderEmojiGrid(category) {
  const grid = document.getElementById("emoji-grid");
  if (!grid || typeof EMOJI_DATA === "undefined") return;
  const emojis = EMOJI_DATA[category] || [];
  grid.innerHTML = emojis
    .map(
      (e) =>
        `<div class="picker-grid-item emoji-grid-item" data-emoji="${e.emoji}" data-name="${e.name}" title="${e.name}">${e.emoji}</div>`,
    )
    .join("");
  wireEmojiClicks(grid);
}

function renderEmojiSearchResults(query) {
  const grid = document.getElementById("emoji-grid");
  if (!grid || typeof EMOJI_DATA === "undefined") return;
  const results = [];
  for (const cat of Object.values(EMOJI_DATA)) {
    for (const e of cat) {
      if (
        e.name.toLowerCase().includes(query) ||
        e.keywords.some((k) => k.includes(query))
      ) {
        if (!results.find((r) => r.emoji === e.emoji)) results.push(e);
      }
    }
  }
  grid.innerHTML = results
    .map(
      (e) =>
        `<div class="picker-grid-item emoji-grid-item" data-emoji="${e.emoji}" data-name="${e.name}" title="${e.name}">${e.emoji}</div>`,
    )
    .join("");
  wireEmojiClicks(grid);
}

function wireEmojiClicks(grid) {
  grid.querySelectorAll(".emoji-grid-item").forEach((item) => {
    item.onclick = () => {
      addEmojiElement(item.dataset.emoji, item.dataset.name);
      document.getElementById("emoji-picker").style.display = "none";
    };
  });
}

// ===== Icon Picker (inline dropdown) =====

let iconPickerInitialized = false;
let iconSearchTimeout = null;

const iconImageObserver =
  typeof IntersectionObserver !== "undefined"
    ? new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const item = entry.target;
              const name = item.dataset.iconName;
              if (name && !item.dataset.loaded) {
                item.dataset.loaded = "true";
                loadIconPreview(item, name);
              }
              iconImageObserver.unobserve(item);
            }
          });
        },
        { root: document.getElementById("icon-grid"), rootMargin: "50px" },
      )
    : null;

async function loadIconPreview(item, name) {
  try {
    const svgText = await fetchLucideSVG(name);
    const colorized = colorizeLucideSVG(svgText, "currentColor", 2);
    item.innerHTML = colorized;
    const svg = item.querySelector("svg");
    if (svg) {
      svg.style.width = "20px";
      svg.style.height = "20px";
    }
  } catch (e) {
    item.innerHTML = `<span style="font-size: 9px; color: var(--text-tertiary);">${name}</span>`;
  }
}

function showIconPicker() {
  const picker = document.getElementById("icon-picker");
  const emojiPicker = document.getElementById("emoji-picker");
  if (!picker) return;

  // Close emoji picker if open
  if (emojiPicker) emojiPicker.style.display = "none";

  // Toggle
  if (picker.style.display !== "none") {
    picker.style.display = "none";
    return;
  }

  picker.style.display = "";
  const searchInput = document.getElementById("icon-search");
  if (searchInput) {
    searchInput.value = "";
    setTimeout(() => searchInput.focus(), 50);
  }

  // Reset to popular category
  document.querySelectorAll("#icon-categories .picker-cat").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.category === "popular");
  });
  renderIconGrid("popular");

  if (!iconPickerInitialized) {
    iconPickerInitialized = true;

    // Category tabs
    document.querySelectorAll("#icon-categories .picker-cat").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll("#icon-categories .picker-cat")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const searchVal = document.getElementById("icon-search").value.trim();
        if (searchVal) {
          renderIconSearchResults(searchVal);
        } else {
          renderIconGrid(btn.dataset.category);
        }
      });
    });

    // Debounced search
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        clearTimeout(iconSearchTimeout);
        iconSearchTimeout = setTimeout(() => {
          const val = searchInput.value.trim().toLowerCase();
          if (val) {
            renderIconSearchResults(val);
          } else {
            const active = document.querySelector(
              "#icon-categories .picker-cat.active",
            );
            renderIconGrid(active?.dataset.category || "popular");
          }
        }, 200);
      });
    }
  }
}

function renderIconGrid(category) {
  const grid = document.getElementById("icon-grid");
  if (!grid) return;
  const icons =
    category === "popular"
      ? typeof LUCIDE_POPULAR !== "undefined"
        ? LUCIDE_POPULAR
        : []
      : typeof LUCIDE_ALL !== "undefined"
        ? LUCIDE_ALL
        : [];
  grid.innerHTML = icons
    .map(
      (name) =>
        `<div class="picker-grid-item icon-grid-item" data-icon-name="${name}" title="${name}"><div class="icon-placeholder"></div></div>`,
    )
    .join("");
  wireIconClicks(grid);
  if (iconImageObserver) {
    grid.querySelectorAll(".icon-grid-item").forEach((item) => {
      iconImageObserver.observe(item);
    });
  }
}

function renderIconSearchResults(query) {
  const grid = document.getElementById("icon-grid");
  if (!grid) return;
  const allIcons = typeof LUCIDE_ALL !== "undefined" ? LUCIDE_ALL : [];
  const results = allIcons.filter((name) => name.includes(query));
  grid.innerHTML = results
    .map(
      (name) =>
        `<div class="picker-grid-item icon-grid-item" data-icon-name="${name}" title="${name}"><div class="icon-placeholder"></div></div>`,
    )
    .join("");
  wireIconClicks(grid);
  if (iconImageObserver) {
    grid.querySelectorAll(".icon-grid-item").forEach((item) => {
      iconImageObserver.observe(item);
    });
  }
}

function wireIconClicks(grid) {
  grid.querySelectorAll(".icon-grid-item").forEach((item) => {
    item.onclick = () => {
      addIconElement(item.dataset.iconName);
      document.getElementById("icon-picker").style.display = "none";
    };
  });
}

// Initialize the app
initSync();
