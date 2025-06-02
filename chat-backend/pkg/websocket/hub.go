package websocket

import (
	"log"
	"sync"
)

type RoomID string

type Message struct {
	RoomID  RoomID
	Payload []byte
}

type Hub struct {
	// Registered clients
	clients map[*Client]bool
	// Rooms with their clients
	rooms map[RoomID]map[*Client]bool
	// Inbound messages
	broadcast chan Message
	// Register requests
	register chan *Client
	// Unregister requests
	unregister chan *Client
	// Mutex for concurrent access
	mu sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan Message),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[RoomID]map[*Client]bool),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			log.Printf("Client %s registered with hub", client.userID)
			h.mu.Unlock()

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				log.Printf("Unregistering client %s", client.userID)
				// Remove client from all rooms
				for roomID := range client.rooms {
					if clients, ok := h.rooms[roomID]; ok {
						delete(clients, client)
						if len(clients) == 0 {
							delete(h.rooms, roomID)
						}
					}
				}
				// Remove client from hub
				delete(h.clients, client)
				close(client.send)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			h.mu.RLock()
			if clients, ok := h.rooms[message.RoomID]; ok {
				for client := range clients {
					select {
					case client.send <- message.Payload:
					default:
						close(client.send)
						delete(h.rooms[message.RoomID], client)
						if len(h.rooms[message.RoomID]) == 0 {
							delete(h.rooms, message.RoomID)
						}
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

// JoinRoom adds a client to a room
func (h *Hub) JoinRoom(roomID RoomID, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if _, exists := h.rooms[roomID]; !exists {
		h.rooms[roomID] = make(map[*Client]bool)
	}
	h.rooms[roomID][client] = true
	client.rooms[roomID] = true
}

// LeaveRoom removes a client from a room
func (h *Hub) LeaveRoom(roomID RoomID, client *Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if clients, exists := h.rooms[roomID]; exists {
		delete(clients, client)
		delete(client.rooms, roomID)
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
}

// Broadcast sends a message to all clients in a room
func (h *Hub) Broadcast(roomID RoomID, message []byte) {
	h.broadcast <- Message{
		RoomID:  roomID,
		Payload: message,
	}
}
