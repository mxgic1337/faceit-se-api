package main

import (
	"faceit-se-api/handlers"
	"log"
	"net/http"
)

func main() {
	http.HandleFunc("/stats/{username}", handlers.StatsHandler)
	log.Fatal(http.ListenAndServe(":8080", nil))
}
