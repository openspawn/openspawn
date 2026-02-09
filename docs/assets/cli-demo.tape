# VHS CLI Demo Recording
# Run: vhs docs/assets/cli-demo.tape

Output docs/assets/cli-demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1000
Set Height 650
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 40ms

# Setup alias in hidden mode
Hide
Type "cd ~/github/openspawn/openspawn"
Enter
Sleep 300ms
Type "alias openspawn='pnpm exec tsx apps/cli/src/main.ts 2>/dev/null'"
Enter
Sleep 300ms
Type "clear"
Enter
Sleep 300ms
Show

# Show the slick banner
Type "openspawn"
Enter
Sleep 3s

# List agents
Type "openspawn agents list --demo"
Enter
Sleep 3.5s

# List tasks
Type "openspawn tasks list --demo"
Enter
Sleep 3.5s

# Check credits
Type "openspawn credits balance --demo"
Enter
Sleep 3s

# End card
Type "clear"
Enter
Sleep 300ms
Type "echo '✨ Try it yourself:'"
Enter
Sleep 500ms
Type "echo '   npx openspawn --demo'"
Enter
Sleep 500ms
Type "echo ''"
Enter
Type "echo '🌐 Live dashboard:'"
Enter
Sleep 500ms
Type "echo '   openspawn.github.io/openspawn/demo'"
Enter
Sleep 3s
