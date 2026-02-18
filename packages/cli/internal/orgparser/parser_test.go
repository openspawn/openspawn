package orgparser

import (
	"testing"
)

const testOrg = `# Test Org

## Identity

We build things.

## Structure

### Boss — CEO
Runs everything.

- **Level:** 10
- **Avatar:** 👑
- **Domain:** Operations

### Engineering

#### Lead — Engineering Lead
Leads the team.

- **Level:** 7
- **Avatar:** 💻
- **Domain:** Engineering
- **Reports to:** Boss

#### Worker — Developer
Does the work.

- **Level:** 4
- **Avatar:** ⚙️
- **Domain:** Backend
- **Reports to:** Lead
`

func TestParseBasic(t *testing.T) {
	org, errors := Parse([]byte(testOrg))

	if len(errors) > 0 {
		t.Errorf("unexpected errors: %v", errors)
	}

	if org.Name != "Test Org" {
		t.Errorf("expected name 'Test Org', got '%s'", org.Name)
	}

	t.Logf("Parsed %d agents:", len(org.Agents))
	for _, a := range org.Agents {
		t.Logf("  %s (L%d, %s, parent=%s)", a.Name, a.Level, a.Domain, a.ParentID)
	}

	if len(org.Agents) != 3 {
		t.Errorf("expected 3 agents, got %d", len(org.Agents))
	}
}
