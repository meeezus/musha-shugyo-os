#!/bin/bash

# Ralph - The Clean Slate Coding Agent Loop
# Based on Matt Pocock's approach

# Load config
source ./config.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Initialize progress.txt if it doesn't exist
if [ ! -f $PROGRESS_FILE ]; then
    echo "# Ralph Progress Log - $(date)" > $PROGRESS_FILE
    echo "" >> $PROGRESS_FILE
fi

echo -e "${GREEN}🏯 Ralph starting for $PROJECT_NAME${NC}"
echo "Max iterations: $MAX_ITERATIONS"
echo "Project directory: $PROJECT_DIR"
echo ""

cd $PROJECT_DIR

for i in $(seq 1 $MAX_ITERATIONS); do
    echo -e "${YELLOW}--- Iteration $i/$MAX_ITERATIONS ---${NC}"
    
    # Check if we're complete
    if grep -q "<promise>COMPLETE</promise>" $PROGRESS_FILE 2>/dev/null; then
        echo -e "${GREEN}✅ Project marked COMPLETE! Exiting early.${NC}"
        break
    fi
    
    # Prepare prompt with current state
    CURRENT_TIME=$(date)
    CURRENT_BRANCH=$(git branch --show-current)
    RECENT_COMMITS=$(git log --oneline -10)
    
    # Run Claude Code with clean context
    echo "Starting Claude Code session $i..."
    
    # Create dynamic prompt
    cat > /tmp/ralph-prompt-$i.txt << PROMPT_EOF
$SYSTEM_PROMPT

## Current State
- Time: $CURRENT_TIME
- Branch: $CURRENT_BRANCH
- Iteration: $i/$MAX_ITERATIONS

## Recent Progress
$(cat $PROGRESS_FILE)

## Recent Commits
$RECENT_COMMITS

## Current PRD
$(cat $PRD_FILE)

## Instructions
1. Review the PRD and pick the highest priority incomplete user story
2. Work ONLY on that one story - don't try to do multiple things
3. Run tests and type checks before committing
4. Commit your work with clear message
5. Update progress.txt with what you accomplished
6. If the story is complete, update the PRD to mark "passes": true
7. If ALL stories are done, reply with <promise>COMPLETE</promise>

## Commands Available
- Tests: $TEST_COMMAND
- Type check: $TYPE_CHECK_COMMAND
- Git commit: git add . && git commit -m "your message"

Start working on the highest priority incomplete story now.
PROMPT_EOF

    # Run Claude Code
    echo "Invoking Claude Code..."
    cd $PROJECT_DIR && claude --print "$(cat /tmp/ralph-prompt-$i.txt)" 2>&1 | tee /tmp/ralph-output-$i.txt
    
    # Check for completion
    if grep -q "<promise>COMPLETE</promise>" /tmp/ralph-output-$i.txt; then
        echo -e "${GREEN}✅ Agent reported COMPLETE in iteration $i${NC}"
        echo "## COMPLETE - $(date)" >> $PROGRESS_FILE
        echo "All user stories finished in iteration $i" >> $PROGRESS_FILE
        break
    fi
    
    # Verify tests still pass
    if [ ! -z "$TEST_COMMAND" ]; then
        echo "Running final test check..."
        if ! eval $TEST_COMMAND; then
            echo -e "${RED}❌ Tests failed after iteration $i. Check the code.${NC}"
            echo "## ERROR - $(date)" >> $PROGRESS_FILE
            echo "Tests failed after iteration $i" >> $PROGRESS_FILE
            break
        fi
    fi
    
    echo -e "${GREEN}✅ Iteration $i complete${NC}"
    echo ""
    
    # Clean up temp files
    rm -f /tmp/ralph-prompt-$i.txt /tmp/ralph-output-$i.txt
    
    # Brief pause between iterations
    sleep 2
done

echo -e "${GREEN}🏯 Ralph finished!${NC}"
echo "Check progress.txt and git log for details."
