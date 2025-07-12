package gameLobby

import (
	"fmt"
	"log"
)

func newColorSet() map[string]bool {
	return map[string]bool{
		// "#FF1493": false,
		// "#00BFFF": false,
		// "#FFD700": false,
		// "#32CD32": false,
		// "#FF4500": false,
		// "#8A2BE2": false,
		"red":    false,
		"blue":   false,
		"green":  false,
		"yellow": false,
		"purple": false,
		"orange": false,
		"cyan":   false,
		"pink":   false,
	}
}

func (l *Lobby) getNextAvailableColor() (string, bool) {
	l.mu.Lock()
	defer l.mu.Unlock()

	for color, used := range l.colorSet {
		if !used {
			l.colorSet[color] = true // Mark it as used
			return color, true
		}
	}
	return "", false // No available colors
}

func (l *Lobby) processColorChange(msgData *Message) error {
	newColor := msgData.Content

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.state != StateInLobby {
		return nil
	}
	if taken, exists := l.colorSet[newColor]; !exists {
		return fmt.Errorf("color %s does not exist", newColor)
	} else if taken {
		return fmt.Errorf("color %s is already taken", newColor)
	}

	p := l.players[msgData.PlayerName]
	oldColor := p.Color
	p.Color = newColor
	l.colorSet[newColor], l.colorSet[oldColor] = true, false
	log.Printf("Player %s changed color to %s", p.PlayerName, newColor)

	l.playerQueue <- action{"colorChange", p}
	return nil
}
