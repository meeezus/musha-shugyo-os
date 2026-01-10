#!/bin/bash

# MSOS Knowledge Import Tool v2
# Imports markdown, text, and PDF files from ~/Knowledge and ~/Business into PersonalOS

KNOWLEDGE_SOURCE="$HOME/Knowledge"
BUSINESS_SOURCE="$HOME/Business"
DEST_DIR="$HOME/PersonalOS/Knowledge"
STAGING_DIR="$HOME/PersonalOS/Knowledge/.import-staging"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   MSOS KNOWLEDGE IMPORT TOOL V2${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Create staging directory
mkdir -p "$STAGING_DIR"

# Function to map source category to MSOS category
map_category() {
    case "$1" in
        # ~/Knowledge mappings
        BJJ) echo "Health_Optimization" ;;
        Books) echo "Articles" ;;
        Business) echo "Business_Strategy" ;;
        Content) echo "Articles" ;;
        Learning) echo "Tech_Tools" ;;
        Psychology) echo "Health_Optimization" ;;
        Resources) echo "Articles" ;;
        Substack) echo "Articles" ;;
        Transcripts) echo "Articles" ;;
        # ~/Business mappings
        Agency) echo "Business_Strategy" ;;
        DecoponATX) echo "Tech_Tools" ;;
        *) echo "Articles" ;;
    esac
}

# Function to determine file type
get_file_type() {
    local ext="${1##*.}"
    case "$ext" in
        md) echo "article" ;;
        txt) echo "transcript" ;;
        pdf) echo "document" ;;
        *) echo "article" ;;
    esac
}

# Function to check if file has frontmatter
has_frontmatter() {
    local file="$1"
    head -n 1 "$file" 2>/dev/null | grep -q "^---$"
}

# Function to add frontmatter to a file
add_frontmatter() {
    local file="$1"
    local title="$2"
    local type="$3"
    local category="$4"
    local source_path="$5"

    # Create temp file with frontmatter
    local temp_file=$(mktemp)

    cat > "$temp_file" << EOF
---
title: "$title"
type: $type
date_added: $(date +%Y-%m-%d)
tags: [$category]
via: "Local import: $source_path"
---

$(cat "$file")
EOF

    mv "$temp_file" "$file"
}

# Function to convert non-markdown files to markdown
convert_to_markdown() {
    local file="$1"
    local ext="${file##*.}"

    if [ "$ext" = "txt" ]; then
        # .txt files are already text, just rename
        echo "$file"
    elif [ "$ext" = "pdf" ]; then
        # For PDFs, create a reference file
        local base=$(basename "$file" .pdf)
        local md_file="${file%.pdf}.md"
        cat > "$md_file" << EOF
# $base

**Source:** PDF Document

This is a reference to a PDF file. The original PDF is located at:
\`$file\`

To view the full content, please open the PDF directly.
EOF
        echo "$md_file"
    else
        echo "$file"
    fi
}

# Function to process a directory
process_directory() {
    local source_dir="$1"
    local source_name="$2"

    if [ ! -d "$source_dir" ]; then
        echo -e "${YELLOW}Skipping $source_name (directory not found)${NC}"
        return
    fi

    echo -e "${BLUE}Scanning $source_name...${NC}"
    echo ""

    local file_count=0

    # Find all markdown, text, and PDF files, excluding system folders
    find "$source_dir" \
        -type f \
        \( -name "*.md" -o -name "*.txt" -o -name "*.pdf" \) \
        ! -path "*/node_modules/*" \
        ! -path "*/.git/*" \
        ! -path "*/.*" \
        ! -name ".*" \
        | while read -r file; do

        # Get relative path from source directory
        rel_path="${file#$source_dir/}"

        # Extract top-level directory as category
        category=$(echo "$rel_path" | cut -d'/' -f1)

        # Skip if it's a README in a node_modules-like directory
        if echo "$rel_path" | grep -q "node_modules\|package\|dist\|build"; then
            continue
        fi

        msos_category=$(map_category "$category")

        filename=$(basename "$file")
        ext="${filename##*.}"
        base="${filename%.*}"
        title="${base//_/ }"

        file_type=$(get_file_type "$filename")

        echo -e "${GREEN}✓${NC} Found: $source_name/$rel_path"
        echo -e "  → Category: ${BLUE}$msos_category${NC} | Type: $file_type"

        # Create unique staging filename
        unique_name="${category}_${filename}"
        dest_file="$STAGING_DIR/${unique_name}"

        if [ "$ext" = "pdf" ]; then
            # For PDFs, create a markdown reference
            cat > "${dest_file%.pdf}.md" << EOF
---
title: "$title"
type: document
date_added: $(date +%Y-%m-%d)
tags: [$category]
via: "Local import: $source_name/$rel_path"
source: "file://$file"
---

# $title

**Format:** PDF Document
**Location:** \`$file\`

This is a reference to a PDF document. To view the full content, open the file directly.

EOF
            ((file_count++))
        elif [ "$ext" = "md" ]; then
            # Copy markdown files
            cp "$file" "$dest_file"

            # Add frontmatter if missing
            if ! has_frontmatter "$dest_file"; then
                echo -e "  → Adding frontmatter..."
                add_frontmatter "$dest_file" "$title" "$file_type" "$category" "$source_name/$rel_path"
            fi
            ((file_count++))
        else
            # .txt files - copy and add frontmatter
            cp "$file" "${dest_file%.txt}.md"
            add_frontmatter "${dest_file%.txt}.md" "$title" "$file_type" "$category" "$source_name/$rel_path"
            ((file_count++))
        fi

        echo ""
    done

    echo -e "${GREEN}Processed $source_name${NC}"
    echo ""
}

# Process both directories
process_directory "$KNOWLEDGE_SOURCE" "~/Knowledge"
process_directory "$BUSINESS_SOURCE" "~/Business"

# Count files in staging
staged_count=$(find "$STAGING_DIR" -name "*.md" -type f 2>/dev/null | wc -l | tr -d ' ')

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Scan Complete!${NC}"
echo -e "  Staged for import: ${YELLOW}$staged_count${NC} files"
echo ""

if [ "$staged_count" -eq 0 ]; then
    echo -e "${YELLOW}No new files to import.${NC}"
    rm -rf "$STAGING_DIR"
    exit 0
fi

# Ask for confirmation
echo -e "${YELLOW}Files are staged in: $STAGING_DIR${NC}"
echo ""
echo -e "Ready to import these files into PersonalOS/Knowledge?"
echo -e "${BLUE}This will:${NC}"
echo -e "  1. Convert all files to markdown format"
echo -e "  2. Copy to appropriate MSOS categories"
echo -e "  3. Preserve originals in source locations"
echo -e "  4. Make them visible in your MSOS dashboard"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Import cancelled.${NC}"
    rm -rf "$STAGING_DIR"
    exit 0
fi

# Import files
echo ""
echo -e "${BLUE}Importing files...${NC}"
echo ""

find "$STAGING_DIR" -name "*.md" -type f | while read -r staged_file; do
    filename=$(basename "$staged_file")
    # Extract original category from filename (format: Category_filename.md)
    original_category="${filename%%_*}"
    actual_filename="${filename#*_}"

    msos_category=$(map_category "$original_category")
    dest_dir="$DEST_DIR/$msos_category"

    # Create category directory if it doesn't exist
    mkdir -p "$dest_dir"

    # Copy file
    cp "$staged_file" "$dest_dir/$actual_filename"

    echo -e "${GREEN}✓${NC} Imported: $actual_filename → $msos_category/"
done

# Cleanup staging
rm -rf "$STAGING_DIR"

echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${GREEN}Import Complete!${NC}"
echo -e "  ${YELLOW}$staged_count${NC} files imported"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Refresh your MSOS dashboard"
echo -e "  2. Visit /knowledge to see your imported files"
echo -e "  3. Review and organize as needed"
echo ""
