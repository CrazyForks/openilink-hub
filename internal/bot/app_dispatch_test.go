package bot

import (
	"testing"

	"github.com/openilink/openilink-hub/internal/relay"
)

func TestResolveMediaURLs(t *testing.T) {
	baseURL := "https://hub.example.com"
	botDBID := "bot-123"

	items := []relay.MessageItem{
		{Type: "text", Text: "hello"},
		{
			Type:     "file",
			FileName: "doc.pdf",
			Media: &relay.Media{
				URL:       "https://wechat-cdn.example.com/encrypted-file",
				EQP:       "eqp-file-param",
				AESKey:    "abc123",
				FileSize:  1024,
				MediaType: "file",
			},
		},
		{
			Type: "image",
			Media: &relay.Media{
				URL:       "https://wechat-cdn.example.com/encrypted-image",
				EQP:       "eqp-image-param",
				AESKey:    "def456",
				MediaType: "image",
			},
		},
	}

	result := resolveMediaURLs(items, baseURL, botDBID)

	if result[0].Media != nil {
		t.Error("text item should have no media")
	}

	want := "https://hub.example.com/api/v1/channels/media?bot=bot-123&eqp=eqp-file-param&aes=abc123&ct=application%2Foctet-stream"
	if result[1].Media.URL != want {
		t.Errorf("file URL = %q, want %q", result[1].Media.URL, want)
	}
	if result[1].Media.FileSize != 1024 {
		t.Error("file size should be preserved")
	}

	wantImg := "https://hub.example.com/api/v1/channels/media?bot=bot-123&eqp=eqp-image-param&aes=def456&ct=image%2Fjpeg"
	if result[2].Media.URL != wantImg {
		t.Errorf("image URL = %q, want %q", result[2].Media.URL, wantImg)
	}

	// Original not mutated
	if items[1].Media.URL != "https://wechat-cdn.example.com/encrypted-file" {
		t.Error("original items should not be mutated")
	}
}

func TestResolveMediaURLs_NoMedia(t *testing.T) {
	items := []relay.MessageItem{
		{Type: "text", Text: "hello"},
	}
	result := resolveMediaURLs(items, "https://hub.example.com", "bot-123")
	if len(result) != 1 || result[0].Text != "hello" {
		t.Error("text-only items should pass through unchanged")
	}
}

func TestResolveMediaURLs_AlreadyStorageURL(t *testing.T) {
	items := []relay.MessageItem{
		{
			Type: "image",
			Media: &relay.Media{
				URL:       "https://storage.example.com/bot-123/img.jpg",
				EQP:       "",
				AESKey:    "",
				MediaType: "image",
			},
		},
	}
	result := resolveMediaURLs(items, "https://hub.example.com", "bot-123")
	if result[0].Media.URL != "https://storage.example.com/bot-123/img.jpg" {
		t.Error("items without EQP should keep original URL")
	}
}
