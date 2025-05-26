package handlers

import (
	"net/http"
	"time"

	"chat-backend/internal/models"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type UserHandler struct {
	collection *mongo.Collection
}

// UpdateProfileRequest defines the request body for updating a user profile
type UpdateProfileRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
}

// NewUserHandler creates a new instance of UserHandler
func NewUserHandler(collection *mongo.Collection) *UserHandler {
	return &UserHandler{
		collection: collection,
	}
}

// GetProfile returns the current user's profile
func (h *UserHandler) GetProfile(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Find user in database
	var user models.User
	err = h.collection.FindOne(c, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		}
		return
	}

	// Return user profile (excluding password)
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID.Hex(),
		"username":  user.Username,
		"email":     user.Email,
		"createdAt": user.CreatedAt,
	})
}

// GetUser returns a specific user's profile
func (h *UserHandler) GetUser(c *gin.Context) {
	// Get user ID from URL parameter
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Find user in database
	var user models.User
	err = h.collection.FindOne(c, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		}
		return
	}

	// Return user profile (excluding password)
	c.JSON(http.StatusOK, gin.H{
		"id":        user.ID.Hex(),
		"username":  user.Username,
		"email":     user.Email,
		"createdAt": user.CreatedAt,
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

	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(userID.(string))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	// Parse request body
	var updateData UpdateProfileRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email is being updated and if it's already taken
	if updateData.Email != "" {
		var existingUser models.User
		err := h.collection.FindOne(c, bson.M{
			"email": updateData.Email,
			"_id":   bson.M{"$ne": objID},
		}).Decode(&existingUser)

		if err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		} else if err != mongo.ErrNoDocuments {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check email availability"})
			return
		}
	}

	// Prepare update fields
	updateFields := bson.M{
		"updatedAt": time.Now().Unix(),
	}

	// Only include fields that are being updated
	if updateData.Username != "" {
		updateFields["username"] = updateData.Username
	}
	if updateData.Email != "" {
		updateFields["email"] = updateData.Email
	}

	// Update user in database
	update := bson.M{"$set": updateFields}
	result, err := h.collection.UpdateOne(
		c,
		bson.M{"_id": objID},
		update,
	)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	if result.MatchedCount == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Get updated user
	var updatedUser models.User
	err = h.collection.FindOne(c, bson.M{"_id": objID}).Decode(&updatedUser)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated profile"})
		return
	}

	// Return updated profile (excluding password)
	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":        updatedUser.ID.Hex(),
			"username":  updatedUser.Username,
			"email":     updatedUser.Email,
			"createdAt": updatedUser.CreatedAt,
		},
	})
}
