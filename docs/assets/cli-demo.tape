# VHS tape for OpenSpawn CLI demo
# Install: brew install vhs
# Run: vhs docs/assets/cli-demo.tape

Output docs/assets/cli-demo.gif

Set FontSize 14
Set Width 900
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20
Set TypingSpeed 40ms

# Start fresh
Type "# OpenSpawn CLI Demo"
Enter
Sleep 500ms

# Show help
Type "openspawn --help"
Enter
Sleep 2s

# List agents
Type "openspawn --demo agents list"
Enter
Sleep 2s

# List tasks
Type "openspawn --demo tasks list"
Enter
Sleep 2s

# Check credits
Type "openspawn --demo credits balance"
Enter
Sleep 2s

# Create a new task
Type 'openspawn --demo tasks create --title "Review PR #42" --priority high'
Enter
Sleep 2s

# Create a new agent
Type 'openspawn --demo agents create --name "QA Bot" --level 4'
Enter
Sleep 2s

# Show agent details
Type "openspawn --demo agents get research-bot"
Enter
Sleep 2s

# Final pause
Sleep 1s
