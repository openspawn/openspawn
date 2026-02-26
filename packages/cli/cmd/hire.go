package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/spf13/cobra"
)

var (
	hireLevel int
	hireRole  string
	hireDept  string
)

var hireCmd = &cobra.Command{
	Use:   "hire <agent-name>",
	Short: "Add a new agent to the running org",
	Long: `Adds a new agent to the organization by:
  1. Creating the agent's workspace directory
  2. Generating SOUL.md and AGENTS.md from templates
  3. Updating openclaw-agents.json
  4. Regenerating openclaw-patch.json

The agent won't start until the gateway config is reloaded.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		name := args[0]
		agentID := strings.ToLower(strings.ReplaceAll(name, " ", "-"))

		// Read existing agents
		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil && !os.IsNotExist(err) {
			return fmt.Errorf("failed to read existing agents: %w", err)
		}

		// Check for duplicates
		for _, a := range agents {
			if a.ID == agentID {
				return fmt.Errorf("agent %q already exists", agentID)
			}
		}

		// Determine model from level
		model := "anthropic/claude-sonnet-4-5"
		if hireLevel >= 7 {
			model = "anthropic/claude-opus-4-6"
		}

		// Create workspace
		workspaceDir := filepath.Join(flagDir, "workspaces", agentID)
		if err := os.MkdirAll(workspaceDir, 0755); err != nil {
			return fmt.Errorf("failed to create workspace: %w", err)
		}

		// Generate SOUL.md
		soul := fmt.Sprintf(`# SOUL.md — %s

## Identity
- **Name:** %s
- **Role:** %s
- **Department:** %s
- **Level:** %d

## Communication Protocol
- Silence = success. No acknowledgments.
- Files over chat. Write RESULT.md, not messages.
- 4 message types only: TASK, RESULT, ESCALATION, DECISION.
- Max 3 turns for any exchange. Unresolved → escalate.
`, name, name, hireRole, hireDept, hireLevel)

		if err := os.WriteFile(filepath.Join(workspaceDir, "SOUL.md"), []byte(soul), 0644); err != nil {
			return fmt.Errorf("failed to write SOUL.md: %w", err)
		}

		// Create new agent config
		newAgent := openclaw.AgentConfig{
			ID:        agentID,
			Name:      name,
			Role:      hireRole,
			Level:     hireLevel,
			Model:     model,
			Workspace: workspaceDir,
		}

		agents = append(agents, newAgent)

		// Write updated agents config
		agentsFile := filepath.Join(flagDir, "openclaw-agents.json")
		data, err := json.MarshalIndent(agents, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal agents: %w", err)
		}
		if err := os.WriteFile(agentsFile, data, 0644); err != nil {
			return fmt.Errorf("failed to write agents config: %w", err)
		}

		// Regenerate patch
		workspacesDir := filepath.Join(flagDir, "workspaces")
		patch := openclaw.GeneratePatch(agents, workspacesDir)
		if err := openclaw.WritePatch(patch, flagDir); err != nil {
			return fmt.Errorf("failed to regenerate patch: %w", err)
		}

		if flagJSON {
			out, _ := json.MarshalIndent(newAgent, "", "  ")
			fmt.Println(string(out))
			return nil
		}

		fmt.Printf("✅ Hired %s (%s, L%d)\n", name, hireRole, hireLevel)
		fmt.Printf("   Workspace: %s\n", workspaceDir)
		fmt.Printf("   Model: %s\n", model)
		fmt.Println("\nReload gateway config to activate this agent.")
		return nil
	},
}

func init() {
	hireCmd.Flags().IntVar(&hireLevel, "level", 3, "Agent level (1-10, determines model)")
	hireCmd.Flags().StringVar(&hireRole, "role", "worker", "Agent role description")
	hireCmd.Flags().StringVar(&hireDept, "dept", "general", "Department name")
}
