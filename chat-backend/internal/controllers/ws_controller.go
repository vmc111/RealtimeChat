package controllers

import (
	"log"

	"github.com/gin-gonic/gin"
	"chat-backend/internal/models"
	"chat-backend/pkg/websocket"
)

// Ensure WSController implements models.WSController
var _ models.WSController = (*WSController)(nil)

// WSController handles WebSocket connections
type WSController struct {
	handler *websocket.WSHandler
}

// NewWSController creates a new WebSocket controller
func NewWSController(handler *websocket.WSHandler) *WSController {
	return &WSController{
		handler: handler,
	}
}

// HandleWebSocket handles WebSocket connections
func (c *WSController) HandleWebSocket(ctx *gin.Context) {
	c.handler.ServeWebSocket(ctx)
}

// HandleRoomJoin handles a request to join a room
func (c *WSController) HandleRoomJoin(roomID string, userID string) error {
	log.Printf("User %s joined room %s", userID, roomID)
	// Note: The actual client will join the room when it connects via WebSocket
	// and sends a JOIN message. This is just a placeholder for any additional logic.
	return nil
}

// HandleRoomLeave handles a request to leave a room
func (c *WSController) HandleRoomLeave(roomID string, userID string) error {
	log.Printf("User %s left room %s", userID, roomID)
	// Note: The client will be removed from the room when it disconnects
	// or sends a LEAVE message. This is just a placeholder.
	return nil
}

// BroadcastMessage sends a message to all clients in a room
func (c *WSController) BroadcastMessage(roomID string, messageType string, payload interface{}) error {
	c.handler.BroadcastMessage(websocket.RoomID(roomID), websocket.MessageType(messageType), payload)
	return nil
}

// NotifyRoomUpdate notifies all clients in a room about a room update
func (c *WSController) NotifyRoomUpdate(roomID string, update interface{}) error {
	c.handler.NotifyRoomUpdate(websocket.RoomID(roomID), update)
	return nil
}

// NotifyMemberChange notifies all clients in a room about a member change
func (c *WSController) NotifyMemberChange(roomID string, userID string, action string, member interface{}) error {
	c.handler.NotifyMemberChange(websocket.RoomID(roomID), userID, action, member)
	return nil
}
