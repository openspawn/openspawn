package cmd

import (
	"encoding/json"
	"fmt"
	"strings"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/spf13/cobra"
)

var statusCmd = &cobra.Command{
	Use:   "status",
	Short: "Show agents in the current org",
	Long:  `Reads openclaw-agents.json and displays a table of all agents with their name, role, level, and model.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil {
			return err
		}

		if flagJSON {
			data, err := json.MarshalIndent(agents, "", "  ")
			if err != nil {
				return err
			}
			fmt.Println(string(data))
			return nil
		}

		// Compute column widths
		nameW, roleW := 4, 4 // "NAME", "ROLE"
		for _, a := range agents {
			if len(a.Name) > nameW {
				nameW = len(a.Name)
			}
			if len(a.Role) > roleW {
				roleW = len(a.Role)
			}
		}

		// Header
		fmt.Printf("%-*s  %-*s  %5s  %s\n", nameW, "NAME", roleW, "ROLE", "LEVEL", "MODEL")
		fmt.Printf("%s  %s  %s  %s\n",
			strings.Repeat("─", nameW),
			strings.Repeat("─", roleW),
			strings.Repeat("─", 5),
			strings.Repeat("─", 28))

		for _, a := range agents {
			model := modelForLevel(a.Level)
			fmt.Printf("%-*s  %-*s  %5d  %s\n", nameW, a.Name, roleW, a.Role, a.Level, model)
		}

		fmt.Printf("\n%d agents total\n", len(agents))
		return nil
	},
}

func modelForLevel(level int) string {
	if level >= 7 {
		return "anthropic/claude-opus-4-6"
	}
	return "anthropic/claude-sonnet-4-5"
}
