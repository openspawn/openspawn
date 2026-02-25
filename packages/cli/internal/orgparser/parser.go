package orgparser

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// ParsedOrg represents a fully parsed ORG.md file.
type ParsedOrg struct {
	Name     string
	Agents   []Agent
	Culture  Culture
	Policies Policies
}

// Agent represents a single agent parsed from the Structure section.
type Agent struct {
	ID        string
	Name      string
	Role      string
	Level     int
	Domain    string
	Avatar    string
	ParentID  string
	ReportsTo string
	Count     int
}

// Culture represents parsed culture configuration.
type Culture struct {
	Preset          string
	Escalation      string
	ProgressUpdates string
	AckRequired     bool
	HierarchyDepth  int
}

// Policies represents parsed policy configuration.
type Policies struct {
	PerAgentBudget int
	AlertThreshold int
	DepartmentCaps map[string]int
}

var metaRegex = regexp.MustCompile(`^\*\*(.+?):\*\*\s*(.+)$`)
var dashNameRegex = regexp.MustCompile(`^(.+?)\s*—\s*(.+)$`)
var headingRegex = regexp.MustCompile(`^(#{1,6})\s+(.+)$`)

// section represents a heading and its content (text between this heading and the next).
type section struct {
	heading  string
	level    int
	content  string // raw text between this heading and the next
	children []section
}

// parseMarkdownSections splits markdown into a tree of sections by heading level.
func parseMarkdownSections(source string) []section {
	lines := strings.Split(source, "\n")

	// First pass: identify all headings and their line positions
	type headingInfo struct {
		level   int
		heading string
		lineIdx int
	}
	var headings []headingInfo
	inCodeBlock := false

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "```") {
			inCodeBlock = !inCodeBlock
			continue
		}
		if inCodeBlock {
			continue
		}
		if m := headingRegex.FindStringSubmatch(trimmed); len(m) == 3 {
			headings = append(headings, headingInfo{
				level:   len(m[1]),
				heading: m[2],
				lineIdx: i,
			})
		}
	}

	if len(headings) == 0 {
		return nil
	}

	// Build flat sections with content
	var flat []section
	for i, h := range headings {
		startLine := h.lineIdx + 1
		endLine := len(lines)
		if i+1 < len(headings) {
			endLine = headings[i+1].lineIdx
		}
		content := strings.Join(lines[startLine:endLine], "\n")
		flat = append(flat, section{
			heading: h.heading,
			level:   h.level,
			content: content,
		})
	}

	// Build tree: nest children under parents
	return buildTree(flat)
}

// buildTree converts a flat list of sections into a nested tree.
func buildTree(flat []section) []section {
	var roots []section
	// Stack-based tree builder
	type stackEntry struct {
		sec   *section
		level int
	}
	var stack []stackEntry

	for i := range flat {
		s := &flat[i]

		// Pop stack until we find a parent with lower level
		for len(stack) > 0 && stack[len(stack)-1].level >= s.level {
			stack = stack[:len(stack)-1]
		}

		if len(stack) == 0 {
			roots = append(roots, *s)
			stack = append(stack, stackEntry{sec: &roots[len(roots)-1], level: s.level})
		} else {
			parent := stack[len(stack)-1].sec
			parent.children = append(parent.children, *s)
			stack = append(stack, stackEntry{sec: &parent.children[len(parent.children)-1], level: s.level})
		}
	}

	return roots
}

// Parse parses an ORG.md file and returns the org structure plus any validation errors.
func Parse(source []byte) (ParsedOrg, []string) {
	org := ParsedOrg{
		Policies: Policies{
			DepartmentCaps: make(map[string]int),
		},
	}
	var errors []string

	sections := parseMarkdownSections(string(source))

	// Find H1 (org name)
	for _, s := range sections {
		if s.level == 1 {
			org.Name = s.heading
			// Look at H2 children
			for _, h2 := range s.children {
				lower := strings.ToLower(h2.heading)
				switch {
				case strings.Contains(lower, "culture"):
					org.Culture = parseCulture(h2)
				case strings.Contains(lower, "structure"):
					agents, errs := parseStructure(h2)
					org.Agents = agents
					errors = append(errors, errs...)
				case strings.Contains(lower, "policies") || strings.Contains(lower, "policy"):
					org.Policies = parsePolicies(h2)
				}
			}
			break
		}
	}

	// Fallback: if no H1, try H2 sections at root
	if org.Name == "" {
		for _, s := range sections {
			if s.level == 2 {
				lower := strings.ToLower(s.heading)
				switch {
				case strings.Contains(lower, "culture"):
					org.Culture = parseCulture(s)
				case strings.Contains(lower, "structure"):
					agents, errs := parseStructure(s)
					org.Agents = agents
					errors = append(errors, errs...)
				}
			}
		}
	}

	if len(org.Agents) == 0 {
		errors = append(errors, "No agents found in Structure section")
	}

	return org, errors
}

func parseCulture(sec section) Culture {
	c := Culture{}
	meta := extractMeta(sec.content)
	c.Preset = meta["preset"]
	c.Escalation = meta["escalation"]
	c.ProgressUpdates = meta["progress updates"]
	if v, ok := meta["ack required"]; ok {
		c.AckRequired = strings.ToLower(v) == "yes"
	}
	if v, ok := meta["hierarchy depth"]; ok {
		if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
			c.HierarchyDepth = n
		}
	}
	// Check for bare "preset: xxx"
	if c.Preset == "" {
		for _, line := range strings.Split(sec.content, "\n") {
			line = strings.TrimSpace(line)
			if strings.HasPrefix(strings.ToLower(line), "preset:") {
				c.Preset = strings.TrimSpace(strings.SplitN(line, ":", 2)[1])
			}
		}
	}
	return c
}

func parseStructure(sec section) ([]Agent, []string) {
	var agents []Agent
	var errors []string

	for _, dept := range sec.children {
		if dept.level != 3 {
			continue
		}

		meta := extractMeta(dept.content)
		name := nameFromHeading(dept.heading)
		level := inferLevel(dept.heading, meta)
		domain := meta["domain"]
		if domain == "" {
			domain = name
		}
		avatar := meta["avatar"]
		reportsTo := meta["reports to"]
		isCLevel := level >= 10

		if isCLevel || len(dept.children) == 0 {
			// Direct agent at H3 level (C-level or standalone)
			count := 1
			if c, ok := meta["count"]; ok {
				if n, err := strconv.Atoi(strings.TrimSpace(c)); err == nil {
					count = n
				}
			}
			for i := 0; i < count; i++ {
				agentName := name
				if count > 1 {
					agentName = fmt.Sprintf("%s %d", name, i+1)
				}
				agents = append(agents, Agent{
					ID:        makeID(agentName),
					Name:      agentName,
					Role:      inferRole(dept.heading),
					Level:     level,
					Domain:    domain,
					Avatar:    avatar,
					ReportsTo: reportsTo,
					Count:     1,
				})
			}
			continue
		}

		// Department with sub-roles (H4 children)
		var deptLeadID string
		for ri, sub := range dept.children {
			if sub.level != 4 {
				continue
			}
			subMeta := extractMeta(sub.content)
			subName := nameFromHeading(sub.heading)
			subLevel := inferLevel(sub.heading, subMeta)
			subDomain := subMeta["domain"]
			if subDomain == "" {
				subDomain = domain
			}
			subAvatar := subMeta["avatar"]
			subReportsTo := subMeta["reports to"]

			parentID := ""
			if subReportsTo != "" {
				parentID = makeID(subReportsTo)
			} else if ri == 0 {
				// First in department — department lead
				parentID = ""
			} else {
				parentID = deptLeadID
			}

			count := 1
			if c, ok := subMeta["count"]; ok {
				if n, err := strconv.Atoi(strings.TrimSpace(c)); err == nil {
					count = n
				}
			}

			for i := 0; i < count; i++ {
				agentName := subName
				if count > 1 {
					agentName = fmt.Sprintf("%s %d", subName, i+1)
				}
				id := makeID(agentName)
				if ri == 0 && i == 0 {
					deptLeadID = id
				}
				agents = append(agents, Agent{
					ID:        id,
					Name:      agentName,
					Role:      inferRole(sub.heading),
					Level:     subLevel,
					Domain:    subDomain,
					Avatar:    subAvatar,
					ParentID:  parentID,
					ReportsTo: subReportsTo,
					Count:     1,
				})
			}
		}
	}

	return agents, errors
}

func parsePolicies(sec section) Policies {
	p := Policies{
		DepartmentCaps: make(map[string]int),
	}
	// Combine content from section and all children
	allContent := sec.content
	for _, child := range sec.children {
		allContent += "\n" + child.content
	}
	meta := extractMeta(allContent)
	if v, ok := meta["per-agent limit"]; ok {
		re := regexp.MustCompile(`\d+`)
		if m := re.FindString(v); m != "" {
			p.PerAgentBudget, _ = strconv.Atoi(m)
		}
	}
	if v, ok := meta["alert threshold"]; ok {
		re := regexp.MustCompile(`\d+`)
		if m := re.FindString(v); m != "" {
			p.AlertThreshold, _ = strconv.Atoi(m)
		}
	}
	return p
}

func extractMeta(content string) map[string]string {
	meta := make(map[string]string)
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		line = strings.TrimPrefix(line, "- ")
		if m := metaRegex.FindStringSubmatch(line); len(m) == 3 {
			key := strings.ToLower(strings.TrimSpace(m[1]))
			val := strings.TrimSpace(m[2])
			meta[key] = val
		}
	}
	return meta
}

func nameFromHeading(heading string) string {
	if m := dashNameRegex.FindStringSubmatch(heading); len(m) == 3 {
		return strings.TrimSpace(m[1])
	}
	return strings.TrimSpace(heading)
}

func makeID(name string) string {
	re := regexp.MustCompile(`[^a-z0-9]+`)
	return strings.Trim(re.ReplaceAllString(strings.ToLower(name), "-"), "-")
}

func inferLevel(heading string, meta map[string]string) int {
	if v, ok := meta["level"]; ok {
		if n, err := strconv.Atoi(strings.TrimSpace(v)); err == nil {
			return n
		}
	}
	lower := strings.ToLower(heading)
	switch {
	case regexp.MustCompile(`\b(coo|cto|ceo|owner|chief)\b`).MatchString(lower):
		return 10
	case regexp.MustCompile(`\b(vp|director|head)\b`).MatchString(lower):
		return 9
	case regexp.MustCompile(`\b(lead|manager|architect|strategist)\b`).MatchString(lower):
		return 7
	case regexp.MustCompile(`\b(senior|principal)\b`).MatchString(lower):
		return 6
	case regexp.MustCompile(`\b(junior|intern|assistant)\b`).MatchString(lower):
		return 1
	}
	return 4
}

func inferRole(heading string) string {
	lower := strings.ToLower(heading)
	switch {
	case regexp.MustCompile(`\b(coo|cto|ceo|owner|chief)\b`).MatchString(lower):
		return "executive"
	case regexp.MustCompile(`\b(vp|director|head)\b`).MatchString(lower):
		return "director"
	case regexp.MustCompile(`\b(lead|manager)\b`).MatchString(lower):
		return "lead"
	case regexp.MustCompile(`\b(senior|principal)\b`).MatchString(lower):
		return "senior"
	case regexp.MustCompile(`\b(junior|intern|assistant)\b`).MatchString(lower):
		return "intern"
	}
	return "worker"
}
