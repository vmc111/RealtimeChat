package services

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
	"chat-backend/internal/models"
)

type MessageService struct {
	collection *mongo.Collection
}

func NewMessageService(db *mongo.Database) *MessageService {
	return &MessageService{
		collection: db.Collection("messages"),
	}
}

// CreateMessage creates a new message in the database
func (s *MessageService) CreateMessage(msg *models.Message) error {
	msg.CreatedAt = time.Now()
	msg.UpdatedAt = time.Now()
	_, err := s.collection.InsertOne(context.Background(), msg)
	return err
}

// GetMessagesByRoom retrieves all messages for a specific room (without pagination)
func (s *MessageService) GetMessagesByRoom(roomID string) ([]models.Message, error) {
	roomIDObj, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	cursor, err := s.collection.Find(context.Background(), bson.M{"roomId": roomIDObj})
	if err != nil {
		return nil, err
	}

	var messages []models.Message
	if err := cursor.All(context.Background(), &messages); err != nil {
		return nil, err
	}

	return messages, nil
}

// GetMessagesByRoomWithPagination retrieves paginated messages for a specific room
func (s *MessageService) GetMessagesByRoomWithPagination(roomID string, page, limit int) ([]models.Message, int64, error) {
	var messages []models.Message
	
	// Convert roomID string to ObjectID
	roomIDObj, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, 0, err
	}

	// Calculate skip value for pagination
	skip := int64((page - 1) * limit)
	if skip < 0 {
		skip = 0
	}

	// Create find options for pagination and sorting
	findOptions := options.Find()
	findOptions.SetSort(bson.D{{Key: "createdAt", Value: -1}}) // Sort by newest first
	findOptions.SetSkip(skip)
	findOptions.SetLimit(int64(limit))

	// Get total count of messages for this room
	total, err := s.collection.CountDocuments(context.Background(), bson.M{"roomId": roomIDObj})
	if err != nil {
		return nil, 0, err
	}

	// Find messages with pagination
	cursor, err := s.collection.Find(
		context.Background(),
		bson.M{"roomId": roomIDObj},
		findOptions,
	)
	if err != nil {
		return nil, 0, err
	}
	defer cursor.Close(context.Background())

	// Decode results
	if err := cursor.All(context.Background(), &messages); err != nil {
		return nil, 0, err
	}

	return messages, total, nil
}

// GetMessageByID retrieves a single message by its ID
func (s *MessageService) GetMessageByID(id string) (*models.Message, error) {
	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return nil, err
	}

	var message models.Message
	err = s.collection.FindOne(context.Background(), bson.M{"_id": objID}).Decode(&message)
	if err != nil {
		return nil, err
	}

	return &message, nil
}

// UpdateMessage updates an existing message
func (s *MessageService) UpdateMessage(msg *models.Message) (*models.Message, error) {
	// Update the updatedAt timestamp
	msg.UpdatedAt = time.Now()

	// Create update document
	update := bson.M{
		"$set": bson.M{
			"content":   msg.Content,
			"updatedAt": msg.UpdatedAt,
		},
	}

	// Perform the update
	_, err := s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": msg.ID},
		update,
	)

	if err != nil {
		return nil, err
	}

	return msg, nil
}

// DeleteMessage deletes a message by ID
func (s *MessageService) DeleteMessage(id string) error {
	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(id)
	if err != nil {
		return err
	}

	// Delete the message
	_, err = s.collection.DeleteOne(context.Background(), bson.M{"_id": objID})
	return err
}
