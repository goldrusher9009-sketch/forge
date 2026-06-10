package main

import (
	"log"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/viva/social/handlers"
	"github.com/viva/social/repository"
	"net/http"
)

func main() {
	db := repository.ConnectPostgres(os.Getenv("DATABASE_URL"))
	redis := repository.ConnectRedis(os.Getenv("REDIS_URL"))
	ipfs := repository.NewIPFSClient(os.Getenv("IPFS_URL"))

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Route("/v1/social", func(r chi.Router) {
		// Feed
		r.Get("/feed", handlers.GetFeed(db, redis))
		r.Post("/feed/upload", handlers.UploadPost(db, ipfs))

		// Posts
		r.Get("/posts/{postId}", handlers.GetPost(db))
		r.Delete("/posts/{postId}", handlers.DeletePost(db))
		r.Post("/posts/{postId}/like", handlers.LikePost(db))
		r.Post("/posts/{postId}/share", handlers.SharePost(db))
		r.Post("/posts/{postId}/attention", handlers.ClaimAttentionReward(db))
		r.Post("/posts/{postId}/mint", handlers.MintNFT(db))
		r.Post("/posts/{postId}/ad-slot", handlers.OpenAdSlot(db))

		// AI Studio
		r.Post("/studio/generate", handlers.AIGenerateContent(db))

		// Profile
		r.Get("/profile/{userId}", handlers.GetProfile(db))
		r.Put("/profile", handlers.UpdateProfile(db))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3002"
	}

	log.Printf("Social service running on :%s", port)
	http.ListenAndServe(":"+port, r)
}
