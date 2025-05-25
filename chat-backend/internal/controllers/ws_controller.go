package controllers

import (
	"github.com/gin-gonic/gin"
	"chat-backend/pkg/websocket"
)

type WSController struct {
	hub *websocket.Hub
}

func NewWSController(hub *websocket.Hub) *WSController {
	return &WSController{
		hub: hub,
	}
}

func (c *WSController) HandleWebSocket(ctx *gin.Context) {
	c.hub.ServeWebSocket(ctx)
}
