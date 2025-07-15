package shared

type Message struct {
	Action     string `json:"action"`
	PlayerName string `json:"player_name"`
	Content    string `json:"content"`
}
