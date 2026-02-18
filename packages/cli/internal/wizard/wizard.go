package wizard

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// Answers holds the wizard results.
type Answers struct {
	TeamName     string
	TemplateName string
}

type step int

const (
	stepTemplate step = iota
	stepTeamName
	stepConfirm
	stepDone
)

type templateChoice struct {
	name        string
	label       string
	description string
}

// Model is the bubbletea model for the init wizard.
type Model struct {
	step       step
	templates  []templateChoice
	cursor     int
	teamInput  textinput.Model
	answers    Answers
	cancelled  bool
	width      int
}

// TemplateInfo is the minimal info the wizard needs about each template.
type TemplateInfo struct {
	Name        string
	Label       string
	Description string
}

// New creates a new wizard model.
func New(templates []TemplateInfo) Model {
	ti := textinput.New()
	ti.Placeholder = "My Agent Team"
	ti.CharLimit = 60
	ti.Width = 40

	var choices []templateChoice
	for _, t := range templates {
		choices = append(choices, templateChoice{
			name:        t.Name,
			label:       t.Label,
			description: t.Description,
		})
	}

	return Model{
		step:      stepTemplate,
		templates: choices,
		teamInput: ti,
	}
}

// Cancelled returns true if the user cancelled the wizard.
func (m Model) Cancelled() bool {
	return m.cancelled
}

// Answers returns the collected answers.
func (m Model) Answers() Answers {
	return m.answers
}

// Styles
var (
	titleStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#00d4aa")).
			MarginBottom(1)

	subtitleStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#888888")).
			MarginBottom(1)

	selectedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#00d4aa")).
			Bold(true)

	unselectedStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#cccccc"))

	descStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#666666")).
			PaddingLeft(4)

	promptStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#00d4aa")).
			Bold(true)

	dimStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#555555"))
)

func (m Model) Init() tea.Cmd {
	return nil
}

func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.width = msg.Width
		return m, nil

	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			if m.step != stepTeamName { // don't quit on 'q' while typing
				m.cancelled = true
				return m, tea.Quit
			}
		case "esc":
			m.cancelled = true
			return m, tea.Quit
		}

		switch m.step {
		case stepTemplate:
			return m.updateTemplate(msg)
		case stepTeamName:
			return m.updateTeamName(msg)
		case stepConfirm:
			return m.updateConfirm(msg)
		}
	}

	return m, nil
}

func (m Model) updateTemplate(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "up", "k":
		if m.cursor > 0 {
			m.cursor--
		}
	case "down", "j":
		if m.cursor < len(m.templates)-1 {
			m.cursor++
		}
	case "enter":
		m.answers.TemplateName = m.templates[m.cursor].name
		m.step = stepTeamName
		m.teamInput.Focus()
		return m, m.teamInput.Cursor.BlinkCmd()
	}
	return m, nil
}

func (m Model) updateTeamName(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "enter":
		name := strings.TrimSpace(m.teamInput.Value())
		if name == "" {
			name = "My Agent Team"
		}
		m.answers.TeamName = name
		m.step = stepConfirm
		return m, nil
	case "esc":
		m.step = stepTemplate
		return m, nil
	default:
		var cmd tea.Cmd
		m.teamInput, cmd = m.teamInput.Update(msg)
		return m, cmd
	}
}

func (m Model) updateConfirm(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "enter", "y":
		m.step = stepDone
		return m, tea.Quit
	case "n", "backspace":
		m.step = stepTemplate
		m.cursor = 0
		return m, nil
	}
	return m, nil
}

func (m Model) View() string {
	var b strings.Builder

	b.WriteString("\n")
	b.WriteString(titleStyle.Render("🪸 OpenSpawn — Create Your Agent Organization"))
	b.WriteString("\n\n")

	switch m.step {
	case stepTemplate:
		b.WriteString(promptStyle.Render("Choose a template:"))
		b.WriteString("\n\n")

		for i, t := range m.templates {
			cursor := "  "
			style := unselectedStyle
			if i == m.cursor {
				cursor = "▸ "
				style = selectedStyle
			}
			b.WriteString(fmt.Sprintf("%s%s\n", cursor, style.Render(t.label)))
			if i == m.cursor {
				b.WriteString(descStyle.Render(t.description))
				b.WriteString("\n")
			}
			b.WriteString("\n")
		}

		b.WriteString(dimStyle.Render("↑/↓ to navigate • enter to select • esc to cancel"))

	case stepTeamName:
		b.WriteString(promptStyle.Render("What's your team name?"))
		b.WriteString("\n\n")
		b.WriteString(m.teamInput.View())
		b.WriteString("\n\n")
		b.WriteString(dimStyle.Render("enter to confirm • esc to go back"))

	case stepConfirm:
		b.WriteString(promptStyle.Render("Ready to create:"))
		b.WriteString("\n\n")
		b.WriteString(fmt.Sprintf("  Team:      %s\n", selectedStyle.Render(m.answers.TeamName)))

		// Find template label
		tmplLabel := m.answers.TemplateName
		for _, t := range m.templates {
			if t.name == m.answers.TemplateName {
				tmplLabel = t.label
				break
			}
		}
		b.WriteString(fmt.Sprintf("  Template:  %s\n", selectedStyle.Render(tmplLabel)))
		b.WriteString("\n")
		b.WriteString(dimStyle.Render("enter/y to confirm • n to start over • esc to cancel"))

	case stepDone:
		b.WriteString(selectedStyle.Render("✓ Creating your organization..."))
		b.WriteString("\n")
	}

	b.WriteString("\n")
	return b.String()
}
