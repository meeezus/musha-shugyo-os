#!/bin/bash

# Morning Digest Generator - 7:00 AM CST
# Pulls together calendar, goals, weather, and priorities

DATE=$(date +'%A, %B %d, %Y')
TIME=$(date +'%I:%M %p %Z')

echo "🏯 **Good morning Michael!** 

⏰ **Today is $DATE** 

## 📅 **Today's Schedule"

# Get today's calendar events
EVENTS=$(osascript -e '
tell application "Calendar"
    set todayStart to (current date)
    set hours of todayStart to 0
    set minutes of todayStart to 0
    set seconds of todayStart to 0
    
    set todayEnd to todayStart + (24 * 60 * 60)
    
    set todayEvents to {}
    repeat with cal in calendars
        set calEvents to (every event of cal whose start date ≥ todayStart and start date < todayEnd)
        set todayEvents to todayEvents & calEvents
    end repeat
    
    if length of todayEvents = 0 then
        return "No events scheduled for today"
    else
        set eventList to {}
        repeat with evt in todayEvents
            set startTime to start date of evt
            set eventTime to time string of startTime
            set eventInfo to "- " & eventTime & ": " & (summary of evt)
            set end of eventList to eventInfo
        end repeat
        return (eventList as string)
    end if
end tell')

echo "$EVENTS"

echo "
## 🎯 **MSOS Goals Check-in**"

# Get current goals (first 3 lines of priority section)
GOALS=$(head -20 ~/PersonalOS/Memory/goals.md | grep -A3 "Priority Order" | tail -3)
echo "$GOALS"

echo "
## 💪 **Health Check**"
echo "- Nerve recovery: MRI scheduled Jan 19"
echo "- BJJ training: Paused during recovery"

echo "
## 🏆 **This Week's Focus** 
- DecoponATX hero video (Days 1-2)
- Landing page with email capture (Days 3-5) 
- Email automation scoping
- Theresa Bastian discovery call

---
**Ready to make it count today?** 🏯"
