package services

import (
	"context"
	"fmt"

	"chat-backend/internal/models"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type userService struct {
	collection *mongo.Collection
}

// NewUserService creates a new instance of UserService
func NewUserService(collection *mongo.Collection) *userService {
	return &userService{
		collection: collection,
	}
}

// GetUserByID retrieves a user by their ID
func (s *userService) GetUserByID(id string) (*models.User, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, fmt.Errorf("invalid user ID")
	}

	var user models.User
	err = s.collection.FindOne(ctx, bson.M{"_id": objID}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to fetch user: %v", err)
	}

	return &user, nil
}
