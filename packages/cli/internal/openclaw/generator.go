package openclaw

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/openspawn/openspawn/packages/cli/internal/orgparser"
)

// AgentConfig is defined in patcher.go

const standardAgentsMD = `# AGENTS.md - Agent Workspace

## Every Session

1. Read ` + "`SOUL.md`" + ` — this is who you are
2. Check ` + "`memory/`" + ` for recent context

## Memory

- **Daily notes:** ` + "`memory/YYYY-MM-DD.md`" + ` — raw logs of what happened
- Write down anything worth remembering. Files are your only continuity.

## Safety

- Don't run destructive commands without asking.
- When in doubt, ask.
`

// modelForLevel is defined in patcher.go

func sanitizeDirName(name string) string {
	s := strings.ToLower(name)
	s = strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, s)
	return strings.Trim(s, "-")
}

func generateSoulMD(agent orgparser.Agent) string {
	var b strings.Builder
	fmt.Fprintf(&b, "# SOUL.md — %s\n\n", agent.Name)
	fmt.Fprintf(&b, "**Role:** %s\n", agent.Role)
	fmt.Fprintf(&b, "**Domain:** %s\n", agent.Domain)
	fmt.Fprintf(&b, "**Level:** %d\n\n", agent.Level)
	if agent.ReportsTo != "" {
		fmt.Fprintf(&b, "**Reports to:** %s\n\n", agent.ReportsTo)
	}
	b.WriteString("## Identity\n\n")
	fmt.Fprintf(&b, "You are %s, a %s-level agent in the %s domain.\n", agent.Name, agent.Role, agent.Domain)
	b.WriteString("Be competent, direct, and focused on your area of expertise.\n")
	return b.String()
}

// Generate parses rendered ORG.md content and creates workspace dirs + openclaw-agents.json.
func Generate(targetDir string, orgContent []byte) error {
	parsed, errs := orgparser.Parse(orgContent)
	if len(parsed.Agents) == 0 {
		return fmt.Errorf("no agents found in ORG.md: %v", errs)
	}

	workspacesDir := filepath.Join(targetDir, "workspaces")
	var configs []AgentConfig

	for _, agent := range parsed.Agents {
		dirName := sanitizeDirName(agent.Name)
		agentDir := filepath.Join(workspacesDir, dirName)

		// Create workspace and memory dir
		if err := os.MkdirAll(filepath.Join(agentDir, "memory"), 0o755); err != nil {
			return fmt.Errorf("failed to create workspace for %s: %w", agent.Name, err)
		}

		// Write SOUL.md
		if err := os.WriteFile(filepath.Join(agentDir, "SOUL.md"), []byte(generateSoulMD(agent)), 0o644); err != nil {
			return fmt.Errorf("failed to write SOUL.md for %s: %w", agent.Name, err)
		}

		// Write AGENTS.md
		if err := os.WriteFile(filepath.Join(agentDir, "AGENTS.md"), []byte(standardAgentsMD), 0o644); err != nil {
			return fmt.Errorf("failed to write AGENTS.md for %s: %w", agent.Name, err)
		}

		configs = append(configs, AgentConfig{
			ID:        dirName,
			Name:      agent.Name,
			Role:      agent.Role,
			Level:     agent.Level,
			ReportsTo: agent.ReportsTo,
			Workspace: filepath.Join("workspaces", dirName),
			Model:     modelForLevel(agent.Level),
		})
	}

	// Write openclaw-agents.json
	data, err := json.MarshalIndent(configs, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal agent configs: %w", err)
	}

	if err := os.WriteFile(filepath.Join(targetDir, "openclaw-agents.json"), data, 0o644); err != nil {
		return fmt.Errorf("failed to write openclaw-agents.json: %w", err)
	}

	return nil
}
