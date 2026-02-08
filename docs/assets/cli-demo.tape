# VHS CLI Demo Recording
# Run: vhs docs/assets/cli-demo.tape

Output docs/assets/cli-demo.gif

Set Shell "bash"
Set FontSize 14
Set Width 900
Set Height 600
Set Theme "Catppuccin Mocha"
Set Padding 20

# Show the banner
Type "openspawn --demo"
Enter
Sleep 2s

# List agents
Type "openspawn agents list --demo"
Enter
Sleep 3s

# Show agent details
Type "openspawn agents get talent-agent --demo"
Enter
Sleep 2s

# List tasks
Type "openspawn tasks list --demo"
Enter
Sleep 3s

# Show task board
Type "openspawn tasks board --demo"
Enter
Sleep 3s

# Check credits
Type "openspawn credits balance --demo"
Enter
Sleep 2s

# Show help
Type "openspawn --help"
Enter
Sleep 3s

# End
Type "# 🚀 OpenSpawn CLI - Multi-agent coordination"
Sleep 2s
