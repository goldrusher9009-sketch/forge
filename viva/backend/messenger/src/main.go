package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/viva/messenger/handlers"
	"github.com/viva/messenger/middleware"
	"github.com/viva/messenger/repository"
	"github.com/viva/messenger/websocket"
)

func main() {
	db := repository.ConnectPostgres(os.Getenv("DATABASE_URL"))
	redis := repository.ConnectRedis(os.Getenv("REDIS_URL"))
	hub := websocket.NewHub(redis)
	go hub.Run()

	r := gin.New()
	r.Use(gin.Logger(), gin.Recovery())
	r.Use(middleware.Auth())

	v1 := r.Group("/v1/messenger")
	{
		// Conversations
		v1.GET("/conversations", handlers.ListConversations(db))
		v1.POST("/conversations", handlers.CreateConversation(db))
		v1.GET("/conversations/:id", handlers.GetConversation(db))

		// Messages
		v1.GET("/conversations/:id/messages", handlers.ListMessages(db))
		v1.POST("/conversations/:id/messages", handlers.SendMessage(db, hub))
		v1.DELETE("/messages/:msgId", handlers.DeleteMessage(db))

		// WebSocket
		v1.GET("/ws/:conversationId", handlers.WebSocketHandler(hub))

		// Value Drop
		v1.POST("/referral", handlers.GenerateReferralLink(db))

		// In-chat actions
		v1.POST("/conversations/:id/tip", handlers.TipViva(db))
		v1.POST("/conversations/:id/order", handlers.StartGroupOrder(db))
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("Messenger service running on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}
