package main

import (
	"fmt"
	"log"
	"net/http"
	handler "pastel-clay-dashboard/api"
)

func main() {
	http.HandleFunc("/api/dashboard", handler.Handler)
	port := "8080"
	fmt.Printf("Go Realtime Dashboard Backend running on http://localhost:%s/api/dashboard\n", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
