package websocket

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"

	"chat-backend/pkg/types"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

// Custom errors
var (
	ErrNotAuthenticated = errors.New("not authenticated")
	ErrInvalidMessage   = errors.New("invalid message")
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, you should validate the origin against a whitelist
		return true
	},
}

// WSHandler handles WebSocket connections
type WSHandler struct {
	hub      *Hub
	userRepo types.UserRepository
}

// NewWSHandler creates a new WebSocket handler
func NewWSHandler(hub *Hub, userRepo types.UserRepository) *WSHandler {
	return &WSHandler{
		hub:      hub,
		userRepo: userRepo,
	}
}

// ServeWebSocket handles WebSocket requests
func (h *WSHandler) ServeWebSocket(c *gin.Context) {
	// Log the incoming request
	log.Printf("WebSocket connection requested from %s", c.Request.RemoteAddr)

	// Check if the connection is a WebSocket upgrade
	if !websocket.IsWebSocketUpgrade(c.Request) {
		log.Printf("Not a WebSocket upgrade request")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Expected WebSocket upgrade"})
		return
	}

	// Get authentication token from query parameters or headers
	token := c.Query("token")
	if token == "" {
		token = c.GetHeader("Authorization")
		// Remove "Bearer " prefix if present
		if len(token) > 7 && strings.HasPrefix(token, "Bearer ") {
			token = token[7:]
		}
	}

	if token == "" {
		log.Println("No authentication token provided")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	// Validate the JWT token and get user ID
	userID, err := validateToken(token)
	if err != nil {
		log.Printf("Invalid token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	}

	// Upgrade HTTP connection to WebSocket with custom headers
	upgrader := websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			// Allow all origins for WebSocket connections
			// In production, you might want to restrict this to specific domains
			return true
		},
		// Handle the Sec-WebSocket-Protocol header if needed
		Subprotocols: []string{"access_token", token},
	}

	// Upgrade the connection
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return // The Upgrade method already sends the HTTP response
	}
	defer conn.Close()

	// Log successful upgrade
	log.Printf("WebSocket connection established with %s (User: %s)", c.Request.RemoteAddr, userID)

	// Create a new client with the authenticated user ID
	client := NewClient(h.hub, conn, userID)

	// Register client with the hub
	h.hub.register <- client

	// Send welcome message
	welcomeMsg := map[string]interface{}{
		"type":    "system",
		"message": "Connected to WebSocket server",
		"user_id": userID,
	}
	if err := conn.WriteJSON(welcomeMsg); err != nil {
		log.Printf("Error sending welcome message: %v", err)
		return
	}

	log.Printf("Client %s registered with hub", userID)

	// Start client goroutines
	go client.WritePump()
	go client.readPump(h)

	// Block until the connection is closed
	// The connection will be closed when the client disconnects
	// or when an error occurs in the readPump
	<-client.done
	log.Printf("WebSocket connection closed for user %s", userID)
}

// HandleRoomJoin handles a request to join a room
func (h *WSHandler) HandleRoomJoin(roomID RoomID, client *Client) error {
	// Check if client is authenticated
	if client.userID == "" {
		return ErrNotAuthenticated
	}

	// Check if user has permission to join the room
	// In a real app, you would check if the user is a member of the room
	// For now, we'll just log it
	log.Printf("User %s joining room %s", client.userID, roomID)

	// Join the room
	h.hub.JoinRoom(roomID, client)

	// Send confirmation message
	return client.SendMessage(MessageTypeJoin, roomID, map[string]interface{}{
		"message": "Successfully joined room",
		"roomId":  roomID,
	})
}

// authenticateClient handles the authentication of a WebSocket client
func (h *WSHandler) authenticateClient(tokenString string, client *Client) error {
	// In a real app, you would validate the JWT token here
	// For now, we'll just log it and set a mock user ID
	log.Printf("Authenticating WebSocket client with token: %s", tokenString)

	if tokenString == "" {
		return errors.New("authentication token is required")
	}

	// Simulate user lookup
	userID := "user123" // This would come from token validation
	client.userID = userID

	// Send authentication success message
	return client.SendMessage(MessageTypeAuthSuccess, "", map[string]interface{}{
		"message": "Authentication successful",
		"userId":  userID,
	})
}

// HandleRoomLeave handles a request to leave a room
func (h *WSHandler) HandleRoomLeave(roomID RoomID, client *Client) error {
	// Leave the room
	h.hub.LeaveRoom(roomID, client)

	// Send confirmation message
	return client.SendMessage(MessageTypeLeave, roomID, map[string]interface{}{
		"message": "Successfully left room",
		"roomId":  roomID,
	})
}

// BroadcastMessage sends a message to all clients in a room
func (h *WSHandler) BroadcastMessage(roomID RoomID, messageType MessageType, payload interface{}) {
	msg := OutgoingMessage{
		Type:    messageType,
		RoomID:  roomID,
		Payload: payload,
	}

	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling broadcast message: %v", err)
		return
	}

	h.hub.Broadcast(roomID, data)
}

// NotifyRoomUpdate notifies all clients in a room about a room update
func (h *WSHandler) NotifyRoomUpdate(roomID RoomID, update interface{}) {
	h.BroadcastMessage(roomID, MessageTypeMessage, map[string]interface{}{
		"event": "ROOM_UPDATED",
		"data":  update,
	})
}

// NotifyMemberChange notifies all clients in a room about a member change
func (h *WSHandler) NotifyMemberChange(roomID RoomID, userID string, action string, member interface{}) {
	h.BroadcastMessage(roomID, MessageTypeMessage, map[string]interface{}{
		"event":  "MEMBER_" + action,
		"userId": userID,
		"member": member,
	})
}
