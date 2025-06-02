package models

import "chat-backend/pkg/types"

// UserServiceWrapper provides a wrapper around user service methods needed for WebSocket
// This helps avoid circular dependencies between packages
type UserServiceWrapper struct {
	// GetUserByIDFunc is a function that retrieves a user by ID
	GetUserByIDFunc func(id string) (*types.User, error)
}

// GetUserByID implements the UserRepository interface
func (w *UserServiceWrapper) GetUserByID(id string) (*types.User, error) {
	return w.GetUserByIDFunc(id)
}

// Ensure UserServiceWrapper implements types.UserRepository
var _ types.UserRepository = (*UserServiceWrapper)(nil)
