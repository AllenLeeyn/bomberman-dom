package gameLobby

import (
	"log"
	"time"
)

func (l *Lobby) timer() {
	var timer *time.Timer

	for action := range l.timerCh {

		if l.state == StateInGame {
			log.Println("Timer is not active in the in_game state")
			continue
		}

		if timer != nil {
			timer.Stop()
			timer = nil
		}

		switch action {
		case resetTimer: // waiting state, 20s
			l.mu.Lock()
			l.state = StateWaiting
			l.mu.Unlock()

			timer = time.AfterFunc(20*time.Second, func() {
				l.mu.Lock()
				defer l.mu.Unlock()

				if l.state == StateWaiting {
					l.state = StateStarting
					l.timerCh <- gameStartTimer
				}
			})
			l.queuePublicMessage(`{"action":"timer","state":"waiting","duration":20}`)

			log.Println("Waiting timer started (20s)")

		case gameStartTimer: // starting state, 10s
			l.mu.Lock()
			l.state = StateStarting
			l.mu.Unlock()

			timer = time.AfterFunc(10*time.Second, func() {
				l.mu.Lock()
				defer l.mu.Unlock()

				if l.state == StateStarting {
					l.state = StateInGame
					//l.startGame()
				}
			})
			l.queuePublicMessage(`{"action":"timer","state":"starting","duration":10}`)

			log.Println("Starting timer started (10s)")

		case stopTimer:
			l.mu.Lock()
			l.state = StateInLobby
			l.mu.Unlock()
			l.queuePublicMessage(`{"action":"timer","state":"stopped"}`)
			log.Println("Timer stopped, back to in_lobby state")
		}
	}
}
