package main

import (
	"bomberman-dom/gameLobby"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

func setupRoutes(l *gameLobby.Lobby) {
	// Serve static assets
	staticFs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", staticFs))

	// Serve index.html at root
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./static/index.html")
			return
		}
		http.Redirect(w, r, "/", http.StatusFound)
	})

	// WebSocket endpoint for the lobby/game
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		l.WebSocketUpgrade(w, r)
	})

	http.HandleFunc("/status", func(w http.ResponseWriter, r *http.Request) {
		status := map[string]string{
			"status": "free",
		}
		if l.IsFull() {
			status["status"] = "full"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(status)
	})
}

func main() {

	lobby := gameLobby.New()
	setupRoutes(lobby)

	fmt.Println("\033[32mStarting Forum on http://localhost:8080/...\033[0m")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
