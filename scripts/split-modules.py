"""
split-modules.py
Splits app.js and styles.css into focused module files inside js/ and css/.
Run from the project root:  python scripts/split-modules.py

The original app.js and styles.css are NOT modified; index.html is updated
to load all the new files in the correct order.
"""

import os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ─── helpers ─────────────────────────────────────────────────────────────────

def read_lines(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.readlines()          # keeps \n at end of each line

def write_file(path, lines, header=None):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        if header:
            f.write(header + "\n")
        f.writelines(lines)
    rel = os.path.relpath(path, ROOT)
    print(f"  wrote  {rel}  ({len(lines)} lines)")

def slice1(lines, start, end):
    """1-based inclusive slice."""
    return lines[start - 1 : end]

# ─── JS split (app.js → js/*.js) ─────────────────────────────────────────────
#
# Line numbers verified against the grep output above.
# Each tuple: (output filename, start_line, end_line, description)

JS_SPLITS = [
    ("js/state.js",        1,     127,  "State management & runtime vars"),
    ("js/helpers.js",      128,   721,  "Device helpers, settings accessors, Lucide icons, utils"),
    ("js/fonts.js",        722,  2553,  "Language flags, Google Fonts cfg, font loading, font picker UI"),
    ("js/storage.js",     2554,  3673,  "Device dims, IndexedDB, custom fonts, export/import, project CRUD, save/load state"),
    ("js/ui-sync.js",     3674,  3927,  "syncUIWithState"),
    ("js/elements-ui.js", 3928,  4726,  "Elements tab UI"),
    ("js/popouts-ui.js",  4727,  6682,  "Popouts tab UI & interactive crop preview"),
    ("js/languages.js",   6683,  7868,  "Language picker, languages modal, translate modal & AI translation"),
    ("js/settings.js",    7869,  8003,  "Settings modal & theme management"),
    ("js/text.js",        8004,  8140,  "Text value helpers"),
    ("js/screenshots.js", 8141,  9825,  "File handling, screenshot list management & screenshot actions"),
    ("js/canvas.js",      9826, 10741,  "Canvas drawing, popout/element rendering, export"),
    ("js/pickers.js",    10742, 11018,  "Emoji picker, icon picker, app bootstrap (initSync)"),
]

# ─── CSS split (styles.css → css/*.css) ──────────────────────────────────────

CSS_SPLITS = [
    ("css/variables.css",  1,    108, "CSS custom properties & base reset"),
    ("css/tauri.css",    109,    151, "Tauri desktop titlebar & window chrome"),
    ("css/layout.css",   152,    575, "App layout, sidebar, screenshot list, drag & drop"),
    ("css/controls.css", 576,    878, "UI controls, buttons, text-style bar, gradient editor"),
    ("css/canvas.css",   879,   1205, "Canvas area styles"),
    ("css/modals.css",  1206,   1706, "All modal base styles (project, translate, settings, device)"),
    ("css/ui.css",      1707,   2499, "Preset backgrounds, tabs, font picker, toggles, checkboxes, "
                                      "position presets, scrollbar, section-collapse, output format, project controls"),
    ("css/sidebar.css", 2500,   2621, "Sidebar header, feature tooltip"),
    ("css/languages.css", 2622, 3163, "Language picker, languages modal, flags, translations modal, "
                                      "export-language modal, progress modal, duplicate modal"),
    ("css/elements.css", 3164,  3590, "Elements tab, popouts tab, canvas drag cursor, emoji/icon pickers"),
    ("css/autoshot.css", 3591,  3860, "Autoshot import modal, device category tabs, mapping rows"),
]

# ─── index.html patch ────────────────────────────────────────────────────────

def patch_index_html(js_files, css_files):
    html_path = os.path.join(ROOT, "index.html")
    with open(html_path, "r", encoding="utf-8") as f:
        html = f.read()

    # ── CSS: replace <link ... styles.css ...> with the new set ──────────────
    css_links = "\n".join(
        f'  <link rel="stylesheet" href="{f}" />' for f in css_files
    )
    # Match any <link> pointing at styles.css (with optional attributes around href)
    html = re.sub(
        r'<link[^>]*href=["\']styles\.css["\'][^>]*/?>',
        css_links,
        html,
    )
    # If nothing was replaced (different quote style etc.) warn
    if css_links not in html:
        # Fallback: insert before </head>
        html = html.replace("</head>", css_links + "\n</head>", 1)

    # ── JS: replace <script src="app.js"></script> with the new set ──────────
    js_tags = "\n".join(
        f'  <script src="{f}"></script>' for f in js_files
    )
    html = re.sub(
        r'<script[^>]*src=["\']app\.js["\'][^>]*></script>',
        js_tags,
        html,
    )
    if js_tags not in html:
        html = html.replace("</body>", js_tags + "\n</body>", 1)

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  patched  index.html")

# ─── main ─────────────────────────────────────────────────────────────────────

def main():
    js_src  = read_lines(os.path.join(ROOT, "app.js"))
    css_src = read_lines(os.path.join(ROOT, "styles.css"))

    js_paths  = []
    css_paths = []

    print("\n── JS modules ──────────────────────────────────────────────────")
    for (out, start, end, desc) in JS_SPLITS:
        header = f"/* ===== {desc} ===== */\n/* auto-split from app.js lines {start}–{end} */"
        write_file(os.path.join(ROOT, out), slice1(js_src, start, end), header)
        js_paths.append(out)

    print("\n── CSS modules ─────────────────────────────────────────────────")
    for (out, start, end, desc) in CSS_SPLITS:
        header = f"/* ===== {desc} ===== */\n/* auto-split from styles.css lines {start}–{end} */"
        write_file(os.path.join(ROOT, out), slice1(css_src, start, end), header)
        css_paths.append(out)

    print("\n── index.html ──────────────────────────────────────────────────")
    patch_index_html(js_paths, css_paths)

    print("\nDone.  Open http://localhost:8000 to verify.")

if __name__ == "__main__":
    main()
