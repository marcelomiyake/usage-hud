# The README screenshot: the usage-hud status line in a live Claude Code
# session, after one short turn so the context and usage figures are in.
# It calls the model once, so the figures differ on each run.
#
#   vhs docs/statusline.tape        (from the repository root, after npm run build)

Output docs/statusline.gif

Require claude

Set Shell bash
Set FontSize 18
Set Width 1200
Set Height 560
Set Padding 24
Set TypingSpeed 40ms

# Start Claude Code with only this mod: no MCP servers, no user settings.
Hide
Type "clear && claude --plugin-dir . --strict-mcp-config --setting-sources project,local --permission-mode default --model opus"
Enter
Wait+Screen@60s /for shortcuts/
Sleep 2s
Show
Sleep 1s

Type "Reply with one word: ready?"
Enter
Wait+Screen@90s /🕔/
Sleep 3s

Screenshot docs/statusline.png
Sleep 1s

Hide
Ctrl+C
Ctrl+C
