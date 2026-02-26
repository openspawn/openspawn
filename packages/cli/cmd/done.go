package cmd

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/spf13/cobra"
)

var doneKeep bool

var doneCmd = &cobra.Command{
	Use:   "done",
	Short: "Archive the organization and return results",
	Long: `Stops the organization, archives the workspace, and outputs a summary.
The database and workspaces are preserved in an archive directory.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil {
			return fmt.Errorf("no org found in %s: %w", flagDir, err)
		}

		timestamp := time.Now().Format("2006-01-02T150405")
		archiveDir := filepath.Join(flagDir, ".archives", timestamp)

		if !doneKeep {
			if err := os.MkdirAll(archiveDir, 0755); err != nil {
				return fmt.Errorf("failed to create archive: %w", err)
			}

			// Move key files to archive
			filesToArchive := []string{
				"openclaw-agents.json",
				"openclaw-patch.json",
				"openspawn.db",
				"ORG.md",
			}
			for _, f := range filesToArchive {
				src := filepath.Join(flagDir, f)
				if _, err := os.Stat(src); err == nil {
					dst := filepath.Join(archiveDir, f)
					os.Rename(src, dst)
				}
			}

			// Move workspaces
			wsDir := filepath.Join(flagDir, "workspaces")
			if _, err := os.Stat(wsDir); err == nil {
				os.Rename(wsDir, filepath.Join(archiveDir, "workspaces"))
			}
		}

		// Build summary
		summary := map[string]interface{}{
			"timestamp":  timestamp,
			"agents":     len(agents),
			"archiveDir": archiveDir,
			"status":     "archived",
		}

		if flagJSON {
			data, _ := json.MarshalIndent(summary, "", "  ")
			fmt.Println(string(data))
			return nil
		}

		fmt.Printf("📦 Organization archived\n")
		fmt.Printf("   Agents: %d\n", len(agents))
		fmt.Printf("   Archive: %s\n", archiveDir)
		if doneKeep {
			fmt.Println("   (--keep: files left in place)")
		}
		fmt.Println("\nRun `openspawn init` to start a new organization.")
		return nil
	},
}

func init() {
	doneCmd.Flags().BoolVar(&doneKeep, "keep", false, "Don't move files to archive")
}
