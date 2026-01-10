---
title: "README"
type: article
date_added: 2026-01-03
tags: [Learning]
via: "Local import: ~/Knowledge/Learning/Courses/README.md"
---

# Stan Store Course Downloader

This script downloads your purchased Stan Store courses as PDFs for personal offline use.

## Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Playwright browsers:**
   ```bash
   playwright install chromium
   ```

## Usage

Run the downloader:
```bash
python stan_store_downloader.py
```

The script will:
- Open a browser window (so you can see the progress)
- Navigate to each course URL
- Automatically detect all lessons in each course
- Save each lesson as a PDF in organized folders
- Create a folder structure like:
  ```
  stan_store_downloads/
  ├── Course Name 1/
  │   ├── 001_Lesson_Name.pdf
  │   ├── 002_Lesson_Name.pdf
  │   └── ...
  ├── Course Name 2/
  │   ├── 001_Lesson_Name.pdf
  │   └── ...
  ```

## Configuration

Edit `stan_store_downloader.py` to:
- Change `OUTPUT_DIR` to customize where PDFs are saved
- Set `headless=True` in the browser launch to run in background
- Add or remove course URLs in the `COURSE_URLS` list

## Notes

- PDFs are saved with lesson numbers (001, 002, etc.) for proper ordering
- The script waits for pages to fully load before saving
- If a lesson fails, the script continues with the next one
- All downloads are for **personal use only** per Stan Store's Terms of Service

## Troubleshooting

**Browser doesn't open:**
- Make sure you ran `playwright install chromium`

**Authentication errors:**
- The tokens in your URLs may have expired
- Log into Stan Store in your browser and get fresh URLs

**Missing lessons:**
- Some courses may have different layouts
- Check the terminal output for any error messages
