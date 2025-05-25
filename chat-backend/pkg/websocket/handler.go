package websocket

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		// In production, you should validate the origin
		return true
	},
}

// ServeWebSocket handles WebSocket requests
func (h *Hub) ServeWebSocket(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		conn.WriteMessage(websocket.CloseMessage, []byte("Unauthorized"))
		conn.Close()
		return
	}

	client := NewClient(h, conn, userID.(string))
	client.hub.register <- client

	// Allow collection of memory referenced by the caller by doing all work in new goroutines
	go client.WritePump()
	go client.ReadPump()
}
