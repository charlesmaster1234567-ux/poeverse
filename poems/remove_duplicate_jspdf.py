#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════
  TheLongAfter — remove_duplicate_jspdf.py
  Scans all poem HTML files and removes the duplicate
  jsPDF <script> tag from <head> (the defer one),
  keeping only the dynamic load in poems.js
═══════════════════════════════════════════════════════════
"""

import os
import re
import sys
import shutil
from pathlib import Path
from datetime import datetime


# ─────────────────────────────────────────────────
#  CONFIGURATION — adjust these to match your setup
# ─────────────────────────────────────────────────

# Folder where your poem HTML files live
# e.g. "poems" if your structure is:
#   your-project/
#     poems/
#       i-wonder.html
#       wings.html
#       ...
POEMS_FOLDER = "."

# The script tag pattern to REMOVE
# Matches the full <script ...jspdf...defer...></script> block
# Works even if attributes are in different order
JSPDF_CDN_URL = "cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"

# Whether to create .bak backup files before editing
CREATE_BACKUPS = True

# Backup folder (created automatically)
BACKUP_FOLDER = "backups_before_jspdf_fix"

# Only process files with these extensions
HTML_EXTENSIONS = {".html", ".htm"}


# ─────────────────────────────────────────────────
#  THE SCRIPT TAG PATTERN
#  Matches the entire <script> block that contains
#  the jsPDF CDN URL and has defer on it.
#
#  Handles all these variations:
#    <script src="..." defer></script>
#    <script defer src="..."></script>
#    <script\n  src="..."\n  defer>\n</script>
# ─────────────────────────────────────────────────
SCRIPT_PATTERN = re.compile(
    r'<script[^>]*'                    # opening <script  ...
    + re.escape(JSPDF_CDN_URL)        # must contain the CDN URL
    + r'[^>]*>\s*</script>',          # closing ></script>
    re.IGNORECASE | re.DOTALL
)

# Also remove any blank lines left behind (optional, keeps HTML tidy)
BLANK_LINES_PATTERN = re.compile(r'\n{3,}')


# ─────────────────────────────────────────────────
#  HELPERS
# ─────────────────────────────────────────────────

def find_html_files(folder: str) -> list[Path]:
    """Recursively find all HTML files in the given folder."""
    root = Path(folder)
    if not root.exists():
        print(f"❌  Folder not found: '{folder}'")
        print(f"    Current working directory: {Path.cwd()}")
        print(f"    Please edit POEMS_FOLDER at the top of this script.")
        sys.exit(1)

    files = [
        p for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in HTML_EXTENSIONS
    ]
    return sorted(files)


def backup_file(src: Path, backup_root: str) -> Path:
    """Copy file to backup folder, preserving sub-folder structure."""
    backup_dir = Path(backup_root) / src.parent
    backup_dir.mkdir(parents=True, exist_ok=True)
    timestamp  = datetime.now().strftime("%Y%m%d_%H%M%S")
    dest       = backup_dir / f"{src.stem}_{timestamp}{src.suffix}"
    shutil.copy2(src, dest)
    return dest


def remove_duplicate_script(html: str) -> tuple[str, int]:
    """
    Remove all occurrences of the jsPDF <script defer> tag.
    Returns (new_html, count_of_removals).
    """
    new_html, count = SCRIPT_PATTERN.subn('', html)

    if count > 0:
        # Clean up extra blank lines left behind
        new_html = BLANK_LINES_PATTERN.sub('\n\n', new_html)

    return new_html, count


def process_file(path: Path, backup_root: str) -> dict:
    """Process a single HTML file. Returns a result dict."""
    result = {
        "file"    : str(path),
        "status"  : None,     # "fixed" | "clean" | "error"
        "removed" : 0,
        "backup"  : None,
        "error"   : None,
    }

    try:
        original = path.read_text(encoding="utf-8")
    except Exception as e:
        result["status"] = "error"
        result["error"]  = f"Could not read file: {e}"
        return result

    new_html, count = remove_duplicate_script(original)

    if count == 0:
        # Nothing to do — file is already clean
        result["status"] = "clean"
        return result

    # File needs fixing
    if CREATE_BACKUPS:
        try:
            bak = backup_file(path, backup_root)
            result["backup"] = str(bak)
        except Exception as e:
            result["status"] = "error"
            result["error"]  = f"Could not create backup: {e}"
            return result

    try:
        path.write_text(new_html, encoding="utf-8")
        result["status"]  = "fixed"
        result["removed"] = count
    except Exception as e:
        result["status"] = "error"
        result["error"]  = f"Could not write file: {e}"

    return result


# ─────────────────────────────────────────────────
#  MAIN
# ─────────────────────────────────────────────────

def main():
    print()
    print("═" * 60)
    print("  TheLongAfter — Remove Duplicate jsPDF Script Tag")
    print("═" * 60)
    print(f"  Scanning : {Path(POEMS_FOLDER).resolve()}")
    print(f"  Backups  : {'Yes → ' + BACKUP_FOLDER if CREATE_BACKUPS else 'No'}")
    print("═" * 60)
    print()

    # ── Find all HTML files ──────────────────────
    html_files = find_html_files(POEMS_FOLDER)

    if not html_files:
        print("⚠️   No HTML files found in the poems folder.")
        sys.exit(0)

    print(f"📂  Found {len(html_files)} HTML file(s) to check.\n")

    # ── Process each file ────────────────────────
    results = []
    for path in html_files:
        result = process_file(path, BACKUP_FOLDER)
        results.append(result)

        # Live feedback
        if result["status"] == "fixed":
            tag_word = "tag" if result["removed"] == 1 else "tags"
            print(f"  ✅  FIXED   — {path.name}")
            print(f"              Removed {result['removed']} script {tag_word}")
            if result["backup"]:
                print(f"              Backup  → {result['backup']}")

        elif result["status"] == "clean":
            print(f"  ✔️   CLEAN   — {path.name}")

        elif result["status"] == "error":
            print(f"  ❌  ERROR   — {path.name}")
            print(f"              {result['error']}")

    # ── Summary ──────────────────────────────────
    fixed  = [r for r in results if r["status"] == "fixed"]
    clean  = [r for r in results if r["status"] == "clean"]
    errors = [r for r in results if r["status"] == "error"]

    print()
    print("═" * 60)
    print("  SUMMARY")
    print("═" * 60)
    print(f"  Total files scanned : {len(results)}")
    print(f"  ✅  Fixed            : {len(fixed)}")
    print(f"  ✔️   Already clean    : {len(clean)}")
    print(f"  ❌  Errors           : {len(errors)}")
    print("═" * 60)

    if fixed:
        print()
        print("  Files that were fixed:")
        for r in fixed:
            print(f"    • {r['file']}")

    if errors:
        print()
        print("  Files with errors:")
        for r in errors:
            print(f"    • {r['file']}")
            print(f"      {r['error']}")

    print()

    if len(errors) == 0 and len(fixed) > 0:
        print("  🎉  All done! Your poem files are clean.")
        print("      The jsPDF library is now loaded only")
        print("      dynamically by poems.js — no duplicates.")
    elif len(errors) == 0 and len(fixed) == 0:
        print("  👍  All files were already clean. Nothing to do.")
    else:
        print("  ⚠️   Some files had errors. Check the list above.")

    print()


if __name__ == "__main__":
    main()