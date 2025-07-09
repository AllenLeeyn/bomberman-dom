package gameLobby

var colorSet = map[string]bool{
	"red":    false,
	"blue":   false,
	"green":  false,
	"yellow": false,
	"purple": false,
	"orange": false,
	"cyan":   false,
	"pink":   false,
}

func getNextAvailableColor() (string, bool) {
	for color, used := range colorSet {
		if !used {
			colorSet[color] = true // Mark it as used
			return color, true
		}
	}
	return "", false // No available colors
}
