package models

// WSController defines the interface for WebSocket operations
type WSController interface {
	// NotifyMemberChange notifies all clients in a room about a member change
	NotifyMemberChange(roomID string, userID string, action string, member interface{}) error
	// NotifyRoomUpdate notifies all clients in a room about a room update
	NotifyRoomUpdate(roomID string, update interface{}) error
}
