// internal/handlers/auth.go
package handlers

import (
	"net/http"
	"time"

	"chat-backend/internal/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuthHandler struct {
	collection *mongo.Collection
	secret     string
}

func NewAuthHandler(collection *mongo.Collection, secret string) *AuthHandler {
	return &AuthHandler{
		collection: collection,
		secret:     secret,
	}
}

type SignUpRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string `json:"token"`
	User  struct {
		ID       string `json:"id"`
		Username string `json:"username"`
		Email    string `json:"email"`
	} `json:"user"`
}

func (h *AuthHandler) SignUp(c *gin.Context) {
	var req SignUpRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user already exists
	var existingUser models.User
	err := h.collection.FindOne(c, bson.M{"email": req.Email}).Decode(&existingUser)
	if err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "email already exists"})
		return
	}

	// Create new user
	user := models.User{
		Username:  req.Username,
		Email:     req.Email,
		Password:  req.Password,
		CreatedAt: time.Now().Unix(),
		UpdatedAt: time.Now().Unix(),
	}

	// Hash password
	if err := user.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to hash password"})
		return
	}

	// Insert user into database
	result, err := h.collection.InsertOne(c, user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create user"})
		return
	}

	// Generate JWT token
	token, err := h.generateToken(result.InsertedID.(primitive.ObjectID).Hex(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Return response
	c.JSON(http.StatusCreated, AuthResponse{
		Token: token,
		User: struct {
			ID       string `json:"id"`
			Username string `json:"username"`
			Email    string `json:"email"`
		}{
			ID:       result.InsertedID.(primitive.ObjectID).Hex(),
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by email
	var user models.User
	err := h.collection.FindOne(c, bson.M{"email": req.Email}).Decode(&user)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Check password
	if err := user.CheckPassword(req.Password); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := h.generateToken(user.ID.Hex(), user.Email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	// Return response
	c.JSON(http.StatusOK, AuthResponse{
		Token: token,
		User: struct {
			ID       string `json:"id"`
			Username string `json:"username"`
			Email    string `json:"email"`
		}{
			ID:       user.ID.Hex(),
			Username: user.Username,
			Email:    user.Email,
		},
	})
}

func (h *AuthHandler) generateToken(userID, email string) (string, error) {
	now := time.Now()
	claims := &jwt.RegisteredClaims{
		Issuer:    "chat-backend",
		Subject:   userID,
		Audience:  []string{"chat-app"},
		ExpiresAt: jwt.NewNumericDate(now.Add(24 * time.Hour)),
		NotBefore: jwt.NewNumericDate(now),
		IssuedAt:  jwt.NewNumericDate(now),
		ID:        email, // Using email as the JWT ID (jti)
	}
	
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	return token.SignedString([]byte(h.secret))
}