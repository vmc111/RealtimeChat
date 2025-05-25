// internal/controllers/room_controller.go
package controllers

import (
	"chat-backend/internal/models"
	"chat-backend/internal/services"
	"net/http"

	"github.com/gin-gonic/gin"
)

type RoomController struct {
	roomService *services.RoomService
}

func NewRoomController(roomService *services.RoomService) *RoomController {
	return &RoomController{roomService: roomService}
}

type CreateRoomRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description,omitempty"`
}

type UpdateRoomRequest struct {
	Name        string `json:"name,omitempty"`
	Description string `json:"description,omitempty"`
}

type AddMemberRequest struct {
	UserID string `json:"userId" binding:"required"`
}

func (c *RoomController) CreateRoom(ctx *gin.Context) {
	var req CreateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get user ID from context
	userID, _ := ctx.Get("userID")
	
	room := &models.Room{
		Name:        req.Name,
		Description: req.Description,
		CreatedBy:   userID.(string),
		Members:     []string{userID.(string)},
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
	userID, _ := ctx.Get("userID")
	
	rooms, err := c.roomService.GetRooms(userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rooms)
}

// GetRoom returns a specific room by ID
func (c *RoomController) GetRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	userID, _ := ctx.Get("userID")

	room, err := c.roomService.GetRoom(roomID, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, room)
}

// UpdateRoom updates room details
func (c *RoomController) UpdateRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	userID, _ := ctx.Get("userID")

	var req UpdateRoomRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := make(map[string]interface{})
	if req.Name != "" {
		updates["name"] = req.Name
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}

	updatedRoom, err := c.roomService.UpdateRoom(roomID, updates, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// DeleteRoom deletes a room (only by the creator)
func (c *RoomController) DeleteRoom(ctx *gin.Context) {
	roomID := ctx.Param("id")
	userID, _ := ctx.Get("userID")

	err := c.roomService.DeleteRoom(roomID, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.Status(http.StatusNoContent)
}

// AddMember adds a user to a room
func (c *RoomController) AddMember(ctx *gin.Context) {
	roomID := ctx.Param("id")
	userID, _ := ctx.Get("userID")

	var req AddMemberRequest
	if err := ctx.ShouldBindJSON(&req); err != nil {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updatedRoom, err := c.roomService.AddMember(roomID, userID.(string), req.UserID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// RemoveMember removes a user from a room (only by the creator)
func (c *RoomController) RemoveMember(ctx *gin.Context) {
	roomID := ctx.Param("id")
	memberID := ctx.Param("userId")
	userID, _ := ctx.Get("userID")

	updatedRoom, err := c.roomService.RemoveMember(roomID, userID.(string), memberID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, updatedRoom)
}

// GetRoomMembers returns all members of a room
func (c *RoomController) GetRoomMembers(ctx *gin.Context) {
	roomID := ctx.Param("id")
	userID, _ := ctx.Get("userID")

	members, err := c.roomService.GetRoomMembers(roomID, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, members)
}

// SearchRooms searches for rooms by name or description
func (c *RoomController) SearchRooms(ctx *gin.Context) {
	query := ctx.Query("q")
	if query == "" {
		ctx.JSON(http.StatusBadRequest, gin.H{"error": "search query is required"})
		return
	}

	userID, _ := ctx.Get("userID")
	rooms, err := c.roomService.SearchRooms(query, userID.(string))
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search rooms: " + err.Error()})
		return
	}

	ctx.JSON(http.StatusOK, rooms)
}
