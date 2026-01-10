#!/bin/bash

# MSOS Bookmark Fetcher
# Convenience wrapper for Smaug Twitter bookmark archiver

SMAUG_DIR="$HOME/PersonalOS/smaug-msos"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}   MSOS BOOKMARK FETCHER${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check if Smaug is set up
if [ ! -d "$SMAUG_DIR" ]; then
    echo -e "${YELLOW}Error: Smaug not found at $SMAUG_DIR${NC}"
    exit 1
fi

cd "$SMAUG_DIR" || exit 1

# Default to fetching 20 bookmarks
COUNT=${1:-20}

echo -e "${YELLOW}Fetching latest $COUNT Twitter bookmarks...${NC}"
echo ""

npx smaug fetch "$COUNT"

echo ""
echo -e "${GREEN}Bookmarks fetched!${NC}"
echo ""
echo -e "${BLUE}To process them:${NC}"
echo -e "  1. I'll process them for you in our chat"
echo -e "  2. Or run: cd $SMAUG_DIR && npx smaug run"
echo ""
echo -e "${YELLOW}Note: Auto-processing with Claude Code doesn't work yet,${NC}"
echo -e "${YELLOW}so just let me know when you've fetched bookmarks and${NC}"
echo -e "${YELLOW}I'll process them for you!${NC}"
echo ""
