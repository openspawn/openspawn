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

# Setup PATH in hidden mode so 'openspawn' command works
Hide
Type "export PATH=$HOME/github/openspawn/openspawn/scripts:$PATH"
Enter
Sleep 200ms
Type "chmod +x $HOME/github/openspawn/openspawn/scripts/openspawn-demo.sh"
Enter
Sleep 200ms
Type "alias openspawn='openspawn-demo.sh'"
Enter
Sleep 200ms
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
Type "echo ''"
Enter
Type "echo '  ✨ Try it: npx openspawn --demo'"
Enter
Sleep 800ms
Type "echo '  🌐 Demo:  openspawn.github.io/openspawn/demo'"
Enter
Type "echo ''"
Enter
Sleep 3s
