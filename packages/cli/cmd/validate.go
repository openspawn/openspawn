package cmd

import (
	"fmt"
	"os"

	"github.com/spf13/cobra"

	"github.com/openspawn/openspawn/cli/internal/orgparser"
)

var validateCmd = &cobra.Command{
	Use:   "validate [file]",
	Short: "Validate an ORG.md file",
	Long: `Parse and validate an ORG.md file, reporting any issues found.

Checks for:
  - Valid markdown structure
  - Required sections (Structure at minimum)
  - Agent role definitions
  - Hierarchy consistency
  - Policy completeness

Examples:
  openspawn validate
  openspawn validate my-org/ORG.md`,
	Args: cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		filePath := "ORG.md"
		if len(args) > 0 {
			filePath = args[0]
		}

		data, err := os.ReadFile(filePath)
		if err != nil {
			return fmt.Errorf("cannot read %s: %w", filePath, err)
		}

		org, errors := orgparser.Parse(data)
		if len(errors) > 0 {
			fmt.Printf("🔴 %s has %d issue(s):\n\n", filePath, len(errors))
			for _, e := range errors {
				fmt.Printf("  • %s\n", e)
			}
			return fmt.Errorf("validation failed")
		}

		fmt.Printf("✅ %s is valid\n\n", filePath)
		fmt.Printf("  Organization:  %s\n", org.Name)
		fmt.Printf("  Agents:        %d\n", len(org.Agents))
		if org.Culture.Preset != "" {
			fmt.Printf("  Culture:       %s\n", org.Culture.Preset)
		}
		fmt.Println()

		// Show agent tree
		fmt.Println("  Agent hierarchy:")
		for _, a := range org.Agents {
			indent := "    "
			if a.Level >= 9 {
				indent = "    "
			} else if a.Level >= 7 {
				indent = "      "
			} else {
				indent = "        "
			}
			fmt.Printf("%s%s %s (L%d, %s)\n", indent, a.Avatar, a.Name, a.Level, a.Domain)
		}
		fmt.Println()

		return nil
	},
}
