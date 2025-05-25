package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
	"time"
)

type Message struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	RoomID    primitive.ObjectID `bson:"roomId" json:"roomId"`
	UserID    string             `bson:"userId" json:"userId"`
	Content   string             `bson:"content" json:"content"`
	CreatedAt time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updatedAt" json:"updatedAt,omitempty"`
}
