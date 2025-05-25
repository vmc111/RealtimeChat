// internal/services/room_service.go
package services

import (
	"context"
	"fmt"
	"time"

	"chat-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type RoomService struct {
	collection *mongo.Collection
}

func NewRoomService(db *mongo.Database) *RoomService {
	return &RoomService{
		collection: db.Collection("rooms"),
	}
}

func (s *RoomService) CreateRoom(room *models.Room) (*models.Room, error) {
	room.CreatedAt = time.Now()
	room.UpdatedAt = time.Now()
	room.Members = append(room.Members, room.CreatedBy) // Add creator as member

	result, err := s.collection.InsertOne(context.Background(), room)
	if err != nil {
		return nil, err
	}

	room.ID = result.InsertedID.(primitive.ObjectID)
	return room, nil
}

func (s *RoomService) GetRooms(userID string) ([]*models.Room, error) {
	ctx := context.Background()
	cursor, err := s.collection.Find(ctx, bson.M{"members": userID})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rooms []*models.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, err
	}

	return rooms, nil
}

func (s *RoomService) GetRoom(roomID string, userID string) (*models.Room, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	var room models.Room
	err = s.collection.FindOne(ctx, bson.M{
		"_id":     objID,
		"members": userID,
	}).Decode(&room)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, fmt.Errorf("room not found or access denied")
		}
		return nil, err
	}

	return &room, nil
}

func (s *RoomService) UpdateRoom(roomID string, updates map[string]interface{}, userID string) (*models.Room, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	updates["updatedAt"] = time.Now()

	result := s.collection.FindOneAndUpdate(
		ctx,
		bson.M{
			"_id":       objID,
			"createdBy": userID, // Only creator can update
		},
		bson.M{"$set": updates},
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	var updatedRoom models.Room
	if err := result.Decode(&updatedRoom); err != nil {
		return nil, fmt.Errorf("failed to update room: %v", err)
	}

	return &updatedRoom, nil
}

func (s *RoomService) DeleteRoom(roomID string, userID string) error {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return err
	}

	result, err := s.collection.DeleteOne(ctx, bson.M{
		"_id":       objID,
		"createdBy": userID, // Only creator can delete
	})

	if err != nil {
		return err
	}

	if result.DeletedCount == 0 {
		return fmt.Errorf("room not found or you don't have permission to delete it")
	}

	return nil
}

func (s *RoomService) AddMember(roomID string, userID string, memberID string) (*models.Room, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	// Check if user is a member of the room
	var room models.Room
	err = s.collection.FindOne(ctx, bson.M{
		"_id":     objID,
		"members": userID,
	}).Decode(&room)


	if err != nil {
		return nil, fmt.Errorf("room not found or you don't have permission to add members")
	}

	// Add new member if not already a member
	update := bson.M{
		"$addToSet": bson.M{"members": memberID},
		"$set":      bson.M{"updatedAt": time.Now()},
	}

	result := s.collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)


	if err := result.Decode(&room); err != nil {
		return nil, fmt.Errorf("failed to add member: %v", err)
	}

	return &room, nil
}

func (s *RoomService) RemoveMember(roomID string, userID string, memberID string) (*models.Room, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	// Only room creator can remove members
	var room models.Room
	err = s.collection.FindOne(ctx, bson.M{
		"_id":       objID,
		"createdBy": userID,
	}).Decode(&room)


	if err != nil {
		return nil, fmt.Errorf("room not found or you don't have permission to remove members")
	}

	// Remove member
	update := bson.M{
		"$pull": bson.M{"members": memberID},
		"$set":  bson.M{"updatedAt": time.Now()},
	}

	result := s.collection.FindOneAndUpdate(
		ctx,
		bson.M{"_id": objID},
		update,
		options.FindOneAndUpdate().SetReturnDocument(options.After),
	)

	if err := result.Decode(&room); err != nil {
		return nil, fmt.Errorf("failed to remove member: %v", err)
	}

	return &room, nil
}

func (s *RoomService) GetRoomMembers(roomID string, userID string) ([]string, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, err
	}

	var room models.Room
	err = s.collection.FindOne(ctx, bson.M{
		"_id":     objID,
		"members": userID, // User must be a member of the room
	}).Decode(&room)


	if err != nil {
		return nil, fmt.Errorf("room not found or access denied")
	}

	return room.Members, nil
}

func (s *RoomService) SearchRooms(query string, userID string) ([]*models.Room, error) {
	ctx := context.Background()

	filter := bson.M{
		"$and": []bson.M{
			{"members": userID}, // User must be a member
			{
				"$or": []bson.M{
					{"name": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
					{"description": bson.M{"$regex": primitive.Regex{Pattern: query, Options: "i"}}},
				},
			},
		},
	}

	cursor, err := s.collection.Find(ctx, filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var rooms []*models.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, err
	}

	return rooms, nil
}
