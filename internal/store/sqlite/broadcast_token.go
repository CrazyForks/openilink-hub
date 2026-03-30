package sqlite

import (
	"database/sql"
	"encoding/json"

	"github.com/google/uuid"
	"github.com/openilink/openilink-hub/internal/store"
)

func scanBroadcastToken(row interface{ Scan(...any) error }) (*store.BroadcastToken, error) {
	t := &store.BroadcastToken{}
	err := row.Scan(&t.ID, &t.UserID, &t.Name, &t.Token, &t.BotIDs, &t.CreatedAt)
	if err != nil {
		return nil, err
	}
	return t, nil
}

func (db *DB) CreateBroadcastToken(userID, name string, botIDs json.RawMessage) (*store.BroadcastToken, error) {
	id := uuid.New().String()
	token := "bc_" + generateToken(16)
	if botIDs == nil {
		botIDs = json.RawMessage("[]")
	}
	_, err := db.Exec(`INSERT INTO broadcast_tokens (id, user_id, name, token, bot_ids) VALUES (?,?,?,?,?)`,
		id, userID, name, token, string(botIDs))
	if err != nil {
		return nil, err
	}
	return db.GetBroadcastToken(id)
}

func (db *DB) GetBroadcastToken(id string) (*store.BroadcastToken, error) {
	return scanBroadcastToken(db.QueryRow(`SELECT id, user_id, name, token, bot_ids, created_at FROM broadcast_tokens WHERE id = ?`, id))
}

func (db *DB) GetBroadcastTokenByToken(token string) (*store.BroadcastToken, error) {
	return scanBroadcastToken(db.QueryRow(`SELECT id, user_id, name, token, bot_ids, created_at FROM broadcast_tokens WHERE token = ?`, token))
}

func (db *DB) ListBroadcastTokensByUser(userID string) ([]store.BroadcastToken, error) {
	rows, err := db.Query(`SELECT id, user_id, name, token, bot_ids, created_at FROM broadcast_tokens WHERE user_id = ? ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tokens []store.BroadcastToken
	for rows.Next() {
		var t store.BroadcastToken
		if err := rows.Scan(&t.ID, &t.UserID, &t.Name, &t.Token, &t.BotIDs, &t.CreatedAt); err != nil {
			return nil, err
		}
		tokens = append(tokens, t)
	}
	return tokens, rows.Err()
}

func (db *DB) UpdateBroadcastToken(id, name string, botIDs json.RawMessage) error {
	_, err := db.Exec(`UPDATE broadcast_tokens SET name=?, bot_ids=? WHERE id=?`, name, string(botIDs), id)
	return err
}

func (db *DB) DeleteBroadcastToken(id string) error {
	_, err := db.Exec(`DELETE FROM broadcast_tokens WHERE id = ?`, id)
	return err
}

func (db *DB) RegenerateBroadcastToken(id string) (string, error) {
	token := "bc_" + generateToken(16)
	_, err := db.Exec(`UPDATE broadcast_tokens SET token=? WHERE id=?`, token, id)
	return token, err
}

// Ensure the scanner interface is satisfied by *sql.Row.
var _ interface{ Scan(...any) error } = (*sql.Row)(nil)
