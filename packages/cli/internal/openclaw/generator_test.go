package openclaw

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

const testOrgMD = `# Test Corp

## Culture

**Preset:** startup

## Structure

### CEO — Chief Executive Officer

- **Level:** 10
- **Domain:** Leadership

### Engineering

#### Lead Engineer — Engineering Lead

- **Level:** 7
- **Domain:** Engineering
- **Reports to:** CEO

#### Developer — Software Developer

- **Level:** 4
- **Domain:** Engineering
- **Reports to:** Lead Engineer
`

func TestGenerate(t *testing.T) {
	dir := t.TempDir()

	err := Generate(dir, []byte(testOrgMD))
	if err != nil {
		t.Fatalf("Generate failed: %v", err)
	}

	// Check openclaw-agents.json exists and parses
	data, err := os.ReadFile(filepath.Join(dir, "openclaw-agents.json"))
	if err != nil {
		t.Fatalf("failed to read openclaw-agents.json: %v", err)
	}

	var configs []AgentConfig
	if err := json.Unmarshal(data, &configs); err != nil {
		t.Fatalf("failed to parse openclaw-agents.json: %v", err)
	}

	if len(configs) != 3 {
		t.Fatalf("expected 3 agents, got %d", len(configs))
	}

	// Check CEO gets opus model (level 10)
	ceo := configs[0]
	if ceo.Name != "CEO" {
		t.Errorf("expected CEO, got %s", ceo.Name)
	}
	if ceo.Model != "anthropic/claude-opus-4-6" {
		t.Errorf("expected opus model for CEO (level 10), got %s", ceo.Model)
	}

	// Check Developer gets sonnet model (level 4)
	dev := configs[2]
	if dev.Name != "Developer" {
		t.Errorf("expected Developer, got %s", dev.Name)
	}
	if dev.Model != "anthropic/claude-sonnet-4-5" {
		t.Errorf("expected sonnet model for Developer (level 4), got %s", dev.Model)
	}

	// Check workspace dirs exist with expected files
	for _, c := range configs {
		wsDir := filepath.Join(dir, c.Workspace)
		for _, f := range []string{"SOUL.md", "AGENTS.md"} {
			if _, err := os.Stat(filepath.Join(wsDir, f)); err != nil {
				t.Errorf("missing %s in workspace for %s", f, c.Name)
			}
		}
		if _, err := os.Stat(filepath.Join(wsDir, "memory")); err != nil {
			t.Errorf("missing memory/ dir in workspace for %s", c.Name)
		}
	}
}

func TestGenerateNoAgents(t *testing.T) {
	dir := t.TempDir()
	err := Generate(dir, []byte("# Empty Org\n\nNo structure here.\n"))
	if err == nil {
		t.Fatal("expected error for org with no agents")
	}
}
