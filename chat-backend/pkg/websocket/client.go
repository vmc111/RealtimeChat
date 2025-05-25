package websocket

import (
	"log"
	"time"

	"github.com/gorilla/websocket"
)

var (
	// MaxMessageSize defines the maximum message size allowed from peer
	MaxMessageSize int64 = 1024

	// PongWait is the time allowed to read the next pong message from the peer
	PongWait = 60 * time.Second

	// PingPeriod is the interval to send pings to peer
	PingPeriod = (PongWait * 9) / 10

	// WriteWait is the time allowed to write a message to the peer
	WriteWait = 10 * time.Second
)

// Client represents a WebSocket connection from a client
type Client struct {
	hub    *Hub
	conn   *websocket.Conn
	send   chan []byte
	userID string // User ID from Firebase Auth
}

// NewClient creates a new WebSocket client
func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:    hub,
		conn:   conn,
		send:   make(chan []byte, 256),
		userID: userID,
	}
}

// ReadPump pumps messages from the websocket connection to the hub
func (c *Client) ReadPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()

	c.conn.SetReadLimit(MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(PongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(PongWait))
		return nil
	})

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}

		// Broadcast the message to all clients
		c.hub.broadcast <- message
	}
}

// WritePump pumps messages from the hub to the websocket connection
func (c *Client) WritePump() {
	ticker := time.NewTicker(PingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(WriteWait))
			if !ok {
				// The hub closed the channel
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}

			w.Write(message)

			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write(<-c.send)
			}

			if err := w.Close(); err != nil {
				return
			}

		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(WriteWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

// Close closes the client's WebSocket connection
func (c *Client) Close() {
	c.conn.Close()
}
