package websocket

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v4"
	"github.com/gorilla/websocket"
)

var (
	// MaxMessageSize defines the maximum message size allowed from peer
	MaxMessageSize int64 = 1024 * 1024 // 1MB

	// PongWait is the time allowed to read the next pong message from the peer
	PongWait = 60 * time.Second

	// PingPeriod is the interval to send pings to peer
	PingPeriod = (PongWait * 9) / 10

	// WriteWait is the time allowed to write a message to the peer
	WriteWait = 10 * time.Second

	// MaxMessageQueueSize is the maximum number of messages that can be queued for a client
	MaxMessageQueueSize = 256
)

// MessageType represents the type of WebSocket message
type MessageType string

const (
	// MessageTypeJoin is sent when a client joins a room
	MessageTypeJoin MessageType = "JOIN"
	// MessageTypeLeave is sent when a client leaves a room
	MessageTypeLeave MessageType = "LEAVE"
	// MessageTypeMessage is a regular chat message
	MessageTypeMessage MessageType = "MESSAGE"
	// MessageTypeError is sent when an error occurs
	MessageTypeError MessageType = "ERROR"
	// MessageTypeAuthSuccess is sent when authentication is successful
	MessageTypeAuthSuccess MessageType = "AUTH_SUCCESS"
)

// IncomingMessage represents a message received from a client
type IncomingMessage struct {
	Type    string          `json:"type"`
	RoomID  RoomID          `json:"roomId,omitempty"`
	Token   string          `json:"token,omitempty"`
	Payload json.RawMessage `json:"payload,omitempty"`
}

// OutgoingMessage represents a message sent to a client
type OutgoingMessage struct {
	Type    MessageType `json:"type"`
	RoomID  RoomID      `json:"roomId,omitempty"`
	Payload interface{} `json:"payload,omitempty"`
}

// Client represents a WebSocket connection from a client
type Client struct {
	hub      *Hub
	conn     *websocket.Conn
	send     chan []byte
	userID   string // User ID from JWT token
	username string // Username for display
	rooms    map[RoomID]bool
	mu       sync.RWMutex
	done     chan struct{} // Channel to signal when the client is done
}

// NewClient creates a new WebSocket client
func NewClient(hub *Hub, conn *websocket.Conn, userID string) *Client {
	return &Client{
		hub:     hub,
		conn:    conn,
		send:    make(chan []byte, MaxMessageQueueSize),
		userID:  userID,
		rooms:   make(map[RoomID]bool),
		done:    make(chan struct{}),
	}
}

// readPump pumps messages from the websocket connection to the hub.
func (c *Client) readPump(h *WSHandler) {
	defer func() {
		log.Printf("Client %s disconnecting", c.userID)
		c.hub.unregister <- c
		c.conn.Close()
		close(c.done)
	}()

	c.conn.SetReadLimit(MaxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(PongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(PongWait))
		return nil
	})

	// Send initial welcome message
	if err := c.SendMessage(MessageTypeMessage, "", map[string]interface{}{
		"type":    "system",
		"message": "Connected to WebSocket server",
	}); err != nil {
		log.Printf("Error sending welcome message: %v", err)
		return
	}

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error from %s: %v", c.userID, err)
			}
			break
		}

		var msg IncomingMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshaling message from %s: %v", c.userID, err)
			c.SendMessage(MessageTypeError, "", map[string]interface{}{
				"message": "Invalid message format",
			})
			continue
		}

		log.Printf("Received message from %s: %+v", c.userID, msg)

		switch msg.Type {
		case "JOIN":
			// Handle room join
			if msg.RoomID == "" {
				c.SendMessage(MessageTypeError, "", map[string]interface{}{
					"message": "Room ID is required",
				})
				continue
			}

			// Check if user is already in the room
			c.mu.RLock()
			_, exists := c.rooms[msg.RoomID]
			c.mu.RUnlock()

			if !exists {
				// Add client to the room
				c.hub.JoinRoom(msg.RoomID, c)

				// Add room to client's room list
				c.mu.Lock()
				c.rooms[msg.RoomID] = true
				c.mu.Unlock()

				// Send confirmation
				c.SendMessage(MessageTypeJoin, msg.RoomID, map[string]interface{}{
					"message": "Successfully joined room",
					"roomId":  msg.RoomID,
				})

				// Notify room that user joined
				c.hub.Broadcast(msg.RoomID, []byte(c.userID+" joined the room"))
			}

		case "LEAVE":
			// Handle room leave
			if msg.RoomID == "" {
				c.SendMessage(MessageTypeError, "", map[string]interface{}{
					"message": "Room ID is required",
				})
				continue
			}

			// Check if user is in the room
			c.mu.RLock()
			_, exists := c.rooms[msg.RoomID]
			c.mu.RUnlock()

			if exists {
				// Remove client from the room
				c.hub.LeaveRoom(msg.RoomID, c)

				// Remove room from client's room list
				c.mu.Lock()
				delete(c.rooms, msg.RoomID)
				c.mu.Unlock()

				// Send confirmation
				c.SendMessage(MessageTypeLeave, msg.RoomID, map[string]interface{}{
					"message": "Successfully left room",
					"roomId":  msg.RoomID,
				})

				// Notify room that user left
				c.hub.Broadcast(msg.RoomID, []byte(c.userID+" left the room"))
			}

		case "MESSAGE":
			// Handle chat message
			if msg.RoomID == "" {
				c.SendMessage(MessageTypeError, "", map[string]interface{}{
					"message": "Room ID is required for messages",
				})
				continue
			}

			// Broadcast the message to the room
			c.hub.Broadcast(msg.RoomID, message)
		default:
			c.hub.Broadcast(msg.RoomID, message)
		}
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

			// Add queued chat messages to the current websocket message
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

// SendMessage sends a message to the client
func (c *Client) SendMessage(messageType MessageType, roomID RoomID, payload interface{}) error {
	msg := OutgoingMessage{
		Type:    messageType,
		RoomID:  RoomID(roomID),
		Payload: payload,
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn == nil {
		return errors.New("connection is nil")
	}

	// Set a write deadline
	c.conn.SetWriteDeadline(time.Now().Add(WriteWait))
	
	// Use WriteJSON to automatically handle JSON marshaling
	err := c.conn.WriteJSON(msg)
	if err != nil {
		log.Printf("Error sending WebSocket message: %v", err)
		return err
	}

	// Handle control messages
	switch messageType {
	case MessageTypeMessage, MessageTypeJoin, MessageTypeLeave:
		// Add a small delay for control messages to ensure they're processed in order
		time.Sleep(10 * time.Millisecond)
	}

	return nil
}

// Close closes the client's WebSocket connection
func (c *Client) Close() {
	c.mu.Lock()
	defer c.mu.Unlock()
	
	if c.done != nil {
		close(c.done)
	}
	c.conn.Close()
}

// validateToken validates a JWT token and returns the user ID
func validateToken(tokenString string) (string, error) {
	if tokenString == "" {
		return "", errors.New("empty token")
	}

	// Parse the token
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, jwt.MapClaims{})
	if err != nil {
		return "", fmt.Errorf("invalid token: %v", err)
	}

	// Check if token is valid
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return "", errors.New("invalid token")
	}

	// Check if token is expired
	exp, ok := claims["exp"].(float64)
	if !ok || float64(time.Now().Unix()) > exp {
		return "", errors.New("token expired")
	}

	// Get user ID from claims
	userID, ok := claims["user_id"].(string)
	if !ok || userID == "" {
		return "", errors.New("invalid user ID in token")
	}

	return userID, nil
}
