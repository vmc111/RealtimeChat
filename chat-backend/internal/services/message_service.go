package services

import (
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
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

func (s *MessageService) CreateMessage(msg *models.Message) error {
	msg.CreatedAt = time.Now()
	msg.UpdatedAt = time.Now()
	_, err := s.collection.InsertOne(context.Background(), msg)
	return err
}

func (s *MessageService) GetMessagesByRoom(roomID string) ([]models.Message, error) {
	var messages []models.Message
	roomIDObj, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	cursor, err := s.collection.Find(context.Background(), bson.M{"roomId": roomIDObj})
	if err != nil {
		return nil, err
	}

	if err := cursor.All(context.Background(), &messages); err != nil {
		return nil, err
	}

	return messages, nil
}
