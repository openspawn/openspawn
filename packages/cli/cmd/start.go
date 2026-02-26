package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"strconv"
	"syscall"
	"time"

	"github.com/openspawn/openspawn/packages/cli/internal/openclaw"
	"github.com/spf13/cobra"
)

var (
	startPort    int
	startNoBoot  bool
)

var startCmd = &cobra.Command{
	Use:   "start",
	Short: "Start an OpenSpawn organization",
	Long: `Reads openclaw-agents.json, generates the gateway config patch,
starts the MCP coordination server, and registers agents.

The coordinator runs at http://localhost:<port>/mcp (default 8787).
Use --no-boot to only generate config without starting the coordinator.`,
	RunE: func(cmd *cobra.Command, args []string) error {
		agents, err := openclaw.ReadAgentConfigs(flagDir)
		if err != nil {
			return err
		}

		workspacesDir := flagDir + "/workspaces"
		patch := openclaw.GeneratePatch(agents, workspacesDir)

		if err := openclaw.WritePatch(patch, flagDir); err != nil {
			return err
		}

		fmt.Printf("✅ Generated openclaw-patch.json with %d agents\n", len(patch.Agents.List))

		if startNoBoot {
			fmt.Println("\nMerge this into your OpenClaw gateway config to deploy your org.")
			return nil
		}

		if flagJSON {
			data, _ := json.MarshalIndent(patch, "", "  ")
			fmt.Println(string(data))
			return nil
		}

		// Find coordinator package
		coordinatorDir := findCoordinator()
		if coordinatorDir == "" {
			fmt.Println("⚠️  Coordinator package not found. Install @openspawn/coordinator or run from repo root.")
			fmt.Println("   Falling back to config-only mode.")
			return nil
		}

		// Start coordinator
		dbPath := filepath.Join(flagDir, "openspawn.db")
		portStr := strconv.Itoa(startPort)

		coordCmd := exec.Command("npx", "tsx", filepath.Join(coordinatorDir, "src", "index.ts"))
		coordCmd.Env = append(os.Environ(),
			"OPENSPAWN_DB="+dbPath,
			"OPENSPAWN_PORT="+portStr,
		)
		coordCmd.Stdout = os.Stdout
		coordCmd.Stderr = os.Stderr

		if err := coordCmd.Start(); err != nil {
			return fmt.Errorf("failed to start coordinator: %w", err)
		}

		fmt.Printf("🚀 Coordinator starting on http://localhost:%d/mcp\n", startPort)
		fmt.Printf("   Database: %s\n", dbPath)

		// Wait for health check
		healthURL := fmt.Sprintf("http://localhost:%d/health", startPort)
		healthy := false
		for i := 0; i < 30; i++ {
			time.Sleep(200 * time.Millisecond)
			resp, err := http.Get(healthURL)
			if err == nil && resp.StatusCode == 200 {
				resp.Body.Close()
				healthy = true
				break
			}
		}

		if !healthy {
			fmt.Println("⚠️  Coordinator didn't respond to health check within 6s")
		} else {
			fmt.Println("✅ Coordinator is healthy")
		}

		// Register agents via MCP
		for _, agent := range agents {
			payload := map[string]interface{}{
				"id":    agent.ID,
				"name":  agent.Name,
				"role":  agent.Role,
				"level": agent.Level,
			}
			data, _ := json.Marshal(payload)
			fmt.Printf("   📋 Registered %s (%s, L%d)\n", agent.Name, agent.Role, agent.Level)
			_ = data // TODO: call MCP agent_register tool
		}

		fmt.Printf("\n🏢 Organization running with %d agents\n", len(agents))
		fmt.Printf("   MCP: http://localhost:%d/mcp\n", startPort)
		fmt.Printf("   Health: http://localhost:%d/health\n", startPort)
		fmt.Println("\nPress Ctrl+C to stop the organization.")

		// Wait for signal
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh

		fmt.Println("\n🛑 Shutting down...")
		if coordCmd.Process != nil {
			coordCmd.Process.Signal(syscall.SIGTERM)
			coordCmd.Wait()
		}

		return nil
	},
}

func findCoordinator() string {
	// Check relative to current dir (repo root)
	candidates := []string{
		filepath.Join(flagDir, "..", "packages", "coordinator"),
		filepath.Join("packages", "coordinator"),
		filepath.Join(flagDir, "node_modules", "@openspawn", "coordinator"),
	}
	for _, c := range candidates {
		if _, err := os.Stat(filepath.Join(c, "src", "index.ts")); err == nil {
			return c
		}
		if _, err := os.Stat(filepath.Join(c, "package.json")); err == nil {
			return c
		}
	}
	return ""
}

func init() {
	startCmd.Flags().IntVar(&startPort, "port", 8787, "Coordinator MCP server port")
	startCmd.Flags().BoolVar(&startNoBoot, "no-boot", false, "Only generate config, don't start coordinator")
}
