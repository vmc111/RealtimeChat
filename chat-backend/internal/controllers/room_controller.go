// internal/controllers/room_controller.go
package controllers

import (
	"chat-backend/internal/models"
	"chat-backend/internal/services"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type RoomController struct {
	roomService *services.RoomService
}

func NewRoomController(roomService *services.RoomService) *RoomController {
	return &RoomController{roomService: roomService}
}

type CreateRoomRequest struct {
	Name        string `json:"name" binding:"required,min=3,max=50"`
	Description string `json:"description,omitempty" maxLength:"200"`
	IsPrivate   bool   `json:"isPrivate"`
}

type UpdateRoomRequest struct {
	Name        string `json:"name,omitempty" minLength:"3" maxLength:"50"`
	Description string `json:"description,omitempty" maxLength:"200"`
}

type AddMemberRequest struct {
	UserID string `json:"userId" binding:"required"`
}

func (c *RoomController) CreateRoom(ctx *gin.Context) {
	var req CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	room := &models.Room{
		ID:          primitive.NewObjectID(),
		Name:        req.Name,
		Description: req.Description,
		IsPrivate:   req.IsPrivate,
		CreatedBy:   userID.(string),
		Members:     []models.Member{},
		CreatedAt:   time.Now(),
		UpdatedAt:   time.Now(),
	}

	createdRoom, err := c.roomService.CreateRoom(room)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusCreated, createdRoom)
}

// GetRooms returns all rooms the current user is a member of
func (c *RoomController) GetRooms(ctx *gin.Context) {
	userID, exists := ctx.Get("userID")
	log.Println(userID)
	if userID == "" {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	log.Println(exists)
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	rooms, err := c.roomService.GetRooms(userID.(string))
	if err != nil {
		log.Println(err)
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms: " + err.Error()})
		return
	}
	log.Println(rooms)

	if rooms == nil {
		rooms = []*models.Room{} // Return empty array instead of null
	}

	ctx.JSON(http.StatusOK, rooms)
}

// GetRoom returns a specific room by ID
func (c *RoomController) GetRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	room, err := c.roomService.GetRoom(roomID, userID.(string))
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "room not found or access denied" {
			status = http.StatusNotFound
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, room)
}

// UpdateRoom updates room details
func (c *RoomController) UpdateRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req UpdateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Validate at least one field is being updated
	if req.Name == "" && req.Description == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		if len(req.Name) < 3 || len(req.Name) > 50 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Name must be between 3 and 50 characters"})
			return
		}
		updates["name"] = req.Name
	}

	if req.Description != "" {
		if len(req.Description) > 200 {
			ctx.JSON(http.StatusBadRequest, gin.H{"error": "Description cannot exceed 200 characters"})
			return
		}
		updates["description"] = req.Description
	}

	updatedRoom, err := c.roomService.UpdateRoom(roomID, updates, userID.(string))
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "room not found or access denied" {
			status = http.StatusNotFound
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// DeleteRoom deletes a room (only by the creator)
func (c *RoomController) DeleteRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	err := c.roomService.DeleteRoom(roomID, userID.(string))
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "room not found or you don't have permission to delete it" {
			status = http.StatusForbidden
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// AddMember adds a user to a room
func (c *RoomController) AddMember(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req AddMemberRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	if req.UserID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Prevent adding yourself if you're already a member
	if req.UserID == userID.(string) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "You are already a member of this room"})
		return
	}

	updatedRoom, err := c.roomService.AddMember(roomID, userID.(string), req.UserID)
	if err != nil {
		status := http.StatusInternalServerError
		switch err.Error() {
		case "room not found or you don't have permission to add members":
			status = http.StatusForbidden
		case "user is already a member of this room":
			status = http.StatusConflict
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// RemoveMember removes a user from a room (only by the creator)
func (c *RoomController) RemoveMember(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	memberID := ctx.Param("userId")
	if memberID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Member ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Prevent removing yourself (use LeaveRoom instead)
	if memberID == userID.(string) {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Use the leave endpoint to leave a room"})
		return
	}

	updatedRoom, err := c.roomService.RemoveMember(roomID, userID.(string), memberID)
	if err != nil {
		status := http.StatusInternalServerError
		switch err.Error() {
		case "room not found or you don't have permission to remove members":
			status = http.StatusForbidden
		case "user is not a member of this room":
			status = http.StatusNotFound
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// GetRoomMembers returns all members of a room
func (c *RoomController) GetRoomMembers(ctx *gin.Context) {
	roomID := ctx.Param("id")
	if roomID == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	members, err := c.roomService.GetRoomMembers(roomID, userID.(string))
	if err != nil {
		status := http.StatusInternalServerError
		if err.Error() == "room not found or access denied" {
			status = http.StatusNotFound
		}
		ctx.JSON(status, gin.H{"error": err.Error()})
		return
	}

	if members == nil {
		members = []models.Member{} // Return empty array instead of null
	}

	ctx.JSON(http.StatusOK, members)
}

// SearchRooms searches for rooms by name or description
func (c *RoomController) SearchRooms(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Search query is required"})
		return
	}

	// Validate query length
	if len(query) < 2 {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "Search query must be at least 2 characters long"})
		return
	}

	userID, exists := ctx.Get("userID")
	if !exists {
		ctx.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Limit query length to prevent abuse
	if len(query) > 100 {
		query = query[:100]
	}

	rooms, err := c.roomService.SearchRooms(query, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search rooms: " + err.Error()})
		return
	}

	if rooms == nil {
		rooms = []*models.Room{} // Return empty array instead of null
	}

	ctx.JSON(http.StatusOK, rooms)
}
