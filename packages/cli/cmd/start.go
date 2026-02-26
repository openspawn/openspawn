package cmd

import (
	"encoding/json"
	"fmt"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/spf13/cobra"
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Generate an OpenClaw gateway config patch from your org",
	Long: `Reads openclaw-agents.json and generates openclaw-patch.json — a config
fragment that can be merged into an existing OpenClaw gateway config.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil {
			return err
		}

		workspacesDir := flagDir + "/workspaces"
		patch := openclaw.GeneratePatch(agents, workspacesDir)

		if flagJSON {
			data, err := json.MarshalIndent(patch, "", "  ")
			if err != nil {
				return err
			}
			fmt.Println(string(data))
			return nil
		}

		if err := openclaw.WritePatch(patch, flagDir); err != nil {
			return err
		}

		fmt.Printf("✅ Generated openclaw-patch.json with %d agents\n", len(patch.Agents.List))
		fmt.Println("\nMerge this into your OpenClaw gateway config to deploy your org.")
		return nil
	},
}
