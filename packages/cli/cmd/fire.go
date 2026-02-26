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

var fireKeepWorkspace bool

var fireCmd = &cobra.Command{
	Use:   "fire <agent-name>",
	Short: "Remove an agent from the org",
	Long: `Removes an agent from the organization by:
  1. Removing from openclaw-agents.json
  2. Regenerating openclaw-patch.json
  3. Optionally archiving the agent's workspace

The agent won't stop until the gateway config is reloaded.`,
	Args: cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		agentID := strings.ToLower(strings.ReplaceAll(args[0], " ", "-"))

		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil {
			return fmt.Errorf("failed to read agents: %w", err)
		}

		// Find and remove agent
		found := false
		var remaining []openclaw.AgentConfig
		var removed openclaw.AgentConfig
		for _, a := range agents {
			if a.ID == agentID {
				found = true
				removed = a
			} else {
				remaining = append(remaining, a)
			}
		}

		if !found {
			return fmt.Errorf("agent %q not found", agentID)
		}

		// Write updated agents config
		agentsFile := filepath.Join(flagDir, "openclaw-agents.json")
		data, err := json.MarshalIndent(remaining, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal agents: %w", err)
		}
		if err := os.WriteFile(agentsFile, data, 0644); err != nil {
			return fmt.Errorf("failed to write agents config: %w", err)
		}

		// Regenerate patch
		workspacesDir := filepath.Join(flagDir, "workspaces")
		patch := openclaw.GeneratePatch(remaining, workspacesDir)
		if err := openclaw.WritePatch(patch, flagDir); err != nil {
			return fmt.Errorf("failed to regenerate patch: %w", err)
		}

		// Archive workspace unless --keep-workspace
		if !fireKeepWorkspace {
			wsDir := filepath.Join(flagDir, "workspaces", agentID)
			archiveDir := filepath.Join(flagDir, "workspaces", ".archived", agentID)
			if _, err := os.Stat(wsDir); err == nil {
				os.MkdirAll(filepath.Dir(archiveDir), 0755)
				os.Rename(wsDir, archiveDir)
			}
		}

		if flagJSON {
			out, _ := json.MarshalIndent(removed, "", "  ")
			fmt.Println(string(out))
			return nil
		}

		fmt.Printf("🔥 Fired %s (%s, L%d)\n", removed.Name, removed.Role, removed.Level)
		if !fireKeepWorkspace {
			fmt.Printf("   Workspace archived to .archived/%s\n", agentID)
		}
		fmt.Println("\nReload gateway config to deactivate this agent.")
		return nil
	},
}

func init() {
	fireCmd.Flags().BoolVar(&fireKeepWorkspace, "keep-workspace", false, "Don't archive the agent's workspace")
}
