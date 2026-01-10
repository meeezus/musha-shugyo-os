#!/bin/bash

# Morning Digest - 7:00 AM CST
DATE=$(date +'%A, %B %d, %Y')

echo "🏯 Good morning Michael!"
echo ""
echo "⏰ Today is $DATE"
echo ""

echo "## 🌤️ Weather"
curl -s "wttr.in/Austin?format=%l:+%c+%t+%h+%w" 2>/dev/null || echo "Austin: Check your weather app"
echo ""

echo "## 📅 Today's Schedule"
echo "- 1:00 PM: Dr. Fernandez appointment" 
echo ""

echo "## 🙏 Gratitude Flow"
echo "- Grateful for: Recovery progress and healing time"
echo "- Grateful for: Tricia's support during this journey"  
echo "- Grateful for: The opportunity to build something meaningful"
echo ""

echo "## 💰 Abundance Flow"
echo "- Money flows to me through valuable automation solutions"
echo "- I attract clients who need exactly what I provide"
echo "- Every action today moves me toward $17K goal"
echo "- Abundance mindset: There's enough opportunity for everyone"
echo ""

echo "## 🎯 This Week's Focus"
echo "- DecoponATX hero video (Days 1-2)"
echo "- Landing page + email capture (Days 3-5)" 
echo "- Email automation scoping"
echo "- Theresa discovery call"
echo ""

echo "## 💪 Health Check"
echo "- Nerve recovery ongoing"
echo "- MRI: Jan 19, 2026" 
echo "- BJJ: Paused during healing"
echo "- Listen to body signals today"
echo ""

echo "## 🏆 MSOS Goals"
echo "- Health Recovery (Priority 1)"
echo "- Automation Agency Sprint (\$17K goal)"
echo "- Week 1 of 90-day roadmap"
echo ""
echo "---"
echo "Ready to make it count? 🏯"
