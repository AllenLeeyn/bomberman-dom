package gameLobby

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
