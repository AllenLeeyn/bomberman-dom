package gameLobby

import (
	"log"
)

// newColorSet() returns a new color set for each lobby
func newColorSet() map[string]bool {
	return map[string]bool{
		"red":    false,
		"blue":   false,
		"green":  false,
		"yellow": false,
	}
}

// getNextAvailableColor() to assign to next player
func (l *Lobby) getNextAvailableColor() (string, bool) {
	l.mu.Lock()
	defer l.mu.Unlock()

	for color, used := range l.colorSet {
		if !used {
			l.colorSet[color] = true
			return color, true
		}
	}
	return "", false
}

// processColorChange() handles color change request
// not yet tested and implemented
func (l *Lobby) processColorChange(msgData *Message) error {
	newColor, _ := l.getNextAvailableColor()

	l.mu.Lock()
	defer l.mu.Unlock()

	if l.state != StateInLobby && l.state != StateWaiting {
		return nil
	}

	p := l.players[msgData.PlayerName]
	oldColor := p.Color
	p.Color = newColor
	l.colorSet[newColor], l.colorSet[oldColor] = true, false
	log.Printf("Player %s changed color to %s", p.PlayerName, newColor)

	l.playerQueue <- action{"colorChange", p}
	return nil
}
