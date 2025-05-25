// internal/middleware/auth.go
package middleware

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
)

// AuthMiddleware verifies JWT token
func AuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Skip WebSocket connections
		if strings.Contains(c.Request.Header.Get("Upgrade"), "websocket") {
			c.Next()
			return
		}

		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		tokenString := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token is required"})
			return
		}

		// Parse and validate token
		token, err := jwt.ParseWithClaims(tokenString, &jwt.RegisteredClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(secret), nil
		})

		if err != nil {
			errMsg := "Invalid token"
			if ve, ok := err.(*jwt.ValidationError); ok {
				switch {
				case ve.Errors&jwt.ValidationErrorMalformed != 0:
					errMsg = "Malformed token"
				case ve.Errors&(jwt.ValidationErrorExpired|jwt.ValidationErrorNotValidYet) != 0:
					errMsg = "Token is either expired or not active yet"
				default:
					errMsg = "Token validation error"
				}
			}
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": errMsg})
			return
		}

		if claims, ok := token.Claims.(*jwt.RegisteredClaims); ok && token.Valid {
			// Additional validation
			now := time.Now()
			if !claims.VerifyExpiresAt(now, false) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token has expired"})
				return
			}

			if !claims.VerifyIssuedAt(now, false) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token used before issued"})
				return
			}

			if !claims.VerifyNotBefore(now, false) {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token not valid yet"})
				return
			}

			// Set user info in context
			c.Set("userID", claims.Subject)
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		}
	}
}
