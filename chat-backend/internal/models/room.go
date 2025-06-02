package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Member struct {
	ID          string    `bson:"id" json:"id"`
	DisplayName string    `bson:"displayName" json:"displayName"`
	PhotoURL    string    `bson:"photoURL,omitempty" json:"photoURL,omitempty"`
	JoinedAt    time.Time `bson:"joinedAt" json:"joinedAt"`
}

type Room struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Name        string             `bson:"name" json:"name"`
	Description string             `bson:"description,omitempty" json:"description,omitempty"`
	IsPrivate   bool               `bson:"isPrivate" json:"isPrivate"`
	CreatedBy   string             `bson:"createdBy" json:"createdBy"`
	Members     []Member           `bson:"members" json:"members"`
	CreatedAt   time.Time          `bson:"createdAt" json:"createdAt"`
	UpdatedAt   time.Time          `bson:"updatedAt" json:"updatedAt"`
}
