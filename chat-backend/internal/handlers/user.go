package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type UserHandler struct {
	// Add any dependencies here (e.g., database connection)
}

func NewUserHandler() *UserHandler {
	return &UserHandler{}
}

// GetProfile returns the current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// In a real application, you would fetch the user from the database
	c.JSON(http.StatusOK, gin.H{
		"id":    userID,
		"email": c.GetString("email"),
	})
}

// UpdateProfile updates the current user's profile
func (h *UserHandler) UpdateProfile(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse request body
	var updateData struct {
		Username string `json:"username"`
	}

	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// In a real application, you would update the user in the database
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"userId":  userID,
		"data":    updateData,
	})
}
