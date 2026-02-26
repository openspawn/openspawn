package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"
)

var version = "0.1.0"

var (
	flagDir  string
	flagJSON bool
)

var rootCmd = &cobra.Command{
	Use:   "openspawn",
	Short: "OpenSpawn — AI agent orchestration",
	Long: `OpenSpawn — Organization as Code for AI agent teams.

Define your agent organization in a single markdown file (ORG.md).
Deploy it. Watch it work. Tune it over time.

  openspawn init          Create a new agent organization
  openspawn validate      Validate an ORG.md file
  openspawn preview       Preview your org in the dashboard
  openspawn status        Check running org health`,
}

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("openspawn v%s\n", version)
	},
}

func Execute() {
	rootCmd.AddCommand(versionCmd)
	rootCmd.AddCommand(initCmd)
	rootCmd.AddCommand(validateCmd)
	rootCmd.AddCommand(startCmd)
	rootCmd.AddCommand(statusCmd)
	rootCmd.AddCommand(hireCmd)
	rootCmd.AddCommand(fireCmd)

	// Shared flags for commands that operate on an org directory
	for _, cmd := range []*cobra.Command{startCmd, statusCmd, hireCmd, fireCmd} {
		cmd.Flags().StringVar(&flagDir, "dir", ".", "Directory containing openclaw-agents.json")
		cmd.Flags().BoolVar(&flagJSON, "json", false, "Output as JSON")
	}

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}
