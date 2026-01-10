#!/bin/bash

# Fix UTF-8 encoding issues in Knowledge files

KNOWLEDGE_DIR="$HOME/PersonalOS/Knowledge"

echo "🔧 Fixing UTF-8 encoding in Knowledge files..."
echo ""

fixed_count=0
error_count=0

# Find all .md files
find "$KNOWLEDGE_DIR" -name "*.md" -type f | while read -r file; do
    # Check if file is valid UTF-8
    if ! iconv -f UTF-8 -t UTF-8 "$file" > /dev/null 2>&1; then
        echo "Fixing: $file"

        # Create backup
        cp "$file" "${file}.backup"

        # Try to convert from common encodings
        if iconv -f ISO-8859-1 -t UTF-8 "$file" > "${file}.tmp" 2>/dev/null; then
            mv "${file}.tmp" "$file"
            rm "${file}.backup"
            ((fixed_count++))
        elif iconv -f WINDOWS-1252 -t UTF-8 "$file" > "${file}.tmp" 2>/dev/null; then
            mv "${file}.tmp" "$file"
            rm "${file}.backup"
            ((fixed_count++))
        else
            # Restore backup if conversion failed
            mv "${file}.backup" "$file"
            echo "  ❌ Could not convert: $file"
            ((error_count++))
        fi
    fi
done

echo ""
echo "✅ Fixed $fixed_count files"
if [ $error_count -gt 0 ]; then
    echo "❌ Could not fix $error_count files"
fi
