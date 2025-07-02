package main

import (
	"fmt"
	"log"
	"net/http"
)

func main() {
	staticFs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", staticFs))

	// Serve index.html at root
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// If requesting root or any non-static path, serve index.html
		if r.URL.Path == "/" {
			http.ServeFile(w, r, "./static/index.html")
			return
		}
		// Optionally, handle 404 for other paths
		http.NotFound(w, r)
	})

	fmt.Println("\033[32mStarting Forum on http://localhost:8080/...\033[0m")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
