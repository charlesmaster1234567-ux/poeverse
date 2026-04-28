# Plan: Add Missing WebSocket Handlers to chat.js

## Information Gathered
- `chat.js` (server) only handles 3 WS message types: `join`, `message`, `typing`.
- `chat.html` (client) sends and expects many more types: `get_history`, `get_dm_history`, `dm`, `edit`, `delete`, `reaction`, `create_channel`, `stop_typing`, and expects a `users` broadcast.
- The server defines `directMessages` state but never uses it.
- `handleMessage` ignores file attachments.

## Files to Edit
- `chat.js`

## Detailed Steps
1. **Add `getDMKey(u1, u2)` helper** — consistent DM key generation.
2. **Add `sendUsersList()` helper** — broadcast online users to all clients.
3. **Update `handleJoin`** — call `sendUsersList()` after join.
4. **Update `ws.on('close')`** — call `sendUsersList()` after user leaves.
5. **Update `handleMessage`** — pass through `data.file` if present.
6. **Add `handleGetHistory(ws, data)`** — respond with channel history.
7. **Add `handleGetDMHistory(ws, data)`** — respond with DM history.
8. **Add `handleDM(ws, data)`** — store and forward direct messages.
9. **Add `handleEdit(ws, data)`** — edit messages in channels/DMs.
10. **Add `handleDelete(ws, data)`** — delete messages in channels/DMs.
11. **Add `handleReaction(ws, data)`** — toggle emoji reactions.
12. **Add `handleCreateChannel(ws, data)`** — create new channels.
13. **Add `handleStopTyping(ws, data)`** — broadcast stop-typing event.
14. **Expand the main `switch` statement** — wire all new handlers.

## Follow-up
- Run `npm start` to verify no syntax errors.

