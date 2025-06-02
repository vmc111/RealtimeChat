package types

// UserRepository defines the interface for user-related operations
type UserRepository interface {
	// GetUserByID retrieves a user by ID
	GetUserByID(id string) (*User, error)
}
