package gameLobby

import (
	"fmt"
	"log"
	"time"
)

// timeController() to handle timerActions
func (l *Lobby) timerController() {
	for action := range l.timerCh {

		if action == gameEndSignal {
			time.Sleep(EndDuration)
			l.state = StateInLobby
		}
		if l.state == StateInGame {
			log.Println("Timer is not active in the in_game state")
			continue
		}
		if l.timer != nil {
			l.timer.Stop()
			l.timer = nil
		}

		switch action {
		case resetTimer:
			l.startWaitingTimer()
		case gameStartTimer:
			l.gameStartTimerHandler()
		case stopTimer:
			l.stopTimerHandler()
		case gameEndSignal:
			l.setTimerState()
		}
	}
}

// setTimerState() checks for number of player and send timerAction to timerController()
// centralized function to determine what action to carry out
func (l *Lobby) setTimerState() {
	if playerCount := l.PlayerCount(); playerCount == 4 {
		if l.state == StateStarting {
			return
		}
		l.timerCh <- gameStartTimer
	} else if playerCount >= 2 {
		if l.state == StateStarting {
			return
		}
		l.timerCh <- resetTimer
	} else if playerCount < 2 {
		l.timerCh <- stopTimer
	}
}

// startWaitingTimer() set lobby.state and send message to clients for waiting timer
func (l *Lobby) startWaitingTimer() {
	l.state = StateWaiting
	l.timer = time.AfterFunc(time.Duration(waitDuration)*time.Second, l.timerCallback)
	l.queuePublicMessage(fmt.Sprintf(`{"action":"timer","state":"waiting","duration":%d}`,
		waitDuration))
	log.Println("Waiting timer started")
}

// gameStartTimerHandler() set lobby.state and send message to clients for game start timer
func (l *Lobby) gameStartTimerHandler() {
	l.state = StateStarting
	l.timer = time.AfterFunc(time.Duration(startDuration)*time.Second, l.timerCallback)
	l.queuePublicMessage(fmt.Sprintf(`{"action":"timer","state":"starting","duration":%d}`,
		startDuration))
	log.Println("Starting timer started")
}

// stopTimerHandler() set lobby.state and send message to clients for stop timer
func (l *Lobby) stopTimerHandler() {
	l.state = StateInLobby
	l.queuePublicMessage(`{"action":"timer","state":"stopped"}`)
	log.Println("Timer stopped, back to in_lobby state")
}

// timerCallback() to check current lobby state and carry out relevant actions
func (l *Lobby) timerCallback() {
	l.mu.Lock()
	defer l.mu.Unlock()

	switch l.state {
	case StateStarting:
		l.state = StateInGame
		l.startGame()

	case StateWaiting:
		l.state = StateStarting
		go func() { l.timerCh <- gameStartTimer }()
	}
}
