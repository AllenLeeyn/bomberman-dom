package gameLobby

import (
	"bomberman-dom/gameManager"
	"errors"
	"log"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func New() *Lobby {
	l := &Lobby{
		colorSet: newColorSet(),
		players:  make(map[string]*player),

		msgQueue:    make(chan Message, 100),
		playerQueue: make(chan action, 10),
		timerCh:     make(chan timerAction, 10),
		endQueue:    make(chan struct{}, 1),
		state:       StateInLobby,
	}
	go l.listener()
	go l.broadcaster()
	go l.timerController()
	return l
}

func (l *Lobby) WebSocketUpgrade(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading connection: ", err)
		return
	}

	playerName := r.URL.Query().Get("name")
	color, err := l.validateJoinRequest(playerName)
	if err != nil {
		sendError(conn, err.Error())
		conn.Close()
		return
	}
	playerID := uuid.NewString()

	pl := gameManager.NewPlayer(playerName, playerID, color, conn)

	l.AddPlayer(pl)
	l.playerQueue <- action{"join", pl}
	log.Printf("Player %s connected with ID %s", pl.PlayerName, pl.PlayerID)
	go l.handleConnection(pl)
}

func (l *Lobby) validateJoinRequest(name string) (string, error) {
	if state := l.GetState(); state != StateInLobby && state != StateWaiting {
		return "", errors.New("lobby is not accepting new players")
	}
	if name == "" {
		return "", errors.New("missing player name")
	}
	if l.HasPlayer(name) {
		return "", errors.New("name already taken")
	}
	if len(l.GetAllPlayerInfos()) >= 4 {
		return "", errors.New("lobby is full")
	}
	color, ok := l.getNextAvailableColor()
	if !ok {
		return "", errors.New("no available colors")
	}
	return color, nil
}

func sendError(conn *websocket.Conn, reason string) {
	message := map[string]string{
		"action": "reject",
		"reason": reason,
	}
	if err := conn.WriteJSON(message); err != nil {
		log.Println("Error sending rejection:", err)
	}
}

func (l *Lobby) queuePublicMessage(content string) {
	l.msgQueue <- Message{
		Action:     "chat",
		PlayerName: "system",
		Content:    content,
	}
}

func (l *Lobby) startGame() {
	l.game = gameManager.NewGame(l.players, l.msgQueue, l.endQueue)
	l.game.Start()

	go func() {
		<-l.endQueue
		l.closeGame()
	}()
}

func (l *Lobby) closeGame() {
	l.state = StateInLobby
	l.setTimerState()
}
