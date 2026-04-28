# WebSocket Fix TODO

## Problem
- `chat.js` has duplicated server code causing SyntaxError on startup
- `chat.html` reconnects aggressively every 3s with no backoff, causing console spam

## Steps
- [x] 1. Analyze files and understand the issue
- [ ] 2. Fix `chat.js` — remove duplicated server instance
- [ ] 3. Fix `chat.html` — add exponential backoff + offline detection
- [ ] 4. Test locally with `node chat.js`

