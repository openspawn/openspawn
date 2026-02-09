# VHS CLI Demo Recording
# Run: vhs docs/assets/cli-demo.tape

Output docs/assets/cli-demo.gif

Set Shell "bash"
Set FontSize 16
Set Width 1000
Set Height 650
Set Theme "Catppuccin Mocha"
Set Padding 24
Set TypingSpeed 50ms

# Start with a fresh prompt
Hide
Type "cd ~/github/openspawn/openspawn && clear"
Enter
Sleep 500ms
Show

# Show the slick banner
Type "pnpm exec tsx apps/cli/src/main.ts --help"
Enter
Sleep 2.5s

# Clear and show agents
Type "clear"
Enter
Sleep 300ms

Type "# 👥 See your agent organization"
Enter
Sleep 800ms

Type "pnpm exec tsx apps/cli/src/main.ts agents list --demo"
Enter
Sleep 3s

# Show tasks
Type "clear"
Enter
Sleep 300ms

Type "# 📋 Track tasks across your team"
Enter
Sleep 800ms

Type "pnpm exec tsx apps/cli/src/main.ts tasks list --demo"
Enter
Sleep 3s

# Show credits
Type "clear"
Enter
Sleep 300ms

Type "# 💰 Monitor spending in real-time"
Enter
Sleep 800ms

Type "pnpm exec tsx apps/cli/src/main.ts credits balance --demo"
Enter
Sleep 3s

# Final message
Type "clear"
Enter
Sleep 300ms

Type "# ✨ Try it: npx openspawn --demo"
Enter
Sleep 500ms
Type "#"
Enter
Type "# 🌐 Dashboard: openspawn.github.io/openspawn/demo"
Enter
Sleep 3s
