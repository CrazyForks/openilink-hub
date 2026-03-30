-- +goose Up
CREATE TABLE IF NOT EXISTS broadcast_tokens (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL DEFAULT '',
    token      TEXT NOT NULL,
    bot_ids    TEXT NOT NULL DEFAULT '[]',
    created_at BIGINT NOT NULL DEFAULT extract(epoch FROM now())::bigint
);
CREATE INDEX IF NOT EXISTS idx_broadcast_tokens_user ON broadcast_tokens(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_broadcast_tokens_token ON broadcast_tokens(token);
