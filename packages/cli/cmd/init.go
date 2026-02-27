package cmd

import (
	"fmt"
	"os"
	"path/filepath"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/spf13/cobra"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/openspawn/openspawn/packages/cli/internal/templates"
	"github.com/openspawn/openspawn/packages/cli/internal/wizard"
)

var (
	flagTemplate       string
	flagNonInteractive bool
	flagOpenClaw       bool
)

var initCmd = &cobra.Command{
	Use:   "init [directory]",
	Short: "Create a new agent organization",
	Long: `Create a new agent organization with an interactive wizard.

The wizard helps you pick a template, name your team, and customize
your agents. The result is an ORG.md file and configuration.

Templates:
  assistant-team    Personal AI team (chief of staff + specialists)
  content-agency    Content production pipeline
  dev-shop          Software development team
  research-lab      Research & analysis team

Examples:
  openspawn init
  openspawn init my-team
  openspawn init my-team --template=assistant-team`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		targetDir := "."
		if len(args) > 0 {
			targetDir = args[0]
		}

		if yes, _ := cmd.Flags().GetBool("yes"); yes {
			flagNonInteractive = true
		}

		if flagNonInteractive {
			return runNonInteractive(targetDir)
		}

		return runWizard(targetDir)
	},
}

func init() {
	initCmd.Flags().StringVarP(&flagTemplate, "template", "t", "", "Template to use (skip wizard selection)")
	initCmd.Flags().BoolVar(&flagNonInteractive, "non-interactive", false, "Skip wizard, use defaults")
	initCmd.Flags().BoolVarP(&flagOpenClaw, "openclaw", "", true, "Generate OpenClaw agent configs and workspaces")
	initCmd.Flags().BoolP("yes", "y", false, "Alias for --non-interactive")
}

func runWizard(targetDir string) error {
	// Convert templates to wizard info
	var infos []wizard.TemplateInfo
	for _, t := range templates.Available() {
		infos = append(infos, wizard.TemplateInfo{
			Name:        t.Name,
			Label:       t.Label,
			Description: t.Description,
		})
	}

	w := wizard.New(infos)
	p := tea.NewProgram(w, tea.WithAltScreen())
	finalModel, err := p.Run()
	if err != nil {
		return fmt.Errorf("wizard failed: %w", err)
	}

	result, ok := finalModel.(wizard.Model)
	if !ok || result.Cancelled() {
		fmt.Println("Cancelled.")
		return nil
	}

	return scaffold(targetDir, result.Answers())
}

func runNonInteractive(targetDir string) error {
	tmplName := flagTemplate
	if tmplName == "" {
		tmplName = "assistant-team"
	}

	tmpl, ok := templates.Get(tmplName)
	if !ok {
		return fmt.Errorf("unknown template: %s", tmplName)
	}

	answers := wizard.Answers{
		TeamName:     "My Team",
		TemplateName: tmplName,
	}

	_ = tmpl // used via answers.TemplateName in scaffold
	return scaffold(targetDir, answers)
}

func scaffold(targetDir string, answers wizard.Answers) error {
	// Create directory if needed
	if targetDir != "." {
		if err := os.MkdirAll(targetDir, 0o755); err != nil {
			return fmt.Errorf("failed to create directory: %w", err)
		}
	}

	// Get template
	tmpl, ok := templates.Get(answers.TemplateName)
	if !ok {
		return fmt.Errorf("unknown template: %s", answers.TemplateName)
	}

	// Render ORG.md with team name
	orgContent := templates.Render(tmpl, answers.TeamName)

	// Write ORG.md
	orgPath := filepath.Join(targetDir, "ORG.md")
	if err := os.WriteFile(orgPath, []byte(orgContent), 0o644); err != nil {
		return fmt.Errorf("failed to write ORG.md: %w", err)
	}

	// Write config
	configContent := `{
  "port": 3333,
  "orgFile": "ORG.md",
  "simulation": {
    "mode": "deterministic",
    "tickInterval": 3000
  }
}
`
	configPath := filepath.Join(targetDir, "openspawn.config.json")
	if err := os.WriteFile(configPath, []byte(configContent), 0o644); err != nil {
		return fmt.Errorf("failed to write config: %w", err)
	}

	// Write .gitignore
	gitignorePath := filepath.Join(targetDir, ".gitignore")
	if err := os.WriteFile(gitignorePath, []byte("node_modules/\n.env\ndata/\n"), 0o644); err != nil {
		return fmt.Errorf("failed to write .gitignore: %w", err)
	}

	// Generate OpenClaw agent configs
	openclawMsg := ""
	if flagOpenClaw {
		if err := openclaw.Generate(targetDir, []byte(orgContent)); err != nil {
			return fmt.Errorf("failed to generate OpenClaw configs: %w", err)
		}
		openclawMsg = "  openclaw-agents.json    — OpenClaw agent session configs\n  workspaces/             — Agent workspace directories\n"
	}

	// Success message
	prefix := ""
	if targetDir != "." {
		prefix = fmt.Sprintf("  cd %s\n", targetDir)
	}

	fmt.Printf(`
🪸 OpenSpawn initialized!

Created:
  ORG.md                  — Your agent organization
  openspawn.config.json   — Configuration
  .gitignore
%s
Next steps:
%s  1. Review and customize ORG.md
  2. Run: openspawn preview
  3. Deploy: openspawn deploy

Template: %s
Team: %s
`, openclawMsg, prefix, answers.TemplateName, answers.TeamName)

	return nil
}
