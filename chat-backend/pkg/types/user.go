package types

import "go.mongodb.org/mongo-driver/bson/primitive"

// User represents a user in the system
type User struct {
	ID        primitive.ObjectID `bson:"_id,omitempty"`
	Username  string             `bson:"username" validate:"required,min=3,max=50"`
	Email     string             `bson:"email" validate:"required,email"`
	Password  string             `bson:"password" validate:"required,min=6"`
	PhotoURL  string             `bson:"photoURL,omitempty" json:"photoURL,omitempty"`
	CreatedAt int64              `bson:"createdAt"`
	UpdatedAt int64              `bson:"updatedAt"`
}
