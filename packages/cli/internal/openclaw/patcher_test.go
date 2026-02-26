package openclaw

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
)

func TestGeneratePatch_BasicHierarchy(t *testing.T) {
	agents := []AgentConfig{
		{Name: "Oscar", Role: "executive", Level: 10, Domain: "Operations", ReportsTo: ""},
		{Name: "Radar", Role: "lead", Level: 7, Domain: "Research", ReportsTo: "Oscar"},
		{Name: "Forge", Role: "lead", Level: 7, Domain: "Engineering", ReportsTo: "Oscar"},
		{Name: "Ink", Role: "worker", Level: 4, Domain: "Writing", ReportsTo: "Radar"},
	}

	patch := GeneratePatch(agents, "/tmp/workspaces")

	if len(patch.Agents.List) != 4 {
		t.Fatalf("expected 4 agents, got %d", len(patch.Agents.List))
	}

	// Oscar should be default (highest level)
	oscar := patch.Agents.List[0]
	if oscar.ID != "oscar" {
		t.Errorf("expected id 'oscar', got %q", oscar.ID)
	}
	if !oscar.Default {
		t.Error("oscar should be default (highest level)")
	}
	if oscar.Model != "anthropic/claude-opus-4-6" {
		t.Errorf("oscar model: got %q", oscar.Model)
	}
	// Oscar L10 has direct reports (radar, forge)
	if oscar.Subagents == nil {
		t.Fatal("oscar should have subagents")
	}
	if len(oscar.Subagents.AllowAgents) != 2 {
		t.Errorf("oscar subagents: expected 2, got %d", len(oscar.Subagents.AllowAgents))
	}

	// Radar L7 has direct report (ink)
	radar := patch.Agents.List[1]
	if radar.Subagents == nil || len(radar.Subagents.AllowAgents) != 1 {
		t.Error("radar should have 1 subagent (ink)")
	}
	if radar.Default {
		t.Error("radar should not be default")
	}

	// Forge L7 has no direct reports
	forge := patch.Agents.List[2]
	if forge.Subagents != nil {
		t.Error("forge should have no subagents (no direct reports)")
	}

	// Ink L4 should use sonnet
	ink := patch.Agents.List[3]
	if ink.Model != "anthropic/claude-sonnet-4-5" {
		t.Errorf("ink model: got %q", ink.Model)
	}
	if ink.Subagents != nil {
		t.Error("ink should have no subagents")
	}

	// All should have tools.profile = "full"
	for _, a := range patch.Agents.List {
		if a.Tools.Profile != "full" {
			t.Errorf("agent %s tools.profile: got %q", a.ID, a.Tools.Profile)
		}
	}
}

func TestGeneratePatch_IDGeneration(t *testing.T) {
	agents := []AgentConfig{
		{Name: "Tech Lead", Role: "lead", Level: 9},
	}
	patch := GeneratePatch(agents, "/tmp/ws")
	if patch.Agents.List[0].ID != "tech-lead" {
		t.Errorf("expected 'tech-lead', got %q", patch.Agents.List[0].ID)
	}
}

func TestReadAgentConfigs(t *testing.T) {
	dir := t.TempDir()
	configs := []AgentConfig{
		{Name: "Alpha", Role: "executive", Level: 10},
		{Name: "Beta", Role: "worker", Level: 4},
	}
	data, _ := json.Marshal(configs)
	os.WriteFile(filepath.Join(dir, "openclaw-agents.json"), data, 0o644)

	result, err := ReadAgentConfigs(dir)
	if err != nil {
		t.Fatal(err)
	}
	if len(result) != 2 {
		t.Fatalf("expected 2 agents, got %d", len(result))
	}
	if result[0].Name != "Alpha" {
		t.Errorf("expected Alpha, got %s", result[0].Name)
	}
}

func TestWritePatch(t *testing.T) {
	dir := t.TempDir()
	patch := Patch{
		Agents: PatchAgentsList{
			List: []PatchAgent{
				{ID: "test", Workspace: "/tmp/ws/test", Model: "anthropic/claude-sonnet-4-5", Tools: PatchTools{Profile: "full"}},
			},
		},
	}
	if err := WritePatch(patch, dir); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(filepath.Join(dir, "openclaw-patch.json"))
	if err != nil {
		t.Fatal(err)
	}
	var loaded Patch
	if err := json.Unmarshal(data, &loaded); err != nil {
		t.Fatal(err)
	}
	if len(loaded.Agents.List) != 1 || loaded.Agents.List[0].ID != "test" {
		t.Error("round-trip failed")
	}
}
