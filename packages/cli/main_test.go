package main

import (
	"testing"

	"github.com/openspawn/openspawn/cli/internal/orgparser"
	"github.com/openspawn/openspawn/cli/internal/templates"
)

func TestTemplatesAvailable(t *testing.T) {
	tmps := templates.Available()
	if len(tmps) < 4 {
		t.Errorf("expected at least 4 templates, got %d", len(tmps))
	}

	names := map[string]bool{}
	for _, tmpl := range tmps {
		if tmpl.Name == "" {
			t.Error("template has empty name")
		}
		if names[tmpl.Name] {
			t.Errorf("duplicate template name: %s", tmpl.Name)
		}
		names[tmpl.Name] = true
	}
}

func TestTemplateGet(t *testing.T) {
	tmpl, ok := templates.Get("assistant-team")
	if !ok {
		t.Fatal("assistant-team template not found")
	}
	if tmpl.Label == "" {
		t.Error("template label is empty")
	}
}

func TestTemplateRender(t *testing.T) {
	tmpl, _ := templates.Get("assistant-team")
	rendered := templates.Render(tmpl, "Test Org")
	if rendered[:11] != "# Test Org\n" {
		t.Errorf("expected rendered to start with '# Test Org', got: %s", rendered[:30])
	}
}

func TestParseAssistantTeam(t *testing.T) {
	tmpl, _ := templates.Get("assistant-team")
	content := templates.Render(tmpl, "Test Agency")
	org, errors := orgparser.Parse([]byte(content))

	if len(errors) > 0 {
		t.Errorf("unexpected parse errors: %v", errors)
	}

	if org.Name != "Test Agency" {
		t.Errorf("expected org name 'Test Agency', got '%s'", org.Name)
	}

	if len(org.Agents) == 0 {
		t.Error("expected agents to be parsed")
	}

	// Check we got Oscar
	found := false
	for _, a := range org.Agents {
		if a.Name == "Oscar" {
			found = true
			if a.Level != 10 {
				t.Errorf("expected Oscar at L10, got L%d", a.Level)
			}
		}
	}
	if !found {
		t.Error("Oscar not found in parsed agents")
	}
}

func TestParseDevShop(t *testing.T) {
	tmpl, _ := templates.Get("dev-shop")
	content := templates.Render(tmpl, "Test Dev")
	org, errors := orgparser.Parse([]byte(content))

	if len(errors) > 0 {
		t.Errorf("unexpected parse errors: %v", errors)
	}

	if len(org.Agents) < 3 {
		t.Errorf("expected at least 3 agents in dev-shop, got %d", len(org.Agents))
	}
}
