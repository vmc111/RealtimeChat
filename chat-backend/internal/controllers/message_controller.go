package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"chat-backend/internal/models"
	"chat-backend/internal/services"
)

type MessageController struct {
	messageService *services.MessageService
}

func NewMessageController(messageService *services.MessageService) *MessageController {
	return &MessageController{messageService: messageService}
}

func (c *MessageController) GetMessages(ctx *gin.Context) {
	roomID := ctx.Param("id")
	messages, err := c.messageService.GetMessagesByRoom(roomID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}
	ctx.JSON(http.StatusOK, messages)
}

func (c *MessageController) SendMessage(ctx *gin.Context) {
	var msg models.Message
	if err := ctx.ShouldBindJSON(&msg); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid message format"})
		return
	}

	if err := c.messageService.CreateMessage(&msg); err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	ctx.JSON(http.StatusCreated, msg)
}
