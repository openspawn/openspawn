package openclaw

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// AgentConfig is one entry in openclaw-agents.json (written by `openspawn init`).
type AgentConfig struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Role      string `json:"role"`
	Level     int    `json:"level"`
	Domain    string `json:"domain,omitempty"`
	Avatar    string `json:"avatar,omitempty"`
	ReportsTo string `json:"reportsTo,omitempty"`
	ParentID  string `json:"parentId,omitempty"`
	Workspace string `json:"workspace,omitempty"`
	Model     string `json:"model,omitempty"`
}

// PatchAgent is one agent in the generated OpenClaw config patch.
type PatchAgent struct {
	ID        string          `json:"id"`
	Default   bool            `json:"default,omitempty"`
	Workspace string          `json:"workspace"`
	Model     string          `json:"model"`
	Tools     PatchTools      `json:"tools"`
	Subagents *PatchSubagents `json:"subagents,omitempty"`
}

type PatchTools struct {
	Profile string `json:"profile"`
}

type PatchSubagents struct {
	AllowAgents []string `json:"allowAgents"`
}

// Patch is the top-level output structure.
type Patch struct {
	Agents PatchAgentsList `json:"agents"`
}

type PatchAgentsList struct {
	List []PatchAgent `json:"list"`
}

func toID(name string) string {
	re := regexp.MustCompile(`[^a-z0-9]+`)
	return strings.Trim(re.ReplaceAllString(strings.ToLower(name), "-"), "-")
}

func modelForLevel(level int) string {
	if level >= 7 {
		return "anthropic/claude-opus-4-6"
	}
	return "anthropic/claude-sonnet-4-5"
}

// ReadAgentConfigs reads openclaw-agents.json from the given directory.
func ReadAgentConfigs(dir string) ([]AgentConfig, error) {
	data, err := os.ReadFile(filepath.Join(dir, "openclaw-agents.json"))
	if err != nil {
		return nil, fmt.Errorf("failed to read openclaw-agents.json: %w", err)
	}
	var agents []AgentConfig
	if err := json.Unmarshal(data, &agents); err != nil {
		return nil, fmt.Errorf("failed to parse openclaw-agents.json: %w", err)
	}
	return agents, nil
}

// GeneratePatch produces an OpenClaw config patch from agent configs.
func GeneratePatch(agents []AgentConfig, workspacesDir string) Patch {
	// Build lookup: id -> agent, id -> list of direct report IDs
	type indexedAgent struct {
		cfg AgentConfig
		id  string
	}
	indexed := make([]indexedAgent, len(agents))
	idToAgent := map[string]*indexedAgent{}
	children := map[string][]string{} // parentID -> child IDs

	for i, a := range agents {
		id := toID(a.Name)
		indexed[i] = indexedAgent{cfg: a, id: id}
		idToAgent[id] = &indexed[i]
	}

	// Find highest level
	maxLevel := 0
	for _, a := range agents {
		if a.Level > maxLevel {
			maxLevel = a.Level
		}
	}

	// Build children map from ReportsTo
	for _, ia := range indexed {
		if ia.cfg.ReportsTo != "" {
			parentID := toID(ia.cfg.ReportsTo)
			children[parentID] = append(children[parentID], ia.id)
		}
	}

	// Sort children for deterministic output
	for k := range children {
		sort.Strings(children[k])
	}

	var list []PatchAgent
	for _, ia := range indexed {
		absWorkspace, _ := filepath.Abs(filepath.Join(workspacesDir, ia.id))

		pa := PatchAgent{
			ID:        ia.id,
			Workspace: absWorkspace,
			Model:     modelForLevel(ia.cfg.Level),
			Tools:     PatchTools{Profile: "full"},
		}

		// Main agent (highest level) gets default: true
		if ia.cfg.Level == maxLevel {
			pa.Default = true
		}

		// Level >= 7 with direct reports gets subagents
		if ia.cfg.Level >= 7 {
			if kids, ok := children[ia.id]; ok && len(kids) > 0 {
				pa.Subagents = &PatchSubagents{AllowAgents: kids}
			}
		}

		list = append(list, pa)
	}

	return Patch{Agents: PatchAgentsList{List: list}}
}

// WritePatch writes the patch to a file.
func WritePatch(patch Patch, dir string) error {
	data, err := json.MarshalIndent(patch, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(dir, "openclaw-patch.json"), data, 0o644)
}
