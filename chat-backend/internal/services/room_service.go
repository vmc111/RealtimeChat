// internal/services/room_service.go
package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"chat-backend/internal/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// UserService defines the interface for user-related operations
type UserService interface {
	GetUserByID(id string) (*models.User, error)
}

type RoomService struct {
	collection *mongo.Collection
	userSvc   UserService
	wsCtrl    models.WSController
}

func NewRoomService(db *mongo.Database, userSvc UserService, wsCtrl models.WSController) *RoomService {
	return &RoomService{
		collection: db.Collection("rooms"),
		userSvc:   userSvc,
		wsCtrl:    wsCtrl,
	}
}

func (s *RoomService) CreateRoom(room *models.Room) (*models.Room, error) {
	room.CreatedAt = time.Now()
	room.UpdatedAt = time.Now()
	// Add creator as member
	creator, err := s.userSvc.GetUserByID(room.CreatedBy)
	if err != nil {
		return nil, fmt.Errorf("failed to get creator: %v", err)
	}
	room.Members = append(room.Members, models.Member{
		ID:          creator.ID.Hex(),
		DisplayName: creator.Username,
	})

	result, err := s.collection.InsertOne(context.Background(), room)
	if err != nil {
		return nil, err
	}

	room.ID = result.InsertedID.(primitive.ObjectID)
	return room, nil
}

func (s *RoomService) GetRooms(userID string) ([]*models.Room, error) {
	ctx := context.Background()
	
	// First find all rooms where the user is a member
	cursor, err := s.collection.Find(ctx, bson.M{
		"members": bson.M{
			"$elemMatch": bson.M{
				"id": userID,
			},
		},
	})
	if err != nil {
		return nil, fmt.Errorf("failed to find rooms: %v", err)
	}
	defer cursor.Close(ctx)

	var rooms []*models.Room
	if err := cursor.All(ctx, &rooms); err != nil {
		return nil, fmt.Errorf("failed to decode rooms: %v", err)
	}

	// For each room, ensure all members have their details
	for _, room := range rooms {
		var updatedMembers []models.Member
		for _, member := range room.Members {
			user, err := s.userSvc.GetUserByID(member.ID)
			if err != nil {
				// Skip if user not found, but log the error
				continue
			}
			updatedMembers = append(updatedMembers, models.Member{
				ID:          user.ID.Hex(),
				DisplayName: user.Username,
			})
		}
		room.Members = updatedMembers
	}

	return rooms, nil
}

func (s *RoomService) GetRoom(roomID string, userID string) (*models.Room, error) {
	ctx := context.Background()
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID")
	}

	var room models.Room
	err = s.collection.FindOne(ctx, bson.M{
		"_id": objID,
		"members": bson.M{
			"$elemMatch": bson.M{
				"id": userID,
			},
		},
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

	if s.wsCtrl != nil {
		go func() {
			if err := s.wsCtrl.NotifyRoomUpdate(roomID, map[string]interface{}{
				"deleted": true,
			}); err != nil {
				fmt.Printf("Failed to notify room members: %v", err)
			}
		}()
	}

	return nil
}

func (s *RoomService) AddMember(roomID string, userID string, memberID string) (*models.Room, error) {
	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID")
	}

	// Check if the user exists
	user, err := s.userSvc.GetUserByID(memberID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	// Check if the requester is a member of the room
	room, err := s.GetRoom(roomID, userID)
	if err != nil {
		return nil, fmt.Errorf("room not found or access denied")
	}

	// Check if user is already a member
	for _, m := range room.Members {
		if m.ID == memberID {
			return nil, fmt.Errorf("user is already a member of the room")
		}
	}

	// Create member with current time as JoinedAt
	member := models.Member{
		ID:          user.ID.Hex(),
		DisplayName: user.Username,
		PhotoURL:    user.PhotoURL,
		JoinedAt:    time.Now(),
	}


	// Prepare the update to add the new member
	update := bson.M{
		"$push": bson.M{
			"members": bson.M{
				"id":          member.ID,
				"displayName": member.DisplayName,
				"photoURL":    member.PhotoURL,
				"joinedAt":    member.JoinedAt,
			},
		},
		"$set": bson.M{
			"updatedAt": time.Now(),
		},
	}

	_, err = s.collection.UpdateByID(context.Background(), objID, update)
	if err != nil {
		return nil, fmt.Errorf("failed to add member: %v", err)
	}

	// Get the updated room to return
	updatedRoom, err := s.GetRoom(roomID, userID)
	if err != nil {
		return nil, err
	}

	// Notify room members about the new member
	if s.wsCtrl != nil {
		go func() {
			if err := s.wsCtrl.NotifyMemberChange(roomID, memberID, "ADDED", map[string]interface{}{
				"id":          member.ID,
				"displayName": member.DisplayName,
				"photoURL":    member.PhotoURL,
				"joinedAt":    member.JoinedAt,
			}); err != nil {
				log.Printf("Failed to notify room members: %v", err)
			}
		}()
	}

	return updatedRoom, nil
}

// RemoveMember removes a member from a room
func (s *RoomService) RemoveMember(roomID string, userID string, memberID string) (*models.Room, error) {
	// Convert string ID to ObjectID
	objID, err := primitive.ObjectIDFromHex(roomID)
	if err != nil {
		return nil, fmt.Errorf("invalid room ID")
	}

	// Get the room first to check permissions and get member details
	room, err := s.GetRoom(roomID, userID)
	if err != nil {
		return nil, fmt.Errorf("room not found or access denied")
	}

	// Only room creator can remove members
	if room.CreatedBy != userID {
		return nil, fmt.Errorf("only room creator can remove members")
	}

	// Check if the member exists in the room and get their details
	var memberInfo *models.Member
	for i, m := range room.Members {
		if m.ID == memberID {
			memberInfo = &room.Members[i]
			break
		}
	}

	if memberInfo == nil {
		return nil, fmt.Errorf("user is not a member of this room")
	}

	// Remove member from the room
	_, err = s.collection.UpdateOne(
		context.Background(),
		bson.M{"_id": objID},
		bson.M{
			"$pull": bson.M{
				"members": bson.M{"id": memberID},
			},
			"$set": bson.M{"updatedAt": time.Now()},
		},
	)
	if err != nil {
		return nil, fmt.Errorf("failed to remove member: %v", err)
	}

	// Get the updated room
	updatedRoom, err := s.GetRoom(roomID, userID)
	if err != nil {
		return nil, err
	}

	// Notify room members about the member removal
	if s.wsCtrl != nil {
		go func() {
			if err := s.wsCtrl.NotifyMemberChange(roomID, memberID, "REMOVED", map[string]interface{}{
				"id":          memberInfo.ID,
				"displayName": memberInfo.DisplayName,
				"photoURL":    memberInfo.PhotoURL,
			}); err != nil {
				log.Printf("Failed to notify room members: %v", err)
			}
		}()
	}

	return updatedRoom, nil
}

// GetRoomMembers returns all members of a room
func (s *RoomService) GetRoomMembers(roomID string, userID string) ([]models.Member, error) {
	room, err := s.GetRoom(roomID, userID)
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
