package database

import (
	"encoding/json"

	"github.com/google/uuid"
)

type Plugin struct {
	ID           string          `json:"id"`
	Name         string          `json:"name"`
	Description  string          `json:"description"`
	Author       string          `json:"author"`
	Version      string          `json:"version"`
	GithubURL    string          `json:"github_url"`
	CommitHash   string          `json:"commit_hash"`
	Script       string          `json:"script,omitempty"`
	ConfigSchema json.RawMessage `json:"config_schema"`
	Status       string          `json:"status"`
	SubmittedBy  string          `json:"submitted_by"`
	ReviewedBy   string          `json:"reviewed_by,omitempty"`
	InstallCount int             `json:"install_count"`
	CreatedAt    int64           `json:"created_at"`
	UpdatedAt    int64           `json:"updated_at"`
}

// ConfigField describes a configurable parameter for a plugin.
type ConfigField struct {
	Name        string `json:"name"`
	Type        string `json:"type"`        // "string", "string?"(optional), "number", "bool"
	Description string `json:"description"`
}

const pluginSelectCols = `id, name, description, author, version, github_url, commit_hash,
	script, config_schema, status, submitted_by, reviewed_by, install_count,
	EXTRACT(EPOCH FROM created_at)::BIGINT, EXTRACT(EPOCH FROM updated_at)::BIGINT`

func scanPlugin(scanner interface{ Scan(...any) error }) (*Plugin, error) {
	p := &Plugin{}
	err := scanner.Scan(&p.ID, &p.Name, &p.Description, &p.Author, &p.Version,
		&p.GithubURL, &p.CommitHash, &p.Script, &p.ConfigSchema,
		&p.Status, &p.SubmittedBy, &p.ReviewedBy, &p.InstallCount,
		&p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return p, nil
}

func (db *DB) CreatePlugin(p *Plugin) (*Plugin, error) {
	p.ID = uuid.New().String()
	_, err := db.Exec(`INSERT INTO plugins (id, name, description, author, version, github_url, commit_hash, script, config_schema, status, submitted_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', $10)`,
		p.ID, p.Name, p.Description, p.Author, p.Version, p.GithubURL, p.CommitHash, p.Script, p.ConfigSchema, p.SubmittedBy)
	if err != nil {
		return nil, err
	}
	p.Status = "pending"
	return p, nil
}

func (db *DB) GetPlugin(id string) (*Plugin, error) {
	return scanPlugin(db.QueryRow("SELECT "+pluginSelectCols+" FROM plugins WHERE id = $1", id))
}

func (db *DB) ListPlugins(status string) ([]Plugin, error) {
	query := "SELECT " + pluginSelectCols + " FROM plugins"
	var args []any
	if status != "" {
		query += " WHERE status = $1"
		args = append(args, status)
	}
	query += " ORDER BY install_count DESC, created_at DESC"
	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var plugins []Plugin
	for rows.Next() {
		p, err := scanPlugin(rows)
		if err != nil {
			return nil, err
		}
		plugins = append(plugins, *p)
	}
	return plugins, rows.Err()
}

func (db *DB) UpdatePluginStatus(id, status, reviewedBy string) error {
	_, err := db.Exec("UPDATE plugins SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3",
		status, reviewedBy, id)
	return err
}

func (db *DB) IncrPluginInstallCount(id string) error {
	_, err := db.Exec("UPDATE plugins SET install_count = install_count + 1 WHERE id = $1", id)
	return err
}

func (db *DB) DeletePlugin(id string) error {
	_, err := db.Exec("DELETE FROM plugins WHERE id = $1", id)
	return err
}
