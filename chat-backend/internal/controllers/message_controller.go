package controllers

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"chat-backend/internal/models"
	"chat-backend/internal/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type MessageController struct {
	messageService *services.MessageService
}

func NewMessageController(messageService *services.MessageService) *MessageController {
	return &MessageController{messageService: messageService}
}

type GetMessagesResponse struct {
	Messages []models.Message `json:"messages"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	Limit    int              `json:"limit"`
}

type SendMessageRequest struct {
	Content string `json:"content" binding:"required,min=1,max=2000"`
}

type UpdateMessageRequest struct {
	Content string `json:"content" binding:"required,min=1,max=2000"`
}

// GetMessages handles retrieving messages for a room with pagination
// @Summary Get messages by room ID
// @Description Get paginated messages for a specific room
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Room ID"
// @Param page query int false "Page number" default(1)
// @Param limit query int false "Messages per page" default(50)
// @Success 200 {object} GetMessagesResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{id}/messages [get]
func (c *MessageController) GetMessages(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	// Parse pagination parameters
	page, _ := strconv.Atoi(ctx.DefaultQuery("page", "1"))    // Default to page 1
	limit, _ := strconv.Atoi(ctx.DefaultQuery("limit", "50")) // Default to 50 messages per page

	// Validate pagination
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 50
	}

	// Get messages with pagination
	messages, total, err := c.messageService.GetMessagesByRoomWithPagination(roomID, page, limit)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages: " + err.Error()})
		return
	}

	// Prepare response
	response := GetMessagesResponse{
		Messages: messages,
		Total:    total,
		Page:     page,
		Limit:    limit,
	}

	ctx.JSON(http.StatusOK, response)
}

// GetMessage handles retrieving a single message by ID
// @Summary Get a message by ID
// @Description Get a specific message by its ID
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Success 200 {object} models.Message
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/messages/{id} [get]
func (c *MessageController) GetMessage(ctx *gin.Context) {
	messageID := ctx.Param("message_id")
	if messageID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message ID is required"})
		return
	}

	message, err := c.messageService.GetMessageByID(messageID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch message"})
		}
		return
	}

	ctx.JSON(http.StatusOK, message)
}

// SendMessage handles creating a new message
// @Summary Send a new message
// @Description Create a new message in a room
// @Tags messages
// @Accept json
// @Produce json
// @Param room_id path string true "Room ID"
// @Param message body SendMessageRequest true "Message content"
// @Success 201 {object} models.Message
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/rooms/{room_id}/messages [post]
func (c *MessageController) SendMessage(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse and validate request
	var req SendMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Create message
	message := models.Message{
		RoomID:    primitive.ObjectID{},
		UserID:    userID.(string),
		Content:   req.Content,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Convert roomID string to ObjectID
	roomObjID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}
	message.RoomID = roomObjID

	// Save message
	if err := c.messageService.CreateMessage(&message); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, message)
}

// UpdateMessage handles updating a message
// @Summary Update a message
// @Description Update an existing message's content
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Param message body UpdateMessageRequest true "Updated message content"
// @Success 200 {object} models.Message
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/messages/{id} [put]
func (c *MessageController) UpdateMessage(ctx *gin.Context) {
	messageID := ctx.Param("id")
	if messageID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message ID is required"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse and validate request
	var req UpdateMessageRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Get the existing message to check ownership
	existingMsg, err := c.messageService.GetMessageByID(messageID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch message"})
		}
		return
	}

	// Check if the user is the owner of the message
	if existingMsg.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only update your own messages"})
		return
	}

	// Update the message
	existingMsg.Content = req.Content
	existingMsg.UpdatedAt = time.Now()

	updatedMsg, err := c.messageService.UpdateMessage(existingMsg)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update message: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedMsg)
}

// DeleteMessage handles deleting a message
// @Summary Delete a message
// @Description Delete a message by ID
// @Tags messages
// @Accept json
// @Produce json
// @Param id path string true "Message ID"
// @Success 204 "No Content"
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 403 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/messages/{id} [delete]
func (c *MessageController) DeleteMessage(ctx *gin.Context) {
	messageID := ctx.Param("id")
	if messageID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Message ID is required"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get the existing message to check ownership
	existingMsg, err := c.messageService.GetMessageByID(messageID)
	if err != nil {
		if errors.Is(err, mongo.ErrNoDocuments) {
			ctx.JSON(http.StatusNotFound, gin.H{"error": "Message not found"})
		} else {
			ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch message"})
		}
		return
	}

	// Check if the user is the owner of the message
	if existingMsg.UserID != userID {
		ctx.JSON(http.StatusForbidden, gin.H{"error": "You can only delete your own messages"})
		return
	}

	// Delete the message
	if err := c.messageService.DeleteMessage(messageID); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete message: " + err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}
