package config

import (
    "context"
    "log"
    "os"

    "firebase.google.com/go"
    "firebase.google.com/go/auth"
    "github.com/joho/godotenv"
    "google.golang.org/api/option"
)

func LoadEnv() {
    // Load environment variables from .env file if it exists
    if err := godotenv.Load(); err != nil {
        log.Println("No .env file found, using environment variables")
    }
}

func InitializeFirebase() (*auth.Client, error) {
    ctx := context.Background()
    config := &firebase.Config{
        ProjectID: os.Getenv("FIREBASE_PROJECT_ID"),
    }
    
    opt := option.WithCredentialsFile(os.Getenv("FIREBASE_CREDENTIALS_PATH"))
    app, err := firebase.NewApp(ctx, config, opt)
    if err != nil {
        return nil, err
    }
    
    // Get the Auth client
    authClient, err := app.Auth(ctx)
    if err != nil {
        return nil, err
    }
    
    return authClient, nil
}
