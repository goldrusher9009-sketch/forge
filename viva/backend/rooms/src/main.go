package main

import (
	"log"
	"net/http"
	"os"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/viva/rooms/handlers"
	"github.com/viva/rooms/livekit"
	"github.com/viva/rooms/repository"
)

func main() {
	db := repository.ConnectPostgres(os.Getenv("DATABASE_URL"))
	redis := repository.ConnectRedis(os.Getenv("REDIS_URL"))
	lk := livekit.NewClient(
		os.Getenv("LIVEKIT_URL"),
		os.Getenv("LIVEKIT_API_KEY"),
		os.Getenv("LIVEKIT_SECRET"),
	)

	r := chi.NewRouter()
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.RealIP)

	r.Route("/v1/rooms", func(r chi.Router) {
		// Room CRUD
		r.Get("/", handlers.ListRooms(db))
		r.Post("/", handlers.CreateRoom(db, lk))
		r.Get("/{roomId}", handlers.GetRoom(db))
		r.Put("/{roomId}", handlers.UpdateRoom(db))
		r.Delete("/{roomId}", handlers.DeleteRoom(db, lk))

		// Join / Leave
		r.Post("/{roomId}/join", handlers.JoinRoom(db, lk))
		r.Post("/{roomId}/leave", handlers.LeaveRoom(db, lk))

		// LiveKit token (for RN client to connect)
		r.Get("/{roomId}/token", handlers.GetLiveKitToken(db, lk))

		// Speakers / Audience
		r.Post("/{roomId}/raise-hand", handlers.RaiseHand(db))
		r.Post("/{roomId}/speakers/{userId}/promote", handlers.PromoteSpeaker(db, lk))
		r.Post("/{roomId}/speakers/{userId}/demote", handlers.DemoteSpeaker(db, lk))
		r.Post("/{roomId}/speakers/{userId}/mute", handlers.MuteSpeaker(lk))

		// Staking gate
		r.Post("/{roomId}/stake", handlers.StakeToUnlock(db))

		// Chat (in-room text alongside audio)
		r.Get("/{roomId}/messages", handlers.GetRoomMessages(db))
		r.Post("/{roomId}/messages", handlers.SendRoomMessage(db))

		// Reactions (live emoji bursts)
		r.Post("/{roomId}/react", handlers.SendReaction(db))

		// Recordings (creator-initiated)
		r.Post("/{roomId}/record/start", handlers.StartRecording(lk))
		r.Post("/{roomId}/record/stop", handlers.StopRecording(lk))
	})

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "3009"
	}

	log.Printf("Rooms service running on :%s", port)
	http.ListenAndServe(":"+port, r)
}
