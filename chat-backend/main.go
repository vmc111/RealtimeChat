// cmd/server/main.go
package main

import (
	"context"
	"crypto/tls"
	"log"
	"os"
	"time"

	"chat-backend/internal/controllers"
	"chat-backend/internal/handlers"
	"chat-backend/internal/middleware"
	"chat-backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	// Load environment variables
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatal("MONGODB_URI environment variable is not set")
	}

	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET environment variable is not set")
	}

	// Connect to MongoDB with TLS configuration
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second) // Increased timeout
	defer cancel()

	// Configure client options with TLS
	clientOptions := options.Client().
		ApplyURI(mongoURI).
		SetTLSConfig(&tls.Config{
			InsecureSkipVerify: true, // Only for development, not for production
		}).
		SetServerSelectionTimeout(30 * time.Second).
		SetSocketTimeout(60 * time.Second)

	// Connect to MongoDB
	client, err := mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatalf("failed to connect to MongoDB: %v", err)
	}

	// Check the connection
	err = client.Ping(ctx, nil)
	if err != nil {
		log.Fatalf("failed to ping MongoDB: %v", err)
	}

	log.Println("Successfully connected to MongoDB!")

	defer func() {
		if err := client.Disconnect(ctx); err != nil {
			log.Printf("error disconnecting from MongoDB: %v", err)
		}
	}()

	// Get database and collections
	db := client.Database("chatdb")
	usersCollection := db.Collection("users")

	// Create indexes
	_, err = usersCollection.Indexes().CreateOne(ctx, mongo.IndexModel{
		Keys:    bson.D{{Key: "email", Value: 1}},
		Options: options.Index().SetUnique(true),
	})
	if err != nil {
		log.Fatalf("failed to create index: %v", err)
	}

	// Initialize services
	roomService := services.NewRoomService(db)

	// Initialize handlers and middleware
	authHandler := handlers.NewAuthHandler(usersCollection, jwtSecret)
	userHandler := handlers.NewUserHandler()
	roomController := controllers.NewRoomController(roomService)
	authMiddleware := middleware.AuthMiddleware(jwtSecret)

	// Create router
	router := gin.Default()

	// CORS configuration
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowCredentials = true
	config.AddAllowHeaders("Authorization")
	router.Use(cors.New(config))

	// Public routes
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/signup", authHandler.SignUp)
		authGroup.POST("/login", authHandler.Login)
	}

	// Protected routes
	api := router.Group("/api")
	api.Use(authMiddleware)
	{
		// User routes
		userGroup := api.Group("/users")
		{
			userGroup.GET("/me", userHandler.GetProfile)
			userGroup.PUT("/me", userHandler.UpdateProfile)
		}

		// Room routes
		roomGroup := api.Group("/rooms")
		{
			roomGroup.GET("", roomController.GetRooms)
			roomGroup.POST("", roomController.CreateRoom)
			roomGroup.GET("/search", roomController.SearchRooms)

			roomIDGroup := roomGroup.Group("/:id")
			{
				roomIDGroup.GET("", roomController.GetRoom)
				roomIDGroup.PUT("", roomController.UpdateRoom)
				roomIDGroup.DELETE("", roomController.DeleteRoom)

				// Room member management
				memberGroup := roomIDGroup.Group("/members")
				{
					memberGroup.GET("", roomController.GetRoomMembers)
					memberGroup.POST("", roomController.AddMember)
					memberGroup.DELETE("/:userId", roomController.RemoveMember)
				}
			}
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on :%s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
