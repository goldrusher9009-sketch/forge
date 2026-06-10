package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/viva/dating/handlers"
	"github.com/viva/dating/matching"
	"github.com/viva/dating/repository"
)

func main() {
	db := repository.ConnectPostgres(os.Getenv("DATABASE_URL"))
	redis := repository.ConnectRedis(os.Getenv("REDIS_URL"))
	matcher := matching.NewMatcher(db, redis)
	go matcher.RunMatchLoop()

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Route("/v1/dating", func(r chi.Router) {
		// Profile
		r.Get("/profile", handlers.GetMyDatingProfile(db))
		r.Put("/profile", handlers.UpdateDatingProfile(db))
		r.Post("/profile/photos", handlers.UploadPhoto(db))
		r.Delete("/profile/photos/{photoId}", handlers.DeletePhoto(db))

		// Discovery (V-Score gated — Stable+ unlocks distance filters)
		r.Get("/discover", handlers.Discover(db, matcher))
		r.Get("/discover/{userId}", handlers.GetProfileCard(db))

		// Swipe
		r.Post("/swipe/like/{userId}", handlers.Like(db, matcher))
		r.Post("/swipe/pass/{userId}", handlers.Pass(db))
		r.Post("/swipe/superlike/{userId}", handlers.SuperLike(db, matcher))

		// Matches
		r.Get("/matches", handlers.ListMatches(db))
		r.Get("/matches/{matchId}", handlers.GetMatch(db))
		r.Delete("/matches/{matchId}", handlers.UnMatch(db))

		// Conversation starter (AI-generated icebreaker)
		r.Post("/matches/{matchId}/icebreaker", handlers.GenerateIcebreaker(db))

		// Safety
		r.Post("/report/{userId}", handlers.ReportUser(db))
		r.Post("/block/{userId}", handlers.BlockUser(db))

		// Premium (VIVA-staked)
		r.Get("/premium/boost", handlers.GetBoostStatus(db))
		r.Post("/premium/boost", handlers.ActivateBoost(db))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3008"
	}

	log.Printf("Dating service running on :%s", port)
	http.ListenAndServe(":"+port, r)
}
