package store

import "encoding/json"

type BroadcastToken struct {
	ID        string          `json:"id"`
	UserID    string          `json:"user_id"`
	Name      string          `json:"name"`
	Token     string          `json:"token"`
	BotIDs    json.RawMessage `json:"bot_ids"`
	CreatedAt int64           `json:"created_at"`
}

type BroadcastTokenStore interface {
	CreateBroadcastToken(userID, name string, botIDs json.RawMessage) (*BroadcastToken, error)
	GetBroadcastToken(id string) (*BroadcastToken, error)
	GetBroadcastTokenByToken(token string) (*BroadcastToken, error)
	ListBroadcastTokensByUser(userID string) ([]BroadcastToken, error)
	UpdateBroadcastToken(id, name string, botIDs json.RawMessage) error
	DeleteBroadcastToken(id string) error
	RegenerateBroadcastToken(id string) (string, error)
}
